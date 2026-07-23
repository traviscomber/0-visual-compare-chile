import { randomUUID } from "node:crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Marca } from "@/types/marca"

const INAPI_BASE = "https://buscadormarcas.inapi.cl/Marca"
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

const SESSION_TTL_MS = readPositiveInt("INAPI_SESSION_TTL_MS", 20 * 60 * 1000)
const MIN_INTERVAL_MS = readPositiveInt("INAPI_MIN_INTERVAL_MS", 4_000)
const JITTER_MS = readPositiveInt("INAPI_JITTER_MS", 2_000)
const REQUEST_TIMEOUT_MS = readPositiveInt("INAPI_REQUEST_TIMEOUT_MS", 15_000)
const QUEUE_WAIT_MS = readPositiveInt("INAPI_QUEUE_WAIT_MS", 25_000)
const MAX_RETRIES = Math.min(readPositiveInt("INAPI_MAX_RETRIES", 1), 1)
const GLOBAL_RATE_CONTROL = process.env.INAPI_GLOBAL_RATE_CONTROL !== "false"

export type InapiSearchType = "nombre" | "solicitante" | "clase" | "clase_niza" | "solicitud" | "registro"
export type InapiMatchMode = "1" | "2" | "3" | "4"

interface InapiSearchOptions {
  query: string
  type?: InapiSearchType
  matchMode?: InapiMatchMode
}

interface InapiMarcaPayload {
  id: string
  cell: string[]
}

interface InapiFindMarcasPayload {
  ErrorMessage?: string
  Hash?: string
  Marcas?: InapiMarcaPayload[]
}

interface ClaimedJob {
  job_id: string
  cache_key: string
  query_normalized: string
  search_type: InapiSearchType
  match_mode: InapiMatchMode
  attempt: number
  request_log_id: number
}

let cachedSession: string | null = null
let sessionFetchedAt = 0
let sessionPromise: Promise<string> | null = null
let requestChain: Promise<void> = Promise.resolve()
let lastRequestAt = 0

export async function searchInapi({
  query,
  type = "nombre",
  matchMode = "2",
}: InapiSearchOptions): Promise<Marca[]> {
  const normalizedQuery = normalizeQuery(query)
  if (!normalizedQuery) return []

  if (!GLOBAL_RATE_CONTROL) {
    return searchInapiDirect({ query: normalizedQuery, type, matchMode })
  }

  return searchInapiManaged({ query: normalizedQuery, type, matchMode })
}

async function searchInapiManaged({ query, type, matchMode }: Required<InapiSearchOptions>): Promise<Marca[]> {
  const admin = createAdminClient()
  const cacheKey = `${normalizeSearchType(type)}:${matchMode}:${query}`

  const { data: enqueueData, error: enqueueError } = await admin.rpc("enqueue_inapi_job", {
    p_cache_key: cacheKey,
    p_query_normalized: query,
    p_search_type: normalizeSearchType(type),
    p_match_mode: matchMode,
    p_priority: 100,
  })

  if (enqueueError) {
    throw new Error(`Could not enqueue INAPI lookup: ${enqueueError.message}`)
  }

  const enqueueResult = Array.isArray(enqueueData) ? enqueueData[0] : null
  if (enqueueResult?.cache_hit) {
    return parseCachedMarcas(enqueueResult.cached_result)
  }

  const requestedJobId = enqueueResult?.job_id as string | undefined
  if (!requestedJobId) {
    throw new Error("INAPI queue did not return a job id")
  }

  const workerId = `vercel:${process.env.VERCEL_REGION ?? "unknown"}:${randomUUID()}`
  const deadline = Date.now() + QUEUE_WAIT_MS

  while (Date.now() < deadline) {
    const cached = await readFreshCache(admin, cacheKey)
    if (cached) return cached

    const { data: claimData, error: claimError } = await admin.rpc("claim_inapi_job", {
      p_worker_id: workerId,
    })

    if (claimError) {
      throw new Error(`Could not claim INAPI job: ${claimError.message}`)
    }

    const claimed = (Array.isArray(claimData) ? claimData[0] : null) as ClaimedJob | null
    if (claimed) {
      try {
        const result = await processClaimedJob(admin, claimed)
        if (claimed.job_id === requestedJobId) return result
      } catch (error) {
        if (claimed.job_id === requestedJobId) throw error
        console.error("[inapi] background claimed job failed", error)
      }
      continue
    }

    const { data: job, error: jobError } = await admin
      .from("inapi_jobs")
      .select("status,last_error")
      .eq("id", requestedJobId)
      .maybeSingle()

    if (jobError) {
      throw new Error(`Could not inspect INAPI job: ${jobError.message}`)
    }

    if (job?.status === "failed" || job?.status === "cancelled") {
      throw new Error(job.last_error || `INAPI job ended with status ${job.status}`)
    }

    await sleep(500)
  }

  const cached = await readFreshCache(admin, cacheKey)
  if (cached) return cached

  throw new Error(`INAPI lookup remained queued for more than ${QUEUE_WAIT_MS}ms`)
}

async function processClaimedJob(admin: ReturnType<typeof createAdminClient>, claimed: ClaimedJob): Promise<Marca[]> {
  const startedAt = Date.now()

  try {
    const result = await searchInapiDirect({
      query: claimed.query_normalized,
      type: claimed.search_type,
      matchMode: claimed.match_mode,
    })
    const durationMs = Date.now() - startedAt
    const ttlSeconds = result.length === 0 ? 21_600 : claimed.match_mode === "1" ? 86_400 : 43_200

    const { error } = await admin.rpc("complete_inapi_job", {
      p_job_id: claimed.job_id,
      p_request_log_id: claimed.request_log_id,
      p_result: result,
      p_status_code: 200,
      p_duration_ms: durationMs,
      p_ttl_seconds: ttlSeconds,
    })

    if (error) {
      throw new Error(`Could not complete INAPI job: ${error.message}`)
    }

    return result
  } catch (error) {
    const durationMs = Date.now() - startedAt
    const statusCode = extractStatusCode(error)
    const message = error instanceof Error ? error.message : String(error)

    const { error: failError } = await admin.rpc("fail_inapi_job", {
      p_job_id: claimed.job_id,
      p_request_log_id: claimed.request_log_id,
      p_status_code: statusCode,
      p_duration_ms: durationMs,
      p_error: message,
    })

    if (failError) {
      console.error("[inapi] could not persist failed job", failError)
    }

    throw error
  }
}

async function readFreshCache(admin: ReturnType<typeof createAdminClient>, cacheKey: string): Promise<Marca[] | null> {
  const { data, error } = await admin
    .from("inapi_query_cache")
    .select("result_json")
    .eq("cache_key", cacheKey)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle()

  if (error) {
    throw new Error(`Could not read INAPI cache: ${error.message}`)
  }

  return data ? parseCachedMarcas(data.result_json) : null
}

async function searchInapiDirect({ query, type, matchMode }: Required<InapiSearchOptions>): Promise<Marca[]> {
  const payload = await enqueueRequest(async () => {
    let attempt = 0

    while (true) {
      const sessionId = await getSession()

      try {
        return await requestInapi({ query, type, matchMode, sessionId })
      } catch (error) {
        invalidateSession()

        if (attempt >= MAX_RETRIES || !isRetryableError(error)) throw error

        attempt += 1
        await sleep(10_000 + Math.floor(Math.random() * 10_001))
      }
    }
  })

  return (payload.Marcas ?? []).map((item) => cellToMarca(item.cell, item.id))
}

async function requestInapi({
  query,
  type,
  matchMode,
  sessionId,
}: {
  query: string
  type: InapiSearchType
  matchMode: InapiMatchMode
  sessionId: string
}): Promise<InapiFindMarcasPayload> {
  const params: Record<string, string> = {
    LastNumSol: "0",
    Hash: "",
    IDW: "",
    responseCaptcha: "",
    param1: type === "solicitud" ? query : "",
    param2: type === "registro" ? query : "",
    param3: type === "nombre" ? query : "",
    param4: type === "solicitante" ? query : "",
    param5: type === "clase" || type === "clase_niza" ? query : "",
    param6: "",
    param7: "",
    param8: "",
    param9: "",
    param10: "",
    param11: "",
    param12: "",
    param13: "",
    param14: "",
    param15: "",
    param16: "",
    param17: matchMode,
  }

  const response = await fetchWithTimeout(`${INAPI_BASE}/BuscarMarca.aspx/FindMarcas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Accept: "application/json, text/javascript, */*",
      "X-Requested-With": "XMLHttpRequest",
      Referer: `${INAPI_BASE}/BuscarMarca.aspx`,
      "User-Agent": USER_AGENT,
      Cookie: `ASP.NET_SessionId=${sessionId}`,
    },
    body: JSON.stringify(params),
    cache: "no-store",
  })

  if (!response.ok) throw new Error(`INAPI responded with HTTP ${response.status}`)

  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("INAPI returned an unexpected non-JSON response")
  }

  const json = await response.json()
  const data = JSON.parse(json.d ?? "{}") as InapiFindMarcasPayload
  if (data.ErrorMessage) throw new Error(data.ErrorMessage)
  return data
}

async function getSession(): Promise<string> {
  const now = Date.now()
  if (cachedSession && now - sessionFetchedAt < SESSION_TTL_MS) return cachedSession
  if (sessionPromise) return sessionPromise

  sessionPromise = fetchSession()
  try {
    return await sessionPromise
  } finally {
    sessionPromise = null
  }
}

async function fetchSession(): Promise<string> {
  const response = await fetchWithTimeout(`${INAPI_BASE}/BuscarMarca.aspx`, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
  })

  if (!response.ok) throw new Error(`Could not obtain INAPI session (status ${response.status})`)

  let sessionId: string | null = null
  if (typeof (response.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === "function") {
    const cookies = (response.headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
    for (const cookie of cookies) {
      const match = cookie.match(/ASP\.NET_SessionId=([^;]+)/)
      if (match) {
        sessionId = match[1]
        break
      }
    }
  }

  if (!sessionId) {
    const match = (response.headers.get("set-cookie") ?? "").match(/ASP\.NET_SessionId=([^;]+)/)
    if (match) sessionId = match[1]
  }

  if (!sessionId) throw new Error(`Could not obtain INAPI session (status ${response.status})`)

  cachedSession = sessionId
  sessionFetchedAt = Date.now()
  return sessionId
}

function invalidateSession() {
  cachedSession = null
  sessionFetchedAt = 0
}

async function enqueueRequest<T>(operation: () => Promise<T>): Promise<T> {
  let release: (() => void) | undefined
  const previous = requestChain
  requestChain = new Promise<void>((resolve) => {
    release = resolve
  })

  await previous
  try {
    const elapsed = Date.now() - lastRequestAt
    const jitter = JITTER_MS > 0 ? Math.floor(Math.random() * (JITTER_MS + 1)) : 0
    const waitMs = Math.max(MIN_INTERVAL_MS + jitter - elapsed, 0)
    if (waitMs > 0) await sleep(waitMs)

    lastRequestAt = Date.now()
    return await operation()
  } finally {
    release?.()
  }
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`INAPI request timed out after ${REQUEST_TIMEOUT_MS}ms`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

function parseCachedMarcas(value: unknown): Marca[] {
  return Array.isArray(value) ? (value as Marca[]) : []
}

function normalizeSearchType(type: InapiSearchType): InapiSearchType {
  return type === "clase_niza" ? "clase" : type
}

function normalizeQuery(value: string) {
  return value
    .trim()
    .toUpperCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
}

function extractStatusCode(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  const match = message.match(/HTTP (\d{3})/)
  return match ? Number(match[1]) : 500
}

function isRetryableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return /HTTP (401|408|429|500|502|503|504)|timed out|session|unexpected non-JSON/i.test(message)
}

function readPositiveInt(name: string, fallback: number) {
  const parsed = Number(process.env[name])
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function cellToMarca(cell: string[], id: string): Marca {
  const niza = (cell[2] ?? "").split(",").map((entry) => entry.trim()).filter(Boolean)
  const estadoOriginal = normalizeText(cell[5] ?? "")
  const estado =
    estadoOriginal === "En Tramite" || estadoOriginal === "Pendiente"
      ? "Pendiente"
      : estadoOriginal === "Registrada"
        ? "Registrada"
        : estadoOriginal === "Tenida por no presentada" ||
            estadoOriginal === "Caducada" ||
            estadoOriginal === "Cancelada" ||
            estadoOriginal === "No Vigente"
          ? "No Vigente"
          : "Denegada"

  return {
    id,
    nombre: normalizeText(cell[3] ?? ""),
    solicitante: normalizeText(cell[4] ?? ""),
    numeroRegistro: normalizeText(cell[1] ?? ""),
    estado,
    fecha: "",
    pais: "CL",
    niza,
    viena: [],
    metadata: {
      source: "inapi",
      numSolicitud: normalizeText(cell[0] ?? ""),
      estadoOriginal,
      tipoMarca: normalizeText(cell[6] ?? ""),
      subtipoMarca: normalizeText(cell[7] ?? ""),
      fileSeq: normalizeText(cell[8] ?? ""),
      fileType: normalizeText(cell[9] ?? ""),
    },
  }
}

function normalizeText(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""

  return repairMojibake(trimmed)
    .replace(/TrÃ¡mite/g, "Tramite")
    .replace(/Ã¡/g, "a")
    .replace(/Ã©/g, "e")
    .replace(/Ã­/g, "i")
    .replace(/Ã³/g, "o")
    .replace(/Ãº/g, "u")
    .replace(/Ã±/g, "n")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

function repairMojibake(value: string) {
  if (!/[ÃÂ]/.test(value)) return value

  try {
    const repaired = Buffer.from(value, "latin1").toString("utf8")
    return repaired.includes("�") ? value : repaired
  } catch {
    return value
  }
}
