"use client"

import Link from "next/link"
import { type FormEvent, useEffect, useState } from "react"
import { ArrowLeft, Check, ChevronDown, ChevronUp, Copy, ExternalLink, Globe2, Loader2, Pause, Play, Plus, RefreshCw, Trash2 } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Watch = { id:string; watch_type:"company"|"ipc"; query:string; is_active:boolean; source_url:string; source_status:"available"|"degraded"|"not_configured"; source_last_error:string|null; source_last_checked_at:string|null; created_at:string; updated_at:string }
type Preview = { source:string; availability:string; title:string|null; resultCount:number; retrievedAt:string; items:Array<{sourceRecordId:string;publicationNumber:string|null;title:string;publicationDate:string|null;url:string}>; limitation:string }

const WIPO_SAVED_QUERIES_URL="https://patentscope.wipo.int/search/en/reg/user_queries.jsf"

export default function WipoPatentWatchesPage(){
  const [watches,setWatches]=useState<Watch[]>([])
  const [type,setType]=useState<"company"|"ipc">("company")
  const [query,setQuery]=useState("")
  const [feedUrl,setFeedUrl]=useState("")
  const [preview,setPreview]=useState<Preview|null>(null)
  const [loading,setLoading]=useState(true)
  const [working,setWorking]=useState(false)
  const [showConnect,setShowConnect]=useState(false)
  const [copiedId,setCopiedId]=useState<string|null>(null)
  const [error,setError]=useState<string|null>(null)

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

  async function refreshSources(){
    if(working)return;setWorking(true);setError(null)
    try{const response=await fetch("/api/patents/wipo-rss/watches",{method:"PUT"});const payload=await response.json().catch(()=>({}));if(!response.ok||payload.ok===false){const failed=Array.isArray(payload.results)?payload.results.find((item:{ok?:boolean;error?:string})=>item.ok===false):null;throw new Error(failed?.error||payload.error||"No pudimos consultar WIPO.")}await load()}catch(cause){setError(cause instanceof Error?cause.message:"No pudimos consultar WIPO.")}finally{setWorking(false)}
  }

  async function copySourceUrl(watch:Watch){
    try{await navigator.clipboard.writeText(watch.source_url);setCopiedId(watch.id);window.setTimeout(()=>setCopiedId(current=>current===watch.id?null:current),1800)}catch{setError("No pudimos copiar la URL RSS. Selecciona el campo y cópiala manualmente.")}
  }

  async function previewFeed(){
    if(!feedUrl.trim()||working)return;setWorking(true);setError(null);setPreview(null)
    try{const response=await fetch("/api/patents/wipo-rss/preview",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({url:feedUrl.trim()})});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||"No pudimos validar el RSS.");setPreview(payload)}catch(cause){setError(cause instanceof Error?cause.message:"No pudimos validar el RSS.")}finally{setWorking(false)}
  }

  async function create(event:FormEvent){
    event.preventDefault();if(query.trim().length<2||!feedUrl.trim()||working)return;setWorking(true);setError(null)
    try{const response=await fetch("/api/patents/wipo-rss/watches",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({type,query:query.trim(),feedUrl:feedUrl.trim()})});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||"No pudimos crear el watch WIPO.");setQuery("");setFeedUrl("");setPreview(null);setShowConnect(false);await load()}catch(cause){setError(cause instanceof Error?cause.message:"No pudimos crear el watch WIPO.")}finally{setWorking(false)}
  }

  async function toggle(watch:Watch){const response=await fetch("/api/patents/wipo-rss/watches",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id:watch.id,active:!watch.is_active})});if(!response.ok){setError("No pudimos actualizar el watch WIPO.");return}await load()}
  async function remove(id:string){const response=await fetch(`/api/patents/wipo-rss/watches?id=${encodeURIComponent(id)}`,{method:"DELETE"});if(!response.ok){setError("No pudimos eliminar el watch WIPO.");return}await load()}

  const active=watches.filter(item=>item.is_active)
  const verified=watches.filter(item=>item.source_status==="available"&&item.source_last_checked_at)
  return <OperationalPage>
    <Button asChild variant="ghost" size="sm" className="mb-4 w-fit px-0 text-muted-foreground hover:bg-transparent hover:text-white"><Link href="/patentes"><ArrowLeft className="h-4 w-4"/>Volver a Patentes</Link></Button>
    <OperationalHeader eyebrow="VIDENTIA / Patentes / WIPO" title="Monitoreo internacional con PATENTSCOPE." description={<>Las consultas que ya aparecen conectadas funcionan automáticamente. <strong className="font-medium text-white">No necesitas volver a copiar ni pegar un RSS para usarlas.</strong></>} meta={<><span>WIPO PATENTSCOPE</span><span>Polling cada 6 h</span><span>Provenance por publicación</span><span>Sin inferencia jurídica</span></>} actions={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>void refreshSources()} disabled={loading||working||active.length===0}>{working?<Loader2 className="h-4 w-4 animate-spin"/>:<RefreshCw className="h-4 w-4"/>}Actualizar WIPO ahora</Button><Button variant="ghost" onClick={()=>setShowConnect(value=>!value)}>{showConnect?<ChevronUp className="h-4 w-4"/>:<Plus className="h-4 w-4"/>}{showConnect?"Ocultar configuración":"Conectar otra consulta"}</Button></div>}/>
    <OperationalMetricRail>
      <OperationalMetric value={active.length} label="WIPO activos" detail={`${watches.length} configurados`} tone={active.length?"success":"neutral"}/>
      <OperationalMetric value={verified.length} label="Fuentes verificadas" detail="Con checkpoint de polling" tone={verified.length?"success":"neutral"}/>
      <OperationalMetric value={watches.filter(item=>item.source_status==="degraded").length} label="Fuentes degradadas" detail="Requieren revisión" tone={watches.some(item=>item.source_status==="degraded")?"warning":"neutral"}/>
    </OperationalMetricRail>

    <section className="py-8">
      <OperationalPanel><OperationalSectionHeader eyebrow="Fuentes conectadas" title="Consultas WIPO activas" meta={`${active.length} activas`}/>{loading?<div className="mt-5 flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Cargando…</div>:watches.length?<div className="mt-5 divide-y divide-border/80 border-y border-border/80">{watches.map(watch=><div key={watch.id} className="py-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2"><Badge variant="outline">{watch.watch_type==="ipc"?"IPC":"Empresa / tema"}</Badge><Badge className={watch.source_status==="available"?"bg-[#173B37] text-[#96B5A6]":"bg-[#5A432B] text-[#E8CFAE]"}>{watch.source_status==="available"?"Conectada":"Degradada"}</Badge>{!watch.source_last_checked_at?<Badge variant="secondary">Primera actualización pendiente</Badge>:<Badge variant="secondary">Verificada</Badge>}{!watch.is_active?<Badge variant="secondary">Pausada</Badge>:null}</div><p className="mt-3 text-base font-medium text-white">{watch.query}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{watch.source_last_checked_at?`Última comprobación ${new Date(watch.source_last_checked_at).toLocaleString("es-CL")}.`:"La fuente ya está conectada. Pulsa “Actualizar WIPO ahora” para establecer el primer baseline; no necesitas pegar ningún enlace."}</p>{watch.source_last_error?<p className="mt-2 text-[10px] leading-5 text-[#D6A46F]">{watch.source_last_error}</p>:null}</div><div className="flex flex-wrap gap-2"><Button variant="ghost" size="sm" onClick={()=>void toggle(watch)}>{watch.is_active?<Pause className="h-3.5 w-3.5"/>:<Play className="h-3.5 w-3.5"/>}{watch.is_active?"Pausar":"Activar"}</Button><Button variant="ghost" size="sm" onClick={()=>void remove(watch.id)}><Trash2 className="h-3.5 w-3.5"/>Eliminar</Button></div></div><details className="mt-4 border-t border-border/60 pt-3"><summary className="cursor-pointer text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Detalles técnicos del origen</summary><div className="mt-3"><label className="block text-[9px] uppercase tracking-[0.18em] text-muted-foreground">RSS oficial almacenado</label><Input readOnly value={watch.source_url} title={watch.source_url} onFocus={event=>event.currentTarget.select()} className="mt-1 h-9 font-mono text-[10px]" aria-label={`URL RSS completa de ${watch.query}`}/><div className="mt-2 flex flex-wrap gap-2"><Button type="button" variant="ghost" size="sm" onClick={()=>void copySourceUrl(watch)}>{copiedId===watch.id?<Check className="h-3.5 w-3.5"/>:<Copy className="h-3.5 w-3.5"/>}{copiedId===watch.id?"Copiada":"Copiar RSS"}</Button><Button asChild variant="ghost" size="sm"><a href={watch.source_url} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5"/>Abrir origen</a></Button></div></div></details></div>)}</div>:<div className="mt-5 border-y border-border/80 py-8"><p className="text-sm text-muted-foreground">Todavía no hay consultas WIPO conectadas.</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Conecta una consulta guardada de PATENTSCOPE una sola vez; después VIDENTIA conserva el origen y lo actualiza automáticamente.</p></div>}</OperationalPanel>
    </section>

    {showConnect?<section className="pb-8"><OperationalPanel><form onSubmit={create}>
      <OperationalSectionHeader eyebrow="Configuración avanzada" title="Conectar una consulta WIPO nueva" meta="Sólo para altas nuevas"/>
      <div className="mt-4 bg-[#10272D] p-4 text-xs leading-5 text-[#BDBEBD]"><strong className="font-medium text-white">Si tu consulta ya aparece arriba como conectada, no hagas nada aquí.</strong> Este bloque se usa únicamente para registrar otra consulta guardada de PATENTSCOPE.</div>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">PATENTSCOPE no expone tus Saved Queries a VIDENTIA mediante una API autenticada. Por eso, para una consulta nueva, WIPO debe generar una vez su URL RSS pública. Después VIDENTIA la guarda y deja de pedírtela.</p>
      <div className="mt-4"><Button asChild type="button" variant="outline" size="sm"><a href={WIPO_SAVED_QUERIES_URL} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5"/>Abrir Saved Queries en WIPO</a></Button></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-[150px_1fr]"><select value={type} onChange={event=>setType(event.target.value as "company"|"ipc")} className="h-10 rounded-[9px] border border-input bg-background px-3 text-sm text-white"><option value="company">Empresa / tema</option><option value="ipc">IPC</option></select><Input value={query} onChange={event=>setQuery(event.target.value)} maxLength={160} placeholder="Nombre de la consulta guardada"/></div>
      <Input className="mt-3 font-mono text-[11px]" value={feedUrl} onChange={event=>{setFeedUrl(event.target.value);setPreview(null)}} maxLength={2048} placeholder="URL RSS completa generada por PATENTSCOPE" aria-label="URL RSS completa de PATENTSCOPE"/>
      <p className="mt-2 text-[10px] leading-4 text-muted-foreground">Este dato se pide una sola vez al conectar la fuente. Normalmente termina en <span className="font-mono text-[#BDBEBD]">/rss.xml</span>.</p>
      <div className="mt-4 flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={()=>void previewFeed()} disabled={working||!feedUrl.trim()}>{working?<Loader2 className="h-4 w-4 animate-spin"/>:<Globe2 className="h-4 w-4"/>}Validar origen</Button><Button disabled={working||query.trim().length<2||!feedUrl.trim()}><Plus className="h-4 w-4"/>Conectar consulta</Button></div>
      {preview?<div className="mt-5 border-y border-border/80 py-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-medium text-white">{preview.title||preview.source}</p><Badge className="bg-[#173B37] text-[#96B5A6]">{preview.resultCount} observados</Badge></div>{preview.items.slice(0,3).map(item=><div key={item.sourceRecordId} className="mt-3 border-t border-border/60 pt-3"><p className="text-xs leading-5 text-[#BDBEBD]">{item.title}</p><p className="mt-1 text-[10px] text-muted-foreground">{item.publicationNumber||"Sin número extraído"}{item.publicationDate?` · ${item.publicationDate}`:""}</p></div>)}<p className="mt-3 text-[10px] leading-5 text-muted-foreground">{preview.limitation}</p></div>:null}
    </form></OperationalPanel></section>:null}
    {error?<div role="alert" className="mb-8 bg-[#3A2525] p-4 text-sm text-[#E8AAA3]">{error}</div>:null}
  </OperationalPage>
}
