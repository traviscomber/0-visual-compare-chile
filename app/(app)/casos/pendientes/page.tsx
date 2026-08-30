"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft, ArrowRight, CheckCircle2, Inbox, Loader2, MessageSquareText } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Button } from "@/components/ui/button"

type Action = { id:string; case_id:string; title:string; due_at:string|null; created_at:string; cases:{title?:string}|null }
type Mention = { id:string; case_id:string; body:string; created_at:string; cases:{title?:string}|null }
const formatDate=(value:string)=>new Intl.DateTimeFormat("es-CL",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value))

export default function CaseInboxPage(){
  const [actions,setActions]=useState<Action[]>([])
  const [mentions,setMentions]=useState<Mention[]>([])
  const [loading,setLoading]=useState(true)
  const [completing,setCompleting]=useState<string|null>(null)
  const [error,setError]=useState<string|null>(null)

  const load=async()=>{setLoading(true);setError(null);try{const response=await fetch("/api/cases/inbox",{cache:"no-store"});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||"No pudimos cargar tus pendientes.");setActions(payload.actions??[]);setMentions(payload.mentions??[])}catch(cause){setError(cause instanceof Error?cause.message:"No pudimos cargar tus pendientes.")}finally{setLoading(false)}}
  useEffect(()=>{void load()},[])

  const complete=async(id:string)=>{if(completing)return;setCompleting(id);setError(null);try{const response=await fetch("/api/cases/collaboration",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({type:"action",id,status:"done"})});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||"No pudimos completar la acción.");await load()}catch(cause){setError(cause instanceof Error?cause.message:"No pudimos completar la acción.")}finally{setCompleting(null)}}

  const total=actions.length+mentions.length

  return <OperationalPage>
    <div className="mb-4"><Button asChild variant="ghost" size="sm" className="w-fit px-0 text-muted-foreground hover:bg-transparent hover:text-white"><Link href="/casos"><ArrowLeft className="h-4 w-4"/>Volver a casos</Link></Button></div>
    <OperationalHeader
      eyebrow="VIDENTIA / Casos / Pendientes"
      title="Lo que espera una acción tuya."
      description={<>Acciones asignadas y menciones donde tu criterio o respuesta todavía forma parte del trabajo pendiente.</>}
      meta={<><span>Colaboración</span><span>Tareas explícitas</span><span>Conversaciones trazables</span></>}
    />

    <OperationalMetricRail>
      <OperationalMetric value={actions.length} label="Acciones" detail="Tareas asignadas pendientes" tone={actions.length?"warning":"success"}/>
      <OperationalMetric value={mentions.length} label="Menciones" detail="Conversaciones que requieren atención" tone={mentions.length?"warning":"neutral"}/>
      <OperationalMetric value={total} label="Total pendiente" detail="Trabajo visible en esta bandeja"/>
      <OperationalMetric value={total===0?"Al día":"Atención"} label="Estado" detail={total===0?"No hay trabajo pendiente":"Hay trabajo por resolver"} tone={total===0?"success":"warning"}/>
    </OperationalMetricRail>

    {error&&<div role="alert" className="mt-6 rounded-[10px] border border-red-500/25 bg-red-500/[0.07] p-4 text-sm text-red-200">{error}</div>}

    {loading?<div className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none"/>Cargando pendientes…</div>:<section className="grid gap-7 py-8 lg:grid-cols-2 lg:gap-9">
      <OperationalPanel className="min-w-0">
        <OperationalSectionHeader eyebrow="Colaboración" title="Acciones asignadas" meta={`${actions.length} pendiente${actions.length===1?"":"s"}`} />
        <div className="mt-5 divide-y divide-border/80 border-y border-border/80">{actions.length===0?<Empty icon={<Inbox className="h-5 w-5"/>} text="No tienes acciones pendientes."/>:actions.map(action=><div key={action.id} className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div className="min-w-0"><p className="break-words font-medium text-white">{action.title}</p><p className="mt-1 break-words text-xs leading-5 text-muted-foreground">{action.cases?.title||"Caso"}{action.due_at?` · vence ${formatDate(action.due_at)}`:""}</p><Link href={`/casos/${action.case_id}/equipo`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#96B5A6] hover:text-white">Abrir caso<ArrowRight className="h-3.5 w-3.5"/></Link></div><Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={()=>void complete(action.id)} disabled={completing===action.id}>{completing===action.id?<Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none"/>:<CheckCircle2 className="h-4 w-4"/>}Completar</Button></div>)}</div>
      </OperationalPanel>

      <OperationalPanel className="min-w-0">
        <OperationalSectionHeader eyebrow="Colaboración" title="Menciones" meta={`${mentions.length} conversación${mentions.length===1?"":"es"}`} />
        <div className="mt-5 divide-y divide-border/80 border-y border-border/80">{mentions.length===0?<Empty icon={<MessageSquareText className="h-5 w-5"/>} text="No tienes menciones pendientes."/>:mentions.map(item=><div key={item.id} className="py-5"><p className="line-clamp-3 break-words text-sm leading-6 text-white/85">{item.body}</p><p className="mt-2 break-words text-xs text-muted-foreground">{item.cases?.title||"Caso"} · {formatDate(item.created_at)}</p><Link href={`/casos/${item.case_id}/equipo`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#96B5A6] hover:text-white">Ver conversación<ArrowRight className="h-3.5 w-3.5"/></Link></div>)}</div>
      </OperationalPanel>
    </section>}
  </OperationalPage>
}

function Empty({icon,text}:{icon:React.ReactNode;text:string}){return <div className="py-9 text-sm text-muted-foreground"><span className="text-[#96B5A6]">{icon}</span><p className="mt-3">{text}</p></div>}
