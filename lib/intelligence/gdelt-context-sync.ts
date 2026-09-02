import "server-only"
import { createHash } from "node:crypto"
import { inflateRawSync } from "node:zlib"
import type { SupabaseClient } from "@supabase/supabase-js"
import { fetchWithRetry } from "@/lib/intelligence/fetch-with-retry"
import { startIntelligenceIngestion, finishIntelligenceIngestion, failIntelligenceIngestion } from "@/lib/intelligence/ingestion-observability"

const LAST_UPDATE_URL="https://data.gdeltproject.org/gdeltv2/lastupdate.txt", HOST="data.gdeltproject.org"
const MAX_ZIP=30*1024*1024, MAX_CSV=160*1024*1024, BATCH=250
const CONTEXT_FALLBACK_INTERVALS=[0,15,30,45] as const
const MENTION_COLUMNS=["GLOBALEVENTID","EventTimeDate","MentionTimeDate","MentionType","MentionSourceName","MentionIdentifier","SentenceID","Actor1CharOffset","Actor2CharOffset","ActionCharOffset","InRawText","Confidence","MentionDocLen","MentionDocTone","MentionDocTranslationInfo","Extras"] as const
const GKG_COLUMNS=["GKGRECORDID","V2.1DATE","V2SOURCECOLLECTIONIDENTIFIER","V2SOURCECOMMONNAME","V2DOCUMENTIDENTIFIER","V1COUNTS","V2.1COUNTS","V1THEMES","V2ENHANCEDTHEMES","V1LOCATIONS","V2ENHANCEDLOCATIONS","V1PERSONS","V2ENHANCEDPERSONS","V1ORGANIZATIONS","V2ENHANCEDORGANIZATIONS","V1.5TONE","V2.1ENHANCEDDATES","V2GCAM","V2.1SHARINGIMAGE","V2.1RELATEDIMAGES","V2.1SOCIALIMAGEEMBEDS","V2.1SOCIALVIDEOEMBEDS","V2.1QUOTATIONS","V2.1ALLNAMES","V2.1AMOUNTS","V2.1TRANSLATIONINFO","V2EXTRASXML"] as const

type Kind="mentions"|"gkg"
type Artifact={kind:Kind;url:string;bytes:number|null;timestamp:string}
type Counts={rowCount:number;inserted:number;updated:number;rejected:number;filtered:number}
type Result=Counts&{artifactId:string;skipped:boolean;skipReason:string|null;sha256:string|null}

export async function syncGdeltContextBundle(admin:SupabaseClient):Promise<{ok:true;timestamp:string;mentions:Result;gkg:Result}> {
  const bundle=await probeBundle()
  const mentions=await syncMentions(admin,bundle.mentions)
  const {identifiers:_drop,...mentionResult}=mentions
  if(mentions.skipped && mentions.skipReason==="processing") return {ok:true,timestamp:bundle.mentions.timestamp,mentions:mentionResult,gkg:zero("",true,"upstream_processing")}
  const identifiers=mentions.identifiers.size?mentions.identifiers:await loadIdentifiers(admin,mentions.artifactId)
  const gkg=await syncGkg(admin,bundle.gkg,identifiers)
  return {ok:true,timestamp:bundle.mentions.timestamp,mentions:mentionResult,gkg}
}

async function probeBundle(){
  const r=await fetchWithRetry(LAST_UPDATE_URL,{cache:"no-store",headers:{Accept:"text/plain,*/*","User-Agent":"VIDENTIA/1.0"}},{attempts:3,baseDelayMs:500,timeoutMs:12000})
  if(!r.ok) throw new Error(`GDELT lastupdate responded ${r.status}`)
  const lines=(await r.text()).split(/\r?\n/).map(x=>x.trim()).filter(Boolean)
  const latestMentions=artifact(lines.find(x=>x.endsWith(".mentions.CSV.zip")),"mentions")
  const latestGkg=artifact(lines.find(x=>x.endsWith(".gkg.csv.zip")),"gkg")
  if(latestMentions.timestamp!==latestGkg.timestamp) throw new Error("GDELT context timestamps are not synchronized")
  const latest=new Date(latestMentions.timestamp)
  for(const offsetMinutes of CONTEXT_FALLBACK_INTERVALS){
    const ts=new Date(latest.getTime()-offsetMinutes*60_000), stamp=compactTimestamp(ts)
    const mentions:Artifact={kind:"mentions",url:`https://${HOST}/gdeltv2/${stamp}.mentions.CSV.zip`,bytes:offsetMinutes===0?latestMentions.bytes:null,timestamp:ts.toISOString()}
    const gkg:Artifact={kind:"gkg",url:`https://${HOST}/gdeltv2/${stamp}.gkg.csv.zip`,bytes:offsetMinutes===0?latestGkg.bytes:null,timestamp:ts.toISOString()}
    if(await artifactAvailable(mentions.url) && await artifactAvailable(gkg.url)) return {mentions,gkg}
  }
  throw new Error("No complete synchronized GDELT context bundle available")
}
async function artifactAvailable(target:string){
  try{const r=await fetchWithRetry(target,{cache:"no-store",headers:{Range:"bytes=0-0",Accept:"application/zip,application/octet-stream,*/*","User-Agent":"VIDENTIA/1.0"}},{attempts:1,baseDelayMs:0,timeoutMs:5000});return r.status===200||r.status===206}catch{return false}
}
function compactTimestamp(d:Date){return d.toISOString().replace(/[-:T]/g,"").slice(0,14)}
function artifact(line:string|undefined,kind:Kind):Artifact{
  if(!line) throw new Error(`Missing GDELT ${kind} artifact`)
  const [bytes,,raw]=line.split(/\s+/); const url=new URL(String(raw).replace(/^http:/,"https:"))
  if(url.hostname!==HOST||!url.pathname.startsWith("/gdeltv2/")) throw new Error(`Rejected GDELT ${kind} artifact URL`)
  const suffix=kind==="mentions"?"mentions\\.CSV":"gkg\\.csv", m=url.pathname.match(new RegExp(`/(\\d{14})\\.${suffix}\\.zip$`,"i"))
  if(!m) throw new Error(`Missing GDELT ${kind} timestamp`)
  return {kind,url:url.toString(),bytes:Number.isFinite(Number(bytes))?Number(bytes):null,timestamp:gdeltDate(m[1])}
}

async function syncMentions(admin:SupabaseClient,a:Artifact){
  const ing=await startIntelligenceIngestion(admin,{sourceKey:"gdelt_mentions",runType:"delta",scope:{trigger:"vercel-cron",pipeline:"gdelt-context-fusion",dataset:"event-mentions-2.0"}})
  let id:string|null=null
  try{
    const c=await claim(admin,a,ing.runId); id=c.artifactId
    if(!c.claimed){await finishIntelligenceIngestion(admin,{runId:ing.runId,sourceId:ing.sourceId,metadata:{pipeline:"gdelt-context-fusion",artifactKind:"mentions",skipped:c.status,artifactId:id}});return {...zero(id,true,c.status),identifiers:new Set<string>()}}
    const d=await download(a), lines=d.csv.split(/\r?\n/).filter(Boolean), rows:NonNullable<ReturnType<typeof parseMention>>[]=[], identifiers=new Set<string>(); let rejected=0
    for(const line of lines){const row=parseMention(line);if(!row){rejected++;continue}rows.push(row);identifiers.add(row.mention_identifier)}
    for(let i=0;i<rows.length;i+=BATCH){const {error}=await admin.from("gdelt_event_mentions").upsert(rows.slice(i,i+BATCH).map(row=>({...row,artifact_id:id,source_retrieved_at:d.at})),{onConflict:"artifact_id,source_row_hash",ignoreDuplicates:true});if(error)throw new Error(error.message)}
    const counts={rowCount:lines.length,inserted:rows.length,updated:0,rejected,filtered:0}; await finishArtifact(admin,id,d,counts)
    await finishIntelligenceIngestion(admin,{runId:ing.runId,sourceId:ing.sourceId,fetched:lines.length,inserted:rows.length,updated:0,rejected,status:rejected?"partial":"completed",errorMessage:rejected?`${rejected} malformed GDELT mention rows rejected.`:null,metadata:{pipeline:"gdelt-context-fusion",artifactKind:"mentions",artifactId:id,sha256:d.sha256}})
    return {artifactId:id,skipped:false,skipReason:null,sha256:d.sha256,...counts,identifiers}
  }catch(e){await fail(admin,id,ing,e,"mentions");throw e}
}

async function syncGkg(admin:SupabaseClient,a:Artifact,ids:Set<string>):Promise<Result>{
  const ing=await startIntelligenceIngestion(admin,{sourceKey:"gdelt_gkg",runType:"delta",scope:{trigger:"vercel-cron",pipeline:"gdelt-context-fusion",dataset:"gkg-2.1",projection:"mention-linked"}}); let id:string|null=null
  try{
    const c=await claim(admin,a,ing.runId); id=c.artifactId
    if(!c.claimed){await finishIntelligenceIngestion(admin,{runId:ing.runId,sourceId:ing.sourceId,metadata:{pipeline:"gdelt-context-fusion",artifactKind:"gkg",skipped:c.status,artifactId:id}});return zero(id,true,c.status)}
    const d=await download(a),lines=d.csv.split(/\r?\n/).filter(Boolean),rows:NonNullable<ReturnType<typeof parseGkg>>[]=[];let rejected=0,filtered=0
    for(const line of lines){const f=line.split("\t"),doc=url(f[4]);if(!doc||!ids.has(doc)){filtered++;continue}const row=parseGkg(line);if(!row){rejected++;continue}rows.push(row)}
    let inserted=0,updated=0
    for(let i=0;i<rows.length;i+=BATCH){const batch=rows.slice(i,i+BATCH),keys=batch.map(x=>x.gkg_record_id);const {data:existing,error:ee}=await admin.from("gdelt_gkg_documents").select("gkg_record_id").in("gkg_record_id",keys);if(ee)throw new Error(ee.message);const set=new Set((existing??[]).map(x=>String(x.gkg_record_id)))
      const {error:ve}=await admin.from("gdelt_gkg_document_versions").upsert(batch.map(x=>({artifact_id:id,gkg_record_id:x.gkg_record_id,document_identifier:x.document_identifier,raw_payload:x.raw_payload,raw_row:x.raw_row,source_row_hash:x.source_row_hash,source_retrieved_at:d.at})),{onConflict:"artifact_id,gkg_record_id",ignoreDuplicates:true});if(ve)throw new Error(ve.message)
      const {error:de}=await admin.from("gdelt_gkg_documents").upsert(batch.map(({raw_row:_r,source_row_hash:_h,...x})=>({...x,latest_artifact_id:id,source_retrieved_at:d.at,last_seen_at:d.at,updated_at:d.at})),{onConflict:"gkg_record_id"});if(de)throw new Error(de.message)
      updated+=batch.filter(x=>set.has(x.gkg_record_id)).length;inserted+=batch.filter(x=>!set.has(x.gkg_record_id)).length}
    const counts={rowCount:lines.length,inserted,updated,rejected,filtered};await finishArtifact(admin,id,d,counts)
    await finishIntelligenceIngestion(admin,{runId:ing.runId,sourceId:ing.sourceId,fetched:lines.length,inserted,updated,rejected,status:rejected?"partial":"completed",errorMessage:rejected?`${rejected} malformed mention-linked GKG rows rejected.`:null,metadata:{pipeline:"gdelt-context-fusion",artifactKind:"gkg",projection:"mention-linked",filtered,artifactId:id,sha256:d.sha256}})
    return {artifactId:id,skipped:false,skipReason:null,sha256:d.sha256,...counts}
  }catch(e){await fail(admin,id,ing,e,"gkg");throw e}
}

function parseMention(raw:string){const f=raw.split("\t");if(f.length<MENTION_COLUMNS.length||!/^\d+$/.test(f[0]??""))return null;const doc=url(f[5]);if(!doc)return null;return{global_event_id:f[0],event_time_date:date(f[1]),mention_time_date:date(f[2]),mention_type:int(f[3]),mention_source_name:text(f[4]),mention_identifier:doc,sentence_id:int(f[6]),actor1_char_offset:int(f[7]),actor2_char_offset:int(f[8]),action_char_offset:int(f[9]),in_raw_text:f[10]==="1"?true:f[10]==="0"?false:null,confidence:int(f[11]),mention_doc_len:int(f[12]),mention_doc_tone:num(f[13]),translation_info:text(f[14]),extras:text(f[15]),raw_payload:payload(MENTION_COLUMNS,f),raw_row:raw,source_row_hash:hash(raw)}}
function parseGkg(raw:string){const f=raw.split("\t"),record=String(f[0]??"").trim(),doc=url(f[4]);if(f.length<GKG_COLUMNS.length||!record||!doc)return null;const tone=String(f[15]??"").split(",").map(num);return{gkg_record_id:record,document_identifier:doc,document_date:date(f[1]),source_collection_identifier:text(f[2]),source_common_name:text(f[3]),themes:names(f[8],f[7]),persons:names(f[12],f[11]),organizations:names(f[14],f[13]),locations:String(f[10]||f[9]||"").split(";").filter(Boolean).slice(0,80),tone:tone[0],positive_score:tone[1],negative_score:tone[2],polarity:tone[3],activity_reference_density:tone[4],raw_payload:payload(GKG_COLUMNS,f),raw_row:raw,source_row_hash:hash(raw)}}
function names(enh:string|undefined,fallback:string|undefined){const source=String(enh??"").trim();return[...new Set((source?source.split(";").map(x=>x.replace(/,\d+$/,"")):String(fallback??"").split(";")).map(x=>x.trim()).filter(Boolean))].slice(0,120)}
function payload(cols:readonly string[],f:string[]){const x:Record<string,string>={};cols.forEach((c,i)=>x[c]=f[i]??"");return x}

async function claim(admin:SupabaseClient,a:Artifact,runId:string){if(a.bytes!=null&&a.bytes>MAX_ZIP)throw new Error(`GDELT ${a.kind} artifact too large`);const {data,error}=await admin.rpc("claim_gdelt_context_artifact",{p_artifact_kind:a.kind,p_artifact_timestamp:a.timestamp,p_artifact_url:a.url,p_artifact_bytes:a.bytes,p_ingestion_run_id:runId});if(error)throw new Error(error.message);const r=Array.isArray(data)?data[0]:data,id=String(r?.artifact_id??"");if(!id)throw new Error("GDELT context claim returned no id");return{artifactId:id,claimed:Boolean(r?.claimed),status:String(r?.current_status??"unknown")}}
async function download(a:Artifact){const r=await fetchWithRetry(a.url,{cache:"no-store",headers:{Accept:"application/zip,application/octet-stream,*/*","User-Agent":"VIDENTIA/1.0"}},{attempts:3,baseDelayMs:750,timeoutMs:25000});if(!r.ok)throw new Error(`GDELT ${a.kind} download ${r.status}`);const zip=Buffer.from(await r.arrayBuffer());if(zip.byteLength>MAX_ZIP)throw new Error("GDELT context ZIP too large");return{bytes:zip.byteLength,sha256:hash(zip),csv:unzip(zip),at:new Date().toISOString()}}
function unzip(zip:Buffer){let e=-1;for(let i=zip.length-22;i>=Math.max(0,zip.length-65557);i--)if(zip.readUInt32LE(i)===0x06054b50){e=i;break}if(e<0)throw new Error("Invalid GDELT ZIP");const n=zip.readUInt16LE(e+10);let c=zip.readUInt32LE(e+16),sel:any=null;for(let i=0;i<n;i++){if(zip.readUInt32LE(c)!==0x02014b50)throw new Error("Invalid GDELT ZIP directory");const method=zip.readUInt16LE(c+10),cs=zip.readUInt32LE(c+20),us=zip.readUInt32LE(c+24),nl=zip.readUInt16LE(c+28),xl=zip.readUInt16LE(c+30),cl=zip.readUInt16LE(c+32),lo=zip.readUInt32LE(c+42),name=zip.subarray(c+46,c+46+nl).toString("utf8");if(/\.csv$/i.test(name))sel={method,cs,us,lo};c+=46+nl+xl+cl}if(!sel||sel.cs>MAX_ZIP||sel.us>MAX_CSV)throw new Error("Unsafe GDELT ZIP entry");const nl=zip.readUInt16LE(sel.lo+26),xl=zip.readUInt16LE(sel.lo+28),start=sel.lo+30+nl+xl,compressed=zip.subarray(start,start+sel.cs),out=sel.method===8?inflateRawSync(compressed):sel.method===0?Buffer.from(compressed):null;if(!out||out.byteLength>MAX_CSV)throw new Error("Unsupported or oversized GDELT CSV");return out.toString("utf8")}
async function finishArtifact(admin:SupabaseClient,id:string,d:{bytes:number;sha256:string;at:string},c:Counts){const {error}=await admin.from("gdelt_context_artifacts").update({status:"completed",artifact_bytes:d.bytes,sha256:d.sha256,row_count:c.rowCount,inserted_count:c.inserted,updated_count:c.updated,rejected_count:c.rejected,filtered_count:c.filtered,retrieved_at:d.at,finished_at:new Date().toISOString(),error_message:null,updated_at:new Date().toISOString()}).eq("id",id);if(error)throw new Error(error.message)}
async function fail(admin:SupabaseClient,id:string|null,ing:{runId:string;sourceId:string},e:unknown,kind:Kind){const message=e instanceof Error?e.message:String(e);if(id)try{await admin.from("gdelt_context_artifacts").update({status:"failed",finished_at:new Date().toISOString(),error_message:message.slice(0,4000),updated_at:new Date().toISOString()}).eq("id",id)}catch{}await failIntelligenceIngestion(admin,{runId:ing.runId,sourceId:ing.sourceId,error:e,metadata:{pipeline:"gdelt-context-fusion",artifactKind:kind,artifactId:id}}).catch(()=>undefined)}
async function loadIdentifiers(admin:SupabaseClient,id:string){const set=new Set<string>();for(let o=0;;o+=1000){const {data,error}=await admin.from("gdelt_event_mentions").select("mention_identifier").eq("artifact_id",id).range(o,o+999);if(error)throw new Error(error.message);for(const r of data??[])if(r.mention_identifier)set.add(String(r.mention_identifier));if(!data||data.length<1000)break}return set}
function zero(id:string,skipped:boolean,skipReason:string|null=null):Result{return{artifactId:id,skipped,skipReason,sha256:null,rowCount:0,inserted:0,updated:0,rejected:0,filtered:0}}
function gdeltDate(v:string){const d=new Date(Date.UTC(+v.slice(0,4),+v.slice(4,6)-1,+v.slice(6,8),+v.slice(8,10),+v.slice(10,12),+v.slice(12,14)));if(!Number.isFinite(d.getTime()))throw new Error("Invalid GDELT timestamp");return d.toISOString()}
function date(v:string|undefined){if(!v||!/^\d{14}$/.test(v))return null;return gdeltDate(v)}
function url(v:string|undefined){try{const u=new URL(String(v??"").trim());return u.protocol==="http:"||u.protocol==="https:"?u.toString():null}catch{return null}}
function text(v:string|undefined){const x=String(v??"").trim();return x||null}function num(v:string|undefined){const x=Number(String(v??"").trim());return Number.isFinite(x)?x:null}function int(v:string|undefined){const x=num(v);return x==null?null:Math.trunc(x)}function hash(v:string|Buffer){return createHash("sha256").update(v).digest("hex")}
