"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, BrainCircuit, BriefcaseBusiness, Check, CheckCircle2, ExternalLink, Loader2, RefreshCw, Save, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { buildCaseIntelligence } from "@/lib/cases/intelligence"

type CaseRow = { id:string; title:string; status:"open"|"review"|"decided"|"archived"; priority:"low"|"normal"|"high"; context_type:string; context_query:string|null; decision_summary:string|null; notes:string|null; last_reviewed_at:string|null; created_at:string; updated_at:string }
type CaseItem = { id:string; item_type:"comparison"|"search"|"watch"|"alert"|"research"; title:string; metadata:Record<string,unknown>; created_at:string }
const TYPE_LABELS: Record<CaseItem["item_type"], string> = { comparison:"Evaluación", search:"Búsqueda", watch:"Vigilancia", alert:"Señal", research:"Investigación" }
const READINESS_LABELS = { early:"Temprano", developing:"En desarrollo", "decision-ready":"Listo para decidir", decided:"Decisión registrada" } as const

export default function CaseDetailPage() {
  const { id } = useParams<{ id:string }>()
  const [caseRow,setCaseRow] = useState<CaseRow|null>(null)
  const [items,setItems] = useState<CaseItem[]>([])
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
      setCaseRow(row); setItems(payload.items??[]); setTitle(row.title); setStatus(row.status); setPriority(row.priority); setDecisionSummary(row.decision_summary??""); setNotes(row.notes??"")
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
      setCaseRow(payload.case); setSaved(true)
    } catch(cause) { setError(cause instanceof Error?cause.message:"No pudimos actualizar el caso.") } finally { setSaving(false) }
  }

  const markReviewed = async () => {
    if(!caseRow||reviewing) return
    setReviewing(true); setError(null)
    try {
      const response = await fetch("/api/cases",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id:caseRow.id,markReviewed:true})})
      const payload = await response.json().catch(()=>({}))
      if(!response.ok) throw new Error(payload.error||"No pudimos marcar la revisión.")
      setCaseRow(payload.case)
    } catch(cause) { setError(cause instanceof Error?cause.message:"No pudimos marcar la revisión.") } finally { setReviewing(false) }
  }

  const removeItem = async (itemId:string) => {
    const response = await fetch(`/api/cases/items?id=${encodeURIComponent(itemId)}`,{method:"DELETE"})
    if(response.ok) setItems(current=>current.filter(item=>item.id!==itemId))
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
      <p className="mt-4 text-xs text-muted-foreground">Última revisión: {caseRow.last_reviewed_at ? new Intl.DateTimeFormat("es-CL",{dateStyle:"medium",timeStyle:"short"}).format(new Date(caseRow.last_reviewed_at)) : "aún no registrada"}.</p>
    </section>

    <section className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Decisión</CardTitle><CardDescription>Registra la conclusión del caso.</CardDescription></CardHeader><CardContent><textarea value={decisionSummary} onChange={e=>{setDecisionSummary(e.target.value);setSaved(false)}} rows={6} maxLength={2000} className="w-full rounded-xl border border-input bg-background p-3 text-sm leading-6" placeholder="Qué decidimos y por qué…"/></CardContent></Card>
      <Card><CardHeader><CardTitle>Notas</CardTitle><CardDescription>Pendientes, hipótesis y contexto de trabajo.</CardDescription></CardHeader><CardContent><textarea value={notes} onChange={e=>{setNotes(e.target.value);setSaved(false)}} rows={6} maxLength={8000} className="w-full rounded-xl border border-input bg-background p-3 text-sm leading-6" placeholder="Notas de trabajo…"/></CardContent></Card>
    </section>

    <Card><CardHeader><CardTitle>Evidencia vinculada</CardTitle><CardDescription>Hallazgos guardados desde Evaluar, Investigar y Monitorear.</CardDescription></CardHeader><CardContent className="space-y-3">{items.length===0?<div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Usa “Guardar en caso” desde cualquier journey para construir este expediente.</div>:items.map(item=>{const href=typeof item.metadata?.href==="string"?item.metadata.href:null;const subtitle=typeof item.metadata?.subtitle==="string"?item.metadata.subtitle:null;const isNew=!caseRow.last_reviewed_at||Date.parse(item.created_at)>Date.parse(caseRow.last_reviewed_at);return <div key={item.id} className={`rounded-xl border p-4 ${isNew?"border-amber-500/25 bg-amber-500/[0.04]":"border-border"}`}><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap gap-2"><Badge variant="outline">{TYPE_LABELS[item.item_type]}</Badge>{isNew&&<Badge variant="secondary">Nueva desde revisión</Badge>}</div><h3 className="mt-3 font-semibold text-foreground">{item.title}</h3>{subtitle&&<p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}</div><div className="flex gap-1">{href&&<Button asChild size="sm" variant="ghost"><Link href={href}>Abrir<ExternalLink className="ml-1.5 h-3.5 w-3.5"/></Link></Button>}<Button size="icon" variant="ghost" onClick={()=>void removeItem(item.id)} aria-label="Quitar evidencia"><Trash2 className="h-4 w-4"/></Button></div></div></div>})}</CardContent></Card>
  </div>
}

function IntelligenceCard({title,items}:{title:string;items:string[]}) {
  return <div className="rounded-xl border border-border bg-background p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</p><ul className="mt-3 space-y-2">{items.map((item,index)=><li key={`${title}-${index}`} className="text-sm leading-5 text-foreground">{item}</li>)}</ul></div>
}
