"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CheckCircle2, Database, Play, RefreshCcw, SearchCode, TimerReset } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

const fieldClassName =
  "h-10 border-[#294047] bg-[#0D222A] text-white placeholder:text-[#71807F] focus-visible:border-[#4A7F74] focus-visible:ring-[#4A7F74]/30"

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
    <Card className="overflow-hidden border-[#294047] bg-[#10262D] text-white shadow-none">
      <CardHeader className="border-b border-[#294047] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[#96B5A6]">
              <SearchCode className="h-4 w-4" strokeWidth={1.6} />
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em]">Sincronización administrativa</p>
            </div>
            <CardTitle className="mt-2 text-xl font-normal tracking-[-0.02em] text-[#E7DFCE]">Scraper INAPI</CardTitle>
            <CardDescription className="mt-2 max-w-xl text-sm leading-6 text-[#AEB6B4]">
              Ejecuta sincronizaciones manuales de marcas reales y monitorea el estado del indexador. Estos controles
              disparan trabajo operativo contra INAPI.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void loadRuns()}
            disabled={loading}
            className="h-9 shrink-0 bg-[#172F34] text-white hover:bg-[#20393A]"
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin motion-reduce:animate-none" : ""}`} />
            {loading ? "Actualizando" : "Actualizar estado"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-0 p-0">
        <section className="grid border-b border-[#294047] sm:grid-cols-3" aria-label="Métricas de sincronización">
          <Metric
            icon={Database}
            label="Registros indexados"
            value={String(stats?.totalRecords ?? 0)}
            detail={stats ? `${progressPct}% de ${stats.targetRecords}` : "Esperando lectura"}
          />
          <Metric
            icon={Play}
            label="Corridas completadas"
            value={String(stats?.completedRuns ?? 0)}
            detail={stats?.lastCompletedRun ? `Última: ${stats.lastCompletedRun.total_fetched} registros obtenidos` : "Sin corrida completada"}
          />
          <Metric
            icon={TimerReset}
            label="Cobertura taxonómica"
            value={`${String(stats?.nizaAssignments ?? 0)} / ${String(stats?.vienaAssignments ?? 0)}`}
            detail={`Niza / Viena · fallidas: ${String(stats?.failedRuns ?? 0)}`}
          />
        </section>

        {stats?.phase1Plan ? (
          <section className="border-b border-[#294047] px-5 py-5 sm:px-6" aria-labelledby="phase1-plan-title">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#96B5A6]">Campaña Phase1-10K</p>
                <h3 id="phase1-plan-title" className="mt-2 text-base font-medium text-white">
                  {stats.phase1Plan.coveredJobs}/{stats.phase1Plan.totalJobs} jobs cubiertos · {stats.phase1Plan.progressPct}%
                </h3>
                <p className="mt-1 text-sm leading-6 text-[#AEB6B4]">
                  Quedan {stats.phase1Plan.remainingJobs} jobs
                  {stats.phase1Plan.nextWindow
                    ? ` · siguiente ventana sugerida: start ${stats.phase1Plan.nextWindow.startIndex} / max ${stats.phase1Plan.nextWindow.maxJobs}`
                    : " · no quedan ventanas pendientes"}
                </p>
              </div>
              {stats.phase1Plan.nextWindow ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0 bg-[#173B37] text-white hover:bg-[#20393A]"
                  onClick={applySuggestedPhase1Window}
                >
                  Aplicar ventana sugerida
                </Button>
              ) : (
                <div className="flex shrink-0 items-center gap-2 border border-[#36514F] bg-[#173B37] px-3 py-2 text-xs font-medium text-[#B7D3D1]">
                  <CheckCircle2 className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
                  Cobertura completa
                </div>
              )}
            </div>
          </section>
        ) : null}

        <section className="border-b border-[#294047] px-5 py-6 sm:px-6" aria-labelledby="sync-config-title">
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#96B5A6]">Configuración de corrida</p>
            <h3 id="sync-config-title" className="mt-2 text-lg font-normal text-[#E7DFCE]">Define alcance y ritmo antes de ejecutar</h3>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[#AEB6B4]">
              Preset, tipo de búsqueda, modo de coincidencia, delay y ventana se envían al mismo endpoint administrativo existente.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <Field label="Preset">
              <Select value={preset} onValueChange={(value) => setPreset(value as Preset)}>
                <SelectTrigger className={fieldClassName}>
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
            </Field>

            <Field label="Tipo de búsqueda">
              <Select value={searchType} onValueChange={(value) => setSearchType(value as SearchType)}>
                <SelectTrigger className={fieldClassName}>
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
            </Field>

            <Field label="Coincidencia">
              <Select value={matchMode} onValueChange={(value) => setMatchMode(value as MatchMode)}>
                <SelectTrigger className={fieldClassName}>
                  <SelectValue placeholder="Match" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Exacta</SelectItem>
                  <SelectItem value="2">Contenga</SelectItem>
                  <SelectItem value="3">Empieza</SelectItem>
                  <SelectItem value="4">Termina</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Delay (ms)">
              <Input value={delayMs} onChange={(event) => setDelayMs(event.target.value)} placeholder="400" className={fieldClassName} />
            </Field>
            <Field label="Start index">
              <Input value={startIndex} onChange={(event) => setStartIndex(event.target.value)} placeholder="0" className={fieldClassName} />
            </Field>
            <Field label="Máximo de jobs">
              <Input value={maxJobs} onChange={(event) => setMaxJobs(event.target.value)} placeholder="25" className={fieldClassName} />
            </Field>
          </div>

          <div className="mt-5 border-t border-[#294047] pt-5">
            {preset === "custom" ? (
              <div className="grid gap-4 xl:grid-cols-[0.85fr_1.35fr_auto] xl:items-end">
                <Field label="Query única">
                  <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="VISUAL" className={fieldClassName} />
                </Field>
                <Field label="Batch manual · una query por línea">
                  <Textarea
                    value={queriesText}
                    onChange={(event) => setQueriesText(event.target.value)}
                    placeholder="Una query por línea"
                    className="min-h-24 border-[#294047] bg-[#0D222A] text-white placeholder:text-[#71807F] focus-visible:border-[#4A7F74] focus-visible:ring-[#4A7F74]/30"
                  />
                </Field>
                <Button
                  type="button"
                  onClick={handleRun}
                  disabled={running}
                  className="h-10 w-full bg-[#4A7F74] px-5 text-white hover:bg-[#568D81] xl:w-auto"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {running ? "Corriendo" : customQueries.length > 1 ? "Correr batch" : "Correr"}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Preset activo: {preset}</p>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-[#AEB6B4]">
                    Ejecuta una corrida secuencial con delay configurable para no golpear INAPI de forma agresiva.
                    {preset === "phase1-10k"
                      ? " Este preset mezcla Niza 01-45, alfabeto y semillas nominales para empujar volumen real."
                      : ""}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#7F8C8A]">
                    Usa start index y max jobs para correr ventanas del preset y retomar sin repetir todo el batch.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleRun}
                  disabled={running}
                  className="shrink-0 bg-[#4A7F74] px-5 text-white hover:bg-[#568D81]"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {running ? "Corriendo" : "Correr preset"}
                </Button>
              </div>
            )}
          </div>
        </section>

        <section className="px-5 py-6 sm:px-6" aria-labelledby="sync-runs-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#96B5A6]">Registro operacional</p>
              <h3 id="sync-runs-title" className="mt-2 text-lg font-normal text-[#E7DFCE]">Corridas recientes</h3>
            </div>
            <span className="text-xs text-[#7F8C8A]">{runs.length} registrada{runs.length === 1 ? "" : "s"}</span>
          </div>

          {runs.length === 0 ? (
            <div className="mt-5 border-y border-dashed border-[#294047] py-8 text-sm text-[#AEB6B4]">No hay corridas registradas.</div>
          ) : (
            <div className="mt-5 divide-y divide-[#294047] border-y border-[#294047]">
              {runs.map((run) => (
                <div key={run.id} className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-white">{run.query}</p>
                      <Badge className={getStatusClassName(run.status)}>{run.status}</Badge>
                      <Badge variant="outline" className="border-[#294047] bg-[#13272D] text-[#BDBEBD]">
                        {run.search_type}
                      </Badge>
                      {run.metadata && typeof run.metadata.position === "number" ? (
                        <Badge variant="outline" className="border-[#36514F] bg-[#173B37] text-[#B7D3D1]">
                          Batch {String(run.metadata.position)}/{String(run.metadata.total_jobs ?? "?")}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-2 grid gap-1 text-xs text-[#8F9A98] sm:grid-cols-2 xl:grid-cols-4">
                      <p>Fetched: {run.total_fetched}</p>
                      <p>Insertados: {run.inserted_count}</p>
                      <p>Actualizados: {run.updated_count}</p>
                      <p>Creado: {new Date(run.created_at).toLocaleString("es-CL")}</p>
                    </div>
                    {run.error_message ? <p className="mt-2 text-xs leading-5 text-[#D58A80]">{run.error_message}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#8F9A98]">{label}</Label>
      {children}
    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Database
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="border-b border-[#294047] px-5 py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#8F9A98]">{label}</p>
        <Icon className="h-4 w-4 text-[#96B5A6]" strokeWidth={1.6} />
      </div>
      <p className="mt-3 text-2xl font-normal tracking-[-0.03em] text-[#E7DFCE]">{value}</p>
      <p className="mt-1 text-xs leading-5 text-[#8F9A98]">{detail}</p>
    </div>
  )
}

function getStatusClassName(status: string) {
  if (status === "completed") return "border border-[#36514F] bg-[#173B37] text-[#B7D3D1]"
  if (status === "running") return "border border-[#665A3D] bg-[#3A3423] text-[#E7DFCE]"
  if (status === "failed") return "border border-[#6A3D39] bg-[#3A2625] text-[#E5A79F]"
  return "border border-[#294047] bg-[#172F34] text-[#BDBEBD]"
}
