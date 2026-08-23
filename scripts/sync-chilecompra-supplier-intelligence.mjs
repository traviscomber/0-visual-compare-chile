import crypto from "node:crypto"
import { Client } from "pg"
import { loadProductionEnv } from "./production-env.mjs"

const API_BASE = "https://api.mercadopublico.cl/servicios/v1/publico"
const REQUEST_TIMEOUT_MS = 10_000
const args = parseArgs(process.argv.slice(2))
const rut = normalizeRut(String(args.rut ?? ""))
if (!rut) {
  console.error('Usage: node scripts/sync-chilecompra-supplier-intelligence.mjs --rut "76.123.456-7"')
  process.exit(1)
}

const env = loadProductionEnv()
if (!env.hasPostgresUrl) {
  console.error("Missing POSTGRES_URL after loading production env")
  process.exit(1)
}
const ticket = String(process.env.CHILECOMPRA_TICKET ?? "").trim()
if (!ticket) {
  console.error("Missing CHILECOMPRA_TICKET. Obtain an official Mercado Público API ticket before running this connector.")
  process.exit(2)
}

const client = new Client({ connectionString: normalizePostgresConnectionString(process.env.POSTGRES_URL), ssl: { rejectUnauthorized: false } })
await client.connect()
let runId = null
let sourceId = null

try {
  const source = await client.query(`select id from intelligence_sources where source_key='mercado_publico' limit 1`)
  sourceId = source.rows[0]?.id
  if (!sourceId) throw new Error("Missing mercado_publico source")

  const run = await client.query(
    `insert into intelligence_ingestion_runs(source_id,run_type,status,scope) values($1,'on_demand','running',$2::jsonb) returning id`,
    [sourceId, JSON.stringify({ rut, mode: "recent" })],
  )
  runId = run.rows[0]?.id ?? null

  const supplierResponse = await fetchJson(`${API_BASE}/Empresas/BuscarProveedor?rutempresaproveedor=${encodeURIComponent(formatRutForApi(rut))}&ticket=${encodeURIComponent(ticket)}`)
  const supplier = parseSupplier(supplierResponse)
  if (!supplier?.code) {
    await finishRun("completed", { fetched: 0, inserted: 0, updated: 0, rejected: 0, metadata: { rut, matched: false } })
    console.log(JSON.stringify({ matched: false, rut }, null, 2))
    process.exit(0)
  }

  const company = await client.query(
    `select id,canonical_name from intelligence_entities where entity_type='company' and rut=$1 order by updated_at desc limit 1`,
    [rut],
  )
  const companyEntity = company.rows[0] ?? null

  const supplierEntity = await client.query(
    `insert into intelligence_entities(entity_type,canonical_name,normalized_name,rut,country,external_key,metadata,first_seen_at,last_seen_at)
     values('procurement_supplier',$1,normalize_inapi_search_text($1),$2,'CL',$3,$4::jsonb,now(),now())
     on conflict(external_key) where external_key is not null do update set canonical_name=excluded.canonical_name,normalized_name=excluded.normalized_name,rut=excluded.rut,metadata=excluded.metadata,last_seen_at=now(),updated_at=now()
     returning id`,
    [supplier.name || companyEntity?.canonical_name || rut, rut, `mercadopublico:supplier:${supplier.code}`, JSON.stringify({ supplier_code: supplier.code, source: "mercado_publico" })],
  )
  const supplierEntityId = supplierEntity.rows[0]?.id
  if (!supplierEntityId) throw new Error("Could not create procurement supplier entity")

  if (companyEntity?.id) {
    await client.query(
      `insert into intelligence_relationships(from_entity_id,to_entity_id,relationship_type,confidence,is_derived,metadata)
       values($1,$2,'same_rut',1,false,'{"basis":"RUT verified across RES/company graph and Mercado Público"}'::jsonb)
       on conflict do nothing`,
      [companyEntity.id, supplierEntityId],
    )
  }

  const today = formatApiDate(new Date())
  const [ordersPayload, tendersPayload] = await Promise.all([
    fetchJson(`${API_BASE}/ordenesdecompra.json?fecha=${today}&CodigoProveedor=${encodeURIComponent(String(supplier.code))}&ticket=${encodeURIComponent(ticket)}`),
    fetchJson(`${API_BASE}/licitaciones.json?fecha=${today}&CodigoProveedor=${encodeURIComponent(String(supplier.code))}&ticket=${encodeURIComponent(ticket)}`),
  ])
  const orders = extractListado(ordersPayload)
  const tenders = extractListado(tendersPayload)
  let inserted = 0

  for (const [kind, rows] of [["order", orders], ["tender", tenders]]) {
    for (const row of rows) {
      const externalId = firstText(row, ["Codigo", "Código", "codigo", "Code", "code"]) || crypto.createHash("sha256").update(JSON.stringify(row)).digest("hex").slice(0, 24)
      const title = firstText(row, ["Nombre", "nombre", "Name", "Descripcion", "Descripción"]) || `${kind === "order" ? "Orden de compra" : "Licitación"} ${externalId}`
      const payload = { kind, supplierCode: supplier.code, rut, observedDate: today, row }
      const contentHash = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex")
      const evidence = await client.query(
        `insert into intelligence_evidence(source_id,source_record_id,evidence_type,title,summary,source_url,occurred_at,content_hash,payload,confidence)
         values($1,$2,'procurement_activity',$3,$4,$5,now(),$6,$7::jsonb,'official')
         on conflict(source_id,source_record_id,evidence_type) do update set title=excluded.title,summary=excluded.summary,payload=excluded.payload,content_hash=excluded.content_hash,observed_at=now(),updated_at=now()
         returning id,(xmax=0) as inserted`,
        [sourceId, `${kind}:${externalId}`, title, `Actividad pública de ${supplier.name || rut} en Mercado Público`, kind === "order" ? "https://www.mercadopublico.cl/" : "https://www.mercadopublico.cl/", contentHash, JSON.stringify(payload)],
      )
      const evidenceId = evidence.rows[0]?.id
      if (evidence.rows[0]?.inserted) inserted += 1
      if (evidenceId) await client.query(`insert into intelligence_entity_evidence(entity_id,evidence_id,role) values($1,$2,'supplier') on conflict do nothing`, [supplierEntityId, evidenceId])
    }
  }

  const total = orders.length + tenders.length
  await finishRun("completed", { fetched: total, inserted, updated: Math.max(0, total - inserted), rejected: 0, metadata: { rut, supplierCode: supplier.code, supplierName: supplier.name, date: today, orders: orders.length, tenders: tenders.length, historicalMode: "OCDS bulk recommended" } })
  console.log(JSON.stringify({ matched: true, rut, supplierCode: supplier.code, supplierName: supplier.name, date: today, orders: orders.length, tenders: tenders.length }, null, 2))
} catch (error) {
  if (runId) await client.query(`update intelligence_ingestion_runs set status='failed',error_message=$2,finished_at=now() where id=$1`, [runId, String(error)]).catch(() => undefined)
  if (sourceId) await client.query(
    `insert into intelligence_source_state(source_id,last_attempt_at,consecutive_failures,circuit_state,circuit_open_until,last_error,updated_at)
     values($1,now(),1,'open',now()+interval '15 minutes',$2,now())
     on conflict(source_id) do update set last_attempt_at=now(),consecutive_failures=intelligence_source_state.consecutive_failures+1,circuit_state='open',circuit_open_until=now()+interval '15 minutes',last_error=$2,updated_at=now()`,
    [sourceId, String(error)],
  ).catch(() => undefined)
  console.error(error)
  process.exitCode = 1
} finally {
  await client.end().catch(() => undefined)
}

async function finishRun(status, { fetched, inserted, updated, rejected, metadata }) {
  if (!runId || !sourceId) return
  await client.query(
    `update intelligence_ingestion_runs set status=$2,fetched_count=$3,inserted_count=$4,updated_count=$5,rejected_count=$6,metadata=$7::jsonb,finished_at=now() where id=$1`,
    [runId, status, fetched, inserted, updated, rejected, JSON.stringify(metadata ?? {})],
  )
  await client.query(
    `insert into intelligence_source_state(source_id,last_attempt_at,last_success_at,consecutive_failures,circuit_state,last_error,updated_at)
     values($1,now(),now(),0,'closed',null,now())
     on conflict(source_id) do update set last_attempt_at=now(),last_success_at=now(),consecutive_failures=0,circuit_state='closed',circuit_open_until=null,last_error=null,updated_at=now()`,
    [sourceId],
  )
}

async function fetchJson(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "N3uralia-Intelligence/1.0" }, signal: controller.signal, cache: "no-store" })
    if (!response.ok) throw new Error(`Mercado Público responded ${response.status}`)
    return await response.json()
  } finally { clearTimeout(timer) }
}

function parseSupplier(payload) {
  const rows = extractListado(payload)
  const row = rows[0] ?? payload
  const code = firstText(row, ["CodigoEmpresa", "CódigoEmpresa", "Codigo", "codigo", "Code"])
  const name = firstText(row, ["NombreEmpresa", "Nombre", "nombre", "Name"])
  return code ? { code, name } : null
}
function extractListado(payload) { const list = payload?.Listado ?? payload?.listado ?? payload?.ListadoEmpresas ?? payload?.ListadoProveedores; return Array.isArray(list) ? list : Array.isArray(payload) ? payload : [] }
function firstText(object, keys) { for (const key of keys) { const value=object?.[key]; if(value !== undefined && value !== null && String(value).trim()) return String(value).trim() } return null }
function normalizeRut(value) { const compact=String(value ?? "").toUpperCase().replace(/[^0-9K]/g,""); if(compact.length<2)return null; return `${compact.slice(0,-1)}-${compact.slice(-1)}` }
function formatRutForApi(value) { const [body,dv]=value.split("-"); const reversed=body.split("").reverse(); const grouped=[]; for(let i=0;i<reversed.length;i+=3)grouped.push(reversed.slice(i,i+3).reverse().join("")); return `${grouped.reverse().join(".")}-${dv.toLowerCase()}` }
function formatApiDate(date) { return `${String(date.getDate()).padStart(2,"0")}${String(date.getMonth()+1).padStart(2,"0")}${date.getFullYear()}` }
function normalizePostgresConnectionString(value) { return String(value ?? "").replace(/[?&]sslmode=[^&]*/g, "").replace(/[?&]$/, "") }
function parseArgs(values) { const out={}; for(let i=0;i<values.length;i+=1){const token=values[i]; if(!token.startsWith("--"))continue; const key=token.slice(2); const next=values[i+1]; if(next && !next.startsWith("--")){out[key]=next;i+=1}else out[key]=true} return out }
