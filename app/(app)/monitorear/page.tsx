"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { BellRing, Building2, Eye, Loader2, Pause, Play, Plus, RefreshCw, Search, ShieldCheck, Trash2 } from "lucide-react"
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
  created_at: string
}

type Signal = {
  id: string
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
}

export default function MonitorearPage() {
  const [watches, setWatches] = useState<Watch[]>([])
  const [signals, setSignals] = useState<Signal[]>([])
  const [type, setType] = useState<"brand" | "owner">("brand")
  const [query, setQuery] = useState("")
  const [classes, setClasses] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const active = useMemo(() => watches.filter(item => item.is_active), [watches])
  const high = useMemo(() => signals.filter(item => item.relevance === "alta"), [signals])

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

  async function toggle(watch: Watch) {
    await fetch("/api/intelligence/watchlist", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: watch.id, active: !watch.is_active }),
    })
    await load()
  }

  async function remove(id: string) {
    await fetch(`/api/intelligence/watchlist?id=${encodeURIComponent(id)}`, { method: "DELETE" })
    await load()
  }

  return (
    <div className="mx-auto w-full max-w-[1380px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header className="grid gap-7 border-b border-slate-200 pb-9 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold text-teal-700">Vigilancia de marcas</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">Te mostramos sólo lo que cambió.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Sigue una marca o un titular. N3uralia cruza nuevas solicitudes INAPI y movimientos TDPI para que revises sólo las señales relacionadas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}/>Actualizar</Button>
          <Button onClick={() => setShowCreate(value => !value)} className="bg-teal-700 hover:bg-teal-800"><Plus className="mr-2 h-4 w-4"/>Añadir vigilancia</Button>
        </div>
      </header>

      <section className="grid border-b border-slate-200 sm:grid-cols-3">
        <Metric label="Revisión prioritaria" value={high.length} detail="Señales con relación alta" emphasis={high.length > 0}/>
        <Metric label="Vigilancias activas" value={active.length} detail="Marcas y titulares en seguimiento"/>
        <Metric label="Cambios detectados" value={signals.length} detail="INAPI y TDPI en esta revisión"/>
      </section>

      {showCreate ? (
        <section className="border-b border-slate-200 py-8">
          <form onSubmit={createWatch} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="mb-5"><h2 className="text-lg font-semibold text-slate-950">¿Qué quieres seguir?</h2><p className="mt-1 text-sm text-slate-500">Puedes vigilar una marca o un titular. Las clases Niza son opcionales y ayudan a reducir ruido.</p></div>
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

      <section className="grid gap-8 py-10 xl:grid-cols-[1.35fr_0.65fr]">
        <div>
          <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Cambios relacionados</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Qué merece revisión</h2></div>
          {loading ? <div className="flex items-center gap-2 py-10 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin"/>Revisando INAPI y TDPI…</div> : signals.length === 0 ? <Empty hasWatches={active.length > 0} onCreate={() => setShowCreate(true)}/> : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {signals.map(signal => (
                <article key={`${signal.watch_id}-${signal.id}`} className={`border-b border-slate-100 p-5 last:border-0 ${signal.relevance === "alta" ? "bg-amber-50/40" : ""}`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={signal.relevance === "alta" ? "bg-amber-100 text-amber-800 hover:bg-amber-100" : "bg-slate-100 text-slate-700 hover:bg-slate-100"}>{signal.relevance === "alta" ? "Revisión prioritaria" : "Relacionado"}</Badge>
                        <Badge variant="outline">{signal.source}</Badge>
                        <Badge variant="outline">Vigilancia · {signal.watch_query}</Badge>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-slate-950">{signal.mark_name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{signal.applicant_name || "Titular no informado"}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{signal.reason}</p>
                    </div>
                    <BellRing className={`h-5 w-5 ${signal.relevance === "alta" ? "text-amber-600" : "text-slate-400"}`}/>
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><Fact label="Solicitud" value={signal.application_number || "—"}/><Fact label="Fecha" value={formatDate(signal.event_date)}/><Fact label="Estado" value={signal.state || "—"}/></dl>
                  {signal.nice_classes.length ? <div className="mt-4 flex flex-wrap gap-1.5">{signal.nice_classes.slice(0, 10).map(code => <Badge key={`${signal.id}-${code}`} variant="secondary">Niza {code}</Badge>)}</div> : null}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {signal.source_url ? <Button asChild size="sm" className="bg-teal-700 hover:bg-teal-800"><a href={signal.source_url} target="_blank" rel="noreferrer">Ver fuente</a></Button> : null}
                    <Button asChild size="sm" variant="outline"><Link href={`/evaluar?nombre=${encodeURIComponent(signal.mark_name)}`}>Evaluar marca</Link></Button>
                    <SaveToCaseAction itemType="alert" sourceId={signal.id} title={`${signal.source}: ${signal.mark_name}`} contextType="brand" contextQuery={signal.watch_query} suggestedCaseTitle={`Marca ${signal.watch_query}`} metadata={{ source: signal.source, application: signal.application_number, applicant: signal.applicant_name, date: signal.event_date, reason: signal.reason, sourceUrl: signal.source_url }}/>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside>
          <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">En seguimiento</p><h2 className="mt-2 text-xl font-semibold text-slate-950">Tus vigilancias</h2></div>
          {watches.length ? <div className="space-y-3">{watches.map(watch => (
            <div key={watch.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{watch.watch_type === "brand" ? "Marca" : "Titular"}</Badge>{!watch.is_active ? <Badge variant="secondary">Pausada</Badge> : null}</div><p className="mt-3 font-semibold text-slate-950">{watch.query}</p>{watch.nice_classes.length ? <p className="mt-1 text-xs text-slate-500">Niza {watch.nice_classes.join(", ")}</p> : <p className="mt-1 text-xs text-slate-400">Todas las clases</p>}</div>
                <div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => void toggle(watch)} aria-label={watch.is_active ? "Pausar vigilancia" : "Activar vigilancia"}>{watch.is_active ? <Pause className="h-4 w-4"/> : <Play className="h-4 w-4"/>}</Button><Button size="icon" variant="ghost" onClick={() => void remove(watch.id)} aria-label="Eliminar vigilancia"><Trash2 className="h-4 w-4"/></Button></div>
              </div>
            </div>
          ))}</div> : <div className="rounded-2xl border border-dashed border-slate-300 p-7 text-center"><Eye className="mx-auto h-6 w-6 text-slate-400"/><p className="mt-3 text-sm font-semibold text-slate-800">Aún no sigues ninguna marca</p><Button onClick={() => setShowCreate(true)} variant="outline" size="sm" className="mt-4">Añadir vigilancia</Button></div>}

          <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white"><ShieldCheck className="h-5 w-5 text-teal-300"/><h3 className="mt-4 font-semibold">La señal no es la decisión.</h3><p className="mt-2 text-sm leading-6 text-slate-300">Cada cambio conserva su fuente oficial. N3uralia prioriza qué revisar; la conclusión jurídica sigue apoyándose en la evidencia.</p></div>
        </aside>
      </section>
    </div>
  )
}

function Metric({ label, value, detail, emphasis = false }: { label: string; value: number; detail: string; emphasis?: boolean }) { return <div className="border-b border-slate-200 py-6 sm:border-b-0 sm:border-r sm:px-5 first:pl-0 last:border-r-0"><p className={`text-3xl font-semibold tracking-tight ${emphasis ? "text-amber-700" : "text-slate-950"}`}>{value}</p><p className="mt-1 text-sm font-semibold text-slate-700">{label}</p><p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p></div> }
function Fact({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-slate-400">{label}</dt><dd className="mt-1 font-medium text-slate-700">{value}</dd></div> }
function formatDate(value: string | null) { if (!value) return "—"; const date = new Date(`${value}T12:00:00`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(date) }
function Empty({ hasWatches, onCreate }: { hasWatches: boolean; onCreate: () => void }) { return <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center"><ShieldCheck className="mx-auto h-6 w-6 text-emerald-600"/><h3 className="mt-3 font-semibold text-slate-900">{hasWatches ? "No hay cambios relacionados por ahora" : "Añade tu primera vigilancia"}</h3><p className="mt-1 text-sm text-slate-500">{hasWatches ? "Cuando INAPI o TDPI publiquen actividad relacionada, aparecerá aquí." : "Sigue una marca o titular para que N3uralia detecte novedades automáticamente."}</p>{!hasWatches ? <Button onClick={onCreate} variant="outline" size="sm" className="mt-4"><Plus className="mr-2 h-4 w-4"/>Añadir vigilancia</Button> : null}</div> }
