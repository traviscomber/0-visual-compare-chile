"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowRight, Building2, CheckCircle2, GitCompareArrows, Loader2, Search, ShieldCheck, Sparkles } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Candidate = { id: string; canonical_name: string; country: string | null; resolution_confidence: number; similarity_score: number; activity_12m: number }
type Binding = { id: string; identity_id: string; canonical_name: string; country: string | null; resolution_confidence: number; updated_at: string }
type Organization = { id: string; name: string; slug: string; role: string; binding: Binding | null }
type Market = { current_filings: number; previous_filings: number; current_companies: number; previous_companies: number; entrant_companies: number; experimental_companies: number }
type Gap = { code: string; asset_type: "patent" | "trademark"; classification: "IPC" | "Niza"; own_filings: number; competitor_filings: number; competitor_active_quarters: number; market: Market }
type Recommendation = Gap & {
  score: { total: number; tier: "alta" | "media" | "observacion"; components: { materiality: number; novelty: number; convergence: number; persistence: number; proximity: number } }
  headline: string
  action: string
  evidence: string[]
  guardrail: string
}
type GapResult = {
  own: { id: string; canonical_name: string; country: string | null; resolution_confidence: number }
  competitor: { id: string; canonical_name: string; country: string | null; resolution_confidence: number }
  metrics: { patent_gaps: number; trademark_gaps: number; overlaps: number; experimental_only: number; high_recommendations: number }
  gaps: { patent: Gap[]; trademark: Gap[] }
  experimental_only: Gap[]
  overlaps: Gap[]
  own_only: Gap[]
  recommendations: Recommendation[]
  methodology: { gap: string; experimental: string; score: string; guardrail: string }
}

export default function PortfolioGapPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState("")
  const [ownQuery, setOwnQuery] = useState("")
  const [ownCandidates, setOwnCandidates] = useState<Candidate[]>([])
  const [competitorQuery, setCompetitorQuery] = useState("")
  const [competitorCandidates, setCompetitorCandidates] = useState<Candidate[]>([])
  const [result, setResult] = useState<GapResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchingOwn, setSearchingOwn] = useState(false)
  const [searchingCompetitor, setSearchingCompetitor] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedOrg = useMemo(() => organizations.find(item => item.id === selectedOrgId) ?? organizations[0] ?? null, [organizations, selectedOrgId])

  useEffect(() => { void loadOrganizations() }, [])

  async function loadOrganizations() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/intelligence/portfolio-binding", { cache: "no-store" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos cargar tu portafolio.")
      const next = (payload.organizations ?? []) as Organization[]
      setOrganizations(next)
      setSelectedOrgId(current => next.some(item => item.id === current) ? current : next[0]?.id ?? "")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos cargar tu portafolio.")
    } finally {
      setLoading(false)
    }
  }

  async function searchIdentities(query: string) {
    const response = await fetch(`/api/intelligence/company-identities?q=${encodeURIComponent(query.trim())}`, { cache: "no-store" })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(payload.error || "No pudimos buscar la empresa.")
    return (payload.candidates ?? []) as Candidate[]
  }

  async function searchOwn(event: FormEvent) {
    event.preventDefault()
    if (ownQuery.trim().length < 2 || searchingOwn) return
    setSearchingOwn(true)
    setError(null)
    try { setOwnCandidates(await searchIdentities(ownQuery)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos buscar la empresa.") }
    finally { setSearchingOwn(false) }
  }

  async function bindOwn(candidate: Candidate) {
    if (!selectedOrg) return
    setSearchingOwn(true)
    setError(null)
    try {
      const response = await fetch("/api/intelligence/portfolio-binding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: selectedOrg.id, identityId: candidate.id }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos vincular la empresa.")
      setOrganizations((payload.organizations ?? []) as Organization[])
      setOwnCandidates([])
      setOwnQuery("")
      setResult(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos vincular la empresa.")
    } finally {
      setSearchingOwn(false)
    }
  }

  async function searchCompetitor(event: FormEvent) {
    event.preventDefault()
    if (competitorQuery.trim().length < 2 || searchingCompetitor) return
    setSearchingCompetitor(true)
    setError(null)
    try { setCompetitorCandidates(await searchIdentities(competitorQuery)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos buscar el competidor.") }
    finally { setSearchingCompetitor(false) }
  }

  async function analyzeCompetitor(candidate: Candidate) {
    if (!selectedOrg?.binding) return
    setAnalyzing(true)
    setError(null)
    setCompetitorCandidates([])
    try {
      const params = new URLSearchParams({ organizationId: selectedOrg.id, competitorIdentityId: candidate.id })
      const response = await fetch(`/api/intelligence/portfolio-gap?${params.toString()}`, { cache: "no-store" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos comparar los portafolios.")
      setResult(payload as GapResult)
      setCompetitorQuery(candidate.canonical_name)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos comparar los portafolios.")
    } finally {
      setAnalyzing(false)
    }
  }

  return <OperationalPage>
    <OperationalHeader
      eyebrow="VIDENTIA / Brechas IP"
      title="Qué está cubriendo el competidor que tú no."
      description={<>Compara una identidad corporativa vinculada explícitamente a tu organización contra un competidor. Las brechas requieren actividad repetida; las recomendaciones muestran la evidencia y los factores que explican su prioridad.</>}
      meta={<><span>Binding auditable</span><span>IPC + Niza</span><span>360 días</span><span>Score explicable</span></>}
      actions={<Button asChild variant="outline"><Link href="/espacios">Explorar espacios <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>}
    />

    {loading ? <section className="py-12"><div className="flex items-center gap-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Cargando organizaciones y binding…</div></section> : null}
    {error ? <div role="alert" className="mt-6 rounded-[10px] bg-[#3A2525] p-4 text-sm text-[#E8AAA3]">{error}</div> : null}

    {!loading && !organizations.length ? <section className="py-14"><AlertTriangle className="h-6 w-6 text-[#C9A56A]" /><h2 className="mt-4 text-xl font-medium text-white">No hay una organización disponible.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">La comparación necesita una organización para definir de forma explícita qué identidad representa el portafolio propio.</p></section> : null}

    {!loading && organizations.length ? <>
      <section className="grid gap-8 border-b border-border/80 py-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)] xl:gap-10">
        <div>
          <OperationalSectionHeader eyebrow="01 / Empresa propia" title="Identidad que representa tu portafolio" meta={selectedOrg?.role === "admin" ? "Editable" : "Sólo lectura"} />
          {organizations.length > 1 ? <label className="mt-5 block"><span className="mb-2 block text-xs text-muted-foreground">Organización</span><select value={selectedOrg?.id ?? ""} onChange={event => { setSelectedOrgId(event.target.value); setResult(null) }} className="h-11 w-full rounded-[10px] border border-border bg-card/40 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/45">{organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label> : null}

          {selectedOrg?.binding ? <div className="mt-5 border-y border-border/80 py-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><Badge variant="outline" className="rounded-md">Vinculada</Badge><span className="text-xs text-muted-foreground">{selectedOrg.name}</span></div><p className="mt-3 text-lg font-medium text-white">{selectedOrg.binding.canonical_name}</p><p className="mt-1 text-xs text-muted-foreground">{selectedOrg.binding.country || "País no informado"} · resolución {Math.round(selectedOrg.binding.resolution_confidence * 100)}%</p></div><CheckCircle2 className="h-5 w-5 text-primary" /></div></div> : <div className="mt-5 border-y border-border/80 py-6"><p className="text-sm font-medium text-white">Aún no hay empresa propia vinculada.</p><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">No la inferimos desde el perfil. Un administrador debe seleccionar la identidad corporativa exacta.</p></div>}

          {selectedOrg?.role === "admin" ? <form onSubmit={event => void searchOwn(event)} className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"><Input value={ownQuery} onChange={event => setOwnQuery(event.target.value)} placeholder={selectedOrg.binding ? "Buscar otra razón social" : "Buscar la razón social propia"} maxLength={160} /><Button variant="outline" disabled={ownQuery.trim().length < 2 || searchingOwn}>{searchingOwn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Buscar</Button></form> : null}
          {ownCandidates.length ? <CandidateList candidates={ownCandidates} action="Vincular" disabled={searchingOwn} onSelect={candidate => void bindOwn(candidate)} /> : null}
        </div>

        <aside>
          <OperationalPanel>
            <OperationalSectionHeader eyebrow="Control" title="Por qué es explícito" />
            <div className="mt-5 space-y-4 text-sm leading-6 text-muted-foreground"><p>Una organización puede operar con nombres comerciales distintos de sus titulares INAPI. VIDENTIA no usa <code className="text-xs text-foreground">profile.company_name</code> ni similitud textual para decidir qué activos son “propios”.</p><p className="border-t border-border/80 pt-4 text-xs leading-5">El binding queda ligado a una identidad corporativa canónica y sólo un administrador de la organización puede modificarlo.</p></div>
          </OperationalPanel>
        </aside>
      </section>

      <section className="border-b border-border/80 py-8">
        <OperationalSectionHeader eyebrow="02 / Competidor" title="Empresa contra la que quieres medir la brecha" meta={selectedOrg?.binding ? "Listo para comparar" : "Requiere empresa propia"} />
        <form onSubmit={event => void searchCompetitor(event)} className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]"><Input value={competitorQuery} onChange={event => setCompetitorQuery(event.target.value)} placeholder="Ej: Falabella, SQM, CMPC, Apple" maxLength={160} disabled={!selectedOrg?.binding} /><Button disabled={!selectedOrg?.binding || competitorQuery.trim().length < 2 || searchingCompetitor || analyzing}>{searchingCompetitor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Buscar competidor</Button></form>
        {competitorCandidates.length ? <CandidateList candidates={competitorCandidates} action="Comparar" disabled={analyzing} onSelect={candidate => void analyzeCompetitor(candidate)} /> : null}
        {analyzing ? <div className="mt-5 flex items-center gap-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Midiendo cobertura, mercado y persistencia…</div> : null}
      </section>
    </> : null}

    {result ? <Results result={result} /> : null}
  </OperationalPage>
}

function CandidateList({ candidates, action, disabled, onSelect }: { candidates: Candidate[]; action: string; disabled: boolean; onSelect: (candidate: Candidate) => void }) {
  return <div className="mt-4 divide-y divide-border/80 border-y border-border/80">{candidates.slice(0, 6).map(candidate => <div key={candidate.id} className="flex flex-col gap-3 px-2 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-medium text-white">{candidate.canonical_name}</p><p className="mt-1 text-xs text-muted-foreground">{candidate.country || "País no informado"} · {candidate.activity_12m} expedientes / 12m · similitud {Math.round(candidate.similarity_score * 100)}%</p></div><Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => onSelect(candidate)}>{action}</Button></div>)}</div>
}

function Results({ result }: { result: GapResult }) {
  const totalGaps = result.metrics.patent_gaps + result.metrics.trademark_gaps
  return <>
    <OperationalMetricRail>
      <OperationalMetric value={result.metrics.patent_gaps} label="Brechas técnicas" detail="IPC con actividad repetida sólo del competidor" tone={result.metrics.patent_gaps ? "warning" : "neutral"} />
      <OperationalMetric value={result.metrics.trademark_gaps} label="Brechas comerciales" detail="Niza con actividad repetida sólo del competidor" tone={result.metrics.trademark_gaps ? "warning" : "neutral"} />
      <OperationalMetric value={result.metrics.overlaps} label="Cobertura compartida" detail="Clasificaciones presentes en ambos" />
      <OperationalMetric value={result.metrics.high_recommendations} label="Prioridad alta" detail={`${totalGaps} brechas deterministas`} tone={result.metrics.high_recommendations ? "danger" : "neutral"} />
    </OperationalMetricRail>

    <section className="grid gap-8 border-b border-border/80 py-9 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] xl:gap-10">
      <div>
        <OperationalSectionHeader eyebrow="03 / Recomendaciones" title={`${result.own.canonical_name} vs ${result.competitor.canonical_name}`} meta={`${result.recommendations.length} priorizadas`} />
        <div className="mt-5 divide-y divide-border/80 border-y border-border/80">{result.recommendations.length ? result.recommendations.map(item => <RecommendationRow key={`${item.asset_type}-${item.code}`} item={item} />) : <div className="py-9"><ShieldCheck className="h-5 w-5 text-primary" /><p className="mt-3 text-sm font-medium text-white">No encontramos brechas repetidas suficientes.</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Las señales de una sola presentación siguen visibles como experimentales, pero no disparan una recomendación.</p></div>}</div>
      </div>
      <aside>
        <OperationalPanel>
          <OperationalSectionHeader eyebrow="Método" title="Score explicable" />
          <div className="mt-5 space-y-4 text-sm leading-6 text-muted-foreground"><p>{result.methodology.gap}</p><p>{result.methodology.experimental}</p><p className="border-t border-border/80 pt-4">{result.methodology.score}</p><p className="text-xs leading-5">{result.methodology.guardrail}</p></div>
        </OperationalPanel>
      </aside>
    </section>

    <section className="grid gap-8 py-9 xl:grid-cols-2 xl:gap-10">
      <GapList title="Brechas técnicas" eyebrow="IPC" gaps={result.gaps.patent} />
      <GapList title="Brechas comerciales" eyebrow="Niza" gaps={result.gaps.trademark} />
    </section>
  </>
}

function RecommendationRow({ item }: { item: Recommendation }) {
  const tone = item.score.tier === "alta" ? "border-red-400/20 bg-red-400/[0.06] text-red-300" : item.score.tier === "media" ? "border-amber-300/20 bg-amber-300/[0.06] text-amber-200" : "border-border bg-card/30 text-muted-foreground"
  const components = item.score.components
  return <article className="px-2 py-5"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className={`rounded-md ${tone}`}>{item.score.total}/100 · {item.score.tier}</Badge><Badge variant="outline" className="rounded-md">{item.classification} {item.code}</Badge></div><h3 className="mt-3 text-base font-medium text-white">{item.headline}</h3><p className="mt-2 text-sm leading-6 text-foreground">{item.action}</p><div className="mt-3 grid gap-1 text-xs leading-5 text-muted-foreground">{item.evidence.map(line => <span key={line}>• {line}</span>)}</div><p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Materialidad {components.materiality}/25 · Novedad {components.novelty}/20 · Convergencia {components.convergence}/20 · Persistencia {components.persistence}/20 · Proximidad {components.proximity}/15</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{item.guardrail}</p></article>
}

function GapList({ title, eyebrow, gaps }: { title: string; eyebrow: string; gaps: Gap[] }) {
  return <div><OperationalSectionHeader eyebrow={eyebrow} title={title} meta={`${gaps.length} visibles`} /><div className="mt-5 divide-y divide-border/80 border-y border-border/80">{gaps.length ? gaps.map(gap => <div key={`${gap.asset_type}-${gap.code}`} className="grid gap-3 px-2 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"><Badge variant="outline" className="w-fit rounded-md">{gap.code}</Badge><div><p className="text-sm text-white">{gap.competitor_filings} expedientes del competidor · {gap.competitor_active_quarters}/4 trimestres</p><p className="mt-1 text-xs text-muted-foreground">Mercado actual: {gap.market.current_companies} actores · {gap.market.entrant_companies} entrantes</p></div><GitCompareArrows className="h-4 w-4 text-muted-foreground" /></div>) : <div className="py-8 text-sm text-muted-foreground">Sin brechas repetidas en esta capa.</div>}</div></div>
}
