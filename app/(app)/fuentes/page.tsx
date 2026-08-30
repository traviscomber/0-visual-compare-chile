"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertTriangle, CheckCircle2, Clock3, Database, Loader2, RefreshCw, ShieldCheck } from "lucide-react"
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
    }
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
  operational: "Operativa",
  degraded: "Degradada",
  stale: "Fuera de SLA",
  initializing: "Sin telemetría",
  on_demand: "Bajo demanda",
  manual: "Manual",
  credentials_required: "Requiere credenciales",
  inactive: "Inactiva",
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

  return <OperationalPage>
    <OperationalHeader
      eyebrow="VIDENTIA / Confianza operativa"
      title="Saber qué fuente está fresca antes de decidir."
      description={<>Estado real de ingestión, cobertura y controles de calidad. La antigüedad jurídica de un expediente se mantiene separada de la fecha en que VIDENTIA observó o sincronizó la fuente.</>}
      meta={<><span>Freshness SLA</span><span>Data quality</span><span>Trazabilidad</span><span>Circuit state</span></>}
      actions={<Button variant="outline" onClick={() => void load()} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Actualizar</Button>}
    />

    {error ? <div role="alert" className="mt-6 rounded-[10px] bg-[#3A2525] p-4 text-sm text-[#E8AAA3]">{error}</div> : null}

    {health ? <>
      <OperationalMetricRail>
        <OperationalMetric value={health.grade} label="Grade de datos" detail={`${health.quality.checks} checks · ${health.quality.failures} críticos · ${health.quality.warnings} warnings`} tone={health.grade === "A" ? "success" : health.grade === "C" ? "danger" : "warning"} />
        <OperationalMetric value={health.summary.operational} label="Fuentes operativas" detail={`${health.sources.length} fuentes registradas`} tone="success" />
        <OperationalMetric value={health.summary.attention} label="Requieren atención" detail="Stale, degradadas, sin telemetría o credenciales" tone={health.summary.attention ? "warning" : "neutral"} />
        <OperationalMetric value={`${health.coverage.baselines_initialized}/${health.coverage.baselines_expected}`} label="Baselines de cambio" detail={`${health.coverage.observed_change_events} cambios observados · ${health.coverage.strategic_changes} patrones`} tone={health.coverage.baselines_initialized === health.coverage.baselines_expected ? "success" : "warning"} />
      </OperationalMetricRail>

      <section className="border-b border-border/80 py-9">
        <OperationalSectionHeader eyebrow="01 / Fuentes" title="Salud, SLA y última observación" meta={`Actualizado ${formatDateTime(health.generated_at)}`} />
        <div className="mt-6 divide-y divide-border/80 border-y border-border/80">
          {health.sources.map(source => <article key={source.key} className="grid gap-4 py-5 lg:grid-cols-[minmax(0,1.2fr)_180px_190px_minmax(0,.8fr)] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-white">{source.name}</p>
                <StatusBadge status={source.status} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{source.authority ?? source.key} · {source.freshness_policy ?? "sin política"}</p>
              {source.last_error ? <p className="mt-2 max-w-2xl text-xs leading-5 text-[#E8AAA3]">{source.last_error}</p> : null}
              {source.missing_credentials.length ? <p className="mt-2 text-xs text-[#D8C49C]">Faltan: {source.missing_credentials.join(", ")}</p> : null}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.13em] text-muted-foreground">Último éxito</p>
              <p className="mt-1 text-sm text-[#D5E0E3]">{source.last_success_at ? formatDateTime(source.last_success_at) : "Sin evidencia"}</p>
              {source.age_hours !== null ? <p className="mt-1 text-xs text-muted-foreground">hace {formatHours(source.age_hours)}</p> : null}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.13em] text-muted-foreground">SLA / circuito</p>
              <p className="mt-1 text-sm text-[#D5E0E3]">{source.sla_hours ? `${formatHours(source.sla_hours)} máx.` : "No programada"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{source.circuit_state ?? "sin circuito"} · {source.consecutive_failures} fallas consecutivas</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.13em] text-muted-foreground">Última corrida observada</p>
              {source.latest_run ? <p className="mt-1 text-sm text-[#D5E0E3]">{source.latest_run.fetched.toLocaleString("es-CL")} leídos · {source.latest_run.upserted.toLocaleString("es-CL")} upserts</p> : <p className="mt-1 text-sm text-muted-foreground">Aún sin telemetría de corrida</p>}
              {source.latest_run?.duration_ms !== null && source.latest_run ? <p className="mt-1 text-xs text-muted-foreground">{formatDuration(source.latest_run.duration_ms)} · {source.latest_run.changes} cambios</p> : null}
            </div>
          </article>)}
        </div>
      </section>

      <section className="border-b border-border/80 py-9">
        <OperationalSectionHeader eyebrow="02 / Calidad" title="Checks que bloquean confianza" meta={health.quality.run_id ? `Run ${health.quality.run_id.slice(0, 8)}` : "Sin corrida"} />
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Los warnings se muestran como deuda real. Un check crítico fallido hace que el cron termine con estado de calidad no apto, aunque la ingestión fuente haya terminado correctamente.</p>
        <div className="mt-6 divide-y divide-border/80 border-y border-border/80">
          {health.quality.results.map(item => <div key={item.key} className="grid gap-3 py-4 sm:grid-cols-[28px_minmax(0,1fr)_auto] sm:items-start">
            {item.passed ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#96B5A6]" /> : <AlertTriangle className="mt-0.5 h-4 w-4 text-[#C9A56A]" />}
            <div><p className="text-sm font-medium text-white">{item.message}</p><p className="mt-1 text-xs text-muted-foreground">{item.category} · {item.key}</p></div>
            <div className="text-left sm:text-right"><Badge variant="outline">{item.passed ? "PASS" : item.severity.toUpperCase()}</Badge><p className="mt-1 text-xs text-muted-foreground">{item.observed ?? "—"} / esperado {item.expected ?? "—"}</p></div>
          </div>)}
          {!health.quality.results.length ? <p className="py-6 text-sm text-muted-foreground">La primera corrida de calidad todavía no ha sido registrada.</p> : null}
        </div>
      </section>

      <section className="py-9">
        <OperationalSectionHeader eyebrow="03 / Cobertura" title="Qué puede sostener hoy el motor" />
        <div className="mt-6 grid gap-px bg-border/70 sm:grid-cols-2 xl:grid-cols-4">
          <Coverage icon={Database} value={health.coverage.company_identities.toLocaleString("es-CL")} label="Identidades corporativas" detail={`${health.coverage.company_aliases.toLocaleString("es-CL")} alias resueltos`} />
          <Coverage icon={Clock3} value={health.coverage.company_activity_12m.toLocaleString("es-CL")} label="Expedientes / 12 meses" detail="Actividad IP enlazada a empresa" />
          <Coverage icon={ShieldCheck} value={health.coverage.observed_change_events.toLocaleString("es-CL")} label="Cambios observados" detail="Por fecha de detección VIDENTIA" />
          <Coverage icon={AlertTriangle} value={health.coverage.strategic_changes.toLocaleString("es-CL")} label="Cambios estratégicos" detail="Sólo patrones multi-evidencia" />
        </div>
      </section>
    </> : loading ? <div className="flex items-center gap-3 py-16 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Calculando salud operativa…</div> : null}
  </OperationalPage>
}

function StatusBadge({ status }: { status: SourceStatus }) {
  const warning = ["degraded", "stale", "initializing", "credentials_required"].includes(status)
  return <Badge variant="outline" className={warning ? "border-[#8D7042] bg-[#2C291F] text-[#D8C49C]" : status === "operational" ? "border-[#345E55] bg-[#173B37] text-[#B7D3D1]" : "bg-[#13272D] text-muted-foreground"}>{STATUS_LABEL[status]}</Badge>
}

function Coverage({ icon: Icon, value, label, detail }: { icon: typeof Database; value: string; label: string; detail: string }) {
  return <div className="bg-background p-5"><Icon className="h-4 w-4 text-[#96B5A6]" /><p className="mt-4 text-2xl font-light text-[#E7DFCE]">{value}</p><p className="mt-1 text-sm font-medium text-white">{label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div>
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Santiago" }).format(date)
}
function formatHours(value: number) { return value < 48 ? `${Math.round(value)} h` : `${Math.round(value / 24)} d` }
function formatDuration(value: number) { return value < 1000 ? `${value} ms` : `${Math.round(value / 100) / 10} s` }
