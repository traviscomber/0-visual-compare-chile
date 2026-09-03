import { access, readFile } from "node:fs/promises"

function fail(message:string):never{console.error(`WIPO patent watch regression FAIL: ${message}`);process.exit(1)}
function requireText(source:string,needle:string,label:string){if(!source.includes(needle))fail(`${label} missing ${needle}`)}
function forbidText(source:string,needle:string,label:string){if(source.includes(needle))fail(`${label} must not expose ${needle}`)}

const [client,scanner,preview,watches,cron,page,connectorPage,manifest,background,wipoBridge,videntiaBridge,signals,commonWatches,legacyAlerts,migration,cleanup,vercel]=await Promise.all([
  readFile("lib/intelligence/wipo-patentscope-rss.ts","utf8"),
  readFile("lib/intelligence/wipo-patent-watch-scan.ts","utf8"),
  readFile("app/api/patents/wipo-rss/preview/route.ts","utf8"),
  readFile("app/api/patents/wipo-rss/watches/route.ts","utf8"),
  readFile("app/api/cron/wipo-patent-watches/route.ts","utf8"),
  readFile("app/(app)/patentes/wipo/page.tsx","utf8"),
  readFile("app/(app)/patentes/wipo/conector/page.tsx","utf8"),
  readFile("public/videntia-wipo-connector/manifest.json","utf8"),
  readFile("public/videntia-wipo-connector/background.js","utf8"),
  readFile("public/videntia-wipo-connector/wipo.js","utf8"),
  readFile("public/videntia-wipo-connector/videntia.js","utf8"),
  readFile("app/api/intelligence/watches/signals/route.ts","utf8"),
  readFile("app/api/intelligence/watches/route.ts","utf8"),
  readFile("app/api/patents/alerts/route.ts","utf8"),
  readFile("supabase/migrations/20260903193000_add_wipo_patent_watch_sources.sql","utf8"),
  readFile("supabase/migrations/20260903195500_drop_legacy_patent_watch_unique.sql","utf8"),
  readFile("vercel.json","utf8"),
])
await access("public/videntia-wipo-connector/videntia-wipo-connector.zip")

for(const needle of ["validateWipoPatentScopeRssUrl","https:","patentscope.wipo.int","url.username || url.password","response.url","MAX_BYTES","<!DOCTYPE|<!ENTITY","WIPO PATENTSCOPE RSS","sourceRecordId","publicationNumber","availability: \"available\""])requireText(client,needle,"WIPO RSS client")
for(const needle of ["fetchWipoPatentScopeRss","const baseline = !watch.source_last_checked_at","wipo_publication_observed","read_at: baseline ? scanAt : null","source_record_id","source_status: \"degraded\"","source_status: \"available\""])requireText(scanner,needle,"shared WIPO scanner")
for(const needle of ["requireUser()","fetchWipoPatentScopeRss","patent.wipo_rss_preview","availability: \"degraded\"","no demuestra ausencia de patentes o derechos"])requireText(preview,needle,"preview API")
for(const needle of ["requireUser()","source_type",'"wipo_patentscope_rss"',"source_url","source_status","fetchWipoPatentScopeRss","source_last_checked_at: null","last_checked_at: now","baseline: \"existing_items_will_be_marked_reviewed\"","export async function PUT()","createAdminClient()",'.eq("user_id", auth.user.id)',"scanWipoPatentWatch","patent.wipo_rss_manual_refresh",".limit(10)"])requireText(watches,needle,"WIPO watches API")
if(watches.includes("source_last_checked_at: now"))fail("new or recreated WIPO watches must remain source-uncheckpointed until the first scan establishes the baseline")
for(const needle of ["CRON_SECRET","createAdminClient","scanWipoPatentWatch","source_last_checked_at","limit(50)"])requireText(cron,needle,"WIPO cron")

for(const needle of ["Seguimiento WIPO.","Escribe qué seguir","VIDENTIA lo conecta","Recibe novedades","Activar seguimiento","No necesitas crear enlaces, copiar RSS ni validar fuentes","VIDENTIA_WIPO_CONNECT",'params.get("feedUrl")','href="/monitorear"',"Revisar ahora","Tus seguimientos","Seguimiento activo","Pausar","Reactivar","Eliminar","Detalles técnicos",'/patentes/wipo/conector'])requireText(page,needle,"automatic WIPO UI")
for(const forbidden of ["Pega el RSS","Pega aquí la URL RSS","Validar RSS","navigator.clipboard.writeText","WIPO_SAVED_QUERIES_URL"])forbidText(page,forbidden,"automatic WIPO UI")

for(const needle of ['"version": "0.2.0"','"storage", "tabs", "webRequest"','"https://patentscope.wipo.int/*"','"https://videntia.app/*"'])requireText(manifest,needle,"WIPO connector manifest")
for(const forbidden of ['"cookies"','"history"','"webRequestBlocking"'])forbidText(manifest,forbidden,"WIPO connector permissions")
for(const needle of ["WIPO_SAVED_QUERIES_URL","PENDING_TTL_MS","15 * 60 * 1000","isLivePending","chrome.storage.local.remove(PENDING_KEY)","chrome.webRequest.onBeforeRequest","parsed.hostname !== \"patentscope.wipo.int\"",'/\\/rss\\.xml$/i',"feedUrl","CALLBACK_BASE"])requireText(background,needle,"WIPO connector background")
for(const needle of ["exactSavedQueryRow","querySelector(\"td\")","privateCheckbox","rss.click()","window.location.assign(SEARCH_PATH)","saveCurrentQuery","sessionStorage",'`videntiaWipoStep:${pending.startedAt}`',"Confirma que tu sesión","no ofreció seguimiento"])requireText(wipoBridge,needle,"WIPO connector automation")
for(const needle of ["VIDENTIA_WIPO_READY","VIDENTIA_WIPO_CONNECT","START_WIPO_CONNECT","event.origin !== window.location.origin"])requireText(videntiaBridge,needle,"VIDENTIA connector bridge")
for(const forbidden of ["document.cookie"])forbidText(wipoBridge,forbidden,"WIPO connector automation")
for(const forbidden of ["document.cookie"])forbidText(videntiaBridge,forbidden,"VIDENTIA connector bridge")
for(const needle of ["Activa WIPO una sola vez.","Descargar conector","opera://extensions","Load unpacked","No lee, almacena ni envía tu usuario o contraseña",'videntia-wipo-connector.zip'])requireText(connectorPage,needle,"connector install page")

for(const needle of ["wipo_patentscope_rss","WIPO · PATENTSCOPE RSS","source_url","source_date"])requireText(signals,needle,"common signals")
for(const needle of ['source_type: "inapi_open_data"','onConflict: "user_id,watch_type,normalized_query,source_type"'])requireText(commonWatches,needle,"common patent watch writes")
for(const needle of ['.eq("source_type", "inapi_open_data")','.eq("source_key", "inapi_open_data")','source_type: "inapi_open_data"','onConflict: "user_id,watch_type,normalized_query,source_type"'])requireText(legacyAlerts,needle,"legacy INAPI alert isolation")
for(const needle of ["source_type","source_url","source_status","patent_record_id drop not null","source_key","source_record_id","patent_alert_events_external_source_uidx","patent_watches_user_type_query_source_uidx"])requireText(migration,needle,"staged migration")
if(migration.includes("drop constraint if exists patent_watches_user_id_watch_type_normalized_query_key"))fail("staged migration must not remove legacy patent watch uniqueness before source-aware code is deployed")
requireText(cleanup,"drop constraint if exists patent_watches_user_id_watch_type_normalized_query_key","post-deploy cleanup migration")
requireText(vercel,"/api/cron/wipo-patent-watches","Vercel cron")

console.log("WIPO patent watch regression PASS: the product UI hides RSS setup, the one-time browser connector reuses an authenticated public PATENTSCOPE saved query or prepares one, the backend remains the canonical RSS validator, baseline suppression and provenance remain intact, and no WIPO credentials are collected.")
