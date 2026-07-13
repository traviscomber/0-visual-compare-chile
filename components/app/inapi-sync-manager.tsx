"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Database, Play, RefreshCcw, SearchCode, TimerReset } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type SearchType = "nombre" | "solicitante" | "clase" | "solicitud" | "registro"
type MatchMode = "1" | "2" | "3" | "4"
type Preset = "custom" | "alphabet" | "niza-core" | "top-brands" | "phase1-10k"

interface SyncRun {
  id: string
  status: string
  search_type: string
  query: string
  total_fetched: number
  inserted_count: number
  updated_count: number
  metadata?: Record<string, unknown> | null
  error_message?: string | null
  created_at: string
  finished_at?: string | null
}

interface SyncStatsPayload {
  totalRecords: number
  targetRecords: number
  completedRuns: number
  failedRuns: number
  nizaAssignments: number
  vienaAssignments: number
  lastCompletedRun: {
    id: string
    created_at: string
    finished_at?: string | null
    total_fetched: number
    inserted_count: number
    updated_count: number
    metadata?: Record<string, unknown> | null
  } | null
  phase1Plan?: {
    totalJobs: number
    coveredJobs: number
    remainingJobs: number
    progressPct: number
    nextWindow: {
      startIndex: number
      maxJobs: number
    } | null
  } | null
}

export function InapiSyncManager() {
  const [preset, setPreset] = useState<Preset>("custom")
  const [query, setQuery] = useState("VISUAL")
  const [queriesText, setQueriesText] = useState("VISUAL\nCOMPARE\nLOGO")
  const [searchType, setSearchType] = useState<SearchType>("nombre")
  const [matchMode, setMatchMode] = useState<MatchMode>("2")
  const [delayMs, setDelayMs] = useState("400")
  const [startIndex, setStartIndex] = useState("0")
  const [maxJobs, setMaxJobs] = useState("25")
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [runs, setRuns] = useState<SyncRun[]>([])
  const [stats, setStats] = useState<SyncStatsPayload | null>(null)

  const customQueries = useMemo(
    () =>
      queriesText
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean),
    [queriesText],
  )
  const progressPct = useMemo(() => {
    if (!stats?.targetRecords) return 0
    return Math.min(100, Math.round((stats.totalRecords / stats.targetRecords) * 10000) / 100)
  }, [stats])

  const loadRuns = useCallback(async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/admin/inapi-sync")
      if (response.status === 401) {
        window.location.href = "/auth/login?redirectTo=/settings"
        return
      }

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || "No fue posible cargar el estado del scraper")
      }

      setRuns(Array.isArray(payload.runs) ? payload.runs : [])
      setStats(payload.stats ?? null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error cargando estado del scraper")
    } finally {
      setLoading(false)
    }
  }, [])

  const applySuggestedPhase1Window = () => {
    const suggestion = stats?.phase1Plan?.nextWindow
    if (!suggestion) {
      toast.message("No hay una ventana pendiente sugerida para phase1-10k")
      return
    }

    setPreset("phase1-10k")
    setStartIndex(String(suggestion.startIndex))
    setMaxJobs(String(suggestion.maxJobs))
    setDelayMs("400")
    setSearchType("nombre")
    setMatchMode("2")
  }

  useEffect(() => {
    void loadRuns()
  }, [loadRuns])

  const handleRun = async () => {
    const delay = Number(delayMs)
    const parsedStartIndex = Number(startIndex)
    const parsedMaxJobs = Number(maxJobs)
    const body =
      preset === "custom"
        ? customQueries.length > 1
          ? {
              queries: customQueries,
              searchType,
              matchMode,
              delayMs: Number.isFinite(delay) ? delay : 400,
              startIndex: Number.isFinite(parsedStartIndex) ? parsedStartIndex : 0,
              maxJobs: Number.isFinite(parsedMaxJobs) ? parsedMaxJobs : undefined,
            }
          : { query: query.trim(), searchType, matchMode }
        : {
            preset,
            searchType,
            matchMode,
            delayMs: Number.isFinite(delay) ? delay : 400,
            startIndex: Number.isFinite(parsedStartIndex) ? parsedStartIndex : 0,
            maxJobs: Number.isFinite(parsedMaxJobs) ? parsedMaxJobs : undefined,
          }

    if (preset === "custom" && !query.trim() && customQueries.length === 0) {
      toast.error("Debes indicar un query o una lista de queries")
      return
    }

    setRunning(true)

    try {
      const response = await fetch("/api/admin/inapi-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.status === 401) {
        window.location.href = "/auth/login?redirectTo=/settings"
        return
      }

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || "No fue posible ejecutar el scraper")
      }

      toast.success("Sincronizacion INAPI iniciada")
      await loadRuns()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error ejecutando scraper")
    } finally {
      setRunning(false)
    }
  }

  return (
    <Card className="border-slate-200/10 bg-white/5 text-white backdrop-blur-xl">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <SearchCode className="h-5 w-5 text-cyan-300" />
          <CardTitle className="text-xl">Scraper INAPI</CardTitle>
        </div>
        <CardDescription className="text-slate-300">
          Ejecuta sincronizaciones manuales de marcas reales y monitorea el estado del indexador.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            icon={Database}
            label="Registros indexados"
            value={String(stats?.totalRecords ?? 0)}
            help={stats ? `${progressPct}% de ${stats.targetRecords}` : undefined}
            accent="text-cyan-300"
          />
          <MetricCard
            icon={Play}
            label="Corridas completadas"
            value={String(stats?.completedRuns ?? 0)}
            help={stats?.lastCompletedRun ? `ultima: ${stats.lastCompletedRun.total_fetched} fetched` : undefined}
            accent="text-emerald-300"
          />
          <MetricCard
            icon={TimerReset}
            label="Cobertura taxonomica"
            value={`${String(stats?.nizaAssignments ?? 0)} / ${String(stats?.vienaAssignments ?? 0)}`}
            help={`Niza / Viena · fallidas: ${String(stats?.failedRuns ?? 0)}`}
            accent="text-amber-300"
          />
        </div>

        {stats?.phase1Plan ? (
          <div className="rounded-2xl border border-cyan-400/15 bg-cyan-500/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Campaign phase1-10k</p>
                <p className="text-sm text-slate-300">
                  Cobertura de jobs: {stats.phase1Plan.coveredJobs}/{stats.phase1Plan.totalJobs} ·{" "}
                  {stats.phase1Plan.progressPct}% completado
                </p>
                <p className="text-sm text-slate-400">
                  Jobs pendientes: {stats.phase1Plan.remainingJobs}
                  {stats.phase1Plan.nextWindow
                    ? ` · siguiente ventana sugerida: start ${stats.phase1Plan.nextWindow.startIndex} / max ${stats.phase1Plan.nextWindow.maxJobs}`
                    : " · no quedan ventanas pendientes"}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="border-cyan-400/20 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20"
                onClick={applySuggestedPhase1Window}
                disabled={!stats.phase1Plan.nextWindow}
              >
                Aplicar ventana sugerida
              </Button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <Select value={preset} onValueChange={(value) => setPreset(value as Preset)}>
            <SelectTrigger className="w-full border-white/10 bg-slate-950/60 text-white">
              <SelectValue placeholder="Preset" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Custom</SelectItem>
              <SelectItem value="alphabet">Alphabet A-Z</SelectItem>
              <SelectItem value="niza-core">Niza 01-45</SelectItem>
              <SelectItem value="top-brands">Top brand seeds</SelectItem>
              <SelectItem value="phase1-10k">Phase1 10K ramp</SelectItem>
            </SelectContent>
          </Select>

          <Select value={searchType} onValueChange={(value) => setSearchType(value as SearchType)}>
            <SelectTrigger className="w-full border-white/10 bg-slate-950/60 text-white">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nombre">Nombre</SelectItem>
              <SelectItem value="solicitante">Solicitante</SelectItem>
              <SelectItem value="clase">Clase</SelectItem>
              <SelectItem value="solicitud">Solicitud</SelectItem>
              <SelectItem value="registro">Registro</SelectItem>
            </SelectContent>
          </Select>

          <Select value={matchMode} onValueChange={(value) => setMatchMode(value as MatchMode)}>
            <SelectTrigger className="w-full border-white/10 bg-slate-950/60 text-white">
              <SelectValue placeholder="Match" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Exacta</SelectItem>
              <SelectItem value="2">Contenga</SelectItem>
              <SelectItem value="3">Empieza</SelectItem>
              <SelectItem value="4">Termina</SelectItem>
            </SelectContent>
          </Select>

          <Input
            value={delayMs}
            onChange={(event) => setDelayMs(event.target.value)}
            placeholder="Delay ms"
            className="border-white/10 bg-slate-950/60 text-white placeholder:text-slate-500"
          />
          <Input
            value={startIndex}
            onChange={(event) => setStartIndex(event.target.value)}
            placeholder="Start index"
            className="border-white/10 bg-slate-950/60 text-white placeholder:text-slate-500"
          />
          <Input
            value={maxJobs}
            onChange={(event) => setMaxJobs(event.target.value)}
            placeholder="Max jobs"
            className="border-white/10 bg-slate-950/60 text-white placeholder:text-slate-500"
          />
        </div>

        {preset === "custom" ? (
          <div className="grid gap-3 xl:grid-cols-[1fr_1.4fr_auto]">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Query unica"
              className="border-white/10 bg-slate-950/60 text-white placeholder:text-slate-500"
            />
            <Textarea
              value={queriesText}
              onChange={(event) => setQueriesText(event.target.value)}
              placeholder={"Una query por linea para batch manual"}
              className="min-h-24 border-white/10 bg-slate-950/60 text-white placeholder:text-slate-500"
            />
            <div className="flex items-start justify-end">
              <Button
                type="button"
                onClick={handleRun}
                disabled={running}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-500 text-white hover:from-cyan-500 hover:to-blue-400 xl:w-auto"
              >
                <Play className="mr-2 h-4 w-4" />
                {running ? "Corriendo" : customQueries.length > 1 ? "Correr batch" : "Correr"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-white">Preset activo: {preset}</p>
              <p className="text-sm text-slate-400">
                Ejecuta una corrida secuencial con delay configurable para no golpear INAPI de forma agresiva.
                {preset === "phase1-10k" ? " Este preset mezcla Niza 01-45, alfabeto y semillas nominales para empujar volumen real." : ""}
              </p>
              <p className="text-xs text-slate-500">
                Usa `start index` y `max jobs` para correr ventanas del preset y retomar sin repetir todo el batch.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleRun}
              disabled={running}
              className="bg-gradient-to-r from-cyan-600 to-blue-500 text-white hover:from-cyan-500 hover:to-blue-400"
            >
              <Play className="mr-2 h-4 w-4" />
              {running ? "Corriendo" : "Correr preset"}
            </Button>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Corridas recientes</h3>
            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
              onClick={() => void loadRuns()}
              disabled={loading}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {loading ? "Actualizando" : "Actualizar"}
            </Button>
          </div>

          {runs.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 text-sm text-slate-300">
              No hay corridas registradas.
            </div>
          ) : (
            <div className="space-y-3">
              {runs.map((run) => (
                <div
                  key={run.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-white">{run.query}</p>
                    <Badge className={getStatusClassName(run.status)}>{run.status}</Badge>
                    <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                      {run.search_type}
                    </Badge>
                    {run.metadata && typeof run.metadata.position === "number" && (
                      <Badge variant="outline" className="border-cyan-400/20 bg-cyan-500/10 text-cyan-100">
                        Batch {String(run.metadata.position)}/{String(run.metadata.total_jobs ?? "?")}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 grid gap-2 text-sm text-slate-400 md:grid-cols-4">
                    <p>Fetched: {run.total_fetched}</p>
                    <p>Insertados: {run.inserted_count}</p>
                    <p>Actualizados: {run.updated_count}</p>
                    <p>Creado: {new Date(run.created_at).toLocaleString("es-CL")}</p>
                  </div>
                  {run.error_message && <p className="mt-3 text-sm text-rose-300">{run.error_message}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  help,
  accent,
}: {
  icon: typeof Database
  label: string
  value: string
  help?: string
  accent: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-300">{label}</p>
          <p className="mt-1 text-2xl font-bold text-white">{value}</p>
          {help && <p className="mt-1 text-xs text-slate-500">{help}</p>}
        </div>
        <div className={`rounded-full border border-white/10 bg-white/5 p-3 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function getStatusClassName(status: string) {
  if (status === "completed") return "bg-emerald-500/20 text-emerald-100"
  if (status === "running") return "bg-amber-500/20 text-amber-100"
  if (status === "failed") return "bg-rose-500/20 text-rose-100"
  return "bg-slate-500/20 text-slate-200"
}
