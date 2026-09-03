"use client"

import Link from "next/link"
import { type FormEvent, useEffect, useState } from "react"
import { ArrowLeft, ExternalLink, Globe2, Loader2, Pause, Play, Plus, RefreshCw, Trash2 } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Watch = { id:string; watch_type:"company"|"ipc"; query:string; is_active:boolean; source_url:string; source_status:"available"|"degraded"|"not_configured"; source_last_error:string|null; source_last_checked_at:string|null; created_at:string; updated_at:string }
type Preview = { source:string; availability:string; title:string|null; resultCount:number; retrievedAt:string; items:Array<{sourceRecordId:string;publicationNumber:string|null;title:string;publicationDate:string|null;url:string}>; limitation:string }

export default function WipoPatentWatchesPage(){
  const [watches,setWatches]=useState<Watch[]>([])
  const [type,setType]=useState<"company"|"ipc">("company")
  const [query,setQuery]=useState("")
  const [feedUrl,setFeedUrl]=useState("")
  const [preview,setPreview]=useState<Preview|null>(null)
  const [loading,setLoading]=useState(true)
  const [working,setWorking]=useState(false)
  const [error,setError]=useState<string|null>(null)

  async function load(){
    setLoading(true);setError(null)
    try{const response=await fetch("/api/patents/wipo-rss/watches",{cache:"no-store"});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||"No pudimos cargar WIPO.");setWatches(Array.isArray(payload.watches)?payload.watches:[])}catch(cause){setError(cause instanceof Error?cause.message:"No pudimos cargar WIPO.")}finally{setLoading(false)}
  }
  useEffect(()=>{void load()},[])

  async function previewFeed(){
    if(!feedUrl.trim()||working)return;setWorking(true);setError(null);setPreview(null)
    try{const response=await fetch("/api/patents/wipo-rss/preview",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({url:feedUrl.trim()})});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||"No pudimos validar el RSS.");setPreview(payload)}catch(cause){setError(cause instanceof Error?cause.message:"No pudimos validar el RSS.")}finally{setWorking(false)}
  }

  async function create(event:FormEvent){
    event.preventDefault();if(query.trim().length<2||!feedUrl.trim()||working)return;setWorking(true);setError(null)
    try{const response=await fetch("/api/patents/wipo-rss/watches",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({type,query:query.trim(),feedUrl:feedUrl.trim()})});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||"No pudimos crear el watch WIPO.");setQuery("");setFeedUrl("");setPreview(null);await load()}catch(cause){setError(cause instanceof Error?cause.message:"No pudimos crear el watch WIPO.")}finally{setWorking(false)}
  }

  async function toggle(watch:Watch){const response=await fetch("/api/patents/wipo-rss/watches",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id:watch.id,active:!watch.is_active})});if(!response.ok){setError("No pudimos actualizar el watch WIPO.");return}await load()}
  async function remove(id:string){const response=await fetch(`/api/patents/wipo-rss/watches?id=${encodeURIComponent(id)}`,{method:"DELETE"});if(!response.ok){setError("No pudimos eliminar el watch WIPO.");return}await load()}

  const active=watches.filter(item=>item.is_active)
  return <OperationalPage>
    <Button asChild variant="ghost" size="sm" className="mb-4 w-fit px-0 text-muted-foreground hover:bg-transparent hover:text-white"><Link href="/patentes"><ArrowLeft className="h-4 w-4"/>Volver a Patentes</Link></Button>
    <OperationalHeader eyebrow="VIDENTIA / Patentes / WIPO" title="PATENTSCOPE como fuente internacional observable." description={<>VIDENTIA consume el RSS oficial de consultas públicas guardadas en PATENTSCOPE. No usa cookies de tu sesión, no automatiza la interfaz web y no scrapea resultados.</>} meta={<><span>WIPO PATENTSCOPE RSS</span><span>Polling cada 6 h</span><span>Provenance por publicación</span><span>Sin inferencia jurídica</span></>} actions={<Button variant="outline" onClick={()=>void load()} disabled={loading}><RefreshCw className="h-4 w-4"/>Actualizar estado</Button>}/>
    <OperationalMetricRail>
      <OperationalMetric value={active.length} label="WIPO activos" detail={`${watches.length} configurados`} tone={active.length?"success":"neutral"}/>
      <OperationalMetric value={watches.filter(item=>item.source_status==="available").length} label="Fuentes disponibles" detail="Último chequeo respondió" tone="success"/>
      <OperationalMetric value={watches.filter(item=>item.source_status==="degraded").length} label="Fuentes degradadas" detail="Requieren revisión" tone={watches.some(item=>item.source_status==="degraded")?"warning":"neutral"}/>
    </OperationalMetricRail>

    <section className="grid gap-8 py-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
      <OperationalPanel><form onSubmit={create}>
        <OperationalSectionHeader eyebrow="Nueva fuente WIPO" title="Conecta una consulta guardada de PATENTSCOPE" meta="RSS oficial · consulta pública"/>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">En PATENTSCOPE: ejecuta la búsqueda, guárdala con <strong className="font-medium text-white">Private Query desmarcado</strong>, abre el icono RSS de Saved Queries y copia su URL. WIPO exige este flujo para habilitar RSS.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-[150px_1fr]"><select value={type} onChange={event=>setType(event.target.value as "company"|"ipc")} className="h-10 rounded-[9px] border border-input bg-background px-3 text-sm text-white"><option value="company">Empresa / tema</option><option value="ipc">IPC</option></select><Input value={query} onChange={event=>setQuery(event.target.value)} maxLength={160} placeholder="Nombre interno del watch"/></div>
        <Input className="mt-3" value={feedUrl} onChange={event=>{setFeedUrl(event.target.value);setPreview(null)}} maxLength={2048} placeholder="https://patentscope.wipo.int/search/... RSS" aria-label="URL RSS de PATENTSCOPE"/>
        <div className="mt-4 flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={()=>void previewFeed()} disabled={working||!feedUrl.trim()}>{working?<Loader2 className="h-4 w-4 animate-spin"/>:<Globe2 className="h-4 w-4"/>}Validar RSS</Button><Button disabled={working||query.trim().length<2||!feedUrl.trim()}><Plus className="h-4 w-4"/>Crear watch</Button></div>
        {preview?<div className="mt-5 border-y border-border/80 py-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-medium text-white">{preview.title||preview.source}</p><Badge className="bg-[#173B37] text-[#96B5A6]">{preview.resultCount} observados</Badge></div>{preview.items.slice(0,3).map(item=><div key={item.sourceRecordId} className="mt-3 border-t border-border/60 pt-3"><p className="text-xs leading-5 text-[#BDBEBD]">{item.title}</p><p className="mt-1 text-[10px] text-muted-foreground">{item.publicationNumber||"Sin número extraído"}{item.publicationDate?` · ${item.publicationDate}`:""}</p></div>)}<p className="mt-3 text-[10px] leading-5 text-muted-foreground">{preview.limitation}</p></div>:null}
      </form></OperationalPanel>

      <OperationalPanel><OperationalSectionHeader eyebrow="Fuentes conectadas" title="WIPO PATENTSCOPE" meta={`${active.length} activas`}/>{loading?<div className="mt-5 flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Cargando…</div>:watches.length?<div className="mt-5 divide-y divide-border/80 border-y border-border/80">{watches.map(watch=><div key={watch.id} className="py-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap gap-2"><Badge variant="outline">{watch.watch_type==="ipc"?"IPC":"Empresa / tema"}</Badge><Badge className={watch.source_status==="available"?"bg-[#173B37] text-[#96B5A6]":"bg-[#5A432B] text-[#E8CFAE]"}>{watch.source_status==="available"?"Disponible":"Degradada"}</Badge>{!watch.is_active?<Badge variant="secondary">Pausado</Badge>:null}</div><p className="mt-3 text-sm font-medium text-white">{watch.query}</p><p className="mt-2 break-all text-[10px] leading-5 text-muted-foreground">{watch.source_url}</p>{watch.source_last_error?<p className="mt-2 text-[10px] leading-5 text-[#D6A46F]">{watch.source_last_error}</p>:null}</div><a href={watch.source_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-white"><ExternalLink className="h-4 w-4"/></a></div><div className="mt-3 flex gap-2"><Button variant="ghost" size="sm" onClick={()=>void toggle(watch)}>{watch.is_active?<Pause className="h-3.5 w-3.5"/>:<Play className="h-3.5 w-3.5"/>}{watch.is_active?"Pausar":"Activar"}</Button><Button variant="ghost" size="sm" onClick={()=>void remove(watch.id)}><Trash2 className="h-3.5 w-3.5"/>Eliminar</Button></div></div>)}</div>:<p className="mt-5 border-y border-border/80 py-8 text-sm text-muted-foreground">Todavía no hay feeds WIPO conectados.</p>}</OperationalPanel>
    </section>
    {error?<div role="alert" className="mb-8 bg-[#3A2525] p-4 text-sm text-[#E8AAA3]">{error}</div>:null}
  </OperationalPage>
}
