"use client"

import Link from "next/link"
import { type FormEvent, useEffect, useMemo, useState } from "react"
import { Check, Clock3, ExternalLink, Loader2, Pause, Play, Plus, RefreshCw, Trash2 } from "lucide-react"
import { OperationalMetric, OperationalMetricRail, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { ValidatedSignalActions } from "@/components/app/validated-signal-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type WatchType = "brand" | "patent" | "technology"
type SearchScope = "chile" | "global" | "both"
type FeedbackType = "relevant" | "irrelevant" | "false_match" | "identity_incorrect"
type CommonWatch = {
  key:string; id:string; type:WatchType; subtype:string; query:string; niceClasses:number[]; searchScope:SearchScope|null;
  isActive:boolean; lastCheckedAt:string|null; lastReviewedAt:string|null; createdAt:string; updatedAt:string
}
type RegulatoryTimelineMilestone = { id:string; label:string; title:string; detail:string|null; occurredAt:string|null; href:string|null; relevance:"alta"|"media"|"baja" }
type RegulatoryTimeline = { canonicalCompanyName:string|null; expediente:string; milestones:RegulatoryTimelineMilestone[] }
type CommonSignal = {
  key:string; watchKey:string; type:WatchType; watchQuery:string; source:string; title:string; detail:string|null;
  occurredAt:string|null; firstSeenAt:string; relevance:"alta"|"media"|"baja"; isNew:boolean; href:string; timeline?:RegulatoryTimeline|null
}
type SignalSummary = { new:number; high:number; total:number; brand:number; patent:number; technology:number }
type FeedbackEntry = { id:string; target_key:string; feedback_type:FeedbackType; updated_at:string }

const EMPTY_SUMMARY:SignalSummary={new:0,high:0,total:0,brand:0,patent:0,technology:0}
const TYPE_LABEL:Record<WatchType,string>={brand:"Marca",patent:"Patente",technology:"Inteligencia"}
const SUBTYPE_OPTIONS:Record<WatchType,Array<{value:string;label:string}>>={
  brand:[{value:"brand",label:"Marca"},{value:"owner",label:"Titular"}],
  patent:[{value:"company",label:"Empresa"},{value:"ipc",label:"IPC"}],
  technology:[{value:"technology",label:"Tecnología"},{value:"company",label:"Empresa"},{value:"competitor",label:"Competidor"},{value:"regulator",label:"Regulador"},{value:"tender",label:"Licitación"},{value:"market",label:"Mercado"},{value:"topic",label:"Tema"}],
}

export default function CommonWatchesPage(){
  const [watches,setWatches]=useState<CommonWatch[]>([])
  const [signals,setSignals]=useState<CommonSignal[]>([])
  const [summary,setSummary]=useState<SignalSummary>(EMPTY_SUMMARY)
  const [reviews,setReviews]=useState<Map<string,FeedbackEntry>>(new Map())
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
  const [reviewingKey,setReviewingKey]=useState<string|null>(null)
  const [recentlyValidatedKey,setRecentlyValidatedKey]=useState<string|null>(null)
  const [error,setError]=useState<string|null>(null)

  const active=useMemo(()=>watches.filter(item=>item.isActive),[watches])
  const pendingSignals=useMemo(()=>signals.filter(item=>item.isNew&&!reviews.has(item.key)),[signals,reviews])
  const visibleSignals=useMemo(()=>{
    const base=showHistory?[...signals]:[...pendingSignals]
    if(!showHistory&&recentlyValidatedKey){
      const recent=signals.find(item=>item.key===recentlyValidatedKey)
      if(recent&&!base.some(item=>item.key===recent.key))base.unshift(recent)
    }
    const rank={alta:3,media:2,baja:1} as const
    return base.sort((a,b)=>rank[b.relevance]-rank[a.relevance]||Date.parse(b.occurredAt||b.firstSeenAt)-Date.parse(a.occurredAt||a.firstSeenAt))
  },[signals,pendingSignals,showHistory,recentlyValidatedKey])
  const counts=useMemo(()=>({brand:active.filter(item=>item.type==="brand").length,patent:active.filter(item=>item.type==="patent").length,technology:active.filter(item=>item.type==="technology").length}),[active])
  const highPending=useMemo(()=>pendingSignals.filter(item=>item.relevance==="alta").length,[pendingSignals])
  const validatedCount=useMemo(()=>[...reviews.values()].filter(item=>item.feedback_type==="relevant").length,[reviews])
  const dismissedCount=useMemo(()=>[...reviews.values()].filter(item=>item.feedback_type==="irrelevant"||item.feedback_type==="false_match").length,[reviews])

  async function load(){
    setLoading(true);setError(null)
    try{
      const [watchResponse,signalResponse,feedbackResponse]=await Promise.all([
        fetch("/api/intelligence/watches",{cache:"no-store"}),
        fetch("/api/intelligence/watches/signals",{cache:"no-store"}),
        fetch("/api/intelligence/feedback?targetType=watch_signal",{cache:"no-store"}),
      ])
      const watchPayload=await watchResponse.json().catch(()=>({}))
      const signalPayload=await signalResponse.json().catch(()=>({}))
      const feedbackPayload=await feedbackResponse.json().catch(()=>({}))
      if(!watchResponse.ok)throw new Error(watchPayload.error||"No pudimos cargar tus seguimientos.")
      if(!signalResponse.ok)throw new Error(signalPayload.error||"No pudimos construir la bandeja de tareas.")
      if(!feedbackResponse.ok)throw new Error(feedbackPayload.error||"No pudimos cargar las validaciones.")
      setWatches(Array.isArray(watchPayload.watches)?watchPayload.watches:[])
      setSignals(Array.isArray(signalPayload.signals)?signalPayload.signals:[])
      setSummary(signalPayload.summary??EMPTY_SUMMARY)
      const entries=(Array.isArray(feedbackPayload.feedback)?feedbackPayload.feedback:[]) as FeedbackEntry[]
      setReviews(new Map(entries.map(item=>[item.target_key,item])))
    }catch(cause){setError(cause instanceof Error?cause.message:"No pudimos cargar seguimientos.")}finally{setLoading(false)}
  }

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search)
    const requested=params.get("type")
    if(requested==="brand"||requested==="patent"||requested==="technology"){setType(requested);setSubtype(SUBTYPE_OPTIONS[requested][0].value);setShowCreate(true)}
    const requestedQuery=params.get("q")?.trim();if(requestedQuery)setQuery(requestedQuery.slice(0,160))
    const requestedScope=params.get("scope");if(requestedScope==="chile"||requestedScope==="global"||requestedScope==="both")setScope(requestedScope)
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
      if(!response.ok)throw new Error(payload.error||"No pudimos crear el seguimiento.")
      setQuery("");setClasses("");setScope("both");setShowCreate(false);await load()
    }catch(cause){setError(cause instanceof Error?cause.message:"No pudimos crear el seguimiento.")}finally{setSaving(false)}
  }

  async function refreshSources(){
    if(refreshing)return
    setRefreshing(true);setError(null)
    try{
      const results=await Promise.allSettled([fetch("/api/intelligence/watch-signals",{cache:"no-store"}),fetch("/api/intelligence/strategic-watch-signals",{cache:"no-store"}),fetch("/api/patents/alerts",{cache:"no-store"})])
      const failed=results.filter(item=>item.status==="fulfilled"&&!item.value.ok).length+results.filter(item=>item.status==="rejected").length
      await load();if(failed)setError(`Actualizamos la bandeja, pero ${failed} fuente${failed===1?"":"s"} no respondió correctamente.`)
    }finally{setRefreshing(false)}
  }

  async function reviewSignal(signal:CommonSignal,feedbackType:"relevant"|"irrelevant"){
    if(reviewingKey)return
    setReviewingKey(signal.key);setError(null)
    try{
      const response=await fetch("/api/intelligence/feedback",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({targetType:"watch_signal",targetKey:signal.key,feedbackType})})
      const payload=await response.json().catch(()=>({}))
      if(!response.ok)throw new Error(payload.error||"No pudimos guardar la validación.")
      setReviews(current=>{
        const next=new Map(current)
        next.set(signal.key,{id:String(payload.id||signal.key),target_key:signal.key,feedback_type:feedbackType,updated_at:new Date().toISOString()})
        return next
      })
      if(feedbackType==="relevant")setRecentlyValidatedKey(signal.key)
      else if(recentlyValidatedKey===signal.key)setRecentlyValidatedKey(null)
    }catch(cause){setError(cause instanceof Error?cause.message:"No pudimos guardar la validación.")}finally{setReviewingKey(null)}
  }

  async function toggle(watch:CommonWatch){const response=await fetch("/api/intelligence/watches",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({key:watch.key,active:!watch.isActive})});if(!response.ok){setError("No pudimos actualizar el seguimiento.");return}await load()}
  async function remove(key:string){const response=await fetch(`/api/intelligence/watches?key=${encodeURIComponent(key)}`,{method:"DELETE"});if(!response.ok){setError("No pudimos eliminar el seguimiento.");return}await load()}

  const headline=highPending?`${highPending} tarea${highPending===1?"":"s"} importante${highPending===1?"":"s"} por validar`:pendingSignals.length?`${pendingSignals.length} tarea${pendingSignals.length===1?"":"s"} por revisar`:active.length?"Todo revisado":"Activa tu primera vigilancia"

  return <OperationalPage>
    <section className="border-b border-border/80 py-7">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">VIDENTIA / Tareas de vigilancia</p>
          <h1 className="mt-2 text-3xl font-light tracking-[-0.03em] text-[#E7DFCE] sm:text-4xl">{headline}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Cada cambio nuevo se convierte en una tarea. Abre la evidencia, valida si importa o descártala. VIDENTIA conserva la decisión para no volver a pedirte lo mismo.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={()=>void refreshSources()} disabled={refreshing||loading}>{refreshing?<Loader2 className="h-4 w-4 animate-spin"/>:<RefreshCw className="h-4 w-4"/>}Actualizar</Button>
          <Button onClick={()=>setShowCreate(value=>!value)}><Plus className="h-4 w-4"/>{showCreate?"Cerrar":"Nuevo seguimiento"}</Button>
        </div>
      </div>
    </section>

    <OperationalMetricRail>
      <OperationalMetric value={pendingSignals.length} label="Por revisar" detail={`${highPending} importantes · validar una por una`} tone={pendingSignals.length?"warning":"success"}/>
      <OperationalMetric value={validatedCount} label="Validadas" detail="Confirmadas por el usuario" tone="success"/>
      <OperationalMetric value={dismissedCount} label="Descartadas" detail="No requieren seguimiento"/>
      <OperationalMetric value={active.length} label="Seguimientos" detail={`${counts.brand} marcas · ${counts.patent} patentes · ${counts.technology} inteligencia`}/>
    </OperationalMetricRail>

    {showCreate?<section className="border-b border-border/80 py-7"><OperationalPanel><form onSubmit={createWatch}>
      <OperationalSectionHeader eyebrow="Nuevo seguimiento" title="¿Qué quieres vigilar?" />
      <div className="mt-5 grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_auto] xl:items-end">
        <div><p className="mb-2 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">Tipo</p><div className="grid grid-cols-3 rounded-[10px] bg-[#0F2A33] p-1">{(["brand","patent","technology"] as WatchType[]).map(item=><button key={item} type="button" onClick={()=>changeType(item)} className={`min-h-9 rounded-[8px] px-2 text-xs ${type===item?"bg-[#173B37] text-white":"text-muted-foreground hover:text-white"}`}>{TYPE_LABEL[item]}</button>)}</div></div>
        <div><p className="mb-2 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">Qué seguir</p><div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)_180px]"><select value={subtype} onChange={event=>setSubtype(event.target.value)} className="h-10 rounded-[9px] border border-input bg-background px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-ring/50">{SUBTYPE_OPTIONS[type].map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select><Input value={query} onChange={event=>setQuery(event.target.value)} maxLength={160} placeholder={placeholder(type,subtype)}/>{type==="brand"?<Input value={classes} onChange={event=>setClasses(event.target.value)} placeholder="Niza: 9, 35, 42"/>:type==="technology"?<select aria-label="Dónde buscar" value={scope} onChange={event=>setScope(event.target.value as SearchScope)} className="h-10 rounded-[9px] border border-input bg-background px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-ring/50"><option value="chile">Chile</option><option value="global">Global</option><option value="both">Ambos</option></select>:<div className="hidden sm:block"/>}</div></div>
        <Button className="w-full xl:w-auto" disabled={saving||query.trim().length<2}>{saving?<Loader2 className="h-4 w-4 animate-spin"/>:<Plus className="h-4 w-4"/>}Activar</Button>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{coverageHint(type,subtype)}</p>
    </form></OperationalPanel></section>:null}

    {error?<div role="alert" className="mt-6 border border-[#D6A46F]/20 bg-[#332C24]/70 p-4 text-sm text-[#E0B987]">{error}</div>:null}

    <section id="novedades" className="grid scroll-mt-6 gap-9 py-9 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.45fr)] xl:gap-10">
      <div>
        <OperationalSectionHeader eyebrow="Cola de revisión" title={showHistory?"Decisiones y evidencia":highPending?"Valida primero las tareas importantes":pendingSignals.length?"Revisa y decide":"No quedan tareas pendientes"} meta={showHistory?`${summary.total} señales · ${reviews.size} decisiones`:pendingSignals.length?`${pendingSignals.length} pendientes · ${highPending} importantes`:"Vigilancia activa"} action={<Button variant="ghost" size="sm" onClick={()=>setShowHistory(value=>!value)}>{showHistory?"Sólo pendientes":"Ver historial"}</Button>}/>
        {loading?<div className="mt-5 flex items-center gap-2 border-y border-border/80 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Cargando tareas…</div>:visibleSignals.length?<div className="mt-5 divide-y divide-border/80 border-y border-border/80">{visibleSignals.map(signal=><SignalRow key={signal.key} signal={signal} feedback={reviews.get(signal.key)?.feedback_type??null} busy={reviewingKey===signal.key} showActions={recentlyValidatedKey===signal.key} onReview={reviewSignal} onActionsDone={()=>setRecentlyValidatedKey(null)}/>)}</div>:<div className="mt-5 border-y border-border/80 py-10"><p className="font-medium text-white">{active.length?"No hay tareas pendientes":"Aún no hay seguimientos activos"}</p><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{active.length?"VIDENTIA seguirá reuniendo evidencia. Cuando aparezca un cambio, llegará aquí como una tarea para validar.":"Activa un seguimiento para comenzar la vigilancia."}</p>{!active.length?<Button className="mt-4" size="sm" onClick={()=>setShowCreate(true)}><Plus className="h-3.5 w-3.5"/>Crear seguimiento</Button>:null}</div>}
      </div>

      <aside><OperationalPanel><OperationalSectionHeader eyebrow="En seguimiento" title={`${active.length} activos`}/>{watches.length?<div className="mt-5 divide-y divide-border/80 border-t border-border/80">{watches.map(watch=><div key={watch.key} className="py-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap gap-2"><Badge variant="outline">{TYPE_LABEL[watch.type]}</Badge><Badge className={watch.isActive?"bg-[#173B37] text-[#96B5A6]":""} variant={watch.isActive?undefined:"secondary"}>{watch.isActive?"Activo":"Pausado"}</Badge></div><p className="mt-3 font-medium text-white">{watch.query}</p><p className="mt-1 text-xs text-muted-foreground">{subtypeLabel(watch.type,watch.subtype)}{watch.type==="technology"&&watch.searchScope?` · ${scopeLabel(watch.searchScope)}`:""}{watch.niceClasses.length?` · Niza ${watch.niceClasses.join(", ")}`:""}</p><p className="mt-2 text-[11px] text-muted-foreground">{watch.lastCheckedAt?`Revisado ${formatDate(watch.lastCheckedAt)}`:"Preparando línea base"}</p></div><div className="flex flex-wrap justify-end gap-1"><Button variant="ghost" size="icon-sm" onClick={()=>void toggle(watch)} aria-label={watch.isActive?"Pausar seguimiento":"Activar seguimiento"}>{watch.isActive?<Pause className="h-3.5 w-3.5"/>:<Play className="h-3.5 w-3.5"/>}</Button><Button variant="ghost" size="icon-sm" onClick={()=>void remove(watch.key)} aria-label="Eliminar seguimiento"><Trash2 className="h-4 w-4"/></Button></div></div></div>)}</div>:<p className="mt-5 text-sm leading-6 text-muted-foreground">Todavía no hay seguimientos.</p>}
        <div className="mt-6 border-t border-border/80 pt-5"><div className="flex flex-wrap gap-2"><Button asChild size="sm" variant="secondary"><Link href="/monitorear/atencion">Ver atención</Link></Button><Button asChild size="sm" variant="secondary"><Link href="/monitorear/estrategico">Estratégico</Link></Button><Button asChild size="sm" variant="secondary"><Link href="/patentes/alertas">Patentes</Link></Button></div></div>
      </OperationalPanel></aside>
    </section>
  </OperationalPage>
}

function SignalRow({signal,feedback,busy,showActions,onReview,onActionsDone}:{signal:CommonSignal;feedback:FeedbackType|null;busy:boolean;showActions:boolean;onReview:(signal:CommonSignal,feedbackType:"relevant"|"irrelevant")=>Promise<void>;onActionsDone:()=>void}){
  const external=signal.href.startsWith("http")
  const isHigh=signal.relevance==="alta"
  const decided=feedback==="relevant"||feedback==="irrelevant"||feedback==="false_match"
  const guidance=taskGuidance(signal)
  return <article className="grid gap-4 py-6 sm:grid-cols-[120px_minmax(0,1fr)]">
    <div><Badge variant="outline">{TYPE_LABEL[signal.type]}</Badge><p className="mt-2 text-[11px] text-muted-foreground">{humanizeSource(signal.source)}</p></div>
    <div>
      <div className="flex flex-wrap items-center gap-2">{!decided&&signal.isNew?<Badge className="bg-[#173B37] text-[#96B5A6] hover:bg-[#173B37]">Pendiente</Badge>:null}{feedback==="relevant"?<Badge className="bg-[#173B37] text-[#96B5A6] hover:bg-[#173B37]">Validada</Badge>:null}{feedback==="irrelevant"||feedback==="false_match"?<Badge variant="secondary">Descartada</Badge>:null}<Badge className={isHigh?"border-[#D6A46F]/25 bg-[#332C24]/65 text-[#E0B987]":""} variant={isHigh?"outline":"secondary"}>{isHigh?"Importante":signal.relevance}</Badge>{signal.timeline?<Badge variant="outline">{signal.timeline.milestones.length} hitos</Badge>:null}</div>
      <h3 className="mt-3 text-sm font-medium leading-6 text-white">{signal.title}</h3><p className="mt-1 text-xs text-[#96B5A6]">{signal.watchQuery}</p>{signal.detail?<p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{signal.detail}</p>:null}<p className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Clock3 className="h-3 w-3"/>{formatDate(signal.occurredAt||signal.firstSeenAt)}</p>{signal.timeline?<RegulatoryTimelineDetails timeline={signal.timeline}/>:null}
      {!decided?<div className="mt-4 grid gap-px overflow-hidden rounded-[10px] border border-border/70 bg-border/70 lg:grid-cols-3">
        <div className="bg-[#0D2329] p-3"><p className="text-[10px] font-medium uppercase tracking-[0.13em] text-[#96B5A6]">Por qué está aquí</p><p className="mt-1.5 text-xs leading-5 text-muted-foreground">{guidance.why}</p></div>
        <div className="bg-[#0D2329] p-3"><p className="text-[10px] font-medium uppercase tracking-[0.13em] text-[#96B5A6]">Si validas</p><p className="mt-1.5 text-xs leading-5 text-muted-foreground">{guidance.validate}</p></div>
        <div className="bg-[#0D2329] p-3"><p className="text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground">Si descartas</p><p className="mt-1.5 text-xs leading-5 text-muted-foreground">{guidance.discard}</p></div>
      </div>:null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm"><Link href={signal.href} target={external?"_blank":undefined} rel={external?"noreferrer":undefined}>Revisar evidencia{external?<ExternalLink className="h-3.5 w-3.5"/>:null}</Link></Button>
        {!decided?<><Button size="sm" onClick={()=>void onReview(signal,"relevant")} disabled={busy}>{busy?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<Check className="h-3.5 w-3.5"/>}Validar</Button><Button variant="ghost" size="sm" onClick={()=>void onReview(signal,"irrelevant")} disabled={busy}><Trash2 className="h-3.5 w-3.5"/>Descartar</Button></>:null}
      </div>
      {feedback==="relevant"&&showActions?<ValidatedSignalActions signal={signal} onDone={onActionsDone}/>:null}
    </div>
  </article>
}

function RegulatoryTimelineDetails({timeline}:{timeline:RegulatoryTimeline}){
  return <details className="group mt-4 border-y border-border/70 py-3"><summary className="cursor-pointer list-none text-xs font-medium text-[#96B5A6] marker:content-none">Ver línea regulatoria · {timeline.expediente}{timeline.canonicalCompanyName?` · ${timeline.canonicalCompanyName}`:""}</summary><div className="mt-4 border-l border-[#355C55] pl-5">{timeline.milestones.map((milestone,index)=><div key={milestone.id} className="relative pb-5 last:pb-0"><span aria-hidden="true" className="absolute -left-[23px] top-1.5 h-1.5 w-1.5 rounded-full bg-[#96B5A6]"/><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="font-mono text-[10px] text-[#96B5A6]">{String(index+1).padStart(2,"0")}</span><span className="text-xs font-medium text-white">{milestone.label}</span><Badge variant="secondary">{milestone.relevance}</Badge>{milestone.occurredAt?<span className="text-[11px] text-muted-foreground">{formatDate(milestone.occurredAt)}</span>:null}</div><p className="mt-1 text-sm leading-6 text-white/90">{milestone.title}</p>{milestone.detail?<p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">{milestone.detail}</p>:null}{milestone.href?<Link className="mt-2 inline-flex items-center gap-1 text-xs text-[#96B5A6] hover:text-white" href={milestone.href} target="_blank" rel="noreferrer">Evidencia SMA<ExternalLink className="h-3 w-3"/></Link>:null}</div>)}</div></details>
}

function taskGuidance(signal:CommonSignal){
  const source=signal.source.toLowerCase()
  if(signal.type==="brand")return {
    why:`Apareció una señal de marca relacionada con “${signal.watchQuery}” que necesita confirmar si realmente afecta tu vigilancia.`,
    validate:"Queda registrada como evidencia relevante y podrás llevarla a un caso si requiere trabajo adicional.",
    discard:"Queda registrada como no relevante y sale de la cola sin borrar la evidencia histórica.",
  }
  if(signal.type==="patent")return {
    why:`La publicación coincide con el seguimiento “${signal.watchQuery}” y puede aportar evidencia tecnológica o competitiva.`,
    validate:"La publicación queda confirmada y podrás crear un caso o agregarla a uno existente.",
    discard:"Se conserva en el historial, pero deja de requerir revisión humana.",
  }
  if(source.includes("sma")||source.includes("snifa"))return {
    why:"Hay un movimiento regulatorio nuevo asociado al seguimiento y conviene confirmar si cambia su nivel de atención.",
    validate:"El movimiento queda confirmado y puede escalarse a un caso de trabajo.",
    discard:"El movimiento se conserva como antecedente, pero deja de formar parte de tu trabajo pendiente.",
  }
  if(source.includes("sea"))return {
    why:"Se detectó actividad ambiental o de proyecto relacionada con la empresa o tema que estás siguiendo.",
    validate:"El proyecto queda confirmado y puede incorporarse a un caso para seguimiento operativo.",
    discard:"Se mantiene como antecedente documental, pero no vuelve a pedirte una decisión.",
  }
  if(source.includes("google_news"))return {
    why:`Una fuente pública reportó un cambio relacionado con “${signal.watchQuery}”. VIDENTIA necesita tu criterio para separar señal útil de ruido editorial.`,
    validate:"La noticia queda confirmada y podrás decidir si merece convertirse en trabajo de caso.",
    discard:"La noticia queda registrada como descartada y desaparece de la cola pendiente.",
  }
  return {
    why:`VIDENTIA detectó un cambio relacionado con “${signal.watchQuery}” que supera el umbral para revisión humana.`,
    validate:"La señal queda confirmada y podrás escalarla a un caso si requiere acción.",
    discard:"La señal se conserva para trazabilidad, pero deja de requerir tu atención.",
  }
}

function placeholder(type:WatchType,subtype:string){if(type==="brand")return subtype==="owner"?"Ej: EMPRESA SPA":"Ej: N3URALIA";if(type==="patent")return subtype==="ipc"?"Ej: A61K":"Ej: NESTLE";if(subtype==="technology")return "Ej: agentes de IA empresariales";if(subtype==="company")return "Ej: SQM";if(subtype==="competitor")return "Ej: NotCo";if(subtype==="regulator")return "Ej: Comisión para el Mercado Financiero";if(subtype==="tender")return "Ej: almacenamiento energético";if(subtype==="market")return "Ej: litio Chile";return "Ej: protección de datos personales"}
function coverageHint(type:WatchType,subtype:string){if(type==="brand")return "Vigilaremos marcas y titulares con la evidencia conectada.";if(type==="patent")return "Vigilaremos patentes con INAPI y fuentes internacionales disponibles.";if(subtype==="technology")return "Vigilaremos patentes, ciencia, noticias y cambios observados disponibles.";if(subtype==="company"||subtype==="competitor")return "Vigilaremos propiedad intelectual, cambios observados y noticias.";return "Vigilaremos señales verificables de Chile y/o globales según disponibilidad."}
function subtypeLabel(type:WatchType,subtype:string){return SUBTYPE_OPTIONS[type].find(item=>item.value===subtype)?.label??subtype}
function scopeLabel(scope:SearchScope){return scope==="chile"?"Chile":scope==="global"?"Global":"Ambos"}
function humanizeSource(source:string){const normalized=source.toLowerCase();if(normalized.includes("google_news"))return "Google News";if(normalized.includes("inapi"))return "INAPI";if(normalized.includes("tdpi"))return "TDPI";if(normalized.includes("sea"))return "SEA";if(normalized.includes("snifa")||normalized.includes("sma"))return "SMA";return source.replaceAll("_"," ")}
function formatDate(value:string){const date=new Date(value);return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat("es-CL",{dateStyle:"medium",timeStyle:"short"}).format(date)}