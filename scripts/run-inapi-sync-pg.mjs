import { Client } from "pg"
import { loadProductionEnv } from "./production-env.mjs"

const INAPI_BASE = "https://buscadormarcas.inapi.cl/Marca"
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
const PROGRESS_PATCH_EVERY = 25
const UPSERT_BATCH_SIZE = 50
let cachedSession = null
let sessionFetchedAt = 0

const args = parseArgs(process.argv.slice(2))
const queries = resolveQueries(args)

if (!queries.length) {
  console.error("Usage: node scripts/run-inapi-sync-pg.mjs --query VISUAL [--type nombre] [--delayMs 400]")
  console.error("   or: node scripts/run-inapi-sync-pg.mjs --preset phase1-10k [--startIndex 0] [--maxJobs 1] [--delayMs 400]")
  process.exit(1)
}

const envInfo = loadProductionEnv()
if (!envInfo.hasPostgresUrl) {
  console.error("Missing POSTGRES_URL after loading production env")
  process.exit(1)
}

const normalizedPostgresUrl = normalizePostgresConnectionString(process.env.POSTGRES_URL)

const client = new Client({
  connectionString: normalizedPostgresUrl,
  ssl: { rejectUnauthorized: false },
})

const delayMs = Number.isFinite(Number(args.delayMs)) ? Math.max(0, Number(args.delayMs)) : 400
const startIndex = Number.isFinite(Number(args.startIndex)) ? Math.max(0, Number(args.startIndex)) : 0
const maxJobs = Number.isFinite(Number(args.maxJobs)) ? Math.max(1, Number(args.maxJobs)) : null
const slicedQueries = maxJobs ? queries.slice(startIndex, startIndex + maxJobs) : queries.slice(startIndex)

if (!slicedQueries.length) {
  console.error("Resolved batch window is empty. Check --startIndex and --maxJobs.")
  process.exit(1)
}

await client.connect()

try {
  for (let index = 0; index < slicedQueries.length; index += 1) {
    const job = slicedQueries[index]
    const absolutePosition = startIndex + index + 1
    console.log(`[sync-pg] ${absolutePosition}/${queries.length} ${job.searchType}:${job.query}`)
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

  console.log("[sync-pg] completed")
} finally {
  await client.end().catch(() => undefined)
}

async function runJob(job, metadata) {
  const startedAt = new Date().toISOString()
  const runInsert = await client.query(
    `insert into inapi_sync_runs (
      source, status, search_type, query, metadata, started_at
    ) values ($1, $2, $3, $4, $5::jsonb, $6::timestamptz)
    returning id`,
    ["inapi", "running", job.searchType, job.query, JSON.stringify({ cli: true, ...metadata }), startedAt],
  )

  const runId = runInsert.rows[0]?.id
  if (!runId) {
    throw new Error("Failed to create sync run")
  }

  try {
    const marcas = await searchInapi(job)
    let inserted = 0
    let updated = 0

    await client.query(
      `update inapi_sync_runs
       set total_fetched = $2,
           inserted_count = 0,
           updated_count = 0,
           metadata = coalesce(metadata, '{}'::jsonb) || $3::jsonb
       where id = $1::uuid`,
      [
        runId,
        marcas.length,
        JSON.stringify({
          progress: {
            fetched: marcas.length,
            processed: 0,
            inserted: 0,
            updated: 0,
            lastActivityAt: new Date().toISOString(),
          },
        }),
      ],
    )

    for (let index = 0; index < marcas.length; index += UPSERT_BATCH_SIZE) {
      const chunk = marcas.slice(index, index + UPSERT_BATCH_SIZE)
      const summary = await upsertMarcaChunk(chunk)
      inserted += summary.inserted
      updated += summary.updated

      const processed = Math.min(index + chunk.length, marcas.length)
      if (processed % PROGRESS_PATCH_EVERY === 0 || processed === marcas.length) {
        await client.query(
          `update inapi_sync_runs
           set inserted_count = $2,
               updated_count = $3,
               metadata = coalesce(metadata, '{}'::jsonb) || $4::jsonb
           where id = $1::uuid`,
          [
            runId,
            inserted,
            updated,
            JSON.stringify({
              progress: {
                fetched: marcas.length,
                processed,
                inserted,
                updated,
                lastActivityAt: new Date().toISOString(),
              },
            }),
          ],
        )
      }
    }

    await client.query(
      `update inapi_sync_runs
       set status = $2,
           finished_at = $3::timestamptz,
           total_fetched = $4,
           inserted_count = $5,
           updated_count = $6,
           error_message = null
       where id = $1::uuid`,
      [runId, "completed", new Date().toISOString(), marcas.length, inserted, updated],
    )
  } catch (error) {
    await client.query(
      `update inapi_sync_runs
       set status = $2,
           finished_at = $3::timestamptz,
           error_message = $4
       where id = $1::uuid`,
      [runId, "failed", new Date().toISOString(), String(error)],
    )

    throw error
  }
}

async function upsertMarcaChunk(chunk) {
  const payloads = chunk.map((marca) => ({
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
  }))

  await client.query("begin")

  try {
    const upsertResult = await client.query(
      `with input_rows as (
         select *
         from jsonb_to_recordset($1::jsonb) as rows(
           source text,
           source_record_id text,
           nombre text,
           solicitante text,
           numero_registro text,
           numero_solicitud text,
           estado text,
           fecha_presentacion text,
           fecha_registro text,
           fecha_resolucion text,
           pais text,
           source_url text,
           metadata jsonb,
           last_synced_at timestamptz
         )
       )
       insert into trademark_records (
         source, source_record_id, nombre, solicitante, numero_registro, numero_solicitud,
         estado, fecha_presentacion, fecha_registro, fecha_resolucion, pais, source_url,
         metadata, last_synced_at
       )
       select
         source,
         source_record_id,
         nombre,
         solicitante,
         numero_registro,
         numero_solicitud,
         estado,
         nullif(fecha_presentacion, '')::date,
         nullif(fecha_registro, '')::date,
         nullif(fecha_resolucion, '')::date,
         pais,
         source_url,
         coalesce(metadata, '{}'::jsonb),
         last_synced_at
       from input_rows
       on conflict (source, source_record_id) do update set
         nombre = excluded.nombre,
         solicitante = excluded.solicitante,
         numero_registro = excluded.numero_registro,
         numero_solicitud = excluded.numero_solicitud,
         estado = excluded.estado,
         fecha_presentacion = excluded.fecha_presentacion,
         fecha_registro = excluded.fecha_registro,
         fecha_resolucion = excluded.fecha_resolucion,
         pais = excluded.pais,
         source_url = excluded.source_url,
         metadata = excluded.metadata,
         last_synced_at = excluded.last_synced_at
       returning id, source_record_id, (xmax = 0) as inserted`,
      [JSON.stringify(payloads)],
    )

    const recordMap = new Map()
    let inserted = 0
    let updated = 0
    for (const row of upsertResult.rows) {
      recordMap.set(row.source_record_id, row.id)
      if (row.inserted) inserted += 1
      else updated += 1
    }

    const recordIds = Array.from(recordMap.values())
    if (!recordIds.length) {
      throw new Error("Failed to resolve upserted trademark records")
    }

    await client.query(`delete from trademark_record_niza where trademark_record_id = any($1::uuid[])`, [recordIds])
    await client.query(`delete from trademark_record_viena where trademark_record_id = any($1::uuid[])`, [recordIds])

    const nizaRows = []
    const vienaRows = []
    for (const marca of chunk) {
      const recordId = recordMap.get(marca.id)
      if (!recordId) {
        throw new Error(`Missing record id for source_record_id ${marca.id}`)
      }

      for (const code of new Set(marca.niza)) {
        nizaRows.push({ trademark_record_id: recordId, code })
      }

      for (const code of new Set(marca.viena)) {
        vienaRows.push({ trademark_record_id: recordId, code })
      }
    }

    if (nizaRows.length) {
      await client.query(
        `insert into trademark_record_niza (trademark_record_id, code)
         select distinct trademark_record_id::uuid, code
         from jsonb_to_recordset($1::jsonb) as rows(trademark_record_id text, code text)
         on conflict (trademark_record_id, code) do nothing`,
        [JSON.stringify(nizaRows)],
      )
    }

    if (vienaRows.length) {
      await client.query(
        `insert into trademark_record_viena (trademark_record_id, code)
         select distinct trademark_record_id::uuid, code
         from jsonb_to_recordset($1::jsonb) as rows(trademark_record_id text, code text)
         on conflict (trademark_record_id, code) do nothing`,
        [JSON.stringify(vienaRows)],
      )
    }

    await client.query("commit")
    return { inserted, updated }
  } catch (error) {
    await client.query("rollback").catch(() => undefined)
    throw error
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

  const response = await fetch(`${INAPI_BASE}/BuscarMarca.aspx/FindMarcas`, {
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizePostgresConnectionString(value) {
  const raw = String(value ?? "").trim()
  if (!raw) {
    return raw
  }

  try {
    const url = new URL(raw)
    const sslmode = url.searchParams.get("sslmode")
    if (sslmode) {
      url.searchParams.set("sslmode", sslmode)
      url.searchParams.set("uselibpqcompat", "true")
    }
    return url.toString()
  } catch {
    return raw
  }
}
