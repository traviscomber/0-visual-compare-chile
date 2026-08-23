"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { ArrowRight, BriefcaseBusiness, CheckCircle2, FolderOpen, Loader2, Plus, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type CaseSummary = {
  id:string
  title:string
  status:"open"|"review"|"decided"|"archived"
  priority:"low"|"normal"|"high"
  context_type:"general"|"brand"|"company"|"technology"
  context_query:string|null
  decision_summary:string|null
  notes:string|null
  created_at:string
  updated_at:string
  item_count:number
}

const STATUS_LABELS:Record<CaseSummary["status"],string>={open:"Abierto",review:"En revisión",decided:"Decidido",archived:"Archivado"}
const CONTEXT_LABELS:Record<CaseSummary["context_type"],string>={general:"General",brand:"Marca",company:"Empresa",technology:"Tecnología"}
function formatDate(value:string){const date=new Date(value);return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat("es-CL",{dateStyle:"medium"}).format(date)}

export default function CasesPage(){
  const [cases,setCases]=useState<CaseSummary[]>([])
  const [loading,setLoading]=useState(true)
  const [creating,setCreating]=useState(false)
  const [showCreate,setShowCreate]=useState(false)
  const [title,setTitle]=useState("")
  const [contextType,setContextType]=useState<CaseSummary["context_type"]>("brand")
  const [contextQuery,setContextQuery]=useState("")
  const [search,setSearch]=useState("")
  const [error,setError]=useState<string|null>(null)

  const load=async()=>{setLoading(true);setError(null);try{const response=await fetch("/api/cases",{cache:"no-store"});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||"No pudimos cargar los casos.");setCases(payload.cases??[])}catch(cause){setError(cause instanceof Error?cause.message:"No pudimos cargar los casos.")}finally{setLoading(false)}}
  useEffect(()=>{void load()},[])

  const visible=useMemo(()=>{const q=search.trim().toLowerCase();if(!q)return cases;return cases.filter(item=>[item.title,item.context_query,item.decision_summary].filter(Boolean).some(value=>String(value).toLowerCase().includes(q)))},[cases,search])
  const active=cases.filter(item=>item.status==="open"||item.status==="review")
  const review=cases.filter(item=>item.status==="review")
  const decided=cases.filter(item=>item.status==="decided")
  const highPriority=active.filter(item=>item.priority==="high")

  const createCase=async(event:FormEvent)=>{event.preventDefault();if(title.trim().length<2||creating)return;setCreating(true);setError(null);try{const response=await fetch("/api/cases",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({title,contextType,contextQuery:contextQuery||null})});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||"No pudimos crear el caso.");setTitle("");setContextQuery("");setContextType("brand");setShowCreate(false);await load()}catch(cause){setError(cause instanceof Error?cause.message:"No pudimos crear el caso.")}finally{setCreating(false)}}

  return <div className="mx-auto w-full max-w-[1380px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
    <header className="grid gap-8 border-b border-slate-200 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
      <div className="max-w-4xl"><p className="text-sm font-semibold text-teal-700">Registro de decisiones</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">Cada caso conserva el contexto, la evidencia y la decisión.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">No vuelvas a reconstruir por qué una marca se revisó, qué evidencia apareció o quién decidió. Cada investigación importante vive en un caso persistente.</p></div>
      <Button onClick={()=>setShowCreate(value=>!value)} className="bg-teal-700 hover:bg-teal-800"><Plus className="mr-2 h-4 w-4"/>Nuevo caso</Button>
    </header>

    <section className="grid border-b border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Activos" value={active.length} detail="Abiertos o en revisión"/>
      <Metric label="En revisión" value={review.length} detail="Requieren criterio"/>
      <Metric label="Prioridad alta" value={highPriority.length} detail="Conviene resolver primero"/>
      <Metric label="Decididos" value={decided.length} detail="Con decisión registrada"/>
    </section>

    {showCreate?<section className="border-b border-slate-200 py-8"><form onSubmit={createCase} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="mb-5"><h2 className="text-lg font-semibold text-slate-950">Crear un caso</h2><p className="mt-1 text-sm text-slate-500">Define la decisión que quieres seguir. La evidencia puede añadirse después desde búsqueda, vigilancia o investigación.</p></div><div className="grid gap-3 lg:grid-cols-[1fr_180px_1fr_auto]"><Input value={title} onChange={event=>setTitle(event.target.value)} maxLength={160} placeholder="Ej: Evaluar registro de marca Atlas"/><select value={contextType} onChange={event=>setContextType(event.target.value as CaseSummary["context_type"])} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"><option value="brand">Marca</option><option value="company">Empresa</option><option value="technology">Tecnología</option><option value="general">General</option></select><Input value={contextQuery} onChange={event=>setContextQuery(event.target.value)} maxLength={240} placeholder="Contexto opcional: ATLAS, NESTLE, A61…"/><Button disabled={title.trim().length<2||creating} className="bg-teal-700 hover:bg-teal-800">{creating?<Loader2 className="h-4 w-4 animate-spin"/>:"Crear"}</Button></div></form></section>:null}

    {error?<div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>:null}

    <section className="py-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Casos</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Decisiones activas y resueltas</h2></div><div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-white px-3"><Search className="h-4 w-4 text-slate-400"/><Input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Buscar caso, marca o empresa" className="border-0 bg-transparent shadow-none focus-visible:ring-0"/></div></div>

      <div className="mt-6">{loading?<div className="flex items-center gap-2 py-12 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin"/>Cargando casos…</div>:visible.length===0?<div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center"><FolderOpen className="mx-auto h-7 w-7 text-slate-400"/><h3 className="mt-4 font-semibold text-slate-900">No hay casos en esta vista</h3><p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">Crea un caso o guarda un hallazgo desde una búsqueda. La evidencia quedará conectada a una decisión concreta.</p><Button onClick={()=>setShowCreate(true)} variant="outline" className="mt-5">Crear caso</Button></div>:<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">{visible.map((item,index)=><Link key={item.id} href={`/casos/${item.id}`} className="group grid gap-4 border-b border-slate-100 p-5 last:border-0 hover:bg-slate-50 sm:grid-cols-[1fr_auto] sm:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><StatusBadge status={item.status}/><Badge variant="outline">{CONTEXT_LABELS[item.context_type]}</Badge>{item.priority==="high"?<Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50">Prioridad alta</Badge>:null}</div><h3 className="mt-3 text-lg font-semibold text-slate-950">{item.title}</h3><p className="mt-1 text-sm text-slate-500">{item.context_query?`${item.context_query} · `:""}{item.item_count} {item.item_count===1?"evidencia":"evidencias"}</p>{item.decision_summary?<p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-700">{item.decision_summary}</p>:<p className="mt-3 text-sm text-slate-400">Aún no hay una decisión resumida.</p>}</div><div className="flex items-center gap-4 text-xs text-slate-400"><span className="hidden sm:block">Actualizado {formatDate(item.updated_at)}</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></div></Link>)}</div>}</div>
    </section>
  </div>
}

function Metric({label,value,detail}:{label:string;value:number;detail:string}){return <div className="border-b border-slate-200 py-6 sm:border-b-0 sm:border-r sm:px-5 first:pl-0 last:border-r-0"><p className="text-3xl font-semibold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-sm font-semibold text-slate-700">{label}</p><p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p></div>}
function StatusBadge({status}:{status:CaseSummary["status"]}){if(status==="decided")return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50"><CheckCircle2 className="mr-1 h-3 w-3"/>{STATUS_LABELS[status]}</Badge>;if(status==="review")return <Badge className="bg-teal-50 text-teal-700 hover:bg-teal-50">{STATUS_LABELS[status]}</Badge>;return <Badge variant="outline">{STATUS_LABELS[status]}</Badge>}
