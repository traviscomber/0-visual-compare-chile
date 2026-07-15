import { loadProductionEnv } from "./production-env.mjs"

const INAPI_BASE = "https://buscadormarcas.inapi.cl/Marca"
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
const PROGRESS_PATCH_EVERY = 25
const INAPI_FETCH_ATTEMPTS = 4
const POSTGREST_FETCH_ATTEMPTS = 4
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504])
let cachedSession = null
let sessionFetchedAt = 0

const args = parseArgs(process.argv.slice(2))
const queries = resolveQueries(args)

if (!queries.length) {
  console.error("Usage: node scripts/run-inapi-sync-rest.mjs --query VISUAL [--type nombre] [--delayMs 400]")
  console.error("   or: node scripts/run-inapi-sync-rest.mjs --preset phase1-10k [--startIndex 0] [--maxJobs 1] [--delayMs 400]")
  process.exit(1)
}

const envInfo = loadProductionEnv()
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!envInfo.supabaseUrl || !serviceKey || !supabaseUrl) {
  console.error("Missing canonical Supabase env after loading production env")
  process.exit(1)
}

const delayMs = Number.isFinite(Number(args.delayMs)) ? Math.max(0, Number(args.delayMs)) : 400
const startIndex = Number.isFinite(Number(args.startIndex)) ? Math.max(0, Number(args.startIndex)) : 0
const maxJobs = Number.isFinite(Number(args.maxJobs)) ? Math.max(1, Number(args.maxJobs)) : null
const slicedQueries = maxJobs ? queries.slice(startIndex, startIndex + maxJobs) : queries.slice(startIndex)

if (!slicedQueries.length) {
  console.error("Resolved batch window is empty. Check --startIndex and --maxJobs.")
  process.exit(1)
}

for (let index = 0; index < slicedQueries.length; index += 1) {
  const job = slicedQueries[index]
  const absolutePosition = startIndex + index + 1
  console.log(`[sync-rest] ${absolutePosition}/${queries.length} ${job.searchType}:${job.query}`)
  await runJob(job, {
    delayMs,
    position: absolutePosition,
    totalJobs: queries.length,
    preset: args.preset ?? null,
    batchStartIndex: startIndex,
    batchWindowSize: slicedQueries.length,
  })

  if (delayMs > 0 && index < slicedQueries.length - 1) {
    await sleep(delayMs)
  }
}

console.log("[sync-rest] completed")

async function runJob(job, metadata) {
  const startedAt = new Date().toISOString()
  const run = await postgrestInsert("inapi_sync_runs", {
    source: "inapi",
    status: "running",
    search_type: job.searchType,
    query: job.query,
    metadata: { cli: true, ...metadata },
    started_at: startedAt,
  })

  const runId = run?.id
  if (!runId) {
    throw new Error("Failed to create sync run")
  }

  try {
    const marcas = await searchInapi(job)
    let inserted = 0
    let updated = 0

    await postgrestPatch(
      "inapi_sync_runs",
      {
        total_fetched: marcas.length,
        inserted_count: 0,
        updated_count: 0,
        metadata: {
          ...(run.metadata ?? {}),
          progress: {
            fetched: marcas.length,
            processed: 0,
            inserted: 0,
            updated: 0,
            lastActivityAt: new Date().toISOString(),
          },
        },
      },
      { id: `eq.${runId}` },
    )

    for (let index = 0; index < marcas.length; index += 1) {
      const marca = marcas[index]
      const recordPayload = {
        source: "inapi",
        source_record_id: marca.id,
        nombre: marca.nombre,
        solicitante: marca.solicitante,
        numero_registro: marca.numeroRegistro || null,
        numero_solicitud: marca.metadata?.numSolicitud || null,
        estado: marca.estado,
        fecha_presentacion: marca.fecha || null,
        fecha_registro: marca.fecha || null,
        fecha_resolucion: null,
        pais: marca.pais || "CL",
        source_url: "https://buscadormarcas.inapi.cl/Marca/BuscarMarca.aspx",
        metadata: marca.metadata ?? {},
        last_synced_at: new Date().toISOString(),
      }

      const existing = await postgrestSelectSingle(
        "trademark_records",
        {
          select: "id",
          source: `eq.${encodeValue(recordPayload.source)}`,
          source_record_id: `eq.${encodeValue(recordPayload.source_record_id)}`,
        },
      )

      const record = await postgrestUpsert("trademark_records", recordPayload, "source,source_record_id")
      if (!record?.id) {
        throw new Error("Failed to upsert trademark record")
      }

      await postgrestDelete("trademark_record_niza", { trademark_record_id: `eq.${record.id}` })
      await postgrestDelete("trademark_record_viena", { trademark_record_id: `eq.${record.id}` })

      if (marca.niza.length) {
        await postgrestInsertMany(
          "trademark_record_niza",
          marca.niza.map((code) => ({ trademark_record_id: record.id, code })),
        )
      }

      if (marca.viena.length) {
        await postgrestInsertMany(
          "trademark_record_viena",
          marca.viena.map((code) => ({ trademark_record_id: record.id, code })),
        )
      }

      if (existing?.id) updated += 1
      else inserted += 1

      const processed = index + 1
      if (processed % PROGRESS_PATCH_EVERY === 0 || processed === marcas.length) {
        await postgrestPatch(
          "inapi_sync_runs",
          {
            inserted_count: inserted,
            updated_count: updated,
            metadata: {
              ...(run.metadata ?? {}),
              progress: {
                fetched: marcas.length,
                processed,
                inserted,
                updated,
                lastActivityAt: new Date().toISOString(),
              },
            },
          },
          { id: `eq.${runId}` },
        )
      }
    }

    await postgrestPatch("inapi_sync_runs", { status: "completed", finished_at: new Date().toISOString(), total_fetched: marcas.length, inserted_count: inserted, updated_count: updated, error_message: null }, { id: `eq.${runId}` })
  } catch (error) {
    await postgrestPatch(
      "inapi_sync_runs",
      { status: "failed", finished_at: new Date().toISOString(), error_message: String(error) },
      { id: `eq.${runId}` },
    )
    throw error
  }
}

async function postgrestSelectSingle(table, query) {
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`)
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value)
  }
  url.searchParams.set("limit", "1")

  const response = await fetchWithRetry(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: "application/json",
    },
  }, { attempts: POSTGREST_FETCH_ATTEMPTS, label: `select ${table}` })

  if (!response.ok) {
    throw new Error(`Select ${table} failed: ${response.status} ${await response.text()}`)
  }

  const rows = await response.json()
  return Array.isArray(rows) ? (rows[0] ?? null) : null
}

async function postgrestInsert(table, payload) {
  const response = await fetchWithRetry(`${supabaseUrl}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  }, { attempts: POSTGREST_FETCH_ATTEMPTS, label: `insert ${table}` })

  if (!response.ok) {
    throw new Error(`Insert ${table} failed: ${response.status} ${await response.text()}`)
  }

  const rows = await response.json()
  return Array.isArray(rows) ? rows[0] : rows
}

async function postgrestInsertMany(table, payload) {
  const response = await fetchWithRetry(`${supabaseUrl}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  }, { attempts: POSTGREST_FETCH_ATTEMPTS, label: `insert many ${table}` })

  if (!response.ok) {
    throw new Error(`Insert many ${table} failed: ${response.status} ${await response.text()}`)
  }
}

async function postgrestUpsert(table, payload, conflictColumns) {
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`)
  url.searchParams.set("on_conflict", conflictColumns)

  const response = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(payload),
  }, { attempts: POSTGREST_FETCH_ATTEMPTS, label: `upsert ${table}` })

  if (!response.ok) {
    throw new Error(`Upsert ${table} failed: ${response.status} ${await response.text()}`)
  }

  const rows = await response.json()
  return Array.isArray(rows) ? rows[0] : rows
}

async function postgrestPatch(table, payload, filters) {
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`)
  for (const [key, value] of Object.entries(filters)) {
    url.searchParams.set(key, value)
  }

  const response = await fetchWithRetry(url, {
    method: "PATCH",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  }, { attempts: POSTGREST_FETCH_ATTEMPTS, label: `patch ${table}` })

  if (!response.ok) {
    throw new Error(`Patch ${table} failed: ${response.status} ${await response.text()}`)
  }
}

async function postgrestDelete(table, filters) {
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`)
  for (const [key, value] of Object.entries(filters)) {
    url.searchParams.set(key, value)
  }

  const response = await fetchWithRetry(url, {
    method: "DELETE",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: "return=minimal",
    },
  }, { attempts: POSTGREST_FETCH_ATTEMPTS, label: `delete ${table}` })

  if (!response.ok) {
    throw new Error(`Delete ${table} failed: ${response.status} ${await response.text()}`)
  }
}

async function searchInapi(job) {
  const sessionId = await getSession()
  const params = {
    LastNumSol: "0",
    Hash: "",
    IDW: "",
    responseCaptcha: "skip-captcha-for-cli-sync",
    param1: job.searchType === "solicitud" ? job.query : "",
    param2: job.searchType === "registro" ? job.query : "",
    param3: job.searchType === "nombre" ? job.query : "",
    param4: job.searchType === "solicitante" ? job.query : "",
    param5: job.searchType === "clase" ? job.query : "",
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
    param17: args.matchMode || "2",
  }

  const response = await fetchWithRetry(`${INAPI_BASE}/BuscarMarca.aspx/FindMarcas`, {
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
  }, {
    attempts: INAPI_FETCH_ATTEMPTS,
    label: `INAPI search ${job.searchType}:${job.query}`,
    onRetry: resetInapiSession,
  })

  if (!response.ok) {
    throw new Error(`INAPI responded with HTTP ${response.status}`)
  }

  const json = await response.json()
  const payload = JSON.parse(json.d ?? "{}")
  if (payload.ErrorMessage) {
    throw new Error(payload.ErrorMessage)
  }

  return (payload.Marcas ?? []).map((item) => cellToMarca(item.cell, item.id))
}

async function getSession() {
  const now = Date.now()
  if (cachedSession && now - sessionFetchedAt < 25 * 60 * 1000) {
    return cachedSession
  }

  const response = await fetchWithRetry(`${INAPI_BASE}/BuscarMarca.aspx`, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
  }, {
    attempts: INAPI_FETCH_ATTEMPTS,
    label: "INAPI session bootstrap",
    onRetry: resetInapiSession,
  })

  const setCookie = response.headers.get("set-cookie") ?? ""
  const match = setCookie.match(/ASP\.NET_SessionId=([^;]+)/)
  if (!match) {
    throw new Error(`Could not obtain INAPI session (status ${response.status})`)
  }

  cachedSession = match[1]
  sessionFetchedAt = now
  return cachedSession
}

function cellToMarca(cell, id) {
  const niza = String(cell[2] ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)

  const estadoOriginal = normalizeText(String(cell[5] ?? ""))
  const estado =
    estadoOriginal === "En TrÃ¡mite" || estadoOriginal === "Pendiente"
      ? "Pendiente"
      : estadoOriginal === "Registrada"
        ? "Registrada"
        : "Denegada"

  return {
    id,
    nombre: normalizeText(String(cell[3] ?? "")),
    solicitante: normalizeText(String(cell[4] ?? "")),
    numeroRegistro: normalizeText(String(cell[1] ?? "")),
    estado,
    fecha: "",
    pais: "CL",
    niza,
    viena: [],
    metadata: {
      source: "inapi",
      numSolicitud: normalizeText(String(cell[0] ?? "")),
      estadoOriginal,
      tipoMarca: normalizeText(String(cell[6] ?? "")),
      subtipoMarca: normalizeText(String(cell[7] ?? "")),
      fileSeq: normalizeText(String(cell[8] ?? "")),
      fileType: normalizeText(String(cell[9] ?? "")),
    },
  }
}

function encodeValue(value) {
  return String(value).replaceAll(",", "%2C").replaceAll(".", "%2E")
}

function resolveQueries(inputArgs) {
  const type = inputArgs.type || "nombre"
  if (inputArgs.preset === "alphabet") {
    return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((query) => ({ query, searchType: "nombre" }))
  }
  if (inputArgs.preset === "niza-core") {
    return Array.from({ length: 45 }, (_, index) => ({
      query: String(index + 1).padStart(2, "0"),
      searchType: "clase",
    }))
  }
  if (inputArgs.preset === "top-brands") {
    return ["VISUAL", "COMPARE", "LOGO", "MARCA", "BRAND"].map((query) => ({ query, searchType: "nombre" }))
  }
  if (inputArgs.preset === "phase1-10k") {
    const nameSeeds = [
      "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
      "AL", "AR", "BIO", "CASA", "CHILE", "CLUB", "DATA", "ECO", "EL", "FARMA", "GO", "LAB", "LA", "MAX", "MI", "MUNDO", "NET", "NOVA",
      "PLUS", "PRO", "PUNTO", "RED", "SAN", "SMART", "SOL", "SUR", "TEC", "TU", "VITA",
    ]
    const applicantSeeds = ["SPA", "S.A.", "LTDA", "LIMITADA", "INVERSIONES", "COMERCIAL", "SERVICIOS", "HOLDING", "TECNOLOGIA", "INDUSTRIAL"]
    const jobs = [
      ...Array.from({ length: 45 }, (_, index) => ({
        query: String(index + 1).padStart(2, "0"),
        searchType: "clase",
      })),
      ...nameSeeds.map((query) => ({ query, searchType: "nombre" })),
      ...applicantSeeds.map((query) => ({ query, searchType: "solicitante" })),
    ]
    const seen = new Set()
    return jobs.filter((job) => {
      const key = `${job.searchType}:${job.query}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
  if (inputArgs.queries) {
    return inputArgs.queries
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((query) => ({ query, searchType: type }))
  }
  if (inputArgs.query) {
    return [{ query: inputArgs.query.trim(), searchType: type }]
  }
  return []
}

function parseArgs(argv) {
  const result = {}
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]
    if (!current.startsWith("--")) continue
    const key = current.slice(2)
    const next = argv[index + 1]
    result[key] = next && !next.startsWith("--") ? next : "true"
    if (next && !next.startsWith("--")) {
      index += 1
    }
  }
  return result
}

function normalizeText(value) {
  return value
    .replace(/ÃƒÂ¡/g, "Ã¡")
    .replace(/ÃƒÂ©/g, "Ã©")
    .replace(/ÃƒÂ­/g, "Ã­")
    .replace(/ÃƒÂ³/g, "Ã³")
    .replace(/ÃƒÂº/g, "Ãº")
    .replace(/ÃƒÂ±/g, "Ã±")
    .replace(/TrÃƒÂ¡mite/g, "TrÃ¡mite")
    .trim()
}

async function fetchWithRetry(url, options, config = {}) {
  const attempts = Math.max(1, Number(config.attempts) || 1)
  const label = config.label || String(url)

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, options)
      if (!shouldRetryResponse(response) || attempt === attempts) {
        return response
      }

      await config.onRetry?.(attempt, null, response)
      const detail = await safeReadResponseText(response)
      console.warn(
        `[retry] ${label} attempt ${attempt}/${attempts} returned ${response.status}${detail ? ` ${detail}` : ""}`,
      )
    } catch (error) {
      if (!isRetryableFetchError(error) || attempt === attempts) {
        throw error
      }

      await config.onRetry?.(attempt, error, null)
      console.warn(`[retry] ${label} attempt ${attempt}/${attempts} failed: ${formatError(error)}`)
    }

    await sleep(getRetryDelayMs(attempt))
  }

  throw new Error(`Exhausted retries for ${label}`)
}

function shouldRetryResponse(response) {
  return RETRYABLE_STATUS_CODES.has(response.status)
}

function isRetryableFetchError(error) {
  const codes = new Set([
    "UND_ERR_CONNECT_TIMEOUT",
    "UND_ERR_HEADERS_TIMEOUT",
    "ECONNRESET",
    "ECONNREFUSED",
    "ETIMEDOUT",
    "EAI_AGAIN",
  ])
  const causeCode = error?.cause?.code
  if (causeCode && codes.has(causeCode)) {
    return true
  }

  const message = String(error?.message ?? error)
  return message.includes("fetch failed")
}

function getRetryDelayMs(attempt) {
  return Math.min(10000, 1500 * attempt)
}

async function safeReadResponseText(response) {
  try {
    const text = await response.clone().text()
    return text.replace(/\s+/g, " ").trim().slice(0, 160)
  } catch {
    return ""
  }
}

function formatError(error) {
  const message = String(error?.message ?? error)
  const causeCode = error?.cause?.code
  return causeCode ? `${message} (${causeCode})` : message
}

function resetInapiSession() {
  cachedSession = null
  sessionFetchedAt = 0
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
