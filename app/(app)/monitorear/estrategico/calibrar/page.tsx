"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Activity, Check, ExternalLink, FlaskConical, Loader2, Newspaper, RefreshCw, Search, ShieldCheck } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type FeedbackType = "relevant" | "irrelevant" | "false_match" | "identity_incorrect"
type Signal = {
  id: string
  watch_id: string
  watch_query: string
  watch_type: "technology" | "company" | "competitor"
  source_key: string
  event_type: "patent" | "trademark" | "publication" | "news"
  title: string
  summary: string | null
  source_url: string | null
  occurred_at: string | null
  relevance: "alta" | "media" | "baja"
  first_seen_at: string
  is_new: boolean
}
type FeedbackRow = {
  id: string
  target_key: string
  feedback_type: FeedbackType
  note: string | null
  updated_at: string
}

const FEEDBACK_OPTIONS: Array<{ value: FeedbackType; label: string }> = [
  { value: "relevant", label: "Relevante" },
  { value: "irrelevant", label: "Irrelevante" },
  { value: "false_match", label: "Falso match" },
  { value: "identity_incorrect", label: "Identidad incorrecta" },
]

export default function StrategicCalibrationPage() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [feedback, setFeedback] = useState<FeedbackRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [signalResponse, feedbackResponse] = await Promise.all([
        fetch("/api/intelligence/strategic-watch-signals", { cache: "no-store" }),
        fetch("/api/intelligence/feedback?targetType=strategic_watch_event", { cache: "no-store" }),
      ])
      const signalPayload = await signalResponse.json().catch(() => ({}))
      const feedbackPayload = await feedbackResponse.json().catch(() => ({}))
      if (!signalResponse.ok) throw new Error(signalPayload.error || "No pudimos cargar las señales estratégicas.")
      if (!feedbackResponse.ok) throw new Error(feedbackPayload.error || "No pudimos cargar la calibración.")
      setSignals(Array.isArray(signalPayload.signals) ? signalPayload.signals : [])
      setFeedback(Array.isArray(feedbackPayload.feedback) ? feedbackPayload.feedback : [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos cargar la calibración.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const feedbackBySignal = useMemo(() => new Map(feedback.map(item => [item.target_key, item])), [feedback])
  const classified = feedback.length
  const falseMatches = feedback.filter(item => item.feedback_type === "false_match").length
  const identityErrors = feedback.filter(item => item.feedback_type === "identity_incorrect").length

  async function classify(signal: Signal, feedbackType: FeedbackType) {
    if (busyId) return
    setBusyId(signal.id)
    setError(null)
    try {
      const response = await fetch("/api/intelligence/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          targetType: "strategic_watch_event",
          targetKey: signal.id,
          feedbackType,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos guardar el feedback.")
      setFeedback(current => {
        const previous = current.find(item => item.target_key === signal.id)
        const next: FeedbackRow = {
          id: String(payload.id ?? previous?.id ?? signal.id),
          target_key: signal.id,
          feedback_type: feedbackType,
          note: previous?.note ?? null,
          updated_at: new Date().toISOString(),
        }
        return [next, ...current.filter(item => item.target_key !== signal.id)]
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar el feedback.")
    } finally {
      setBusyId(null)
    }
  }

  return <OperationalPage>
    <OperationalHeader
      eyebrow="VIDENTIA / Calibración"
      title="Calibra la inteligencia sin alterar los hechos fuente."
      description={<>Clasifica señales estratégicas como relevantes, irrelevantes, falsos matches o identidades incorrectas. Cada cambio queda auditado y sirve como referencia para medir precisión futura.</>}
      meta={<><span>Feedback humano</span><span>Audit trail</span><span>Evidencia intacta</span><span>Sin fuzzy auto-link</span></>}
      actions={<Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin motion-reduce:animate-none" : ""}`} />Actualizar</Button>}
    />

    <OperationalMetricRail>
      <OperationalMetric value={signals.length} label="Señales disponibles" detail="Historial de vigilancias estratégicas" />
      <OperationalMetric value={classified} label="Clasificadas" detail="Con feedback humano persistido" tone={classified ? "success" : "neutral"} />
      <OperationalMetric value={falseMatches} label="Falsos matches" detail="Casos para revisar reglas de matching" tone={falseMatches ? "warning" : "neutral"} />
      <OperationalMetric value={identityErrors} label="Identidades incorrectas" detail="Casos para entity resolution" tone={identityErrors ? "warning" : "neutral"} />
    </OperationalMetricRail>

    {error ? <div role="alert" className="mt-6 rounded-[10px] bg-[#3A2525] p-4 text-sm text-[#E8AAA3]">{error}</div> : null}

    <section className="py-9">
      <OperationalSectionHeader eyebrow="Señales" title="Clasificación para control de calidad" meta={`${classified}/${signals.length} revisadas`} />
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">El feedback no elimina la evidencia ni cambia su fuente. Sólo añade una evaluación del usuario que queda asociada a la señal y registrada en auditoría.</p>
      {loading ? <div className="mt-6 flex items-center gap-2 border-y border-border/80 py-12 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Cargando señales y feedback…</div> : signals.length ? <div className="mt-6 divide-y divide-border/80 border-y border-border/80">{signals.map(signal => {
        const current = feedbackBySignal.get(signal.id)?.feedback_type ?? null
        const Icon = signal.event_type === "patent" ? FlaskConical : signal.event_type === "trademark" ? Search : signal.event_type === "publication" ? Activity : Newspaper
        return <article key={signal.id} className="grid gap-4 py-6 xl:grid-cols-[40px_minmax(0,1fr)_minmax(340px,auto)] xl:items-start">
          <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#173B37] text-[#96B5A6]"><Icon className="h-4 w-4" /></span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="bg-[#13272D]">{eventLabel(signal.event_type)}</Badge><span className="text-[10px] uppercase tracking-[0.13em] text-muted-foreground">{sourceLabel(signal.source_key)}</span>{current ? <Badge className="bg-[#173B37] text-[#B7D3D1] hover:bg-[#173B37]">{feedbackLabel(current)}</Badge> : null}</div>
            <h3 className="mt-2 font-medium leading-6 text-white">{signal.title}</h3>
            {signal.summary ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{signal.summary}</p> : null}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"><span>{watchLabel(signal.watch_type)} · {signal.watch_query}</span>{signal.occurred_at ? <span>{formatDate(signal.occurred_at)}</span> : null}{signal.source_url ? <a className="inline-flex items-center gap-1 text-[#96B5A6] hover:underline" href={signal.source_url} target="_blank" rel="noreferrer">Fuente <ExternalLink className="h-3 w-3" /></a> : null}</div>
          </div>
          <div className="flex flex-wrap gap-2 xl:justify-end">{FEEDBACK_OPTIONS.map(option => <Button key={option.value} type="button" variant={current === option.value ? "secondary" : "outline"} size="sm" disabled={busyId === signal.id} onClick={() => void classify(signal, option.value)} className={current === option.value ? "border-[#4A7F74] bg-[#173B37] text-[#B7D3D1]" : undefined}>{busyId === signal.id && current !== option.value ? null : current === option.value ? <Check className="h-3.5 w-3.5" /> : null}{option.label}</Button>)}</div>
        </article>
      })}</div> : <div className="mt-6 border-y border-border/80 py-12"><ShieldCheck className="h-5 w-5 text-[#96B5A6]" /><p className="mt-3 font-medium text-white">Aún no hay señales para calibrar.</p><p className="mt-1 text-sm text-muted-foreground">Crea vigilancias estratégicas y deja que VIDENTIA establezca su línea base antes de evaluar resultados.</p></div>}
    </section>
  </OperationalPage>
}

function feedbackLabel(value: FeedbackType) {
  return FEEDBACK_OPTIONS.find(item => item.value === value)?.label ?? value
}
function watchLabel(type: Signal["watch_type"]) { return type === "technology" ? "Tecnología" : type === "company" ? "Empresa" : "Competidor" }
function eventLabel(type: Signal["event_type"]) { return type === "patent" ? "Patente" : type === "trademark" ? "Marca" : type === "publication" ? "Publicación" : "Noticia" }
function sourceLabel(key: string) { return key === "inapi_open_data" ? "INAPI" : key === "openalex" ? "OpenAlex" : key === "crossref" ? "Crossref" : key === "gdelt" ? "GDELT" : key }
function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeZone: "America/Santiago" }).format(date)
}
