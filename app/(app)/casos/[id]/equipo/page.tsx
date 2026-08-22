"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, Circle, Loader2, MessageSquare, Plus, Trash2, UserPlus, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    } catch(cause) { setError(cause instanceof Error?cause.message:"No pudimos completar la acción.") } finally { setBusy(false) }
  }

  const addMember = async (event:FormEvent) => { event.preventDefault(); if(!email.trim()) return; await request({type:"member",caseId:id,email,role}); setEmail("") }
  const addComment = async (event:FormEvent) => { event.preventDefault(); if(!comment.trim()) return; await request({type:"comment",caseId:id,text:comment,mentions}); setComment(""); setMentions([]) }
  const addAction = async (event:FormEvent) => { event.preventDefault(); if(!actionTitle.trim()) return; await request({type:"action",caseId:id,title:actionTitle,assignedTo:assignee||null,dueAt:dueAt?new Date(dueAt).toISOString():null}); setActionTitle("");setAssignee("");setDueAt("") }

  if(loading) return <div className="mx-auto max-w-7xl px-4 py-14 text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin"/>Cargando colaboración…</div>
  if(!data) return <div className="mx-auto max-w-7xl px-4 py-14 text-destructive">{error||"No pudimos cargar el caso."}</div>

  return <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-4 py-10 sm:px-6 lg:py-14">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button asChild variant="ghost" size="sm"><Link href={`/casos/${id}`}><ArrowLeft className="mr-2 h-4 w-4"/>Volver al caso</Link></Button>
      <Badge variant="outline"><Users className="mr-1.5 h-3.5 w-3.5"/>{ROLE_LABELS[data.currentUserRole]}</Badge>
    </div>

    <header><Badge variant="secondary">Phase 13 · Collaboration</Badge><h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Equipo, conversación y próximos responsables.</h1><p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">Coordina el expediente sin salir del caso. Los permisos se aplican por rol y las acciones asignadas alimentan la bandeja personal de pendientes.</p></header>
    {error&&<div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

    <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <Card><CardHeader><CardTitle>Participantes</CardTitle><CardDescription>Responsable, editores y observadores con acceso explícito al caso.</CardDescription></CardHeader><CardContent className="space-y-4">
        {data.members.map(member=><div key={member.user_id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{member.display_name}</p><p className="truncate text-xs text-muted-foreground">{member.email}</p></div><div className="flex items-center gap-2">{member.is_owner?<Badge>Responsable</Badge>:canManage?<><select value={member.role} onChange={e=>void request({type:"member",id:member.user_id,caseId:id,role:e.target.value},"PATCH")} className="h-8 rounded-md border border-input bg-background px-2 text-xs"><option value="editor">Editor</option><option value="viewer">Observador</option></select><Button size="icon" variant="ghost" onClick={async()=>{setBusy(true);await fetch(`/api/cases/collaboration?type=member&id=${member.user_id}&caseId=${id}`,{method:"DELETE"});setBusy(false);await load()}}><Trash2 className="h-4 w-4"/></Button></>:<Badge variant="outline">{ROLE_LABELS[member.role]}</Badge>}</div></div>)}
        {canManage&&<form onSubmit={addMember} className="grid gap-2 rounded-xl border border-dashed border-border p-3 sm:grid-cols-[1fr_120px_auto]"><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="persona@empresa.cl"/><select value={role} onChange={e=>setRole(e.target.value as "editor"|"viewer")} className="h-10 rounded-md border border-input bg-background px-2 text-sm"><option value="editor">Editor</option><option value="viewer">Observador</option></select><Button disabled={busy||!email.trim()}><UserPlus className="mr-2 h-4 w-4"/>Agregar</Button></form>}
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Acciones</CardTitle><CardDescription>Trabajo concreto con un responsable y, opcionalmente, una fecha.</CardDescription></CardHeader><CardContent className="space-y-3">
        {canAssign&&<form onSubmit={addAction} className="grid gap-2 rounded-xl border border-dashed border-border p-3 lg:grid-cols-[1fr_180px_170px_auto]"><Input value={actionTitle} onChange={e=>setActionTitle(e.target.value)} placeholder="Ej: revisar coincidencia antes del viernes"/><select value={assignee} onChange={e=>setAssignee(e.target.value)} className="h-10 rounded-md border border-input bg-background px-2 text-sm"><option value="">Sin asignar</option>{data.members.map(member=><option key={member.user_id} value={member.user_id}>{member.display_name}</option>)}</select><Input type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)}/><Button disabled={busy||!actionTitle.trim()}><Plus className="mr-2 h-4 w-4"/>Asignar</Button></form>}
        {data.actions.length===0?<p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No hay acciones pendientes ni completadas.</p>:data.actions.map(action=>{const assigned=action.assigned_to?memberMap.get(action.assigned_to):null;const canToggle=canAssign||action.assigned_to===data.currentUserId;return <div key={action.id} className="flex items-start gap-3 rounded-xl border border-border p-3"><button disabled={!canToggle||busy} onClick={()=>void request({type:"action",id:action.id,status:action.status==="done"?"open":"done"},"PATCH")} className="mt-0.5 disabled:opacity-40">{action.status==="done"?<CheckCircle2 className="h-5 w-5"/>:<Circle className="h-5 w-5"/>}</button><div className="min-w-0 flex-1"><p className={action.status==="done"?"text-sm text-muted-foreground line-through":"text-sm font-medium"}>{action.title}</p><p className="mt-1 text-xs text-muted-foreground">{assigned?`Responsable: ${assigned.display_name}`:"Sin responsable"}{action.due_at?` · vence ${formatDate(action.due_at)}`:""}</p></div></div>})}
      </CardContent></Card>
    </section>

    <Card><CardHeader><div className="flex items-center gap-2"><MessageSquare className="h-5 w-5"/><CardTitle>Conversación</CardTitle></div><CardDescription>Comenta y menciona participantes. Las menciones aparecen en su bandeja personal.</CardDescription></CardHeader><CardContent className="space-y-4">
      <form onSubmit={addComment} className="space-y-3 rounded-xl border border-border bg-secondary/10 p-4"><textarea value={comment} onChange={e=>setComment(e.target.value)} maxLength={4000} rows={4} placeholder="Agrega contexto, una pregunta o una decisión a revisar…" className="w-full rounded-xl border border-input bg-background p-3 text-sm"/><div className="flex flex-wrap gap-2"><span className="text-xs text-muted-foreground">Mencionar:</span>{data.members.filter(member=>member.user_id!==data.currentUserId).map(member=>{const active=mentions.includes(member.user_id);return <button type="button" key={member.user_id} onClick={()=>setMentions(current=>active?current.filter(id=>id!==member.user_id):[...current,member.user_id])} className={`rounded-full border px-2.5 py-1 text-xs ${active?"border-foreground bg-foreground text-background":"border-border"}`}>@{member.display_name}</button>})}</div><Button disabled={busy||!comment.trim()}>Publicar comentario</Button></form>
      {data.comments.length===0?<p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Todavía no hay conversación en este caso.</p>:data.comments.map(item=>{const author=memberMap.get(item.author_id);return <div key={item.id} className="rounded-xl border border-border p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{author?.display_name||"Participante"}</p><time className="text-xs text-muted-foreground">{formatDate(item.created_at)}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/90">{item.body}</p>{item.mentions.length>0&&<div className="mt-3 flex flex-wrap gap-1.5">{item.mentions.map(userId=><Badge key={userId} variant="outline">@{memberMap.get(userId)?.display_name||"participante"}</Badge>)}</div>}</div>})}
    </CardContent></Card>
  </div>
}
