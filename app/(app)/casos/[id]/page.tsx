"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, BrainCircuit, BriefcaseBusiness, Check, CheckCircle2, ExternalLink, FileClock, Loader2, RefreshCw, Save, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { buildCaseIntelligence } from "@/lib/cases/intelligence"

type CaseRow = { id:string; title:string; status:"open"|"review"|"decided"|"archived"; priority:"low"|"normal"|"high"; context_type:string; context_query:string|null; decision_summary:string|null; notes:string|null; last_reviewed_at:string|null; created_at:string; updated_at:string }
type CaseItem = { id:string; item_type:"comparison"|"search"|"watch"|"alert"|"research"; title:string; metadata:Record<string,unknown>; created_at:string }
type CaseEvent = { id:string; event_type:"case_created"|"status_changed"|"priority_changed"|"decision_changed"|"notes_changed"|"review_checkpoint"|"item_added"|"item_removed"; title:string; payload:Record<string,unknown>; occurred_at:string }
const TYPE_LABELS: Record<CaseItem["item_type"], string> = { comparison:"Evaluación", search:"Búsqueda", watch:"Vigilancia", alert:"Señal", research:"Investigación" }
const READINESS_LABELS = { early:"Temprano", developing:"En desarrollo", "decision-ready":"Listo para decidir", decided:"Decisión registrada" } as const
const EVENT_LABELS: Record<CaseEvent["event_type"], string> = { case_created:"Creación", status_changed:"Estado", priority_changed:"Prioridad", decision_changed:"Decisión", notes_changed:"Notas", review_checkpoint:"Revisión", item_added:"Evidencia", item_removed:"Evidencia" }

function formatDateTime(value:string) {
  return new Intl.DateTimeFormat("es-CL",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value))
}

function eventDetail(event:CaseEvent) {
  const p = event.payload ?? {}
  if (event.event_type === "status_changed") return `${String(p.from ?? "—")} → ${String(p.to ?? "—")}`
  if (event.event_type === "priority_changed") return `${String(p.from ?? "—")} → ${String(p.to ?? "—")}`
  if (event.event_type === "item_added" || event.event_type === "item_removed") return String(p.title ?? "Evidencia del caso")
  if (event.event_type === "case_created") return [p.context_type,p.context_query].filter(Boolean).join(" · ") || "Contexto general"
  if (event.event_type === "decision_changed") return p.has_decision ? "Se registró o actualizó una conclusión." : "Se retiró la conclusión registrada."
  if (event.event_type === "notes_changed") return p.has_notes ? "Se actualizaron las notas de trabajo." : "Se vaciaron las notas de trabajo."
  if (event.event_type === "review_checkpoint") return "Checkpoint de revisión del expediente."
  return ""
}

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
      if(!response.ok) throw new Error(payload.error||"No pudimos actualizar el caso.")
      setCaseRow(payload.case); setSaved(true); await load()
    } catch(cause) { setError(cause instanceof Error?cause.message:"No pudimos actualizar el caso.") } finally { setSaving(false) }
  }

  const markReviewed = async () => {
    if(!caseRow||reviewing) return
    setReviewing(true); setError(null)
    try {
      const response = await fetch("/api/cases",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id:caseRow.id,markReviewed:true})})
      const payload = await response.json().catch(()=>({}))
      if(!response.ok) throw new Error(payload.error||"No pudimos marcar la revisión.")
      setCaseRow(payload.case); await load()
    } catch(cause) { setError(cause instanceof Error?cause.message:"No pudimos marcar la revisión.") } finally { setReviewing(false) }
  }

  const removeItem = async (itemId:string) => {
    const response = await fetch(`/api/cases/items?id=${encodeURIComponent(itemId)}`,{method:"DELETE"})
    if(response.ok) await load()
  }

  if(loading) return <div className="mx-auto max-w-7xl px-4 py-14 text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin"/>Cargando caso…</div>
  if(!caseRow || !intelligence) return <div className="mx-auto max-w-7xl px-4 py-14"><p className="text-destructive">{error||"Caso no encontrado."}</p></div>

  return <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:py-14">
    <Button asChild variant="ghost" size="sm" className="w-fit"><Link href="/casos"><ArrowLeft className="mr-2 h-4 w-4"/>Todos los casos</Link></Button>
    <header className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div><Badge variant="outline"><BriefcaseBusiness className="mr-1.5 h-3.5 w-3.5"/>Caso · {items.length} evidencias</Badge><Input value={title} onChange={e=>{setTitle(e.target.value);setSaved(false)}} maxLength={160} className="mt-4 h-auto border-0 bg-transparent px-0 text-4xl font-semibold tracking-tight shadow-none focus-visible:ring-0 sm:text-5xl"/><p className="mt-3 text-sm text-muted-foreground">{caseRow.context_query?`${caseRow.context_type} · ${caseRow.context_query}`:"Contexto general"}</p></div>
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4">
        <label className="text-xs text-muted-foreground">Estado<select value={status} onChange={e=>{setStatus(e.target.value as CaseRow["status"]);setSaved(false)}} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground"><option value="open">Abierto</option><option value="review">En revisión</option><option value="decided">Decidido</option><option value="archived">Archivado</option></select></label>
        <label className="text-xs text-muted-foreground">Prioridad<select value={priority} onChange={e=>{setPriority(e.target.value as CaseRow["priority"]);setSaved(false)}} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground"><option value="low">Baja</option><option value="normal">Normal</option><option value="high">Alta</option></select></label>
        <Button className="col-span-2" onClick={()=>void save()} disabled={saving}>{saving?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:saved?<Check className="mr-2 h-4 w-4"/>:<Save className="mr-2 h-4 w-4"/>}{saved?"Guardado":"Guardar cambios"}</Button>
      </div>
    </header>

    {error&&<div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

    <section className="rounded-2xl border border-foreground/15 bg-secondary/20 p-5 sm:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl"><div className="flex flex-wrap items-center gap-2"><Badge><BrainCircuit className="mr-1.5 h-3.5 w-3.5"/>Case Intelligence</Badge><Badge variant="outline">{READINESS_LABELS[intelligence.readiness]}</Badge>{intelligence.newEvidenceCount>0&&<Badge variant="secondary">{intelligence.newEvidenceCount} nuevas</Badge>}</div><h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Qué sabemos, qué falta y qué decisión sigue.</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Síntesis determinista basada únicamente en la evidencia vinculada al caso. No genera hechos nuevos ni reemplaza la revisión profesional.</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>void load()}><RefreshCw className="mr-2 h-4 w-4"/>Actualizar lectura</Button><Button onClick={()=>void markReviewed()} disabled={reviewing||intelligence.newEvidenceCount===0}>{reviewing?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<CheckCircle2 className="mr-2 h-4 w-4"/>}Marcar revisado</Button></div>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <IntelligenceCard title="Qué sabemos" items={intelligence.known}/>
        <IntelligenceCard title="Qué falta" items={intelligence.missing}/>
        <IntelligenceCard title="Qué cambió" items={intelligence.changed}/>
        <div className="rounded-xl border border-foreground/15 bg-background p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Decisión pendiente</p><p className="mt-3 text-sm leading-6 text-foreground">{intelligence.pendingDecision}</p></div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Última revisión: {caseRow.last_reviewed_at ? formatDateTime(caseRow.last_reviewed_at) : "aún no registrada"}.</p>
    </section>

    <section className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Decisión</CardTitle><CardDescription>Registra la conclusión del caso.</CardDescription></CardHeader><CardContent><textarea value={decisionSummary} onChange={e=>{setDecisionSummary(e.target.value);setSaved(false)}} rows={6} maxLength={2000} className="w-full rounded-xl border border-input bg-background p-3 text-sm leading-6" placeholder="Qué decidimos y por qué…"/></CardContent></Card>
      <Card><CardHeader><CardTitle>Notas</CardTitle><CardDescription>Pendientes, hipótesis y contexto de trabajo.</CardDescription></CardHeader><CardContent><textarea value={notes} onChange={e=>{setNotes(e.target.value);setSaved(false)}} rows={6} maxLength={8000} className="w-full rounded-xl border border-input bg-background p-3 text-sm leading-6" placeholder="Notas de trabajo…"/></CardContent></Card>
    </section>

    <Card><CardHeader><div className="flex items-center gap-2"><FileClock className="h-5 w-5"/><CardTitle>Línea de tiempo</CardTitle></div><CardDescription>Registro cronológico auditable del expediente. Los eventos se generan en la base de datos y no pueden editarse desde esta interfaz.</CardDescription></CardHeader><CardContent>{events.length===0?<div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Todavía no hay eventos registrados.</div>:<div className="relative space-y-0 before:absolute before:bottom-3 before:left-[17px] before:top-3 before:w-px before:bg-border">{events.map(event=><div key={event.id} className="relative flex gap-4 py-3"><span className="relative z-10 mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background"><span className="h-2.5 w-2.5 rounded-full bg-foreground/60"/></span><div className="min-w-0 flex-1 rounded-xl border border-border bg-secondary/10 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><Badge variant="outline">{EVENT_LABELS[event.event_type]}</Badge><p className="text-sm font-medium text-foreground">{event.title}</p></div><time className="text-xs text-muted-foreground">{formatDateTime(event.occurred_at)}</time></div>{eventDetail(event)&&<p className="mt-2 text-sm leading-5 text-muted-foreground">{eventDetail(event)}</p>}</div></div>)}</div>}</CardContent></Card>

    <Card><CardHeader><CardTitle>Evidencia vinculada</CardTitle><CardDescription>Hallazgos guardados desde Evaluar, Investigar y Monitorear.</CardDescription></CardHeader><CardContent className="space-y-3">{items.length===0?<div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Usa “Guardar en caso” desde cualquier journey para construir este expediente.</div>:items.map(item=>{const href=typeof item.metadata?.href==="string"?item.metadata.href:null;const subtitle=typeof item.metadata?.subtitle==="string"?item.metadata.subtitle:null;const isNew=!caseRow.last_reviewed_at||Date.parse(item.created_at)>Date.parse(caseRow.last_reviewed_at);return <div key={item.id} className={`rounded-xl border p-4 ${isNew?"border-amber-500/25 bg-amber-500/[0.04]":"border-border"}`}><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap gap-2"><Badge variant="outline">{TYPE_LABELS[item.item_type]}</Badge>{isNew&&<Badge variant="secondary">Nueva desde revisión</Badge>}</div><h3 className="mt-3 font-semibold text-foreground">{item.title}</h3>{subtitle&&<p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}</div><div className="flex gap-1">{href&&<Button asChild size="sm" variant="ghost"><Link href={href}>Abrir<ExternalLink className="ml-1.5 h-3.5 w-3.5"/></Link></Button>}<Button size="icon" variant="ghost" onClick={()=>void removeItem(item.id)} aria-label="Quitar evidencia"><Trash2 className="h-4 w-4"/></Button></div></div></div>})}</CardContent></Card>
  </div>
}

function IntelligenceCard({title,items}:{title:string;items:string[]}) {
  return <div className="rounded-xl border border-border bg-background p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</p><ul className="mt-3 space-y-2">{items.map((item,index)=><li key={`${title}-${index}`} className="text-sm leading-5 text-foreground">{item}</li>)}</ul></div>
}
