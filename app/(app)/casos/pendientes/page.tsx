"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft, ArrowRight, CheckCircle2, Inbox, Loader2, MessageSquareText } from "lucide-react"
import { Button } from "@/components/ui/button"

type Action = { id:string; case_id:string; title:string; due_at:string|null; created_at:string; cases:{title?:string}|null }
type Mention = { id:string; case_id:string; body:string; created_at:string; cases:{title?:string}|null }

const formatDate = (value:string) => new Intl.DateTimeFormat("es-CL",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value))

export default function CaseInboxPage() {
  const [actions,setActions] = useState<Action[]>([])
  const [mentions,setMentions] = useState<Mention[]>([])
  const [loading,setLoading] = useState(true)
  const [completing,setCompleting] = useState<string|null>(null)
  const [error,setError] = useState<string|null>(null)

  const load = async () => {
    setLoading(true);setError(null)
    try {
      const response = await fetch("/api/cases/inbox",{cache:"no-store"})
      const payload = await response.json().catch(()=>({}))
      if(!response.ok) throw new Error(payload.error||"No pudimos cargar tus pendientes.")
      setActions(payload.actions??[]);setMentions(payload.mentions??[])
    } catch(cause) { setError(cause instanceof Error?cause.message:"No pudimos cargar tus pendientes.") } finally { setLoading(false) }
  }
  useEffect(()=>{void load()},[])

  const complete = async (id:string) => {
    if(completing)return
    setCompleting(id);setError(null)
    try {
      const response = await fetch("/api/cases/collaboration",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({type:"action",id,status:"done"})})
      const payload = await response.json().catch(()=>({}))
      if(!response.ok) throw new Error(payload.error||"No pudimos completar la acción.")
      await load()
    } catch(cause) { setError(cause instanceof Error?cause.message:"No pudimos completar la acción.") } finally { setCompleting(null) }
  }

  return <div className="mx-auto w-full max-w-[1480px] px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
    <Button asChild variant="ghost" size="sm" className="mb-7 w-fit px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"><Link href="/casos"><ArrowLeft className="mr-2 h-4 w-4"/>Volver a casos</Link></Button>

    <header className="grid gap-8 border-b border-border pb-9 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">VIDENTIA / Casos / Pendientes</p><h1 className="mt-4 max-w-[10ch] text-4xl font-normal leading-[0.96] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-6xl">Lo que espera una acción tuya.</h1></div>
      <div className="max-w-2xl lg:justify-self-end"><p className="text-base leading-7 text-muted-foreground sm:text-lg">Acciones asignadas y menciones donde tu criterio o respuesta todavía forma parte del trabajo pendiente.</p><div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground"><span>{actions.length} acciones</span><span>{mentions.length} menciones</span></div></div>
    </header>

    {error&&<div role="alert" className="mt-6 border border-red-500/25 bg-red-500/[0.07] p-4 text-sm text-red-300">{error}</div>}

    {loading?<div className="flex items-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none"/>Cargando pendientes…</div>:<section className="grid gap-10 py-10 lg:grid-cols-2">
      <div><SectionHeading icon={<Inbox className="h-4 w-4"/>} title="Acciones asignadas" meta={`${actions.length} pendiente${actions.length===1?"":"s"}`} />
        <div className="mt-5 divide-y divide-border border-y border-border">{actions.length===0?<Empty text="No tienes acciones pendientes."/>:actions.map(action=><div key={action.id} className="grid gap-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="font-semibold text-foreground">{action.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{action.cases?.title||"Caso"}{action.due_at?` · vence ${formatDate(action.due_at)}`:""}</p><Link href={`/casos/${action.case_id}/equipo`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline">Abrir caso<ArrowRight className="h-3.5 w-3.5"/></Link></div><Button size="sm" variant="outline" onClick={()=>void complete(action.id)} disabled={completing===action.id}>{completing===action.id?<Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none"/>:<CheckCircle2 className="mr-2 h-4 w-4"/>}Completar</Button></div>)}</div>
      </div>

      <div><SectionHeading icon={<MessageSquareText className="h-4 w-4"/>} title="Menciones" meta={`${mentions.length} conversación${mentions.length===1?"":"es"}`} />
        <div className="mt-5 divide-y divide-border border-y border-border">{mentions.length===0?<Empty text="No tienes menciones pendientes."/>:mentions.map(item=><div key={item.id} className="py-5"><p className="line-clamp-3 text-sm leading-6 text-foreground/85">{item.body}</p><p className="mt-2 text-xs text-muted-foreground">{item.cases?.title||"Caso"} · {formatDate(item.created_at)}</p><Link href={`/casos/${item.case_id}/equipo`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline">Ver conversación<ArrowRight className="h-3.5 w-3.5"/></Link></div>)}</div>
      </div>
    </section>}
  </div>
}

function SectionHeading({icon,title,meta}:{icon:React.ReactNode;title:string;meta:string}) { return <div><div className="flex items-center gap-2 text-primary">{icon}<p className="text-[10px] font-semibold uppercase tracking-[0.16em]">Colaboración</p></div><div className="mt-2 flex items-end justify-between gap-3"><h2 className="text-xl font-normal tracking-[-0.02em] text-foreground">{title}</h2><span className="text-xs text-muted-foreground">{meta}</span></div></div> }
function Empty({text}:{text:string}) { return <div className="py-10 text-sm text-muted-foreground">{text}</div> }
