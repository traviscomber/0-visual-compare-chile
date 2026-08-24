"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { ArrowRight, CheckCircle2, FolderOpen, Inbox, Loader2, Plus, Search } from "lucide-react"
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

  return <div className="mx-auto w-full max-w-[1480px] px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
    <header className="grid gap-8 border-b border-border pb-9 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">VIDENTIA / Casos</p><h1 className="mt-4 max-w-[10ch] text-4xl font-normal leading-[0.96] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-6xl">Contexto, evidencia y decisión en un solo registro.</h1></div>
      <div className="max-w-2xl lg:justify-self-end"><p className="text-base leading-7 text-muted-foreground sm:text-lg">Cada caso conserva por qué se investigó, qué evidencia apareció, qué falta revisar y qué decisión registró el equipo.</p><div className="mt-5 flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/casos/pendientes"><Inbox className="mr-2 h-4 w-4"/>Mis pendientes</Link></Button><Button onClick={()=>setShowCreate(value=>!value)}><Plus className="mr-2 h-4 w-4"/>Nuevo caso</Button></div></div>
    </header>

    <section className="grid border-b border-border sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Activos" value={active.length} detail="Abiertos o en revisión"/>
      <Metric label="En revisión" value={review.length} detail="Requieren criterio del equipo"/>
      <Metric label="Prioridad alta" value={highPriority.length} detail="Conviene resolver primero"/>
      <Metric label="Decididos" value={decided.length} detail="Con decisión registrada"/>
    </section>

    {showCreate?<section className="border-b border-border py-8"><form onSubmit={createCase}><div className="mb-5"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Nuevo registro</p><h2 className="mt-2 text-xl font-normal text-foreground">¿Qué decisión quieres seguir?</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">La evidencia puede añadirse después desde Investigar, Evaluar o Vigilancia.</p></div><div className="grid gap-3 lg:grid-cols-[1fr_180px_1fr_auto]"><Input value={title} onChange={event=>setTitle(event.target.value)} maxLength={160} placeholder="Ej: Evaluar registro de marca Atlas"/><select value={contextType} onChange={event=>setContextType(event.target.value as CaseSummary["context_type"])} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><option value="brand">Marca</option><option value="company">Empresa</option><option value="technology">Tecnología</option><option value="general">General</option></select><Input value={contextQuery} onChange={event=>setContextQuery(event.target.value)} maxLength={240} placeholder="Contexto opcional: ATLAS, empresa, tecnología…"/><Button disabled={title.trim().length<2||creating}>{creating?<Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none"/>:"Crear"}</Button></div></form></section>:null}

    {error?<div role="alert" className="mt-6 border border-red-500/25 bg-red-500/[0.07] p-4 text-sm text-red-300">{error}</div>:null}

    <section className="py-8"><div className="flex flex-col gap-5 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Registro de decisiones</p><h2 className="mt-2 text-2xl font-normal tracking-[-0.03em] text-foreground">Activas y resueltas</h2></div><label className="flex w-full max-w-md items-center gap-2 border-b border-border pb-2 text-muted-foreground focus-within:border-primary"><Search className="h-4 w-4"/><Input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Buscar caso, marca o empresa" aria-label="Buscar casos" className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"/></label></div>

      <div>{loading?<div className="flex items-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none"/>Cargando casos…</div>:visible.length===0?<div className="border-b border-dashed border-border py-12 text-center"><FolderOpen className="mx-auto h-6 w-6 text-muted-foreground"/><h3 className="mt-4 font-semibold text-foreground">No hay casos en esta vista</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Crea un caso o guarda un hallazgo desde una investigación. La evidencia quedará conectada a una decisión concreta.</p><Button onClick={()=>setShowCreate(true)} variant="outline" className="mt-5">Crear caso</Button></div>:<div className="divide-y divide-border border-b border-border">{visible.map(item=><Link key={item.id} href={`/casos/${item.id}`} className="group grid gap-4 py-5 outline-none hover:bg-secondary/15 focus-visible:bg-secondary/20 sm:grid-cols-[1fr_auto] sm:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><StatusBadge status={item.status}/><Badge variant="outline" className="rounded-md">{CONTEXT_LABELS[item.context_type]}</Badge>{item.priority==="high"?<Badge className="rounded-md border-amber-300/20 bg-amber-300/[0.06] text-amber-200 hover:bg-amber-300/[0.06]">Prioridad alta</Badge>:null}</div><h3 className="mt-3 text-lg font-semibold text-foreground">{item.title}</h3><p className="mt-1 text-sm text-muted-foreground">{item.context_query?`${item.context_query} · `:""}{item.item_count} {item.item_count===1?"evidencia":"evidencias"}</p>{item.decision_summary?<p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-foreground/80">{item.decision_summary}</p>:<p className="mt-3 text-sm text-muted-foreground">Aún no hay una decisión resumida.</p>}</div><div className="flex items-center gap-4 text-xs text-muted-foreground"><span className="hidden sm:block">Actualizado {formatDate(item.updated_at)}</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></div></Link>)}</div>}</div>
    </section>
  </div>
}

function Metric({label,value,detail}:{label:string;value:number;detail:string}){return <div className="border-b border-border py-6 sm:border-b-0 sm:border-r sm:px-5 first:pl-0 last:border-r-0"><p className="text-3xl font-semibold tracking-[-0.03em] text-foreground">{value}</p><p className="mt-1 text-sm font-semibold text-foreground">{label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div>}
function StatusBadge({status}:{status:CaseSummary["status"]}){if(status==="decided")return <Badge className="rounded-md border-primary/20 bg-primary/[0.07] text-primary hover:bg-primary/[0.07]"><CheckCircle2 className="mr-1 h-3 w-3"/>{STATUS_LABELS[status]}</Badge>;if(status==="review")return <Badge className="rounded-md border-primary/20 bg-primary/[0.07] text-primary hover:bg-primary/[0.07]">{STATUS_LABELS[status]}</Badge>;return <Badge variant="outline" className="rounded-md">{STATUS_LABELS[status]}</Badge>}
