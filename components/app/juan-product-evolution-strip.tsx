import { ArrowRight, BookOpen, Boxes, Building2, Cable, CheckCircle2, FileSearch, Github, Radar, Sparkles } from "lucide-react"
import { listPortfolioOrganizations } from "@/lib/intelligence/portfolio-access"
import { createAdminClient } from "@/lib/supabase/admin"
import { JuanProductEvolutionActions } from "@/components/app/juan-product-evolution-actions"
import { JuanResearchFrontierRefresh } from "@/components/app/juan-research-frontier-refresh"

type EvolutionRow = {
  id: string
  product_key: string
  product_name: string
  title: string
  score: number
  status: "researching" | "ready_for_review" | "accepted" | "rejected"
  outcome: string
  chile_need: string | null
  external_signal: string | null
  reuse_summary: string | null
  integration_summary: string | null
  effort: "bajo" | "medio" | "alto" | null
  evidence_snapshot: Record<string, unknown> | null
  updated_at: string
}

type ActionableSignalType = "competitor" | "applicable_technology" | "product_opportunity" | "integration" | "threat" | "research_frontier"

type ActionableSignal = {
  id: string
  productKey: string
  productName: string
  title: string
  sourceKey: string
  sourceUrl: string | null
  lastSeenAt: string | null
  signalType: ActionableSignalType
  reason: string | null
}

type WatchRow = {
  id: string
  metadata: Record<string, unknown> | null
}

type WatchEventRow = {
  id: string
  watch_id: string | null
  title: string
  source_key: string
  source_url: string | null
  payload: Record<string, unknown> | null
  last_seen_at: string | null
}

type ChileEvidenceItem = {
  title?: string
  source?: string
  url?: string | null
  relevance?: string
  role?: string | null
  direction?: "strengthen" | "weaken" | "neutral"
  delta?: number
  reason?: string
}

type FrontierPaper = {
  source?: string
  title?: string
  url?: string | null
  date?: string | null
  citedByCount?: number
  institutions?: string[]
  anchorHits?: string[]
  earlySignal?: boolean
}

type EvidenceSnapshot = {
  repo?: string
  paper?: { source?: string; title?: string; url?: string; date?: string | null } | null
  patent?: { title?: string; applicants?: string | null; url?: string | null; date?: string | null } | null
  chile_signal?: ChileEvidenceItem | null
  chile_evidence?: {
    state?: "supporting_evidence" | "contradicting_evidence" | "mixed_evidence" | "insufficient_evidence" | "not_observed"
    delta?: number
    items?: ChileEvidenceItem[]
    support_count?: number
    contradiction_count?: number
    neutral_count?: number
  }
  world_frontier?: {
    state?: "not_observed" | "single_signal" | "emerging" | "converging" | "early_convergence"
    delta?: number
    paper_count?: number
    early_signal_count?: number
    source_count?: number
    independent_institution_count?: number
    papers?: FrontierPaper[]
  }
  global_signal?: { title?: string; source?: string; url?: string | null; relevance?: string } | null
  global_signal_quality?: { scoring?: boolean; anchor_hits?: string[]; reason?: string }
  conviction?: {
    base?: number
    paper_delta?: number
    frontier_delta?: number
    patent_delta?: number
    global_delta?: number
    chile_delta?: number
    effective?: number
  }
  reuse_assets?: Array<{ title?: string; url?: string; reuse?: string }>
  integrations?: string[]
  dimensions?: {
    institutional_fit?: number
    integration_feasibility?: number
    outcome_potential?: number
    reuse_advantage?: number
    integration_leverage?: number
    outcome?: number
    agentic_mcp_potential?: number
    chile_fit?: number
  }
}

const ACTIONABLE_TYPES = new Set<ActionableSignalType>(["competitor", "applicable_technology", "product_opportunity", "integration", "threat", "research_frontier"])

export async function JuanProductEvolutionStrip({ userId }: { userId: string }) {
  const admin = createAdminClient()
  const organizations = await listPortfolioOrganizations(admin, userId).catch(() => [])
  const organization = organizations[0] ?? null
  if (!organization) return null

  const { data, error } = await admin
    .from("intelligence_product_evolution_recommendations")
    .select("id,product_key,product_name,title,score,status,outcome,chile_need,external_signal,reuse_summary,integration_summary,effort,evidence_snapshot,updated_at")
    .eq("user_id", userId)
    .eq("organization_id", organization.id)
    .neq("status", "rejected")
    .order("score", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(12)

  if (error) {
    console.error("[juan-product-evolution-strip]", error)
    return null
  }

  const rows = (data ?? []) as EvolutionRow[]
  if (!rows.length) return null

  const productNames = new Map(rows.map(row => [row.product_key, row.product_name]))
  const signals = await loadActionableSignals(admin, userId, organization.name, productNames)
  const pending = rows.filter(row => row.status === "ready_for_review").slice(0, 4)
  const researching = rows.filter(row => row.status === "researching").slice(0, Math.max(0, 4 - pending.length))
  const accepted = rows.filter(row => row.status === "accepted").slice(0, 3)

  return <section className="mx-auto mt-4 w-[calc(100%-2rem)] max-w-[1480px] border-y border-[#294047] bg-[#0B2025] sm:w-[calc(100%-3rem)]">
    <div className="flex flex-col gap-4 border-b border-[#294047] px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#173B37] text-[#96B5A6]"><Sparkles className="h-4 w-4" /></span>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#96B5A6]">Evolución de productos · {organization.name}</p>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#E7DFCE]">VIDENTIA separa dos preguntas: primero, qué tan respaldada está una dirección por evidencia externa; después, qué puede hacer {organization.name} con sus capacidades, integraciones y MCP. La capacidad institucional nunca aumenta la convicción de evidencia.</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
        <span className="text-[10px] uppercase tracking-[0.14em] text-[#748481]">evidencia → institución → ejecución → decisión humana</span>
        <JuanResearchFrontierRefresh />
      </div>
    </div>

    <InstitutionalSignals signals={signals} organizationName={organization.name} />
    {pending.length ? <EvolutionGroup title={`Pendientes de tu decisión · ${pending.length}`} rows={pending} organizationId={organization.id} organizationName={organization.name} decision /> : null}
    {researching.length ? <EvolutionGroup title={`Todavía investigando · ${researching.length}`} rows={researching} organizationId={organization.id} organizationName={organization.name} /> : null}
    {accepted.length ? <EvolutionGroup title={`Aprobadas por ti · ${accepted.length}`} rows={accepted} organizationId={organization.id} organizationName={organization.name} accepted /> : null}
  </section>
}

async function loadActionableSignals(admin: ReturnType<typeof createAdminClient>, userId: string, organizationName: string, productNames: Map<string, string>) {
  const { data: watchData, error: watchError } = await admin
    .from("intelligence_watches")
    .select("id,metadata")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(100)

  if (watchError) {
    console.error("[juan-actionable-signals:watches]", watchError)
    return [] as ActionableSignal[]
  }

  const watches = ((watchData ?? []) as WatchRow[]).filter(watch => {
    const metadata = asRecord(watch.metadata)
    return metadata.purpose === "product_evolution_chile_evidence" && metadata.institution_context === organizationName
  })
  if (!watches.length) return [] as ActionableSignal[]

  const watchProduct = new Map(watches.map(watch => {
    const metadata = asRecord(watch.metadata)
    return [watch.id, typeof metadata.product_key === "string" ? metadata.product_key : ""]
  }))
  const since = new Date(Date.now() - 21 * 86_400_000).toISOString()
  const { data: eventData, error: eventError } = await admin
    .from("intelligence_watch_events")
    .select("id,watch_id,title,source_key,source_url,payload,last_seen_at")
    .in("watch_id", watches.map(watch => watch.id))
    .gte("last_seen_at", since)
    .order("last_seen_at", { ascending: false })
    .limit(80)

  if (eventError) {
    console.error("[juan-actionable-signals:events]", eventError)
    return [] as ActionableSignal[]
  }

  const signals: ActionableSignal[] = []
  for (const event of (eventData ?? []) as WatchEventRow[]) {
    const payload = asRecord(event.payload)
    const rawType = payload.institutional_signal_type
    if (payload.institutional_relevance !== "actionable" || typeof rawType !== "string" || !ACTIONABLE_TYPES.has(rawType as ActionableSignalType)) continue
    const productKey = event.watch_id ? watchProduct.get(event.watch_id) ?? "" : ""
    if (!productKey) continue
    signals.push({
      id: event.id,
      productKey,
      productName: productNames.get(productKey) ?? productKey,
      title: event.title,
      sourceKey: event.source_key,
      sourceUrl: event.source_url,
      lastSeenAt: event.last_seen_at,
      signalType: rawType as ActionableSignalType,
      reason: typeof payload.institutional_fit_reason === "string" ? payload.institutional_fit_reason : null,
    })
    if (signals.length >= 6) break
  }
  return signals
}

function InstitutionalSignals({ signals, organizationName }: { signals: ActionableSignal[]; organizationName: string }) {
  return <div className="border-b border-[#294047] bg-[#0C2327] px-4 py-3 sm:px-5">
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Radar className="h-3.5 w-3.5 text-[#96B5A6]" />
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#96B5A6]">Señales para {organizationName}</p>
      </div>
      <span className="text-[9px] uppercase tracking-[0.1em] text-[#748481]">contexto institucional · no modifica la convicción</span>
    </div>
    {!signals.length ? <p className="mt-2 text-[11px] leading-5 text-[#83908F]">Sin señales accionables nuevas. VIDENTIA no encontró movimientos recientes con relación demostrable a las capacidades de {organizationName}.</p> : <div className="mt-3 grid gap-px bg-[#294047] md:grid-cols-2 xl:grid-cols-3">
      {signals.map(signal => <article key={signal.id} className="bg-[#0B2025] px-3 py-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[9px] font-medium uppercase tracking-[0.11em] text-[#96B5A6]">{signalTypeLabel(signal.signalType)}</span>
          <span className="text-[9px] uppercase tracking-[0.1em] text-[#748481]">{signal.productName}</span>
        </div>
        <p className="mt-1.5 text-[12px] leading-5 text-[#D6DDDA]">{compact(signal.title, 150)}</p>
        <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-[#748481]">
          <span>{sourceLabel(signal.sourceKey)}{signal.lastSeenAt ? ` · ${formatSignalDate(signal.lastSeenAt)}` : ""}</span>
          {signal.sourceUrl ? <a href={signal.sourceUrl} target="_blank" rel="noreferrer" className="shrink-0 text-[#96B5A6] hover:text-white hover:underline">Ver fuente</a> : null}
        </div>
      </article>)}
    </div>}
  </div>
}

function EvolutionGroup({ title, rows, organizationId, organizationName, decision = false, accepted = false }: { title: string; rows: EvolutionRow[]; organizationId: string; organizationName: string; decision?: boolean; accepted?: boolean }) {
  return <div className="border-b border-[#294047] last:border-b-0">
    <div className="flex items-center gap-2 border-b border-[#294047] px-4 py-2.5 sm:px-5">
      {accepted ? <CheckCircle2 className="h-3.5 w-3.5 text-[#96B5A6]" /> : <Radar className="h-3.5 w-3.5 text-[#83908F]" />}
      <p className={`text-[10px] font-medium uppercase tracking-[0.14em] ${decision || accepted ? "text-[#96B5A6]" : "text-[#83908F]"}`}>{title}</p>
    </div>
    <div className={`divide-y divide-[#294047] ${rows.length > 1 ? "xl:grid xl:grid-cols-4 xl:divide-x xl:divide-y-0" : ""}`}>
      {rows.map(row => <EvolutionCard key={row.id} row={row} organizationId={organizationId} organizationName={organizationName} decision={decision} accepted={accepted} />)}
    </div>
  </div>
}

function EvolutionCard({ row, organizationId, organizationName, decision, accepted }: { row: EvolutionRow; organizationId: string; organizationName: string; decision: boolean; accepted: boolean }) {
  const evidence = (row.evidence_snapshot ?? {}) as EvidenceSnapshot
  const conviction = evidence.conviction ?? {}
  const dimensions = evidence.dimensions ?? {}
  const chile = evidence.chile_evidence
  const frontier = evidence.world_frontier
  const repoHref = typeof evidence.repo === "string" ? evidence.repo : null
  const effective = typeof conviction.effective === "number" ? conviction.effective : row.score
  const base = typeof conviction.base === "number" ? conviction.base : null
  const chileEvaluated = Boolean(chile?.state)
  const chileDelta = chileEvaluated && typeof chile?.delta === "number" ? chile.delta : null
  const worldParts = [conviction.frontier_delta ?? conviction.paper_delta, conviction.patent_delta, conviction.global_delta]
  const worldDelta = worldParts.filter((value): value is number => typeof value === "number").reduce((sum, value) => sum + value, 0)
  const hasWorldDelta = worldParts.some(value => typeof value === "number")
  const executionDimensions = [
    ["Reuso", dimensions.reuse_advantage],
    ["Integración", dimensions.integration_leverage ?? dimensions.integration_feasibility],
    ["Outcome", dimensions.outcome ?? dimensions.outcome_potential],
    ["MCP", dimensions.agentic_mcp_potential],
  ].filter((item): item is [string, number] => typeof item[1] === "number")

  return <article className={`px-4 py-4 sm:px-5 ${decision ? "bg-[#102A2C]" : accepted ? "bg-[#0F2728]/55" : ""}`}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#96B5A6]">{row.product_name}</span>
        <h2 className="mt-2 text-sm font-medium leading-6 text-white">{row.title}</h2>
      </div>
      <div className="shrink-0 text-right">
        <span className="text-lg font-semibold tabular-nums text-[#D5DDD9]">{effective}</span>
        <p className="text-[9px] uppercase tracking-[0.1em] text-[#748481]">evidencia efectiva</p>
      </div>
    </div>

    <div className="mt-4 border-y border-[#294047] py-3">
      <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#96B5A6]">01 · Convicción de evidencia</p>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {base !== null ? <Metric label="Base" value={base} /> : null}
        {hasWorldDelta ? <Metric label="Mundo Δ" value={formatDelta(worldDelta)} /> : null}
        {chileEvaluated ? <Metric label="Chile Δ" value={formatDelta(chileDelta ?? 0)} /> : <Metric label="Chile" value="pendiente" />}
        <Metric label="Efectiva" value={effective} strong />
      </div>
      <p className="mt-1.5 text-[10px] leading-4 text-[#748481]">Sólo evidencia externa puede cambiar este score. Capacidad propia, código reutilizable, MCP y factibilidad de integración quedan fuera.</p>
      <p className="mt-1 text-[10px] leading-4 text-[#83908F]">Chile: {chileEvaluated ? stateLabel(chile?.state) : "pendiente de recalculo v3.3.1"}{chileEvaluated && chileDelta === 0 ? " · Δ0" : ""}.</p>
    </div>

    {frontier ? <div className="mt-3 border-b border-[#294047] pb-3">
      <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#83908F]">Frontera mundial</p>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
        <Metric label="Estado" value={frontierStateLabel(frontier.state)} strong />
        <Metric label="Papers" value={frontier.paper_count ?? 0} />
        <Metric label="Tempranos" value={frontier.early_signal_count ?? 0} />
        <Metric label="Instituciones" value={frontier.independent_institution_count ?? 0} />
      </div>
      {frontier.papers?.slice(0, 2).map((paper, index) => paper.title ? <EvidenceLink key={`${paper.url ?? paper.title}-${index}`} icon={BookOpen} label={`Paper ${index + 1}${paper.earlySignal ? " · señal temprana" : ""}`} value={`${paper.title}${paper.date ? ` · ${paper.date}` : ""}${paper.citedByCount !== undefined ? ` · ${paper.citedByCount} citas` : ""}`} href={paper.url ?? null} /> : null)}
      {!frontier.papers?.length ? <p className="mt-1.5 text-[10px] leading-4 text-[#748481]">No se observó todavía una señal mundial suficientemente específica para sumar convicción.</p> : null}
    </div> : null}

    <div className="mt-3 border-b border-[#294047] pb-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#96B5A6]">02 · Contexto institucional y ejecución</p>
        <span className="text-[9px] uppercase tracking-[0.1em] text-[#748481]">no puntúa evidencia</span>
      </div>
      <EvidenceLine icon={Building2} label="Institución" value={organizationName} />
      {executionDimensions.length ? <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">{executionDimensions.map(([label, value]) => <Metric key={label} label={label} value={value} />)}</div> : null}
      {row.reuse_summary ? <EvidenceLine icon={Github} label="Capacidad reutilizable" value={row.reuse_summary} /> : null}
      {row.integration_summary ? <EvidenceLine icon={Cable} label="Integración / MCP" value={row.integration_summary} /> : null}
      <EvidenceLine icon={Boxes} label="Esfuerzo" value={row.effort ?? "por estimar"} />
      <p className="mt-2 text-[11px] leading-5 text-[#AEB6B4]"><span className="font-medium text-[#D6DDDA]">Outcome posible:</span> {compact(row.outcome, 220)}</p>
    </div>

    <div className="mt-3 space-y-2">
      {!frontier && evidence.paper?.title ? <EvidenceLink icon={BookOpen} label={`Frontera mundial · Paper${evidence.paper.source ? ` · ${evidence.paper.source}` : ""}`} value={evidence.paper.title} href={evidence.paper.url ?? null} /> : null}
      {evidence.patent?.title ? <EvidenceLink icon={FileSearch} label="Frontera mundial · Patente" value={evidence.patent.title} href={evidence.patent.url ?? null} /> : null}
      {evidence.global_signal?.title ? <EvidenceLink icon={Sparkles} label={`Frontera mundial · Señal${evidence.global_signal_quality?.scoring === false ? " · contexto, no puntúa" : ""}`} value={evidence.global_signal.title} href={evidence.global_signal.url ?? null} /> : null}
      {row.chile_need ? <EvidenceLine icon={Radar} label="Hipótesis Chile" value={row.chile_need} /> : null}
      {chile?.items?.slice(0, 2).map((item, index) => item.title ? <EvidenceLink key={`${item.url ?? item.title}-${index}`} icon={Radar} label={chileItemLabel(item)} value={`${item.title}${typeof item.delta === "number" ? ` (${formatDelta(item.delta)})` : ""}`} href={item.url ?? null} /> : null)}
    </div>

    {evidence.reuse_assets?.length ? <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">{evidence.reuse_assets.slice(0, 4).map(asset => asset.url && asset.title ? <a key={asset.url} href={asset.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-[#96B5A6] hover:text-white hover:underline">{asset.title}<ArrowRight className="h-3 w-3" /></a> : null)}</div> : null}
    {repoHref ? <a href={repoHref} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-[11px] text-[#738180] hover:text-white">Abrir producto en GitHub <ArrowRight className="h-3 w-3" /></a> : null}

    {decision ? <div className="mt-4 border-t border-[#294047] pt-4"><p className="mb-3 text-[9px] font-medium uppercase tracking-[0.14em] text-[#96B5A6]">03 · Decisión humana</p><JuanProductEvolutionActions recommendationId={row.id} organizationId={organizationId} /></div> : null}
    {accepted ? <div className="mt-4 border-t border-[#294047] pt-3"><p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#96B5A6]">03 · Decisión humana</p><div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-[#B8D5C6]"><CheckCircle2 className="h-3.5 w-3.5" />Aprobado por ti · nueva evidencia puede pedir revisión, pero no cambia tu decisión automáticamente.</div></div> : null}
  </article>
}

function Metric({ label, value, strong = false }: { label: string; value: number | string; strong?: boolean }) {
  return <span className="text-[10px] uppercase tracking-[0.09em] text-[#748481]">{label} <span className={`font-semibold ${strong ? "text-[#D5DDD9]" : "text-[#B8C4C1]"}`}>{value}</span></span>
}

function signalTypeLabel(type: ActionableSignalType) {
  if (type === "competitor") return "Competidor"
  if (type === "applicable_technology") return "Tecnología aplicable"
  if (type === "product_opportunity") return "Oportunidad"
  if (type === "integration") return "Integración"
  if (type === "threat") return "Amenaza"
  return "Research frontier"
}

function sourceLabel(source: string) {
  if (source === "inapi_open_data") return "INAPI"
  if (source === "google_news_rss") return "Google News"
  if (source === "gdelt_doc") return "GDELT"
  if (source === "openalex") return "OpenAlex"
  if (source === "crossref") return "Crossref"
  return source.replaceAll("_", " ")
}

function formatSignalDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short" }).format(date)
}

function frontierStateLabel(state?: NonNullable<EvidenceSnapshot["world_frontier"]>["state"]) {
  if (state === "early_convergence") return "convergencia temprana"
  if (state === "converging") return "convergente"
  if (state === "emerging") return "emergente"
  if (state === "single_signal") return "señal aislada"
  return "no observada"
}

function stateLabel(state?: NonNullable<EvidenceSnapshot["chile_evidence"]>["state"]) {
  if (state === "supporting_evidence") return "evidencia de apoyo"
  if (state === "contradicting_evidence") return "evidencia en contra"
  if (state === "mixed_evidence") return "evidencia mixta"
  if (state === "not_observed") return "no observada"
  return "contexto observado / evidencia insuficiente"
}

function directionLabel(direction?: ChileEvidenceItem["direction"]) {
  if (direction === "strengthen") return "apoya"
  if (direction === "weaken") return "debilita"
  return "neutral"
}

function chileItemLabel(item: ChileEvidenceItem) {
  if (item.role === "context_only") return "Chile · contexto · no puntúa"
  return `Chile · ${directionLabel(item.direction)}`
}

function formatDelta(value: number) {
  return value > 0 ? `+${value}` : String(value)
}

function compact(value: string, max = 150) {
  const clean = value.replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  const clipped = clean.slice(0, max)
  const lastSpace = clipped.lastIndexOf(" ")
  return `${clipped.slice(0, lastSpace > max * 0.7 ? lastSpace : max).trim()}…`
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function EvidenceLine({ icon: Icon, label, value }: { icon: typeof Radar; label: string; value: string }) {
  return <div className="mt-1.5 flex items-start gap-2"><Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6F807E]" /><p className="text-[11px] leading-5 text-[#AEB6B4]"><span className="font-medium text-[#D6DDDA]">{label}:</span> {compact(value)}</p></div>
}

function EvidenceLink({ icon: Icon, label, value, href }: { icon: typeof Radar; label: string; value: string; href: string | null }) {
  return <div className="mt-1.5 flex items-start gap-2"><Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6F807E]" /><p className="text-[11px] leading-5 text-[#AEB6B4]"><span className="font-medium text-[#D6DDDA]">{label}:</span> {compact(value)} {href ? <a href={href} target="_blank" rel="noreferrer" className="whitespace-nowrap text-[#96B5A6] hover:text-white hover:underline">Ver fuente</a> : null}</p></div>
}