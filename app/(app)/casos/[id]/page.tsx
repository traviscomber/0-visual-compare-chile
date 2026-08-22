"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft, BriefcaseBusiness, Check, ExternalLink, Loader2, Save, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type CaseRow = { id:string; title:string; status:"open"|"review"|"decided"|"archived"; priority:"low"|"normal"|"high"; context_type:string; context_query:string|null; decision_summary:string|null; notes:string|null; created_at:string; updated_at:string }
type CaseItem = { id:string; item_type:"comparison"|"search"|"watch"|"alert"|"research"; title:string; metadata:Record<string,unknown>; created_at:string }
const TYPE_LABELS: Record<CaseItem["item_type"], string> = { comparison:"Evaluación", search:"Búsqueda", watch:"Vigilancia", alert:"Señal", research:"Investigación" }

export default function CaseDetailPage() {
  const { id } = useParams<{ id:string }>()
  const [caseRow,setCaseRow] = useState<CaseRow|null>(null)
  const [items,setItems] = useState<CaseItem[]>([])
  const [loading,setLoading] = useState(true)
  const [saving,setSaving] = useState(false)
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

  const removeItem = async (itemId:string) => {
    const response = await fetch(`/api/cases/items?id=${encodeURIComponent(itemId)}`,{method:"DELETE"})
    if(response.ok) setItems(current=>current.filter(item=>item.id!==itemId))
  }

  if(loading) return <div className="mx-auto max-w-7xl px-4 py-14 text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin"/>Cargando caso…</div>
  if(!caseRow) return <div className="mx-auto max-w-7xl px-4 py-14"><p className="text-destructive">{error||"Caso no encontrado."}</p></div>

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
    <section className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Decisión</CardTitle><CardDescription>Registra la conclusión del caso.</CardDescription></CardHeader><CardContent><textarea value={decisionSummary} onChange={e=>{setDecisionSummary(e.target.value);setSaved(false)}} rows={6} maxLength={2000} className="w-full rounded-xl border border-input bg-background p-3 text-sm leading-6" placeholder="Qué decidimos y por qué…"/></CardContent></Card>
      <Card><CardHeader><CardTitle>Notas</CardTitle><CardDescription>Pendientes, hipótesis y contexto de trabajo.</CardDescription></CardHeader><CardContent><textarea value={notes} onChange={e=>{setNotes(e.target.value);setSaved(false)}} rows={6} maxLength={8000} className="w-full rounded-xl border border-input bg-background p-3 text-sm leading-6" placeholder="Notas de trabajo…"/></CardContent></Card>
    </section>
    <Card><CardHeader><CardTitle>Evidencia vinculada</CardTitle><CardDescription>Hallazgos guardados desde Evaluar, Investigar y Monitorear.</CardDescription></CardHeader><CardContent className="space-y-3">{items.length===0?<div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Usa “Guardar en caso” desde cualquier journey para construir este expediente.</div>:items.map(item=>{const href=typeof item.metadata?.href==="string"?item.metadata.href:null;const subtitle=typeof item.metadata?.subtitle==="string"?item.metadata.subtitle:null;return <div key={item.id} className="rounded-xl border border-border p-4"><div className="flex items-start justify-between gap-3"><div><Badge variant="outline">{TYPE_LABELS[item.item_type]}</Badge><h3 className="mt-3 font-semibold text-foreground">{item.title}</h3>{subtitle&&<p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}</div><div className="flex gap-1">{href&&<Button asChild size="sm" variant="ghost"><Link href={href}>Abrir<ExternalLink className="ml-1.5 h-3.5 w-3.5"/></Link></Button>}<Button size="icon" variant="ghost" onClick={()=>void removeItem(item.id)} aria-label="Quitar evidencia"><Trash2 className="h-4 w-4"/></Button></div></div></div>})}</CardContent></Card>
  </div>
}