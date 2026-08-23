"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { ArrowRight, BellRing, Building2, CheckCircle2, Clock3, Eye, Loader2, Pause, Play, Plus, RefreshCw, Search, ShieldCheck, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SaveToCaseAction } from "@/components/app/save-to-case-action"

type Watch={id:string;watch_type:"company"|"ipc";query:string;is_active:boolean;last_checked_at:string;created_at:string}
type Event={id:string;watch_id:string;title:string;application_number:string|null;applicants:string|null;ipc_codes:string[];filing_date:string|null;detected_at:string;read_at:string|null}
type Payload={watches:Watch[];events:Event[];unread:number}
type SignalFilter="new"|"all"|"read"
function formatDate(value:string|null|undefined){if(!value)return "—";const date=new Date(value);return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat("es-CL",{dateStyle:"medium",timeStyle:"short"}).format(date)}

export default function PatentAlertsPage(){
  const [data,setData]=useState<Payload>({watches:[],events:[],unread:0})
  const [type,setType]=useState<"company"|"ipc">("company")
  const [query,setQuery]=useState("")
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState<string|null>(null)
  const [filter,setFilter]=useState<SignalFilter>("new")
  const [showCreate,setShowCreate]=useState(false)

  const load=async()=>{setLoading(true);setError(null);try{const response=await fetch("/api/patents/alerts",{cache:"no-store"});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||"No pudimos cargar la vigilancia.");setData(payload as Payload)}catch(cause){setError(cause instanceof Error?cause.message:"No pudimos conectar con el servicio de vigilancia.")}finally{setLoading(false)}}
  useEffect(()=>{const params=new URLSearchParams(window.location.search);const initialQuery=params.get("q")?.trim()??"";if(initialQuery){setType(params.get("type")==="ipc"?"ipc":"company");setQuery(initialQuery);setShowCreate(true)}void load()},[])
  const createWatch=async(event:FormEvent)=>{event.preventDefault();if(query.trim().length<2||saving)return;setSaving(true);setError(null);try{const response=await fetch("/api/patents/alerts",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({type,query})});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||"No pudimos crear la vigilancia.");setQuery("");setShowCreate(false);await load()}catch(cause){setError(cause instanceof Error?cause.message:"No pudimos crear la vigilancia.")}finally{setSaving(false)}}
  const toggle=async(watch:Watch)=>{await fetch("/api/patents/alerts",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id:watch.id,active:!watch.is_active})});await load()}
  const remove=async(id:string)=>{await fetch(`/api/patents/alerts?id=${encodeURIComponent(id)}`,{method:"DELETE"});await load()}
  const markRead=async(event:Event)=>{if(event.read_at)return;await fetch("/api/patents/alerts",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({eventId:event.id})});await load()}

  const watchById=useMemo(()=>new Map(data.watches.map(item=>[item.id,item])),[data.watches])
  const active=data.watches.filter(item=>item.is_active)
  const paused=data.watches.length-active.length
  const visible=data.events.filter(item=>filter==="new"?!item.read_at:filter==="read"?Boolean(item.read_at):true)

  return <div className="mx-auto w-full max-w-[1380px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
    <header className="grid gap-8 border-b border-slate-200 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
      <div className="max-w-4xl"><p className="text-sm font-semibold text-teal-700">Vigilancia continua</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">Sólo te mostramos lo que cambió.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Las vigilancias siguen empresas y clases IPC. Cuando aparece nueva actividad, la señal llega aquí para revisar, investigar o convertir en caso.</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading?"animate-spin":""}`}/>Actualizar</Button><Button onClick={()=>setShowCreate(value=>!value)} className="bg-teal-700 hover:bg-teal-800"><Plus className="mr-2 h-4 w-4"/>Nueva vigilancia</Button></div>
    </header>

    <section className="grid border-b border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Nuevas" value={data.unread} detail="Señales sin revisar" emphasis={data.unread>0}/>
      <Metric label="Activas" value={active.length} detail="Vigilancias corriendo"/>
      <Metric label="Pausadas" value={paused} detail="Se mantienen guardadas"/>
      <Metric label="Historial" value={data.events.length} detail="Señales detectadas"/>
    </section>

    {showCreate?<section className="border-b border-slate-200 py-8"><form onSubmit={createWatch} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="mb-5"><h2 className="text-lg font-semibold text-slate-950">Añadir una vigilancia</h2><p className="mt-1 text-sm text-slate-500">Sigue una empresa o un prefijo IPC. Las señales se generan con actividad nueva posterior a la creación.</p></div><div className="grid gap-3 lg:grid-cols-[220px_1fr_auto]"><div className="flex rounded-lg border border-slate-200 p-1"><Button type="button" size="sm" variant={type==="company"?"secondary":"ghost"} className="flex-1" onClick={()=>setType("company")}><Building2 className="mr-1.5 h-4 w-4"/>Empresa</Button><Button type="button" size="sm" variant={type==="ipc"?"secondary":"ghost"} className="flex-1" onClick={()=>setType("ipc")}><Search className="mr-1.5 h-4 w-4"/>IPC</Button></div><Input value={query} onChange={event=>setQuery(event.target.value)} placeholder={type==="company"?"Ej: NESTLE, SYNGENTA, BASF":"Ej: A61, G06F, C25C"} maxLength={160}/><Button disabled={query.trim().length<2||saving} className="bg-teal-700 hover:bg-teal-800">{saving?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Plus className="mr-2 h-4 w-4"/>}Empezar a vigilar</Button></div></form></section>:null}

    {error?<div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>:null}

    <section className="grid gap-8 py-10 xl:grid-cols-[1.4fr_0.6fr]">
      <div><div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Bandeja de señales</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Qué merece revisión</h2></div><div className="flex rounded-lg border border-slate-200 bg-white p-1">{(["new","all","read"] as SignalFilter[]).map(value=><Button key={value} size="sm" variant={filter===value?"secondary":"ghost"} onClick={()=>setFilter(value)}>{value==="new"?`Nuevas${data.unread?` · ${data.unread}`:""}`:value==="all"?"Todas":"Revisadas"}</Button>)}</div></div>
        {loading?<div className="flex items-center gap-2 py-10 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin"/>Cargando señales…</div>:visible.length===0?<Empty/>:<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">{visible.map(event=>{const watch=watchById.get(event.watch_id);return <article key={event.id} className={`border-b border-slate-100 p-5 last:border-0 ${event.read_at?"":"bg-amber-50/40"}`}><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2">{!event.read_at?<Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Nueva</Badge>:<Badge variant="outline">Revisada</Badge>}{watch?<Badge variant="outline">{watch.watch_type==="company"?"Empresa":"IPC"} · {watch.query}</Badge>:null}</div><h3 className="mt-3 text-lg font-semibold text-slate-950">{event.title}</h3><p className="mt-1 text-sm text-slate-500">{event.applicants||"Solicitante no informado"}</p></div>{event.read_at?<CheckCircle2 className="h-5 w-5 text-emerald-600"/>:<BellRing className="h-5 w-5 text-amber-600"/>}</div><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><Fact label="Solicitud" value={event.application_number||"—"}/><Fact label="Presentada" value={event.filing_date||"—"}/><Fact label="Detectada" value={formatDate(event.detected_at)}/></dl>{event.ipc_codes.length?<div className="mt-4 flex flex-wrap gap-1.5">{event.ipc_codes.slice(0,8).map(code=><Badge key={code} variant="secondary">{code}</Badge>)}</div>:null}<div className="mt-5 flex flex-wrap gap-2"><Button asChild size="sm" className="bg-teal-700 hover:bg-teal-800"><Link href={`/investigar?mode=technology&q=${encodeURIComponent(event.title)}&autorun=1`}>Investigar <ArrowRight className="ml-1.5 h-3.5 w-3.5"/></Link></Button><SaveToCaseAction itemType="alert" sourceId={event.id} title={event.title} contextType={watch?.watch_type==="company"?"company":"technology"} contextQuery={watch?.query??event.ipc_codes[0]??null} suggestedCaseTitle={watch?.watch_type==="company"?`Competidor ${watch.query}`:`Señal ${event.application_number||event.title}`} metadata={{href:`/investigar?mode=technology&q=${encodeURIComponent(event.title)}&autorun=1`,subtitle:`Solicitud ${event.application_number||"—"} · ${event.applicants||"solicitante no informado"}`}}/>{!event.read_at?<Button size="sm" variant="outline" onClick={()=>void markRead(event)}>Marcar revisada</Button>:null}</div></article>})}</div>}
      </div>

      <aside><div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Watchlist</p><h2 className="mt-2 text-xl font-semibold text-slate-950">Qué estás siguiendo</h2></div>{data.watches.length?<div className="space-y-3">{data.watches.map(watch=><div key={watch.id} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{watch.watch_type==="company"?"Empresa":"IPC"}</Badge>{!watch.is_active?<Badge variant="secondary">Pausada</Badge>:null}</div><p className="mt-3 font-semibold text-slate-950">{watch.query}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400"><Clock3 className="h-3.5 w-3.5"/>Último chequeo {formatDate(watch.last_checked_at)}</p></div><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={()=>void toggle(watch)} aria-label={watch.is_active?"Pausar":"Activar"}>{watch.is_active?<Pause className="h-4 w-4"/>:<Play className="h-4 w-4"/>}</Button><Button size="icon" variant="ghost" onClick={()=>void remove(watch.id)} aria-label="Eliminar"><Trash2 className="h-4 w-4"/></Button></div></div><div className="mt-4 flex flex-wrap gap-2"><Button asChild variant="outline" size="sm"><Link href={`/investigar?mode=${watch.watch_type==="company"?"company":"technology"}&q=${encodeURIComponent(watch.query)}&autorun=1`}>Investigar contexto</Link></Button><SaveToCaseAction itemType="watch" sourceId={watch.id} title={`Vigilancia ${watch.query}`} contextType={watch.watch_type==="company"?"company":"technology"} contextQuery={watch.query} suggestedCaseTitle={watch.watch_type==="company"?`Competidor ${watch.query}`:`Tecnología ${watch.query}`} metadata={{href:"/monitorear",subtitle:`Vigilancia ${watch.is_active?"activa":"pausada"}`}}/></div></div>)}</div>:<div className="rounded-2xl border border-dashed border-slate-300 p-7 text-center"><Eye className="mx-auto h-6 w-6 text-slate-400"/><p className="mt-3 text-sm font-semibold text-slate-800">Aún no sigues nada</p><Button onClick={()=>setShowCreate(true)} variant="outline" size="sm" className="mt-4">Crear vigilancia</Button></div>}
        <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white"><ShieldCheck className="h-5 w-5 text-teal-300"/><h3 className="mt-4 font-semibold">La señal no es la decisión.</h3><p className="mt-2 text-sm leading-6 text-slate-300">Cada alerta conserva su fuente y contexto para que puedas investigarla antes de actuar.</p></div>
      </aside>
    </section>
  </div>
}

function Metric({label,value,detail,emphasis=false}:{label:string;value:number;detail:string;emphasis?:boolean}){return <div className="border-b border-slate-200 py-6 sm:border-b-0 sm:border-r sm:px-5 first:pl-0 last:border-r-0"><p className={`text-3xl font-semibold tracking-tight ${emphasis?"text-amber-700":"text-slate-950"}`}>{value}</p><p className="mt-1 text-sm font-semibold text-slate-700">{label}</p><p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p></div>}
function Fact({label,value}:{label:string;value:string}){return <div><dt className="text-xs text-slate-400">{label}</dt><dd className="mt-1 font-medium text-slate-700">{value}</dd></div>}
function Empty(){return <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center"><ShieldCheck className="mx-auto h-6 w-6 text-emerald-600"/><h3 className="mt-3 font-semibold text-slate-900">No hay señales en esta vista</h3><p className="mt-1 text-sm text-slate-500">Cuando una nueva solicitud coincida con tu watchlist aparecerá aquí.</p></div>}
