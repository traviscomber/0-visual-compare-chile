"use client"

import Link from "next/link"
import { type FormEvent, useEffect, useMemo, useState } from "react"
import { BellRing, Check, Clock3, ExternalLink, Loader2, Pause, Play, Plus, RefreshCw, Trash2 } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type WatchType = "brand" | "patent" | "technology"
type SearchScope = "chile" | "global" | "both"
type CommonWatch = {
  key: string
  id: string
  type: WatchType
  subtype: string
  query: string
  niceClasses: number[]
  searchScope: SearchScope | null
  isActive: boolean
  lastCheckedAt: string | null
  lastReviewedAt: string | null
  createdAt: string
  updatedAt: string
}
type CommonSignal = {
  key: string
  watchKey: string
  type: WatchType
  watchQuery: string
  source: string
  title: string
  detail: string | null
  occurredAt: string | null
  firstSeenAt: string
  relevance: "alta" | "media" | "baja"
  isNew: boolean
  href: string
}
type SignalSummary = { new:number; high:number; total:number; brand:number; patent:number; technology:number }

const EMPTY_SUMMARY: SignalSummary = { new:0, high:0, total:0, brand:0, patent:0, technology:0 }
const TYPE_LABEL: Record<WatchType,string> = { brand:"Marca", patent:"Patente", technology:"Tecnología" }
const SUBTYPE_OPTIONS: Record<WatchType,Array<{value:string;label:string}>> = {
  brand:[{value:"brand",label:"Marca"},{value:"owner",label:"Titular"}],
  patent:[{value:"company",label:"Empresa"},{value:"ipc",label:"IPC"}],
  technology:[{value:"technology",label:"Tecnología"},{value:"company",label:"Empresa"},{value:"competitor",label:"Competidor"}],
}

export default function CommonWatchesPage(){
  const [watches,setWatches]=useState<CommonWatch[]>([])
  const [signals,setSignals]=useState<CommonSignal[]>([])
  const [summary,setSummary]=useState<SignalSummary>(EMPTY_SUMMARY)
  const [type,setType]=useState<WatchType>("brand")
  const [subtype,setSubtype]=useState("brand")
  const [query,setQuery]=useState("")
  const [classes,setClasses]=useState("")
  const [scope,setScope]=useState<SearchScope>("both")
  const [showCreate,setShowCreate]=useState(false)
  const [showHistory,setShowHistory]=useState(false)
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [refreshing,setRefreshing]=useState(false)
  const [reviewing,setReviewing]=useState(false)
  const [error,setError]=useState<string|null>(null)

  const active=useMemo(()=>watches.filter(item=>item.isActive),[watches])
  const visibleSignals=useMemo(()=>showHistory?signals:signals.filter(item=>item.isNew),[signals,showHistory])
  const counts=useMemo(()=>({brand:active.filter(item=>item.type==="brand").length,patent:active.filter(item=>item.type==="patent").length,technology:active.filter(item=>item.type==="technology").length}),[active])

  async function load(){
    setLoading(true);setError(null)
    try{
      const [watchResponse,signalResponse]=await Promise.all([
        fetch("/api/intelligence/watches",{cache:"no-store"}),
        fetch("/api/intelligence/watches/signals",{cache:"no-store"}),
      ])
      const watchPayload=await watchResponse.json().catch(()=>({}))
      const signalPayload=await signalResponse.json().catch(()=>({}))
      if(!watchResponse.ok)throw new Error(watchPayload.error||"No pudimos cargar tus vigilancias.")
      if(!signalResponse.ok)throw new Error(signalPayload.error||"No pudimos construir el inbox de señales.")
      setWatches(Array.isArray(watchPayload.watches)?watchPayload.watches:[])
      setSignals(Array.isArray(signalPayload.signals)?signalPayload.signals:[])
      setSummary(signalPayload.summary??EMPTY_SUMMARY)
    }catch(cause){setError(cause instanceof Error?cause.message:"No pudimos cargar Vigilancias.")}finally{setLoading(false)}
  }

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search)
    const requested=params.get("type")
    if(requested==="brand"||requested==="patent"||requested==="technology"){
      setType(requested);setSubtype(SUBTYPE_OPTIONS[requested][0].value);setShowCreate(true)
    }
    const requestedQuery=params.get("q")?.trim()
    if(requestedQuery)setQuery(requestedQuery.slice(0,160))
    const requestedScope=params.get("scope")
    if(requestedScope==="chile"||requestedScope==="global"||requestedScope==="both")setScope(requestedScope)
    void load()
  },[])

  function changeType(next:WatchType){setType(next);setSubtype(SUBTYPE_OPTIONS[next][0].value);setClasses("");if(next!=="technology")setScope("both")}

  async function createWatch(event:FormEvent){
    event.preventDefault();if(query.trim().length<2||saving)return
    setSaving(true);setError(null)
    try{
      const niceClasses=type==="brand"?classes.split(/[\s,;]+/).map(Number).filter(value=>Number.isInteger(value)&&value>=1&&value<=45):[]
      const response=await fetch("/api/intelligence/watches",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({type,subtype,query:query.trim(),niceClasses,...(type==="technology"?{scope}:{})})})
      const payload=await response.json().catch(()=>({}))
      if(!response.ok)throw new Error(payload.error||"No pudimos crear la vigilancia.")
      setQuery("");setClasses("");setScope("both");setShowCreate(false);await load()
    }catch(cause){setError(cause instanceof Error?cause.message:"No pudimos crear la vigilancia.")}finally{setSaving(false)}
  }

  async function refreshSources(){
    if(refreshing)return
    setRefreshing(true);setError(null)
    try{
      const results=await Promise.allSettled([
        fetch("/api/intelligence/watch-signals",{cache:"no-store"}),
        fetch("/api/intelligence/strategic-watch-signals",{cache:"no-store"}),
        fetch("/api/patents/alerts",{cache:"no-store"}),
      ])
      const failed=results.filter(item=>item.status==="fulfilled"&&!item.value.ok).length+results.filter(item=>item.status==="rejected").length
      await load()
      if(failed)setError(`Actualizamos el inbox, pero ${failed} fuente${failed===1?"":"s"} no respondió correctamente.`)
    }finally{setRefreshing(false)}
  }

  async function markReviewed(){
    if(reviewing||!summary.new)return
    setReviewing(true);setError(null)
    try{
      const response=await fetch("/api/intelligence/watches/signals",{method:"POST",headers:{"content-type":"application/json"},body:"{}"})
      const payload=await response.json().catch(()=>({}))
      if(!response.ok)throw new Error(payload.error||"No pudimos registrar la revisión.")
      await load()
    }catch(cause){setError(cause instanceof Error?cause.message:"No pudimos registrar la revisión.")}finally{setReviewing(false)}
  }

  async function toggle(watch:CommonWatch){
    const response=await fetch("/api/intelligence/watches",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({key:watch.key,active:!watch.isActive})})
    if(!response.ok){setError("No pudimos actualizar la vigilancia.");return}
    await load()
  }

  async function remove(key:string){
    const response=await fetch(`/api/intelligence/watches?key=${encodeURIComponent(key)}`,{method:"DELETE"})
    if(!response.ok){setError("No pudimos eliminar la vigilancia.");return}
    await load()
  }

  return <OperationalPage>
    <OperationalHeader
      eyebrow="VIDENTIA / Watches"
      title="Una sola bandeja para todo lo que decides seguir."
      description={<>Marcas, patentes y tecnologías comparten ahora una misma experiencia de vigilancia. VIDENTIA conserva las fuentes y pipelines existentes detrás de un contrato común, sin borrar historial.</>}
      meta={<><span>Brands · Patents · Technologies</span><span>Evidencia trazable</span><span>Revisión humana</span></>}
      actions={<><Button variant="outline" onClick={()=>void refreshSources()} disabled={refreshing||loading}>{refreshing?<Loader2 className="h-4 w-4 animate-spin"/>:<RefreshCw className="h-4 w-4"/>}Actualizar fuentes</Button><Button onClick={()=>setShowCreate(value=>!value)}><Plus className="h-4 w-4"/>Crear watch</Button></>}
    />

    <OperationalMetricRail>
      <OperationalMetric value={summary.new} label="Nuevas señales" detail="Desde la última revisión" tone={summary.new?"success":"neutral"}/>
      <OperationalMetric value={summary.high} label="Alta prioridad" detail="Señales nuevas con relevancia alta" tone={summary.high?"warning":"neutral"}/>
      <OperationalMetric value={active.length} label="Watches activos" detail={`${counts.brand} marcas · ${counts.patent} patentes · ${counts.technology} tecnologías`} tone={active.length?"success":"neutral"}/>
      <OperationalMetric value={summary.total} label="Historial" detail="Señales persistidas en las tres verticales"/>
    </OperationalMetricRail>

    {showCreate?<section className="border-b border-border/80 py-7"><OperationalPanel><form onSubmit={createWatch}>
      <OperationalSectionHeader eyebrow="Nuevo watch" title="¿Qué necesitas seguir?" meta="Define el concepto y, para tecnología, elige dónde buscar."/>
      <div className="mt-5 grid gap-3 xl:grid-cols-[300px_190px_1fr_180px_auto]">
        <div className="grid grid-cols-3 rounded-[10px] bg-[#0F2A33] p-1">{(["brand","patent","technology"] as WatchType[]).map(item=><button key={item} type="button" onClick={()=>changeType(item)} className={`min-h-9 rounded-[8px] px-2 text-xs ${type===item?"bg-[#173B37] text-white":"text-muted-foreground hover:text-white"}`}>{TYPE_LABEL[item]}</button>)}</div>
        <select value={subtype} onChange={event=>setSubtype(event.target.value)} className="h-10 rounded-[9px] border border-input bg-background px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-ring/50">{SUBTYPE_OPTIONS[type].map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select>
        <Input value={query} onChange={event=>setQuery(event.target.value)} maxLength={160} placeholder={placeholder(type,subtype)}/>
        {type==="brand"?<Input value={classes} onChange={event=>setClasses(event.target.value)} placeholder="Niza: 9, 35, 42"/>:type==="technology"?<select aria-label="Dónde buscar" value={scope} onChange={event=>setScope(event.target.value as SearchScope)} className="h-10 rounded-[9px] border border-input bg-background px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-ring/50"><option value="chile">Chile</option><option value="global">Global</option><option value="both">Ambos</option></select>:<div className="hidden xl:block"/>}
        <Button disabled={saving||query.trim().length<2}>{saving?<Loader2 className="h-4 w-4 animate-spin"/>:<Plus className="h-4 w-4"/>}Empezar a vigilar</Button>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">Tecnología normaliza equivalencias controladas como IA / AI. Chile prioriza INAPI y señales locales; Global usa ciencia y contexto internacional; Ambos cruza las dos capas.</p>
    </form></OperationalPanel></section>:null}

    {summary.new>0?<OperationalPanel className="my-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><BellRing className="mt-0.5 h-5 w-5 text-[#96B5A6]"/><div><p className="font-medium text-white">{summary.new} señal{summary.new===1?"":"es"} nueva{summary.new===1?"":"s"} requiere{summary.new===1?"":"n"} revisión</p><p className="mt-1 text-sm text-muted-foreground">Un solo cierre de revisión actualiza marcas, patentes y señales estratégicas.</p></div></div><Button onClick={()=>void markReviewed()} disabled={reviewing}>{reviewing?<Loader2 className="h-4 w-4 animate-spin"/>:<Check className="h-4 w-4"/>}Marcar todo revisado</Button></OperationalPanel>:null}

    {error?<div role="alert" className="mt-6 bg-[#3A2525] p-4 text-sm text-[#E8AAA3]">{error}</div>:null}

    <section className="grid gap-9 py-9 xl:grid-cols-[minmax(0,1.45fr)_minmax(310px,0.55fr)] xl:gap-10">
      <div>
        <OperationalSectionHeader eyebrow="Inbox común" title={showHistory?"Historial de señales":"Qué cambió desde tu última revisión"} action={<Button variant="ghost" size="sm" onClick={()=>setShowHistory(value=>!value)}>{showHistory?"Sólo nuevas":"Ver historial"}</Button>}/>
        {loading?<div className="mt-5 flex items-center gap-2 border-y border-border/80 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Construyendo el inbox…</div>:visibleSignals.length?<div className="mt-5 divide-y divide-border/80 border-y border-border/80">{visibleSignals.map(signal=><SignalRow key={signal.key} signal={signal}/>)}</div>:<div className="mt-5 border-y border-border/80 py-10"><p className="font-medium text-white">{active.length?"No hay señales pendientes":"Aún no hay watches activos"}</p><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{active.length?"Revisa el historial o actualiza las fuentes. No convertimos una línea base inicial en novedades ficticias.":"Crea un watch de marca, patente o tecnología para empezar."}</p></div>}
      </div>

      <aside><OperationalPanel><OperationalSectionHeader eyebrow="En seguimiento" title="Todos tus watches" meta={`${active.length} activos`}/>{watches.length?<div className="mt-5 divide-y divide-border/80 border-t border-border/80">{watches.map(watch=><div key={watch.key} className="py-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap gap-2"><Badge variant="outline">{TYPE_LABEL[watch.type]}</Badge><Badge variant="secondary">{subtypeLabel(watch.type,watch.subtype)}</Badge>{watch.type==="technology"&&watch.searchScope?<Badge variant="outline">{scopeLabel(watch.searchScope)}</Badge>:null}{!watch.isActive?<Badge variant="secondary">Pausado</Badge>:null}</div><p className="mt-3 font-medium text-white">{watch.query}</p>{watch.niceClasses.length?<p className="mt-1 text-xs text-muted-foreground">Niza {watch.niceClasses.join(", ")}</p>:null}<p className="mt-2 text-[11px] text-muted-foreground">{watch.lastCheckedAt?`Última consulta ${formatDate(watch.lastCheckedAt)}`:"Preparando línea base"}</p></div><div className="flex gap-1"><Button variant="ghost" size="icon-sm" onClick={()=>void toggle(watch)} aria-label={watch.isActive?"Pausar watch":"Activar watch"}>{watch.isActive?<Pause className="h-4 w-4"/>:<Play className="h-4 w-4"/>}</Button><Button variant="ghost" size="icon-sm" onClick={()=>void remove(watch.key)} aria-label="Eliminar watch"><Trash2 className="h-4 w-4"/></Button></div></div></div>)}</div>:<p className="mt-5 text-sm leading-6 text-muted-foreground">Todavía no hay watches.</p>}
        <div className="mt-6 border-t border-border/80 pt-5"><p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#96B5A6]">Análisis profundo</p><div className="mt-3 flex flex-wrap gap-2"><Button asChild size="sm" variant="secondary"><Link href="/monitorear/estrategico">Brief estratégico</Link></Button><Button asChild size="sm" variant="secondary"><Link href="/patentes/alertas">Alertas de patentes</Link></Button></div></div>
      </OperationalPanel></aside>
    </section>
  </OperationalPage>
}

function SignalRow({signal}:{signal:CommonSignal}){
  const external=signal.href.startsWith("http")
  return <article className="grid gap-3 py-5 sm:grid-cols-[140px_minmax(0,1fr)_auto] sm:items-start">
    <div><Badge variant="outline">{TYPE_LABEL[signal.type]}</Badge><p className="mt-2 text-[11px] text-muted-foreground">{signal.source}</p></div>
    <div><div className="flex flex-wrap items-center gap-2">{signal.isNew?<Badge className="bg-[#173B37] text-[#96B5A6] hover:bg-[#173B37]">Nuevo</Badge>:null}<Badge variant="secondary">{signal.relevance}</Badge></div><h3 className="mt-3 text-sm font-medium leading-6 text-white">{signal.title}</h3><p className="mt-1 text-xs text-[#96B5A6]">Watch · {signal.watchQuery}</p>{signal.detail?<p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{signal.detail}</p>:null}<p className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Clock3 className="h-3 w-3"/>{formatDate(signal.occurredAt||signal.firstSeenAt)}</p></div>
    <Button asChild variant="ghost" size="sm"><Link href={signal.href} target={external?"_blank":undefined} rel={external?"noreferrer":undefined}>Abrir{external?<ExternalLink className="h-3.5 w-3.5"/>:null}</Link></Button>
  </article>
}

function placeholder(type:WatchType,subtype:string){if(type==="brand")return subtype==="owner"?"Ej: EMPRESA SPA":"Ej: N3URALIA";if(type==="patent")return subtype==="ipc"?"Ej: A61K":"Ej: NESTLE";return subtype==="technology"?"Ej: agentes de IA empresariales":"Ej: SQM"}
function subtypeLabel(type:WatchType,subtype:string){return SUBTYPE_OPTIONS[type].find(item=>item.value===subtype)?.label??subtype}
function scopeLabel(scope:SearchScope){return scope==="chile"?"Chile":scope==="global"?"Global":"Ambos"}
function formatDate(value:string){const date=new Date(value);return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat("es-CL",{dateStyle:"medium",timeStyle:"short"}).format(date)}