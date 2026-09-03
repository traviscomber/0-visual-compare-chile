import { readFile } from "node:fs/promises"

function fail(message:string):never{console.error(`Portal/Common Watches regression FAIL: ${message}`);process.exit(1)}
function requireText(source:string,needle:string,label:string){if(!source.includes(needle))fail(`${label} missing ${needle}`)}

const [nav,page,watchesApi,signalsApi]=await Promise.all([
  readFile("components/app/app-nav.tsx","utf8"),
  readFile("app/(app)/monitorear/page.tsx","utf8"),
  readFile("app/api/intelligence/watches/route.ts","utf8"),
  readFile("app/api/intelligence/watches/signals/route.ts","utf8"),
])

for(const needle of [
  '{href:"/dashboard",label:"Resumen"',
  '{href:"/investigar",label:"Marcas"',
  '{href:"/patentes",label:"Patentes"',
  '{href:"/tecnologias",label:"Tecnologías"',
  '{href:"/monitorear",label:"Seguimientos"',
  '{href:"/reportes",label:"Reportes"',
  'Crear seguimiento',
  'Marcas · Patentes · Tecnologías<br/>Busca una vez — o mantén el seguimiento.',
  '["/dashboard","/investigar","/patentes","/tecnologias"]',
  'label:"Tecnologías",icon:Activity,aliases:["/empresas","/espacios","/brechas","/oportunidades"]',
])requireText(nav,needle,"portal navigation")

for(const forbidden of [
  'href:"/empresas",label:',
  'href:"/espacios",label:',
  'href:"/brechas",label:',
  'href:"/oportunidades",label:',
  'href:"/portfolio",label:',
  'href:"/casos",label:',
  'label:"Watches"',
  '>Crear watch</',
])if(nav.includes(forbidden))fail(`internal module or stale terminology must not remain in top-level navigation: ${forbidden}`)

for(const needle of [
  'fetch("/api/intelligence/watches"',
  'fetch("/api/intelligence/watches/signals"',
  'eyebrow="VIDENTIA / SEGUIMIENTOS"',
  'Seguimiento en 3 pasos.',
  'Elige qué seguir',
  'VIDENTIA vigila',
  'Revisa novedades',
  'PASO 1 / NUEVO SEGUIMIENTO',
  'A · Tipo',
  'B · Criterio',
  'C · Activar',
  'Activar seguimiento',
  'No pudimos cargar tus seguimientos.',
  'No pudimos crear el seguimiento.',
  'href="#novedades"',
  'PASO 3 / NOVEDADES',
  'Marcar revisadas',
  'PASO 2',
  '(["brand","patent","technology"] as WatchType[])',
  'SUBTYPE_OPTIONS',
  'aria-label="Dónde buscar"',
  '<option value="chile">Chile</option>',
  '<option value="global">Global</option>',
  '<option value="both">Ambos</option>',
  'IA / AI',
  'href="/monitorear/estrategico"',
  'href="/patentes/alertas"',
])requireText(page,needle,"common watch workspace")

for(const forbidden of [
  'eyebrow="VIDENTIA / Watches"',
  'No pudimos cargar tus vigilancias.',
  'No pudimos crear la vigilancia.',
])if(page.includes(forbidden))fail(`stale monitoring terminology must not remain user-facing: ${forbidden}`)

for(const needle of [
  'from("trademark_watches")',
  'from("patent_watches")',
  'from("intelligence_watches")',
  'z.enum(["brand", "patent", "technology"])',
  'key: `brand:${row.id}`',
  'key: `patent:${row.id}`',
  'key: `technology:${row.id}`',
  '.eq("user_id", auth.user.id)',
  'SearchScopeSchema',
  'readStrategicSearchScope',
])requireText(watchesApi,needle,"common watch API")

for(const needle of [
  'from("trademark_watch_signal_events")',
  'from("patent_alert_events")',
  'from("intelligence_watch_events")',
  'last_reviewed_at: reviewedAt',
  'read_at: reviewedAt',
  '.eq("user_id", auth.user.id)',
])requireText(signalsApi,needle,"common signal inbox API")

for(const [source,label] of [[watchesApi,"watch API"],[signalsApi,"signal API"]] as const){
  if(source.includes("createAdminClient")||source.includes("SUPABASE_SERVICE_ROLE_KEY"))fail(`${label} must remain behind authenticated RLS, not service role`)
}

console.log("Portal/Common Watches regression PASS: user-facing monitoring terminology is consistently Seguimientos, the workspace remains a simple 1-2-3 journey (choose, VIDENTIA watches, review changes), with A-B-C creation, six-destination IA, contextual deep tools, scoped Chile/Global/Both technology searches, and authenticated RLS facades preserved without a destructive migration.")
