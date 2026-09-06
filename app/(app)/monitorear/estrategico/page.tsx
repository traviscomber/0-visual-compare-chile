"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { Activity, BellRing, Building2, Check, ChevronDown, ExternalLink, Factory, FlaskConical, History, Loader2, Pause, Play, Plus, RefreshCw, Trash2 } from "lucide-react"
import { OperationalMetric, OperationalMetricRail, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type WatchType = "technology" | "company" | "competitor"
type Watch = {
  id: string
  watch_type: WatchType
  query: string
  is_active: boolean
  last_checked_at: string | null
  last_reviewed_at: string | null
  created_at: string
}
type Signal = {
  id: string
  watch_id: string
  watch_query: string
  watch_type: WatchType
  source_key: string
  event_type: "patent" | "trademark" | "publication" | "news"
  title: string
  summary: string | null
  source_url: string | null
  occurred_at: string | null
  relevance: "alta" | "media" | "baja"
  first_seen_at: string
  last_seen_at: string
  is_new: boolean
}
type Summary = {
  new_count: number
  high_new_count: number
  total_history: number
  patent_new_count: number
  trademark_new_count: number
  publication_new_count: number
  news_new_count: number
}
type StrategicChange = {
  id: string
  title: string
  materiality: "alta" | "media" | "baja"
  observed_fact: string
  why_it_matters: string
  confidence: number
}
type WeeklyContext = {
  generated_at: string
  window_start: string
  window_end: string
  change_detection: {
    events_7d: number
    strategic_changes_7d: number
  }
  strategic_changes: StrategicChange[]
}

const EMPTY_SUMMARY: Summary = {
  new_count: 0,
  high_new_count: 0,
  total_history: 0,
  patent_new_count: 0,
  trademark_new_count: 0,
  publication_new_count: 0,
  news_new_count: 0,
}

export default function StrategicMonitoringPage() {
  const [watches, setWatches] = useState<Watch[]>([])
  const [signals, setSignals] = useState<Signal[]>([])
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY)
  const [weeklyContext, setWeeklyContext] = useState<WeeklyContext | null>(null)
  const [type, setType] = useState<WatchType>("technology")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const active = useMemo(() => watches.filter(item => item.is_active), [watches])
  const visibleSignals = useMemo(() => {
    const base = showHistory ? signals : signals.filter(item => item.is_new)
    return [...base].sort((a, b) => relevanceRank(b.relevance) - relevanceRank(a.relevance) || Date.parse(b.first_seen_at) - Date.parse(a.first_seen_at))
  }, [showHistory, signals])
  const strategicChanges = weeklyContext?.change_detection.strategic_changes_7d ?? 0

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [watchResponse, signalResponse] = await Promise.all([
        fetch("/api/intelligence/strategic-watchlist", { cache: "no-store" }),
        fetch("/api/intelligence/strategic-watch-signals", { cache: "no-store" }),
      ])
      const watchPayload = await watchResponse.json().catch(() => ({}))
      const signalPayload = await signalResponse.json().catch(() => ({}))
      if (!watchResponse.ok) throw new Error(watchPayload.error || "No pudimos cargar tus seguimientos.")
      if (!signalResponse.ok) throw new Error(signalPayload.error || "No pudimos revisar las fuentes.")
      setWatches(Array.isArray(watchPayload.watches) ? watchPayload.watches : [])
      setSignals(Array.isArray(signalPayload.signals) ? signalPayload.signals : [])
      setSummary(signalPayload.summary ?? EMPTY_SUMMARY)
      setWeeklyContext(signalPayload.context ?? null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos cargar la vigilancia estratégica.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function createWatch(event: FormEvent) {
    event.preventDefault()
    if (query.trim().length < 2 || saving) return
    setSaving(true)
    setError(null)
    try {
      const response = await fetch("/api/intelligence/strategic-watchlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, query: query.trim() }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos crear el seguimiento.")
      setQuery("")
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos crear el seguimiento.")
    } finally {
      setSaving(false)
    }
  }

  async function markReviewed() {
    if (!summary.new_count || reviewing) return
    setReviewing(true)
    setError(null)
    try {
      const response = await fetch("/api/intelligence/strategic-watch-signals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
      if (!response.ok) throw new Error("No pudimos guardar la revisión.")
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar la revisión.")
    } finally {
      setReviewing(false)
    }
  }

  async function toggle(watch: Watch) {
    const response = await fetch("/api/intelligence/strategic-watchlist", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: watch.id, active: !watch.is_active }),
    })
    if (!response.ok) return setError("No pudimos actualizar el seguimiento.")
    await load()
  }

  async function remove(id: string) {
    const response = await fetch(`/api/intelligence/strategic-watchlist?id=${encodeURIComponent(id)}`, { method: "DELETE" })
    if (!response.ok) return setError("No pudimos eliminar el seguimiento.")
    await load()
  }

  return <OperationalPage>
    <section className="border-b border-border/80 py-7">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">VIDENTIA / Seguimiento estratégico</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-medium tracking-[-0.04em] text-white sm:text-4xl">Qué cambió y qué merece atención.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Sigue tecnologías, empresas y competidores. VIDENTIA reúne las señales nuevas y deja el detalle técnico fuera de la lectura principal.</p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Actualizar</Button>
      </div>
    </section>

    <OperationalMetricRail>
      <OperationalMetric value={summary.new_count} label="Cambios nuevos" detail={summary.new_count ? "Pendientes de revisión" : "Nada pendiente"} tone={summary.new_count ? "warning" : "success"} />
      <OperationalMetric value={summary.high_new_count} label="Prioridad alta" detail="Señales que conviene mirar primero" tone={summary.high_new_count ? "warning" : "neutral"} />
      <OperationalMetric value={active.length} label="Seguimientos activos" detail="Tecnologías, empresas y competidores" tone={active.length ? "success" : "neutral"} />
      <OperationalMetric value={strategicChanges} label="Patrones esta semana" detail="Cambios con evidencia convergente" tone={strategicChanges ? "success" : "neutral"} />
    </OperationalMetricRail>

    {summary.new_count > 0 ? <OperationalPanel className="my-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <BellRing className="mt-0.5 h-5 w-5 text-[#96B5A6]" />
        <div>
          <p className="font-medium text-white">{summary.new_count} cambio{summary.new_count === 1 ? "" : "s"} nuevo{summary.new_count === 1 ? "" : "s"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{summary.patent_new_count} patentes · {summary.trademark_new_count} marcas · {summary.publication_new_count} publicaciones · {summary.news_new_count} noticias</p>
        </div>
      </div>
      <Button onClick={() => void markReviewed()} disabled={reviewing}>{reviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Marcar como revisado</Button>
    </OperationalPanel> : null}

    {error ? <div role="alert" className="mt-6 rounded-[10px] bg-[#3A2525] p-4 text-sm text-[#E8AAA3]">{error}</div> : null}

    <section className="grid gap-8 py-9 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)] xl:gap-10">
      <div>
        <OperationalSectionHeader
          eyebrow="Cambios"
          title={showHistory ? "Historial de señales" : "Lo que requiere revisión"}
          action={<Button variant="ghost" size="sm" onClick={() => setShowHistory(value => !value)}>{showHistory ? <><BellRing className="h-4 w-4" />Sólo lo nuevo</> : <><History className="h-4 w-4" />Ver historial</>}</Button>}
        />
        <div className="mt-5">
          {loading ? <div className="flex items-center gap-2 border-y border-border/80 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Consultando fuentes…</div> : visibleSignals.length ? <div className="divide-y divide-border/80 border-y border-border/80">{visibleSignals.slice(0, showHistory ? 40 : 12).map(signal => <SignalRow key={signal.id} signal={signal} />)}</div> : <div className="border-y border-border/80 py-10"><Activity className="h-5 w-5 text-[#96B5A6]" /><p className="mt-3 font-medium text-white">{active.length ? "No hay cambios pendientes" : "Aún no sigues nada"}</p><p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">{active.length ? "VIDENTIA seguirá revisando tus fuentes y mostrará aquí sólo lo que cambie después de tu última revisión." : "Agrega una tecnología, empresa o competidor para comenzar."}</p></div>}
        </div>
      </div>

      <aside className="space-y-5">
        <OperationalPanel>
          <form onSubmit={createWatch}>
            <OperationalSectionHeader eyebrow="Nuevo seguimiento" title="¿Qué quieres seguir?" />
            <div className="mt-5 grid grid-cols-3 rounded-[10px] bg-[#0F2A33] p-1">
              <TypeButton active={type === "technology"} icon={FlaskConical} label="Tecnología" onClick={() => setType("technology")} />
              <TypeButton active={type === "company"} icon={Building2} label="Empresa" onClick={() => setType("company")} />
              <TypeButton active={type === "competitor"} icon={Factory} label="Competidor" onClick={() => setType("competitor")} />
            </div>
            <Input className="mt-3" value={query} onChange={event => setQuery(event.target.value)} maxLength={160} placeholder={type === "technology" ? "Ej: agentes de IA empresarial" : type === "company" ? "Ej: SQM" : "Ej: actor a seguir"} />
            <Button className="mt-3 w-full" disabled={query.trim().length < 2 || saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Agregar seguimiento</Button>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">La primera revisión crea una línea base. Después sólo verás cambios nuevos.</p>
          </form>
        </OperationalPanel>

        <OperationalPanel>
          <OperationalSectionHeader eyebrow="En seguimiento" title={`${active.length} activo${active.length === 1 ? "" : "s"}`} />
          {watches.length ? <div className="mt-4 divide-y divide-border/80 border-t border-border/80">{watches.map(watch => <WatchRow key={watch.id} watch={watch} newCount={signals.filter(signal => signal.watch_id === watch.id && signal.is_new).length} onToggle={() => void toggle(watch)} onRemove={() => void remove(watch.id)} />)}</div> : <p className="mt-4 text-sm leading-6 text-muted-foreground">Aún no hay seguimientos configurados.</p>}
        </OperationalPanel>
      </aside>
    </section>

    <details className="group border-t border-border/80 py-8">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-white">
        <span>Ver contexto semanal y metodología</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <OperationalPanel>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Esta semana</p>
          <p className="mt-3 text-2xl font-medium text-white">{weeklyContext ? `${formatDate(weeklyContext.window_start)} — ${formatDate(weeklyContext.window_end)}` : "Sin ventana disponible"}</p>
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border/80 pt-5">
            <div><p className="text-2xl font-medium text-white">{weeklyContext?.change_detection.events_7d ?? 0}</p><p className="mt-1 text-xs text-muted-foreground">evidencias observadas</p></div>
            <div><p className="text-2xl font-medium text-white">{strategicChanges}</p><p className="mt-1 text-xs text-muted-foreground">patrones estratégicos</p></div>
          </div>
        </OperationalPanel>
        <OperationalPanel>
          <p className="text-sm font-medium text-white">Cómo leer esta pantalla</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Una señal es evidencia observada. Un patrón estratégico sólo aparece cuando varias evidencias convergen bajo reglas explícitas. VIDENTIA no convierte una noticia aislada en una conclusión.</p>
          {(weeklyContext?.strategic_changes ?? []).length ? <div className="mt-5 divide-y divide-border/80 border-t border-border/80">{weeklyContext!.strategic_changes.slice(0, 4).map(change => <div key={change.id} className="py-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-white">{change.title}</p><Badge variant="outline">{relevanceLabel(change.materiality)}</Badge></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{change.observed_fact}</p><p className="mt-2 text-xs leading-5 text-[#BFD0CC]">{change.why_it_matters}</p></div>)}</div> : null}
        </OperationalPanel>
      </div>
    </details>
  </OperationalPage>
}

function SignalRow({ signal }: { signal: Signal }) {
  return <article className="grid gap-3 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={signal.relevance === "alta" ? "border-[#8D7042]/70 bg-[#2C291F]/40 text-[#D8C49C]" : signal.relevance === "media" ? "bg-[#13272D] text-[#BFD0CC]" : "text-muted-foreground"}>{relevanceLabel(signal.relevance)}</Badge>
        <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{kindLabel(signal.event_type)}</span>
        {signal.is_new ? <span className="text-[10px] uppercase tracking-[0.12em] text-[#96B5A6]">Nuevo</span> : null}
      </div>
      <h3 className="mt-3 text-base font-medium leading-6 text-white">{signal.title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{signal.watch_query} · {sourceLabel(signal.source_key)} · {formatDate(signal.occurred_at ?? signal.first_seen_at)}</p>
      {signal.summary ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{signal.summary}</p> : null}
    </div>
    {signal.source_url ? <a href={signal.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#96B5A6] hover:text-white">Ver evidencia<ExternalLink className="h-3.5 w-3.5" /></a> : null}
  </article>
}

function WatchRow({ watch, newCount, onToggle, onRemove }: { watch: Watch; newCount: number; onToggle: () => void; onRemove: () => void }) {
  return <div className="py-4">
    <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-medium text-white">{watch.query}</p>{newCount ? <Badge className="bg-[#173B37] text-[#96B5A6] hover:bg-[#173B37]">{newCount} nuevo{newCount === 1 ? "" : "s"}</Badge> : null}</div>
        <p className="mt-1 text-xs text-muted-foreground">{watchTypeLabel(watch.watch_type)} · {watch.is_active ? "Activo" : "Pausado"}{watch.last_checked_at ? ` · revisado ${formatDate(watch.last_checked_at)}` : ""}</p>
      </div>
      <div className="flex gap-1">
        <button type="button" onClick={onToggle} aria-label={watch.is_active ? "Pausar seguimiento" : "Reactivar seguimiento"} className="grid h-8 w-8 place-items-center rounded-[8px] text-muted-foreground transition-colors hover:bg-secondary hover:text-white">{watch.is_active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}</button>
        <button type="button" onClick={onRemove} aria-label="Eliminar seguimiento" className="grid h-8 w-8 place-items-center rounded-[8px] text-muted-foreground transition-colors hover:bg-[#3A2525] hover:text-[#E8AAA3]"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  </div>
}

function TypeButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof FlaskConical; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`flex min-h-10 items-center justify-center gap-2 rounded-[8px] px-2 text-xs font-medium transition-colors ${active ? "bg-[#173B37] text-[#DDE7E4]" : "text-muted-foreground hover:text-white"}`}><Icon className="h-3.5 w-3.5" />{label}</button>
}

function relevanceRank(value: Signal["relevance"]) {
  return value === "alta" ? 3 : value === "media" ? 2 : 1
}

function relevanceLabel(value: "alta" | "media" | "baja") {
  return value === "alta" ? "Prioridad alta" : value === "media" ? "Prioridad media" : "Informativa"
}

function kindLabel(value: Signal["event_type"]) {
  return value === "patent" ? "Patente" : value === "trademark" ? "Marca" : value === "publication" ? "Publicación" : "Noticia"
}

function watchTypeLabel(value: WatchType) {
  return value === "technology" ? "Tecnología" : value === "company" ? "Empresa" : "Competidor"
}

function sourceLabel(value: string) {
  const labels: Record<string, string> = {
    inapi_open_data: "INAPI",
    google_news_rss: "Google News",
    openalex: "OpenAlex",
    crossref: "Crossref",
    sea_seia: "SEA / SEIA",
    snifa_sma: "SMA / SNIFA",
    fne_competencia: "FNE",
    tdlc_jurisprudencia: "TDLC",
  }
  return labels[value] ?? value.replaceAll("_", " ")
}

function formatDate(value: string | null) {
  if (!value) return "Sin fecha"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date)
}
