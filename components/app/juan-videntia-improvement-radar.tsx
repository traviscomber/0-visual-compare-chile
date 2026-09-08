import Link from "next/link"
import { ArrowRight, Gauge, Lightbulb, ShieldCheck } from "lucide-react"
import { JuanVidentiaImprovementActions } from "@/components/app/juan-videntia-improvement-actions"
import { loadAssistantExecutionMetricsSummary } from "@/lib/intelligence/assistant-execution-metrics"
import { loadAssistantJuanWorkspace } from "@/lib/intelligence/assistant-juan-workspace"
import { syncVidentiaImprovementLifecycle, type VidentiaImprovementLifecycleRow, type VidentiaImprovementStatus } from "@/lib/intelligence/videntia-improvement-lifecycle"
import { buildVidentiaImprovementRadar, type VidentiaImprovementCandidate } from "@/lib/intelligence/videntia-improvement-radar"

export async function JuanVidentiaImprovementRadar({ userId }: { userId: string }) {
  const [snapshot, assistantMetrics] = await Promise.all([
    loadAssistantJuanWorkspace(userId),
    loadAssistantExecutionMetricsSummary(userId, 7),
  ])
  const radar = buildVidentiaImprovementRadar(snapshot, assistantMetrics)
  const lifecycle = await syncVidentiaImprovementLifecycle(userId, radar.candidates)
  const lifecycleByKey = new Map(lifecycle.rows.map(row => [row.candidate_key, row]))
  const current = radar.candidates.map(candidate => ({ candidate, lifecycle: lifecycleByKey.get(candidate.id) ?? null }))
  const primary = current[0]
  const rest = current.slice(1)
  const currentKeys = new Set(radar.candidates.map(item => item.id))
  const historical = lifecycle.rows.filter(row => !currentKeys.has(row.candidate_key))

  return (
    <section id="mejorar-videntia" className="mx-auto mt-5 w-[calc(100%-2rem)] max-w-[1480px] scroll-mt-20 border border-[#294047] bg-[#091D22] sm:w-[calc(100%-3rem)]">
      <div className="grid border-b border-[#294047] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="px-4 py-5 sm:px-5">
          <div className="flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">
            <Lightbulb className="h-3.5 w-3.5" />
            Mejora continua · producto interno
          </div>
          <h2 className="mt-2 text-xl font-normal tracking-[-0.02em] text-[#E7DFCE] sm:text-2xl">Cómo mejorar VIDENTIA</h2>
          <p className="mt-2 max-w-3xl text-[12px] leading-5 text-[#AEB6B4]">Cada mejora sigue un ciclo verificable: detectada → investigando → propuesta → aprobada → implementada → medida. Aprobar fija una baseline canónica; medir registra el estado posterior, pero no declara éxito automáticamente.</p>
        </div>
        <div className="grid min-w-[380px] grid-cols-4 border-t border-[#294047] lg:border-l lg:border-t-0">
          <MiniMetric label="Señales" value={String(radar.observedSignalCount)} note="internas observadas" />
          <MiniMetric label="Mejoras" value={String(lifecycle.rows.length)} note="con historial" />
          <MiniMetric label="Assistant" value={String(assistantMetrics.sampleSize)} note={`muestra ${assistantMetrics.windowDays}d`} />
          <MiniMetric label="Auto-decisión" value="0" note="siempre humana" />
        </div>
      </div>

      {primary ? (
        <div className="grid border-b border-[#294047] xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
          <div className="bg-[#0C2327] px-4 py-5 sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityLabel priority={primary.candidate.priority} />
              <LifecycleStatus status={primary.lifecycle?.status ?? "detected"} />
              <span className="text-[9px] uppercase tracking-[0.1em] text-[#748481]">confianza {primary.candidate.confidence}</span>
            </div>
            <p className="mt-3 text-[9px] font-medium uppercase tracking-[0.12em] text-[#83908F]">Hallazgo</p>
            <p className="mt-1.5 text-sm leading-6 text-[#E7DFCE]">{primary.candidate.finding}</p>
            <p className="mt-3 text-[9px] leading-4 text-[#748481]">Fuente: {primary.candidate.source}</p>
            {primary.lifecycle ? <LifecycleEvidence row={primary.lifecycle} /> : null}
            {primary.lifecycle && lifecycle.organization ? <JuanVidentiaImprovementActions improvementId={primary.lifecycle.id} organizationId={lifecycle.organization.id} status={primary.lifecycle.status} /> : null}
          </div>
          <div className="grid sm:grid-cols-3">
            <ImprovementCell label="Mejora propuesta" value={primary.candidate.proposal} />
            <ImprovementCell label="Impacto esperado" value={primary.candidate.expectedImpact} />
            <ImprovementCell label="Cómo validarla" value={primary.candidate.validation} last />
          </div>
        </div>
      ) : null}

      {rest.length ? (
        <div className="divide-y divide-[#294047]">
          {rest.map(item => <ImprovementRow key={item.candidate.id} item={item.candidate} lifecycle={item.lifecycle} organizationId={lifecycle.organization?.id ?? null} />)}
        </div>
      ) : (
        <p className="px-5 py-6 text-[11px] leading-5 text-[#83908F]">No hay nuevas brechas observadas en las fuentes disponibles. El radar conserva ese vacío como estado válido.</p>
      )}

      {historical.length ? (
        <div className="border-t border-[#294047] bg-[#081A1E]">
          <div className="px-4 py-3 sm:px-5"><p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#83908F]">Seguimiento histórico · la señal actual puede haber desaparecido, el ciclo no se borra</p></div>
          <div className="divide-y divide-[#294047]">
            {historical.map(row => <HistoricalRow key={row.id} row={row} organizationId={lifecycle.organization?.id ?? null} />)}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-[#294047] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex max-w-4xl items-start gap-2 text-[10px] leading-4 text-[#83908F]">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#719B8D]" />
          <span>{radar.boundary} Las métricas del Assistant almacenan sólo categorías y números agregables; no prompts, contenido de conversación ni rutas crudas.</span>
        </div>
        <Link href="/mi-espacio?assistant=open" className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[8px] bg-[#173B37] px-3 text-xs font-medium text-[#DCE8E2] ring-1 ring-inset ring-[#31534D] hover:bg-[#1A4540]">
          Analizar con VIDENTIA <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  )
}

function ImprovementRow({ item, lifecycle, organizationId }: { item: VidentiaImprovementCandidate; lifecycle: VidentiaImprovementLifecycleRow | null; organizationId: string | null }) {
  return (
    <article className="grid gap-4 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)_minmax(0,0.9fr)] lg:items-start">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <PriorityLabel priority={item.priority} />
          <LifecycleStatus status={lifecycle?.status ?? "detected"} />
          <span className="text-[9px] uppercase tracking-[0.1em] text-[#748481]">{item.sourceKind === "product_observability" ? "observabilidad" : "señal canónica interna"}</span>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-[#D6DDDA]">{item.finding}</p>
        <p className="mt-2 text-[9px] leading-4 text-[#748481]">{item.source}</p>
        {lifecycle ? <LifecycleEvidence row={lifecycle} /> : null}
        {lifecycle && organizationId ? <JuanVidentiaImprovementActions improvementId={lifecycle.id} organizationId={organizationId} status={lifecycle.status} /> : null}
      </div>
      <div>
        <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#96B5A6]">Mejora propuesta</p>
        <p className="mt-1.5 text-[11px] leading-5 text-[#D2D8D6]">{item.proposal}</p>
      </div>
      <div>
        <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#83908F]">Validación</p>
        <p className="mt-1.5 text-[10px] leading-4 text-[#AEB6B4]">{item.validation}</p>
        <p className="mt-2 text-[9px] uppercase tracking-[0.09em] text-[#748481]">Impacto: {item.expectedImpact}</p>
      </div>
    </article>
  )
}

function HistoricalRow({ row, organizationId }: { row: VidentiaImprovementLifecycleRow; organizationId: string | null }) {
  return <article className="grid gap-3 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"><div><div className="flex flex-wrap items-center gap-2"><PriorityLabel priority={row.priority} /><LifecycleStatus status={row.status} /></div><p className="mt-2 text-[11px] leading-5 text-[#D6DDDA]">{row.finding}</p><LifecycleEvidence row={row} />{organizationId ? <JuanVidentiaImprovementActions improvementId={row.id} organizationId={organizationId} status={row.status} /> : null}</div><div><p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#96B5A6]">Mejora preservada</p><p className="mt-1.5 text-[11px] leading-5 text-[#D2D8D6]">{row.proposal}</p><p className="mt-2 text-[10px] leading-4 text-[#83908F]">Validación: {row.validation_plan}</p></div></article>
}

function LifecycleEvidence({ row }: { row: VidentiaImprovementLifecycleRow }) {
  const baseline = summarySnapshot(row.baseline_snapshot)
  const result = summarySnapshot(row.result_snapshot)
  if (!baseline && !row.implementation_ref && !result) return null
  return <div className="mt-3 grid gap-1.5 text-[9px] leading-4 text-[#83908F]">
    {baseline ? <p><span className="text-[#96B5A6]">Baseline:</span> {baseline}{row.baseline_recorded_at ? ` · ${formatDate(row.baseline_recorded_at)}` : ""}</p> : null}
    {row.implementation_ref ? <p><span className="text-[#96B5A6]">Implementación:</span> {row.implementation_ref}</p> : null}
    {result ? <p><span className="text-[#96B5A6]">Después:</span> {result}{row.measured_at ? ` · ${formatDate(row.measured_at)}` : ""}</p> : null}
  </div>
}

function ImprovementCell({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return <div className={`px-4 py-5 sm:px-5 ${last ? "" : "border-b border-[#294047] sm:border-b-0 sm:border-r"}`}><p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#96B5A6]">{label}</p><p className="mt-2 text-[11px] leading-5 text-[#D2D8D6]">{value}</p></div>
}

function MiniMetric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="border-r border-[#294047] px-3 py-4 last:border-r-0 sm:px-4"><p className="text-[8px] font-medium uppercase tracking-[0.12em] text-[#748481]">{label}</p><div className="mt-1 flex items-center gap-1.5"><Gauge className="h-3 w-3 text-[#719B8D]" /><span className="text-lg font-normal text-[#E7DFCE]">{value}</span></div><p className="mt-0.5 text-[8px] leading-3 text-[#748481]">{note}</p></div>
}

function PriorityLabel({ priority }: { priority: VidentiaImprovementCandidate["priority"] }) {
  const className = priority === "alta" ? "text-[#D8C99D]" : priority === "media" ? "text-[#96B5A6]" : "text-[#83908F]"
  return <span className={`text-[9px] font-medium uppercase tracking-[0.12em] ${className}`}>Prioridad {priority}</span>
}

function LifecycleStatus({ status }: { status: VidentiaImprovementStatus }) {
  const labels: Record<VidentiaImprovementStatus, string> = { detected: "detectada", researching: "investigando", proposed: "propuesta", approved: "aprobada", implemented: "implementada", measured: "medida" }
  return <span className="rounded-[5px] bg-[#102A2E] px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-[0.1em] text-[#AEB6B4] ring-1 ring-inset ring-[#294047]">{labels[status]}</span>
}

function summarySnapshot(snapshot: Record<string, unknown>) {
  const entries = Object.entries(snapshot).filter(([key, value]) => key !== "generatedAt" && key !== "measuredFrom" && key !== "measuredTo" && (typeof value === "number" || typeof value === "string" || typeof value === "boolean")).slice(0, 4)
  return entries.length ? entries.map(([key, value]) => `${labelKey(key)} ${String(value)}`).join(" · ") : null
}
function labelKey(key: string) { return ({ pendingDecisions: "decisiones", overdueActions: "vencidas", researchingHandoffs: "investigaciones", githubReposObserved: "repos", acceptedProducts: "productos", subsectionNewPapersObserved: "papers nuevos", subsectionProductsWithFreshPapers: "productos", sampleSize: "muestra", p50DurationMs: "p50 ms", p95DurationMs: "p95 ms", averageToolCalls: "tools prom.", averageTotalTokens: "tokens prom." } as Record<string, string>)[key] ?? key }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "sin fecha" : new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(date) }
