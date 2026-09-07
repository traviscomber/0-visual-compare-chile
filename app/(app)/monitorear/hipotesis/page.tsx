"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, ExternalLink, Loader2, RefreshCw } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Evidence = { source?:string; title?:string; url?:string|null; date?:string|null; activity?:string|null }
type Monitoring = { id:string; assessment:string; summary:string; evidenceNew:Evidence[]; evidenceContradictory:Evidence[]; sourceCoverage:Record<string,{available?:boolean;evidence_count?:number}>; reviewStatus:string; reviewReason:string|null; reviewedAt:string|null; observedAt:string|null }
type Hypothesis = { id:string; signalEventId:string; hypothesis:string; evidenceFor:Evidence[]; evidenceMissing:string[]; evidenceAgainst:string[]; decisionReason:string|null; decidedAt:string|null; latestMonitoring:Monitoring|null }
type Summary = { active:number; pendingReview:number; contradictory:number; stale:number }
const EMPTY:Summary={active:0,pendingReview:0,contradictory:0,stale:0}
const ASSESSMENT_LABEL:Record<string,string>={strengthening_signal:"Nueva evidencia compatible",contradictory_signal:"Señal contradictoria",source_degradation:"Cobertura degradada",stale_review_due:"Revisión por antigüedad",no_material_change:"Sin cambio material"}

export default function CompetitiveHypothesesPage(){
  const [hypotheses,setHypotheses]=useState<Hypothesis[]>([])
  const [summary,setSummary]=useState<Summary>(EMPTY)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)
  async function load(){setLoading(true);setError(null);try{const response=await fetch("/api/intelligence/competitive-hypotheses/active",{cache:"no-store"});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||"No pudimos cargar las hipótesis competitivas.");setHypotheses(Array.isArray(payload.hypotheses)?payload.hypotheses:[]);setSummary({...EMPTY,...(payload.summary??{})})}catch(cause){setError(cause instanceof Error?cause.message:"No pudimos cargar las hipótesis competitivas.")}finally{setLoading(false)}}
  useEffect(()=>{void load()},[])
  const ordered=useMemo(()=>[...hypotheses].sort((a,b)=>Number(b.latestMonitoring?.reviewStatus==="pending")-Number(a.latestMonitoring?.reviewStatus==="pending")||Date.parse(b.latestMonitoring?.observedAt||b.decidedAt||"")-Date.parse(a.latestMonitoring?.observedAt||a.decidedAt||"")),[hypotheses])
  return <OperationalPage>
    <OperationalHeader eyebrow="VIDENTIA / Inteligencia competitiva" title="Hipótesis competitivas activas" description="Hipótesis aceptadas por una persona y monitoreadas contra evidencia nueva. El sistema detecta cambios; la interpretación y cualquier decisión siguen siendo humanas." meta={<><span>{summary.active} activas</span><span>{summary.pendingReview} por revisar</span><span>{summary.contradictory} contradictorias</span><span>{summary.stale} por antigüedad</span></>} actions={<div className="flex gap-2"><Button asChild variant="outline"><Link href="/monitorear/atencion"><ArrowLeft className="h-4 w-4"/>Atención ejecutiva</Link></Button><Button onClick={()=>void load()} disabled={loading}>{loading?<Loader2 className="h-4 w-4 animate-spin"/>:<RefreshCw className="h-4 w-4"/>}Actualizar</Button></div>}/>
    <OperationalMetricRail>
      <OperationalMetric value={summary.active} label="Activas" detail="Aceptadas por revisión humana" tone="neutral"/>
      <OperationalMetric value={summary.pendingReview} label="Por revisar" detail="Cambios materiales detectados" tone={summary.pendingReview?"warning":"success"}/>
      <OperationalMetric value={summary.contradictory} label="Contradictorias" detail="Señales explícitas, no conclusiones" tone={summary.contradictory?"warning":"neutral"}/>
      <OperationalMetric value={summary.stale} label="Antigüedad" detail="Sin evidencia material nueva ≥90 días" tone={summary.stale?"warning":"neutral"}/>
    </OperationalMetricRail>
    <section className="py-9"><OperationalPanel>
      <OperationalSectionHeader eyebrow="01 / Seguimiento" title={summary.active?`${summary.active} hipótesis bajo seguimiento`:"No hay hipótesis competitivas activas"} meta="evidencia nueva → señal de cambio → revisión humana"/>
      {error?<p role="alert" className="mt-5 text-sm text-[#E0B987]">{error}</p>:null}
      {loading?<p className="mt-5 flex items-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Cargando seguimiento…</p>:ordered.length?<div className="mt-5 divide-y divide-border/80 border-y border-border/80">{ordered.map(item=><HypothesisRow key={item.id} item={item} onChanged={load}/>)}</div>:<div className="mt-5 border-y border-border/80 py-10"><p className="font-medium text-white">Aún no existen hipótesis aceptadas.</p><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Una expansión Nice debe obtener corroboración independiente suficiente y luego ser aceptada explícitamente por una persona antes de entrar a este seguimiento.</p></div>}
    </OperationalPanel></section>
  </OperationalPage>
}

function HypothesisRow({item,onChanged}:{item:Hypothesis;onChanged:()=>Promise<void>}){
  const [reason,setReason]=useState("")
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState<string|null>(null)
  const monitoring=item.latestMonitoring
  async function review(decision:"reviewed"|"dismissed"){if(!monitoring||monitoring.reviewStatus!=="pending"||reason.trim().length<4)return;setBusy(true);setError(null);try{const response=await fetch("/api/intelligence/competitive-hypotheses/monitoring",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id:monitoring.id,decision,reason:reason.trim()})});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||"No pudimos guardar la revisión.");setReason("");await onChanged()}catch(cause){setError(cause instanceof Error?cause.message:"No pudimos guardar la revisión.")}finally{setBusy(false)}}
  const tone=monitoring?.assessment==="contradictory_signal"?"border-[#D6A46F]/30 text-[#E0B987]":monitoring?.assessment==="strengthening_signal"?"border-[#96B5A6]/30 text-[#96B5A6]":""
  return <article className="py-6"><div className="flex flex-wrap items-start justify-between gap-3"><div className="max-w-4xl"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="border-[#96B5A6]/30 text-[#96B5A6]">Aceptada</Badge>{monitoring?<Badge variant="outline" className={tone}>{ASSESSMENT_LABEL[monitoring.assessment]??monitoring.assessment}</Badge>:<Badge variant="outline">Sin corrida aún</Badge>}{monitoring?.reviewStatus==="pending"?<Badge className="bg-[#332C24] text-[#E0B987] hover:bg-[#332C24]">Revisión pendiente</Badge>:null}</div><p className="mt-3 text-sm leading-6 text-foreground/90">{item.hypothesis}</p>{item.decisionReason?<p className="mt-2 text-xs text-muted-foreground">Motivo de aceptación · {item.decisionReason}</p>:null}{item.decidedAt?<p className="mt-1 text-[11px] text-muted-foreground">Aceptada · {formatDate(item.decidedAt)}</p>:null}</div><Button asChild variant="ghost" size="sm"><Link href={`/monitorear/atencion`}>Señal origen</Link></Button></div>
    {monitoring?<div className="mt-4 border-l-2 border-border pl-3"><p className="text-xs font-medium text-foreground">Último monitoreo</p><p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">{monitoring.summary}</p>{monitoring.observedAt?<p className="mt-1 text-[11px] text-muted-foreground">Observado · {formatDate(monitoring.observedAt)}</p>:null}<EvidenceList title="Evidencia nueva" items={monitoring.evidenceNew}/><EvidenceList title="Señales contradictorias" items={monitoring.evidenceContradictory}/>{monitoring.reviewStatus==="pending"?<div className="mt-3 max-w-2xl"><Input value={reason} onChange={event=>setReason(event.target.value)} placeholder="Justificación de la revisión" className="h-9 text-xs"/><div className="mt-2 flex gap-2"><Button size="sm" onClick={()=>void review("reviewed")} disabled={busy||reason.trim().length<4}>{busy?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:null}Registrar revisión</Button><Button size="sm" variant="outline" onClick={()=>void review("dismissed")} disabled={busy||reason.trim().length<4}>Descartar señal</Button></div></div>:monitoring.reviewReason?<p className="mt-3 text-xs text-muted-foreground">Revisión · {monitoring.reviewReason}</p>:null}</div>:<p className="mt-4 text-xs text-muted-foreground">La primera corrida automática todavía no se ha ejecutado.</p>}
    {error?<p role="alert" className="mt-2 text-xs text-[#E0B987]">{error}</p>:null}
    <p className="mt-3 text-[11px] leading-5 text-muted-foreground">El monitoreo no modifica conviction, score, prioridad, estado de oportunidad ni la aceptación original. Cualquier cambio material vuelve a revisión humana.</p>
  </article>
}

function EvidenceList({title,items}:{title:string;items:Evidence[]}){if(!items.length)return null;return <div className="mt-3"><p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{title}</p><div className="mt-1 space-y-1">{items.slice(0,5).map((item,index)=><div key={`${item.source}:${item.title}:${index}`} className="flex items-start gap-2 text-xs text-foreground/80"><span className="min-w-0 flex-1">{item.title||item.source||"Evidencia"}</span>{item.url?<Link href={item.url} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5 text-muted-foreground"/></Link>:null}</div>)}</div></div>}
function formatDate(value:string){const date=new Date(value);return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat("es-CL",{dateStyle:"medium",timeStyle:"short"}).format(date)}
