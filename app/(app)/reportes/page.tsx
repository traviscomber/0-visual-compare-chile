"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Archive, FilePlus2, FileText, Loader2, RefreshCw, ShieldCheck } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Vertical="brand"|"patent"|"technology"
type Report={id:string;series_id:string;version:number;created_by:string;organization_id:string|null;vertical:Vertical;subject:string;title:string;period_start:string|null;period_end:string|null;what_changed:unknown[];what_matters:unknown[];evidence:unknown[];recommended_review:unknown[];watch_next:unknown[];source_snapshot:Record<string,unknown>;created_at:string}
type Comparison={id:string;classification:string|null;recommendation:string|null;brand_context:unknown;result_json:unknown;created_at:string}

const VERTICAL_LABEL:Record<Vertical,string>={brand:"Marca",patent:"Patente",technology:"Tecnología"}

export default function ReportsPage(){
  const [reports,setReports]=useState<Report[]>([])
  const [comparisons,setComparisons]=useState<Comparison[]>([])
  const [filter,setFilter]=useState<"all"|Vertical>("all")
  const [mode,setMode]=useState<Vertical>("patent")
  const [subject,setSubject]=useState("")
  const [ipc,setIpc]=useState("")
  const [windowDays,setWindowDays]=useState(180)
  const [comparisonId,setComparisonId]=useState("")
  const [showCreate,setShowCreate]=useState(false)
  const [loading,setLoading]=useState(true)
  const [creating,setCreating]=useState(false)
  const [error,setError]=useState<string|null>(null)

  async function load(){
    setLoading(true);setError(null)
    try{
      const [reportResponse,comparisonResponse]=await Promise.all([fetch("/api/intelligence/reports",{cache:"no-store"}),fetch("/api/comparisons",{cache:"no-store"})])
      const reportPayload=await reportResponse.json().catch(()=>({}));const comparisonPayload=await comparisonResponse.json().catch(()=>({}))
      if(!reportResponse.ok)throw new Error(reportPayload.error||"No pudimos cargar los reportes.")
      setReports(Array.isArray(reportPayload.reports)?reportPayload.reports:[])
      setComparisons(comparisonResponse.ok&&Array.isArray(comparisonPayload.comparisons)?comparisonPayload.comparisons.slice(0,12):[])
    }catch(cause){setError(cause instanceof Error?cause.message:"No pudimos cargar los reportes.")}finally{setLoading(false)}
  }

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);const requested=params.get("create");const requestedSubject=params.get("subject")?.trim();const requestedIpc=params.get("ipc")?.trim()
    if(requested==="brand"||requested==="patent"||requested==="technology"){setMode(requested);setShowCreate(true)}
    if(requestedSubject)setSubject(requestedSubject.slice(0,240));if(requestedIpc)setIpc(requestedIpc.slice(0,16).toUpperCase())
    void load()
  },[])

  const visible=useMemo(()=>filter==="all"?reports:reports.filter(item=>item.vertical===filter),[reports,filter])
  const latestBySeries=useMemo(()=>{const map=new Map<string,Report>();for(const report of reports){const current=map.get(report.series_id);if(!current||report.version>current.version)map.set(report.series_id,report)}return [...map.values()]},[reports])
  const counts={brand:latestBySeries.filter(item=>item.vertical==="brand").length,patent:latestBySeries.filter(item=>item.vertical==="patent").length,technology:latestBySeries.filter(item=>item.vertical==="technology").length}

  async function createReport(){
    if(creating)return
    let body:Record<string,unknown>
    if(mode==="brand"){
      if(!comparisonId){setError("Selecciona una evaluación de marca persistida.");return}
      body={vertical:"brand",comparisonId}
    }else if(mode==="patent"){
      if(subject.trim().length<3){setError("Describe la invención o tecnología.");return}
      body={vertical:"patent",query:subject.trim(),ipc:ipc.trim()||null}
    }else{
      if(subject.trim().length<2){setError("Indica la tecnología a analizar.");return}
      body={vertical:"technology",query:subject.trim(),windowDays}
    }
    setCreating(true);setError(null)
    try{
      const response=await fetch("/api/intelligence/reports",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)})
      const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||"No pudimos crear el reporte.")
      setShowCreate(false);await load()
    }catch(cause){setError(cause instanceof Error?cause.message:"No pudimos crear el reporte.")}finally{setCreating(false)}
  }

  return <OperationalPage>
    <OperationalHeader eyebrow="VIDENTIA / Reports" title="Una estructura de inteligencia para las tres verticales." description={<>Cada snapshot responde las mismas cinco preguntas: qué cambió, qué importa, qué evidencia lo respalda, qué revisar y qué vigilar después. Las versiones son inmutables.</>} meta={<><span>Brand · Patent · Technology</span><span>Versionado</span><span>Evidencia trazable</span><span>Sin conclusiones automáticas</span></>} actions={<><Button asChild variant="outline"><Link href="/reportes/evaluaciones"><Archive className="h-4 w-4"/>Evaluaciones anteriores</Link></Button><Button onClick={()=>setShowCreate(value=>!value)}><FilePlus2 className="h-4 w-4"/>Nuevo reporte</Button></>}/>

    <OperationalMetricRail>
      <OperationalMetric value={latestBySeries.length} label="Series activas" detail="Última versión por tema"/>
      <OperationalMetric value={counts.brand} label="Brand" detail="Series de marcas"/>
      <OperationalMetric value={counts.patent} label="Patent" detail="Series de prior art"/>
      <OperationalMetric value={counts.technology} label="Technology" detail="Series tecnológicas"/>
    </OperationalMetricRail>

    {showCreate?<section className="border-b border-border/80 py-7"><OperationalPanel><OperationalSectionHeader eyebrow="Generar snapshot" title="Elige la evidencia canónica" meta="El servidor reconstruye el reporte; el navegador no entrega conclusiones libres."/><div className="mt-5 grid grid-cols-3 gap-1 bg-[#0F2A33] p-1 sm:w-[480px]">{(["brand","patent","technology"] as Vertical[]).map(item=><button key={item} type="button" onClick={()=>setMode(item)} className={`min-h-10 px-3 text-xs font-medium ${mode===item?"bg-[#173B37] text-white":"text-muted-foreground hover:text-white"}`}>{VERTICAL_LABEL[item]}</button>)}</div>
      {mode==="brand"?<div className="mt-5"><select value={comparisonId} onChange={event=>setComparisonId(event.target.value)} className="h-11 w-full max-w-3xl rounded-[9px] border border-input bg-background px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-ring/50"><option value="">Selecciona una evaluación persistida</option>{comparisons.map(item=><option key={item.id} value={item.id}>{brandName(item)||"Marca evaluada"} · {item.classification||"sin clasificación"} · {formatDate(item.created_at)}</option>)}</select>{!comparisons.length?<p className="mt-3 text-xs text-muted-foreground">No encontramos evaluaciones de marca recientes. Crea una desde Marcas antes de generar este snapshot.</p>:null}</div>:mode==="patent"?<div className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px]"><Input value={subject} onChange={event=>setSubject(event.target.value)} maxLength={240} placeholder="Describe una invención o tecnología"/><Input value={ipc} onChange={event=>setIpc(event.target.value.toUpperCase())} maxLength={16} placeholder="IPC opcional"/></div>:<div className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px]"><Input value={subject} onChange={event=>setSubject(event.target.value)} maxLength={160} placeholder="Ej. nanoburbujas en acuicultura"/><select value={windowDays} onChange={event=>setWindowDays(Number(event.target.value))} className="h-10 rounded-[9px] border border-input bg-background px-3 text-sm text-white"><option value={90}>90 días</option><option value={180}>180 días</option><option value={365}>365 días</option></select></div>}
      <div className="mt-5 flex items-center justify-between gap-4"><p className="max-w-2xl text-xs leading-5 text-muted-foreground">Si ya existe una serie para el mismo tema y vertical, VIDENTIA crea la siguiente versión y compara el nuevo snapshot contra el anterior.</p><Button onClick={()=>void createReport()} disabled={creating}>{creating?<Loader2 className="h-4 w-4 animate-spin"/>:<FileText className="h-4 w-4"/>}Generar reporte</Button></div></OperationalPanel></section>:null}

    {error?<div role="alert" className="mt-6 bg-[#3A2525] p-4 text-sm text-[#E8AAA3]">{error}</div>:null}

    <section className="py-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><OperationalSectionHeader eyebrow="Historial versionado" title="Intelligence reports" meta={`${visible.length} snapshot${visible.length===1?"":"s"}`}/><div className="flex flex-wrap gap-1">{(["all","brand","patent","technology"] as const).map(item=><button key={item} onClick={()=>setFilter(item)} className={`min-h-9 px-3 text-xs ${filter===item?"bg-[#173B37] text-white":"bg-[#13272D] text-muted-foreground hover:text-white"}`}>{item==="all"?"Todos":VERTICAL_LABEL[item]}</button>)}</div></div>
      {loading?<div className="mt-5 flex items-center gap-2 border-y border-border/80 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Cargando snapshots…</div>:visible.length?<div className="mt-5 space-y-5">{visible.map(report=><ReportCard key={report.id} report={report}/>)}</div>:<OperationalPanel className="mt-5 py-10 text-center"><ShieldCheck className="mx-auto h-5 w-5 text-[#96B5A6]"/><p className="mt-4 text-sm font-medium text-white">Aún no hay reportes comunes.</p><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Genera el primer snapshot desde una evaluación de marca, una revisión de prior art o una tecnología. El primer corte se registra explícitamente como baseline.</p></OperationalPanel>}
    </section>
  </OperationalPage>
}

function ReportCard({report}:{report:Report}){return <OperationalPanel><div className="flex flex-col justify-between gap-4 border-b border-border/80 pb-5 sm:flex-row sm:items-start"><div><div className="flex flex-wrap gap-2"><Badge variant="outline">{VERTICAL_LABEL[report.vertical]}</Badge><Badge variant="secondary">v{report.version}</Badge>{report.period_start||report.period_end?<Badge variant="secondary">{report.period_start||"…"} → {report.period_end||"…"}</Badge>:null}</div><h2 className="mt-3 text-xl font-light tracking-[-0.03em] text-[#E7DFCE]">{report.title}</h2><p className="mt-1 text-xs text-muted-foreground">{formatDate(report.created_at)} · serie {report.series_id.slice(0,8)}</p></div><RefreshCw className="h-4 w-4 text-[#456E8E]"/></div><div className="mt-5 grid gap-6 lg:grid-cols-5"><ReportSection number="01" title="Qué cambió" items={report.what_changed}/><ReportSection number="02" title="Qué importa" items={report.what_matters}/><ReportSection number="03" title="Evidencia" items={report.evidence} evidence/><ReportSection number="04" title="Revisión" items={report.recommended_review}/><ReportSection number="05" title="Watch next" items={report.watch_next}/></div></OperationalPanel>}
function ReportSection({number,title,items,evidence=false}:{number:string;title:string;items:unknown[];evidence?:boolean}){return <section><p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#96B5A6]">{number} / {title}</p><div className="mt-3 space-y-2">{items.slice(0,evidence?4:5).map((item,index)=><p key={index} className="text-xs leading-5 text-muted-foreground">{evidence?evidenceText(item):typeof item==="string"?item:JSON.stringify(item)}</p>)}{items.length===0?<p className="text-xs text-muted-foreground">Sin elementos en este corte.</p>:null}{items.length>(evidence?4:5)?<p className="text-[10px] text-[#456E8E]">+{items.length-(evidence?4:5)} adicionales</p>:null}</div></section>}
function evidenceText(value:unknown){if(!value||typeof value!=="object")return String(value);const item=value as Record<string,unknown>;return [item.title,item.applicationNumber,item.source].filter(Boolean).map(String).join(" · ")||"Evidencia persistida"}
function brandName(item:Comparison){const context=item.brand_context&&typeof item.brand_context==="object"&&!Array.isArray(item.brand_context)?item.brand_context as Record<string,unknown>:{};return typeof context.marca==="string"?context.marca:""}
function formatDate(value:string){const date=new Date(value);return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat("es-CL",{dateStyle:"medium",timeStyle:"short"}).format(date)}
