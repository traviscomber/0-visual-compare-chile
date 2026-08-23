"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { BellRing, Building2, Check, Clock3, Eye, History, Loader2, Pause, Play, Plus, RefreshCw, Search, ShieldCheck, Sparkles, Trash2 } from "lucide-react"
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

  const active = useMemo(() => watches.filter(item => item.is_active), [watches])
  const newSignals = useMemo(() => signals.filter(item => item.is_new), [signals])
  const visibleSignals = useMemo(() => showHistory ? signals : newSignals, [showHistory, signals, newSignals])
  const lastHumanReview = useMemo(() => watches.map(item => item.last_reviewed_at).filter(Boolean).sort().at(-1) ?? null, [watches])

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

  useEffect(() => { void load() }, [])

  async function createWatch(event: FormEvent) {
    event.preventDefault()
    if (query.trim().length < 2 || saving) return
    setSaving(true)
    setError(null)
    try {
      const niza = classes.split(/[\s,;]+/).map(Number).filter(value => Number.isInteger(value) && value >= 1 && value <= 45)
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
    <div className="mx-auto w-full max-w-[1380px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header className="grid gap-7 border-b border-slate-200 pb-9 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold text-teal-700">Vigilancia de marcas</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">Qué cambió desde que lo revisaste.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Seguimos marcas y titulares contra INAPI y TDPI. Guardamos el historial y separamos lo nuevo de lo que ya revisaste.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}/>Actualizar</Button>
          <Button onClick={() => setShowCreate(value => !value)} className="bg-teal-700 hover:bg-teal-800"><Plus className="mr-2 h-4 w-4"/>Añadir vigilancia</Button>
        </div>
      </header>

      <section className="grid border-b border-slate-200 sm:grid-cols-4">
        <Metric label="Nuevos" value={summary.new_count} detail="Desde tu última revisión" emphasis={summary.new_count > 0}/>
        <Metric label="Prioritarios" value={summary.high_new_count} detail="Nuevos con relación alta" emphasis={summary.high_new_count > 0}/>
        <Metric label="Vigilancias" value={active.length} detail="Marcas y titulares activos"/>
        <Metric label="Historial" value={summary.total_history} detail="Señales conservadas"/>
      </section>

      {summary.new_count > 0 ? (
        <section className="my-7 overflow-hidden rounded-2xl border border-teal-200 bg-teal-50/60">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex gap-3"><Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-teal-700"/><div><p className="font-semibold text-slate-950">Hay {summary.new_count} cambio{summary.new_count === 1 ? "" : "s"} desde tu última revisión</p><p className="mt-1 text-sm leading-6 text-slate-600">{summary.inapi_new_count} desde INAPI · {summary.tdpi_new_count} desde TDPI{lastHumanReview ? ` · última revisión ${formatDateTime(lastHumanReview)}` : ""}</p></div></div>
            <Button onClick={() => void markReviewed()} disabled={reviewing} className="shrink-0 bg-teal-700 hover:bg-teal-800">{reviewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4"/>}Marcar todo revisado</Button>
          </div>
        </section>
      ) : active.length > 0 && !loading ? (
        <section className="my-7 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-700"/><div><p className="font-semibold text-slate-950">No hay cambios nuevos por revisar</p><p className="mt-1 text-sm leading-6 text-slate-600">El historial permanece disponible. Actualizar vuelve a consultar las fuentes sin convertir antecedentes antiguos en alertas nuevas.</p></div></section>
      ) : null}

      {showCreate ? (
        <section className="border-y border-slate-200 py-8">
          <form onSubmit={createWatch} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="mb-5"><h2 className="text-lg font-semibold text-slate-950">¿Qué quieres seguir?</h2><p className="mt-1 text-sm text-slate-500">Marca o titular. Las clases Niza son opcionales y ayudan a reducir ruido.</p></div>
            <div className="grid gap-3 lg:grid-cols-[220px_1fr_180px_auto]">
              <div className="flex rounded-lg border border-slate-200 p-1">
                <Button type="button" size="sm" variant={type === "brand" ? "secondary" : "ghost"} className="flex-1" onClick={() => setType("brand")}><Search className="mr-1.5 h-4 w-4"/>Marca</Button>
                <Button type="button" size="sm" variant={type === "owner" ? "secondary" : "ghost"} className="flex-1" onClick={() => setType("owner")}><Building2 className="mr-1.5 h-4 w-4"/>Titular</Button>
              </div>
              <Input value={query} onChange={event => setQuery(event.target.value)} placeholder={type === "brand" ? "Ej: N3URALIA" : "Ej: EMPRESA SPA"} maxLength={160}/>
              <Input value={classes} onChange={event => setClasses(event.target.value)} placeholder="Niza: 9, 35, 42"/>
              <Button disabled={query.trim().length < 2 || saving} className="bg-teal-700 hover:bg-teal-800">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Plus className="mr-2 h-4 w-4"/>}Empezar a vigilar</Button>
            </div>
          </form>
        </section>
      ) : null}

      {error ? <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <section className="grid gap-8 py-10 xl:grid-cols-[1.42fr_0.58fr]">
        <div>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Línea de tiempo</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{showHistory ? "Historial de vigilancia" : "Nuevo desde tu última revisión"}</h2></div>
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(value => !value)}>{showHistory ? <><BellRing className="mr-2 h-4 w-4"/>Ver sólo lo nuevo</> : <><History className="mr-2 h-4 w-4"/>Ver historial</>}</Button>
          </div>

          {loading ? <div className="flex items-center gap-2 py-10 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin"/>Revisando INAPI y TDPI…</div> : visibleSignals.length === 0 ? <Empty hasWatches={active.length > 0} hasHistory={signals.length > 0} onCreate={() => setShowCreate(true)} onHistory={() => setShowHistory(true)}/> : (
            <div className="relative border-l border-slate-200 pl-5 sm:pl-7">
              {visibleSignals.map(signal => <TimelineSignal key={signal.id} signal={signal}/>) }
            </div>
          )}
        </div>

        <aside>
          <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">En seguimiento</p><h2 className="mt-2 text-xl font-semibold text-slate-950">Tus vigilancias</h2></div>
          {watches.length ? <div className="space-y-3">{watches.map(watch => {
            const watchNew = signals.filter(signal => signal.watch_id === watch.id && signal.is_new).length
            return <div key={watch.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{watch.watch_type === "brand" ? "Marca" : "Titular"}</Badge>{!watch.is_active ? <Badge variant="secondary">Pausada</Badge> : null}{watchNew > 0 ? <Badge className="bg-teal-50 text-teal-800 hover:bg-teal-50">{watchNew} nuevo{watchNew === 1 ? "" : "s"}</Badge> : null}</div><p className="mt-3 font-semibold text-slate-950">{watch.query}</p>{watch.nice_classes.length ? <p className="mt-1 text-xs text-slate-500">Niza {watch.nice_classes.join(", ")}</p> : <p className="mt-1 text-xs text-slate-400">Todas las clases</p>}<p className="mt-2 text-[11px] text-slate-400">{watch.last_checked_at ? `Última consulta ${formatDateTime(watch.last_checked_at)}` : "Preparando primera línea base"}</p></div>
                <div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => void toggle(watch)} aria-label={watch.is_active ? "Pausar vigilancia" : "Activar vigilancia"}>{watch.is_active ? <Pause className="h-4 w-4"/> : <Play className="h-4 w-4"/>}</Button><Button size="icon" variant="ghost" onClick={() => void remove(watch.id)} aria-label="Eliminar vigilancia"><Trash2 className="h-4 w-4"/></Button></div>
              </div>
            </div>
          })}</div> : <div className="rounded-2xl border border-dashed border-slate-300 p-7 text-center"><Eye className="mx-auto h-6 w-6 text-slate-400"/><p className="mt-3 text-sm font-semibold text-slate-800">Aún no sigues ninguna marca</p><Button onClick={() => setShowCreate(true)} variant="outline" size="sm" className="mt-4">Añadir vigilancia</Button></div>}

          <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white"><ShieldCheck className="h-5 w-5 text-teal-300"/><h3 className="mt-4 font-semibold">Cada señal conserva evidencia.</h3><p className="mt-2 text-sm leading-6 text-slate-300">La fecha de detección, la fuente y el antecedente quedan en el historial. N3uralia prioriza; la decisión jurídica sigue siendo humana.</p></div>
        </aside>
      </section>
    </div>
  )
}

function TimelineSignal({ signal }: { signal: Signal }) {
  return <article className="relative border-b border-slate-100 py-6 first:pt-0 last:border-0">
    <span className={`absolute -left-[27px] top-7 h-3 w-3 rounded-full border-2 border-white sm:-left-[35px] ${signal.is_new ? "bg-teal-600" : "bg-slate-300"}`}/>
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">{signal.is_new ? <Badge className="bg-teal-50 text-teal-800 hover:bg-teal-50">Nuevo</Badge> : null}<Badge className={signal.relevance === "alta" ? "bg-amber-100 text-amber-800 hover:bg-amber-100" : "bg-slate-100 text-slate-700 hover:bg-slate-100"}>{signal.relevance === "alta" ? "Revisión prioritaria" : "Relacionado"}</Badge><Badge variant="outline">{signal.source}</Badge><Badge variant="outline">{signal.watch_query}</Badge></div>
          <h3 className="mt-3 text-lg font-semibold text-slate-950">{signal.mark_name}</h3>
          <p className="mt-1 text-sm text-slate-500">{signal.applicant_name || "Titular no informado"}</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">{signal.reason}</p>
        </div>
        <div className="text-right"><p className="text-xs text-slate-400">Detectado</p><p className="mt-1 text-sm font-medium text-slate-700">{formatDateTime(signal.first_seen_at)}</p></div>
      </div>
      <dl className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3"><Fact label="Solicitud" value={signal.application_number || "—"}/><Fact label="Evento" value={formatDate(signal.event_date)}/><Fact label="Estado" value={signal.state || "—"}/></dl>
      {signal.nice_classes.length ? <div className="mt-4 flex flex-wrap gap-1.5">{signal.nice_classes.slice(0, 10).map(code => <Badge key={`${signal.id}-${code}`} variant="secondary">Niza {code}</Badge>)}</div> : null}
      <div className="mt-5 flex flex-wrap gap-2">{signal.source_url ? <Button asChild size="sm" className="bg-teal-700 hover:bg-teal-800"><a href={signal.source_url} target="_blank" rel="noreferrer">Ver fuente</a></Button> : null}<Button asChild size="sm" variant="outline"><Link href={`/evaluar?nombre=${encodeURIComponent(signal.mark_name)}`}>Evaluar marca</Link></Button><SaveToCaseAction itemType="alert" sourceId={signal.signal_key} title={`${signal.source}: ${signal.mark_name}`} contextType="brand" contextQuery={signal.watch_query} suggestedCaseTitle={`Marca ${signal.watch_query}`} metadata={{ source: signal.source, application: signal.application_number, applicant: signal.applicant_name, date: signal.event_date, detectedAt: signal.first_seen_at, reason: signal.reason, sourceUrl: signal.source_url }}/></div>
    </div>
  </article>
}

function Metric({ label, value, detail, emphasis = false }: { label: string; value: number; detail: string; emphasis?: boolean }) { return <div className="border-b border-slate-200 py-6 sm:border-b-0 sm:border-r sm:px-5 first:pl-0 last:border-r-0"><p className={`text-3xl font-semibold tracking-tight ${emphasis ? "text-teal-700" : "text-slate-950"}`}>{value}</p><p className="mt-1 text-sm font-semibold text-slate-700">{label}</p><p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p></div> }
function Fact({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-slate-400">{label}</dt><dd className="mt-1 font-medium text-slate-700">{value}</dd></div> }
function formatDate(value: string | null) { if (!value) return "—"; const date = new Date(`${value}T12:00:00Z`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(date) }
function formatDateTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(date) }
function Empty({ hasWatches, hasHistory, onCreate, onHistory }: { hasWatches: boolean; hasHistory: boolean; onCreate: () => void; onHistory: () => void }) { return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center"><Clock3 className="mx-auto h-6 w-6 text-slate-400"/><p className="mt-4 font-semibold text-slate-800">{!hasWatches ? "Añade una marca para empezar" : hasHistory ? "No hay cambios nuevos" : "Estamos construyendo tu línea base"}</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{!hasWatches ? "Vigilaremos nuevas solicitudes y movimientos relacionados." : hasHistory ? "Todo lo anterior sigue guardado en el historial." : "La primera consulta sirve de referencia; lo que aparezca después sí contará como nuevo."}</p><div className="mt-5 flex justify-center gap-2">{!hasWatches ? <Button onClick={onCreate} className="bg-teal-700 hover:bg-teal-800">Añadir vigilancia</Button> : hasHistory ? <Button onClick={onHistory} variant="outline"><History className="mr-2 h-4 w-4"/>Ver historial</Button> : null}</div></div> }
