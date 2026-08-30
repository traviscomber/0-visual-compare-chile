"use client"

import { useCallback, useEffect, useState } from "react"
import { Activity, AlertTriangle, CircuitBoard, Clock3, DatabaseZap, RefreshCcw, ServerCog } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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
  const circuitClass =
    state?.circuit_state === "closed"
      ? "bg-[#173B37] text-[#96B5A6]"
      : state?.circuit_state === "half_open"
        ? "bg-[#332C24] text-[#D6A46F]"
        : "bg-[#3A2525] text-[#E8AAA3]"

  return (
    <section className="rounded-[10px] bg-[#13272D] p-4 sm:p-6" aria-labelledby="inapi-operations-title">
      <div className="flex flex-col gap-4 border-b border-border/80 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#96B5A6]">
            <ServerCog className="h-4 w-4" />
            <p className="text-[10px] font-medium uppercase tracking-[0.16em]">Telemetría administrativa</p>
          </div>
          <h3 id="inapi-operations-title" className="mt-2 text-xl font-light tracking-[-0.025em] text-[#E7DFCE]">
            Estado operativo INAPI
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Rate control, caché, cola global y solicitudes externas observadas por la plataforma.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin motion-reduce:animate-none" : ""}`} />
          {loading ? "Actualizando" : "Actualizar"}
        </Button>
      </div>

      {error ? (
        <div className="mt-5 flex items-start gap-3 rounded-[10px] bg-[#3A2525] p-4 text-sm text-[#E8AAA3]" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <div className="mt-5 grid gap-px overflow-hidden rounded-[10px] bg-border/70 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          icon={Activity}
          label="Uso diario"
          value={data ? `${data.usage.day} / ${state?.daily_limit ?? 0}` : "—"}
          detail={data ? `${data.usage.hour}/${state?.hourly_limit} hora · ${data.usage.minute}/${state?.minute_limit} minuto` : undefined}
        />
        <Metric icon={DatabaseZap} label="Caché activa" value={data ? String(data.cache.activeEntries) : "—"} detail="Consultas reutilizables" />
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

      <div className="mt-5 flex flex-wrap items-center gap-2 border-y border-border/80 py-3">
        <Badge className={circuitClass}>Circuito: {state?.circuit_state ?? "cargando"}</Badge>
        <Badge className={state?.remote_enabled ? "bg-[#173B37] text-[#96B5A6]" : "bg-[#26363A] text-[#BDBEBD]"}>
          Remoto: {state?.remote_enabled ? "habilitado" : "deshabilitado"}
        </Badge>
        <Badge className="bg-[#26363A] text-[#BDBEBD]">Último HTTP: {state?.last_status ?? "—"}</Badge>
        {state?.circuit_open_until ? (
          <span className="text-xs text-[#E8AAA3]">Bloqueado hasta {formatDate(state.circuit_open_until)}</span>
        ) : null}
        <span className="sm:ml-auto text-xs text-muted-foreground">
          {data ? `Actualizado ${formatDate(data.generatedAt)}` : "Cargando"}
        </span>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">Solicitudes remotas</p>
            <h4 className="mt-1 text-lg font-light text-[#E7DFCE]">Actividad reciente</h4>
          </div>
          <span className="text-xs text-muted-foreground">Sólo llamadas reales a INAPI</span>
        </div>

        <div className="overflow-x-auto border-y border-border/80">
          <div className="min-w-[620px]">
            <div className="grid grid-cols-[minmax(0,1fr)_110px_100px] gap-3 bg-[#0F2A33] px-4 py-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <span>Consulta</span>
              <span>Estado</span>
              <span className="text-right">Duración</span>
            </div>
            {data?.recent.length ? (
              data.recent.map((item) => (
                <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_110px_100px] gap-3 border-t border-border/70 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-white">{humanizeKey(item.cache_key)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(item.requested_at)}</p>
                  </div>
                  <Badge className={requestStateClass(item.success)}>
                    {item.status_code ?? (item.success == null ? "en curso" : "error")}
                  </Badge>
                  <span className="text-right tabular-nums text-muted-foreground">
                    {item.duration_ms != null ? `${item.duration_ms} ms` : "—"}
                  </span>
                </div>
              ))
            ) : (
              <p className="border-t border-border/70 px-4 py-6 text-sm text-muted-foreground">No hay solicitudes remotas registradas.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Activity; label: string; value: string; detail?: string }) {
  return (
    <div className="min-h-[128px] bg-[#0F2A33] p-4">
      <div className="flex items-center justify-between gap-3">
        <Icon className="h-4 w-4 text-[#96B5A6]" />
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-light tabular-nums tracking-[-0.03em] text-[#E7DFCE]">{value}</p>
      {detail ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p> : null}
    </div>
  )
}

function requestStateClass(success: boolean | null) {
  if (success === true) return "bg-[#173B37] text-[#96B5A6]"
  if (success === false) return "bg-[#3A2525] text-[#E8AAA3]"
  return "bg-[#332C24] text-[#D6A46F]"
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value))
}

function humanizeKey(value: string | null) {
  if (!value) return "Consulta sin clave"
  const [, matchMode, ...queryParts] = value.split(":")
  return `${queryParts.join(":")} · match ${matchMode ?? "—"}`
}
