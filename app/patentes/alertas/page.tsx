"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  BellRing,
  Building2,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  Pause,
  Play,
  Plus,
  Radar,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Watch = {
  id: string
  watch_type: "company" | "ipc"
  query: string
  is_active: boolean
  last_checked_at: string
  created_at: string
}

type Event = {
  id: string
  watch_id: string
  title: string
  application_number: string | null
  applicants: string | null
  ipc_codes: string[]
  filing_date: string | null
  detected_at: string
  read_at: string | null
}

type Payload = { watches: Watch[]; events: Event[]; unread: number }
type SignalFilter = "new" | "all" | "read"

function formatDate(value: string | null | undefined) {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

export default function PatentAlertsPage() {
  const [data, setData] = useState<Payload>({ watches: [], events: [], unread: 0 })
  const [type, setType] = useState<"company" | "ipc">("company")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<SignalFilter>("new")
  const [showCreate, setShowCreate] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/patents/alerts", { cache: "no-store" })
      const payload = await response.json().catch(() => ({}))
      if (response.ok) setData(payload as Payload)
      else setError(payload.error || "No pudimos cargar el monitoreo.")
    } catch {
      setError("No pudimos conectar con el servicio de monitoreo.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const createWatch = async (event: FormEvent) => {
    event.preventDefault()
    if (query.trim().length < 2 || saving) return
    setSaving(true)
    setError(null)
    try {
      const response = await fetch("/api/patents/alerts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, query }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) setError(payload.error || "No pudimos crear la vigilancia.")
      else {
        setQuery("")
        setShowCreate(false)
        await load()
      }
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (watch: Watch) => {
    await fetch("/api/patents/alerts", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: watch.id, active: !watch.is_active }),
    })
    await load()
  }

  const remove = async (id: string) => {
    await fetch(`/api/patents/alerts?id=${encodeURIComponent(id)}`, { method: "DELETE" })
    await load()
  }

  const markRead = async (event: Event) => {
    if (event.read_at) return
    await fetch("/api/patents/alerts", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId: event.id }),
    })
    await load()
  }

  const watchById = useMemo(() => new Map(data.watches.map((watch) => [watch.id, watch])), [data.watches])
  const activeWatches = data.watches.filter((watch) => watch.is_active)
  const pausedWatches = data.watches.length - activeWatches.length
  const latestSignal = data.events[0]?.detected_at ?? null
  const visibleEvents = data.events.filter((event) => {
    if (filter === "new") return !event.read_at
    if (filter === "read") return Boolean(event.read_at)
    return true
  })

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:py-14">
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <Radar className="h-3.5 w-3.5" /> Monitorear
          </div>
          <h1 className="text-4xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl">Qué cambió desde la última vez.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Visual Compare revisa tus empresas e IPC vigilados después de cada sincronización oficial y convierte nuevas solicitudes en señales accionables.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Actualizar</Button>
          <Button onClick={() => setShowCreate((value) => !value)}><Plus className="mr-2 h-4 w-4" />Nueva vigilancia</Button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Señales nuevas" value={data.unread} detail={data.unread ? "Requieren revisión" : "Nada nuevo por revisar"} emphasis={data.unread > 0} />
        <MetricCard label="Vigilancias activas" value={activeWatches.length} detail={`${pausedWatches} pausadas`} />
        <MetricCard label="Señales observadas" value={data.events.length} detail="Historial disponible" />
        <MetricCard label="Último cambio" value={latestSignal ? "Detectado" : "Sin cambios"} detail={latestSignal ? formatDate(latestSignal) : "Esperando nueva actividad"} />
      </section>

      {data.unread > 0 ? (
        <section className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15 text-amber-500"><BellRing className="h-4 w-4" /></span>
              <div><p className="font-semibold text-foreground">Tienes {data.unread} {data.unread === 1 ? "señal nueva" : "señales nuevas"}</p><p className="mt-1 text-sm text-muted-foreground">Empieza por estas solicitudes antes de revisar el resto del historial.</p></div>
            </div>
            <Button variant="outline" onClick={() => setFilter("new")}>Ver sólo nuevas <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-border bg-secondary/20 p-5 sm:p-6">
          <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-500" /><div><p className="font-semibold text-foreground">Sin cambios pendientes</p><p className="mt-1 text-sm text-muted-foreground">Todo lo detectado hasta ahora ya fue revisado. Las vigilancias activas seguirán corriendo con la sincronización oficial.</p></div></div>
        </section>
      )}

      {showCreate && (
        <Card className="border-foreground/15">
          <CardHeader><CardTitle className="text-xl">Añadir algo a tu radar</CardTitle><CardDescription>Sigue una empresa o un prefijo IPC. Sólo generamos señales por actividad nueva posterior a la creación de la vigilancia.</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={createWatch} className="grid gap-3 lg:grid-cols-[220px_1fr_auto]">
              <div className="flex rounded-lg border border-border p-1">
                <Button type="button" size="sm" variant={type === "company" ? "secondary" : "ghost"} className="flex-1" onClick={() => setType("company")}><Building2 className="mr-1.5 h-4 w-4" />Empresa</Button>
                <Button type="button" size="sm" variant={type === "ipc" ? "secondary" : "ghost"} className="flex-1" onClick={() => setType("ipc")}><Search className="mr-1.5 h-4 w-4" />IPC</Button>
              </div>
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={type === "company" ? "Ej: NESTLE, SYNGENTA, BASF" : "Ej: A61, G06F, C25C"} maxLength={160} className="h-10" />
              <Button disabled={query.trim().length < 2 || saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Empezar a vigilar</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><CardTitle className="text-xl">Señales</CardTitle><CardDescription>Solicitudes detectadas por tus vigilancias activas.</CardDescription></div>
            <div className="flex rounded-lg border border-border p-1">
              {(["new", "all", "read"] as SignalFilter[]).map((value) => (
                <Button key={value} size="sm" variant={filter === value ? "secondary" : "ghost"} onClick={() => setFilter(value)}>
                  {value === "new" ? `Nuevas ${data.unread ? `(${data.unread})` : ""}` : value === "all" ? "Todas" : "Revisadas"}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Cargando señales…</div>
            ) : visibleEvents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center"><Eye className="mx-auto h-7 w-7 text-muted-foreground" /><p className="mt-3 font-medium text-foreground">No hay señales en esta vista</p><p className="mt-1 text-sm text-muted-foreground">Cuando una nueva solicitud coincida con tu watchlist aparecerá aquí.</p></div>
            ) : visibleEvents.map((event) => {
              const watch = watchById.get(event.watch_id)
              return (
                <button key={event.id} onClick={() => void markRead(event)} className={`group w-full rounded-xl border p-4 text-left transition ${event.read_at ? "border-border bg-background hover:bg-secondary/20" : "border-amber-500/30 bg-amber-500/[0.05] hover:border-amber-500/50"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {!event.read_at && <Badge>Nuevo</Badge>}
                        {watch && <Badge variant="outline">{watch.watch_type === "company" ? "Empresa" : "IPC"}: {watch.query}</Badge>}
                      </div>
                      <h3 className="mt-3 text-base font-semibold leading-6 text-foreground">{event.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{event.applicants || "Solicitante no informado"}</p>
                    </div>
                    {event.read_at ? <CheckCircle2 className="h-4 w-4 text-muted-foreground" /> : <BellRing className="h-4 w-4 text-amber-500" />}
                  </div>
                  <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                    <span>Solicitud <strong className="font-medium text-foreground">{event.application_number || "—"}</strong></span>
                    <span>Presentada <strong className="font-medium text-foreground">{event.filing_date || "—"}</strong></span>
                    <span>Detectada <strong className="font-medium text-foreground">{formatDate(event.detected_at)}</strong></span>
                  </div>
                  {event.ipc_codes.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{event.ipc_codes.slice(0, 8).map((code) => <Badge key={code} variant="secondary">{code}</Badge>)}</div>}
                  {!event.read_at && <p className="mt-4 text-xs font-medium text-amber-600 dark:text-amber-400">Haz clic para marcar como revisada</p>}
                </button>
              )
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-xl">Tu watchlist</CardTitle><CardDescription>{activeWatches.length} activas · {pausedWatches} pausadas</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : data.watches.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center"><Radar className="mx-auto h-6 w-6 text-muted-foreground" /><p className="mt-3 text-sm font-medium text-foreground">Tu radar está vacío</p><p className="mt-1 text-xs text-muted-foreground">Añade una empresa o IPC para empezar.</p></div>
              ) : data.watches.map((watch) => (
                <div key={watch.id} className="rounded-xl border border-border p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{watch.watch_type === "company" ? "Empresa" : "IPC"}</Badge><span className="font-medium text-foreground">{watch.query}</span>{!watch.is_active && <Badge variant="secondary">Pausada</Badge>}</div><p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />Último chequeo {formatDate(watch.last_checked_at)}</p></div>
                    <div className="flex shrink-0 gap-1"><Button size="icon" variant="ghost" onClick={() => void toggle(watch)} aria-label={watch.is_active ? "Pausar" : "Activar"}>{watch.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button><Button size="icon" variant="ghost" onClick={() => void remove(watch.id)} aria-label="Eliminar"><Trash2 className="h-4 w-4" /></Button></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Investigar una señal</CardTitle><CardDescription>Usa el workspace de investigación para ampliar una empresa, tecnología o solicitud que aparezca en tu radar.</CardDescription></CardHeader>
            <CardContent><Button asChild variant="outline" className="w-full"><Link href="/investigar">Abrir Investigar <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

function MetricCard({ label, value, detail, emphasis = false }: { label: string; value: string | number; detail: string; emphasis?: boolean }) {
  return <div className={`rounded-2xl border p-4 ${emphasis ? "border-amber-500/30 bg-amber-500/[0.05]" : "border-border bg-card"}`}><p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>
}
