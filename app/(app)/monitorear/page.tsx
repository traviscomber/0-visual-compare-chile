"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { BellRing, Building2, Check, Clock3, Eye, History, Loader2, Pause, Play, Plus, RefreshCw, Search, ShieldCheck, Trash2 } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SaveToCaseAction } from "@/components/app/save-to-case-action"

type Watch = {
  id: string
  watch_type: "brand" | "owner"
  query: string
  nice_classes: number[]
  is_active: boolean
  last_checked_at: string | null
  last_reviewed_at: string | null
  created_at: string
}

type Signal = {
  id: string
  signal_key: string
  source: "INAPI" | "TDPI"
  watch_id: string
  watch_query: string
  mark_name: string
  applicant_name: string | null
  application_number: string | null
  nice_classes: number[]
  event_date: string | null
  state: string | null
  source_url: string | null
  relevance: "alta" | "media"
  reason: string
  first_seen_at: string
  last_seen_at: string
  is_new: boolean
}

type Summary = {
  new_count: number
  high_new_count: number
  total_history: number
  inapi_new_count: number
  tdpi_new_count: number
}

const EMPTY_SUMMARY: Summary = { new_count: 0, high_new_count: 0, total_history: 0, inapi_new_count: 0, tdpi_new_count: 0 }

export default function MonitorearPage() {
  const [watches, setWatches] = useState<Watch[]>([])
  const [signals, setSignals] = useState<Signal[]>([])
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY)
  const [type, setType] = useState<"brand" | "owner">("brand")
  const [query, setQuery] = useState("")
  const [classes, setClasses] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const active = useMemo(() => watches.filter((item) => item.is_active), [watches])
  const newSignals = useMemo(() => signals.filter((item) => item.is_new), [signals])
  const visibleSignals = useMemo(() => showHistory ? signals : newSignals, [showHistory, signals, newSignals])
  const lastHumanReview = useMemo(() => watches.map((item) => item.last_reviewed_at).filter(Boolean).sort().at(-1) ?? null, [watches])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [watchResponse, signalResponse] = await Promise.all([
        fetch("/api/intelligence/watchlist", { cache: "no-store" }),
        fetch("/api/intelligence/watch-signals", { cache: "no-store" }),
      ])
      const watchPayload = await watchResponse.json().catch(() => ({}))
      const signalPayload = await signalResponse.json().catch(() => ({}))
      if (!watchResponse.ok) throw new Error(watchPayload.error || "No pudimos cargar tus vigilancias.")
      if (!signalResponse.ok) throw new Error(signalPayload.error || "No pudimos revisar los cambios.")
      setWatches(Array.isArray(watchPayload.watches) ? watchPayload.watches : [])
      setSignals(Array.isArray(signalPayload.signals) ? signalPayload.signals : [])
      setSummary(signalPayload.summary ?? EMPTY_SUMMARY)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos cargar la vigilancia.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const brand = params.get("brand")?.trim()
    const owner = params.get("owner")?.trim()
    if (brand) {
      setType("brand")
      setQuery(brand.slice(0, 160))
      setShowCreate(true)
    } else if (owner) {
      setType("owner")
      setQuery(owner.slice(0, 160))
      setShowCreate(true)
    }
    void load()
  }, [])

  async function createWatch(event: FormEvent) {
    event.preventDefault()
    if (query.trim().length < 2 || saving) return
    setSaving(true)
    setError(null)
    try {
      const niza = classes.split(/[\s,;]+/).map(Number).filter((value) => Number.isInteger(value) && value >= 1 && value <= 45)
      const response = await fetch("/api/intelligence/watchlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, query: query.trim(), niza }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos crear la vigilancia.")
      setQuery("")
      setClasses("")
      setShowCreate(false)
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
      const response = await fetch("/api/intelligence/watch-signals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos guardar la revisión.")
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar la revisión.")
    } finally {
      setReviewing(false)
    }
  }

  async function toggle(watch: Watch) {
    const response = await fetch("/api/intelligence/watchlist", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: watch.id, active: !watch.is_active }),
    })
    if (!response.ok) return setError("No pudimos actualizar la vigilancia.")
    await load()
  }

  async function remove(id: string) {
    const response = await fetch(`/api/intelligence/watchlist?id=${encodeURIComponent(id)}`, { method: "DELETE" })
    if (!response.ok) return setError("No pudimos eliminar la vigilancia.")
    await load()
  }

  return (
    <OperationalPage>
      <OperationalHeader
        eyebrow="VIDENTIA / Vigilar"
        title="Qué cambió desde tu última revisión."
        description={<>Vigila marcas y titulares con señales provenientes de INAPI y TDPI. VIDENTIA separa lo nuevo del historial y conserva la fuente, la fecha y el motivo de cada alerta.</>}
        meta={<><span>INAPI + TDPI</span><span>Revisión humana</span><span>Historial trazable</span></>}
        actions={<><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin motion-reduce:animate-none" : ""}`} />Actualizar</Button><Button onClick={() => setShowCreate((value) => !value)}><Plus className="h-4 w-4" />Añadir vigilancia</Button></>}
      />

      <OperationalMetricRail>
        <OperationalMetric label="Nuevos" value={summary.new_count} detail="Desde tu última revisión" tone={summary.new_count > 0 ? "success" : "neutral"} />
        <OperationalMetric label="Prioritarios" value={summary.high_new_count} detail="Nuevos con relación alta" tone={summary.high_new_count > 0 ? "warning" : "neutral"} />
        <OperationalMetric label="Vigilancias" value={active.length} detail="Marcas y titulares activos" tone={active.length > 0 ? "success" : "neutral"} />
        <OperationalMetric label="Historial" value={summary.total_history} detail="Señales conservadas" />
      </OperationalMetricRail>

      {summary.new_count > 0 ? (
        <OperationalPanel className="my-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3"><BellRing className="mt-0.5 h-5 w-5 shrink-0 text-[#96B5A6]" /><div><p className="font-medium text-white">Hay {summary.new_count} cambio{summary.new_count === 1 ? "" : "s"} desde tu última revisión</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{summary.inapi_new_count} desde INAPI · {summary.tdpi_new_count} desde TDPI{lastHumanReview ? ` · última revisión ${formatDateTime(lastHumanReview)}` : ""}</p></div></div>
          <Button onClick={() => void markReviewed()} disabled={reviewing} className="shrink-0">{reviewing ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Check className="h-4 w-4" />}Marcar todo revisado</Button>
        </OperationalPanel>
      ) : active.length > 0 && !loading ? (
        <div className="my-7 flex items-start gap-3 border-y border-border/80 py-5"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#96B5A6]" /><div><p className="font-medium text-white">No hay cambios nuevos por revisar</p><p className="mt-1 text-sm leading-6 text-muted-foreground">El historial permanece disponible. Actualizar vuelve a consultar las fuentes sin convertir antecedentes antiguos en alertas nuevas.</p></div></div>
      ) : null}

      {showCreate ? (
        <section className="border-b border-border/80 py-7">
          <OperationalPanel>
            <form onSubmit={createWatch}>
              <OperationalSectionHeader eyebrow="Nueva vigilancia" title="¿Qué quieres seguir?" />
              <p className="mt-2 text-sm text-muted-foreground">Marca o titular. Las clases Niza son opcionales y ayudan a reducir ruido.</p>
              <div className="mt-5 grid gap-3 lg:grid-cols-[220px_1fr_180px_auto]">
                <div className="flex rounded-[10px] bg-[#0F2A33] p-1">
                  <Button type="button" size="sm" variant={type === "brand" ? "secondary" : "ghost"} className="flex-1" onClick={() => setType("brand")}><Search className="h-4 w-4" />Marca</Button>
                  <Button type="button" size="sm" variant={type === "owner" ? "secondary" : "ghost"} className="flex-1" onClick={() => setType("owner")}><Building2 className="h-4 w-4" />Titular</Button>
                </div>
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={type === "brand" ? "Ej: N3URALIA" : "Ej: EMPRESA SPA"} maxLength={160} />
                <Input value={classes} onChange={(event) => setClasses(event.target.value)} placeholder="Niza: 9, 35, 42" />
                <Button disabled={query.trim().length < 2 || saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Plus className="h-4 w-4" />}Empezar a vigilar</Button>
              </div>
            </form>
          </OperationalPanel>
        </section>
      ) : null}

      {error ? <div role="alert" className="mt-6 rounded-[10px] bg-[#3A2525] p-4 text-sm text-[#E8AAA3]">{error}</div> : null}

      <section className="grid gap-8 py-9 xl:grid-cols-[minmax(0,1.42fr)_minmax(300px,0.58fr)] xl:gap-10">
        <div>
          <OperationalSectionHeader
            eyebrow="Línea de tiempo"
            title={showHistory ? "Historial de vigilancia" : "Nuevo desde tu última revisión"}
            action={<Button variant="ghost" size="sm" onClick={() => setShowHistory((value) => !value)}>{showHistory ? <><BellRing className="h-4 w-4" />Ver sólo lo nuevo</> : <><History className="h-4 w-4" />Ver historial</>}</Button>}
          />

          <div className="mt-5">
            {loading ? <div className="flex items-center gap-2 border-y border-border/80 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />Revisando INAPI y TDPI…</div> : visibleSignals.length === 0 ? <Empty hasWatches={active.length > 0} hasHistory={signals.length > 0} onCreate={() => setShowCreate(true)} onHistory={() => setShowHistory(true)} /> : (
              <div className="relative border-l border-border/80 pl-5 sm:pl-7">
                {visibleSignals.map((signal) => <TimelineSignal key={signal.id} signal={signal} />)}
              </div>
            )}
          </div>
        </div>

        <aside>
          <OperationalPanel>
            <OperationalSectionHeader eyebrow="En seguimiento" title="Tus vigilancias" />
            {watches.length ? <div className="mt-5 divide-y divide-border/80 border-t border-border/80">{watches.map((watch) => {
              const watchNew = signals.filter((signal) => signal.watch_id === watch.id && signal.is_new).length
              return <div key={watch.id} className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="bg-[#0F2A33]">{watch.watch_type === "brand" ? "Marca" : "Titular"}</Badge>{!watch.is_active ? <Badge variant="secondary">Pausada</Badge> : null}{watchNew > 0 ? <Badge className="bg-[#173B37] text-[#96B5A6] hover:bg-[#173B37]">{watchNew} nuevo{watchNew === 1 ? "" : "s"}</Badge> : null}</div><p className="mt-3 font-medium text-white">{watch.query}</p>{watch.nice_classes.length ? <p className="mt-1 text-xs text-muted-foreground">Niza {watch.nice_classes.join(", ")}</p> : <p className="mt-1 text-xs text-muted-foreground">Todas las clases</p>}<p className="mt-2 text-[11px] text-muted-foreground">{watch.last_checked_at ? `Última consulta ${formatDateTime(watch.last_checked_at)}` : "Preparando primera línea base"}</p></div>
                  <div className="flex gap-1"><Button size="icon-sm" variant="ghost" onClick={() => void toggle(watch)} aria-label={watch.is_active ? "Pausar vigilancia" : "Activar vigilancia"}>{watch.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button><Button size="icon-sm" variant="ghost" onClick={() => void remove(watch.id)} aria-label="Eliminar vigilancia"><Trash2 className="h-4 w-4" /></Button></div>
                </div>
              </div>
            })}</div> : <div className="mt-5 py-7"><Eye className="h-6 w-6 text-muted-foreground" /><p className="mt-3 text-sm font-medium text-white">Aún no sigues ninguna marca</p><Button onClick={() => setShowCreate(true)} variant="outline" size="sm" className="mt-4">Añadir vigilancia</Button></div>}

            <div className="mt-6 border-t border-border/80 pt-5"><ShieldCheck className="h-4 w-4 text-[#96B5A6]" /><h3 className="mt-3 font-medium text-white">Cada señal conserva evidencia.</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">La fecha de detección, la fuente y el antecedente permanecen en el historial. VIDENTIA prioriza la revisión; la decisión jurídica sigue siendo humana.</p></div>
          </OperationalPanel>
        </aside>
      </section>
    </OperationalPage>
  )
}

function TimelineSignal({ signal }: { signal: Signal }) {
  return <article className="relative border-b border-border/80 py-6 first:pt-0 last:border-0">
    <span className={`absolute -left-[27px] top-7 h-3 w-3 rounded-full border-2 border-background sm:-left-[35px] ${signal.is_new ? "bg-primary" : "bg-muted-foreground/35"}`} />
    <div className="rounded-[10px] bg-[#13272D] p-5 shadow-[inset_0_0_0_1px_rgba(183,211,209,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">{signal.is_new ? <Badge className="bg-[#173B37] text-[#96B5A6] hover:bg-[#173B37]">Nuevo</Badge> : null}<Badge className={signal.relevance === "alta" ? "bg-[#332C24] text-[#D6A46F] hover:bg-[#332C24]" : "bg-[#172F34] text-muted-foreground hover:bg-[#172F34]"}>{signal.relevance === "alta" ? "Revisión prioritaria" : "Relacionado"}</Badge><Badge variant="outline" className="bg-[#0F2A33]">{signal.source}</Badge><Badge variant="outline" className="bg-[#0F2A33]">{signal.watch_query}</Badge></div>
          <h3 className="mt-3 text-lg font-medium text-white">{signal.mark_name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{signal.applicant_name || "Titular no informado"}</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{signal.reason}</p>
        </div>
        <div className="text-left sm:text-right"><p className="text-xs text-muted-foreground">Detectado</p><p className="mt-1 text-sm font-medium text-white">{formatDateTime(signal.first_seen_at)}</p></div>
      </div>
      <dl className="mt-4 grid gap-3 border-t border-border/80 pt-4 text-sm sm:grid-cols-3"><Fact label="Solicitud" value={signal.application_number || "—"} /><Fact label="Evento" value={formatDate(signal.event_date)} /><Fact label="Estado" value={signal.state || "—"} /></dl>
      {signal.nice_classes.length ? <div className="mt-4 flex flex-wrap gap-1.5">{signal.nice_classes.slice(0, 10).map((code) => <Badge key={`${signal.id}-${code}`} variant="secondary">Niza {code}</Badge>)}</div> : null}
      <div className="mt-5 flex flex-wrap gap-2">{signal.source_url ? <Button asChild size="sm"><a href={signal.source_url} target="_blank" rel="noreferrer">Ver fuente</a></Button> : null}<Button asChild size="sm" variant="outline"><Link href={`/evaluar?brand=${encodeURIComponent(signal.mark_name)}`}>Evaluar marca</Link></Button><SaveToCaseAction itemType="alert" sourceId={signal.signal_key} title={`${signal.source}: ${signal.mark_name}`} contextType="brand" contextQuery={signal.watch_query} suggestedCaseTitle={`Marca ${signal.watch_query}`} metadata={{ source: signal.source, application: signal.application_number, applicant: signal.applicant_name, date: signal.event_date, detectedAt: signal.first_seen_at, reason: signal.reason, sourceUrl: signal.source_url }} /></div>
    </div>
  </article>
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-medium text-white">{value}</dd></div>
}

function formatDate(value: string | null) {
  if (!value) return "—"
  const date = new Date(`${value}T12:00:00Z`)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(date)
}

function formatDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

function Empty({ hasWatches, hasHistory, onCreate, onHistory }: { hasWatches: boolean; hasHistory: boolean; onCreate: () => void; onHistory: () => void }) {
  return <div className="border-y border-border/80 py-10"><Clock3 className="h-6 w-6 text-muted-foreground" /><p className="mt-4 font-medium text-white">{!hasWatches ? "Añade una marca para empezar" : hasHistory ? "No hay cambios nuevos" : "Estamos construyendo tu línea base"}</p><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{!hasWatches ? "Vigilaremos nuevas solicitudes y movimientos relacionados." : hasHistory ? "Todo lo anterior sigue guardado en el historial." : "La primera consulta sirve de referencia; lo que aparezca después sí contará como nuevo."}</p><div className="mt-5 flex gap-2">{!hasWatches ? <Button onClick={onCreate}>Añadir vigilancia</Button> : hasHistory ? <Button onClick={onHistory} variant="outline"><History className="h-4 w-4" />Ver historial</Button> : null}</div></div>
}
