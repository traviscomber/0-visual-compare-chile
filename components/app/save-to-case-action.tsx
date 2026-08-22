"use client"

import { useEffect, useState } from "react"
import { Check, FolderPlus, Loader2, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type CaseSummary = {
  id: string
  title: string
  status: string
  context_type: string
  context_query: string | null
}

type Props = {
  itemType: "comparison" | "search" | "watch" | "alert" | "research"
  sourceId?: string | null
  title: string
  metadata?: Record<string, unknown>
  contextType?: "general" | "brand" | "company" | "technology"
  contextQuery?: string | null
  suggestedCaseTitle?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function SaveToCaseAction({
  itemType,
  sourceId,
  title,
  metadata,
  contextType = "general",
  contextQuery,
  suggestedCaseTitle,
  variant = "outline",
  size = "sm",
  className,
}: Props) {
  const [open, setOpen] = useState(false)
  const [cases, setCases] = useState<CaseSummary[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState("")
  const [newCaseTitle, setNewCaseTitle] = useState(suggestedCaseTitle ?? title)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || cases.length > 0 || loading) return
    setLoading(true)
    fetch("/api/cases", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload.error || "No pudimos cargar los casos.")
        const next = (payload.cases ?? []) as CaseSummary[]
        setCases(next)
        if (next[0]) setSelectedCaseId(next[0].id)
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "No pudimos cargar los casos."))
      .finally(() => setLoading(false))
  }, [open, cases.length, loading])

  async function attach(caseId: string) {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch("/api/cases/items", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId, itemType, sourceId: sourceId ?? null, title, metadata: metadata ?? {} }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos guardar este hallazgo.")
      setSaved(true)
      window.setTimeout(() => setOpen(false), 600)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar este hallazgo.")
    } finally {
      setSaving(false)
    }
  }

  async function createAndAttach() {
    const caseTitle = newCaseTitle.trim()
    if (caseTitle.length < 2 || saving) return
    setSaving(true)
    setError(null)
    try {
      const createResponse = await fetch("/api/cases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: caseTitle, contextType, contextQuery: contextQuery ?? null }),
      })
      const createPayload = await createResponse.json().catch(() => ({}))
      if (!createResponse.ok) throw new Error(createPayload.error || "No pudimos crear el caso.")
      const created = createPayload.case as CaseSummary
      setCases((current) => [created, ...current])
      setSelectedCaseId(created.id)

      const itemResponse = await fetch("/api/cases/items", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId: created.id, itemType, sourceId: sourceId ?? null, title, metadata: metadata ?? {} }),
      })
      const itemPayload = await itemResponse.json().catch(() => ({}))
      if (!itemResponse.ok) throw new Error(itemPayload.error || "El caso se creó, pero no pudimos guardar la evidencia.")
      setSaved(true)
      window.setTimeout(() => setOpen(false), 600)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos crear el caso.")
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <Button type="button" variant={variant} size={size} className={className} onClick={() => { setOpen(true); setSaved(false); setError(null) }}>
        <FolderPlus className="mr-2 h-4 w-4" />Guardar en caso
      </Button>
    )
  }

  return (
    <div className="min-w-[280px] rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">Guardar en un caso</p>
        <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => setOpen(false)} aria-label="Cerrar"><X className="h-4 w-4" /></Button>
      </div>

      {loading ? (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Cargando casos…</div>
      ) : (
        <div className="mt-3 space-y-3">
          {cases.length > 0 && (
            <div className="flex gap-2">
              <select value={selectedCaseId} onChange={(event) => setSelectedCaseId(event.target.value)} className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm text-foreground">
                {cases.filter((item) => item.status !== "archived").map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
              <Button type="button" size="sm" disabled={!selectedCaseId || saving} onClick={() => void attach(selectedCaseId)}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : "Guardar"}
              </Button>
            </div>
          )}

          <div className="border-t border-border pt-3">
            <p className="mb-2 text-xs text-muted-foreground">O crea un caso nuevo</p>
            <div className="flex gap-2">
              <Input value={newCaseTitle} onChange={(event) => setNewCaseTitle(event.target.value)} maxLength={160} className="h-9" placeholder="Nombre del caso" />
              <Button type="button" size="sm" variant="outline" disabled={newCaseTitle.trim().length < 2 || saving} onClick={() => void createAndAttach()}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      )}

      {saved && <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400"><Check className="h-3.5 w-3.5" />Guardado</p>}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}