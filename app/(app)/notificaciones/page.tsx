"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, Bell, CheckCheck, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Notification = { id:string; kind:string; title:string; body:string|null; href:string|null; read_at:string|null; created_at:string }
const formatDate=(value:string)=>new Intl.DateTimeFormat("es-CL",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value))
const KIND_LABELS:Record<string,string>={review_requested:"Revisión solicitada",review_approved:"Aprobación",review_changes_requested:"Cambios solicitados",mention:"Mención",action_assigned:"Tarea asignada"}

export default function NotificationsPage(){
  const [items,setItems]=useState<Notification[]>([])
  const [loading,setLoading]=useState(true)
  const [marking,setMarking]=useState<string|null>(null)
  const [error,setError]=useState<string|null>(null)

  const load=async()=>{setLoading(true);setError(null);try{const response=await fetch("/api/notifications",{cache:"no-store"});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||"No pudimos cargar tus avisos.");setItems(payload.notifications??[])}catch(cause){setError(cause instanceof Error?cause.message:"No pudimos cargar tus avisos.")}finally{setLoading(false)}}
  useEffect(()=>{void load()},[])

  const mark=async(id?:string)=>{
    if(marking)return
    setMarking(id??"all");setError(null)
    try{
      const response=await fetch("/api/notifications",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(id?{id}:{all:true})})
      const payload=await response.json().catch(()=>({}))
      if(!response.ok)throw new Error(payload.error||"No pudimos registrar la revisión del aviso.")
      await load()
    }catch(cause){setError(cause instanceof Error?cause.message:"No pudimos registrar la revisión del aviso.")}finally{setMarking(null)}
  }

  const unread=items.filter(item=>!item.read_at).length

  return <div className="mx-auto w-full max-w-[1480px] px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
    <header className="grid gap-8 border-b border-border pb-9 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">VIDENTIA / Notificaciones</p><h1 className="mt-4 max-w-[10ch] text-4xl font-normal leading-[0.96] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-6xl">Lo que requiere tu atención.</h1></div>
      <div className="max-w-2xl lg:justify-self-end"><p className="text-base leading-7 text-muted-foreground sm:text-lg">Revisiones, aprobaciones, cambios, menciones y tareas ligadas a un expediente. Lo no revisado permanece arriba hasta que lo confirmes.</p><div className="mt-5 flex flex-wrap items-center gap-3"><span className="text-xs text-muted-foreground">{unread} aviso{unread===1?"":"s"} pendiente{unread===1?"":"s"}</span><Button variant="outline" disabled={unread===0||marking!==null} onClick={()=>void mark()}>{marking==="all"?<Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none"/>:<CheckCheck className="mr-2 h-4 w-4"/>}Marcar todo revisado</Button></div></div>
    </header>

    {error&&<div role="alert" className="mt-6 border border-red-500/25 bg-red-500/[0.07] p-4 text-sm text-red-300">{error}</div>}

    <section className="py-8">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Bandeja de atención</p><h2 className="mt-2 text-2xl font-normal tracking-[-0.03em] text-foreground">{unread===0?"Todo revisado":`${unread} pendiente${unread===1?"":"s"}`}</h2></div><Bell className="h-4 w-4 text-muted-foreground"/></div>
      <div className="divide-y divide-border border-b border-border">{loading?<div className="py-10 text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin motion-reduce:animate-none"/>Cargando avisos…</div>:items.length===0?<div className="py-12"><Bell className="h-5 w-5 text-muted-foreground"/><p className="mt-3 text-sm font-medium text-foreground">No tienes avisos pendientes.</p><p className="mt-1 text-sm text-muted-foreground">Cuando un expediente requiera tu atención aparecerá aquí.</p></div>:items.map(item=><article key={item.id} className={`grid gap-4 py-5 sm:grid-cols-[1fr_auto] sm:items-start ${item.read_at?"opacity-60":""}`}><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="rounded-md">{KIND_LABELS[item.kind]||"Actualización"}</Badge>{!item.read_at&&<Badge className="rounded-md border-primary/20 bg-primary/[0.07] text-primary hover:bg-primary/[0.07]">Nuevo</Badge>}<time className="text-xs text-muted-foreground">{formatDate(item.created_at)}</time></div><h3 className="mt-3 font-semibold text-foreground">{item.title}</h3>{item.body&&<p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{item.body}</p>}</div><div className="flex shrink-0 flex-wrap gap-2">{item.href&&<Button asChild size="sm" variant={item.read_at?"outline":"default"}><Link href={item.href}>Revisar <ArrowRight className="ml-1.5 h-3.5 w-3.5"/></Link></Button>}{!item.read_at&&<Button size="sm" variant="ghost" disabled={marking!==null} onClick={()=>void mark(item.id)}>{marking===item.id?<Loader2 className="mr-2 h-3.5 w-3.5 animate-spin motion-reduce:animate-none"/>:null}Marcar revisado</Button>}</div></article>)}</div>
    </section>
  </div>
}
