"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { Activity, AlertTriangle, BellRing, Building2, Check, ExternalLink, Factory, FlaskConical, History, Loader2, Newspaper, Pause, Play, Plus, RefreshCw, Search, Trash2 } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
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
type CoverageSlice = {
  latest_filing_date: string | null
  last_synced_at: string | null
  filing_lag_days: number | null
  sync_age_days: number | null
  synchronized_recently: boolean
  records_in_latest_30d: number
}
type RecentActivity = {
  id: string
  kind: "patent" | "trademark"
  title: string
  actor: string | null
  filing_date: string
  source_url: string | null
}
type ObservedChange = {
  id: string
  kind: "patent" | "trademark"
  change_type: string
  title: string
  summary: string | null
  source_url: string | null
  source_date: string | null
  observed_at: string
  materiality: "alta" | "media" | "baja"
  changed_fields: string[]
}
type ChangeDetection = {
  ready: boolean
  baselines_ready: number
  baselines_expected: number
  states_total: number
  events_7d: number
  last_observed_at: string | null
}
type WeeklyContext = {
  generated_at: string
  window_start: string
  window_end: string
  coverage: {
    patents: CoverageSlice
    trademarks: CoverageSlice
  }
  change_detection: ChangeDetection
  observed_changes: ObservedChange[]
  recent_activity: RecentActivity[]
}

const EMPTY_SUMMARY: Summary = { new_count: 0, high_new_count: 0, total_history: 0, patent_new_count: 0, trademark_new_count: 0, publication_new_count: 0, news_new_count: 0 }

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
  const visibleSignals = useMemo(() => showHistory ? signals : signals.filter(item => item.is_new), [showHistory, signals])
  const weeklySignals = useMemo(() => signals
    .filter(item => item.is_new && isWithinWeeklyWindow(item.first_seen_at, weeklyContext?.window_start))
    .sort((a, b) => {
      const relevance = relevanceRank(b.relevance) - relevanceRank(a.relevance)
      if (relevance) return relevance
      return new Date(b.first_seen_at).getTime() - new Date(a.first_seen_at).getTime()
    }), [signals, weeklyContext?.window_start])
  const externalWeeklySignals = useMemo(() => weeklySignals.filter(item => item.source_key !== "inapi_open_data"), [weeklySignals])
  const observedHigh = useMemo(() => (weeklyContext?.observed_changes ?? []).filter(item => item.materiality === "alta").length, [weeklyContext?.observed_changes])
  const headlineWeeklyChanges = (weeklyContext?.change_detection.events_7d ?? 0) + externalWeeklySignals.length
  const headlineHigh = observedHigh + externalWeeklySignals.filter(item => item.relevance === "alta").length

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
      if (!watchResponse.ok) throw new Error(watchPayload.error || "No pudimos cargar las vigilancias estratégicas.")
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
      if (!response.ok) throw new Error(payload.error || "No pudimos crear la vigilancia.")
      setQuery("")
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos crear la vigilancia.")
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
    if (!response.ok) return setError("No pudimos actualizar la vigilancia.")
    await load()
  }

  async function remove(id: string) {
    const response = await fetch(`/api/intelligence/strategic-watchlist?id=${encodeURIComponent(id)}`, { method: "DELETE" })
    if (!response.ok) return setError("No pudimos eliminar la vigilancia.")
    await load()
  }

  return <OperationalPage>
    <OperationalHeader
      eyebrow="VIDENTIA / Vigilancia estratégica"
      title="Detecta cambios antes de que se vuelvan evidentes."
      description={<>Sigue tecnologías, empresas y competidores. VIDENTIA cruza patentes y marcas INAPI con publicaciones científicas y señales públicas recientes, conserva la fuente y separa hechos observados de interpretación.</>}
      meta={<><span>INAPI</span><span>OpenAlex + Crossref</span><span>GDELT</span><span>Evidencia trazable</span></>}
      actions={<Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin motion-reduce:animate-none" : ""}`} />Actualizar fuentes</Button>}
    />

    <OperationalMetricRail>
      <OperationalMetric value={headlineWeeklyChanges} label="Cambios observados" detail="INAPI + señales externas / 7 días" tone={headlineWeeklyChanges ? "success" : "neutral"} />
      <OperationalMetric value={headlineHigh} label="Alta relevancia" detail="Cambios que requieren revisión" tone={headlineHigh ? "warning" : "neutral"} />
      <OperationalMetric value={active.length} label="Vigilancias activas" detail="Tecnologías y empresas" tone={active.length ? "success" : "neutral"} />
      <OperationalMetric value={summary.total_history} label="Evidencias" detail="Historial personalizado" />
    </OperationalMetricRail>

    <WeeklyBriefSection loading={loading} signals={weeklySignals} context={weeklyContext} />

    <section className="border-b border-border/80 py-8">
      <OperationalPanel>
        <form onSubmit={createWatch}>
          <OperationalSectionHeader eyebrow="Nueva vigilancia" title="¿Qué quieres seguir?" />
          <div className="mt-5 grid gap-3 xl:grid-cols-[360px_1fr_auto]">
            <div className="grid grid-cols-3 rounded-[10px] bg-[#0F2A33] p-1">
              <TypeButton active={type === "technology"} icon={FlaskConical} label="Tecnología" onClick={() => setType("technology")} />
              <TypeButton active={type === "company"} icon={Building2} label="Empresa" onClick={() => setType("company")} />
              <TypeButton active={type === "competitor"} icon={Factory} label="Competidor" onClick={() => setType("competitor")} />
            </div>
            <Input value={query} onChange={event => setQuery(event.target.value)} maxLength={160} placeholder={type === "technology" ? "Ej: almacenamiento de energía con sodio" : type === "company" ? "Ej: SQM" : "Ej: competidor o actor a seguir"} />
            <Button disabled={query.trim().length < 2 || saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Empezar a vigilar</Button>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">La primera ejecución crea una línea base. Sólo evidencia observada después de esa línea base se presenta como cambio nuevo.</p>
        </form>
      </OperationalPanel>
    </section>

    {summary.new_count > 0 ? <OperationalPanel className="my-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3"><BellRing className="mt-0.5 h-5 w-5 text-[#96B5A6]" /><div><p className="font-medium text-white">{summary.new_count} cambio{summary.new_count === 1 ? "" : "s"} pendiente{summary.new_count === 1 ? "" : "s"} de revisión</p><p className="mt-1 text-sm text-muted-foreground">{summary.patent_new_count} patentes · {summary.trademark_new_count} marcas · {summary.publication_new_count} publicaciones · {summary.news_new_count} noticias</p></div></div>
      <Button onClick={() => void markReviewed()} disabled={reviewing}>{reviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Marcar revisado</Button>
    </OperationalPanel> : null}

    {error ? <div role="alert" className="mt-6 rounded-[10px] bg-[#3A2525] p-4 text-sm text-[#E8AAA3]">{error}</div> : null}

    <section className="grid gap-8 py-9 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)] xl:gap-10">
      <div>
        <OperationalSectionHeader eyebrow="Seguimiento continuo" title={showHistory ? "Historial de señales" : "Señales desde tu última revisión"} action={<Button variant="ghost" size="sm" onClick={() => setShowHistory(value => !value)}>{showHistory ? <><BellRing className="h-4 w-4" />Sólo lo nuevo</> : <><History className="h-4 w-4" />Ver historial</>}</Button>} />
        <div className="mt-5">
          {loading ? <div className="flex items-center gap-2 border-y border-border/80 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Consultando fuentes…</div> : visibleSignals.length ? <div className="divide-y divide-border/80 border-y border-border/80">{visibleSignals.map(signal => <SignalRow key={signal.id} signal={signal} />)}</div> : <div className="border-y border-border/80 py-10"><Activity className="h-5 w-5 text-[#96B5A6]" /><p className="mt-3 font-medium text-white">{active.length ? "No hay señales pendientes por revisar" : "Aún no hay vigilancias estratégicas"}</p><p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">{active.length ? "Puedes revisar el historial o actualizar las fuentes. La línea base evita convertir antecedentes antiguos en alertas." : "Crea una vigilancia de tecnología, empresa o competidor para construir la primera línea base."}</p></div>}
        </div>
      </div>

      <aside>
        <OperationalPanel>
          <OperationalSectionHeader eyebrow="En seguimiento" title="Vigilancias estratégicas" />
          {watches.length ? <div className="mt-5 divide-y divide-border/80 border-t border-border/80">{watches.map(watch => {
            const newCount = signals.filter(signal => signal.watch_id === watch.id && signal.is_new).length
            return <div key={watch.id} className="py-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="bg-[#0F2A33]">{watchLabel(watch.watch_type)}</Badge>{!watch.is_active ? <Badge variant="secondary">Pausada</Badge> : null}{newCount ? <Badge className="bg-[#173B37] text-[#96B5A6] hover:bg-[#173B37]">{newCount} nuevo{newCount === 1 ? "" : "s"}</Badge> : null}</div><p className="mt-3 font-medium text-white">{watch.query}</p><p className="mt-1 text-xs text-muted-foreground">{watch.last_checked_at ? `Última consulta ${formatDate(watch.last_checked_at)}` : "Preparando línea base"}</p></div><div className="flex gap-1"><Button size="icon-sm" variant="ghost" onClick={() => void toggle(watch)} aria-label={watch.is_active ? "Pausar vigilancia" : "Activar vigilancia"}>{watch.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button><Button size="icon-sm" variant="ghost" onClick={() => void remove(watch.id)} aria-label="Eliminar vigilancia"><Trash2 className="h-4 w-4" /></Button></div></div></div>
          })}</div> : <p className="mt-5 text-sm leading-6 text-muted-foreground">Todavía no hay tecnologías, empresas o competidores en seguimiento.</p>}
        </OperationalPanel>
      </aside>
    </section>
  </OperationalPage>
}

function WeeklyBriefSection({ loading, signals, context }: { loading: boolean; signals: Signal[]; context: WeeklyContext | null }) {
  const externalSignals = signals.filter(signal => signal.source_key !== "inapi_open_data")
  const observedChanges = context?.observed_changes ?? []
  const hasChanges = observedChanges.length > 0 || externalSignals.length > 0

  return <section className="border-b border-border/80 py-9">
    <OperationalSectionHeader
      eyebrow="Brief semanal"
      title="Qué cambió esta semana"
      action={context ? <span className="text-xs text-muted-foreground">{formatDate(context.window_start)} — {formatDate(context.window_end)}</span> : undefined}
    />
    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Cambios observados por VIDENTIA en la fuente oficial y señales externas relevantes. La fecha del expediente se mantiene separada de la fecha en que el cambio fue detectado.</p>

    {loading ? <div className="mt-6 flex items-center gap-2 border-y border-border/80 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Construyendo el brief con la cobertura disponible…</div> : hasChanges ? <>
      {observedChanges.length ? <div className="mt-6"><p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Cambios observados en INAPI</p><div className="mt-3 divide-y divide-border/80 border-y border-border/80">{observedChanges.slice(0, 6).map(change => <ObservedChangeRow key={change.id} change={change} />)}</div></div> : null}
      {externalSignals.length ? <div className="mt-8"><p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Señales externas en tus vigilancias</p><div className="mt-3 divide-y divide-border/80 border-y border-border/80">{externalSignals.slice(0, 4).map(signal => <WeeklySignalRow key={signal.id} signal={signal} />)}</div></div> : null}
    </> : <WeeklyEmptyState context={context} />}

    {context ? <>
      <ChangeEngineStatus status={context.change_detection} />
      <CoverageRail context={context} />
      {context.recent_activity.length ? <div className="mt-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Referencia documental</p><h3 className="mt-1 text-base font-medium text-white">Expedientes con fecha de presentación más reciente</h3></div><p className="max-w-lg text-xs leading-5 text-muted-foreground">Sirve para entender la antigüedad documental del corpus. No equivale a la fecha en que INAPI o VIDENTIA actualizaron el expediente.</p></div>
        <div className="mt-4 divide-y divide-border/80 border-y border-border/80">{context.recent_activity.slice(0, 4).map(item => <RecentActivityRow key={item.id} item={item} />)}</div>
      </div> : null}
    </> : null}
  </section>
}

function ObservedChangeRow({ change }: { change: ObservedChange }) {
  const Icon = change.kind === "patent" ? FlaskConical : Search
  return <article className="grid gap-4 py-6 lg:grid-cols-[42px_minmax(0,1fr)_auto] lg:items-start">
    <span className="flex h-10 w-10 items-center justify-center rounded-[9px] bg-[#173B37] text-[#96B5A6]"><Icon className="h-4 w-4" /></span>
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="bg-[#13272D]">{change.kind === "patent" ? "Patente" : "Marca"}</Badge><span className="text-[10px] uppercase tracking-[0.13em] text-muted-foreground">{sourceChangeLabel(change.change_type)}</span><span className={`text-[10px] font-medium uppercase tracking-[0.13em] ${change.materiality === "alta" ? "text-[#D8C49C]" : "text-[#96B5A6]"}`}>Materialidad {change.materiality}</span></div>
      <h3 className="mt-2 text-base font-medium leading-6 text-white">{change.title}</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <BriefFact label="Hecho observado" text={change.summary || "VIDENTIA detectó una modificación en la fuente oficial de INAPI."} />
        <BriefFact label="Interpretación" text={interpretationForSourceChange(change)} />
        <BriefFact label="Por qué importa" text={whySourceChangeMatters(change)} />
      </div>
      <p className="mt-4 text-xs text-muted-foreground">INAPI · detectado por VIDENTIA {formatDate(change.observed_at)}{change.source_date ? ` · fecha del expediente ${formatDate(change.source_date)}` : ""}{change.changed_fields.length ? ` · campos: ${change.changed_fields.join(", ")}` : ""}</p>
    </div>
    {change.source_url ? <Button asChild variant="ghost" size="sm"><a href={change.source_url} target="_blank" rel="noreferrer">Evidencia <ExternalLink className="h-3.5 w-3.5" /></a></Button> : null}
  </article>
}

function WeeklySignalRow({ signal }: { signal: Signal }) {
  const Icon = signal.event_type === "patent" ? FlaskConical : signal.event_type === "trademark" ? Search : signal.event_type === "publication" ? Activity : Newspaper
  return <article className="grid gap-4 py-6 lg:grid-cols-[42px_minmax(0,1fr)_auto] lg:items-start">
    <span className="flex h-10 w-10 items-center justify-center rounded-[9px] bg-[#173B37] text-[#96B5A6]"><Icon className="h-4 w-4" /></span>
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="bg-[#13272D]">{eventLabel(signal.event_type)}</Badge><span className="text-[10px] uppercase tracking-[0.13em] text-muted-foreground">{watchLabel(signal.watch_type)} · {signal.watch_query}</span><span className="text-[10px] font-medium uppercase tracking-[0.13em] text-[#96B5A6]">Materialidad {signal.relevance}</span></div>
      <h3 className="mt-2 text-base font-medium leading-6 text-white">{signal.title}</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <BriefFact label="Hecho observado" text={signal.summary || `VIDENTIA registró una nueva evidencia de ${eventLabel(signal.event_type).toLowerCase()} vinculada a esta vigilancia.`} />
        <BriefFact label="Interpretación" text={interpretationForSignal(signal)} />
        <BriefFact label="Por qué importa" text={whyItMatters(signal)} />
      </div>
      <p className="mt-4 text-xs text-muted-foreground">{sourceLabel(signal.source_key)} · detectado {formatDate(signal.first_seen_at)}{signal.occurred_at ? ` · fecha fuente ${formatDate(signal.occurred_at)}` : ""}</p>
    </div>
    {signal.source_url ? <Button asChild variant="ghost" size="sm"><a href={signal.source_url} target="_blank" rel="noreferrer">Evidencia <ExternalLink className="h-3.5 w-3.5" /></a></Button> : null}
  </article>
}

function BriefFact({ label, text }: { label: string; text: string }) {
  return <div><p className="text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground">{label}</p><p className="mt-1 text-sm leading-6 text-[#D5E0E3]">{text}</p></div>
}

function WeeklyEmptyState({ context }: { context: WeeklyContext | null }) {
  const changeEngineReady = context?.change_detection.ready ?? false
  const staleSync = context ? !context.coverage.patents.synchronized_recently || !context.coverage.trademarks.synchronized_recently : false
  return <div className="mt-6 border-y border-border/80 py-9">
    <Activity className="h-5 w-5 text-[#96B5A6]" />
    <p className="mt-3 font-medium text-white">{changeEngineReady ? "No se detectaron cambios materiales en los últimos 7 días." : "El motor de cambios está construyendo su línea base."}</p>
    <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{changeEngineReady ? "VIDENTIA compara cada sincronización contra el estado observado anteriormente. La ausencia de cambios no se interpreta como ausencia de actividad fuera de las fuentes cubiertas." : "La primera sincronización memoriza el estado actual sin convertir antecedentes históricos en alertas. A partir de la siguiente pasada, VIDENTIA registra cada modificación observada."}</p>
    {staleSync ? <div className="mt-4 flex max-w-3xl gap-3 border-l-2 border-[#C9A56A] pl-4"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A56A]" /><p className="text-sm leading-6 text-[#D8C49C]">La última sincronización de una fuente supera dos días. El brief mantiene esa limitación visible para evitar conclusiones falsas.</p></div> : null}
  </div>
}

function ChangeEngineStatus({ status }: { status: ChangeDetection }) {
  return <div className={`mt-6 flex gap-3 border-l-2 pl-4 ${status.ready ? "border-[#96B5A6]" : "border-[#C9A56A]"}`}>
    {status.ready ? <Activity className="mt-0.5 h-4 w-4 shrink-0 text-[#96B5A6]" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A56A]" />}
    <div><p className="text-sm font-medium text-white">{status.ready ? "Motor de cambios activo" : "Inicializando motor de cambios"}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{status.baselines_ready}/{status.baselines_expected} fuentes con línea base · {formatNumber(status.states_total)} estados persistidos · {formatNumber(status.events_7d)} cambios observados en 7 días{status.last_observed_at ? ` · último ${formatDate(status.last_observed_at)}` : ""}</p></div>
  </div>
}

function CoverageRail({ context }: { context: WeeklyContext }) {
  return <div className="mt-6 grid border-y border-border/80 md:grid-cols-2 md:divide-x md:divide-border/80">
    <CoverageItem label="Patentes" data={context.coverage.patents} />
    <CoverageItem label="Marcas" data={context.coverage.trademarks} />
  </div>
}

function CoverageItem({ label, data }: { label: string; data: CoverageSlice }) {
  const syncLabel = data.sync_age_days === null ? "Sin sincronización" : data.sync_age_days === 0 ? "Sincronizado hoy" : `Sync hace ${data.sync_age_days} d`
  return <div className="py-4 md:px-5 first:md:pl-0 last:md:pr-0">
    <div className="flex items-center justify-between gap-4"><p className="text-sm font-medium text-white">{label}</p><span className={`text-[10px] font-medium uppercase tracking-[0.12em] ${data.synchronized_recently ? "text-[#96B5A6]" : "text-[#C9A56A]"}`}>{syncLabel}</span></div>
    <p className="mt-2 text-sm text-muted-foreground">Fecha de presentación más reciente <span className="text-[#D5E0E3]">{data.latest_filing_date ? formatDate(data.latest_filing_date) : "sin fecha disponible"}</span>{data.filing_lag_days !== null && data.filing_lag_days > 0 ? ` · ${data.filing_lag_days} d respecto de hoy` : ""}</p>
    <p className="mt-1 text-xs text-muted-foreground">{formatNumber(data.records_in_latest_30d)} expedientes en los 30 días documentales más recientes{data.last_synced_at ? ` · fuente sincronizada ${formatDate(data.last_synced_at)}` : ""}</p>
  </div>
}

function RecentActivityRow({ item }: { item: RecentActivity }) {
  const Icon = item.kind === "patent" ? FlaskConical : Search
  return <div className="grid gap-3 py-4 sm:grid-cols-[32px_minmax(0,1fr)_auto] sm:items-start">
    <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#13272D] text-[#96B5A6]"><Icon className="h-3.5 w-3.5" /></span>
    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{item.kind === "patent" ? "Patente" : "Marca"}</span><span className="text-[10px] text-muted-foreground">{formatDate(item.filing_date)}</span></div><p className="mt-1 truncate text-sm font-medium text-white" title={item.title}>{item.title}</p>{item.actor ? <p className="mt-1 truncate text-xs text-muted-foreground" title={item.actor}>{item.actor}</p> : null}</div>
    {item.source_url ? <Button asChild variant="ghost" size="sm"><a href={item.source_url} target="_blank" rel="noreferrer">Fuente <ExternalLink className="h-3.5 w-3.5" /></a></Button> : null}
  </div>
}

function TypeButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Search; label: string; onClick: () => void }) {
  return <Button type="button" size="sm" variant={active ? "secondary" : "ghost"} className="min-w-0 px-2" onClick={onClick}><Icon className="h-4 w-4" /><span className="truncate">{label}</span></Button>
}

function SignalRow({ signal }: { signal: Signal }) {
  const Icon = signal.event_type === "patent" ? FlaskConical : signal.event_type === "trademark" ? Search : signal.event_type === "publication" ? Activity : Newspaper
  return <article className="grid gap-4 px-2 py-5 sm:grid-cols-[40px_1fr_auto] sm:items-start">
    <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#173B37] text-[#96B5A6]"><Icon className="h-4 w-4" /></span>
    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="bg-[#13272D]">{eventLabel(signal.event_type)}</Badge><span className="text-[10px] uppercase tracking-[0.13em] text-muted-foreground">{sourceLabel(signal.source_key)}</span>{signal.is_new ? <span className="text-[10px] font-medium uppercase tracking-[0.13em] text-[#96B5A6]">Nuevo</span> : null}</div><h3 className="mt-2 font-medium leading-6 text-white">{signal.title}</h3>{signal.summary ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{signal.summary}</p> : null}<p className="mt-2 text-xs text-muted-foreground">{watchLabel(signal.watch_type)} · {signal.watch_query}{signal.occurred_at ? ` · ${formatDate(signal.occurred_at)}` : ""}</p></div>
    {signal.source_url ? <Button asChild variant="ghost" size="sm"><a href={signal.source_url} target="_blank" rel="noreferrer">Fuente <ExternalLink className="h-3.5 w-3.5" /></a></Button> : null}
  </article>
}

function interpretationForSourceChange(change: ObservedChange) {
  if (change.change_type === "new_record") return "Es un ingreso nuevo al corpus oficial observado por VIDENTIA. Por sí solo no demuestra un cambio estratégico; sirve como señal temprana para seguimiento."
  if (change.change_type === "status_changed") return "El expediente cambió de condición procesal o administrativa. El significado depende del estado anterior, el nuevo estado y el contexto del portafolio."
  if (change.change_type === "registration_added") return "El expediente incorporó un hito de registro o concesión que no estaba presente en la observación anterior."
  if (change.change_type === "applicant_changed") return "Cambió el actor asociado al expediente. Conviene distinguir entre corrección de datos, cesión, reorganización o cambio real de titularidad."
  if (change.change_type === "classification_changed") return "La fuente oficial modificó la clasificación asociada al expediente, lo que puede alterar su agrupación tecnológica o comercial."
  if (change.change_type === "title_changed") return "La fuente oficial modificó el título o denominación del expediente; la evidencia requiere comparación con la versión anterior."
  return "La fuente oficial modificó uno o más campos del expediente respecto de la observación anterior conservada por VIDENTIA."
}

function whySourceChangeMatters(change: ObservedChange) {
  if (change.materiality === "alta") return "Altera estado, registro/concesión o actor asociado; merece revisión prioritaria porque puede cambiar la lectura competitiva o jurídica del expediente."
  if (change.materiality === "media") return "Puede modificar el mapa de actividad, clasificación o nuevos actores y conviene incorporarlo al seguimiento antes de inferir una tendencia."
  return "Conserva trazabilidad de una modificación menor y permite reconstruir la evolución del expediente sin confundirla con un hecho estratégico confirmado."
}

function sourceChangeLabel(type: string) {
  if (type === "new_record") return "Nuevo expediente"
  if (type === "status_changed") return "Cambio de estado"
  if (type === "registration_added") return "Registro / concesión"
  if (type === "applicant_changed") return "Cambio de solicitante / titular"
  if (type === "classification_changed") return "Cambio de clasificación"
  if (type === "title_changed") return "Cambio de título"
  return "Expediente actualizado"
}

function interpretationForSignal(signal: Signal) {
  if (signal.event_type === "patent") return "Puede indicar nueva actividad de protección, expansión técnica o una prioridad tecnológica emergente dentro del ámbito vigilado."
  if (signal.event_type === "trademark") return "Puede indicar movimiento comercial, preparación de mercado o refuerzo de posicionamiento relacionado con esta vigilancia."
  if (signal.event_type === "publication") return "Puede señalar nueva actividad científica o una línea de investigación que conviene seguir antes de tratarla como tendencia consolidada."
  return "Es una señal pública reciente. Conviene contrastarla con patentes, publicaciones u otras fuentes antes de inferir un cambio estratégico."
}

function whyItMatters(signal: Signal) {
  if (signal.watch_type === "competitor") return "Puede anticipar un movimiento relevante de un competidor dentro del espacio que estás siguiendo."
  if (signal.watch_type === "company") return "Aporta evidencia reciente sobre la dirección pública, técnica o comercial de la empresa vigilada."
  return "Ayuda a identificar si la tecnología está ganando actividad, nuevos actores o señales de aplicación comercial."
}

function isWithinWeeklyWindow(value: string, windowStart?: string) {
  const seen = new Date(value)
  if (Number.isNaN(seen.getTime())) return false
  const start = windowStart ? new Date(`${windowStart}T00:00:00Z`) : new Date(Date.now() - 6 * 86_400_000)
  return seen.getTime() >= start.getTime()
}

function watchLabel(type: WatchType) { return type === "technology" ? "Tecnología" : type === "company" ? "Empresa" : "Competidor" }
function eventLabel(type: Signal["event_type"]) { return type === "patent" ? "Patente" : type === "trademark" ? "Marca" : type === "publication" ? "Publicación" : "Noticia" }
function sourceLabel(key: string) { return key === "inapi_open_data" ? "INAPI" : key === "openalex" ? "OpenAlex" : key === "crossref" ? "Crossref" : key === "gdelt" ? "GDELT" : key }
function relevanceRank(value: Signal["relevance"]) { return value === "alta" ? 3 : value === "media" ? 2 : 1 }
function formatNumber(value: number) { return new Intl.NumberFormat("es-CL").format(value) }
function formatDate(value: string) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  const date = new Date(dateOnly ? `${value}T12:00:00Z` : value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeZone: dateOnly ? "UTC" : "America/Santiago" }).format(date)
}
