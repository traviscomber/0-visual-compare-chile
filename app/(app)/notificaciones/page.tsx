"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Notification = { id:string; kind:string; title:string; body:string|null; href:string|null; read_at:string|null; created_at:string }
const formatDate=(value:string)=>new Intl.DateTimeFormat("es-CL",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value))
const KIND_LABELS:Record<string,string>={review_requested:"Revisión",review_approved:"Aprobación",review_changes_requested:"Cambios",mention:"Mención",action_assigned:"Acción"}

export default function NotificationsPage(){
  const [items,setItems]=useState<Notification[]>([]);const[loading,setLoading]=useState(true);const[error,setError]=useState<string|null>(null)
  const load=async()=>{setLoading(true);setError(null);try{const r=await fetch("/api/notifications",{cache:"no-store"});const p=await r.json().catch(()=>({}));if(!r.ok)throw new Error(p.error||"No pudimos cargar tus notificaciones.");setItems(p.notifications??[])}catch(c){setError(c instanceof Error?c.message:"No pudimos cargar tus notificaciones.")}finally{setLoading(false)}}
  useEffect(()=>{void load()},[])
  const mark=async(id?:string)=>{await fetch("/api/notifications",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(id?{id}:{all:true})});await load()}
  const unread=items.filter(i=>!i.read_at).length
  return <div className="mx-auto flex w-full max-w-5xl flex-col gap-7 px-4 py-10 sm:px-6 lg:py-14">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Badge variant="secondary"><Bell className="mr-1.5 h-3.5 w-3.5"/>Notificaciones</Badge><h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Lo que cambió y requiere tu atención.</h1><p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Revisiones, aprobaciones, cambios solicitados, menciones y acciones asignadas.</p></div><Button variant="outline" disabled={unread===0} onClick={()=>void mark()}><CheckCheck className="mr-2 h-4 w-4"/>Marcar todas leídas</Button></header>
    {error&&<div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
    <Card><CardHeader><CardTitle>{unread} sin leer</CardTitle><CardDescription>Las notificaciones son personales y sólo tú puedes marcarlas como leídas.</CardDescription></CardHeader><CardContent className="space-y-3">{loading?<div className="py-10 text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin"/>Cargando…</div>:items.length===0?<div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No tienes notificaciones todavía.</div>:items.map(item=><div key={item.id} className={`rounded-xl border p-4 ${item.read_at?"border-border":"border-foreground/20 bg-secondary/20"}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Badge variant="outline">{KIND_LABELS[item.kind]||"Actualización"}</Badge>{!item.read_at&&<Badge>Nueva</Badge>}</div><p className="mt-3 font-medium">{item.title}</p>{item.body&&<p className="mt-1 text-sm leading-6 text-muted-foreground">{item.body}</p>}<p className="mt-2 text-xs text-muted-foreground">{formatDate(item.created_at)}</p></div><div className="flex gap-2">{!item.read_at&&<Button size="sm" variant="ghost" onClick={()=>void mark(item.id)}>Marcar leída</Button>}{item.href&&<Button asChild size="sm" variant="outline"><Link href={item.href}>Abrir</Link></Button>}</div></div></div>)}</CardContent></Card>
  </div>
}
