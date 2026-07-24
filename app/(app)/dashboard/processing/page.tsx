"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Cpu,
  Loader2,
  RefreshCw,
  RotateCcw,
  ServerCog,
  TimerReset,
  XCircle,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ProcessingJob {
  id: string
  image_id: string
  status: "queued" | "processing" | "completed" | "failed"
  attempts: number
  max_attempts: number
  created_at: string
  updated_at: string
  completed_at: string | null
  last_error: string | null
}

interface Metrics {
  queued: number
  processing: number
  completed: number
  failed: number
  retried: number
  active_workers: number
  avg_processing_seconds: number
  throughput_last_hour: number
  oldest_queued_seconds: number
  recent_jobs: ProcessingJob[]
}

interface Health {
  status: "healthy" | "warning" | "critical" | "unknown"
  queued: number
  processing: number
  failures_last_hour: number
  completed_last_hour: number
  oldest_queued_seconds: number
  expiring_leases: number
  checked_at: string
}

interface ApiResponse {
  metrics: Metrics
  health: Health
}

interface Snapshot {
  time: string
  queued: number
  processing: number
  completed: number
  failed: number
}

const EMPTY_METRICS: Metrics = {
  queued: 0,
  processing: 0,
  completed: 0,
  failed: 0,
  retried: 0,
  active_workers: 0,
  avg_processing_seconds: 0,
  throughput_last_hour: 0,
  oldest_queued_seconds: 0,
  recent_jobs: [],
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(new Date(value))
}

function healthPresentation(status: Health["status"]) {
  if (status === "healthy") {
    return { label: "Healthy", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400", icon: CheckCircle2 }
  }
  if (status === "warning") {
    return { label: "Warning", className: "border-amber-500/30 bg-amber-500/10 text-amber-400", icon: AlertTriangle }
  }
  if (status === "critical") {
    return { label: "Critical", className: "border-red-500/30 bg-red-500/10 text-red-400", icon: XCircle }
  }
  return { label: "Unknown", className: "border-border bg-secondary text-muted-foreground", icon: Activity }
}

function statusBadge(status: ProcessingJob["status"]) {
  const styles: Record<ProcessingJob["status"], string> = {
    queued: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    processing: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    failed: "border-red-500/30 bg-red-500/10 text-red-400",
  }
  return <Badge variant="outline" className={styles[status]}>{status}</Badge>
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: string | number
  detail: string
  icon: typeof Activity
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary/50 p-2.5">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  )
}

export default function ProcessingDashboardPage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [history, setHistory] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const loadMetrics = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const response = await fetch("/api/account/processing-metrics", { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || "No fue posible cargar las métricas.")

      setData(payload)
      setError("")
      const now = new Intl.DateTimeFormat("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date())
      setHistory((current) => [
        ...current.slice(-19),
        {
          time: now,
          queued: payload.metrics?.queued ?? 0,
          processing: payload.metrics?.processing ?? 0,
          completed: payload.metrics?.completed ?? 0,
          failed: payload.metrics?.failed ?? 0,
        },
      ])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Error desconocido.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadMetrics()
    const interval = window.setInterval(() => void loadMetrics(), 15000)
    return () => window.clearInterval(interval)
  }, [loadMetrics])

  const retryFailed = async () => {
    setRetrying(true)
    setMessage("")
    try {
      const response = await fetch("/api/account/processing-metrics", { method: "POST" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || "No fue posible reintentar los trabajos.")
      setMessage(`${payload.retried ?? 0} trabajo(s) reenviado(s) a la cola.`)
      await loadMetrics(true)
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "Error desconocido.")
    } finally {
      setRetrying(false)
    }
  }

  const metrics = data?.metrics ?? EMPTY_METRICS
  const health = data?.health ?? ({ status: "unknown" } as Health)
  const healthUi = healthPresentation(health.status)
  const HealthIcon = healthUi.icon

  const totalJobs = useMemo(
    () => metrics.queued + metrics.processing + metrics.completed + metrics.failed,
    [metrics],
  )

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando consola de procesamiento…
        </div>
      </div>
    )
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Processing Operations</h1>
            <Badge variant="outline" className={healthUi.className}>
              <HealthIcon className="mr-1.5 h-3.5 w-3.5" />
              {healthUi.label}
            </Badge>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Estado de la cola, workers, rendimiento y errores del pipeline de imágenes. Actualización automática cada 15 segundos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void loadMetrics(true)} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button onClick={retryFailed} disabled={retrying || metrics.failed === 0}>
            {retrying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
            Retry failed ({metrics.failed})
          </Button>
        </div>
      </div>

      {(error || message) && (
        <div className={`mt-5 rounded-lg border px-4 py-3 text-sm ${error ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"}`}>
          {error || message}
        </div>
      )}

      <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Queue" value={metrics.queued} detail={`Más antiguo: ${formatDuration(metrics.oldest_queued_seconds)}`} icon={Clock3} />
        <MetricCard label="Processing" value={metrics.processing} detail={`${metrics.active_workers} worker(s) activo(s)`} icon={Cpu} />
        <MetricCard label="Completed" value={metrics.completed} detail={`${metrics.throughput_last_hour} completados en 1h`} icon={CheckCircle2} />
        <MetricCard label="Failed" value={metrics.failed} detail={`${metrics.retried} con reintentos`} icon={XCircle} />
        <MetricCard label="Throughput" value={`${metrics.throughput_last_hour}/h`} detail="Ventana móvil de una hora" icon={Activity} />
        <MetricCard label="Avg latency" value={formatDuration(metrics.avg_processing_seconds)} detail="Desde creación hasta completado" icon={TimerReset} />
        <MetricCard label="Active workers" value={metrics.active_workers} detail={`${health.expiring_leases ?? 0} lease(s) por expirar`} icon={ServerCog} />
        <MetricCard label="Total jobs" value={totalJobs} detail={`Health check ${formatDate(health.checked_at ?? null)}`} icon={Activity} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-foreground">Actividad en tiempo real</h2>
            <p className="mt-1 text-xs text-muted-foreground">Snapshots de esta sesión. Se mantienen las últimas 20 lecturas.</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="queuedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="currentColor" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.18} />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Area type="monotone" dataKey="queued" stroke="currentColor" fill="url(#queuedGradient)" strokeWidth={2} name="Queued" />
                <Area type="monotone" dataKey="processing" stroke="currentColor" fillOpacity={0.08} strokeWidth={2} name="Processing" />
                <Area type="monotone" dataKey="failed" stroke="currentColor" fillOpacity={0.04} strokeWidth={1.5} name="Failed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h2 className="text-base font-semibold text-foreground">Health global</h2>
          <p className="mt-1 text-xs text-muted-foreground">Indicadores operacionales de toda la cola.</p>
          <dl className="mt-5 space-y-4">
            {[
              ["Completados última hora", health.completed_last_hour ?? 0],
              ["Fallos última hora", health.failures_last_hour ?? 0],
              ["Queue global", health.queued ?? 0],
              ["Processing global", health.processing ?? 0],
              ["Oldest queue", formatDuration(health.oldest_queued_seconds ?? 0)],
              ["Expiring leases", health.expiring_leases ?? 0],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex items-center justify-between border-b border-border/70 pb-3 last:border-0">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="text-sm font-medium text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-4 sm:px-5">
          <h2 className="text-base font-semibold text-foreground">Trabajos recientes</h2>
          <p className="mt-1 text-xs text-muted-foreground">Últimos 25 jobs del usuario autenticado.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Image ID</th>
                <th className="px-5 py-3 font-medium">Attempts</th>
                <th className="px-5 py-3 font-medium">Updated</th>
                <th className="px-5 py-3 font-medium">Completed</th>
                <th className="px-5 py-3 font-medium">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {metrics.recent_jobs.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">Todavía no hay trabajos de procesamiento.</td></tr>
              ) : metrics.recent_jobs.map((job) => (
                <tr key={job.id} className="hover:bg-secondary/20">
                  <td className="px-5 py-3">{statusBadge(job.status)}</td>
                  <td className="max-w-[220px] truncate px-5 py-3 font-mono text-xs text-foreground" title={job.image_id}>{job.image_id}</td>
                  <td className="px-5 py-3 text-muted-foreground">{job.attempts}/{job.max_attempts}</td>
                  <td className="px-5 py-3 text-muted-foreground">{formatDate(job.updated_at)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{formatDate(job.completed_at)}</td>
                  <td className="max-w-[300px] truncate px-5 py-3 text-xs text-red-300" title={job.last_error ?? ""}>{job.last_error ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
