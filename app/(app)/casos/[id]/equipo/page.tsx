"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, Circle, Loader2, MessageSquare, Plus, Trash2, UserPlus, Users } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Member = { user_id:string; email:string; display_name:string; role:"owner"|"editor"|"viewer"; is_owner:boolean }
type Comment = { id:string; author_id:string; body:string; mentions:string[]; created_at:string }
type Action = { id:string; title:string; assigned_to:string|null; created_by:string; status:"open"|"done"; due_at:string|null; created_at:string; outcome:string|null; outcome_at:string|null; outcome_by:string|null }
type Payload = { currentUserId:string; currentUserRole:"owner"|"editor"|"viewer"; members:Member[]; comments:Comment[]; actions:Action[] }

const ROLE_LABELS = { owner:"Responsable", editor:"Editor", viewer:"Observador" } as const
const formatDate = (value:string) => new Intl.DateTimeFormat("es-CL",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value))
function toLocalDateTimeInput(value:string|null){if(!value)return "";const date=new Date(value);if(Number.isNaN(date.getTime()))return "";const local=new Date(date.getTime()-date.getTimezoneOffset()*60000);return local.toISOString().slice(0,16)}
function dueState(value:string|null){if(!value)return {kind:"unscheduled" as const,label:"Sin fecha",className:"border-border bg-[#13272D] text-muted-foreground"};const timestamp=Date.parse(value);if(!Number.isFinite(timestamp))return {kind:"unscheduled" as const,label:"Sin fecha",className:"border-border bg-[#13272D] text-muted-foreground"};const diff=timestamp-Date.now();if(diff<0)return {kind:"overdue" as const,label:"Vencida",className:"border-[#D6A46F]/30 bg-[#332C24]/80 text-[#E0B987]"};if(diff<=48*60*60*1000)return {kind:"soon" as const,label:"Próxima · 48 h",className:"border-[#D6A46F]/20 bg-[#332C24]/55 text-[#E0B987]"};return {kind:"scheduled" as const,label:"Programada",className:"border-[#4A7F74]/30 bg-[#173B37] text-[#96B5A6]"}}
const dueRank={overdue:4,soon:3,unscheduled:2,scheduled:1} as const

export default function CaseCollaborationPage() {
  const { id } = useParams<{id:string}>()
  const [data,setData] = useState<Payload|null>(null)
  const [loading,setLoading] = useState(true)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState<string|null>(null)
  const [email,setEmail] = useState("")
  const [role,setRole] = useState<"editor"|"viewer">("viewer")
  const [comment,setComment] = useState("")
  const [mentions,setMentions] = useState<string[]>([])
  const [actionTitle,setActionTitle] = useState("")
  const [assignee,setAssignee] = useState("")
  const [dueAt,setDueAt] = useState("")
  const [closingActionId,setClosingActionId] = useState<string|null>(null)
  const [outcome,setOutcome] = useState("")

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const response = await fetch(`/api/cases/collaboration?caseId=${encodeURIComponent(id)}`,{cache:"no-store"})
      const payload = await response.json().catch(()=>({}))
      if(!response.ok) throw new Error(payload.error||"No pudimos cargar el equipo.")
      setData(payload)
    } catch(cause) { setError(cause instanceof Error?cause.message:"No pudimos cargar el equipo.") } finally { setLoading(false) }
  }
  useEffect(()=>{ if(id) void load() },[id])

  const memberMap = useMemo(()=>new Map((data?.members??[]).map(member=>[member.user_id,member])),[data])
  const canManage = data?.currentUserRole === "owner"
  const canAssign = data?.currentUserRole === "owner" || data?.currentUserRole === "editor"
  const openActions=(data?.actions??[]).filter(item=>item.status==="open")
  const overdueActions=openActions.filter(item=>dueState(item.due_at).kind==="overdue")
  const soonActions=openActions.filter(item=>dueState(item.due_at).kind==="soon")
  const unassignedActions=openActions.filter(item=>!item.assigned_to)
  const orderedActions=useMemo(()=>[...(data?.actions??[])].sort((a,b)=>{if(a.status!==b.status)return a.status==="open"?-1:1;const aState=dueState(a.due_at);const bState=dueState(b.due_at);return dueRank[bState.kind]-dueRank[aState.kind]||(a.due_at&&b.due_at?Date.parse(a.due_at)-Date.parse(b.due_at):Date.parse(a.created_at)-Date.parse(b.created_at))}),[data])

  const request = async (body:Record<string,unknown>, method="POST") => {
    setBusy(true); setError(null)
    try {
      const response = await fetch("/api/cases/collaboration",{method,headers:{"content-type":"application/json"},body:JSON.stringify(body)})
      const payload = await response.json().catch(()=>({}))
      if(!response.ok) throw new Error(payload.error||"No pudimos completar la acción.")
      await load(); return true
    } catch(cause) { setError(cause instanceof Error?cause.message:"No pudimos completar la acción."); return false } finally { setBusy(false) }
  }

  const addMember = async (event:FormEvent) => { event.preventDefault(); if(!email.trim()) return; if(await request({type:"member",caseId:id,email,role})) setEmail("") }
  const addComment = async (event:FormEvent) => { event.preventDefault(); if(!comment.trim()) return; if(await request({type:"comment",caseId:id,text:comment,mentions})){setComment("");setMentions([])} }
  const addAction = async (event:FormEvent) => { event.preventDefault(); if(!actionTitle.trim()) return; if(await request({type:"action",caseId:id,title:actionTitle,assignedTo:assignee||null,dueAt:dueAt?new Date(dueAt).toISOString():null})){setActionTitle("");setAssignee("");setDueAt("")} }
  const finishAction = async (actionId:string) => { if(outcome.trim().length<2)return; if(await request({type:"action",id:actionId,status:"done",outcome},"PATCH")){setClosingActionId(null);setOutcome("")} }
  const updateSchedule = async (action:Action,assignedTo:string|null,dueAtValue:string|null) => { await request({type:"action_schedule",id:action.id,assignedTo,dueAt:dueAtValue},"PATCH") }
  const removeMember = async (memberId:string) => { setBusy(true);setError(null);try { const response=await fetch(`/api/cases/collaboration?type=member&id=${encodeURIComponent(memberId)}&caseId=${encodeURIComponent(id)}`,{method:"DELETE"});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||"No pudimos quitar al participante.");await load() } catch(cause) { setError(cause instanceof Error?cause.message:"No pudimos quitar al participante.") } finally { setBusy(false) } }

  if(loading) return <div className="mx-auto max-w-[1480px] px-4 py-10 text-sm text-muted-foreground sm:px-6 lg:px-8"><Loader2 className="mr-2 inline h-4 w-4 animate-spin motion-reduce:animate-none"/>Cargando colaboración…</div>
  if(!data) return <div className="mx-auto max-w-[1480px] px-4 py-10 text-[#E0B987] sm:px-6 lg:px-8">{error||"No pudimos cargar el caso."}</div>

  return <OperationalPage>
    <Button asChild variant="ghost" size="sm" className="mb-4 w-fit px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"><Link href={`/casos/${id}`}><ArrowLeft className="mr-2 h-4 w-4"/>Volver al caso</Link></Button>
    <OperationalHeader eyebrow="VIDENTIA / Caso / Equipo" title={overdueActions.length?`${overdueActions.length} acción${overdueActions.length===1?"":"es"} vencida${overdueActions.length===1?"":"s"} requiere${overdueActions.length===1?"":"n"} resolución.`:soonActions.length?`${soonActions.length} acción${soonActions.length===1?"":"es"} vence${soonActions.length===1?"":"n"} dentro de 48 horas.`:openActions.length?`${openActions.length} acción${openActions.length===1?"":"es"} sigue${openActions.length===1?"":"n"} abierta${openActions.length===1?"":"s"}.`:"No hay acciones abiertas en este caso."} description={<>Primero resuelve trabajo vencido, próximo o sin responsable. Después coordina participantes y conversación sin perder el contexto del caso.</>} meta={<><span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5"/>Tu rol: {ROLE_LABELS[data.currentUserRole]}</span><span>{data.members.length} participante{data.members.length===1?"":"s"}</span><span>{openActions.length} acción{openActions.length===1?"":"es"} abierta{openActions.length===1?"":"s"}</span></>}/>

    <OperationalMetricRail>
      <OperationalMetric value={overdueActions.length+soonActions.length} label="Para actuar" detail={`${overdueActions.length} vencidas · ${soonActions.length} próximas`} tone={overdueActions.length+soonActions.length?"warning":"success"}/>
      <OperationalMetric value={openActions.length} label="Abiertas" detail="Trabajo todavía no cerrado" tone={openActions.length?"warning":"success"}/>
      <OperationalMetric value={unassignedActions.length} label="Sin responsable" detail="Debe asignarse explícitamente" tone={unassignedActions.length?"warning":"neutral"}/>
      <OperationalMetric value={data.members.length} label="Equipo" detail={`Tu rol: ${ROLE_LABELS[data.currentUserRole]}`}/>
    </OperationalMetricRail>

    {error?<div role="alert" className="mt-5 border border-[#D6A46F]/20 bg-[#332C24]/70 p-4 text-sm text-[#E0B987]">{error}</div>:null}

    <section className="grid gap-8 border-b border-border/80 py-7 xl:grid-cols-[0.82fr_1.18fr]">
      <div>
        <OperationalSectionHeader eyebrow="02 / Colaboración" title="Participantes" meta="Responsable, editores y observadores con acceso explícito."/>
        <div className="mt-4 divide-y divide-border border-y border-border">{data.members.map(member=><div key={member.user_id} className="flex items-center justify-between gap-3 py-3.5"><div className="min-w-0"><p className="truncate text-sm font-medium text-foreground">{member.display_name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{member.email}</p></div><div className="flex items-center gap-2">{member.is_owner?<Badge className="rounded-md border-primary/20 bg-primary/[0.07] text-primary hover:bg-primary/[0.07]">Responsable</Badge>:canManage?<><select value={member.role} onChange={e=>void request({type:"member",id:member.user_id,caseId:id,role:e.target.value},"PATCH")} className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><option value="editor">Editor</option><option value="viewer">Observador</option></select><Button size="icon" variant="ghost" disabled={busy} onClick={()=>void removeMember(member.user_id)} aria-label={`Quitar a ${member.display_name}`}><Trash2 className="h-4 w-4"/></Button></>:<Badge variant="outline" className="rounded-md">{ROLE_LABELS[member.role]}</Badge>}</div></div>)}</div>
        {canManage?<form onSubmit={addMember} className="mt-4 grid gap-2 sm:grid-cols-[1fr_120px_auto]"><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="persona@empresa.cl"/><select value={role} onChange={e=>setRole(e.target.value as "editor"|"viewer")} className="h-10 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><option value="editor">Editor</option><option value="viewer">Observador</option></select><Button disabled={busy||!email.trim()}><UserPlus className="mr-2 h-4 w-4"/>Agregar</Button></form>:null}
      </div>

      <div>
        <OperationalSectionHeader eyebrow="01 / Responsabilidad" title="Primero resuelve el trabajo crítico." meta="Ordenado por vencimiento y responsabilidad."/>
        {canAssign?<form onSubmit={addAction} className="mt-4 grid gap-2 lg:grid-cols-[1fr_170px_165px_auto]"><Input value={actionTitle} onChange={e=>setActionTitle(e.target.value)} placeholder="Ej: revisar coincidencia antes del viernes"/><select value={assignee} onChange={e=>setAssignee(e.target.value)} className="h-10 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><option value="">Sin asignar</option>{data.members.map(member=><option key={member.user_id} value={member.user_id}>{member.display_name}</option>)}</select><Input type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)}/><Button disabled={busy||!actionTitle.trim()}><Plus className="mr-2 h-4 w-4"/>Asignar</Button></form>:null}
        <div className="mt-4 divide-y divide-border border-y border-border">{orderedActions.length===0?<p className="py-7 text-sm text-muted-foreground">No hay acciones registradas.</p>:orderedActions.map(action=>{const assigned=action.assigned_to?memberMap.get(action.assigned_to):null;const canToggle=canAssign||action.assigned_to===data.currentUserId;const closing=closingActionId===action.id;const deadline=action.status==="open"?dueState(action.due_at):null;return <div key={action.id} className="py-4"><div className="flex items-start gap-3"><button disabled={!canToggle||busy} onClick={()=>{if(action.status==="done")void request({type:"action",id:action.id,status:"open"},"PATCH");else{setClosingActionId(action.id);setOutcome("")}}} className="mt-0.5 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-40" aria-label={action.status==="done"?"Reabrir acción":"Completar acción"}>{action.status==="done"?<CheckCircle2 className="h-5 w-5 text-primary"/>:<Circle className="h-5 w-5 text-muted-foreground"/>}</button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className={action.status==="done"?"text-sm text-muted-foreground line-through":"text-sm font-medium text-foreground"}>{action.title}</p>{deadline?<Badge variant="outline" className={`rounded-md ${deadline.className}`}>{deadline.label}</Badge>:null}</div><p className="mt-1 text-xs text-muted-foreground">{assigned?`Responsable: ${assigned.display_name}`:"Sin responsable"}{action.due_at?` · vence ${formatDate(action.due_at)}`:" · sin fecha límite"}</p>{canAssign&&action.status==="open"?<div className="mt-3 grid gap-2 sm:grid-cols-[170px_180px]"><select aria-label={`Responsable de ${action.title}`} value={action.assigned_to??""} disabled={busy} onChange={event=>void updateSchedule(action,event.target.value||null,action.due_at)} className="h-9 rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><option value="">Sin asignar</option>{data.members.map(member=><option key={member.user_id} value={member.user_id}>{member.display_name}</option>)}</select><Input aria-label={`Fecha límite de ${action.title}`} type="datetime-local" value={toLocalDateTimeInput(action.due_at)} disabled={busy} onChange={event=>void updateSchedule(action,action.assigned_to,event.target.value?new Date(event.target.value).toISOString():null)} className="h-9 text-xs"/></div>:null}{action.outcome?<div className="mt-3 border-l-2 border-[#96B5A6]/40 pl-3"><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#96B5A6]">Resultado</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground/85">{action.outcome}</p></div>:null}</div></div>{closing?<div className="ml-8 mt-3"><textarea value={outcome} onChange={event=>setOutcome(event.target.value)} maxLength={2000} rows={3} autoFocus placeholder="¿Qué se resolvió, decidió o descartó?" className="w-full border border-input bg-background p-3 text-sm leading-6 text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"/><div className="mt-2 flex justify-end gap-2"><Button type="button" size="sm" variant="ghost" onClick={()=>{setClosingActionId(null);setOutcome("")}}>Cancelar</Button><Button type="button" size="sm" disabled={busy||outcome.trim().length<2} onClick={()=>void finishAction(action.id)}>Guardar resultado</Button></div></div>:null}</div>})}</div>
      </div>
    </section>

    <section className="py-7">
      <OperationalSectionHeader eyebrow="03 / Colaboración" title="Conversación" meta="Comentarios y menciones ligados al expediente."/>
      <form onSubmit={addComment} className="mt-4 border-y border-border py-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><MessageSquare className="h-4 w-4"/>Contexto del equipo</div><textarea value={comment} onChange={e=>setComment(e.target.value)} maxLength={4000} rows={3} placeholder="Agrega contexto, una pregunta o una decisión a revisar…" className="mt-3 w-full border border-input bg-background p-3 text-sm leading-6 text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"/><div className="mt-3 flex flex-wrap items-center gap-2"><span className="text-xs text-muted-foreground">Mencionar:</span>{data.members.filter(member=>member.user_id!==data.currentUserId).map(member=>{const active=mentions.includes(member.user_id);return <button type="button" key={member.user_id} onClick={()=>setMentions(current=>active?current.filter(userId=>userId!==member.user_id):[...current,member.user_id])} className={`rounded-md border px-2.5 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${active?"border-primary/30 bg-primary/[0.08] text-primary":"border-border text-muted-foreground"}`}>@{member.display_name}</button>})}</div><Button className="mt-3" disabled={busy||!comment.trim()}>Publicar comentario</Button></form>
      <div className="divide-y divide-border border-b border-border">{data.comments.length===0?<p className="py-7 text-sm text-muted-foreground">Todavía no hay conversación en este caso.</p>:data.comments.map(item=>{const author=memberMap.get(item.author_id);return <article key={item.id} className="py-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-foreground">{author?.display_name||"Participante"}</p><time className="text-xs text-muted-foreground">{formatDate(item.created_at)}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/90">{item.body}</p>{item.mentions.length>0?<div className="mt-3 flex flex-wrap gap-1.5">{item.mentions.map(userId=><Badge key={userId} variant="outline" className="rounded-md">@{memberMap.get(userId)?.display_name||"participante"}</Badge>)}</div>:null}</article>})}</div>
    </section>
  </OperationalPage>
}
