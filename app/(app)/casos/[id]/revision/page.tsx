"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, Clock3, Loader2, ShieldCheck, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { buildApprovalRoundRequest } from "@/lib/cases/access"

type Member={user_id:string;email:string;display_name:string;role:"owner"|"editor"|"viewer";is_owner:boolean}
type Review={id:string;requested_by:string;reviewer_id:string;status:"pending"|"approved"|"changes_requested"|"cancelled";message:string|null;response_note:string|null;created_at:string;responded_at:string|null;governance_round_id:string|null;deadline_at:string|null}
type Governance={required_approvals:number;review_deadline_days:number;block_on_changes:boolean;current_round_id:string|null;round_deadline_at:string|null}
type GovernanceStatus={state:"ready_for_approval"|"waiting"|"blocked"|"approved"|"overdue";required_approvals:number;approved_count:number;pending_count:number;changes_count:number;total_reviewers:number;deadline_at:string|null;waiting_on:string[]}
type Payload={currentUserId:string;currentUserRole:"owner"|"editor"|"viewer";reviews:Review[];members:Member[];governance:Governance|null;governanceStatus:GovernanceStatus|null}

const STATE_LABEL={ready_for_approval:"Lista para aprobación",waiting:"Esperando revisores",blocked:"Bloqueada",approved:"Aprobada",overdue:"Vencida"} as const
const REVIEW_LABEL={pending:"Pendiente",approved:"Aprobado",changes_requested:"Requiere cambios",cancelled:"Cancelado"} as const
const fmt=(v:string)=>new Intl.DateTimeFormat("es-CL",{dateStyle:"medium",timeStyle:"short"}).format(new Date(v))

export default function CaseReviewPage(){
 const {id}=useParams<{id:string}>();const [data,setData]=useState<Payload|null>(null);const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [error,setError]=useState<string|null>(null);const [selected,setSelected]=useState<string[]>([]);const [required,setRequired]=useState(1);const [days,setDays]=useState(3);const [message,setMessage]=useState("");const [notes,setNotes]=useState<Record<string,string>>({})
 const load=async()=>{setLoading(true);setError(null);try{const r=await fetch(`/api/cases/reviews?caseId=${encodeURIComponent(id)}`,{cache:"no-store"});const p=await r.json().catch(()=>({}));if(!r.ok)throw new Error(p.error||"No pudimos cargar revisiones.");setData(p);setRequired(p.governance?.required_approvals??1);setDays(p.governance?.review_deadline_days??3)}catch(c){setError(c instanceof Error?c.message:"No pudimos cargar revisiones.")}finally{setLoading(false)}}
 useEffect(()=>{if(id)void load()},[id]);const memberMap=useMemo(()=>new Map((data?.members??[]).map(m=>[m.user_id,m])),[data]);const canRequest=data?.currentUserRole==="owner"||data?.currentUserRole==="editor";const canPolicy=data?.currentUserRole==="owner";const eligible=data?.members.filter(m=>m.user_id!==data.currentUserId)??[]
 const start=async(e:FormEvent)=>{e.preventDefault();if(!selected.length)return;setBusy(true);setError(null);try{const requestBody=buildApprovalRoundRequest({caseId:id,reviewerIds:selected,message,role:data?.currentUserRole??"viewer",requiredApprovals:required,deadlineDays:days});const r=await fetch("/api/cases/reviews",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(requestBody)});const p=await r.json().catch(()=>({}));if(!r.ok)throw new Error(p.error||"No pudimos iniciar la aprobación.");setSelected([]);setMessage("");await load()}catch(c){setError(c instanceof Error?c.message:"No pudimos iniciar la aprobación.")}finally{setBusy(false)}}
 const act=async(review:Review,action:"approved"|"changes_requested"|"cancelled")=>{if(busy)return;setBusy(true);setError(null);try{const r=await fetch("/api/cases/reviews",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id:review.id,action,note:notes[review.id]||null})});const p=await r.json().catch(()=>({}));if(!r.ok)throw new Error(p.error||"No pudimos actualizar la revisión.");await load()}catch(c){setError(c instanceof Error?c.message:"No pudimos actualizar la revisión.")}finally{setBusy(false)}}
 if(loading)return <div className="mx-auto max-w-[1480px] px-4 py-14 text-sm text-muted-foreground sm:px-6 lg:px-8"><Loader2 className="mr-2 inline h-4 w-4 animate-spin motion-reduce:animate-none"/>Cargando revisión…</div>;if(!data)return <div className="mx-auto max-w-[1480px] px-4 py-14 text-destructive sm:px-6 lg:px-8">{error}</div>
 const gs=data.governanceStatus
 return <div className="mx-auto w-full max-w-[1480px] px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
  <Button asChild variant="ghost" size="sm" className="mb-7 w-fit px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"><Link href={`/casos/${id}`}><ArrowLeft className="mr-2 h-4 w-4"/>Volver al caso</Link></Button>

  <header className="grid gap-8 border-b border-border pb-9 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
   <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">VIDENTIA / Caso / Revisión</p><h1 className="mt-4 max-w-[10ch] text-4xl font-normal leading-[0.96] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-6xl">Aprobaciones con reglas claras.</h1></div>
   <div className="max-w-2xl lg:justify-self-end"><p className="text-base leading-7 text-muted-foreground sm:text-lg">Define cuántas aprobaciones requiere una decisión, quién debe revisar y cuándo vence la ronda. El cierre depende del quórum y de las respuestas registradas.</p><div className="mt-5 flex flex-wrap items-center gap-2"><Badge variant="outline" className="rounded-md"><ShieldCheck className="mr-1.5 h-3.5 w-3.5"/>{gs?STATE_LABEL[gs.state]:"Sin ronda activa"}</Badge></div></div>
  </header>

  {error&&<div role="alert" className="mt-6 border border-red-500/25 bg-red-500/[0.07] p-4 text-sm text-red-300">{error}</div>}

  {gs&&<section className="grid border-b border-border sm:grid-cols-2 lg:grid-cols-4"><Metric label="Estado" value={STATE_LABEL[gs.state]}/><Metric label="Aprobaciones" value={`${gs.approved_count}/${gs.required_approvals}`}/><Metric label="Pendientes" value={String(gs.pending_count)}/><Metric label="Plazo" value={gs.deadline_at?fmt(gs.deadline_at):"Sin ronda"}/></section>}

  {canRequest&&<section className="border-b border-border py-10">
   <div className="grid gap-8 lg:grid-cols-[0.65fr_1.35fr]">
    <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">01 / Nueva ronda</p><h2 className="mt-2 text-2xl font-normal tracking-[-0.03em] text-foreground">Quién revisa y qué quórum se exige</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{canPolicy?"El responsable puede definir el número de aprobaciones y el plazo antes de iniciar.":"La ronda usará la política definida por el responsable."}</p></div>
    <form onSubmit={start}>
     {canPolicy&&<div className="grid gap-3 sm:grid-cols-2"><label className="text-xs text-muted-foreground">Aprobaciones requeridas<Input className="mt-2" type="number" min={1} max={Math.max(1,eligible.length)} value={required} onChange={e=>setRequired(Number(e.target.value))}/></label><label className="text-xs text-muted-foreground">Días para revisar<Input className="mt-2" type="number" min={1} max={30} value={days} onChange={e=>setDays(Number(e.target.value))}/></label></div>}
     <div className="mt-5 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">{eligible.map(m=>{const active=selected.includes(m.user_id);return <button type="button" key={m.user_id} aria-pressed={active} onClick={()=>setSelected(cur=>active?cur.filter(x=>x!==m.user_id):[...cur,m.user_id])} className={`bg-background p-4 text-left outline-none transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-primary/30 ${active?"bg-primary/[0.07]":"hover:bg-secondary/20"}`}><p className="text-sm font-medium text-foreground">{m.display_name}</p><p className="mt-1 text-xs text-muted-foreground">{m.email}</p>{active&&<p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">Seleccionado</p>}</button>})}</div>
     <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={3} maxLength={1000} className="mt-5 w-full border border-input bg-background p-3 text-sm leading-6 text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20" placeholder="Qué decisión deben revisar…"/>
     <Button className="mt-3" disabled={busy||selected.length<Math.max(1,required)}>Iniciar ronda con {selected.length} revisor{selected.length===1?"":"es"}</Button>
    </form>
   </div>
  </section>}

  <section className="py-10">
   <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">02 / Revisiones</p><h2 className="mt-2 text-2xl font-normal tracking-[-0.03em] text-foreground">Respuestas registradas</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Cada respuesta alimenta el estado de la ronda y mantiene visible quién falta.</p></div>
   <div className="mt-5 divide-y divide-border border-y border-border">{data.reviews.length===0?<p className="py-8 text-sm text-muted-foreground">Todavía no hay revisiones.</p>:data.reviews.map(r=>{const reviewer=memberMap.get(r.reviewer_id);const isReviewer=r.reviewer_id===data.currentUserId&&r.status==="pending";const canCancel=r.status==="pending"&&(r.requested_by===data.currentUserId||data.currentUserRole==="owner");return <article key={r.id} className="py-5"><div className="flex justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><ReviewBadge status={r.status}/><p className="text-sm font-medium text-foreground">{reviewer?.display_name||"Participante"}</p></div><p className="mt-2 text-xs text-muted-foreground">{r.deadline_at?`Vence ${fmt(r.deadline_at)}`:`Solicitada ${fmt(r.created_at)}`}</p>{r.response_note&&<p className="mt-3 max-w-3xl border-l-2 border-border pl-3 text-sm leading-6 text-foreground/85">{r.response_note}</p>}</div>{r.status==="pending"?<Clock3 className="h-5 w-5 text-muted-foreground"/>:r.status==="approved"?<CheckCircle2 className="h-5 w-5 text-primary"/>:<XCircle className="h-5 w-5 text-muted-foreground"/>}</div>{isReviewer&&<div className="mt-4 border-t border-border pt-4"><textarea value={notes[r.id]??""} onChange={e=>setNotes(cur=>({...cur,[r.id]:e.target.value}))} rows={2} className="w-full border border-input bg-background p-3 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20" placeholder="Comentario de revisión…"/><div className="mt-3 flex flex-wrap gap-2"><Button onClick={()=>void act(r,"approved")} disabled={busy}>Aprobar</Button><Button variant="outline" onClick={()=>void act(r,"changes_requested")} disabled={busy}>Pedir cambios</Button></div></div>}{canCancel&&<Button size="sm" variant="ghost" className="mt-2 px-0 text-muted-foreground" onClick={()=>void act(r,"cancelled")}>Cancelar solicitud</Button>}</article>})}</div>
  </section>
 </div>
}
function Metric({label,value}:{label:string;value:string}){return <div className="border-b border-border py-6 sm:border-b-0 sm:border-r sm:px-5 first:pl-0 last:border-r-0"><p className="text-lg font-semibold text-foreground">{value}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{label}</p></div>}
function ReviewBadge({status}:{status:Review["status"]}){if(status==="approved")return <Badge className="rounded-md border-primary/20 bg-primary/[0.07] text-primary hover:bg-primary/[0.07]">{REVIEW_LABEL[status]}</Badge>;if(status==="changes_requested")return <Badge className="rounded-md border-amber-300/20 bg-amber-300/[0.06] text-amber-200 hover:bg-amber-300/[0.06]">{REVIEW_LABEL[status]}</Badge>;return <Badge variant="outline" className="rounded-md">{REVIEW_LABEL[status]}</Badge>}
