"use client"

import Link from "next/link"
import { type FormEvent, useEffect, useRef, useState } from "react"
import { ArrowLeft, CheckCircle2, ChevronUp, ExternalLink, Loader2, Pause, Play, Plus, RefreshCw, Trash2 } from "lucide-react"
import { OperationalHeader, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Watch = { id:string; watch_type:"company"|"ipc"; query:string; is_active:boolean; source_url:string; source_status:"available"|"degraded"|"not_configured"; source_last_error:string|null; source_last_checked_at:string|null; created_at:string; updated_at:string }
type AutoState = "idle"|"starting"|"waiting_wipo"|"connecting"|"connected"|"connector_missing"|"error"
type PendingAutomaticConnection = { query:string; watchType:"company"|"ipc"; startedAt:number }

const CONNECTOR_SOURCE="VIDENTIA_WIPO_CONNECTOR"
const APP_SOURCE="VIDENTIA"
const AUTO_STORAGE_PREFIX="videntia:wipo:auto:"
const AUTO_TTL_MS=15*60*1000

function pendingStorageKey(nonce:string){return `${AUTO_STORAGE_PREFIX}${nonce}`}
function readPendingAutomaticConnection(nonce:string):PendingAutomaticConnection|null{
  if(!nonce)return null
  try{
    const raw=window.localStorage.getItem(pendingStorageKey(nonce))
    if(!raw)return null
    const parsed=JSON.parse(raw) as Partial<PendingAutomaticConnection>
    const validQuery=typeof parsed.query==="string"&&parsed.query.trim().length>=2
    const validType=parsed.watchType==="company"||parsed.watchType==="ipc"
    const validTime=typeof parsed.startedAt==="number"&&Number.isFinite(parsed.startedAt)&&Date.now()-parsed.startedAt>=0&&Date.now()-parsed.startedAt<=AUTO_TTL_MS
    if(!validQuery||!validType||!validTime){window.localStorage.removeItem(pendingStorageKey(nonce));return null}
    return {query:parsed.query!.trim(),watchType:parsed.watchType as "company"|"ipc",startedAt:parsed.startedAt!}
  }catch{window.localStorage.removeItem(pendingStorageKey(nonce));return null}
}

export default function WipoPatentWatchesPage(){
  const [watches,setWatches]=useState<Watch[]>([])
  const [type,setType]=useState<"company"|"ipc">("company")
  const [query,setQuery]=useState("")
  const [loading,setLoading]=useState(true)
  const [working,setWorking]=useState(false)
  const [showConnect,setShowConnect]=useState(false)
  const [connectorReady,setConnectorReady]=useState<boolean|null>(null)
  const [autoState,setAutoState]=useState<AutoState>("idle")
  const [autoMessage,setAutoMessage]=useState<string|null>(null)
  const [error,setError]=useState<string|null>(null)
  const callbackHandled=useRef(false)
  const activeNonce=useRef<string|null>(null)

  async function load(){
    setLoading(true);setError(null)
    try{
      const response=await fetch("/api/patents/wipo-rss/watches",{cache:"no-store"})
      const payload=await response.json().catch(()=>({}))
      if(!response.ok)throw new Error(payload.error||"No pudimos cargar WIPO.")
      const nextWatches=Array.isArray(payload.watches)?payload.watches:[]
      setWatches(nextWatches)
      if(nextWatches.length===0)setShowConnect(true)
    }catch(cause){setError(cause instanceof Error?cause.message:"No pudimos cargar WIPO.")}finally{setLoading(false)}
  }

  useEffect(()=>{void load()},[])

  useEffect(()=>{
    function onMessage(event:MessageEvent){
      if(event.source!==window||event.origin!==window.location.origin)return
      const message=event.data as {source?:string;type?:string;message?:string;nonce?:string}|null
      if(!message||message.source!==CONNECTOR_SOURCE)return
      if(message.type==="VIDENTIA_WIPO_READY"){
        setConnectorReady(true)
        return
      }
      if(message.type==="VIDENTIA_WIPO_STARTED"){
        setAutoState("waiting_wipo")
        setAutoMessage("VIDENTIA está preparando el seguimiento en WIPO. Esta pestaña puede quedar abierta.")
        return
      }
      if(message.type==="VIDENTIA_WIPO_ERROR"){
        if(message.nonce)window.localStorage.removeItem(pendingStorageKey(message.nonce))
        if(!message.nonce||activeNonce.current===message.nonce){activeNonce.current=null;setWorking(false)}
        setAutoState("error")
        setError(message.message||"No pudimos completar la conexión automática con WIPO.")
      }
    }
    window.addEventListener("message",onMessage)
    window.postMessage({source:APP_SOURCE,type:"VIDENTIA_WIPO_PING"},window.location.origin)
    const timer=window.setTimeout(()=>setConnectorReady(current=>current??false),1200)
    return()=>{window.removeEventListener("message",onMessage);window.clearTimeout(timer)}
  },[])

  useEffect(()=>{
    if(callbackHandled.current)return
    const params=new URLSearchParams(window.location.search)
    const nonce=params.get("nonce")||""
    const autoError=params.get("autoError")
    if(autoError){
      callbackHandled.current=true
      if(nonce)window.localStorage.removeItem(pendingStorageKey(nonce))
      activeNonce.current=null;setWorking(false);setAutoState("error");setError(autoError)
      cleanAutomaticParams();return
    }
    if(params.get("auto")!=="1")return
    callbackHandled.current=true
    const feedUrl=params.get("feedUrl")||""
    void completeAutomaticConnection(nonce,feedUrl)
  },[])

  async function completeAutomaticConnection(nonce:string,feedUrl:string){
    const pending=readPendingAutomaticConnection(nonce)
    if(!pending||!feedUrl){setWorking(false);setAutoState("error");setError("No pudimos verificar el retorno de WIPO. Activa el seguimiento nuevamente desde VIDENTIA.");cleanAutomaticParams();return}
    window.localStorage.removeItem(pendingStorageKey(nonce))
    activeNonce.current=null
    setWorking(true);setError(null);setAutoState("connecting");setAutoMessage("Conectando WIPO con VIDENTIA…")
    try{
      const response=await fetch("/api/patents/wipo-rss/watches",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({type:pending.watchType,query:pending.query,feedUrl})})
      const payload=await response.json().catch(()=>({}))
      if(!response.ok)throw new Error(payload.error||"No pudimos activar el seguimiento WIPO.")
      setQuery("");setShowConnect(false);setAutoState("connected");setAutoMessage(`Seguimiento “${pending.query}” activo. VIDENTIA revisará WIPO automáticamente cada 6 horas.`)
      cleanAutomaticParams();await load()
    }catch(cause){setAutoState("error");setError(cause instanceof Error?cause.message:"No pudimos activar el seguimiento WIPO.");cleanAutomaticParams()}finally{setWorking(false)}
  }

  function cleanAutomaticParams(){
    const url=new URL(window.location.href)
    for(const key of ["auto","feedUrl","nonce","autoError"])url.searchParams.delete(key)
    window.history.replaceState({},"",`${url.pathname}${url.search}${url.hash}`)
  }

  function startAutomaticConnection(event:FormEvent){
    event.preventDefault();if(query.trim().length<2||working)return
    setError(null);setAutoMessage(null)
    if(!connectorReady){setAutoState("connector_missing");return}
    const nonce=window.crypto.randomUUID()
    const pending:PendingAutomaticConnection={query:query.trim(),watchType:type,startedAt:Date.now()}
    window.localStorage.setItem(pendingStorageKey(nonce),JSON.stringify(pending))
    activeNonce.current=nonce
    setWorking(true);setAutoState("starting");setAutoMessage("Abriendo WIPO de forma segura…")
    window.postMessage({source:APP_SOURCE,type:"VIDENTIA_WIPO_CONNECT",query:pending.query,watchType:pending.watchType,nonce},window.location.origin)
    window.setTimeout(()=>{
      if(activeNonce.current!==nonce)return
      window.localStorage.removeItem(pendingStorageKey(nonce));activeNonce.current=null;setWorking(false);setAutoState("error");setError("La conexión con WIPO expiró. Intenta activar el seguimiento nuevamente.")
    },AUTO_TTL_MS)
  }

  async function refreshSources(){
    if(working)return;setWorking(true);setError(null)
    try{const response=await fetch("/api/patents/wipo-rss/watches",{method:"PUT"});const payload=await response.json().catch(()=>({}));if(!response.ok||payload.ok===false){const failed=Array.isArray(payload.results)?payload.results.find((item:{ok?:boolean;error?:string})=>item.ok===false):null;throw new Error(failed?.error||payload.error||"No pudimos consultar WIPO.")}await load()}catch(cause){setError(cause instanceof Error?cause.message:"No pudimos consultar WIPO.")}finally{setWorking(false)}
  }

  async function toggle(watch:Watch){const response=await fetch("/api/patents/wipo-rss/watches",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id:watch.id,active:!watch.is_active})});if(!response.ok){setError("No pudimos actualizar el seguimiento WIPO.");return}await load()}
  async function remove(id:string){const response=await fetch(`/api/patents/wipo-rss/watches?id=${encodeURIComponent(id)}`,{method:"DELETE"});if(!response.ok){setError("No pudimos eliminar el seguimiento WIPO.");return}await load()}

  const active=watches.filter(item=>item.is_active)
  const verified=watches.filter(item=>item.source_status==="available"&&item.source_last_checked_at)

  return <OperationalPage>
    <Button asChild variant="ghost" size="sm" className="mb-4 w-fit px-0 text-muted-foreground hover:bg-transparent hover:text-white"><Link href="/patentes"><ArrowLeft className="h-4 w-4"/>Volver a Patentes</Link></Button>

    <OperationalHeader eyebrow="VIDENTIA / Patentes / WIPO" title="Seguimiento WIPO." description={<>Escribe qué quieres seguir. VIDENTIA prepara WIPO, conecta la fuente y mantiene el monitoreo automáticamente.</>} meta={<><span>WIPO PATENTSCOPE</span><span>Cada 6 h</span><span>Sin configuración técnica</span></>} actions={watches.length?<Button variant="ghost" disabled={working} onClick={()=>setShowConnect(value=>!value)}>{showConnect?<ChevronUp className="h-4 w-4"/>:<Plus className="h-4 w-4"/>}{showConnect?"Cerrar":"Añadir seguimiento"}</Button>:undefined}/>

    <section className="py-7"><OperationalPanel className="overflow-hidden p-0"><div className="grid md:grid-cols-3">
      <div className="border-b border-border/80 p-5 md:border-b-0 md:border-r"><p className="text-2xl font-light text-[#96B5A6]">1</p><h2 className="mt-3 text-base font-medium text-white">Escribe qué seguir</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Empresa, tecnología, tema o clasificación IPC.</p></div>
      <div className="border-b border-border/80 p-5 md:border-b-0 md:border-r"><p className="text-2xl font-light text-[#96B5A6]">2</p><h2 className="mt-3 text-base font-medium text-white">VIDENTIA lo conecta</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Abrimos WIPO, reutilizamos o preparamos la consulta y conectamos el seguimiento por ti.</p></div>
      <div className="p-5"><p className="text-2xl font-light text-[#96B5A6]">3</p><h2 className="mt-3 text-base font-medium text-white">Recibe novedades</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">VIDENTIA revisa cada 6 horas. Tú vuelves sólo cuando haya algo relevante.</p><div className="mt-4 flex flex-wrap gap-2"><Button asChild size="sm" disabled={!watches.length}><Link href="/monitorear">Ver novedades</Link></Button><Button variant="ghost" size="sm" onClick={()=>void refreshSources()} disabled={loading||working||active.length===0}>{working?<Loader2 className="h-4 w-4 animate-spin"/>:<RefreshCw className="h-4 w-4"/>}Revisar ahora</Button></div></div>
    </div></OperationalPanel></section>

    {showConnect?<section className="pb-8"><OperationalPanel><form onSubmit={startAutomaticConnection}>
      <OperationalSectionHeader eyebrow="Nuevo seguimiento" title="¿Qué quieres seguir en WIPO?" meta="Automático"/>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">No necesitas crear enlaces, copiar RSS ni validar fuentes. VIDENTIA usa tu sesión WIPO para completar la conexión y luego mantiene el seguimiento por sí solo.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-[150px_1fr_auto]"><select disabled={working} value={type} onChange={event=>setType(event.target.value as "company"|"ipc")} className="h-10 rounded-[9px] border border-input bg-background px-3 text-sm text-white disabled:opacity-60"><option value="company">Empresa / tema</option><option value="ipc">IPC</option></select><Input disabled={working} value={query} onChange={event=>setQuery(event.target.value)} maxLength={160} placeholder="Ej: ai automation" autoComplete="off"/><Button disabled={working||query.trim().length<2}>{working?<Loader2 className="h-4 w-4 animate-spin"/>:<Plus className="h-4 w-4"/>}Activar seguimiento</Button></div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">{connectorReady===null?<><Loader2 className="h-3.5 w-3.5 animate-spin"/>Comprobando conexión WIPO…</>:connectorReady?<><CheckCircle2 className="h-3.5 w-3.5 text-[#96B5A6]"/><span className="text-[#B9D2C6]">Conector WIPO listo.</span></>:<><span>Conector WIPO no detectado.</span><Button asChild type="button" variant="outline" size="sm"><Link href="/patentes/wipo/conector">Activar una vez</Link></Button></>}</div>
      {autoState==="starting"||autoState==="waiting_wipo"||autoState==="connecting"?<div className="mt-5 border-y border-border/80 py-4"><div className="flex items-center gap-3"><Loader2 className="h-4 w-4 animate-spin text-[#96B5A6]"/><div><p className="text-sm font-medium text-white">Conectando seguimiento</p><p className="mt-1 text-xs text-muted-foreground">{autoMessage}</p></div></div></div>:null}
      {autoState==="connected"?<div className="mt-5 border-y border-[#31564F] py-4"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#96B5A6]"/><div><p className="text-sm font-medium text-[#E7DFCE]">Seguimiento activo</p><p className="mt-1 text-xs leading-5 text-[#B9D2C6]">{autoMessage}</p></div></div></div>:null}
      {autoState==="connector_missing"?<div className="mt-5 border-y border-[#5A4B32] py-4"><p className="text-sm font-medium text-[#E7DFCE]">Activa el conector WIPO una sola vez.</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Después de esa activación, cada nuevo seguimiento será automático y no volverás a copiar enlaces.</p><Button asChild type="button" variant="outline" size="sm" className="mt-3"><Link href="/patentes/wipo/conector">Configurar conector</Link></Button></div>:null}
    </form></OperationalPanel></section>:null}

    <section className="pb-8"><OperationalPanel><OperationalSectionHeader eyebrow="Tus seguimientos" title="WIPO" meta={loading?"Cargando…":`${active.length} activos · ${verified.length} verificados`}/>
      {loading?<div className="mt-5 flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Cargando…</div>:watches.length?<div className="mt-5 divide-y divide-border/80 border-y border-border/80">{watches.map(watch=><div key={watch.id} className="py-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2"><Badge variant="outline">{watch.watch_type==="ipc"?"IPC":"Empresa / tema"}</Badge><Badge className={watch.is_active?"bg-[#173B37] text-[#96B5A6]":""} variant={watch.is_active?undefined:"secondary"}>{watch.is_active?"Seguimiento activo":"Pausado"}</Badge>{watch.source_status==="degraded"?<Badge className="bg-[#5A432B] text-[#E8CFAE]">Fuente degradada</Badge>:null}</div><p className="mt-3 text-base font-medium text-white">{watch.query}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{watch.source_last_checked_at?`Última revisión ${new Date(watch.source_last_checked_at).toLocaleString("es-CL")}.`:(watch.is_active?"Primera revisión pendiente.":"Pausado antes de la primera revisión.")}</p>{watch.source_last_error?<p className="mt-2 text-[10px] leading-5 text-[#D6A46F]">{watch.source_last_error}</p>:null}</div><div className="flex flex-wrap gap-2"><Button variant="ghost" size="sm" onClick={()=>void toggle(watch)}>{watch.is_active?<Pause className="h-3.5 w-3.5"/>:<Play className="h-3.5 w-3.5"/>}{watch.is_active?"Pausar":"Reactivar"}</Button><Button variant="ghost" size="sm" onClick={()=>void remove(watch.id)}><Trash2 className="h-3.5 w-3.5"/>Eliminar</Button></div></div><details className="mt-4 border-t border-border/60 pt-3"><summary className="cursor-pointer text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Detalles técnicos</summary><div className="mt-3"><p className="break-all font-mono text-[10px] leading-5 text-muted-foreground">{watch.source_url}</p><Button asChild variant="ghost" size="sm" className="mt-2"><a href={watch.source_url} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5"/>Abrir origen</a></Button></div></details></div>)}</div>:<div className="mt-5 border-y border-border/80 py-8"><p className="text-sm font-medium text-white">Empieza con una frase.</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Escribe qué quieres seguir y VIDENTIA se encarga de la conexión con WIPO.</p></div>}
    </OperationalPanel></section>

    {error?<div role="alert" className="mb-8 bg-[#3A2525] p-4 text-sm text-[#E8AAA3]">{error}</div>:null}
  </OperationalPage>
}
