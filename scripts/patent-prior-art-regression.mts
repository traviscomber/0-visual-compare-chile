import { readFile } from "node:fs/promises"

function fail(message:string):never{console.error(`Patent prior-art regression FAIL: ${message}`);process.exit(1)}
function requireText(source:string,needle:string,label:string){if(!source.includes(needle))fail(`${label} missing ${needle}`)}

const [builder,route,page]=await Promise.all([
  readFile("lib/intelligence/patent-prior-art.ts","utf8"),
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
  'reviewLevel: "close_review"',
  'source: "INAPI Chile"',
  "Citations no se muestran mientras no exista una fuente canónica verificable integrada.",
])requireText(builder,needle,"prior-art builder")

for(const needle of ["requireUser()","buildPatentPriorArtReview","patent.prior_art_review","Consulta de prior art inválida."])requireText(route,needle,"prior-art API")
if(route.includes("createAdminClient")||route.includes("SUPABASE_SERVICE_ROLE_KEY"))fail("route must authenticate user and delegate server-only enrichment; it must not expose service-role handling")

for(const needle of [
  "Sistema de nanoburbujas de bajo consumo para oxigenar estanques de acuicultura",
  "Potential prior art",
  "Revisión cercana",
  "Familias candidatas",
  "No responde “patentable / no patentable”",
  "Crear reporte",
])requireText(page,needle,"prior-art UI")

console.log("Patent prior-art regression PASS: long natural-language queries fall back to technical concepts, candidates expose priority/PCT/family evidence, and the UI preserves explicit legal limits.")
