"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, BriefcaseBusiness, CheckCircle2, CircleDot, GitCompareArrows, Loader2, Radar, ShieldCheck } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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

const statusLabels: Record<Status, string> = {
  new: "Nueva",
  reviewed: "Revisada",
  accepted: "Aceptada",
  discarded: "Descartada",
  converted_to_action: "En acción",
}

export default function OpportunitiesPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [organizationId, setOrganizationId] = useState("")
  const [items, setItems] = useState<Recommendation[]>([])
  const [filter, setFilter] = useState<"active" | "all" | Status>("active")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { void loadOrganizations() }, [])
  useEffect(() => { if (organizationId) void loadRecommendations(organizationId) }, [organizationId])

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

  async function loadRecommendations(nextOrganizationId: string) {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/intelligence/recommendations?organizationId=${encodeURIComponent(nextOrganizationId)}`, { cache: "no-store" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos cargar las oportunidades.")
      setItems((payload.recommendations ?? []) as Recommendation[])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos cargar las oportunidades.")
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const rank: Record<Recommendation["tier"], number> = { alta: 3, media: 2, observacion: 1 }
    return items
      .filter(item => filter === "all" ? true : filter === "active" ? !["discarded", "converted_to_action"].includes(item.status) : item.status === filter)
      .sort((a, b) => rank[b.tier] - rank[a.tier] || b.score - a.score || Date.parse(b.updated_at) - Date.parse(a.updated_at))
  }, [items, filter])

  const metrics = useMemo(() => ({
    active: items.filter(item => !["discarded", "converted_to_action"].includes(item.status)).length,
    high: items.filter(item => item.tier === "alta" && !["discarded", "converted_to_action"].includes(item.status)).length,
    accepted: items.filter(item => item.status === "accepted").length,
    action: items.filter(item => item.status === "converted_to_action").length,
  }), [items])

  const selectedOrganization = organizations.find(item => item.id === organizationId) ?? null

  return <OperationalPage>
    <OperationalHeader
      eyebrow="VIDENTIA / Oportunidades"
      title="Qué merece una decisión ahora."
      description={<>Una bandeja ejecutiva construida sólo con recomendaciones que alguien decidió guardar. Prioriza revisión, decisión y trabajo trazable; no recalcula señales ni crea acciones automáticamente.</>}
      meta={<><span>Persistidas</span><span>Priorizadas</span><span>Auditables</span><span>Accionables</span></>}
      actions={<Button asChild variant="outline"><Link href="/brechas">Buscar nuevas brechas <GitCompareArrows className="ml-1 h-4 w-4" /></Link></Button>}
    />

    <OperationalMetricRail>
      <OperationalMetric value={metrics.active} label="Activas" detail="Pendientes de decisión o aceptación" tone={metrics.active ? "warning" : "neutral"} />
      <OperationalMetric value={metrics.high} label="Prioridad alta" detail="Activas con score alto" tone={metrics.high ? "danger" : "neutral"} />
      <OperationalMetric value={metrics.accepted} label="Aceptadas" detail="Listas para convertirse en trabajo" tone={metrics.accepted ? "warning" : "neutral"} />
      <OperationalMetric value={metrics.action} label="En acción" detail="Ya vinculadas a una tarea" tone={metrics.action ? "success" : "neutral"} />
    </OperationalMetricRail>

    <section className="grid gap-8 border-b border-border/80 py-8 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)] xl:gap-10">
      <div>
        <OperationalSectionHeader eyebrow="01 / Bandeja" title="Oportunidades persistidas" meta={`${filtered.length} visibles`} />

        {organizations.length > 1 ? <label className="mt-5 block max-w-md"><span className="mb-2 block text-xs text-muted-foreground">Organización</span><select value={organizationId} onChange={event => setOrganizationId(event.target.value)} className="h-11 w-full rounded-[10px] border border-border bg-card/40 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/45">{organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label> : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <FilterButton active={filter === "active"} onClick={() => setFilter("active")}>Activas</FilterButton>
          <FilterButton active={filter === "new"} onClick={() => setFilter("new")}>Nuevas</FilterButton>
          <FilterButton active={filter === "reviewed"} onClick={() => setFilter("reviewed")}>Revisadas</FilterButton>
          <FilterButton active={filter === "accepted"} onClick={() => setFilter("accepted")}>Aceptadas</FilterButton>
          <FilterButton active={filter === "converted_to_action"} onClick={() => setFilter("converted_to_action")}>En acción</FilterButton>
          <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>Todas</FilterButton>
        </div>

        {loading ? <div className="flex items-center gap-3 py-12 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Cargando oportunidades…</div> : null}
        {error ? <div role="alert" className="mt-6 rounded-[10px] bg-[#3A2525] p-4 text-sm text-[#E8AAA3]">{error}</div> : null}

        {!loading && !error ? <div className="mt-5 divide-y divide-border/80 border-y border-border/80">
          {filtered.length ? filtered.map(item => <OpportunityRow key={item.id} item={item} />) : <div className="py-10"><ShieldCheck className="h-5 w-5 text-primary" /><p className="mt-3 text-sm font-medium text-white">No hay oportunidades en este estado.</p><p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">Las oportunidades aparecen aquí sólo después de guardar una recomendación desde Brechas IP.</p></div>}
        </div> : null}
      </div>

      <aside>
        <OperationalPanel>
          <OperationalSectionHeader eyebrow="Control" title="Una sola fuente de verdad" />
          <div className="mt-5 space-y-4 text-sm leading-6 text-muted-foreground">
            <p>Esta pantalla no inventa oportunidades. Lee el lifecycle persistido del Recommendation Engine y conserva el mismo score, evidencia y estado.</p>
            <p className="border-t border-border/80 pt-4">{selectedOrganization?.binding ? <>Portafolio vinculado a <span className="text-foreground">{selectedOrganization.binding.canonical_name}</span>.</> : "La organización todavía no tiene una identidad propia vinculada."}</p>
            <p className="text-xs leading-5">Las decisiones regulatorias, de registrabilidad, infracción o libertad de operación siguen requiriendo revisión humana especializada.</p>
          </div>
        </OperationalPanel>
      </aside>
    </section>
  </OperationalPage>
}

function FilterButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return <Button type="button" size="sm" variant={active ? "secondary" : "ghost"} onClick={onClick}>{children}</Button>
}

function OpportunityRow({ item }: { item: Recommendation }) {
  const competitorName = item.competitor?.canonical_name ?? "Competidor"
  const gapHref = `/brechas?competitor=${encodeURIComponent(competitorName)}&competitorIdentityId=${encodeURIComponent(item.competitor_identity_id)}`
  const tone = item.tier === "alta" ? "border-red-400/20 bg-red-400/[0.06] text-red-300" : item.tier === "media" ? "border-amber-300/20 bg-amber-300/[0.06] text-amber-200" : "border-border bg-card/30 text-muted-foreground"

  return <article className="px-2 py-5">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={`rounded-md ${tone}`}>{item.score}/100 · {item.tier}</Badge>
          <Badge variant="outline" className="rounded-md">{item.classification} {item.code}</Badge>
          <Badge variant="outline" className="rounded-md">{statusLabels[item.status]}</Badge>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{competitorName}{item.competitor?.country ? ` · ${item.competitor.country}` : ""}</p>
        <h3 className="mt-1 text-base font-medium text-white">{item.headline}</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground">{item.recommended_action}</p>
        <div className="mt-3 grid gap-1 text-xs leading-5 text-muted-foreground">{(item.evidence ?? []).slice(0, 3).map(line => <span key={line}>• {line}</span>)}</div>
        {item.status === "discarded" && item.discard_reason ? <p className="mt-3 text-xs text-muted-foreground">Descartada: {item.discard_reason}</p> : null}
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-[220px] lg:justify-end">
        {item.case_id ? <Button asChild size="sm"><Link href={`/casos/${item.case_id}/equipo`}><BriefcaseBusiness className="h-4 w-4" />Abrir tarea</Link></Button> : null}
        {!item.case_id ? <Button asChild size="sm" variant="outline"><Link href={gapHref}>Revisar decisión <ArrowRight className="h-4 w-4" /></Link></Button> : null}
        <Button asChild size="sm" variant="ghost"><Link href={`/espacios?type=${item.asset_type}&code=${encodeURIComponent(item.code)}`}><Radar className="h-4 w-4" />Espacio</Link></Button>
      </div>
    </div>
    <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-3 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
      {item.status === "converted_to_action" ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <CircleDot className="h-3.5 w-3.5" />}
      Actualizada {new Date(item.updated_at).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })}
    </div>
  </article>
}
