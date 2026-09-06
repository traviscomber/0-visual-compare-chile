"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, BrainCircuit, BriefcaseBusiness, CheckCircle2, CircleDot, FlaskConical, GitCompareArrows, Loader2, Radar, RefreshCw, ShieldCheck } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getPrototypeLearningAttention, type OpportunityResearchHistoryRun, type PrototypeAssessment } from "@/lib/intelligence/opportunity-thesis-attention"

type Binding = { id: string; identity_id: string; canonical_name: string; country: string | null; resolution_confidence: number; updated_at: string }
type Organization = { id: string; name: string; slug: string; role: string; binding: Binding | null }
type Status = "new" | "reviewed" | "accepted" | "discarded" | "converted_to_action"
type Recommendation = {
  id: string
  organization_id: string
  competitor_identity_id: string
  asset_type: "patent" | "trademark"
  classification: "IPC" | "Niza"
  code: string
  score: number
  tier: "alta" | "media" | "observacion"
  headline: string
  recommended_action: string
  guardrail: string
  evidence: string[]
  status: Status
  discard_reason: string | null
  case_id: string | null
  action_id: string | null
  created_at: string
  updated_at: string
  competitor: { id: string; canonical_name: string; country: string | null } | null
}
type ThesisResearchRun = OpportunityResearchHistoryRun
type ProductThesis = {
  id: string
  title: string
  status: "exploring" | "watching" | "prototype" | "rejected" | "archived"
  decision: "build" | "investigate" | "watch" | "reject"
  evidence_state: "observed" | "mixed" | "hypothesis"
  confidence: number
  overall_score: number
  evidence_strength: number
  timing_score: number
  last_researched_at: string | null
  updated_at: string
  research_history: ThesisResearchRun[]
}
type ThesisAttention = {
  thesis: ProductThesis
  kind: "needs_assessment" | "needs_research"
  assessment: PrototypeAssessment | null
}

const statusLabels: Record<Status, string> = {
  new: "Nueva",
  reviewed: "Revisada",
  accepted: "Aceptada",
  discarded: "Descartada",
  converted_to_action: "En acción",
}

const assessmentLabels: Record<PrototypeAssessment, string> = {
  supports: "Apoya la tesis",
  mixed: "Resultado mixto",
  refutes: "Refuta la tesis",
  inconclusive: "Inconcluso",
}

export default function OpportunitiesPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [organizationId, setOrganizationId] = useState("")
  const [items, setItems] = useState<Recommendation[]>([])
  const [theses, setTheses] = useState<ProductThesis[]>([])
  const [thesesAvailable, setThesesAvailable] = useState(true)
  const [filter, setFilter] = useState<"active" | "all" | Status>("active")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { void loadOrganizations() }, [])
  useEffect(() => { if (organizationId) void loadOpportunityWorkspace(organizationId) }, [organizationId])

  async function loadOrganizations() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/intelligence/portfolio-binding", { cache: "no-store" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos cargar tu organización.")
      const next = (payload.organizations ?? []) as Organization[]
      setOrganizations(next)
      setOrganizationId(next[0]?.id ?? "")
      if (!next.length) setLoading(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos cargar tu organización.")
      setLoading(false)
    }
  }

  async function loadOpportunityWorkspace(nextOrganizationId: string) {
    setLoading(true)
    setError(null)
    setThesesAvailable(true)
    try {
      const [recommendationResponse, thesisResponse] = await Promise.all([
        fetch(`/api/intelligence/recommendations?organizationId=${encodeURIComponent(nextOrganizationId)}`, { cache: "no-store" }),
        fetch(`/api/intelligence/opportunity-theses?organizationId=${encodeURIComponent(nextOrganizationId)}`, { cache: "no-store" }),
      ])
      const recommendationPayload = await recommendationResponse.json().catch(() => ({}))
      if (!recommendationResponse.ok) throw new Error(recommendationPayload.error || "No pudimos cargar las oportunidades.")
      setItems((recommendationPayload.recommendations ?? []) as Recommendation[])

      const thesisPayload = await thesisResponse.json().catch(() => ({}))
      if (thesisResponse.ok) {
        setTheses((thesisPayload.opportunities ?? []) as ProductThesis[])
      } else {
        setTheses([])
        setThesesAvailable(false)
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos cargar las oportunidades.")
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const tierRank: Record<Recommendation["tier"], number> = { alta: 3, media: 2, observacion: 1 }
    const statusRank: Record<Status, number> = { accepted: 5, new: 4, reviewed: 3, converted_to_action: 2, discarded: 1 }
    return items
      .filter(item => filter === "all" ? true : filter === "active" ? !["discarded", "converted_to_action"].includes(item.status) : item.status === filter)
      .sort((a, b) => statusRank[b.status] - statusRank[a.status] || tierRank[b.tier] - tierRank[a.tier] || b.score - a.score || Date.parse(b.updated_at) - Date.parse(a.updated_at))
  }, [items, filter])

  const metrics = useMemo(() => ({
    active: items.filter(item => !["discarded", "converted_to_action"].includes(item.status)).length,
    high: items.filter(item => item.tier === "alta" && !["discarded", "converted_to_action"].includes(item.status)).length,
    accepted: items.filter(item => item.status === "accepted").length,
    action: items.filter(item => item.status === "converted_to_action").length,
  }), [items])

  const activeTheses = useMemo(() => theses.filter(item => !["rejected", "archived"].includes(item.status)), [theses])
  const prototypeTheses = useMemo(() => activeTheses.filter(item => item.status === "prototype"), [activeTheses])
  const thesisAttention = useMemo(() => prototypeTheses.map(thesis => {
    const attention = getPrototypeLearningAttention(thesis.research_history)
    return attention ? { thesis, kind: attention.kind, assessment: attention.assessment } : null
  }).filter((item): item is ThesisAttention => Boolean(item)), [prototypeTheses])
  const needsAssessment = thesisAttention.filter(item => item.kind === "needs_assessment").length
  const needsResearch = thesisAttention.filter(item => item.kind === "needs_research").length
  const selectedOrganization = organizations.find(item => item.id === organizationId) ?? null
  const actionNow = metrics.accepted + thesisAttention.length

  return <OperationalPage>
    <OperationalHeader
      eyebrow="VIDENTIA / Oportunidades"
      title={actionNow ? `${actionNow} decisión${actionNow === 1 ? "" : "es"} requiere${actionNow === 1 ? "" : "n"} acción.` : metrics.active || activeTheses.length ? "No hay decisiones críticas pendientes." : "No hay oportunidades pendientes."}
      description={<>Una sola bandeja coordina dos ciclos distintos sin mezclar sus fuentes: recomendaciones persistidas del Recommendation Engine y tesis de producto gobernadas por Opportunity Engine.</>}
      meta={<><span>Recommendations</span><span>Product theses</span><span>Human-gated</span><span>Canonical</span></>}
      actions={<div className="flex flex-wrap gap-2"><Button asChild><Link href="/oportunidades/tesis"><FlaskConical className="h-4 w-4" />Tesis de producto</Link></Button><Button asChild variant="outline"><Link href="/oportunidades/descubrir"><BrainCircuit className="h-4 w-4" />Descubrir</Link></Button></div>}
    />

    <OperationalMetricRail>
      <OperationalMetric value={actionNow} label="Para actuar" detail={`${metrics.accepted} recomendación${metrics.accepted === 1 ? "" : "es"} aceptada${metrics.accepted === 1 ? "" : "s"} · ${thesisAttention.length} aprendizaje${thesisAttention.length === 1 ? "" : "s"} pendiente${thesisAttention.length === 1 ? "" : "s"}`} tone={actionNow ? "warning" : "success"} />
      <OperationalMetric value={metrics.active} label="Recomendaciones activas" detail={`${metrics.high} de prioridad alta`} tone={metrics.high ? "warning" : metrics.active ? "neutral" : "success"} />
      <OperationalMetric value={activeTheses.length} label="Tesis activas" detail="Exploración, vigilancia y prototipo" tone={activeTheses.length ? "neutral" : "success"} />
      <OperationalMetric value={prototypeTheses.length} label="Prototipos" detail={`${needsAssessment} por clasificar · ${needsResearch} por re-investigar`} tone={thesisAttention.length ? "warning" : prototypeTheses.length ? "success" : "neutral"} />
    </OperationalMetricRail>

    <section className="border-b border-border/80 py-8">
      <OperationalSectionHeader eyebrow="01 / Opportunity Engine" title="Aprendizaje de prototipo que todavía necesita una decisión." meta={thesesAvailable ? `${activeTheses.length} tesis activas` : "Fuente degradada"} />
      {!thesesAvailable ? <div className="mt-5 border-y border-[#7A5B41]/45 bg-[#332C24]/35 px-4 py-4 text-sm text-[#D6C3A8]">El lifecycle de recomendaciones sigue disponible. La lectura de tesis está temporalmente degradada y no se reemplaza con datos inferidos.</div> : null}
      {thesesAvailable && thesisAttention.length ? <div className="mt-5 divide-y divide-border/70 border-y border-border/70">
        {thesisAttention.slice(0, 4).map(item => <ThesisAttentionRow key={item.thesis.id} item={item} />)}
      </div> : null}
      {thesesAvailable && !thesisAttention.length && activeTheses.length ? <div className="mt-5 flex flex-col gap-4 border-y border-border/70 py-5 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-medium text-white">Ninguna tesis requiere intervención de aprendizaje ahora.</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{prototypeTheses.length ? "Los resultados de prototipo clasificados ya fueron consumidos o aún no existe un outcome atribuible pendiente." : "Las tesis activas todavía no han llegado a prototipo."}</p></div><Button asChild size="sm" variant="outline"><Link href="/oportunidades/tesis">Ver tesis <ArrowRight className="h-4 w-4" /></Link></Button></div> : null}
      {thesesAvailable && !activeTheses.length ? <div className="mt-5 flex flex-col gap-4 border-y border-border/70 py-5 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-medium text-white">Todavía no hay tesis de producto activas.</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Opportunity Engine puede descubrir hipótesis desde capacidades y señales reales; sólo una persona decide persistirlas.</p></div><Button asChild size="sm"><Link href="/oportunidades/descubrir">Descubrir productos <ArrowRight className="h-4 w-4" /></Link></Button></div> : null}
    </section>

    <section className="grid gap-8 border-b border-border/80 py-8 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)] xl:gap-10">
      <div>
        <OperationalSectionHeader eyebrow="02 / Recommendation Engine" title="Recomendaciones persistidas que deben avanzar por su lifecycle." meta={`${filtered.length} visibles`} />

        {organizations.length > 1 ? <label className="mt-5 block max-w-md"><span className="mb-2 block text-xs text-muted-foreground">Organización</span><select value={organizationId} onChange={event => setOrganizationId(event.target.value)} className="h-11 w-full rounded-[10px] border border-border bg-card/40 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/45">{organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label> : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <FilterButton active={filter === "active"} onClick={() => setFilter("active")}>Activas</FilterButton>
          <FilterButton active={filter === "accepted"} onClick={() => setFilter("accepted")}>Aceptadas</FilterButton>
          <FilterButton active={filter === "new"} onClick={() => setFilter("new")}>Nuevas</FilterButton>
          <FilterButton active={filter === "reviewed"} onClick={() => setFilter("reviewed")}>Revisadas</FilterButton>
          <FilterButton active={filter === "converted_to_action"} onClick={() => setFilter("converted_to_action")}>En acción</FilterButton>
          <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>Todas</FilterButton>
        </div>

        {loading ? <div className="flex items-center gap-3 py-12 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Cargando oportunidades…</div> : null}
        {error ? <div role="alert" className="mt-6 rounded-[10px] bg-[#2E2922] p-4 text-sm text-[#D9B27C]">{error}</div> : null}

        {!loading && !error ? <div className="mt-5 divide-y divide-border/80 border-y border-border/80">
          {filtered.length ? filtered.map(item => <OpportunityRow key={item.id} item={item} />) : <div className="py-10"><ShieldCheck className="h-5 w-5 text-primary" /><p className="mt-3 text-sm font-medium text-white">No hay recomendaciones persistidas en este estado.</p><p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">Puedes guardar señales desde Brechas IP o abrir Opportunity Engine para descubrir nuevas tesis de producto antes de llevarlas al lifecycle operativo.</p><Button asChild size="sm" className="mt-4"><Link href="/oportunidades/descubrir">Abrir Opportunity Engine <ArrowRight className="h-4 w-4" /></Link></Button></div>}
        </div> : null}
      </div>

      <aside>
        <OperationalPanel>
          <OperationalSectionHeader eyebrow="Control" title="Dos lifecycles. Una lectura ejecutiva." />
          <div className="mt-5 space-y-4 text-sm leading-6 text-muted-foreground">
            <p><span className="text-foreground">Recommendation Engine</span> conserva su score, evidencia, estado y vínculo a casos. Esta pantalla nunca lo recalcula.</p>
            <p className="border-t border-border/80 pt-4"><span className="text-foreground">Opportunity Engine</span> conserva tesis, research, decisiones humanas, outcomes y evaluaciones como un lineage separado. Un outcome no valida una tesis automáticamente.</p>
            <p className="border-t border-border/80 pt-4">{selectedOrganization?.binding ? <>Portafolio vinculado a <span className="text-foreground">{selectedOrganization.binding.canonical_name}</span>.</> : "La organización todavía no tiene una identidad propia vinculada."}</p>
            <Button asChild size="sm" variant="ghost" className="px-0"><Link href="/brechas">Abrir Brechas IP <GitCompareArrows className="h-4 w-4" /></Link></Button>
          </div>
        </OperationalPanel>
      </aside>
    </section>
  </OperationalPage>
}

function ThesisAttentionRow({ item }: { item: ThesisAttention }) {
  const { thesis } = item
  const isAssessment = item.kind === "needs_assessment"
  return <article className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={`rounded-md ${isAssessment ? "border-[#D6A46F]/30 bg-[#332C24]/65 text-[#E0B987]" : "border-[#7E9CAB]/25 bg-[#13272D]/70 text-[#A9C0CA]"}`}>{isAssessment ? "Clasificar resultado" : "Re-investigar aprendizaje"}</Badge>
        <Badge variant="outline" className="rounded-md">{thesis.overall_score}/100</Badge>
        <Badge variant="outline" className="rounded-md">Evidencia {thesis.evidence_strength}</Badge>
      </div>
      <h3 className="mt-2 text-base font-medium text-white">{thesis.title}</h3>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{isAssessment ? "Existe un outcome atribuible de prototipo que aún necesita clasificación humana antes de poder entrar al siguiente research." : `${item.assessment ? assessmentLabels[item.assessment] : "Evaluación registrada"}. La evaluación está pendiente de ser consumida por una nueva investigación.`}</p>
    </div>
    <Button asChild size="sm" variant={isAssessment ? "default" : "outline"}><Link href="/oportunidades/tesis">{isAssessment ? <FlaskConical className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}{isAssessment ? "Clasificar" : "Re-investigar"}</Link></Button>
  </article>
}

function FilterButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return <Button type="button" size="sm" variant={active ? "secondary" : "ghost"} onClick={onClick}>{children}</Button>
}

function OpportunityRow({ item }: { item: Recommendation }) {
  const competitorName = item.competitor?.canonical_name ?? "Competidor"
  const gapHref = `/brechas?competitor=${encodeURIComponent(competitorName)}&competitorIdentityId=${encodeURIComponent(item.competitor_identity_id)}`
  const tone = item.status === "accepted"
    ? "border-[#96B5A6]/25 bg-[#173B37]/65 text-[#B8D0C2]"
    : item.tier === "alta"
      ? "border-[#D6A46F]/25 bg-[#332C24]/70 text-[#E0B987]"
      : item.tier === "media"
        ? "border-[#7E9CAB]/20 bg-[#13272D]/70 text-[#A9C0CA]"
        : "border-border bg-card/30 text-muted-foreground"

  return <article className="px-2 py-5">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {item.status === "accepted" ? <Badge variant="outline" className="rounded-md border-[#96B5A6]/25 bg-[#173B37] text-[#B8D0C2]">Aceptada · lista para ejecutar</Badge> : null}
          <Badge variant="outline" className={`rounded-md ${tone}`}>{item.score}/100 · {item.tier}</Badge>
          <Badge variant="outline" className="rounded-md">{item.classification} {item.code}</Badge>
          {item.status !== "accepted" ? <Badge variant="outline" className="rounded-md">{statusLabels[item.status]}</Badge> : null}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{competitorName}{item.competitor?.country ? ` · ${item.competitor.country}` : ""}</p>
        <h3 className="mt-1 text-base font-medium text-white">{item.headline}</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground">{item.recommended_action}</p>
        <div className="mt-3 grid gap-1 text-xs leading-5 text-muted-foreground">{(item.evidence ?? []).slice(0, 3).map(line => <span key={line}>• {line}</span>)}</div>
        {item.status === "discarded" && item.discard_reason ? <p className="mt-3 text-xs text-muted-foreground">Descartada: {item.discard_reason}</p> : null}
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-[220px] lg:justify-end">
        {item.case_id ? <Button asChild size="sm"><Link href={`/casos/${item.case_id}/equipo`}><BriefcaseBusiness className="h-4 w-4" />Abrir tarea</Link></Button> : null}
        {!item.case_id ? <Button asChild size="sm" variant={item.status === "accepted" ? "default" : "outline"}><Link href={gapHref}>{item.status === "accepted" ? "Preparar ejecución" : "Revisar decisión"} <ArrowRight className="h-4 w-4" /></Link></Button> : null}
        <Button asChild size="sm" variant="ghost"><Link href={`/espacios?type=${item.asset_type}&code=${encodeURIComponent(item.code)}`}><Radar className="h-4 w-4" />Espacio</Link></Button>
      </div>
    </div>
    <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-3 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
      {item.status === "converted_to_action" ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <CircleDot className="h-3.5 w-3.5" />}
      Actualizada {new Date(item.updated_at).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })}
    </div>
  </article>
}
