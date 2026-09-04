"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, ArrowLeft, ExternalLink, Loader2, RefreshCw } from "lucide-react"
import { OperationalHeader, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Priority = "critica" | "alta" | "media"
type AttentionItem = {
  key: string
  signalKey: string
  watchKey: string
  title: string
  subject: string
  source: string
  href: string
  priority: Priority
  reason: string
  occurredAt: string | null
  isNew: boolean
  kind: "regulatory_case" | "new_high_signal"
}
type Summary = { total:number; critical:number; high:number; medium:number }

const EMPTY: Summary = { total:0, critical:0, high:0, medium:0 }
const PRIORITY_LABEL: Record<Priority,string> = { critica:"Crítica", alta:"Alta", media:"Media" }

export default function ExecutiveAttentionPage(){
  const [items,setItems]=useState<AttentionItem[]>([])
  const [summary,setSummary]=useState<Summary>(EMPTY)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)

  async function load(){
    setLoading(true);setError(null)
    try{
      const response=await fetch("/api/intelligence/watches/signals",{cache:"no-store"})
      const payload=await response.json().catch(()=>({}))
      if(!response.ok)throw new Error(payload.error||"No pudimos construir la cola ejecutiva.")
      setItems(Array.isArray(payload.attentionQueue)?payload.attentionQueue:[])
      setSummary(payload.attentionSummary??EMPTY)
    }catch(cause){setError(cause instanceof Error?cause.message:"No pudimos construir la cola ejecutiva.")}finally{setLoading(false)}
  }

  useEffect(()=>{void load()},[])
  const top=useMemo(()=>items.slice(0,12),[items])

  return <OperationalPage>
    <OperationalHeader
      eyebrow="VIDENTIA / EXECUTIVE ATTENTION"
      title="Qué requiere atención"
      description={<>VIDENTIA prioriza casos externos por materialidad y trayectoria observable. La cola explica por qué cada caso merece revisión y mantiene acceso directo a la evidencia.</>}
      meta={<><span>{summary.critical} críticos</span><span>{summary.high} altos</span><span>{summary.medium} medios</span></>}
      actions={<div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/monitorear"><ArrowLeft className="h-4 w-4"/>Monitorear</Link></Button><Button onClick={()=>void load()} disabled={loading}>{loading?<Loader2 className="h-4 w-4 animate-spin"/>:<RefreshCw className="h-4 w-4"/>}Actualizar</Button></div>}
    />

    <section className="grid gap-px border-y border-border/80 bg-border/80 sm:grid-cols-3">
      <Metric label="Crítica" value={summary.critical} detail="Riesgo regulatorio materializado"/>
      <Metric label="Alta" value={summary.high} detail="Escalamiento o señal nueva relevante"/>
      <Metric label="Media" value={summary.medium} detail="Mitigación u observación activa"/>
    </section>

    <section className="py-9">
      <OperationalPanel>
        <OperationalSectionHeader eyebrow="COLA EJECUTIVA" title={summary.total?`${summary.total} caso${summary.total===1?"":"s"} con atención activa`:"Sin casos que requieran atención"} meta="Prioridad · novedad · recencia"/>
        {error?<div role="alert" className="mt-5 bg-[#3A2525] p-4 text-sm text-[#E8AAA3]">{error}</div>:null}
        {loading?<div className="mt-5 flex items-center gap-2 border-y border-border/80 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Calculando prioridad ejecutiva…</div>:top.length?<div className="mt-5 divide-y divide-border/80 border-y border-border/80">{top.map((item,index)=><AttentionRow key={item.key} item={item} index={index}/>)}</div>:<div className="mt-5 border-y border-border/80 py-10"><p className="font-medium text-white">No hay casos priorizados.</p><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">La vigilancia sigue activa. Los casos regulatorios permanecen aquí mientras conserven atención derivada; otras señales aparecen cuando son nuevas y de alta relevancia.</p></div>}
        {items.length>top.length?<p className="mt-4 text-xs text-muted-foreground">Mostrando los 12 casos de mayor prioridad de {items.length}.</p>:null}
      </OperationalPanel>
    </section>
  </OperationalPage>
}

function Metric({label,value,detail}:{label:string;value:number;detail:string}){
  return <div className="bg-background p-6"><p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#96B5A6]">{label}</p><p className="mt-3 font-mono text-3xl text-white">{value}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p></div>
}

function AttentionRow({item,index}:{item:AttentionItem;index:number}){
  const external=item.href.startsWith("http")
  return <article className="grid gap-4 py-5 md:grid-cols-[64px_minmax(0,1fr)_auto] md:items-start">
    <div className="flex items-center gap-2 md:block"><span className="font-mono text-sm text-[#96B5A6]">{String(index+1).padStart(2,"0")}</span><AlertTriangle className="mt-2 hidden h-4 w-4 text-muted-foreground md:block"/></div>
    <div>
      <div className="flex flex-wrap items-center gap-2"><Badge variant={item.priority==="critica"?"destructive":"secondary"}>{PRIORITY_LABEL[item.priority]}</Badge>{item.isNew?<Badge className="bg-[#173B37] text-[#96B5A6] hover:bg-[#173B37]">Nuevo</Badge>:null}<Badge variant="outline">{item.kind==="regulatory_case"?"Caso regulatorio":"Señal externa"}</Badge></div>
      <h2 className="mt-3 text-sm font-medium leading-6 text-white">{item.title}</h2>
      <p className="mt-1 text-xs text-[#96B5A6]">{item.subject} · {item.source}</p>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{item.reason}</p>
      {item.occurredAt?<p className="mt-2 text-[11px] text-muted-foreground">Último movimiento · {formatDate(item.occurredAt)}</p>:null}
    </div>
    <Button asChild variant="ghost" size="sm"><Link href={item.href} target={external?"_blank":undefined} rel={external?"noreferrer":undefined}>Abrir evidencia{external?<ExternalLink className="h-3.5 w-3.5"/>:null}</Link></Button>
  </article>
}

function formatDate(value:string){const date=new Date(value);return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat("es-CL",{dateStyle:"medium",timeStyle:"short"}).format(date)}
