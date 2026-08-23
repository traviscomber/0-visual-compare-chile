"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Notification = { id:string; kind:string; title:string; body:string|null; href:string|null; read_at:string|null; created_at:string }
const formatDate=(value:string)=>new Intl.DateTimeFormat("es-CL",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value))
const KIND_LABELS:Record<string,string>={review_requested:"Revisión solicitada",review_approved:"Aprobación",review_changes_requested:"Cambios solicitados",mention:"Mención",action_assigned:"Tarea asignada"}

export default function NotificationsPage(){
  const [items,setItems]=useState<Notification[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)
  const load=async()=>{setLoading(true);setError(null);try{const r=await fetch("/api/notifications",{cache:"no-store"});const p=await r.json().catch(()=>({}));if(!r.ok)throw new Error(p.error||"No pudimos cargar tus avisos.");setItems(p.notifications??[])}catch(c){setError(c instanceof Error?c.message:"No pudimos cargar tus avisos.")}finally{setLoading(false)}}
  useEffect(()=>{void load()},[])
  const mark=async(id?:string)=>{await fetch("/api/notifications",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(id?{id}:{all:true})});await load()}
  const unread=items.filter(i=>!i.read_at).length
  return <div className="min-h-full bg-[#F8FAFC]">
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-7 px-4 py-8 sm:px-6 lg:py-12">
      <header className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end">
        <div><div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#0F766E]"><Bell className="h-3.5 w-3.5"/>Avisos</div><h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-5xl">Lo que requiere tu atención.</h1><p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Revisiones, aprobaciones, cambios y tareas. Primero mostramos lo que aún no has revisado.</p></div>
        <Button variant="outline" disabled={unread===0} onClick={()=>void mark()} className="border-slate-200 bg-white"><CheckCheck className="mr-2 h-4 w-4"/>Marcar todo como revisado</Button>
      </header>
      {error&&<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-end justify-between gap-4 border-b border-slate-100 pb-5"><div><p className="text-sm font-medium text-slate-950">{unread===0?"Todo revisado":`${unread} ${unread===1?"aviso pendiente":"avisos pendientes"}`}</p><p className="mt-1 text-sm text-slate-500">Abre el aviso para ir directamente al caso o tarea relacionada.</p></div></div>
        <div className="divide-y divide-slate-100">{loading?<div className="py-10 text-sm text-slate-500"><Loader2 className="mr-2 inline h-4 w-4 animate-spin"/>Cargando avisos…</div>:items.length===0?<div className="py-12 text-center"><Bell className="mx-auto h-6 w-6 text-slate-300"/><p className="mt-3 text-sm font-medium text-slate-800">No tienes avisos pendientes.</p><p className="mt-1 text-sm text-slate-500">Cuando algo requiera tu atención aparecerá aquí.</p></div>:items.map(item=><article key={item.id} className={`py-5 ${item.read_at?"opacity-70":""}`}><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">{KIND_LABELS[item.kind]||"Actualización"}</Badge>{!item.read_at&&<Badge className="bg-teal-50 text-[#0F766E] hover:bg-teal-50">Nuevo</Badge>}</div><h2 className="mt-3 font-semibold text-slate-950">{item.title}</h2>{item.body&&<p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{item.body}</p>}<p className="mt-2 text-xs text-slate-400">{formatDate(item.created_at)}</p></div><div className="flex shrink-0 gap-2">{item.href&&<Button asChild size="sm" className="bg-[#0F766E] text-white hover:bg-[#134E4A]"><Link href={item.href}>Revisar</Link></Button>}{!item.read_at&&<Button size="sm" variant="ghost" onClick={()=>void mark(item.id)}>Marcar revisado</Button>}</div></div></article>)}</div>
      </section>
    </div>
  </div>
}