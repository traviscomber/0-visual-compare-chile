"use client"

import Link from "next/link"
import { FormEvent, useEffect, useState } from "react"
import { Activity, AlertTriangle, Building2, ExternalLink, FlaskConical, GitBranch, Loader2, Newspaper, Search, Tag, Waypoints } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { companyHref, portfolioGapHref, spaceHref, strategicWatchHref } from "@/lib/intelligence/navigation-context"

type Candidate = {
  id: string
  canonical_name: string
  country: string | null
  resolution_confidence: number
  similarity_score: number
  activity_12m: number
}
type Movement = { code: string; current: number; previous: number; delta: number }
type Evidence = {
  id: string
  entity_type: "patent" | "trademark"
  source_record_id: string
  applicant_raw: string
  title: string
  filing_date: string | null
  status: string | null
  classification_codes: string[]
  source_url: string | null
}
type ExternalItem = { source: string; title: string; date: string | null; url: string }
type Result = {
  query: string
  selected: Candidate | null
  candidates: Candidate[]
  aliases: string[]
  window: { current_start: string; current_end: string; previous_start: string; previous_end: string; days: number }
  metrics: {
    current_total: number
    previous_total: number
    delta: number
    delta_pct: number | null
    current_patents: number
    previous_patents: number
    current_trademarks: number
    previous_trademarks: number
  }
  new_ipc: Movement[]
  new_niza: Movement[]
  rising_ipc: Movement[]
  rising_niza: Movement[]
  direction: Direction | null
  recent_evidence: Evidence[]
  external: {
    openalex_current: number | null
    openalex_previous: number | null
    publications: ExternalItem[]
    news: ExternalItem[]
    errors: string[]
  }
}
type Direction = {
  headline: string
  observed_fact: string
  interpretation: string
  why_it_matters: string
  confidence: number
  evidence_level: "alta" | "media" | "baja"
  guardrail: string
}
type TrajectorySignal = {
  code: string
  asset_type: "patent" | "trademark"
  state: "emerging" | "accelerating" | "persistent" | "declining" | "experimental" | "stable"
  windows: [number, number, number, number]
  current: number
  prior: number
  total: number
  active_quarters: number
  momentum: number
  confidence: number
}
type TrajectoryBucket = {
  emerging: TrajectorySignal[]
  accelerating: TrajectorySignal[]
  persistent: TrajectorySignal[]
  declining: TrajectorySignal[]
  experimental: TrajectorySignal[]
}
type TrajectoryResult = {
  generated_at: string
  identity: { id: string; canonical_name: string; country: string | null; resolution_confidence: number }
  trajectory: {
    window_days: 360
    quarters: Array<{ key: string; label: string; start: string; end: string; patents: number; trademarks: number; total: number }>
    technical: TrajectoryBucket
    commercial: TrajectoryBucket
    direction: Direction | null
  }
  graph: null | {
    identity: Record<string, unknown> | null
    legacy: {
      linkedEntities: number
      brandCount: number
      links: Array<{ entity_id: string; legacy_name: string; link_type: string; confidence: number; rut: string | null }>
      brands: Array<{ id: string; canonical_name: string; external_key: string | null; relationship_type: string; confidence: number }>
    }
    corporateRelationships: Array<{
      id: string
      relationship_type: string
      confidence: number
      related_name: string
      related_country: string | null
      direction: string
      evidence_source_key: string | null
      observed_at: string
    }>
    activity12m: { total_12m: number; patents_12m: number; trademarks_12m: number; classification_count: number }
    methodology: { identityLink: string; corporateLinks: string }
  }
}

export default function CompaniesPage() {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<Result | null>(null)
  const [trajectory, setTrajectory] = useState<TrajectoryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runSearch(event?: FormEvent, identityId?: string, queryOverride?: string, syncUrl: boolean = true) {
    event?.preventDefault()
    const nextQuery = (queryOverride ?? query).trim()
    if (nextQuery.length < 2 || loading) return
    setLoading(true)
    setError(null)
    setTrajectory(null)
    try {
      const params = new URLSearchParams({ q: nextQuery })
      if (identityId) params.set("identityId", identityId)
      if (syncUrl && typeof window !== "undefined") window.history.replaceState(null, "", companyHref(nextQuery, identityId))
      const response = await fetch(`/api/intelligence/company-direction?${params.toString()}`, { cache: "no-store" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos analizar la empresa.")
      const company = payload as Result
      setResult(company)
      if (company.selected && syncUrl && typeof window !== "undefined") window.history.replaceState(null, "", companyHref(company.selected.canonical_name, company.selected.id))

      if (company.selected?.id) {
        const trajectoryResponse = await fetch(`/api/intelligence/company-trajectory?identityId=${encodeURIComponent(company.selected.id)}`, { cache: "no-store" })
        const trajectoryPayload = await trajectoryResponse.json().catch(() => ({}))
        if (!trajectoryResponse.ok) throw new Error(trajectoryPayload.error || "No pudimos construir la trayectoria tecnológica.")
        setTrajectory(trajectoryPayload as TrajectoryResult)
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos analizar la empresa.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requestedCompany = params.get("company")?.trim()
    if (!requestedCompany) return
    const requestedIdentity = params.get("identityId")?.trim() || undefined
    setQuery(requestedCompany)
    void runSearch(undefined, requestedIdentity, requestedCompany, false)
  }, [])

  const deltaPct = result?.metrics.delta_pct
  const deltaLabel = deltaPct == null
    ? "Sin base previa"
    : `${deltaPct > 0 ? "+" : ""}${deltaPct}% vs semestre anterior`

  return <OperationalPage>
    <OperationalHeader
      eyebrow="VIDENTIA / Empresas"
      title="Qué protege, qué cambia y hacia dónde se mueve."
      description={<>Compara dos semestres consecutivos y, además, cuatro ventanas de 90 días para separar aparición, aceleración, persistencia y señales experimentales. La identidad corporativa se enlaza al grafo histórico sin fusionar subsidiarias por similitud.</>}
      meta={<><span>INAPI</span><span>IPC + Niza</span><span>Grafo de entidades</span><span>OpenAlex + Crossref + GDELT</span></>}
      actions={<Button asChild variant="outline"><Link href="/fuentes">Estado de fuentes</Link></Button>}
    />

    <section className="border-b border-border/80 py-8">
      <form onSubmit={event => void runSearch(event)} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <Input value={query} onChange={event => setQuery(event.target.value)} maxLength={160} placeholder="Ej: Falabella, SQM, CMPC, Apple" aria-label="Empresa o titular" />
        <Button disabled={query.trim().length < 2 || loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Analizar empresa</Button>
      </form>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">VIDENTIA une variantes tipográficas y jurídicas conservadoras. Relaciones matriz/filial/grupo sólo aparecen cuando existe evidencia explícita; no se infieren por nombre.</p>
    </section>

    {error ? <div role="alert" className="mt-6 border border-[#D6A46F]/20 bg-[#332C24]/70 p-4 text-sm text-[#E0B987]">{error}</div> : null}
    {!result && !loading ? <InitialState /> : null}
    {result && !result.selected ? <NoMatch /> : null}

    {result?.selected ? <>
      <OperationalMetricRail>
        <OperationalMetric value={result.metrics.current_total} label="Expedientes / 180 días" detail={deltaLabel} tone={result.metrics.delta > 0 ? "success" : "neutral"} />
        <OperationalMetric value={result.metrics.current_patents} label="Patentes" detail={`${result.metrics.previous_patents} en los 180 días anteriores`} />
        <OperationalMetric value={result.metrics.current_trademarks} label="Marcas" detail={`${result.metrics.previous_trademarks} en los 180 días anteriores`} />
        <OperationalMetric value={result.new_ipc.length + result.new_niza.length} label="Áreas nuevas" detail="IPC + Niza ausentes en el semestre anterior" tone={result.new_ipc.length + result.new_niza.length ? "success" : "neutral"} />
      </OperationalMetricRail>

      <IdentitySection result={result} loading={loading} onSelect={id => void runSearch(undefined, id)} />
      <DirectionSection result={result} />
      {trajectory ? <TrajectorySection data={trajectory} /> : loading ? <LoadingSection label="Construyendo trayectoria y grafo…" /> : null}
      {trajectory?.graph ? <GraphSection graph={trajectory.graph} /> : null}
      <ProtectionDeltaSection result={result} />
      <EvidenceSection evidence={result.recent_evidence} />
      <ExternalSignalsSection result={result} />
    </> : null}
  </OperationalPage>
}

function InitialState() {
  return <section className="py-14"><Building2 className="h-6 w-6 text-[#96B5A6]" /><h2 className="mt-4 text-xl font-medium text-white">Analiza la trayectoria observable de una empresa.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">VIDENTIA compara 12 meses de actividad IP, resuelve variantes de titular y distingue una señal aislada de un movimiento repetido.</p></section>
}
function NoMatch() {
  return <section className="py-14"><AlertTriangle className="h-5 w-5 text-[#C9A56A]" /><p className="mt-3 font-medium text-white">No encontramos una identidad suficientemente cercana.</p><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Prueba con la razón social completa o el nombre que aparece como solicitante/titular en INAPI.</p></section>
}
function LoadingSection({ label }: { label: string }) {
  return <section className="border-b border-border/80 py-9"><div className="flex items-center gap-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{label}</div></section>
}

function IdentitySection({ result, loading, onSelect }: { result: Result; loading: boolean; onSelect: (id: string) => void }) {
  const selected = result.selected
  if (!selected) return null
  const alternatives = result.candidates.filter(item => item.id !== selected.id).slice(0, 5)
  return <section className="border-b border-border/80 py-8"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Identidad resuelta</p><h2 className="mt-2 text-xl font-medium text-white">{selected.canonical_name}</h2><p className="mt-2 text-sm text-muted-foreground">{selected.country ? `País ${selected.country} · ` : ""}{result.aliases.length} alias observados · {selected.activity_12m} expedientes en 12 meses · confianza {Math.round(selected.resolution_confidence * 100)}%</p>{result.aliases.length > 1 ? <p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">Variantes: {result.aliases.slice(0, 5).join(" · ")}</p> : null}<div className="mt-4 flex flex-wrap gap-2"><Button asChild size="sm" variant="outline"><Link href={strategicWatchHref("company", selected.canonical_name)}>Vigilar empresa</Link></Button><Button asChild size="sm" variant="outline"><Link href={portfolioGapHref(selected.canonical_name, selected.id)}>Comparar brecha</Link></Button></div></div>{alternatives.length ? <div className="min-w-0 lg:max-w-xl"><p className="text-xs text-muted-foreground">¿Buscabas otra identidad?</p><div className="mt-2 flex flex-wrap gap-2">{alternatives.map(item => <Button key={item.id} variant="outline" size="sm" disabled={loading} onClick={() => onSelect(item.id)}>{item.canonical_name}</Button>)}</div></div> : null}</div></section>
}

function DirectionSection({ result }: { result: Result }) {
  const direction = result.direction
  if (!direction) return <section className="border-b border-border/80 py-9"><OperationalSectionHeader eyebrow="Cambio semestral" title="Dirección observada" /><p className="mt-4 text-sm leading-6 text-muted-foreground">No hay suficiente actividad para comparar dos ventanas semestrales.</p></section>
  return <section className="border-b border-border/80 py-9"><OperationalSectionHeader eyebrow="Cambio semestral" title="Dirección observada" action={<span className="text-xs text-muted-foreground">Confianza {direction.confidence}/100 · evidencia {direction.evidence_level}</span>} /><h3 className="mt-5 max-w-4xl text-2xl font-medium leading-8 text-white">{direction.headline}</h3><DirectionFacts direction={direction} /></section>
}

function TrajectorySection({ data }: { data: TrajectoryResult }) {
  const { trajectory } = data
  const direction = trajectory.direction
  return <section className="border-b border-border/80 py-9">
    <OperationalSectionHeader eyebrow="Trayectoria 360 días" title="Hacia dónde se está moviendo la protección" action={direction ? <span className="text-xs text-muted-foreground">Confianza {direction.confidence}/100 · {direction.evidence_level}</span> : undefined} />
    <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">Cuatro ventanas de 90 días permiten distinguir una aparición reciente de una trayectoria persistente. Una única presentación nueva se clasifica como <strong className="font-medium text-[#D8C49C]">experimental</strong>, no como dirección estratégica.</p>
    <div className="mt-6 grid gap-px bg-border/70 sm:grid-cols-2 xl:grid-cols-4">{trajectory.quarters.map((quarter, index) => <div key={quarter.key} className="bg-background p-5"><p className="text-[10px] uppercase tracking-[0.13em] text-muted-foreground">Q{index} · {quarter.label}</p><p className="mt-3 text-2xl font-light text-[#E7DFCE]">{quarter.total}</p><p className="mt-1 text-xs text-muted-foreground">{quarter.patents} patentes · {quarter.trademarks} marcas</p><p className="mt-2 text-[10px] text-muted-foreground">{formatDate(quarter.start)} → {formatDate(quarter.end)}</p></div>)}</div>
    {direction ? <><h3 className="mt-7 max-w-4xl text-2xl font-medium leading-8 text-white">{direction.headline}</h3><DirectionFacts direction={direction} /></> : null}
    <div className="mt-8 grid gap-8 xl:grid-cols-2">
      <TrajectoryDomain icon={FlaskConical} title="Dirección técnica · IPC" bucket={trajectory.technical} />
      <TrajectoryDomain icon={Tag} title="Dirección comercial · Niza" bucket={trajectory.commercial} />
    </div>
  </section>
}

function TrajectoryDomain({ icon: Icon, title, bucket }: { icon: typeof Activity; title: string; bucket: TrajectoryBucket }) {
  return <div><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-[#96B5A6]" /><h3 className="font-medium text-white">{title}</h3></div><div className="mt-4 space-y-5"><SignalGroup label="Emergente" items={bucket.emerging} detail="≥2 expedientes recientes; ausente en los 270 días previos" /><SignalGroup label="Acelerando" items={bucket.accelerating} detail="Actividad reciente superior al patrón de los trimestres previos" /><SignalGroup label="Núcleo persistente" items={bucket.persistent} detail="Presente en ≥3 de 4 trimestres" /><SignalGroup label="Declinando" items={bucket.declining} detail="Pierde intensidad frente al trimestre anterior" /><SignalGroup label="Experimental" items={bucket.experimental} detail="Una sola aparición reciente; no se interpreta como dirección" /></div></div>
}
function SignalGroup({ label, items, detail }: { label: string; items: TrajectorySignal[]; detail: string }) {
  if (!items.length) return null
  return <div><div className="flex items-baseline justify-between gap-3"><p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="text-[10px] text-muted-foreground">{detail}</p></div><div className="mt-2 divide-y divide-border/80 border-y border-border/80">{items.map(item => <div key={`${item.asset_type}:${item.code}:${item.state}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-3"><div><p className="font-medium text-white">{item.code}</p><p className="mt-1 text-[11px] text-muted-foreground">Q0/Q1/Q2/Q3 · {item.windows.join(" / ")} · confianza {item.confidence}</p></div><div className="flex items-center gap-2"><p className="text-sm text-[#96B5A6]">{item.total} exp.</p><Button asChild size="sm" variant="ghost"><Link href={spaceHref(item.asset_type, item.code)}>Abrir espacio</Link></Button></div></div>)}</div></div>
}

function GraphSection({ graph }: { graph: NonNullable<TrajectoryResult["graph"]> }) {
  const activity = graph.activity12m
  return <section className="border-b border-border/80 py-9">
    <OperationalSectionHeader eyebrow="Entity Graph V2" title="La empresa dentro del grafo de propiedad intelectual" meta={`${graph.legacy.linkedEntities} enlaces legacy exactos`} />
    <OperationalMetricRail className="mt-6 border-t border-border/80">
      <OperationalMetric value={activity.total_12m} label="Expedientes / 12m" detail={`${activity.patents_12m} patentes · ${activity.trademarks_12m} marcas`} />
      <OperationalMetric value={activity.classification_count} label="Clases distintas" detail="IPC + Niza observadas en los últimos 12 meses" />
      <OperationalMetric value={graph.legacy.brandCount.toLocaleString("es-CL")} label="Marcas históricas" detail={`${graph.legacy.linkedEntities} enlaces legacy exactos`} />
      <OperationalMetric value={graph.corporateRelationships.length} label="Relaciones corporativas verificadas" detail="Matriz, filiales o grupo con evidencia explícita" />
    </OperationalMetricRail>
    <div className="mt-8 grid gap-8 xl:grid-cols-[1.05fr_.95fr]">
      <div><div className="flex items-center gap-2"><Waypoints className="h-4 w-4 text-[#96B5A6]" /><h3 className="font-medium text-white">Marcas conectadas al titular histórico</h3></div><div className="mt-4 flex flex-wrap gap-2">{graph.legacy.brands.slice(0, 18).map(brand => <Badge key={brand.id} variant="outline" className="bg-[#13272D]">{brand.canonical_name}</Badge>)}</div>{graph.legacy.brandCount > 18 ? <p className="mt-3 text-xs text-muted-foreground">Se muestran 18 de {graph.legacy.brandCount.toLocaleString("es-CL")} marcas enlazadas.</p> : null}</div>
      <div><div className="flex items-center gap-2"><GitBranch className="h-4 w-4 text-[#96B5A6]" /><h3 className="font-medium text-white">Matriz, filiales y grupo</h3></div>{graph.corporateRelationships.length ? <div className="mt-4 divide-y divide-border/80 border-y border-border/80">{graph.corporateRelationships.map(relation => <div key={relation.id} className="py-3"><p className="text-sm font-medium text-white">{relation.related_name}</p><p className="mt-1 text-xs text-muted-foreground">{relation.relationship_type} · confianza {Math.round(relation.confidence * 100)}% · {relation.evidence_source_key ?? "validación manual"}</p></div>)}</div> : <OperationalPanel className="mt-4"><p className="text-sm text-[#D5E0E3]">No hay una relación matriz/filial/grupo suficientemente verificada para esta identidad.</p><p className="mt-2 text-xs leading-5 text-muted-foreground">VIDENTIA no completa este vacío por similitud de nombre. La relación aparecerá cuando exista evidencia societaria, regulatoria o validación explícita.</p></OperationalPanel>}</div>
    </div>
  </section>
}

function ProtectionDeltaSection({ result }: { result: Result }) {
  return <section className="border-b border-border/80 py-9"><OperationalSectionHeader eyebrow="Cobertura nueva" title="Qué aparece ahora y no aparecía hace seis meses" /><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Sólo se muestran clasificaciones presentes en los últimos 180 días y ausentes en los 180 días anteriores. Una clase nueva indica expansión observable de cobertura, no necesariamente una tecnología o negocio completamente nuevo.</p><div className="mt-7 grid gap-8 xl:grid-cols-2"><MovementList type="patent" icon={FlaskConical} title="Nuevas áreas técnicas · IPC" items={result.new_ipc} empty="No aparecen nuevas subclases IPC en la ventana actual." /><MovementList type="trademark" icon={Tag} title="Nuevas áreas comerciales · Niza" items={result.new_niza} empty="No aparecen nuevas clases Niza en la ventana actual." /></div></section>
}
function MovementList({ type, icon: Icon, title, items, empty }: { type: "patent" | "trademark"; icon: typeof Activity; title: string; items: Movement[]; empty: string }) {
  return <div><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-[#96B5A6]" /><h3 className="font-medium text-white">{title}</h3></div>{items.length ? <div className="mt-4 divide-y divide-border/80 border-y border-border/80">{items.map(item => <div key={item.code} className="flex items-center justify-between gap-4 py-4"><div><p className="font-medium text-white">{item.code}</p><p className="mt-1 text-xs text-muted-foreground">Ausente en el semestre anterior</p></div><div className="flex items-center gap-3"><div className="text-right"><p className="text-lg text-[#96B5A6]">{item.current}</p><p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">expedientes</p></div><Button asChild size="sm" variant="ghost"><Link href={spaceHref(type, item.code)}>Abrir espacio</Link></Button></div></div>)}</div> : <p className="mt-4 border-y border-border/80 py-6 text-sm text-muted-foreground">{empty}</p>}</div>
}

function EvidenceSection({ evidence }: { evidence: Evidence[] }) {
  return <section className="border-b border-border/80 py-9"><OperationalSectionHeader eyebrow="Evidencia INAPI" title="Expedientes que sostienen la lectura" />{evidence.length ? <div className="mt-5 divide-y divide-border/80 border-y border-border/80">{evidence.map(item => <article key={item.id} className="grid gap-3 py-5 sm:grid-cols-[34px_minmax(0,1fr)_auto] sm:items-start"><span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#173B37] text-[#96B5A6]">{item.entity_type === "patent" ? <FlaskConical className="h-3.5 w-3.5" /> : <Tag className="h-3.5 w-3.5" />}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="bg-[#13272D]">{item.entity_type === "patent" ? "Patente" : "Marca"}</Badge>{item.filing_date ? <span className="text-xs text-muted-foreground">{formatDate(item.filing_date)}</span> : null}{item.classification_codes.slice(0, 4).map(code => <span key={code} className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{code}</span>)}</div><p className="mt-2 font-medium leading-6 text-white">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.applicant_raw}{item.status ? ` · ${item.status}` : ""}</p></div>{item.source_url ? <Button asChild variant="ghost" size="sm"><a href={item.source_url} target="_blank" rel="noreferrer">Fuente <ExternalLink className="h-3.5 w-3.5" /></a></Button> : null}</article>)}</div> : <p className="mt-5 text-sm text-muted-foreground">No hay expedientes recientes en la ventana actual.</p>}</section>
}

function ExternalSignalsSection({ result }: { result: Result }) {
  const external = result.external
  const hasExternal = external.publications.length || external.news.length || external.openalex_current !== null
  if (!hasExternal && !external.errors.length) return null
  return <section className="py-9"><OperationalSectionHeader eyebrow="Contexto externo" title="Señales externas para contrastar" /><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Estas señales se buscan por el nombre resuelto. Sirven para contrastar contexto científico o público; no son prueba de identidad ni de intención corporativa por sí solas.</p>{external.openalex_current !== null ? <div className="mt-5 border-y border-border/80 py-4 text-sm text-muted-foreground">OpenAlex: <span className="text-white">{external.openalex_current}</span> publicaciones coincidentes en la ventana actual{external.openalex_previous !== null ? <> vs <span className="text-white">{external.openalex_previous}</span> en la anterior</> : null}.</div> : null}<div className="mt-7 grid gap-8 xl:grid-cols-2"><ExternalList icon={Activity} title="Publicaciones" items={external.publications} /><ExternalList icon={Newspaper} title="Noticias recientes" items={external.news} /></div>{external.errors.length ? <p className="mt-6 text-xs text-muted-foreground">Fuentes temporalmente no disponibles: {external.errors.map(item => item.split(":")[0]).join(", ")}.</p> : null}</section>
}
function ExternalList({ icon: Icon, title, items }: { icon: typeof Activity; title: string; items: ExternalItem[] }) {
  return <div><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-[#96B5A6]" /><h3 className="font-medium text-white">{title}</h3></div>{items.length ? <div className="mt-4 divide-y divide-border/80 border-y border-border/80">{items.map(item => <a key={item.url} href={item.url} target="_blank" rel="noreferrer" className="block py-4 transition-colors hover:text-white"><div className="flex items-center gap-2"><span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{item.source}</span>{item.date ? <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span> : null}</div><p className="mt-1 text-sm leading-6 text-[#D5E0E3]">{item.title}</p></a>)}</div> : <p className="mt-4 border-y border-border/80 py-6 text-sm text-muted-foreground">Sin señales coincidentes.</p>}</div>
}

function DirectionFacts({ direction }: { direction: Direction }) {
  return <><div className="mt-7 grid gap-7 lg:grid-cols-3"><Fact label="Hecho observado" text={direction.observed_fact} /><Fact label="Interpretación" text={direction.interpretation} /><Fact label="Por qué importa" text={direction.why_it_matters} /></div><div className="mt-6 flex max-w-4xl gap-3 border-l-2 border-[#C9A56A] pl-4"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A56A]" /><p className="text-xs leading-5 text-[#D8C49C]">{direction.guardrail}</p></div></>
}
function Fact({ label, text }: { label: string; text: string }) { return <div><p className="text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground">{label}</p><p className="mt-2 text-sm leading-6 text-[#D5E0E3]">{text}</p></div> }
function formatDate(value: string) { const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value); const date = new Date(dateOnly ? `${value}T12:00:00Z` : value); if (Number.isNaN(date.getTime())) return value; return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeZone: dateOnly ? "UTC" : "America/Santiago" }).format(date) }
