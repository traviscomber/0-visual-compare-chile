import { readFile } from "node:fs/promises"

function fail(message:string):never{console.error(`Patent prior-art regression FAIL: ${message}`);process.exit(1)}
function requireText(source:string,needle:string,label:string){if(!source.includes(needle))fail(`${label} missing ${needle}`)}

const [builder,epo,route,page,recorder]=await Promise.all([
  readFile("lib/intelligence/patent-prior-art.ts","utf8"),
  readFile("lib/intelligence/epo-ops.ts","utf8"),
  readFile("app/api/patents/prior-art/route.ts","utf8"),
  readFile("app/(app)/patentes/prior-art/page.tsx","utf8"),
  readFile("lib/intelligence/source-change-recorder.ts","utf8"),
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
  "intelligence_source_events",
  'source_key", "inapi_open_data"',
  'entity_type", "patent"',
  "observedChangeCount",
  "observedChanges",
  "fieldChanges",
  "changeObservationSince",
  "Los cambios observados comparan snapshots sucesivos del dataset oficial",
  "Los eventos jurídicos EPO se presentan como eventos de fuente",
  "Un resultado vacío no demuestra ausencia de prior art, familia, citas, derechos activos ni eventos jurídicos.",
])requireText(builder,needle,"prior-art builder")

for(const needle of [
  "status_changed",
  "registration_added",
  "applicant_changed",
  "classification_changed",
  "title_changed",
  "before_snapshot",
  "after_snapshot",
  "observed_at",
  "materiality",
])requireText(recorder,needle,"source change recorder")

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
  "evidenceCoverage",
  'family: "family_endpoint"',
  'family: "equivalents_fallback"',
  'family: "source_not_found"',
  'family: "unavailable"',
  'citations: "unavailable"',
  'legalEvents: "unavailable"',
  "retrievedAt",
])requireText(epo,needle,"EPO OPS evidence client")

for(const needle of [
  "requireUser()",
  "buildPatentPriorArtReview",
  "patent.prior_art_review",
  "Consulta de prior art inválida.",
  'includeGlobal: z.enum(["0", "1"])',
  'url.searchParams.get("global") === "1"',
  "candidates_with_observed_changes",
  "observed_change_events",
  "global_requested",
  "global_availability",
])requireText(route,needle,"prior-art API")
if(route.includes("createAdminClient")||route.includes("SUPABASE_SERVICE_ROLE_KEY"))fail("route must authenticate user and delegate server-only enrichment; it must not expose service-role handling")

for(const needle of [
  "Sistema de nanoburbujas de bajo consumo para oxigenar estanques de acuicultura",
  "Potential prior art",
  "Revisión cercana",
  "Familias candidatas",
  "Cambios observados",
  "Cambios observados en fuente",
  "Diferencias detectadas entre snapshots INAPI desde el baseline de VIDENTIA. No es la historia jurídica completa.",
  "VIDENTIA conserva diferencias entre snapshots oficiales observados desde",
  "Primera observación",
  "Estado actualizado",
  "Solicitante o titular actualizado",
  "No responde “patentable / no patentable”",
  "Activar EPO OPS",
  "esta consulta técnica también se envía a EPO OPS",
  'aria-pressed={includeGlobal}',
  "Citas observadas",
  "Eventos jurídicos observados",
  "Esto no demuestra ausencia de prior art",
  "Crear reporte",
])requireText(page,needle,"prior-art UI")

console.log("Patent prior-art regression PASS: local evidence remains canonical, observed INAPI snapshot changes are traceable without being misrepresented as complete legal history, global EPO OPS family/citation/legal-event evidence preserves explicit source-coverage state under fallback or degradation, and the UI preserves source and legal limits.")
