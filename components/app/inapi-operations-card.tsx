"use client"

import { useCallback, useEffect, useState } from "react"
import { Activity, AlertTriangle, CircuitBoard, Clock3, DatabaseZap, RefreshCcw, ServerCog } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface OperationsPayload {
  state: {
    remote_enabled: boolean
    daily_limit: number
    hourly_limit: number
    minute_limit: number
    min_interval_ms: number
    circuit_state: "closed" | "open" | "half_open"
    circuit_open_until: string | null
    consecutive_failures: number
    last_request_at: string | null
    last_success_at: string | null
    last_failure_at: string | null
    last_status: number | null
  }
  usage: {
    minute: number
    hour: number
    day: number
  }
  queue: {
    active: number
    queued: number
    running: number
  }
  cache: {
    activeEntries: number
  }
  health: {
    failures24h: number
    averageDurationMs: number | null
  }
  recent: Array<{
    id: number
    cache_key: string | null
    requested_at: string
    finished_at: string | null
    success: boolean | null
    status_code: number | null
    duration_ms: number | null
    error_code: string | null
  }>
  generatedAt: string
}

export function InapiOperationsCard() {
  const [data, setData] = useState<OperationsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/inapi-operations", { cache: "no-store" })
      if (response.status === 401) {
        window.location.href = "/auth/login?redirectTo=/settings"
        return
      }

      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "No fue posible cargar las métricas INAPI")
      setData(payload)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Error cargando métricas INAPI")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const state = data?.state
  const circuitTone =
    state?.circuit_state === "closed"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
      : state?.circuit_state === "half_open"
        ? "border-amber-400/20 bg-amber-500/10 text-amber-200"
        : "border-red-400/20 bg-red-500/10 text-red-200"

  return (
    <Card className="border-slate-200/10 bg-white/5 text-white backdrop-blur-xl">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ServerCog className="h-5 w-5 text-violet-300" />
              <CardTitle className="text-xl">Operación INAPI</CardTitle>
            </div>
            <CardDescription className="text-slate-300">
              Estado interno del rate control, caché, cola global y solicitudes externas.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
            className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Metric
            icon={Activity}
            label="Uso diario"
            value={data ? `${data.usage.day} / ${state?.daily_limit ?? 0}` : "—"}
            detail={data ? `${data.usage.hour}/${state?.hourly_limit} hora · ${data.usage.minute}/${state?.minute_limit} minuto` : undefined}
          />
          <Metric
            icon={DatabaseZap}
            label="Caché activa"
            value={data ? String(data.cache.activeEntries) : "—"}
            detail="Consultas reutilizables"
          />
          <Metric
            icon={CircuitBoard}
            label="Cola global"
            value={data ? String(data.queue.active) : "—"}
            detail={data ? `${data.queue.queued} en espera · ${data.queue.running} procesando` : undefined}
          />
          <Metric
            icon={Clock3}
            label="Latencia externa"
            value={data?.health.averageDurationMs != null ? `${data.health.averageDurationMs} ms` : "—"}
            detail={state ? `Intervalo mínimo ${state.min_interval_ms} ms` : undefined}
          />
          <Metric
            icon={AlertTriangle}
            label="Fallas 24 h"
            value={data ? String(data.health.failures24h) : "—"}
            detail={state ? `${state.consecutive_failures} consecutivas` : undefined}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <Badge variant="outline" className={circuitTone}>
            Circuito: {state?.circuit_state ?? "cargando"}
          </Badge>
          <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
            Remoto: {state?.remote_enabled ? "habilitado" : "deshabilitado"}
          </Badge>
          <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
            Último HTTP: {state?.last_status ?? "—"}
          </Badge>
          {state?.circuit_open_until ? (
            <span className="text-xs text-red-200">Bloqueado hasta {formatDate(state.circuit_open_until)}</span>
          ) : null}
          <span className="ml-auto text-xs text-slate-500">
            {data ? `Actualizado ${formatDate(data.generatedAt)}` : "Cargando"}
          </span>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Solicitudes remotas recientes</h3>
            <span className="text-xs text-slate-500">Solo llamadas reales a INAPI</span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-wider text-slate-500">
              <span>Consulta</span>
              <span>Estado</span>
              <span>Duración</span>
            </div>
            {data?.recent.length ? (
              data.recent.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-white/5 px-4 py-3 text-sm last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-slate-200">{humanizeKey(item.cache_key)}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{formatDate(item.requested_at)}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      item.success === true
                        ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                        : item.success === false
                          ? "border-red-400/20 bg-red-500/10 text-red-200"
                          : "border-amber-400/20 bg-amber-500/10 text-amber-200"
                    }
                  >
                    {item.status_code ?? (item.success == null ? "en curso" : "error")}
                  </Badge>
                  <span className="text-right tabular-nums text-slate-400">
                    {item.duration_ms != null ? `${item.duration_ms} ms` : "—"}
                  </span>
                </div>
              ))
            ) : (
              <p className="px-4 py-6 text-sm text-slate-500">No hay solicitudes remotas registradas.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Activity
  label: string
  value: string
  detail?: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <Icon className="h-4 w-4 text-violet-300" />
        <span className="text-xs uppercase tracking-wider text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-semibold tabular-nums text-white">{value}</p>
      {detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value))
}

function humanizeKey(value: string | null) {
  if (!value) return "Consulta sin clave"
  const [, matchMode, ...queryParts] = value.split(":")
  return `${queryParts.join(":")} · match ${matchMode ?? "—"}`
}
