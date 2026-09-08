import Link from "next/link"
import { AlertTriangle, ArrowRight, CheckCircle2, CircleDot, Compass, FileCheck2, Radar, Sparkles } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"

type ProductRow = {
  product_key: string
  product_name: string
  title: string
  score: number
  status: "researching" | "ready_for_review" | "accepted" | "rejected"
  outcome: string
  effort: "bajo" | "medio" | "alto" | null
  evidence_snapshot: Record<string, unknown> | null
  updated_at: string
}

type HandoffRow = {
  idea_key: string
  idea_title: string
  score: number
  status: "ready_for_n3uralia" | "accepted" | "paused" | "closed"
  rationale: string | null
  evidence_snapshot: Record<string, unknown> | null
  updated_at: string
}

type CaseRow = { id: string }
type ActionRow = { id: string; status: string; due_at: string | null }

type ResearchSummary = {
  papers?: number
  patents?: number
  signals?: number
  curated_evidence?: number
}

type HandoffSnapshot = {
  research_summary?: ResearchSummary
  evidence_gaps?: string[]
}

type ProductSnapshot = {
  chile_evidence?: { state?: string; delta?: number; items?: unknown[] }
  world_frontier?: { state?: string; paper_count?: number }
  patent?: { title?: string; url?: string | null } | null
  dimensions?: {
    reuse_advantage?: number
    integration_leverage?: number
    integration_feasibility?: number
    outcome?: number
    outcome_potential?: number
  }
}

const PRODUCT_RECOMMENDATIONS: Record<string, string> = {
  kumplio: "Convertir obligación → evidencia → tarea → responsable → aprobación humana en un flujo único y medible.",
  chileflota: "Cerrar readiness por vehículo conectando vencimientos, PRT, agenda, proveedor y mantenimiento antes de la indisponibilidad.",
  pescamar: "Unir la anomalía visual de calidad con inventario, planificación y decisión comercial para convertir observación física en acción.",
  motil: "Llevar el Senior Assistant de consulta a operador con tools/MCP sobre OT, activos y geología, siempre con aprobación humana.",
  "property-partners": "Conectar comparables, documentos, mercado y CRM para que cada valorización termine en una próxima acción comercial trazable.",
  "black-swan": "Unificar Facility, Orchard, sensores, inventario y mantenimiento detrás de un operador de campo orientado a excepciones.",
}

export async function JuanExecutiveWorkspace({ userId }: { userId: string }) {
  const admin = createAdminClient()
  const [productsResult, handoffsResult, casesResult] = await Promise.all([
    admin
      .from("intelligence_product_evolution_recommendations")
      .select("product_key,product_name,title,score,status,outcome,effort,evidence_snapshot,updated_at")
      .eq("user_id", userId)
      .neq("status", "rejected")
      .order("score", { ascending: false }),
    admin
      .from("intelligence_project_handoffs")
      .select("idea_key,idea_title,score,status,rationale,evidence_snapshot,updated_at")
      .eq("user_id", userId)
      .neq("status", "closed")
      .order("score", { ascending: false }),
    admin.from("cases").select("id").eq("user_id", userId).neq("status", "closed").limit(200),
  ])

  const products = (productsResult.error ? [] : productsResult.data ?? []) as ProductRow[]
  const handoffs = (handoffsResult.error ? [] : handoffsResult.data ?? []) as HandoffRow[]
  const cases = (casesResult.error ? [] : casesResult.data ?? []) as CaseRow[]
  let openActions: ActionRow[] = []
  if (cases.length) {
    const actionsResult = await admin
      .from("case_actions")
      .select("id,status,due_at")
      .in("case_id", cases.map(item => item.id))
      .neq("status", "done")
      .limit(200)
    openActions = (actionsResult.error ? [] : actionsResult.data ?? []) as ActionRow[]
  }

  const now = Date.now()
  const overdueActions = openActions.filter(action => {
    if (!action.due_at) return false
    const due = Date.parse(action.due_at)
    return Number.isFinite(due) && due < now
  })
  const pendingDecisions = handoffs.filter(item => item.status === "ready_for_n3uralia")
  const researching = handoffs.filter(item => item.status === "paused")
  const acceptedProducts = products.filter(item => item.status === "accepted")
  const neutralChile = products.filter(item => {
    const snapshot = asProductSnapshot(item.evidence_snapshot)
    const state = snapshot.chile_evidence?.state
    return state === "not_observed" || state === "insufficient_evidence" || !state
  }).length
  const latestUpdate = latestDate([...products.map(item => item.updated_at), ...handoffs.map(item => item.updated_at)])

  return (
    <section className="mx-auto w-[calc(100%-2rem)] max-w-[1480px] pt-6 sm:w-[calc(100%-3rem)] lg:pt-8">
      <div className="border-b border-[#294047] pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">
              <Sparkles className="h-3.5 w-3.5" />
              Espacio de Juan · decisión ejecutiva
            </div>
            <h1 className="mt-2 text-2xl font-normal tracking-[-0.02em] text-[#E7DFCE] sm:text-3xl">Qué requiere decisión, qué conviene ejecutar y qué falta demostrar.</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#AEB6B4]">La evidencia externa define convicción. La capacidad N3uralia define cómo ejecutar. VIDENTIA mantiene ambas capas separadas y deja la decisión final en ti.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.12em] text-[#748481]">Actualizado {latestUpdate ? formatDateTime(latestUpdate) : "sin fecha"}</span>
            <Link href="/mi-espacio?assistant=open" className="inline-flex h-9 items-center gap-2 rounded-[8px] bg-[#173B37] px-3 text-xs font-medium text-[#DCE8E2] ring-1 ring-inset ring-[#31534D] hover:bg-[#1A4540]">Preguntar a VIDENTIA <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </div>

      <div className="grid border-b border-l border-[#294047] sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Decisiones pendientes" value={pendingDecisions.length} note={pendingDecisions.length ? "evidencia suficiente para revisión humana" : "sin decisiones pendientes"} attention={pendingDecisions.length > 0} />
        <Metric label="Direcciones aprobadas" value={acceptedProducts.length} note="productos con decisión humana preservada" />
        <Metric label="Investigación abierta" value={researching.length} note="aún no supera el umbral de decisión" />
        <Metric label="Acciones vencidas" value={overdueActions.length} note={overdueActions.length ? "requieren higiene operacional" : "sin vencimientos abiertos"} attention={overdueActions.length > 0} />
      </div>

      <div className="grid gap-4 py-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="border border-[#294047] bg-[#0C2327]">
          <SectionHeader icon={Compass} eyebrow="Primero" title="Requiere tu decisión" note="La puntuación es evidencia, no una decisión automática." />
          {pendingDecisions.length ? (
            <div className="divide-y divide-[#294047]">
              {pendingDecisions.slice(0, 4).map(item => <DecisionRow key={item.idea_key} item={item} />)}
            </div>
          ) : <EmptyState text="No hay nuevas oportunidades por encima del umbral de decisión." />}
          <div className="border-t border-[#294047] px-4 py-3">
            <Link href="#oportunidades-institucionales" className="inline-flex items-center gap-2 text-xs font-medium text-[#96B5A6] hover:text-white">Ver evidencia completa y decidir <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </div>

        <div className="border border-[#294047] bg-[#0B2025]">
          <SectionHeader icon={FileCheck2} eyebrow="Calidad" title="Estado de la evidencia" note="Ausencia de evidencia Chile es neutral, nunca evidencia negativa." />
          <div className="divide-y divide-[#294047]">
            <HealthRow label="Evidencia Chile" value={`${neutralChile}/${products.length || 0} direcciones sin señal concluyente`} detail="Se mantienen neutrales hasta que aparezca evidencia independiente de adopción, demanda, rechazo o contracción." />
            <HealthRow label="Patentes" value="Canal separado del mercado" detail="Una solicitud o registro patentario no se interpreta como adopción comercial ni como demanda en Chile." />
            <HealthRow label="Decisión humana" value={`${acceptedProducts.length} direcciones preservadas`} detail="Los refresh de evidencia pueden cambiar el soporte, pero no reescriben una aprobación o rechazo humano." />
            <HealthRow label="Operación" value={overdueActions.length ? `${overdueActions.length} acción vencida${overdueActions.length === 1 ? "" : "s"}` : "Sin acciones vencidas"} detail={overdueActions.length ? "Conviene revisar la bandeja de casos y eliminar ruido de QA o reasignar trabajo real." : "No hay trabajo operacional vencido en casos abiertos."} />
          </div>
        </div>
      </div>

      <div className="border border-[#294047] bg-[#0B2025]">
        <SectionHeader icon={Radar} eyebrow="Después" title="Recomendaciones de ejecución" note="Ordenadas por convicción de evidencia. La preparación institucional se muestra aparte y no aumenta ese score." />
        <div className="divide-y divide-[#294047]">
          {acceptedProducts.map(product => <ProductRecommendationRow key={product.product_key} product={product} />)}
        </div>
      </div>

      {researching.length ? (
        <div className="mt-4 border border-[#294047] bg-[#0C2327]">
          <SectionHeader icon={CircleDot} eyebrow="Todavía no" title="Investigación abierta" note="No se recomienda decidir hasta cerrar la evidencia faltante." />
          <div className="grid gap-px bg-[#294047] md:grid-cols-2">
            {researching.map(item => <ResearchRow key={item.idea_key} item={item} />)}
          </div>
        </div>
      ) : null}
    </section>
  )
}

function Metric({ label, value, note, attention = false }: { label: string; value: number; note: string; attention?: boolean }) {
  return <div className="border-b border-r border-[#294047] bg-[#0B2025] px-4 py-4"><p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#748481]">{label}</p><div className="mt-2 flex items-end gap-2"><span className={`text-2xl font-normal ${attention ? "text-[#D8C99D]" : "text-[#E7DFCE]"}`}>{value}</span>{attention ? <AlertTriangle className="mb-1 h-3.5 w-3.5 text-[#B8A66E]" /> : <CheckCircle2 className="mb-1 h-3.5 w-3.5 text-[#719B8D]" />}</div><p className="mt-1 text-[10px] leading-4 text-[#83908F]">{note}</p></div>
}

function SectionHeader({ icon: Icon, eyebrow, title, note }: { icon: typeof Radar; eyebrow: string; title: string; note: string }) {
  return <div className="flex flex-col gap-2 border-b border-[#294047] px-4 py-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-[#173B37] text-[#96B5A6]"><Icon className="h-3.5 w-3.5" /></span><div><p className="text-[9px] font-medium uppercase tracking-[0.15em] text-[#96B5A6]">{eyebrow}</p><h2 className="mt-1 text-sm font-medium text-[#E7DFCE]">{title}</h2></div></div><p className="max-w-xl text-[10px] leading-4 text-[#83908F] sm:text-right">{note}</p></div>
}

function DecisionRow({ item }: { item: HandoffRow }) {
  const snapshot = asHandoffSnapshot(item.evidence_snapshot)
  const summary = snapshot.research_summary ?? {}
  const gap = snapshot.evidence_gaps?.[0] ?? "Validar problema real, comprador y diferenciación antes de construir."
  return <article className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#96B5A6]">Decisión humana</span><span className="text-[9px] uppercase tracking-[0.1em] text-[#748481]">{item.score}/100 evidencia</span></div><h3 className="mt-1.5 text-sm font-medium text-[#E7DFCE]">{item.idea_title}</h3><p className="mt-1.5 text-[11px] leading-5 text-[#AEB6B4]"><span className="text-[#83908F]">Antes de avanzar:</span> {gap}</p><p className="mt-2 text-[9px] uppercase tracking-[0.09em] text-[#748481]">{summary.papers ?? 0} papers · {summary.patents ?? 0} patentes · {summary.signals ?? 0} señales independientes · {summary.curated_evidence ?? 0} evidencias curadas</p></div><a href="#oportunidades-institucionales" className="inline-flex h-8 items-center justify-center rounded-[7px] bg-[#173B37] px-3 text-[10px] font-medium text-[#DCE8E2] ring-1 ring-inset ring-[#31534D] hover:bg-[#1A4540]">Revisar</a></article>
}

function ProductRecommendationRow({ product }: { product: ProductRow }) {
  const snapshot = asProductSnapshot(product.evidence_snapshot)
  const dimensions = snapshot.dimensions ?? {}
  const integration = numberOrNull(dimensions.integration_leverage ?? dimensions.integration_feasibility)
  const reuse = numberOrNull(dimensions.reuse_advantage)
  const frontierState = snapshot.world_frontier?.state ?? "not_observed"
  const recommendation = PRODUCT_RECOMMENDATIONS[product.product_key] ?? product.outcome
  return <article className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)_auto] lg:items-center"><div><p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#96B5A6]">{product.product_name}</p><h3 className="mt-1 text-[12px] font-medium leading-5 text-[#E7DFCE]">{product.title}</h3></div><div><p className="text-[9px] uppercase tracking-[0.1em] text-[#748481]">Recomendación operativa · no modifica convicción</p><p className="mt-1 text-[11px] leading-5 text-[#D2D8D6]">{recommendation}</p></div><div className="flex min-w-[172px] flex-wrap gap-2 lg:justify-end"><DataChip label="Evidencia" value={`${product.score}/100`} /><DataChip label="Integración" value={integration === null ? "n/d" : `${integration}/100`} /><DataChip label="Reuso" value={reuse === null ? "n/d" : `${reuse}/100`} /><DataChip label="Frontera" value={frontierLabel(frontierState)} /></div></article>
}

function ResearchRow({ item }: { item: HandoffRow }) {
  const snapshot = asHandoffSnapshot(item.evidence_snapshot)
  const gap = snapshot.evidence_gaps?.[0] ?? "Completar evidencia independiente antes de decidir."
  const summary = snapshot.research_summary ?? {}
  return <article className="bg-[#0B2025] px-4 py-4"><div className="flex items-center justify-between gap-3"><h3 className="text-[12px] font-medium text-[#E7DFCE]">{item.idea_title}</h3><span className="shrink-0 text-[10px] font-medium text-[#AAB3B1]">{item.score}/100</span></div><p className="mt-2 text-[11px] leading-5 text-[#AEB6B4]"><span className="text-[#83908F]">Falta:</span> {gap}</p><p className="mt-2 text-[9px] uppercase tracking-[0.09em] text-[#748481]">{summary.papers ?? 0} papers · {summary.patents ?? 0} patentes · {summary.signals ?? 0} señales</p></article>
}

function HealthRow({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="px-4 py-3"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#83908F]">{label}</span><span className="text-[10px] font-medium text-[#D6DDDA]">{value}</span></div><p className="mt-1 text-[10px] leading-4 text-[#748481]">{detail}</p></div>
}

function DataChip({ label, value }: { label: string; value: string }) {
  return <span className="min-w-[76px] rounded-[6px] bg-[#102A2E] px-2 py-1.5 ring-1 ring-inset ring-[#294047]"><span className="block text-[8px] uppercase tracking-[0.09em] text-[#748481]">{label}</span><span className="mt-0.5 block text-[10px] font-medium text-[#D6DDDA]">{value}</span></span>
}

function EmptyState({ text }: { text: string }) { return <p className="px-4 py-6 text-[11px] leading-5 text-[#83908F]">{text}</p> }
function asHandoffSnapshot(value: Record<string, unknown> | null) { return (value ?? {}) as HandoffSnapshot }
function asProductSnapshot(value: Record<string, unknown> | null) { return (value ?? {}) as ProductSnapshot }
function numberOrNull(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : null }
function latestDate(values: string[]) { return values.filter(Boolean).sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null }
function formatDateTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "sin fecha" : new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(date) }
function frontierLabel(value: string) { return ({ converging: "convergente", early_convergence: "convergencia temprana", emerging: "emergente", single_signal: "señal única", not_observed: "sin señal" } as Record<string, string>)[value] ?? value }
