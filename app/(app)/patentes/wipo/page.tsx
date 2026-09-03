"use client"

import Link from "next/link"
import { type FormEvent, useEffect, useState } from "react"
import { ArrowLeft, Check, ChevronUp, Copy, ExternalLink, Globe2, Loader2, Pause, Play, Plus, RefreshCw, Trash2 } from "lucide-react"
import { OperationalHeader, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
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
    try{const response=await fetch("/api/patents/wipo-rss/watches",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({type,query:query.trim(),feedUrl:feedUrl.trim()})});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||"No pudimos crear el seguimiento WIPO.");setQuery("");setFeedUrl("");setPreview(null);setShowConnect(false);await load()}catch(cause){setError(cause instanceof Error?cause.message:"No pudimos crear el seguimiento WIPO.")}finally{setWorking(false)}
  }

  async function toggle(watch:Watch){const response=await fetch("/api/patents/wipo-rss/watches",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id:watch.id,active:!watch.is_active})});if(!response.ok){setError("No pudimos actualizar el seguimiento WIPO.");return}await load()}
  async function remove(id:string){const response=await fetch(`/api/patents/wipo-rss/watches?id=${encodeURIComponent(id)}`,{method:"DELETE"});if(!response.ok){setError("No pudimos eliminar el seguimiento WIPO.");return}await load()}

  const active=watches.filter(item=>item.is_active)
  const verified=watches.filter(item=>item.source_status==="available"&&item.source_last_checked_at)

  return <OperationalPage>
    <Button asChild variant="ghost" size="sm" className="mb-4 w-fit px-0 text-muted-foreground hover:bg-transparent hover:text-white"><Link href="/patentes"><ArrowLeft className="h-4 w-4"/>Volver a Patentes</Link></Button>

    <OperationalHeader
      eyebrow="VIDENTIA / Patentes / WIPO"
      title="WIPO en 3 pasos."
      description={<>Conecta una consulta una vez. VIDENTIA la sigue automáticamente y tú vuelves sólo cuando haya algo que revisar.</>}
      meta={<><span>WIPO PATENTSCOPE</span><span>Cada 6 h</span><span>Sin inferencia jurídica</span></>}
      actions={watches.length?<Button variant="ghost" onClick={()=>setShowConnect(value=>!value)}>{showConnect?<ChevronUp className="h-4 w-4"/>:<Plus className="h-4 w-4"/>}{showConnect?"Cerrar":"Añadir seguimiento"}</Button>:undefined}
    />

    <section className="py-7">
      <OperationalPanel className="overflow-hidden p-0">
        <div className="grid md:grid-cols-3">
          <div className="border-b border-border/80 p-5 md:border-b-0 md:border-r">
            <p className="text-2xl font-light text-[#96B5A6]">1</p>
            <h2 className="mt-3 text-base font-medium text-white">Conecta</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Elige qué consulta de WIPO quieres seguir.</p>
            <div className="mt-4">{watches.length?<Badge className="bg-[#173B37] text-[#96B5A6]">Listo · {watches.length} conectado{watches.length===1?"":"s"}</Badge>:<Button size="sm" onClick={()=>setShowConnect(true)}><Plus className="h-4 w-4"/>Conectar seguimiento</Button>}</div>
          </div>

          <div className="border-b border-border/80 p-5 md:border-b-0 md:border-r">
            <p className="text-2xl font-light text-[#96B5A6]">2</p>
            <h2 className="mt-3 text-base font-medium text-white">VIDENTIA monitorea</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Revisamos automáticamente cada 6 horas. No tienes que volver a hacer nada.</p>
            <div className="mt-4">{active.length?<Badge className="bg-[#173B37] text-[#96B5A6]">Activo · {active.length} seguimiento{active.length===1?"":"s"}</Badge>:<Badge variant="secondary">Pendiente</Badge>}</div>
          </div>

          <div className="p-5">
            <p className="text-2xl font-light text-[#96B5A6]">3</p>
            <h2 className="mt-3 text-base font-medium text-white">Revisa novedades</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Cuando vuelvas, abre sólo lo nuevo detectado por tus seguimientos.</p>
            <div className="mt-4 flex flex-wrap gap-2"><Button asChild size="sm" disabled={!watches.length}><Link href="/monitorear">Ver novedades</Link></Button><Button variant="ghost" size="sm" onClick={()=>void refreshSources()} disabled={loading||working||active.length===0}>{working?<Loader2 className="h-4 w-4 animate-spin"/>:<RefreshCw className="h-4 w-4"/>}Revisar ahora</Button></div>
          </div>
        </div>
      </OperationalPanel>
    </section>

    <section className="pb-8">
      <OperationalPanel>
        <OperationalSectionHeader eyebrow="Tus seguimientos" title="WIPO" meta={loading?"Cargando…":`${active.length} activos`}/>
        {loading?<div className="mt-5 flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Cargando…</div>:watches.length?<div className="mt-5 divide-y divide-border/80 border-y border-border/80">{watches.map(watch=><div key={watch.id} className="py-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2"><Badge variant="outline">{watch.watch_type==="ipc"?"IPC":"Empresa / tema"}</Badge><Badge className={watch.is_active?"bg-[#173B37] text-[#96B5A6]":""} variant={watch.is_active?undefined:"secondary"}>{watch.is_active?"Activo":"Pausado"}</Badge>{watch.source_status==="degraded"?<Badge className="bg-[#5A432B] text-[#E8CFAE]">Fuente degradada</Badge>:null}</div><p className="mt-3 text-base font-medium text-white">{watch.query}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{watch.source_last_checked_at?`Última revisión ${new Date(watch.source_last_checked_at).toLocaleString("es-CL")}.`:(watch.is_active?"Primera revisión pendiente.":"Pausado antes de la primera revisión.")}</p>{watch.source_last_error?<p className="mt-2 text-[10px] leading-5 text-[#D6A46F]">{watch.source_last_error}</p>:null}</div><div className="flex flex-wrap gap-2"><Button variant="ghost" size="sm" onClick={()=>void toggle(watch)}>{watch.is_active?<Pause className="h-3.5 w-3.5"/>:<Play className="h-3.5 w-3.5"/>}{watch.is_active?"Pausar":"Reactivar"}</Button><Button variant="ghost" size="sm" onClick={()=>void remove(watch.id)}><Trash2 className="h-3.5 w-3.5"/>Eliminar</Button></div></div><details className="mt-4 border-t border-border/60 pt-3"><summary className="cursor-pointer text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Detalles técnicos</summary><div className="mt-3"><label className="block text-[9px] uppercase tracking-[0.18em] text-muted-foreground">RSS oficial</label><Input readOnly value={watch.source_url} title={watch.source_url} onFocus={event=>event.currentTarget.select()} className="mt-1 h-9 font-mono text-[10px]" aria-label={`URL RSS completa de ${watch.query}`}/><div className="mt-2 flex flex-wrap gap-2"><Button type="button" variant="ghost" size="sm" onClick={()=>void copySourceUrl(watch)}>{copiedId===watch.id?<Check className="h-3.5 w-3.5"/>:<Copy className="h-3.5 w-3.5"/>}{copiedId===watch.id?"Copiada":"Copiar RSS"}</Button><Button asChild variant="ghost" size="sm"><a href={watch.source_url} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5"/>Abrir origen</a></Button></div></div></details></div>)}</div>:<div className="mt-5 border-y border-border/80 py-8"><p className="text-sm font-medium text-white">Empieza en el paso 1.</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Conecta una consulta WIPO una sola vez y VIDENTIA se encarga del seguimiento.</p></div>}
      </OperationalPanel>
    </section>

    {showConnect?<section className="pb-8"><OperationalPanel><form onSubmit={create}>
      <OperationalSectionHeader eyebrow="Paso 1" title="Conectar una consulta WIPO" meta="Sólo una vez"/>
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <div><p className="text-lg font-light text-[#96B5A6]">A</p><p className="mt-2 text-sm font-medium text-white">Abre tu consulta guardada</p><p className="mt-2 text-xs leading-5 text-muted-foreground">En PATENTSCOPE, abre Saved Queries y copia su RSS.</p><Button asChild type="button" variant="outline" size="sm" className="mt-3"><a href={WIPO_SAVED_QUERIES_URL} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5"/>Abrir WIPO</a></Button></div>
        <div><p className="text-lg font-light text-[#96B5A6]">B</p><p className="mt-2 text-sm font-medium text-white">Pega el RSS</p><p className="mt-2 text-xs leading-5 text-muted-foreground">VIDENTIA lo valida antes de guardarlo.</p></div>
        <div><p className="text-lg font-light text-[#96B5A6]">C</p><p className="mt-2 text-sm font-medium text-white">Activa el seguimiento</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Desde ahí la revisión continúa automáticamente cada 6 horas.</p></div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[150px_1fr]"><select value={type} onChange={event=>setType(event.target.value as "company"|"ipc")} className="h-10 rounded-[9px] border border-input bg-background px-3 text-sm text-white"><option value="company">Empresa / tema</option><option value="ipc">IPC</option></select><Input value={query} onChange={event=>setQuery(event.target.value)} maxLength={160} placeholder="Nombre del seguimiento"/></div>
      <Input className="mt-3 font-mono text-[11px]" value={feedUrl} onChange={event=>{setFeedUrl(event.target.value);setPreview(null)}} maxLength={2048} placeholder="Pega aquí la URL RSS de PATENTSCOPE" aria-label="URL RSS completa de PATENTSCOPE"/>
      <div className="mt-4 flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={()=>void previewFeed()} disabled={working||!feedUrl.trim()}>{working?<Loader2 className="h-4 w-4 animate-spin"/>:<Globe2 className="h-4 w-4"/>}Validar</Button><Button disabled={working||query.trim().length<2||!feedUrl.trim()}><Plus className="h-4 w-4"/>Activar seguimiento</Button></div>
      {preview?<div className="mt-5 border-y border-border/80 py-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-medium text-white">{preview.title||preview.source}</p><Badge className="bg-[#173B37] text-[#96B5A6]">{preview.resultCount} observados</Badge></div>{preview.items.slice(0,3).map(item=><div key={item.sourceRecordId} className="mt-3 border-t border-border/60 pt-3"><p className="text-xs leading-5 text-[#BDBEBD]">{item.title}</p><p className="mt-1 text-[10px] text-muted-foreground">{item.publicationNumber||"Sin número extraído"}{item.publicationDate?` · ${item.publicationDate}`:""}</p></div>)}<p className="mt-3 text-[10px] leading-5 text-muted-foreground">{preview.limitation}</p></div>:null}
    </form></OperationalPanel></section>:null}

    {error?<div role="alert" className="mb-8 bg-[#3A2525] p-4 text-sm text-[#E8AAA3]">{error}</div>:null}
  </OperationalPage>
}
