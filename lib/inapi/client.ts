import type { Marca } from "@/types/marca"

const INAPI_BASE = "https://buscadormarcas.inapi.cl/Marca"
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

const SESSION_TTL_MS = readPositiveInt("INAPI_SESSION_TTL_MS", 20 * 60 * 1000)
const MIN_INTERVAL_MS = readPositiveInt("INAPI_MIN_INTERVAL_MS", 4_000)
const JITTER_MS = readPositiveInt("INAPI_JITTER_MS", 2_000)
const REQUEST_TIMEOUT_MS = readPositiveInt("INAPI_REQUEST_TIMEOUT_MS", 15_000)
const MAX_RETRIES = Math.min(readPositiveInt("INAPI_MAX_RETRIES", 1), 1)

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
  const trimmedQuery = query.trim()
  if (!trimmedQuery) return []

  const payload = await enqueueRequest(async () => {
    let attempt = 0

    while (true) {
      const sessionId = await getSession()

      try {
        return await requestInapi({
          query: trimmedQuery,
          type,
          matchMode,
          sessionId,
        })
      } catch (error) {
        invalidateSession()

        if (attempt >= MAX_RETRIES || !isRetryableError(error)) {
          throw error
        }

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

  if (!response.ok) {
    throw new Error(`INAPI responded with HTTP ${response.status}`)
  }

  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("INAPI returned an unexpected non-JSON response")
  }

  const json = await response.json()
  const data = JSON.parse(json.d ?? "{}") as InapiFindMarcasPayload

  if (data.ErrorMessage) {
    throw new Error(data.ErrorMessage)
  }

  return data
}

async function getSession(): Promise<string> {
  const now = Date.now()
  if (cachedSession && now - sessionFetchedAt < SESSION_TTL_MS) {
    return cachedSession
  }

  if (sessionPromise) {
    return sessionPromise
  }

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

  if (!response.ok) {
    throw new Error(`Could not obtain INAPI session (status ${response.status})`)
  }

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
    const setCookie = response.headers.get("set-cookie") ?? ""
    const match = setCookie.match(/ASP\.NET_SessionId=([^;]+)/)
    if (match) {
      sessionId = match[1]
    }
  }

  if (!sessionId) {
    throw new Error(`Could not obtain INAPI session (status ${response.status})`)
  }

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
    if (waitMs > 0) {
      await sleep(waitMs)
    }

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
  const niza = (cell[2] ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)

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

  const repaired = repairMojibake(trimmed)
  return repaired
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
  if (!/[ÃÂ]/.test(value)) {
    return value
  }

  try {
    const repaired = Buffer.from(value, "latin1").toString("utf8")
    return repaired.includes("�") ? value : repaired
  } catch {
    return value
  }
}
