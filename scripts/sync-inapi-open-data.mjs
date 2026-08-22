import { Client } from "pg"
import { loadProductionEnv } from "./production-env.mjs"

const CKAN_BASE = process.env.INAPI_OPEN_DATA_CKAN_BASE || "https://datos.gob.cl/api/3/action"
const DATASETS = ["solicitudes-de-marcas", "registros-de-marcas"]
const PAGE_SIZE = Math.min(Math.max(Number(process.env.INAPI_OPEN_DATA_PAGE_SIZE || 1000), 100), 5000)
const MAX_ROWS = Number(process.env.INAPI_OPEN_DATA_MAX_ROWS || 0)

const envInfo = loadProductionEnv()
if (!envInfo.hasPostgresUrl) {
  console.error("Missing POSTGRES_URL after loading production env")
  process.exit(1)
}

const client = new Client({
  connectionString: normalizePostgresConnectionString(process.env.POSTGRES_URL),
  ssl: { rejectUnauthorized: false },
})

await client.connect()
try {
  for (const dataset of DATASETS) {
    await syncDataset(dataset)
  }
} finally {
  await client.end().catch(() => undefined)
}

async function syncDataset(dataset) {
  const startedAt = new Date().toISOString()
  const run = await client.query(
    `insert into inapi_sync_runs (source,status,search_type,query,metadata,started_at)
     values ('inapi-open-data','running','open_data',$1,$2::jsonb,$3::timestamptz)
     returning id`,
    [dataset, JSON.stringify({ dataset, ckanBase: CKAN_BASE, pageSize: PAGE_SIZE }), startedAt],
  )
  const runId = run.rows[0]?.id
  if (!runId) throw new Error(`Could not create sync run for ${dataset}`)

  try {
    const pkg = await ckan("package_show", { id: dataset })
    const resource = chooseResource(pkg.resources || [])
    if (!resource) throw new Error(`No usable DataStore resource found for ${dataset}`)

    let offset = 0
    let processed = 0
    let inserted = 0
    let updated = 0
    let total = null

    while (true) {
      const page = await ckan("datastore_search", {
        resource_id: resource.id,
        limit: PAGE_SIZE,
        offset,
      })
      if (total == null) total = Number(page.total || 0)
      const rows = Array.isArray(page.records) ? page.records : []
      if (!rows.length) break

      const normalized = rows.map((row) => normalizeOpenDataRow(row, dataset)).filter(Boolean)
      if (normalized.length) {
        const summary = await upsertRows(normalized)
        inserted += summary.inserted
        updated += summary.updated
        processed += normalized.length
      }

      offset += rows.length
      await client.query(
        `update inapi_sync_runs
         set total_fetched=$2, inserted_count=$3, updated_count=$4,
             metadata=coalesce(metadata,'{}'::jsonb) || $5::jsonb
         where id=$1::uuid`,
        [runId, total, inserted, updated, JSON.stringify({
          dataset,
          resourceId: resource.id,
          resourceName: resource.name || null,
          progress: { offset, processed, total, lastActivityAt: new Date().toISOString() },
        })],
      )

      if (MAX_ROWS > 0 && processed >= MAX_ROWS) break
      if (rows.length < PAGE_SIZE || offset >= total) break
    }

    await client.query(
      `update inapi_sync_runs
       set status='completed', finished_at=now(), total_fetched=$2,
           inserted_count=$3, updated_count=$4, error_message=null
       where id=$1::uuid`,
      [runId, total ?? processed, inserted, updated],
    )

    console.log(`[open-data] ${dataset}: processed=${processed} inserted=${inserted} updated=${updated}`)
  } catch (error) {
    await client.query(
      `update inapi_sync_runs
       set status='failed', finished_at=now(), error_message=$2
       where id=$1::uuid`,
      [runId, error instanceof Error ? error.message : String(error)],
    )
    throw error
  }
}

async function ckan(action, params) {
  const url = new URL(`${CKAN_BASE}/${action}`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value))
  const response = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "VisualCompare-INAPI-OpenData/1.0" } })
  if (!response.ok) throw new Error(`CKAN ${action} HTTP ${response.status}`)
  const payload = await response.json()
  if (!payload?.success) throw new Error(`CKAN ${action} returned success=false`)
  return payload.result
}

function chooseResource(resources) {
  return resources.find((r) => r?.datastore_active && r?.id)
    || resources.find((r) => r?.id && String(r?.format || "").toLowerCase() === "xlsx" && r?.datastore_active)
    || null
}

function normalizeOpenDataRow(raw, dataset) {
  const row = normalizeKeys(raw)
  const solicitud = pick(row, ["n_solicitud","nro_solicitud","numero_solicitud","solicitud","num_solicitud"])
  const registro = pick(row, ["n_registro","nro_registro","numero_registro","registro","num_registro"])
  const nombre = pick(row, ["signo_o_denominacion","denominacion","nombre_marca","marca","nombre","signo"])
  if (!nombre || (!solicitud && !registro)) return null

  const sourceRecordId = solicitud ? `sol:${solicitud}` : `reg:${registro}`
  const niza = parseCodes(pick(row, ["clase_s","clases","clase","niza","clase_niza"]))
  const estado = normalizeStatus(pick(row, ["estado_tramite","estado","situacion"]))
  const fechaPresentacion = normalizeDate(pick(row, ["fecha_presentacion","f_presentacion","fecha_solicitud"]))
  const fechaRegistro = normalizeDate(pick(row, ["fecha_registro","f_registro","fecha_concesion"]))

  return {
    source: "inapi",
    source_record_id: sourceRecordId,
    nombre: String(nombre).trim(),
    solicitante: nullIfEmpty(pick(row, ["titular_es","titulares","titular","solicitante_s","solicitante"])),
    numero_registro: nullIfEmpty(registro),
    numero_solicitud: nullIfEmpty(solicitud),
    estado,
    fecha_presentacion: fechaPresentacion,
    fecha_registro: fechaRegistro,
    fecha_resolucion: null,
    pais: nullIfEmpty(pick(row, ["pais_titular","pais","pais_solicitante"])) || "CL",
    source_url: "https://datos.gob.cl/dataset/" + dataset,
    metadata: { openData: true, dataset, raw },
    last_synced_at: new Date().toISOString(),
    niza,
  }
}

async function upsertRows(rows) {
  await client.query("begin")
  try {
    const result = await client.query(
      `with input_rows as (
         select * from jsonb_to_recordset($1::jsonb) as x(
           source text, source_record_id text, nombre text, solicitante text,
           numero_registro text, numero_solicitud text, estado text,
           fecha_presentacion date, fecha_registro date, fecha_resolucion date,
           pais text, source_url text, metadata jsonb, last_synced_at timestamptz, niza jsonb
         )
       ), upserted as (
         insert into trademark_records (
           source,source_record_id,nombre,solicitante,numero_registro,numero_solicitud,
           estado,fecha_presentacion,fecha_registro,fecha_resolucion,pais,source_url,metadata,last_synced_at
         )
         select source,source_record_id,nombre,solicitante,numero_registro,numero_solicitud,
                estado,fecha_presentacion,fecha_registro,fecha_resolucion,pais,source_url,metadata,last_synced_at
         from input_rows
         on conflict (source,source_record_id) do update set
           nombre=excluded.nombre, solicitante=excluded.solicitante,
           numero_registro=coalesce(excluded.numero_registro,trademark_records.numero_registro),
           numero_solicitud=coalesce(excluded.numero_solicitud,trademark_records.numero_solicitud),
           estado=coalesce(excluded.estado,trademark_records.estado),
           fecha_presentacion=coalesce(excluded.fecha_presentacion,trademark_records.fecha_presentacion),
           fecha_registro=coalesce(excluded.fecha_registro,trademark_records.fecha_registro),
           pais=coalesce(excluded.pais,trademark_records.pais), source_url=excluded.source_url,
           metadata=coalesce(trademark_records.metadata,'{}'::jsonb) || excluded.metadata,
           last_synced_at=excluded.last_synced_at, updated_at=now()
         returning id,source_record_id,(xmax=0) inserted
       ) select id,source_record_id,inserted from upserted`,
      [JSON.stringify(rows)],
    )

    const idBySource = new Map(result.rows.map((r) => [r.source_record_id, r.id]))
    const codes = []
    for (const row of rows) {
      const recordId = idBySource.get(row.source_record_id)
      if (!recordId) continue
      for (const code of row.niza || []) codes.push({ trademark_record_id: recordId, code })
    }
    if (codes.length) {
      await client.query(
        `insert into trademark_record_niza (trademark_record_id,code)
         select x.trademark_record_id::uuid,x.code
         from jsonb_to_recordset($1::jsonb) as x(trademark_record_id text,code text)
         on conflict do nothing`,
        [JSON.stringify(codes)],
      )
    }

    await client.query("commit")
    return {
      inserted: result.rows.filter((r) => r.inserted).length,
      updated: result.rows.filter((r) => !r.inserted).length,
    }
  } catch (error) {
    await client.query("rollback")
    throw error
  }
}

function normalizeKeys(raw) {
  const out = {}
  for (const [key, value] of Object.entries(raw || {})) {
    const normalized = String(key).trim().toLowerCase().normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
    out[normalized] = value
  }
  return out
}

function pick(row, keys) {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && String(value).trim() !== "") return value
  }
  return null
}

function parseCodes(value) {
  if (value == null) return []
  return [...new Set(String(value).match(/\b(?:[1-9]|[1-3][0-9]|4[0-5])\b/g) || [])]
}

function normalizeStatus(value) {
  const s = String(value || "").trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
  if (!s) return null
  if (s.includes("registr") || s.includes("conced")) return "Registrada"
  if (s.includes("tramite") || s.includes("pend") || s.includes("solicit")) return "Pendiente"
  if (s.includes("deneg") || s.includes("rechaz") || s.includes("abandon")) return "Denegada"
  if (s.includes("caduc") || s.includes("cancel") || s.includes("venc") || s.includes("no vigente") || s.includes("desist")) return "No Vigente"
  return String(value).trim()
}

function normalizeDate(value) {
  if (value == null || String(value).trim() === "") return null
  const raw = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)
  const match = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)
  if (match) return `${match[3]}-${match[2].padStart(2,"0")}-${match[1].padStart(2,"0")}`
  return null
}

function nullIfEmpty(value) {
  if (value == null) return null
  const text = String(value).trim()
  return text || null
}

function normalizePostgresConnectionString(value) {
  if (!value) return value
  try {
    const url = new URL(value)
    url.searchParams.delete("sslmode")
    return url.toString()
  } catch {
    return value
  }
}
