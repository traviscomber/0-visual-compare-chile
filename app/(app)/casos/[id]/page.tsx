"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Check, CheckCircle2, ExternalLink, Loader2, RefreshCw, Save, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { buildCaseIntelligence } from "@/lib/cases/intelligence"

type CaseRow = { id:string; title:string; status:"open"|"review"|"decided"|"archived"; priority:"low"|"normal"|"high"; context_type:string; context_query:string|null; decision_summary:string|null; notes:string|null; last_reviewed_at:string|null; created_at:string; updated_at:string }
type CaseItem = { id:string; item_type:"comparison"|"search"|"watch"|"alert"|"research"; title:string; metadata:Record<string,unknown>; created_at:string }
type CaseEvent = { id:string; event_type:string; title:string; payload:Record<string,unknown>; occurred_at:string }

const TYPE_LABELS: Record<CaseItem["item_type"], string> = { comparison:"Evaluación", search:"Búsqueda", watch:"Vigilancia", alert:"Señal", research:"Investigación" }
const STATUS_LABELS: Record<CaseRow["status"],string> = { open:"Abierto", review:"En revisión", decided:"Decidido", archived:"Archivado" }
const PRIORITY_LABELS: Record<CaseRow["priority"],string> = { low:"Baja", normal:"Normal", high:"Alta" }
const READINESS_LABELS = { early:"Recién iniciado", developing:"En análisis", "decision-ready":"Listo para decidir", decided:"Decisión registrada" } as const

function formatDateTime(value:string) { return new Intl.DateTimeFormat("es-CL",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value)) }

export default function CaseDetailPage() {
  const { id } = useParams<{ id:string }>()
  const [caseRow,setCaseRow] = useState<CaseRow|null>(null)
  const [items,setItems] = useState<CaseItem[]>([])
  const [events,setEvents] = useState<CaseEvent[]>([])
  const [loading,setLoading] = useState(true)
  const [saving,setSaving] = useState(false)
  const [reviewing,setReviewing] = useState(false)
  const [saved,setSaved] = useState(false)
  const [error,setError] = useState<string|null>(null)
  const [title,setTitle] = useState("")
  const [status,setStatus] = useState<CaseRow["status"]>("open")
  const [priority,setPriority] = useState<CaseRow["priority"]>("normal")
  const [decisionSummary,setDecisionSummary] = useState("")
  const [notes,setNotes] = useState("")

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const response = await fetch(`/api/cases/items?caseId=${encodeURIComponent(id)}`,{cache:"no-store"})
      const payload = await response.json().catch(()=>({}))
      if(!response.ok) throw new Error(payload.error||"No pudimos cargar el caso.")
      const row = payload.case as CaseRow
      setCaseRow(row); setItems(payload.items??[]); setEvents(payload.events??[]); setTitle(row.title); setStatus(row.status); setPriority(row.priority); setDecisionSummary(row.decision_summary??""); setNotes(row.notes??"")
    } catch(cause) { setError(cause instanceof Error?cause.message:"No pudimos cargar el caso.") } finally { setLoading(false) }
  }
  useEffect(()=>{ if(id) void load() },[id])

  const intelligence = useMemo(()=>caseRow ? buildCaseIntelligence({ status, contextType:caseRow.context_type, decisionSummary, notes, lastReviewedAt:caseRow.last_reviewed_at, items }) : null,[caseRow,status,decisionSummary,notes,items])

  const save = async () => {
    if(!caseRow||saving) return
    setSaving(true); setSaved(false); setError(null)
    try {
      const response = await fetch("/api/cases",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id:caseRow.id,title,status,priority,decisionSummary,notes})})
      const payload = await response.json().catch(()=>({}))
      if(!response.ok) throw new Error(payload.error||"No pudimos guardar los cambios.")
      setCaseRow(payload.case); setSaved(true); await load()
    } catch(cause) { setError(cause instanceof Error?cause.message:"No pudimos guardar los cambios.") } finally { setSaving(false) }
  }

  const markReviewed = async () => {
    if(!caseRow||reviewing) return
    setReviewing(true); setError(null)
    try {
      const response = await fetch("/api/cases",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id:caseRow.id,markReviewed:true})})
      const payload = await response.json().catch(()=>({}))
      if(!response.ok) throw new Error(payload.error||"No pudimos registrar la revisión.")
      setCaseRow(payload.case); await load()
    } catch(cause) { setError(cause instanceof Error?cause.message:"No pudimos registrar la revisión.") } finally { setReviewing(false) }
  }

  const removeItem = async (itemId:string) => {
    setError(null)
    try {
      const response = await fetch(`/api/cases/items?id=${encodeURIComponent(itemId)}`,{method:"DELETE"})
      const payload = await response.json().catch(()=>({}))
      if(!response.ok) throw new Error(payload.error||"No pudimos quitar la evidencia del caso.")
      await load()
    } catch(cause) {
      setError(cause instanceof Error?cause.message:"No pudimos quitar la evidencia del caso.")
    }
  }

  if(loading) return <div className="mx-auto max-w-[1480px] px-4 py-14 text-sm text-muted-foreground sm:px-6 lg:px-8"><Loader2 className="mr-2 inline h-4 w-4 animate-spin motion-reduce:animate-none"/>Cargando caso…</div>
  if(!caseRow || !intelligence) return <div className="mx-auto max-w-[1480px] px-4 py-14 sm:px-6 lg:px-8"><p className="text-destructive">{error||"No encontramos este caso."}</p></div>

  return <main className="mx-auto w-full max-w-[1480px] px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
    <Button asChild variant="ghost" size="sm" className="mb-7 w-fit px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"><Link href="/casos"><ArrowLeft className="mr-2 h-4 w-4"/>Volver a casos</Link></Button>

    <header className="border-b border-border pb-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">VIDENTIA / Caso</p>
          <Input value={title} onChange={e=>{setTitle(e.target.value);setSaved(false)}} maxLength={160} aria-label="Nombre del caso" className="mt-3 h-auto border-0 bg-transparent px-0 text-3xl font-normal tracking-[-0.04em] shadow-none focus-visible:ring-0 sm:text-5xl"/>
          <p className="mt-3 text-sm text-muted-foreground">{caseRow.context_query?`${caseRow.context_query} · ${items.length} ${items.length===1?"evidencia":"evidencias"}`:`${items.length} ${items.length===1?"evidencia":"evidencias"}`}</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-muted-foreground">Estado<select value={status} onChange={e=>{setStatus(e.target.value as CaseRow["status"]);setSaved(false)}} className="mt-1 block h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><option value="open">Abierto</option><option value="review">En revisión</option><option value="decided">Decidido</option><option value="archived">Archivado</option></select></label>
          <label className="text-xs text-muted-foreground">Prioridad<select value={priority} onChange={e=>{setPriority(e.target.value as CaseRow["priority"]);setSaved(false)}} className="mt-1 block h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><option value="low">Baja</option><option value="normal">Normal</option><option value="high">Alta</option></select></label>
          <Button onClick={()=>void save()} disabled={saving}>{saving?<Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none"/>:saved?<Check className="mr-2 h-4 w-4"/>:<Save className="mr-2 h-4 w-4"/>}{saved?"Guardado":"Guardar"}</Button>
        </div>
      </div>
    </header>

    {error&&<div role="alert" className="mt-5 border border-red-500/25 bg-red-500/[0.07] p-4 text-sm text-red-300">{error}</div>}

    <section className="py-8">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="flex flex-wrap gap-2"><Badge className="rounded-md border-primary/20 bg-primary/[0.07] text-primary hover:bg-primary/[0.07]">{READINESS_LABELS[intelligence.readiness]}</Badge>{intelligence.newEvidenceCount>0&&<Badge variant="outline" className="rounded-md">{intelligence.newEvidenceCount} {intelligence.newEvidenceCount===1?"novedad":"novedades"}</Badge>}</div><h2 className="mt-3 text-2xl font-normal tracking-[-0.03em] text-foreground">Lectura del caso</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Qué sabemos, qué falta, qué cambió y qué decisión sigue.</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>void load()}><RefreshCw className="mr-2 h-4 w-4"/>Actualizar</Button><Button variant="outline" onClick={()=>void markReviewed()} disabled={reviewing||intelligence.newEvidenceCount===0}>{reviewing?<Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none"/>:<CheckCircle2 className="mr-2 h-4 w-4"/>}Marcar como revisado</Button></div>
      </div>
      <div className="grid divide-y divide-border border-b border-border lg:grid-cols-4 lg:divide-x lg:divide-y-0"><SummaryColumn title="Qué sabemos" items={intelligence.known}/><SummaryColumn title="Qué falta" items={intelligence.missing}/><SummaryColumn title="Qué cambió" items={intelligence.changed}/><div className="py-5 lg:px-5"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Qué decisión sigue</p><p className="mt-3 text-sm leading-6 text-foreground">{intelligence.pendingDecision}</p></div></div>
      <p className="mt-3 text-xs text-muted-foreground">Última revisión: {caseRow.last_reviewed_at ? formatDateTime(caseRow.last_reviewed_at) : "todavía no registrada"}.</p>
    </section>

    <section className="grid gap-8 border-t border-border py-8 lg:grid-cols-2">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Decisión</p><h2 className="mt-2 text-lg font-semibold text-foreground">Qué decidió el equipo y por qué</h2><textarea value={decisionSummary} onChange={e=>{setDecisionSummary(e.target.value);setSaved(false)}} rows={6} maxLength={2000} className="mt-4 w-full border border-input bg-background p-3 text-sm leading-6 text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20" placeholder="Ejemplo: avanzar con la solicitud, sujeto a revisar…"/></div>
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Trabajo</p><h2 className="mt-2 text-lg font-semibold text-foreground">Notas y preguntas pendientes</h2><textarea value={notes} onChange={e=>{setNotes(e.target.value);setSaved(false)}} rows={6} maxLength={8000} className="mt-4 w-full border border-input bg-background p-3 text-sm leading-6 text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20" placeholder="Ejemplo: confirmar titular, revisar clase 35…"/></div>
    </section>

    <section className="border-t border-border py-8"><div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Evidencia</p><h2 className="mt-2 text-xl font-normal tracking-[-0.02em] text-foreground">Lo que sustenta este caso</h2></div><Badge variant="outline" className="rounded-md">{items.length} {items.length===1?"elemento":"elementos"}</Badge></div><div className="mt-4 divide-y divide-border border-y border-border">{items.length===0?<div className="py-8 text-sm text-muted-foreground">Todavía no hay evidencia vinculada. Puedes guardar resultados desde Investigar, Evaluar o Vigilancia.</div>:items.map(item=>{const href=typeof item.metadata?.href==="string"?item.metadata.href:null;const subtitle=typeof item.metadata?.subtitle==="string"?item.metadata.subtitle:null;const isNew=!caseRow.last_reviewed_at||Date.parse(item.created_at)>Date.parse(caseRow.last_reviewed_at);return <div key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap gap-2"><Badge variant="outline" className="rounded-md">{TYPE_LABELS[item.item_type]}</Badge>{isNew&&<Badge className="rounded-md border-amber-300/20 bg-amber-300/[0.06] text-amber-200 hover:bg-amber-300/[0.06]">Nueva</Badge>}</div><p className="mt-2 font-medium text-foreground">{item.title}</p>{subtitle&&<p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}</div><div className="flex shrink-0 gap-1">{href&&<Button asChild size="sm" variant="ghost"><Link href={href}>Abrir <ExternalLink className="ml-1.5 h-3.5 w-3.5"/></Link></Button>}<Button size="icon" variant="ghost" onClick={()=>void removeItem(item.id)} aria-label="Quitar evidencia del caso"><Trash2 className="h-4 w-4"/></Button></div></div>})}</div></section>

    <section className="border-t border-border py-8"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Historial</p><h2 className="mt-2 text-xl font-normal tracking-[-0.02em] text-foreground">Qué ha pasado en este caso</h2><div className="mt-4 divide-y divide-border border-y border-border">{events.length===0?<div className="py-8 text-sm text-muted-foreground">Todavía no hay cambios registrados.</div>:events.slice(0,12).map(event=><div key={event.id} className="grid gap-1 py-3 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-sm font-medium text-foreground">{event.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{humanEvent(event.event_type)}</p></div><time className="text-xs text-muted-foreground">{formatDateTime(event.occurred_at)}</time></div>)}</div></section>

    <section className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-6 text-xs text-muted-foreground"><span>Estado: {STATUS_LABELS[status]} · Prioridad: {PRIORITY_LABELS[priority]}</span><span>La lectura ordena evidencia; la decisión profesional sigue siendo del equipo.</span></section>
  </main>
}

function SummaryColumn({title,items}:{title:string;items:string[]}) { return <div className="py-5 lg:px-5 lg:first:pl-0"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</p>{items.length?<ul className="mt-3 space-y-2">{items.slice(0,5).map((item,index)=><li key={`${item}-${index}`} className="text-sm leading-5 text-foreground/90">{item}</li>)}</ul>:<p className="mt-3 text-sm text-muted-foreground">Sin información adicional.</p>}</div> }
function humanEvent(type:string) { if(type==="case_created")return "Caso creado"; if(type==="status_changed")return "Cambió el estado"; if(type==="priority_changed")return "Cambió la prioridad"; if(type==="decision_changed")return "Se actualizó la decisión"; if(type==="notes_changed")return "Se actualizaron las notas"; if(type==="review_checkpoint")return "Se registró una revisión"; if(type==="item_added")return "Se añadió evidencia"; if(type==="item_removed")return "Se quitó evidencia"; return "Actividad del caso" }
