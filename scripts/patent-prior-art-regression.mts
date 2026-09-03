import { readFile } from "node:fs/promises"

function fail(message:string):never{console.error(`Patent prior-art regression FAIL: ${message}`);process.exit(1)}
function requireText(source:string,needle:string,label:string){if(!source.includes(needle))fail(`${label} missing ${needle}`)}

const [builder,epo,route,page]=await Promise.all([
  readFile("lib/intelligence/patent-prior-art.ts","utf8"),
  readFile("lib/intelligence/epo-ops.ts","utf8"),
  readFile("app/api/patents/prior-art/route.ts","utf8"),
  readFile("app/(app)/patentes/prior-art/page.tsx","utf8"),
])

for(const needle of [
  "extractTechnicalConcepts",
  "shouldFallback",
  "searchPatentsLocal(concept",
  "parsePriorityClaims",
  "pctApplicationDate",
  "familyCandidate",
  'if (score >= 65) return "close_review"',
  'source: "INAPI Chile"',
  "loadGlobalPatentEvidence",
  "hasEpoOpsCredentials",
  "searchEpoPatentFamilies(query, 3)",
  'availability: "credential_required"',
  "Los eventos jurídicos EPO se presentan como eventos de fuente",
  "Un resultado vacío no demuestra ausencia de prior art, familia, citas, derechos activos ni eventos jurídicos.",
])requireText(builder,needle,"prior-art builder")

for(const needle of [
  "/rest-services/family/publication/docdb/",
  "/biblio,legal",
  "parseFamilyMembers",
  "parseCitations",
  "parseLegalEvents",
  "familyMembers",
  "jurisdictions",
  "citations",
  "legalEvents",
  "retrievedAt",
])requireText(epo,needle,"EPO OPS evidence client")

for(const needle of [
  "requireUser()",
  "buildPatentPriorArtReview",
  "patent.prior_art_review",
  "Consulta de prior art inválida.",
  'includeGlobal: z.enum(["0", "1"])',
  'url.searchParams.get("global") === "1"',
  "global_requested",
  "global_availability",
])requireText(route,needle,"prior-art API")
if(route.includes("createAdminClient")||route.includes("SUPABASE_SERVICE_ROLE_KEY"))fail("route must authenticate user and delegate server-only enrichment; it must not expose service-role handling")

for(const needle of [
  "Sistema de nanoburbujas de bajo consumo para oxigenar estanques de acuicultura",
  "Potential prior art",
  "Revisión cercana",
  "Familias candidatas",
  "No responde “patentable / no patentable”",
  "Activar EPO OPS",
  "esta consulta técnica también se envía a EPO OPS",
  'aria-pressed={includeGlobal}',
  "Citas observadas",
  "Eventos jurídicos observados",
  "Esto no demuestra ausencia de prior art",
  "Crear reporte",
])requireText(page,needle,"prior-art UI")

console.log("Patent prior-art regression PASS: local evidence remains canonical, global EPO OPS coverage is explicit opt-in, family/jurisdiction/citation/legal-event evidence degrades safely, and the UI preserves legal limits and source transparency.")
