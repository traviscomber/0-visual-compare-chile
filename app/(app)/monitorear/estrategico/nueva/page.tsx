"use client"

import Link from "next/link"
import { FormEvent, useEffect, useState } from "react"
import { ArrowLeft, Building2, CheckCircle2, ClipboardCheck, Factory, FlaskConical, Globe2, Loader2, MapPin, Plus } from "lucide-react"
import { OperationalHeader, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type WatchType = "technology" | "company" | "competitor"
type SearchScope = "chile" | "global" | "both"

type ActionResponse = {
  href?: string
  error?: string
}

export default function NewStrategicWatchPage() {
  const [type, setType] = useState<WatchType>("technology")
  const [query, setQuery] = useState("")
  const [scope, setScope] = useState<SearchScope>("both")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [taskSaving, setTaskSaving] = useState(false)
  const [taskError, setTaskError] = useState<string | null>(null)
  const [taskHref, setTaskHref] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requestedType = params.get("type")
    const requestedQuery = params.get("q")?.trim() ?? ""
    const requestedScope = params.get("scope")
    if (requestedType === "company" || requestedType === "competitor" || requestedType === "technology") setType(requestedType)
    if (requestedQuery) setQuery(requestedQuery.slice(0, 160))
    if (requestedScope === "chile" || requestedScope === "global" || requestedScope === "both") setScope(requestedScope)
  }, [])

  useEffect(() => {
    setTaskHref(null)
    setTaskError(null)
  }, [type, query, scope])

  async function createWatch(event: FormEvent) {
    event.preventDefault()
    const normalized = query.trim()
    if (normalized.length < 2 || saving) return
    setSaving(true)
    setError(null)
    try {
      const response = await fetch("/api/intelligence/strategic-watchlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, query: normalized, scope }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos crear la vigilancia.")
      window.location.assign("/monitorear/estrategico")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos crear la vigilancia.")
      setSaving(false)
    }
  }

  async function createTask() {
    const normalized = query.trim()
    if (normalized.length < 2 || taskSaving) return
    setTaskSaving(true)
    setTaskError(null)
    try {
      const response = await fetch("/api/intelligence/actions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contextType: type === "technology" ? "technology" : "company",
          contextQuery: normalized,
          caseTitle: limitText(`${watchTypeLabel(type)}: ${normalized}`, 160),
          itemType: "watch",
          sourceId: actionSourceId(type, normalized),
          sourceTitle: limitText(`Contexto estratégico: ${normalized}`, 240),
          actionTitle: "Revisar evidencia y decidir seguimiento",
          priority: "normal",
          evidence: {
            origin: "strategic_watch_confirmation",
            watchType: type,
            query: normalized,
            searchScope: scope,
          },
        }),
      })
      const payload = await response.json().catch(() => ({})) as ActionResponse
      if (!response.ok || !payload.href) throw new Error(payload.error || "No pudimos crear la tarea.")
      setTaskHref(payload.href)
    } catch (cause) {
      setTaskError(cause instanceof Error ? cause.message : "No pudimos crear la tarea.")
    } finally {
      setTaskSaving(false)
    }
  }

  return <OperationalPage>
    <OperationalHeader
      eyebrow="VIDENTIA / Vigilancia estratégica"
      title="Confirma qué quieres vigilar."
      description="Define el concepto y dónde quieres buscar. VIDENTIA normaliza variantes en español e inglés —por ejemplo IA / AI— sin mezclar Chile y el mundo si no lo pides."
      meta={<><span>Acción explícita</span><span>IA + AI normalizado</span><span>Ámbito controlado</span><span>Evidencia trazable</span></>}
      actions={<Button asChild variant="outline"><Link href="/monitorear/estrategico"><ArrowLeft className="h-4 w-4" />Volver a vigilancia</Link></Button>}
    />

    <section className="py-9">
      <OperationalPanel>
        <form onSubmit={createWatch}>
          <OperationalSectionHeader eyebrow="Nueva vigilancia" title="Contexto a seguir" />
          <div className="mt-5 grid grid-cols-3 rounded-[10px] bg-[#0F2A33] p-1">
            <TypeButton active={type === "technology"} icon={FlaskConical} label="Tecnología" onClick={() => setType("technology")} />
            <TypeButton active={type === "company"} icon={Building2} label="Empresa" onClick={() => setType("company")} />
            <TypeButton active={type === "competitor"} icon={Factory} label="Competidor" onClick={() => setType("competitor")} />
          </div>
          <Input className="mt-4" value={query} onChange={event => setQuery(event.target.value)} maxLength={160} placeholder={type === "technology" ? "Ej: agentes de IA empresariales" : type === "company" ? "Ej: SQM" : "Ej: competidor o actor a seguir"} aria-label="Consulta a vigilar" />

          <div className="mt-6">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Dónde buscar</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <ScopeButton active={scope === "chile"} icon={MapPin} label="Chile" detail="INAPI + señales locales" onClick={() => setScope("chile")} />
              <ScopeButton active={scope === "global"} icon={Globe2} label="Global" detail="Ciencia + patentes + contexto" onClick={() => setScope("global")} />
              <ScopeButton active={scope === "both"} icon={Globe2} label="Ambos" detail="Chile y frontera global" onClick={() => setScope("both")} />
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-muted-foreground">VIDENTIA amplía automáticamente equivalencias controladas como IA / AI, inteligencia artificial / artificial intelligence y términos empresariales ES/EN. La primera ejecución establece una línea base.</p>
          {error ? <div role="alert" className="mt-4 rounded-[10px] bg-[#3A2525] p-4 text-sm text-[#E8AAA3]">{error}</div> : null}
          {taskError ? <div role="alert" className="mt-4 rounded-[10px] bg-[#3A2525] p-4 text-sm text-[#E8AAA3]">{taskError}</div> : null}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {taskHref ? (
              <Button asChild type="button" variant="outline"><Link href={taskHref}><CheckCircle2 className="h-4 w-4" />Abrir tarea</Link></Button>
            ) : (
              <Button type="button" variant="outline" disabled={query.trim().length < 2 || taskSaving} onClick={() => void createTask()}>
                {taskSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}{taskSaving ? "Creando tarea" : "Crear tarea"}
              </Button>
            )}
            <Button type="submit" disabled={query.trim().length < 2 || saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{saving ? "Guardando" : "Crear vigilancia"}</Button>
          </div>
          <p className="mt-3 text-right text-[11px] leading-5 text-muted-foreground">Crear tarea y crear vigilancia son decisiones independientes. Ninguna se ejecuta automáticamente.</p>
        </form>
      </OperationalPanel>
    </section>
  </OperationalPage>
}

function TypeButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof FlaskConical; label: string; onClick: () => void }) {
  return <Button type="button" size="sm" variant={active ? "secondary" : "ghost"} className="min-w-0 px-2" onClick={onClick}><Icon className="h-4 w-4" /><span className="truncate">{label}</span></Button>
}

function ScopeButton({ active, icon: Icon, label, detail, onClick }: { active: boolean; icon: typeof Globe2; label: string; detail: string; onClick: () => void }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`rounded-[10px] border px-4 py-3 text-left transition ${active ? "border-[#96B5A6]/55 bg-[#173B37]" : "border-border bg-card/20 hover:border-[#96B5A6]/25"}`}>
    <span className="flex items-center gap-2 text-sm font-medium text-white"><Icon className="h-4 w-4 text-[#96B5A6]" />{label}</span>
    <span className="mt-1 block text-xs leading-5 text-muted-foreground">{detail}</span>
  </button>
}

function watchTypeLabel(type: WatchType) {
  if (type === "technology") return "Tecnología"
  if (type === "company") return "Empresa"
  return "Competidor"
}

function actionSourceId(type: WatchType, query: string) {
  const normalized = query
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return limitText(`strategic-watch:${type}:${normalized || "contexto"}`, 240)
}

function limitText(value: string, max: number) {
  return value.length <= max ? value : value.slice(0, max).trimEnd()
}
