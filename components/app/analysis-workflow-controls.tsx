"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Loader2, Save, Tags } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SaveToCaseAction } from "@/components/app/save-to-case-action"

type Label = { id: string; name: string; category: string; description: string; color: string }
type Props = { comparisonId: string; marca: string; risk: string; resultCount: number }

const CATEGORY_LABELS: Record<string, string> = { case_status: "Estado del caso", risk: "Riesgo", relevance: "Relevancia", action: "Acción", monitoring: "Seguimiento" }

export function AnalysisWorkflowControls({ comparisonId, marca, risk, resultCount }: Props) {
  const [labels, setLabels] = useState<Label[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch("/api/trademark-labels", { cache: "no-store" }).then(async (response) => {
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? "No fue posible cargar el catálogo")
      if (active) setLabels(body.labels ?? [])
    }).catch((reason) => active && setError(reason instanceof Error ? reason.message : "No fue posible cargar el catálogo")).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const suggested = useMemo(() => {
    const names = new Set<string>()
    names.add("Nuevo")
    names.add(risk.toUpperCase() === "ALTO" ? "Riesgo alto" : risk.toUpperCase() === "MEDIO" ? "Riesgo medio" : "Riesgo bajo")
    if (resultCount > 0) names.add("Antecedente relevante")
    if (risk.toUpperCase() === "ALTO") names.add("Requiere opinión legal")
    return names
  }, [risk, resultCount])

  const grouped = useMemo(() => labels.reduce<Record<string, Label[]>>((groups, label) => { (groups[label.category] ??= []).push(label); return groups }, {}), [labels])

  function toggle(id: string) { setSaved(false); setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]) }

  async function save() {
    setSaving(true); setError(null)
    try {
      const response = await fetch("/api/trademark-labels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ comparisonId, labelIds: selected }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? "No fue posible registrar las etiquetas")
      setSaved(true)
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No fue posible registrar las etiquetas") } finally { setSaving(false) }
  }

  return <Card className="border-primary/20 bg-card/80">
    <CardHeader>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><CardTitle className="flex items-center gap-2 font-serif text-lg"><Tags className="size-4 text-primary" />Gestión de la evaluación</CardTitle><CardDescription>Clasifica esta evaluación o conviértela en evidencia de un caso persistente.</CardDescription></div>
        <Badge variant="outline">ID real: {comparisonId.slice(0, 8)}</Badge>
      </div>
    </CardHeader>
    <CardContent className="flex flex-col gap-5">
      <div className="grid gap-3 md:grid-cols-4">{[["Capturar", true], ["Validar", true], ["Analizar", true], ["Registrar", saved]].map(([label, complete]) => <div key={String(label)} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"><span className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground">{complete ? <Check className="size-4" /> : "·"}</span><span className={complete ? "text-foreground" : "text-muted-foreground"}>{String(label)}</span></div>)}</div>
      {loading ? <p className="text-sm text-muted-foreground">Cargando catálogo desde la base de datos…</p> : <div className="flex flex-col gap-5">{Object.entries(grouped).map(([category, categoryLabels]) => <div key={category} className="flex flex-col gap-2"><p className="text-sm font-medium">{CATEGORY_LABELS[category] ?? category}</p><div className="flex flex-wrap gap-2">{categoryLabels.map((label) => <Button key={label.id} type="button" size="sm" variant={selected.includes(label.id) ? "default" : "outline"} title={label.description} onClick={() => toggle(label.id)}>{label.name}{suggested.has(label.name) && <span className="ml-1 text-xs opacity-70">Sugerida</span>}</Button>)}</div></div>)}</div>}
      <div className="flex flex-wrap items-start gap-3">
        <Button type="button" onClick={save} disabled={saving || selected.length === 0}>{saving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Save data-icon="inline-start" />}Registrar etiquetas</Button>
        <SaveToCaseAction itemType="comparison" sourceId={comparisonId} title={`Evaluación de ${marca}`} contextType="brand" contextQuery={marca} suggestedCaseTitle={`Marca ${marca}`} metadata={{ href: `/history`, subtitle: `Riesgo ${risk} · ${resultCount} antecedentes` }} size="default" />
        {saved && <Badge variant="secondary">Registrado en Supabase</Badge>}
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </CardContent>
  </Card>
}