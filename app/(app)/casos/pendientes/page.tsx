"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, CheckCircle2, Inbox, Loader2, MessageSquareText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Action = { id:string; case_id:string; title:string; due_at:string|null; created_at:string; cases:{title?:string}|null }
type Mention = { id:string; case_id:string; body:string; created_at:string; cases:{title?:string}|null }

const formatDate = (value:string) => new Intl.DateTimeFormat("es-CL",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value))

export default function CaseInboxPage() {
  const [actions,setActions] = useState<Action[]>([])
  const [mentions,setMentions] = useState<Mention[]>([])
  const [loading,setLoading] = useState(true)
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
    const response = await fetch("/api/cases/collaboration",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({type:"action",id,status:"done"})})
    if(response.ok) await load()
  }

  return <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:py-14">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Badge variant="secondary"><Inbox className="mr-1.5 h-3.5 w-3.5"/>Lo que espera de mí</Badge><h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Tus pendientes de colaboración.</h1><p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Acciones que te asignaron y comentarios donde te mencionaron, reunidos en un solo lugar.</p></div><Button asChild variant="outline"><Link href="/casos">Todos los casos</Link></Button></header>
    {error&&<div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
    {loading?<div className="py-12 text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin"/>Cargando pendientes…</div>:<section className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Acciones asignadas</CardTitle><CardDescription>{actions.length} pendientes que requieren una acción tuya.</CardDescription></CardHeader><CardContent className="space-y-3">{actions.length===0?<Empty text="No tienes acciones pendientes."/>:actions.map(action=><div key={action.id} className="rounded-xl border border-border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{action.title}</p><p className="mt-1 text-xs text-muted-foreground">{action.cases?.title||"Caso"}{action.due_at?` · vence ${formatDate(action.due_at)}`:""}</p></div><Button size="icon" variant="ghost" onClick={()=>void complete(action.id)} aria-label="Marcar completada"><CheckCircle2 className="h-5 w-5"/></Button></div><Button asChild variant="link" className="mt-2 h-auto p-0"><Link href={`/casos/${action.case_id}/equipo`}>Abrir caso<ArrowRight className="ml-1.5 h-3.5 w-3.5"/></Link></Button></div>)}</CardContent></Card>
      <Card><CardHeader><CardTitle>Menciones</CardTitle><CardDescription>{mentions.length} comentarios te incluyen en la conversación.</CardDescription></CardHeader><CardContent className="space-y-3">{mentions.length===0?<Empty text="No tienes menciones."/>:mentions.map(item=><div key={item.id} className="rounded-xl border border-border p-4"><div className="flex gap-3"><MessageSquareText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"/><div><p className="line-clamp-3 text-sm leading-6">{item.body}</p><p className="mt-2 text-xs text-muted-foreground">{item.cases?.title||"Caso"} · {formatDate(item.created_at)}</p><Button asChild variant="link" className="mt-2 h-auto p-0"><Link href={`/casos/${item.case_id}/equipo`}>Ver conversación<ArrowRight className="ml-1.5 h-3.5 w-3.5"/></Link></Button></div></div></div>)}</CardContent></Card>
    </section>}
  </div>
}

function Empty({text}:{text:string}) { return <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{text}</div> }
