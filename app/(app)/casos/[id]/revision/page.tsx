"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, Clock3, Loader2, ShieldCheck, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Member = { user_id:string; email:string; display_name:string; role:"owner"|"editor"|"viewer"; is_owner:boolean }
type Review = { id:string; requested_by:string; reviewer_id:string; status:"pending"|"approved"|"changes_requested"|"cancelled"; message:string|null; response_note:string|null; created_at:string; responded_at:string|null }
type Payload = { currentUserId:string; currentUserRole:"owner"|"editor"|"viewer"; reviews:Review[]; members:Member[] }

const LABELS = { pending:"Pendiente", approved:"Aprobado", changes_requested:"Requiere cambios", cancelled:"Cancelado" } as const
const formatDate = (value:string) => new Intl.DateTimeFormat("es-CL",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value))

export default function CaseReviewPage(){
  const { id } = useParams<{id:string}>()
  const [data,setData] = useState<Payload|null>(null)
  const [loading,setLoading] = useState(true)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState<string|null>(null)
  const [reviewer,setReviewer] = useState("")
  const [message,setMessage] = useState("")
  const [notes,setNotes] = useState<Record<string,string>>({})
  const load = async()=>{setLoading(true);setError(null);try{const r=await fetch(`/api/cases/reviews?caseId=${encodeURIComponent(id)}`,{cache:"no-store"});const p=await r.json().catch(()=>({}));if(!r.ok) throw new Error(p.error||"No pudimos cargar las revisiones.");setData(p)}catch(c){setError(c instanceof Error?c.message:"No pudimos cargar las revisiones.")}finally{setLoading(false)}}
  useEffect(()=>{if(id) void load()},[id])
  const members = useMemo(()=>new Map((data?.members??[]).map(m=>[m.user_id,m])),[data])
  const canRequest = data?.currentUserRole==="owner"||data?.currentUserRole==="editor"
  const pending = data?.reviews.filter(r=>r.status==="pending")??[]
  const requestReview = async(e:FormEvent)=>{e.preventDefault();if(!reviewer)return;setBusy(true);setError(null);try{const r=await fetch("/api/cases/reviews",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({caseId:id,reviewerId:reviewer,message})});const p=await r.json().catch(()=>({}));if(!r.ok)throw new Error(p.error||"No pudimos solicitar la revisión.");setReviewer("");setMessage("");await load()}catch(c){setError(c instanceof Error?c.message:"No pudimos solicitar la revisión.")}finally{setBusy(false)}}
  const act = async(review:Review,action:"approved"|"changes_requested"|"cancelled")=>{setBusy(true);setError(null);try{const r=await fetch("/api/cases/reviews",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id:review.id,action,note:notes[review.id]||null})});const p=await r.json().catch(()=>({}));if(!r.ok)throw new Error(p.error||"No pudimos actualizar la revisión.");await load()}catch(c){setError(c instanceof Error?c.message:"No pudimos actualizar la revisión.")}finally{setBusy(false)}}
  if(loading)return <div className="mx-auto max-w-6xl px-4 py-14 text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin"/>Cargando revisiones…</div>
  if(!data)return <div className="mx-auto max-w-6xl px-4 py-14 text-destructive">{error||"No pudimos cargar el caso."}</div>
  return <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-4 py-10 sm:px-6 lg:py-14">
    <div className="flex flex-wrap items-center justify-between gap-3"><Button asChild variant="ghost" size="sm"><Link href={`/casos/${id}`}><ArrowLeft className="mr-2 h-4 w-4"/>Volver al caso</Link></Button><Badge variant="outline"><ShieldCheck className="mr-1.5 h-3.5 w-3.5"/>{pending.length} revisión{pending.length===1?"":"es"} pendiente{pending.length===1?"":"s"}</Badge></div>
    <header><Badge variant="secondary">Phase 14 · Review Workflow</Badge><h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Una decisión importante merece revisión explícita.</h1><p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">Solicita revisión a un participante del caso. Mientras exista una revisión pendiente, el expediente no puede pasar a Decidido.</p></header>
    {error&&<div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
    {canRequest&&<Card><CardHeader><CardTitle>Solicitar revisión</CardTitle><CardDescription>El revisor debe ser un participante del caso y no puedes seleccionarte a ti mismo.</CardDescription></CardHeader><CardContent><form onSubmit={requestReview} className="grid gap-3"><select value={reviewer} onChange={e=>setReviewer(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Selecciona un revisor</option>{data.members.filter(m=>m.user_id!==data.currentUserId).map(m=><option key={m.user_id} value={m.user_id}>{m.display_name} · {m.email}</option>)}</select><textarea value={message} onChange={e=>setMessage(e.target.value)} rows={3} maxLength={1000} className="rounded-xl border border-input bg-background p-3 text-sm" placeholder="Qué necesitas que revise y qué decisión está en juego…"/><Button className="w-fit" disabled={busy||!reviewer}>Solicitar revisión</Button></form></CardContent></Card>}
    <Card><CardHeader><CardTitle>Historial de revisiones</CardTitle><CardDescription>Solicitudes, respuestas y cambios pedidos quedan persistidos y entran al audit trail del caso.</CardDescription></CardHeader><CardContent className="space-y-4">{data.reviews.length===0?<div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Todavía no hay revisiones solicitadas.</div>:data.reviews.map(review=>{const reviewerMember=members.get(review.reviewer_id);const requester=members.get(review.requested_by);const isReviewer=review.reviewer_id===data.currentUserId&&review.status==="pending";const canCancel=review.status==="pending"&&(review.requested_by===data.currentUserId||data.currentUserRole==="owner");return <div key={review.id} className="rounded-xl border border-border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Badge variant={review.status==="pending"?"secondary":"outline"}>{LABELS[review.status]}</Badge><span className="text-sm font-medium">Revisa {reviewerMember?.display_name||"participante"}</span></div><p className="mt-2 text-xs text-muted-foreground">Solicitó {requester?.display_name||"participante"} · {formatDate(review.created_at)}</p>{review.message&&<p className="mt-3 text-sm leading-6">{review.message}</p>}{review.response_note&&<p className="mt-3 rounded-lg bg-secondary/40 p-3 text-sm leading-6">Respuesta: {review.response_note}</p>}</div>{review.status==="pending"&&<Clock3 className="h-5 w-5 text-muted-foreground"/>}</div>{isReviewer&&<div className="mt-4 space-y-3 border-t pt-4"><textarea value={notes[review.id]??""} onChange={e=>setNotes(current=>({...current,[review.id]:e.target.value}))} rows={3} maxLength={2000} className="w-full rounded-xl border border-input bg-background p-3 text-sm" placeholder="Comentario de revisión…"/><div className="flex flex-wrap gap-2"><Button onClick={()=>void act(review,"approved")} disabled={busy}><CheckCircle2 className="mr-2 h-4 w-4"/>Aprobar</Button><Button variant="outline" onClick={()=>void act(review,"changes_requested")} disabled={busy}><XCircle className="mr-2 h-4 w-4"/>Solicitar cambios</Button></div></div>}{canCancel&&<Button className="mt-3" size="sm" variant="ghost" onClick={()=>void act(review,"cancelled")} disabled={busy}>Cancelar solicitud</Button>}</div>})}</CardContent></Card>
  </div>
}
