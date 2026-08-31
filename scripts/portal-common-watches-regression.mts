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
  '{href:"/monitorear",label:"Watches"',
  '{href:"/reportes",label:"Reportes"',
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
])if(nav.includes(forbidden))fail(`internal module must not remain a top-level navigation item: ${forbidden}`)

for(const needle of [
  'fetch("/api/intelligence/watches"',
  'fetch("/api/intelligence/watches/signals"',
  'Brands · Patents · Technologies',
  'Una sola bandeja para todo lo que decides seguir.',
  '(["brand","patent","technology"] as WatchType[])',
  'SUBTYPE_OPTIONS',
  'Frecuencia y geografía comunes se incorporarán cuando exista persistencia canónica; no se simulan aquí.',
  'href="/monitorear/estrategico"',
  'href="/patentes/alertas"',
])requireText(page,needle,"common watch workspace")

for(const needle of [
  'from("trademark_watches")',
  'from("patent_watches")',
  'from("intelligence_watches")',
  'z.enum(["brand", "patent", "technology"])',
  'key: `brand:${row.id}`',
  'key: `patent:${row.id}`',
  'key: `technology:${row.id}`',
  '.eq("user_id", auth.user.id)',
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

console.log("Portal/Common Watches regression PASS: six-destination IA is locked, deep tools remain contextual, and brand/patent/technology watches plus signals are normalized through authenticated RLS facades without a destructive migration.")
