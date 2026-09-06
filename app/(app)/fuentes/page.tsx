"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, CheckCircle2, ChevronDown, Database, Loader2, RefreshCw, ShieldCheck, Zap } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type SourceStatus = "operational" | "degraded" | "stale" | "initializing" | "on_demand" | "manual" | "credentials_required" | "inactive"

type Health = {
  generated_at: string
  grade: "A" | "B" | "C" | "pending"
  summary: { operational: number; attention: number; on_demand: number; manual_or_inactive: number }
  sources: Array<{
    key: string
    name: string
    authority: string | null
    freshness_policy: string | null
    active: boolean
    status: SourceStatus
    configured: boolean
    missing_credentials: string[]
    last_success_at: string | null
    last_attempt_at: string | null
    age_hours: number | null
    sla_hours: number | null
    consecutive_failures: number
    circuit_state: string | null
    last_error: string | null
    latest_run: null | {
      id: string
      status: string
      started_at: string
      finished_at: string | null
      fetched: number
      upserted: number
      changes: number
      rejected: number
      duration_ms: number | null
      validation_only: boolean
      pipeline: string | null
    }
  }>
  recent_runs: Array<{
    id: string
    source_key: string
    source_name: string
    status: string
    started_at: string
    finished_at: string | null
    fetched: number
    upserted: number
    changes: number
    rejected: number
    duration_ms: number | null
    validation_only: boolean
    pipeline: string | null
    retries: number
    failed_stage: string | null
    error_message: string | null
    reconciled: boolean | null
  }>
  quality: {
    run_id: string | null
    status: string | null
    context: string | null
    started_at: string | null
    finished_at: string | null
    checks: number
    warnings: number
    failures: number
    results: Array<{
      key: string
      category: string
      severity: string
      passed: boolean
      observed: string | null
      expected: string | null
      message: string
    }>
  }
  coverage: {
    baselines_initialized: number
    baselines_expected: number
    persisted_source_states: number
    observed_change_events: number
    strategic_changes: number
    company_identities: number
    company_aliases: number
    company_activity_12m: number
  }
}

const STATUS_LABEL: Record<SourceStatus, string> = {
  operational: "Activa",
  degraded: "Revisar",
  stale: "Desactualizada",
  initializing: "Preparándose",
  on_demand: "Disponible",
  manual: "Manual",
  credentials_required: "Falta configurar",
  inactive: "No disponible",
}

const STATUS_EXPLANATION: Record<SourceStatus, string> = {
  operational: "VIDENTIA la está usando y la información está al día.",
  degraded: "La fuente responde, pero necesita revisión técnica.",
  stale: "La última actualización superó el tiempo esperado.",
  initializing: "La fuente está conectada y aún está generando su primera evidencia de uso.",
  on_demand: "VIDENTIA la consulta cuando una búsqueda o vigilancia la necesita.",
  manual: "Se consulta manualmente cuando el caso lo requiere.",
  credentials_required: "El conector existe, pero falta una credencial para poder usarlo.",
  inactive: "No se está utilizando actualmente.",
}

function isAttention(status: SourceStatus) {
  return ["degraded", "stale", "credentials_required"].includes(status)
}

export default function SourcesHealthPage() {
  const [health, setHealth] = useState<Health | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/intelligence/health", { cache: "no-store" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos cargar el estado de fuentes.")
      setHealth(payload as Health)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos cargar el estado de fuentes.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const sourceGroups = useMemo(() => {
    if (!health) return { ready: [], attention: [], other: [] } as const
    return {
      ready: health.sources.filter(source => ["operational", "on_demand", "initializing"].includes(source.status)),
      attention: health.sources.filter(source => isAttention(source.status)),
      other: health.sources.filter(source => ["manual", "inactive"].includes(source.status)),
    }
  }, [health])

  return <OperationalPage>
    <OperationalHeader
      eyebrow="VIDENTIA / Fuentes"
      title="Las fuentes que alimentan tu inteligencia."
      description={<>Aquí ves qué información puede usar VIDENTIA, qué está funcionando y qué requiere atención. El detalle técnico sigue disponible, pero no interfiere con la lectura principal.</>}
      meta={<><span>Fuentes oficiales</span><span>Estado simple</span><span>Trazabilidad</span></>}
      actions={<Button variant="outline" onClick={() => void load()} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Actualizar</Button>}
    />

    {error ? <div role="alert" className="mt-6 rounded-[10px] bg-[#3A2525] p-4 text-sm text-[#E8AAA3]">{error}</div> : null}

    {health ? <>
      <OperationalMetricRail>
        <OperationalMetric value={health.sources.length} label="Fuentes disponibles" detail="Red total conectada a VIDENTIA" tone="neutral" />
        <OperationalMetric value={sourceGroups.ready.length} label="Listas para usar" detail="Activas, bajo demanda o inicializando" tone="success" />
        <OperationalMetric value={sourceGroups.attention.length} label="Necesitan atención" detail={sourceGroups.attention.length ? "Configuración o actualización pendiente" : "Sin bloqueos relevantes"} tone={sourceGroups.attention.length ? "warning" : "success"} />
        <OperationalMetric value={health.grade} label="Confianza de datos" detail={health.grade === "A" ? "Controles principales aprobados" : `${health.quality.failures} críticos · ${health.quality.warnings} avisos`} tone={health.grade === "A" ? "success" : health.grade === "C" ? "danger" : "warning"} />
      </OperationalMetricRail>

      {sourceGroups.attention.length ? <section className="border-b border-border/80 py-9">
        <OperationalSectionHeader eyebrow="01 / Atención" title="Lo único que requiere tu atención" meta={`${sourceGroups.attention.length} fuente${sourceGroups.attention.length === 1 ? "" : "s"}`} />
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {sourceGroups.attention.map(source => <SourceCard key={source.key} source={source} attention />)}
        </div>
      </section> : null}

      <section className="border-b border-border/80 py-9">
        <OperationalSectionHeader eyebrow={sourceGroups.attention.length ? "02 / Disponibles" : "01 / Disponibles"} title="Fuentes listas para trabajar" meta={`Actualizado ${formatDateTime(health.generated_at)}`} />
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">No necesitas conocer cómo se ejecuta cada conector. Si aparece aquí, VIDENTIA puede usar esa fuente cuando corresponde.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sourceGroups.ready.map(source => <SourceCard key={source.key} source={source} />)}
        </div>
      </section>

      {sourceGroups.other.length ? <section className="border-b border-border/80 py-9">
        <OperationalSectionHeader eyebrow={sourceGroups.attention.length ? "03 / Otras" : "02 / Otras"} title="Fuentes complementarias" />
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Estas fuentes no forman parte del flujo automático principal. Se mantienen sólo cuando tienen una utilidad concreta.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sourceGroups.other.map(source => <SourceCard key={source.key} source={source} />)}
        </div>
      </section> : null}

      <section className="border-b border-border/80 py-9">
        <OperationalSectionHeader eyebrow="04 / Cobertura" title="Qué puede sostener hoy VIDENTIA" />
        <div className="mt-6 grid gap-px bg-border/70 sm:grid-cols-2 xl:grid-cols-4">
          <Coverage icon={Database} value={health.coverage.company_identities.toLocaleString("es-CL")} label="Empresas identificadas" detail={`${health.coverage.company_aliases.toLocaleString("es-CL")} alias asociados`} />
          <Coverage icon={Zap} value={health.coverage.company_activity_12m.toLocaleString("es-CL")} label="Actividad reciente" detail="Expedientes vinculados en 12 meses" />
          <Coverage icon={ShieldCheck} value={health.coverage.observed_change_events.toLocaleString("es-CL")} label="Cambios detectados" detail="Cambios observados por VIDENTIA" />
          <Coverage icon={AlertTriangle} value={health.coverage.strategic_changes.toLocaleString("es-CL")} label="Señales estratégicas" detail="Patrones con evidencia suficiente" />
        </div>
      </section>

      <details className="group py-9">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 border-y border-border/80 py-5 text-sm font-medium text-white">
          <span>Ver detalle técnico y bitácora</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="pt-7">
          <OperationalSectionHeader eyebrow="Detalle técnico" title="Validaciones, corridas y controles" meta={`${health.recent_runs.length} corridas recientes`} />
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Esta sección está pensada para administración y soporte. No es necesaria para interpretar el estado general de VIDENTIA.</p>

          <div className="mt-6 divide-y divide-border/80 border-y border-border/80">
            {health.recent_runs.map(run => <article key={run.id} className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1fr)_180px_180px] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-white">{run.source_name}</p><RunStatus status={run.status} /></div>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(run.started_at)} · {run.pipeline ?? run.source_key}</p>
                {run.error_message ? <p className="mt-2 text-xs text-[#E8AAA3]">{run.error_message}</p> : null}
              </div>
              <div><p className="text-[10px] uppercase tracking-[0.13em] text-muted-foreground">Actividad</p><p className="mt-1 text-sm text-[#D5E0E3]">{run.validation_only ? "Validación" : `${run.fetched.toLocaleString("es-CL")} leídos`}</p></div>
              <div><p className="text-[10px] uppercase tracking-[0.13em] text-muted-foreground">Resultado</p><p className="mt-1 text-sm text-[#D5E0E3]">{run.validation_only ? "Fuente verificada" : `${run.changes.toLocaleString("es-CL")} cambios`}</p></div>
            </article>)}
            {!health.recent_runs.length ? <p className="py-6 text-sm text-muted-foreground">Aún no hay corridas registradas.</p> : null}
          </div>

          {health.quality.results.length ? <div className="mt-8">
            <p className="text-sm font-medium text-white">Controles de calidad</p>
            <div className="mt-3 divide-y divide-border/80 border-y border-border/80">
              {health.quality.results.map(item => <div key={item.key} className="grid gap-3 py-4 sm:grid-cols-[28px_minmax(0,1fr)_auto] sm:items-start">
                {item.passed ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#96B5A6]" /> : <AlertTriangle className="mt-0.5 h-4 w-4 text-[#C9A56A]" />}
                <div><p className="text-sm font-medium text-white">{item.message}</p><p className="mt-1 text-xs text-muted-foreground">{item.category}</p></div>
                <Badge variant="outline">{item.passed ? "OK" : item.severity.toUpperCase()}</Badge>
              </div>)}
            </div>
          </div> : null}
        </div>
      </details>
    </> : loading ? <div className="flex items-center gap-3 py-16 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Cargando fuentes…</div> : null}
  </OperationalPage>
}

function SourceCard({ source, attention = false }: { source: Health["sources"][number]; attention?: boolean }) {
  return <article className={attention ? "border border-[#8D7042]/70 bg-[#2C291F]/40 p-5" : "border border-border/80 bg-background p-5"}>
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{source.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">{source.authority ?? source.key}</p>
      </div>
      <StatusBadge status={source.status} />
    </div>
    <p className="mt-4 text-sm leading-6 text-[#D5E0E3]">{STATUS_EXPLANATION[source.status]}</p>
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
      {source.last_success_at ? <span>Última actualización: {formatRelative(source.age_hours)}</span> : source.status === "on_demand" ? <span>Se consulta cuando se necesita</span> : <span>Aún sin primera ejecución</span>}
      {source.latest_run && !source.latest_run.validation_only ? <span>{source.latest_run.fetched.toLocaleString("es-CL")} registros revisados</span> : null}
    </div>
    {source.missing_credentials.length ? <p className="mt-4 text-xs text-[#D8C49C]">Configuración pendiente: {humanizeCredential(source.missing_credentials[0])}</p> : null}
    {source.last_error ? <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#E8AAA3]">{source.last_error}</p> : null}
  </article>
}

function StatusBadge({ status }: { status: SourceStatus }) {
  const warning = isAttention(status)
  return <Badge variant="outline" className={warning ? "border-[#8D7042] bg-[#2C291F] text-[#D8C49C]" : status === "operational" ? "border-[#345E55] bg-[#173B37] text-[#B7D3D1]" : "bg-[#13272D] text-muted-foreground"}>{STATUS_LABEL[status]}</Badge>
}

function RunStatus({ status }: { status: string }) {
  const good = status === "completed"
  const warning = status === "partial" || status === "running" || status === "queued"
  return <Badge variant="outline" className={good ? "border-[#345E55] bg-[#173B37] text-[#B7D3D1]" : warning ? "border-[#8D7042] bg-[#2C291F] text-[#D8C49C]" : "border-[#75423F] bg-[#3A2525] text-[#E8AAA3]"}>{good ? "OK" : warning ? "EN CURSO" : "ERROR"}</Badge>
}

function Coverage({ icon: Icon, value, label, detail }: { icon: typeof Database; value: string; label: string; detail: string }) {
  return <div className="bg-background p-5"><Icon className="h-4 w-4 text-[#96B5A6]" /><p className="mt-4 text-2xl font-light text-[#E7DFCE]">{value}</p><p className="mt-1 text-sm font-medium text-white">{label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div>
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Santiago" }).format(date)
}

function formatRelative(ageHours: number | null) {
  if (ageHours === null) return "reciente"
  if (ageHours < 1) return "hace menos de 1 hora"
  if (ageHours < 48) return `hace ${Math.round(ageHours)} h`
  return `hace ${Math.round(ageHours / 24)} días`
}

function humanizeCredential(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase())
}
