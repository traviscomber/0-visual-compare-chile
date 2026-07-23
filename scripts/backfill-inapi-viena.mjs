import { createClient } from "@supabase/supabase-js"

const args = parseArgs(process.argv.slice(2))
const limit = Number.isFinite(Number(args.limit)) ? Math.max(1, Number(args.limit)) : 25
const offset = Number.isFinite(Number(args.offset)) ? Math.max(0, Number(args.offset)) : 0
const delayMs = Number.isFinite(Number(args.delayMs)) ? Math.max(0, Number(args.delayMs)) : 2500
const probeSize = Number.isFinite(Number(args.probeSize)) ? Math.max(limit, Number(args.probeSize)) : Math.max(limit * 3, 75)
const write = args.write === "true" || args.write === true

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const INAPI_BASE = "https://buscadormarcas.inapi.cl/Marca"
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
const VIENA_CODE_PATTERN = /\b\d{2}\.\d{2}\.\d{2}\b/g

const payload = await loadCandidateRecords({ offset, probeSize })
const candidates = payload.filter((row) => (row.trademark_record_viena ?? []).length === 0).slice(0, limit)

if (!candidates.length) {
  console.log("[viena] no candidate records found in the selected window")
  process.exit(0)
}

console.log(`[viena] mode=${write ? "write" : "dry-run"} candidates=${candidates.length} delayMs=${delayMs}`)

let updated = 0
let rateLimited = false

for (let index = 0; index < candidates.length; index += 1) {
  const record = candidates[index]
  const numSolicitud = typeof record.metadata?.numSolicitud === "string" ? record.metadata.numSolicitud.trim() : ""
  const fileSeq = typeof record.metadata?.fileSeq === "string" ? record.metadata.fileSeq.trim() : ""
  const fileType = typeof record.metadata?.fileType === "string" ? record.metadata.fileType.trim() : "1"
  const numeroSerie = typeof record.numero_registro === "string" ? record.numero_registro.trim() : ""

  console.log(`[viena] ${index + 1}/${candidates.length} ${record.nombre} solicitud=${numSolicitud || "-"} registro=${numeroSerie || "-"}`)

  if (!numSolicitud) {
    console.log("[viena] skip: missing numSolicitud")
    continue
  }

  try {
    const detail = await fetchInapiTrademarkDetail({ numSolicitud, numeroSerie, fileSeq, fileType })
    const vienaCodes = extractVienaCodes(detail)
    console.log(`[viena] detail codes=${vienaCodes.length ? vienaCodes.join(", ") : "-"}`)

    if (write && vienaCodes.length) {
      await supabase.from("trademark_record_viena").delete().eq("trademark_record_id", record.id)
      const { error } = await supabase.from("trademark_record_viena").insert(
        vienaCodes.map((code) => ({
          trademark_record_id: record.id,
          code,
        })),
      )

      if (error) {
        throw new Error(`Failed to insert Viena codes: ${error.message}`)
      }

      updated += 1
    }
  } catch (error) {
    const message = String(error)
    console.log(`[viena] error: ${message}`)
    if (isRateLimitError(message)) {
      rateLimited = true
      console.log("[viena] stopping after INAPI rate limit response")
      break
    }
  }

  if (delayMs > 0 && index < candidates.length - 1) {
    await sleep(delayMs)
  }
}

console.log(`[viena] done updated=${updated} rateLimited=${rateLimited}`)

async function loadCandidateRecords({ offset: start, probeSize: size }) {
  const { data, error } = await supabase
    .from("trademark_records")
    .select("id, nombre, numero_registro, metadata, trademark_record_viena(code)")
    .eq("source", "inapi")
    .order("updated_at", { ascending: false })
    .range(start, start + size - 1)

  if (error) {
    throw new Error(`Failed to load candidate records: ${error.message}`)
  }

  return data ?? []
}

async function fetchInapiTrademarkDetail({ numSolicitud, numeroSerie, fileSeq, fileType }) {
  const sessionId = await getSession()
  const response = await fetch(`${INAPI_BASE}/BuscarMarca.aspx/FindMarcaByNumeroSolicitud`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Accept: "application/json, text/javascript, */*",
      "X-Requested-With": "XMLHttpRequest",
      Referer: `${INAPI_BASE}/BuscarMarca.aspx`,
      "User-Agent": USER_AGENT,
      Cookie: `ASP.NET_SessionId=${sessionId}`,
    },
    body: JSON.stringify({
      numeroSolicitud: numSolicitud,
      numeroSerie: numeroSerie || "",
      FileSeq: fileSeq || "",
      FileType: fileType || "1",
      Hash: "",
      IDW: "",
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`INAPI detail responded with HTTP ${response.status}`)
  }

  const json = await response.json()
  const payload = JSON.parse(json.d ?? "{}")

  if (payload.ErrorMessage) {
    throw new Error(String(payload.ErrorMessage))
  }

  return payload
}

function extractVienaCodes(detail) {
  const found = new Set()
  visitValue(detail, found)
  return [...found].sort()
}

function visitValue(value, found) {
  if (typeof value === "string") {
    const matches = value.match(VIENA_CODE_PATTERN)
    if (matches) {
      for (const match of matches) {
        found.add(match)
      }
    }
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      visitValue(item, found)
    }
    return
  }

  if (value && typeof value === "object") {
    for (const nested of Object.values(value)) {
      visitValue(nested, found)
    }
  }
}

let cachedSession = null
let sessionFetchedAt = 0

async function getSession() {
  const now = Date.now()
  if (cachedSession && now - sessionFetchedAt < 25 * 60 * 1000) {
    return cachedSession
  }

  const response = await fetch(`${INAPI_BASE}/BuscarMarca.aspx`, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
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

function isRateLimitError(message) {
  const normalized = message.toLowerCase()
  return normalized.includes("excedido el limite") || normalized.includes("limite de consultas disponibles")
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseArgs(input) {
  const parsed = {}

  for (let index = 0; index < input.length; index += 1) {
    const token = input[index]
    if (!token.startsWith("--")) continue

    const key = token.slice(2)
    const next = input[index + 1]
    if (!next || next.startsWith("--")) {
      parsed[key] = true
      continue
    }

    parsed[key] = next
    index += 1
  }

  return parsed
}
