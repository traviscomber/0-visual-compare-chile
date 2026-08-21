"use client"

import { useMemo, useState } from "react"
import { Check, ClipboardCheck, RefreshCw, Save, Tags } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const DEFAULT_TAGS = ["Antecedente relevante", "Revisión prioritaria", "Pendiente de validación", "Sin conflicto aparente"]

type Props = {
  marca: string
  risk: string
  resultCount: number
}

export function AnalysisWorkflowControls({ marca, risk, resultCount }: Props) {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const [reclassified, setReclassified] = useState(false)
  const suggestedTag = useMemo(() => {
    if (risk.toUpperCase() === "ALTO") return "Revisión prioritaria"
    if (resultCount > 0) return "Antecedente relevante"
    return "Sin conflicto aparente"
  }, [resultCount, risk])

  function toggleTag(tag: string) {
    setSaved(false)
    setSelectedTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])
  }

  return (
    <Card className="border-primary/20 bg-card/80">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 font-serif text-lg"><Tags className="size-4 text-primary" />Clasificación y registro</CardTitle>
            <CardDescription>Revisa la sugerencia, agrega etiquetas y deja el caso listo para seguimiento.</CardDescription>
          </div>
          <Badge variant="secondary">Sugerida: {suggestedTag}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ["Capturar", true], ["Validar", true], ["Analizar", true], ["Registrar", saved],
          ].map(([label, complete]) => (
            <div key={String(label)} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
              <span className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground">{complete ? <Check className="size-4" /> : "·"}</span>
              <span className={complete ? "text-foreground" : "text-muted-foreground"}>{String(label)}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">Etiquetas internas para {marca}</p>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_TAGS.map((tag) => (
              <Button key={tag} type="button" size="sm" variant={selectedTags.includes(tag) ? "default" : "outline"} onClick={() => toggleTag(tag)}>{tag}</Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Las etiquetas registrales Niza/Viena provienen del análisis. Estas etiquetas sirven para gestión y seguimiento interno.</p>
        </div>

        <div className="flex flex-col gap-3 rounded-md border border-dashed border-border p-4">
          <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium">Piloto de reclasificación</p><p className="text-xs text-muted-foreground">Muestra actual: {resultCount} antecedentes. La clasificación anterior se conserva.</p></div><Badge variant={reclassified ? "default" : "outline"}>{reclassified ? "Revisado" : "Pendiente"}</Badge></div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setReclassified(true)}><RefreshCw data-icon="inline-start" />Simular reclasificación</Button>
            <Button type="button" size="sm" onClick={() => setSaved(true)} disabled={selectedTags.length === 0}><Save data-icon="inline-start" />Registrar clasificación</Button>
          </div>
          {reclassified && <p className="flex items-center gap-2 text-xs text-emerald-600"><ClipboardCheck className="size-4" />Muestra reclasificada para revisión. Los casos ambiguos deben validarse manualmente.</p>}
        </div>
      </CardContent>
    </Card>
  )
}
