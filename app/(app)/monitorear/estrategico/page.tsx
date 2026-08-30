"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { Activity, BellRing, Building2, Check, ExternalLink, Factory, FlaskConical, History, Loader2, Newspaper, Pause, Play, Plus, RefreshCw, Search, Trash2 } from "lucide-react"
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

const EMPTY_SUMMARY: Summary = { new_count: 0, high_new_count: 0, total_history: 0, patent_new_count: 0, trademark_new_count: 0, publication_new_count: 0, news_new_count: 0 }

export default function StrategicMonitoringPage() {
  const [watches, setWatches] = useState<Watch[]>([])
  const [signals, setSignals] = useState<Signal[]>([])
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY)
  const [type, setType] = useState<WatchType>("technology")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const active = useMemo(() => watches.filter(item => item.is_active), [watches])
  const visibleSignals = useMemo(() => showHistory ? signals : signals.filter(item => item.is_new), [showHistory, signals])

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
      title="Qué cambió en tu espacio tecnológico y competitivo."
      description={<>Sigue tecnologías, empresas y competidores. VIDENTIA cruza patentes y marcas INAPI con publicaciones científicas y señales públicas recientes, conservando la fuente y separando línea base de cambios nuevos.</>}
      meta={<><span>INAPI</span><span>OpenAlex + Crossref</span><span>GDELT</span><span>Evidencia trazable</span></>}
      actions={<Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin motion-reduce:animate-none" : ""}`} />Actualizar fuentes</Button>}
    />

    <OperationalMetricRail>
      <OperationalMetric value={summary.new_count} label="Cambios nuevos" detail="Desde tu última revisión" tone={summary.new_count ? "success" : "neutral"} />
      <OperationalMetric value={summary.high_new_count} label="Alta relevancia" detail="Señales prioritarias" tone={summary.high_new_count ? "warning" : "neutral"} />
      <OperationalMetric value={active.length} label="Vigilancias activas" detail="Tecnologías y empresas" tone={active.length ? "success" : "neutral"} />
      <OperationalMetric value={summary.total_history} label="Evidencias" detail="Historial conservado" />
    </OperationalMetricRail>

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
      <div className="flex gap-3"><BellRing className="mt-0.5 h-5 w-5 text-[#96B5A6]" /><div><p className="font-medium text-white">{summary.new_count} cambio{summary.new_count === 1 ? "" : "s"} nuevo{summary.new_count === 1 ? "" : "s"}</p><p className="mt-1 text-sm text-muted-foreground">{summary.patent_new_count} patentes · {summary.trademark_new_count} marcas · {summary.publication_new_count} publicaciones · {summary.news_new_count} noticias</p></div></div>
      <Button onClick={() => void markReviewed()} disabled={reviewing}>{reviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Marcar revisado</Button>
    </OperationalPanel> : null}

    {error ? <div role="alert" className="mt-6 rounded-[10px] bg-[#3A2525] p-4 text-sm text-[#E8AAA3]">{error}</div> : null}

    <section className="grid gap-8 py-9 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)] xl:gap-10">
      <div>
        <OperationalSectionHeader eyebrow="Qué cambió" title={showHistory ? "Historial de señales" : "Nuevo desde tu última revisión"} action={<Button variant="ghost" size="sm" onClick={() => setShowHistory(value => !value)}>{showHistory ? <><BellRing className="h-4 w-4" />Sólo lo nuevo</> : <><History className="h-4 w-4" />Ver historial</>}</Button>} />
        <div className="mt-5">
          {loading ? <div className="flex items-center gap-2 border-y border-border/80 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Consultando fuentes…</div> : visibleSignals.length ? <div className="divide-y divide-border/80 border-y border-border/80">{visibleSignals.map(signal => <SignalRow key={signal.id} signal={signal} />)}</div> : <div className="border-y border-border/80 py-10"><Activity className="h-5 w-5 text-[#96B5A6]" /><p className="mt-3 font-medium text-white">{active.length ? "No hay cambios nuevos por revisar" : "Aún no hay vigilancias estratégicas"}</p><p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">{active.length ? "Puedes revisar el historial o actualizar las fuentes. La línea base evita convertir antecedentes antiguos en alertas." : "Crea una vigilancia de tecnología, empresa o competidor para construir la primera línea base."}</p></div>}
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

function watchLabel(type: WatchType) { return type === "technology" ? "Tecnología" : type === "company" ? "Empresa" : "Competidor" }
function eventLabel(type: Signal["event_type"]) { return type === "patent" ? "Patente" : type === "trademark" ? "Marca" : type === "publication" ? "Publicación" : "Noticia" }
function sourceLabel(key: string) { return key === "inapi_open_data" ? "INAPI" : key === "openalex" ? "OpenAlex" : key === "crossref" ? "Crossref" : key === "gdelt" ? "GDELT" : key }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(date) }
