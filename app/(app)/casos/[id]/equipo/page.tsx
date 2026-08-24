"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, Circle, Loader2, MessageSquare, Plus, Trash2, UserPlus, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Member = { user_id:string; email:string; display_name:string; role:"owner"|"editor"|"viewer"; is_owner:boolean }
type Comment = { id:string; author_id:string; body:string; mentions:string[]; created_at:string }
type Action = { id:string; title:string; assigned_to:string|null; created_by:string; status:"open"|"done"; due_at:string|null; created_at:string }
type Payload = { currentUserId:string; currentUserRole:"owner"|"editor"|"viewer"; members:Member[]; comments:Comment[]; actions:Action[] }

const ROLE_LABELS = { owner:"Responsable", editor:"Editor", viewer:"Observador" } as const
const formatDate = (value:string) => new Intl.DateTimeFormat("es-CL",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value))

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

  const request = async (body:Record<string,unknown>, method="POST") => {
    setBusy(true); setError(null)
    try {
      const response = await fetch("/api/cases/collaboration",{method,headers:{"content-type":"application/json"},body:JSON.stringify(body)})
      const payload = await response.json().catch(()=>({}))
      if(!response.ok) throw new Error(payload.error||"No pudimos completar la acción.")
      await load()
      return true
    } catch(cause) {
      setError(cause instanceof Error?cause.message:"No pudimos completar la acción.")
      return false
    } finally { setBusy(false) }
  }

  const addMember = async (event:FormEvent) => { event.preventDefault(); if(!email.trim()) return; if(await request({type:"member",caseId:id,email,role})) setEmail("") }
  const addComment = async (event:FormEvent) => { event.preventDefault(); if(!comment.trim()) return; if(await request({type:"comment",caseId:id,text:comment,mentions})){setComment("");setMentions([])} }
  const addAction = async (event:FormEvent) => { event.preventDefault(); if(!actionTitle.trim()) return; if(await request({type:"action",caseId:id,title:actionTitle,assignedTo:assignee||null,dueAt:dueAt?new Date(dueAt).toISOString():null})){setActionTitle("");setAssignee("");setDueAt("")} }
  const removeMember = async (memberId:string) => {
    setBusy(true);setError(null)
    try {
      const response=await fetch(`/api/cases/collaboration?type=member&id=${encodeURIComponent(memberId)}&caseId=${encodeURIComponent(id)}`,{method:"DELETE"})
      const payload=await response.json().catch(()=>({}))
      if(!response.ok) throw new Error(payload.error||"No pudimos quitar al participante.")
      await load()
    } catch(cause) { setError(cause instanceof Error?cause.message:"No pudimos quitar al participante.") } finally { setBusy(false) }
  }

  if(loading) return <div className="mx-auto max-w-[1480px] px-4 py-14 text-sm text-muted-foreground sm:px-6 lg:px-8"><Loader2 className="mr-2 inline h-4 w-4 animate-spin motion-reduce:animate-none"/>Cargando colaboración…</div>
  if(!data) return <div className="mx-auto max-w-[1480px] px-4 py-14 text-destructive sm:px-6 lg:px-8">{error||"No pudimos cargar el caso."}</div>

  return <div className="mx-auto w-full max-w-[1480px] px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
    <Button asChild variant="ghost" size="sm" className="mb-7 w-fit px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"><Link href={`/casos/${id}`}><ArrowLeft className="mr-2 h-4 w-4"/>Volver al caso</Link></Button>

    <header className="grid gap-8 border-b border-border pb-9 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">VIDENTIA / Caso / Equipo</p><h1 className="mt-4 max-w-[11ch] text-4xl font-normal leading-[0.96] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-6xl">Personas, conversación y trabajo asignado.</h1></div>
      <div className="max-w-2xl lg:justify-self-end"><p className="text-base leading-7 text-muted-foreground sm:text-lg">Coordina el expediente sin perder contexto. Los permisos se aplican por rol y las acciones asignadas alimentan la bandeja personal de pendientes.</p><div className="mt-5 flex flex-wrap items-center gap-2"><Badge variant="outline" className="rounded-md"><Users className="mr-1.5 h-3.5 w-3.5"/>Tu rol: {ROLE_LABELS[data.currentUserRole]}</Badge><span className="text-xs text-muted-foreground">{data.members.length} participante{data.members.length===1?"":"s"}</span></div></div>
    </header>

    {error&&<div role="alert" className="mt-6 border border-red-500/25 bg-red-500/[0.07] p-4 text-sm text-red-300">{error}</div>}

    <section className="grid gap-10 border-b border-border py-10 xl:grid-cols-[0.85fr_1.15fr]">
      <div>
        <SectionHeading index="01" title="Participantes" copy="Responsable, editores y observadores con acceso explícito al caso."/>
        <div className="mt-5 divide-y divide-border border-y border-border">{data.members.map(member=><div key={member.user_id} className="flex items-center justify-between gap-3 py-4"><div className="min-w-0"><p className="truncate text-sm font-medium text-foreground">{member.display_name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{member.email}</p></div><div className="flex items-center gap-2">{member.is_owner?<Badge className="rounded-md border-primary/20 bg-primary/[0.07] text-primary hover:bg-primary/[0.07]">Responsable</Badge>:canManage?<><select value={member.role} onChange={e=>void request({type:"member",id:member.user_id,caseId:id,role:e.target.value},"PATCH")} className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><option value="editor">Editor</option><option value="viewer">Observador</option></select><Button size="icon" variant="ghost" disabled={busy} onClick={()=>void removeMember(member.user_id)} aria-label={`Quitar a ${member.display_name}`}><Trash2 className="h-4 w-4"/></Button></>:<Badge variant="outline" className="rounded-md">{ROLE_LABELS[member.role]}</Badge>}</div></div>)}</div>
        {canManage&&<form onSubmit={addMember} className="mt-5 grid gap-2 sm:grid-cols-[1fr_120px_auto]"><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="persona@empresa.cl"/><select value={role} onChange={e=>setRole(e.target.value as "editor"|"viewer")} className="h-10 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><option value="editor">Editor</option><option value="viewer">Observador</option></select><Button disabled={busy||!email.trim()}><UserPlus className="mr-2 h-4 w-4"/>Agregar</Button></form>}
      </div>

      <div>
        <SectionHeading index="02" title="Acciones" copy="Trabajo concreto con responsable y fecha cuando corresponde."/>
        {canAssign&&<form onSubmit={addAction} className="mt-5 grid gap-2 lg:grid-cols-[1fr_180px_170px_auto]"><Input value={actionTitle} onChange={e=>setActionTitle(e.target.value)} placeholder="Ej: revisar coincidencia antes del viernes"/><select value={assignee} onChange={e=>setAssignee(e.target.value)} className="h-10 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><option value="">Sin asignar</option>{data.members.map(member=><option key={member.user_id} value={member.user_id}>{member.display_name}</option>)}</select><Input type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)}/><Button disabled={busy||!actionTitle.trim()}><Plus className="mr-2 h-4 w-4"/>Asignar</Button></form>}
        <div className="mt-5 divide-y divide-border border-y border-border">{data.actions.length===0?<p className="py-8 text-sm text-muted-foreground">No hay acciones registradas.</p>:data.actions.map(action=>{const assigned=action.assigned_to?memberMap.get(action.assigned_to):null;const canToggle=canAssign||action.assigned_to===data.currentUserId;return <div key={action.id} className="flex items-start gap-3 py-4"><button disabled={!canToggle||busy} onClick={()=>void request({type:"action",id:action.id,status:action.status==="done"?"open":"done"},"PATCH")} className="mt-0.5 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-40" aria-label={action.status==="done"?"Reabrir acción":"Completar acción"}>{action.status==="done"?<CheckCircle2 className="h-5 w-5 text-primary"/>:<Circle className="h-5 w-5 text-muted-foreground"/>}</button><div className="min-w-0 flex-1"><p className={action.status==="done"?"text-sm text-muted-foreground line-through":"text-sm font-medium text-foreground"}>{action.title}</p><p className="mt-1 text-xs text-muted-foreground">{assigned?`Responsable: ${assigned.display_name}`:"Sin responsable"}{action.due_at?` · vence ${formatDate(action.due_at)}`:""}</p></div></div>})}</div>
      </div>
    </section>

    <section className="py-10">
      <SectionHeading index="03" title="Conversación" copy="Comentarios y menciones que permanecen ligados al expediente." icon={<MessageSquare className="h-4 w-4"/>}/>
      <form onSubmit={addComment} className="mt-5 border-y border-border py-5"><textarea value={comment} onChange={e=>setComment(e.target.value)} maxLength={4000} rows={4} placeholder="Agrega contexto, una pregunta o una decisión a revisar…" className="w-full border border-input bg-background p-3 text-sm leading-6 text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"/><div className="mt-3 flex flex-wrap items-center gap-2"><span className="text-xs text-muted-foreground">Mencionar:</span>{data.members.filter(member=>member.user_id!==data.currentUserId).map(member=>{const active=mentions.includes(member.user_id);return <button type="button" key={member.user_id} onClick={()=>setMentions(current=>active?current.filter(userId=>userId!==member.user_id):[...current,member.user_id])} className={`rounded-md border px-2.5 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${active?"border-primary/30 bg-primary/[0.08] text-primary":"border-border text-muted-foreground"}`}>@{member.display_name}</button>})}</div><Button className="mt-4" disabled={busy||!comment.trim()}>Publicar comentario</Button></form>
      <div className="divide-y divide-border border-b border-border">{data.comments.length===0?<p className="py-8 text-sm text-muted-foreground">Todavía no hay conversación en este caso.</p>:data.comments.map(item=>{const author=memberMap.get(item.author_id);return <article key={item.id} className="py-5"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-foreground">{author?.display_name||"Participante"}</p><time className="text-xs text-muted-foreground">{formatDate(item.created_at)}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/90">{item.body}</p>{item.mentions.length>0&&<div className="mt-3 flex flex-wrap gap-1.5">{item.mentions.map(userId=><Badge key={userId} variant="outline" className="rounded-md">@{memberMap.get(userId)?.display_name||"participante"}</Badge>)}</div>}</article>})}</div>
    </section>
  </div>
}

function SectionHeading({index,title,copy,icon}:{index:string;title:string;copy:string;icon?:React.ReactNode}) { return <div><div className="flex items-center gap-2 text-primary">{icon}<p className="text-[10px] font-semibold uppercase tracking-[0.16em]">{index} / colaboración</p></div><h2 className="mt-2 text-2xl font-normal tracking-[-0.03em] text-foreground">{title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{copy}</p></div> }
