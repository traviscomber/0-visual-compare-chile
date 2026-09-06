"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowRight, Bell, CheckCheck, Loader2 } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Notification = { id:string; kind:string; title:string; body:string|null; href:string|null; read_at:string|null; created_at:string }
const formatDate=(value:string)=>new Intl.DateTimeFormat("es-CL",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value))
const KIND_LABELS:Record<string,string>={review_requested:"Revisión solicitada",review_approved:"Aprobación",review_changes_requested:"Cambios solicitados",opportunity_prototype_learning:"Aprendizaje de prototipo",opportunity_conviction:"Tesis debilitada",mention:"Mención",action_assigned:"Tarea asignada",intelligence_signal:"Señal de inteligencia"}
const KIND_PRIORITY:Record<string,number>={review_changes_requested:0,opportunity_prototype_learning:1,opportunity_conviction:2,action_assigned:3,review_requested:4,review_approved:5,mention:6,intelligence_signal:7}
const ACTIONABLE_KINDS=new Set(["review_changes_requested","opportunity_prototype_learning","opportunity_conviction","action_assigned","review_requested"])

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
  const actionable=items.filter(item=>!item.read_at&&ACTIONABLE_KINDS.has(item.kind)).length
  const weakenedTheses=items.filter(item=>!item.read_at&&item.kind==="opportunity_conviction").length
  const prototypeLearning=items.filter(item=>!item.read_at&&item.kind==="opportunity_prototype_learning").length
  const thesisAttention=weakenedTheses+prototypeLearning
  const ranked=useMemo(()=>[...items].sort((a,b)=>{
    if(Boolean(a.read_at)!==Boolean(b.read_at))return a.read_at?1:-1
    const byKind=(KIND_PRIORITY[a.kind]??9)-(KIND_PRIORITY[b.kind]??9)
    if(byKind!==0)return byKind
    return Date.parse(b.created_at)-Date.parse(a.created_at)
  }),[items])
  const headline=actionable?`${actionable} aviso${actionable===1?"":"s"} requiere${actionable===1?"":"n"} acción.`:unread?`${unread} aviso${unread===1?"":"s"} espera${unread===1?"":"n"} revisión.`:"No tienes avisos pendientes."

  return <OperationalPage>
    <OperationalHeader
      eyebrow="VIDENTIA / Notificaciones"
      title={headline}
      description={<>Cambios solicitados, aprendizaje de prototipo, tesis debilitadas, tareas y revisiones aparecen primero. El prototipo sólo genera próximos pasos gobernados: clasificar un outcome o re-investigar una evaluación; nunca valida ni mueve convicción automáticamente.</>}
      meta={<><span>Acción antes que contexto</span><span>Aprendizaje gobernado</span><span>Revisión explícita</span></>}
      actions={<Button variant="outline" disabled={unread===0||marking!==null} onClick={()=>void mark()}>{marking==="all"?<Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none"/>:<CheckCheck className="h-4 w-4"/>}Marcar todo revisado</Button>}
    />

    <OperationalMetricRail>
      <OperationalMetric value={actionable} label="Para actuar" detail="Aprendizaje, tesis, tareas, cambios y revisiones pendientes" tone={actionable>0?"warning":"success"}/>
      <OperationalMetric value={thesisAttention} label="Tesis por atender" detail={`${prototypeLearning} aprendizaje prototipo · ${weakenedTheses} debilitadas`} tone={thesisAttention>0?"warning":"neutral"}/>
      <OperationalMetric value={unread} label="Sin revisar" detail="Todos los avisos pendientes" tone={unread>0?"warning":"neutral"}/>
      <OperationalMetric value={unread===0?"Al día":"Atención"} label="Estado" detail={unread===0?"No hay avisos pendientes":"Hay actividad por revisar"} tone={unread===0?"success":"warning"}/>
    </OperationalMetricRail>

    {error&&<div role="alert" className="mt-6 border border-[#D6A46F]/20 bg-[#332C24]/70 p-4 text-sm text-[#E0B987]">{error}</div>}

    <section className="py-8">
      <OperationalSectionHeader eyebrow="01 / Bandeja de atención" title={unread===0?"Todo revisado":actionable?`${actionable} requiere${actionable===1?"":"n"} acción ahora`:`${unread} pendiente${unread===1?"":"s"} de revisión`} meta="Pendiente accionable → pendiente informativo → revisado" />
      <div className="mt-5 divide-y divide-border/80 border-y border-border/80">{loading?<div className="py-10 text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin motion-reduce:animate-none"/>Cargando avisos…</div>:ranked.length===0?<div className="py-10 sm:py-12"><Bell className="h-5 w-5 text-muted-foreground"/><p className="mt-3 text-sm font-medium text-white">No tienes avisos pendientes.</p><p className="mt-1 text-sm text-muted-foreground">Cuando un expediente o una tesis requiera tu atención aparecerá aquí.</p></div>:ranked.map(item=><article key={item.id} className={`grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start ${item.read_at?"opacity-55":""}`}><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{KIND_LABELS[item.kind]||"Actualización"}</Badge>{!item.read_at&&<Badge className="bg-[#173B37] text-[#96B5A6] hover:bg-[#173B37]">Nuevo</Badge>}<time className="text-xs text-muted-foreground">{formatDate(item.created_at)}</time></div><h3 className="mt-3 break-words font-medium text-white">{item.title}</h3>{item.body&&<p className="mt-1 max-w-3xl break-words text-sm leading-6 text-muted-foreground">{item.body}</p>}</div><div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">{item.href&&<Button asChild size="sm" variant={item.read_at?"outline":"default"} className="flex-1 sm:flex-none"><Link href={item.href}>Revisar <ArrowRight className="ml-1.5 h-3.5 w-3.5"/></Link></Button>}{!item.read_at&&<Button size="sm" variant="ghost" className="flex-1 sm:flex-none" disabled={marking!==null} onClick={()=>void mark(item.id)}>{marking===item.id?<Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none"/>:null}Marcar revisado</Button>}</div></article>)}</div>
    </section>
  </OperationalPage>
}