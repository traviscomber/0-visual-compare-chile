import crypto from "node:crypto"
import { Client } from "pg"
import { loadProductionEnv } from "./production-env.mjs"

const DATASET_ID = "363edd60-4919-4ff1-b85f-f8e14d61285a"
const API_BASE = "https://datos.gob.cl/api/action"
const REQUEST_TIMEOUT_MS = 8_000
const MAX_RESOURCES_PER_QUERY = 20

const args = parseArgs(process.argv.slice(2))
const query = String(args.query ?? "").trim()
if (!query) {
  console.error("Usage: node scripts/sync-res-company-intelligence.mjs --query \"RAZON SOCIAL SPA\"")
  process.exit(1)
}

const env = loadProductionEnv()
if (!env.hasPostgresUrl) {
  console.error("Missing POSTGRES_URL after loading production env")
  process.exit(1)
}

const client = new Client({ connectionString: normalizePostgresConnectionString(process.env.POSTGRES_URL), ssl: { rejectUnauthorized: false } })
await client.connect()

let runId = null
try {
  const source = await client.query(`select id from intelligence_sources where source_key='registro_empresas' limit 1`)
  const sourceId = source.rows[0]?.id
  if (!sourceId) throw new Error("Missing registro_empresas source")

  const run = await client.query(
    `insert into intelligence_ingestion_runs(source_id,run_type,status,scope) values($1,'on_demand','running',$2::jsonb) returning id`,
    [sourceId, JSON.stringify({ query })],
  )
  runId = run.rows[0]?.id ?? null

  const company = await client.query(
    `select id,canonical_name,normalized_name,rut,external_key from intelligence_entities
     where entity_type='company' and normalized_name=normalize_inapi_search_text($1) order by last_seen_at desc nulls last limit 1`,
    [query],
  )
  const target = company.rows[0]
  if (!target) throw new Error(`Company graph entity not found for: ${query}`)

  const resources = await listDatastoreResources()
  let fetched = 0
  let rejected = 0
  const candidates = []

  for (const resource of resources.slice(0, MAX_RESOURCES_PER_QUERY)) {
    const matches = await searchResource(resource.id, query)
    fetched += matches.length
    for (const record of matches) {
      const parsed = parseCompanyRecord(record)
      if (!parsed.name || !parsed.rut) {
        rejected += 1
        continue
      }
      const score = nameScore(target.normalized_name, normalize(parsed.name))
      candidates.push({ ...parsed, score, resourceId: resource.id, resourceName: resource.name, raw: record })
    }
    if (candidates.some(candidate => candidate.score >= 0.985)) break
    await sleep(120)
  }

  candidates.sort((a, b) => b.score - a.score)
  const best = candidates[0]
  const second = candidates[1]
  const safeMatch = best && best.score >= 0.94 && (!second || best.score - second.score >= 0.03 || best.rut === second.rut)

  if (!safeMatch) {
    await finishRun({ status: candidates.length ? "partial" : "completed", fetched, inserted: 0, updated: 0, rejected, metadata: { candidates: candidates.slice(0, 5).map(publicCandidate), matched: false } })
    console.log(JSON.stringify({ matched: false, query, candidates: candidates.slice(0, 5).map(publicCandidate) }, null, 2))
    process.exit(0)
  }

  const evidenceKey = `${best.resourceId}:${best.rut}`
  const evidencePayload = { rut: best.rut, name: best.name, constitutionDate: best.constitutionDate, resourceId: best.resourceId, resourceName: best.resourceName }
  const contentHash = crypto.createHash("sha256").update(JSON.stringify(evidencePayload)).digest("hex")

  const evidence = await client.query(
    `insert into intelligence_evidence(source_id,source_record_id,evidence_type,title,summary,source_url,occurred_at,content_hash,payload,confidence)
     values($1,$2,'company_record',$3,$4,$5,$6,$7,$8::jsonb,'official')
     on conflict(source_id,source_record_id,evidence_type) do update set title=excluded.title,summary=excluded.summary,source_url=excluded.source_url,occurred_at=excluded.occurred_at,content_hash=excluded.content_hash,payload=excluded.payload,observed_at=now(),updated_at=now()
     returning id`,
    [sourceId, evidenceKey, `Registro de empresa · ${best.name}`, `RUT ${best.rut}${best.constitutionDate ? ` · constitución ${best.constitutionDate}` : ""}`, `https://datos.gob.cl/dataset/${DATASET_ID}/resource/${best.resourceId}`, best.constitutionDate || null, contentHash, JSON.stringify(evidencePayload)],
  )
  const evidenceId = evidence.rows[0]?.id

  await client.query("begin")
  try {
    await client.query(
      `update intelligence_entities set rut=$2,metadata=coalesce(metadata,'{}'::jsonb)||$3::jsonb,updated_at=now() where id=$1`,
      [target.id, best.rut, JSON.stringify({ identity_status: "res_verified", identity_source: "registro_empresas", identity_score: best.score, constitution_date: best.constitutionDate, res_resource_id: best.resourceId })],
    )
    await client.query(
      `insert into intelligence_entity_evidence(entity_id,evidence_id,role) values($1,$2,'identity') on conflict do nothing`,
      [target.id, evidenceId],
    )
    await client.query(
      `update intelligence_relationships set confidence=0.9800,metadata=coalesce(metadata,'{}'::jsonb)||'{"identity_status":"res_verified","basis":"INAPI applicant name + RES RUT verification"}'::jsonb where from_entity_id=$1 and relationship_type in ('owns','applied_for')`,
      [target.id],
    )
    await client.query("commit")
  } catch (error) {
    await client.query("rollback")
    throw error
  }

  await finishRun({ status: "completed", fetched, inserted: 1, updated: 1, rejected, metadata: { matched: true, candidate: publicCandidate(best) } })
  console.log(JSON.stringify({ matched: true, companyEntityId: target.id, candidate: publicCandidate(best) }, null, 2))

  async function finishRun({ status, fetched, inserted, updated, rejected, metadata }) {
    if (!runId) return
    await client.query(
      `update intelligence_ingestion_runs set status=$2,fetched_count=$3,inserted_count=$4,updated_count=$5,rejected_count=$6,metadata=$7::jsonb,finished_at=now() where id=$1`,
      [runId, status, fetched, inserted, updated, rejected, JSON.stringify(metadata ?? {})],
    )
    await client.query(
      `insert into intelligence_source_state(source_id,last_attempt_at,last_success_at,consecutive_failures,circuit_state,last_error,updated_at)
       values($1,now(),case when $2 in ('completed','partial') then now() else null end,0,'closed',null,now())
       on conflict(source_id) do update set last_attempt_at=now(),last_success_at=case when $2 in ('completed','partial') then now() else intelligence_source_state.last_success_at end,consecutive_failures=0,circuit_state='closed',last_error=null,updated_at=now()`,
      [sourceId, status],
    )
  }
} catch (error) {
  if (runId) await client.query(`update intelligence_ingestion_runs set status='failed',error_message=$2,finished_at=now() where id=$1`, [runId, String(error)]).catch(() => undefined)
  console.error(error)
  process.exitCode = 1
} finally {
  await client.end().catch(() => undefined)
}

async function listDatastoreResources() {
  const payload = await fetchJson(`${API_BASE}/package_show?id=${encodeURIComponent(DATASET_ID)}`)
  const resources = Array.isArray(payload?.result?.resources) ? payload.result.resources : []
  return resources
    .filter(resource => resource?.datastore_active && resource?.id)
    .map(resource => ({ id: String(resource.id), name: String(resource.name ?? resource.id) }))
    .reverse()
}

async function searchResource(resourceId, term) {
  const url = `${API_BASE}/datastore_search?resource_id=${encodeURIComponent(resourceId)}&limit=10&q=${encodeURIComponent(term)}`
  const payload = await fetchJson(url)
  return Array.isArray(payload?.result?.records) ? payload.result.records : []
}

async function fetchJson(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "N3uralia-Intelligence/1.0" }, signal: controller.signal })
    if (!response.ok) throw new Error(`Datos.gob responded ${response.status}`)
    const json = await response.json()
    if (json?.success === false) throw new Error("Datos.gob returned success=false")
    return json
  } finally {
    clearTimeout(timer)
  }
}

function parseCompanyRecord(record) {
  const entries = Object.entries(record ?? {})
  const valueFor = patterns => {
    const hit = entries.find(([key]) => patterns.some(pattern => normalizeKey(key).includes(pattern)))
    return hit ? clean(hit[1]) : null
  }
  return {
    rut: normalizeRut(valueFor(["rut", "rolunicotributario"])),
    name: valueFor(["razonsocial", "nombreempresa", "nombre", "sociedad"]),
    constitutionDate: normalizeDate(valueFor(["fechaconstitucion", "constitucion", "fecharegistro", "fecha"])),
  }
}

function publicCandidate(candidate) {
  return { rut: candidate.rut, name: candidate.name, constitutionDate: candidate.constitutionDate, score: Number(candidate.score.toFixed(4)), resourceId: candidate.resourceId, resourceName: candidate.resourceName }
}

function nameScore(a, b) {
  if (!a || !b) return 0
  if (a === b) return 1
  const aTokens = new Set(a.split(" ").filter(token => token.length > 1))
  const bTokens = new Set(b.split(" ").filter(token => token.length > 1))
  const union = new Set([...aTokens, ...bTokens]).size || 1
  const intersection = [...aTokens].filter(token => bTokens.has(token)).length
  const tokenScore = intersection / union
  const containment = a.includes(b) || b.includes(a) ? Math.min(a.length, b.length) / Math.max(a.length, b.length) : 0
  return Math.max(tokenScore, containment)
}

function normalize(value) { return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").replace(/\b(SPA|S A|SA|LTDA|LIMITADA|EIRL|EMPRESA INDIVIDUAL DE RESPONSABILIDAD LIMITADA)\b/g, " ").replace(/\s+/g, " ").trim() }
function normalizeKey(value) { return normalize(value).replace(/\s+/g, "").toLowerCase() }
function clean(value) { const text=String(value ?? "").trim(); return text && text.toLowerCase() !== "null" ? text : null }
function normalizeRut(value) { const text=clean(value); if(!text)return null; const compact=text.toUpperCase().replace(/[^0-9K]/g,""); if(compact.length<2)return null; return `${compact.slice(0,-1)}-${compact.slice(-1)}` }
function normalizeDate(value) { const text=clean(value); if(!text)return null; const match=text.match(/(20\d{2}|19\d{2})[-\/]?(\d{1,2})[-\/]?(\d{1,2})/); if(match)return `${match[1]}-${String(match[2]).padStart(2,"0")}-${String(match[3]).padStart(2,"0")}T00:00:00.000Z`; const date=new Date(text); return Number.isNaN(date.getTime())?null:date.toISOString() }
function normalizePostgresConnectionString(value) { return String(value ?? "").replace(/[?&]sslmode=[^&]*/g, "").replace(/[?&]$/, "") }
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }
function parseArgs(values) { const out={}; for(let i=0;i<values.length;i+=1){const token=values[i]; if(!token.startsWith("--"))continue; const key=token.slice(2); const next=values[i+1]; if(next && !next.startsWith("--")){out[key]=next;i+=1}else out[key]=true} return out }
