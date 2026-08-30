"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, Bell, CheckCheck, Loader2 } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalSectionHeader } from "@/components/app/operational-ui"
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
  const reviewed=items.length-unread

  return <OperationalPage>
    <OperationalHeader
      eyebrow="VIDENTIA / Notificaciones"
      title="Lo que requiere tu atención."
      description={<>Revisiones, aprobaciones, cambios, menciones y tareas ligadas a un expediente. Lo no revisado permanece arriba hasta que lo confirmes.</>}
      meta={<><span>Atención priorizada</span><span>Expediente trazable</span><span>Revisión explícita</span></>}
      actions={<Button variant="outline" disabled={unread===0||marking!==null} onClick={()=>void mark()}>{marking==="all"?<Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none"/>:<CheckCheck className="h-4 w-4"/>}Marcar todo revisado</Button>}
    />

    <OperationalMetricRail>
      <OperationalMetric value={unread} label="Pendientes" detail="Avisos que aún requieren revisión" tone={unread>0?"warning":"success"}/>
      <OperationalMetric value={reviewed} label="Revisados" detail="Avisos ya confirmados"/>
      <OperationalMetric value={items.length} label="Total visible" detail="Actividad disponible en esta bandeja"/>
      <OperationalMetric value={unread===0?"Al día":"Atención"} label="Estado" detail={unread===0?"No hay avisos pendientes":"Hay actividad por revisar"} tone={unread===0?"success":"warning"}/>
    </OperationalMetricRail>

    {error&&<div role="alert" className="mt-6 rounded-[10px] border border-red-500/25 bg-red-500/[0.07] p-4 text-sm text-red-200">{error}</div>}

    <section className="py-8">
      <OperationalSectionHeader eyebrow="Bandeja de atención" title={unread===0?"Todo revisado":`${unread} pendiente${unread===1?"":"s"}`} meta={`${items.length} aviso${items.length===1?"":"s"}`} />
      <div className="mt-5 divide-y divide-border/80 border-y border-border/80">{loading?<div className="py-10 text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin motion-reduce:animate-none"/>Cargando avisos…</div>:items.length===0?<div className="py-10 sm:py-12"><Bell className="h-5 w-5 text-muted-foreground"/><p className="mt-3 text-sm font-medium text-white">No tienes avisos pendientes.</p><p className="mt-1 text-sm text-muted-foreground">Cuando un expediente requiera tu atención aparecerá aquí.</p></div>:items.map(item=><article key={item.id} className={`grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start ${item.read_at?"opacity-60":""}`}><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="rounded-md">{KIND_LABELS[item.kind]||"Actualización"}</Badge>{!item.read_at&&<Badge className="rounded-md border-primary/20 bg-primary/[0.07] text-primary hover:bg-primary/[0.07]">Nuevo</Badge>}<time className="text-xs text-muted-foreground">{formatDate(item.created_at)}</time></div><h3 className="mt-3 break-words font-medium text-white">{item.title}</h3>{item.body&&<p className="mt-1 max-w-3xl break-words text-sm leading-6 text-muted-foreground">{item.body}</p>}</div><div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">{item.href&&<Button asChild size="sm" variant={item.read_at?"outline":"default"} className="flex-1 sm:flex-none"><Link href={item.href}>Revisar <ArrowRight className="ml-1.5 h-3.5 w-3.5"/></Link></Button>}{!item.read_at&&<Button size="sm" variant="ghost" className="flex-1 sm:flex-none" disabled={marking!==null} onClick={()=>void mark(item.id)}>{marking===item.id?<Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none"/>:null}Marcar revisado</Button>}</div></article>)}</div>
    </section>
  </OperationalPage>
}
