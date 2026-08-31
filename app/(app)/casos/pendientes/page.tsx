"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Inbox, Loader2, MessageSquareText, TriangleAlert } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Action = { id:string; case_id:string; title:string; due_at:string|null; created_at:string; cases:{title?:string}|null }
type Mention = { id:string; case_id:string; body:string; created_at:string; cases:{title?:string}|null }
const formatDate=(value:string)=>new Intl.DateTimeFormat("es-CL",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value))
function deadlineState(value:string|null){if(!value)return {kind:"unscheduled" as const,label:"Sin fecha"};const timestamp=Date.parse(value);if(!Number.isFinite(timestamp))return {kind:"unscheduled" as const,label:"Sin fecha"};const diff=timestamp-Date.now();if(diff<0)return {kind:"overdue" as const,label:"Vencida"};if(diff<=48*60*60*1000)return {kind:"soon" as const,label:"Próxima · 48 h"};return {kind:"scheduled" as const,label:"Programada"}}

export default function CaseInboxPage(){
  const [actions,setActions]=useState<Action[]>([])
  const [mentions,setMentions]=useState<Mention[]>([])
  const [loading,setLoading]=useState(true)
  const [completing,setCompleting]=useState<string|null>(null)
  const [closingActionId,setClosingActionId]=useState<string|null>(null)
  const [outcome,setOutcome]=useState("")
  const [error,setError]=useState<string|null>(null)

  const load=async()=>{setLoading(true);setError(null);try{const response=await fetch("/api/cases/inbox",{cache:"no-store"});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||"No pudimos cargar tus pendientes.");setActions(payload.actions??[]);setMentions(payload.mentions??[])}catch(cause){setError(cause instanceof Error?cause.message:"No pudimos cargar tus pendientes.")}finally{setLoading(false)}}
  useEffect(()=>{void load()},[])

  const complete=async(id:string)=>{if(completing||outcome.trim().length<2)return;setCompleting(id);setError(null);try{const response=await fetch("/api/cases/collaboration",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({type:"action",id,status:"done",outcome})});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||"No pudimos completar la acción.");setClosingActionId(null);setOutcome("");await load()}catch(cause){setError(cause instanceof Error?cause.message:"No pudimos completar la acción.")}finally{setCompleting(null)}}

  const overdue=actions.filter(action=>deadlineState(action.due_at).kind==="overdue")
  const dueSoon=actions.filter(action=>deadlineState(action.due_at).kind==="soon")
  const total=actions.length+mentions.length

  return <OperationalPage>
    <div className="mb-4"><Button asChild variant="ghost" size="sm" className="w-fit px-0 text-muted-foreground hover:bg-transparent hover:text-white"><Link href="/casos"><ArrowLeft className="h-4 w-4"/>Volver a casos</Link></Button></div>
    <OperationalHeader
      eyebrow="VIDENTIA / Casos / Pendientes"
      title={overdue.length?"Hay acciones vencidas que requieren decisión.":total?"Lo que espera una acción tuya.":"No hay trabajo pendiente."}
      description={<>Acciones asignadas y menciones donde tu criterio o respuesta todavía forma parte del trabajo pendiente. Cerrar una acción exige registrar qué se resolvió.</>}
      meta={<><span>Responsable explícito</span><span>Fecha límite</span><span>Outcome trazable</span></>}
    />

    <OperationalMetricRail>
      <OperationalMetric value={actions.length} label="Acciones" detail="Tareas asignadas abiertas" tone={actions.length?"warning":"success"}/>
      <OperationalMetric value={overdue.length} label="Vencidas" detail="Fecha límite superada" tone={overdue.length?"danger":"success"}/>
      <OperationalMetric value={dueSoon.length} label="Próximas 48 h" detail="Conviene resolver primero" tone={dueSoon.length?"warning":"neutral"}/>
      <OperationalMetric value={mentions.length} label="Menciones" detail="Conversaciones que requieren atención" tone={mentions.length?"warning":"neutral"}/>
    </OperationalMetricRail>

    {error&&<div role="alert" className="mt-6 rounded-[10px] border border-red-500/25 bg-red-500/[0.07] p-4 text-sm text-red-200">{error}</div>}

    {loading?<div className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none"/>Cargando pendientes…</div>:<section className="grid gap-7 py-8 lg:grid-cols-2 lg:gap-9">
      <OperationalPanel className="min-w-0">
        <OperationalSectionHeader eyebrow="Colaboración" title="Acciones asignadas" meta={`${actions.length} pendiente${actions.length===1?"":"s"}`} />
        <div className="mt-5 divide-y divide-border/80 border-y border-border/80">{actions.length===0?<Empty icon={<Inbox className="h-5 w-5"/>} text="No tienes acciones pendientes."/>:actions.map(action=>{const deadline=deadlineState(action.due_at);const closing=closingActionId===action.id;return <div key={action.id} className="py-5"><div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="break-words font-medium text-white">{action.title}</p><DeadlineBadge kind={deadline.kind} label={deadline.label}/></div><p className="mt-1 break-words text-xs leading-5 text-muted-foreground">{action.cases?.title||"Caso"}{action.due_at?` · vence ${formatDate(action.due_at)}`:" · sin fecha límite"}</p><Link href={`/casos/${action.case_id}/equipo`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#96B5A6] hover:text-white">Abrir caso<ArrowRight className="h-3.5 w-3.5"/></Link></div><Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={()=>{setClosingActionId(action.id);setOutcome("")}} disabled={Boolean(completing)}><CheckCircle2 className="h-4 w-4"/>Registrar resultado</Button></div>{closing?<div className="mt-4 border-l-2 border-[#4A7F74]/50 pl-4"><label className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#96B5A6]" htmlFor={`outcome-${action.id}`}>Resultado requerido</label><textarea id={`outcome-${action.id}`} value={outcome} onChange={event=>setOutcome(event.target.value)} maxLength={2000} rows={3} autoFocus placeholder="¿Qué se resolvió, decidió o descartó?" className="mt-2 w-full border border-input bg-background p-3 text-sm leading-6 text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"/><div className="mt-2 flex justify-end gap-2"><Button type="button" size="sm" variant="ghost" onClick={()=>{setClosingActionId(null);setOutcome("")}}>Cancelar</Button><Button type="button" size="sm" disabled={completing===action.id||outcome.trim().length<2} onClick={()=>void complete(action.id)}>{completing===action.id?<Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none"/>:<CheckCircle2 className="h-4 w-4"/>}Guardar resultado</Button></div></div>:null}</div>})}</div>
      </OperationalPanel>

      <OperationalPanel className="min-w-0">
        <OperationalSectionHeader eyebrow="Colaboración" title="Menciones" meta={`${mentions.length} ${mentions.length===1?"conversación":"conversaciones"}`} />
        <div className="mt-5 divide-y divide-border/80 border-y border-border/80">{mentions.length===0?<Empty icon={<MessageSquareText className="h-5 w-5"/>} text="No tienes menciones pendientes."/>:mentions.map(item=><div key={item.id} className="py-5"><p className="line-clamp-3 break-words text-sm leading-6 text-white/85">{item.body}</p><p className="mt-2 break-words text-xs text-muted-foreground">{item.cases?.title||"Caso"} · {formatDate(item.created_at)}</p><Link href={`/casos/${item.case_id}/equipo`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#96B5A6] hover:text-white">Ver conversación<ArrowRight className="h-3.5 w-3.5"/></Link></div>)}</div>
      </OperationalPanel>
    </section>}
  </OperationalPage>
}

function DeadlineBadge({kind,label}:{kind:"overdue"|"soon"|"scheduled"|"unscheduled";label:string}){const className=kind==="overdue"?"border-red-500/25 bg-red-500/[0.07] text-red-200":kind==="soon"?"border-amber-500/25 bg-amber-500/[0.07] text-amber-100":kind==="scheduled"?"border-[#4A7F74]/30 bg-[#173B37] text-[#96B5A6]":"border-border bg-[#13272D] text-muted-foreground";const Icon=kind==="overdue"?TriangleAlert:Clock3;return <Badge variant="outline" className={`rounded-md ${className}`}><Icon className="mr-1 h-3 w-3"/>{label}</Badge>}
function Empty({icon,text}:{icon:ReactNode;text:string}){return <div className="py-9 text-sm text-muted-foreground"><span className="text-[#96B5A6]">{icon}</span><p className="mt-3">{text}</p></div>}
