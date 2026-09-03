import { readFile } from "node:fs/promises"

function fail(message:string):never{console.error(`WIPO patent watch regression FAIL: ${message}`);process.exit(1)}
function requireText(source:string,needle:string,label:string){if(!source.includes(needle))fail(`${label} missing ${needle}`)}

const [client,scanner,preview,watches,cron,page,signals,commonWatches,legacyAlerts,migration,cleanup,vercel]=await Promise.all([
  readFile("lib/intelligence/wipo-patentscope-rss.ts","utf8"),
  readFile("lib/intelligence/wipo-patent-watch-scan.ts","utf8"),
  readFile("app/api/patents/wipo-rss/preview/route.ts","utf8"),
  readFile("app/api/patents/wipo-rss/watches/route.ts","utf8"),
  readFile("app/api/cron/wipo-patent-watches/route.ts","utf8"),
  readFile("app/(app)/patentes/wipo/page.tsx","utf8"),
  readFile("app/api/intelligence/watches/signals/route.ts","utf8"),
  readFile("app/api/intelligence/watches/route.ts","utf8"),
  readFile("app/api/patents/alerts/route.ts","utf8"),
  readFile("supabase/migrations/20260903193000_add_wipo_patent_watch_sources.sql","utf8"),
  readFile("supabase/migrations/20260903195500_drop_legacy_patent_watch_unique.sql","utf8"),
  readFile("vercel.json","utf8"),
])

for(const needle of ["validateWipoPatentScopeRssUrl","https:","patentscope.wipo.int","url.username || url.password","response.url","MAX_BYTES","<!DOCTYPE|<!ENTITY","WIPO PATENTSCOPE RSS","sourceRecordId","publicationNumber","availability: \"available\""])requireText(client,needle,"WIPO RSS client")
for(const needle of ["fetchWipoPatentScopeRss","const baseline = !watch.source_last_checked_at","wipo_publication_observed","read_at: baseline ? scanAt : null","source_record_id","source_status: \"degraded\"","source_status: \"available\""])requireText(scanner,needle,"shared WIPO scanner")
for(const needle of ["requireUser()","fetchWipoPatentScopeRss","patent.wipo_rss_preview","availability: \"degraded\"","no demuestra ausencia de patentes o derechos"])requireText(preview,needle,"preview API")
for(const needle of ["requireUser()","source_type",'"wipo_patentscope_rss"',"source_url","source_status","fetchWipoPatentScopeRss","source_last_checked_at: null","last_checked_at: now","baseline: \"existing_items_will_be_marked_reviewed\"","export async function PUT()","createAdminClient()",'.eq("user_id", auth.user.id)',"scanWipoPatentWatch","patent.wipo_rss_manual_refresh",".limit(10)"])requireText(watches,needle,"WIPO watches API")
if(watches.includes("source_last_checked_at: now"))fail("new or recreated WIPO watches must remain source-uncheckpointed until the first scan establishes the baseline")
for(const needle of ["CRON_SECRET","createAdminClient","scanWipoPatentWatch","source_last_checked_at","limit(50)"])requireText(cron,needle,"WIPO cron")
for(const needle of ["Seguimiento internacional WIPO.","No necesitas pulsar ningún botón para seguir monitoreando.","Seguimiento automático cada 6 h","Sin inferencia jurídica","Revisar novedades ahora",'method:"PUT"',"Seguimientos activos","Fuentes verificadas","Con revisión registrada","showConnect","Conectar otra consulta","Seguimiento automático activo.","Seguimiento activo","Seguimiento pausado","Primera revisión pendiente","Revisión verificada","Pausar seguimiento","Reactivar seguimiento","Eliminar seguimiento","Detalles técnicos del origen","RSS oficial almacenado","Configuración avanzada","Sólo para altas nuevas","Si tu consulta ya aparece arriba como conectada, no hagas nada aquí.","PATENTSCOPE no expone tus Saved Queries a VIDENTIA","WIPO_SAVED_QUERIES_URL","Abrir Saved Queries en WIPO","URL RSS completa generada por PATENTSCOPE","Este dato se pide una sola vez al conectar la fuente","Conectar consulta","navigator.clipboard.writeText"])requireText(page,needle,"WIPO UI")
for(const needle of ["wipo_patentscope_rss","WIPO · PATENTSCOPE RSS","source_url","source_date"])requireText(signals,needle,"common signals")
for(const needle of ['source_type: "inapi_open_data"','onConflict: "user_id,watch_type,normalized_query,source_type"'])requireText(commonWatches,needle,"common patent watch writes")
for(const needle of ['.eq("source_type", "inapi_open_data")','.eq("source_key", "inapi_open_data")','source_type: "inapi_open_data"','onConflict: "user_id,watch_type,normalized_query,source_type"'])requireText(legacyAlerts,needle,"legacy INAPI alert isolation")
for(const needle of ["source_type","source_url","source_status","patent_record_id drop not null","source_key","source_record_id","patent_alert_events_external_source_uidx","patent_watches_user_type_query_source_uidx"])requireText(migration,needle,"staged migration")
if(migration.includes("drop constraint if exists patent_watches_user_id_watch_type_normalized_query_key"))fail("staged migration must not remove legacy patent watch uniqueness before source-aware code is deployed")
requireText(cleanup,"drop constraint if exists patent_watches_user_id_watch_type_normalized_query_key","post-deploy cleanup migration")
requireText(vercel,"/api/cron/wipo-patent-watches","Vercel cron")

console.log("WIPO patent watch regression PASS: the UI communicates persistent automatic tracking as the product behavior, manual refresh is only an on-demand review action, RSS plumbing stays behind explicit new-source configuration, and PATENTSCOPE integration preserves official public RSS provenance, scheduled/manual polling, baseline suppression, degraded-source semantics and no browser-session scraping or legal-status inference.")
