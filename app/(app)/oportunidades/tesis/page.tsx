"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, BrainCircuit, ExternalLink, Loader2, Minus, RefreshCw, TrendingDown, TrendingUp } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Organization = { id: string; name: string; slug: string; role: string }
type ResearchComparison = {
  baseline?: boolean
  evidence_delta?: number
  timing_delta?: number
  confidence_delta?: number
  overall_delta?: number
  direction?: "strengthening" | "weakening" | "stable" | "baseline"
  reasons?: string[]
  news_non_scoring?: boolean
}
type ResearchRun = {
  id: string
  run_type: "generated" | "live_research" | "scheduled_research" | "human_review"
  evidence_summary?: {
    comparison?: ResearchComparison
    facts?: string[]
    market_state?: Record<string, unknown>
  }
  score_snapshot?: { overall?: number; evidence_strength?: number; timing?: number }
  confidence: number | null
  observed_at: string
  created_at: string
}
type SavedOpportunity = {
  id: string
  title: string
  status: "exploring" | "watching" | "prototype" | "rejected" | "archived"
  decision: "build" | "investigate" | "watch" | "reject"
  evidence_state: "observed" | "mixed" | "hypothesis"
  confidence: number
  overall_score: number
  evidence_strength: number
  timing_score: number
  research_queries: string[]
  watch_triggers: string[]
  thesis: {
    one_line?: string
    target_buyer?: string
    problem?: string
    why_now?: string
    unfair_advantage?: string
    missing_evidence?: string[]
    disconfirming_signals?: string[]
  }
  source_website_url: string
  source_generated_at: string
  model: string
  last_researched_at: string | null
  created_at: string
  updated_at: string
  research_history: ResearchRun[]
}

const statusLabel: Record<SavedOpportunity["status"], string> = {
  exploring: "Explorando",
  watching: "Vigilando",
  prototype: "Prototipo",
  rejected: "Descartada",
  archived: "Archivada",
}

export default function SavedOpportunityThesesPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [organizationId, setOrganizationId] = useState("")
  const [items, setItems] = useState<SavedOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [researchingId, setResearchingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { void loadOrganizations() }, [])
  useEffect(() => { if (organizationId) void loadTheses(organizationId) }, [organizationId])

  async function loadOrganizations() {
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

  async function loadTheses(nextOrganizationId: string) {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/intelligence/opportunity-theses?organizationId=${encodeURIComponent(nextOrganizationId)}`, { cache: "no-store" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos cargar las tesis guardadas.")
      setItems((payload.opportunities ?? []) as SavedOpportunity[])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos cargar las tesis guardadas.")
    } finally {
      setLoading(false)
    }
  }

  async function researchThesis(item: SavedOpportunity) {
    if (!organizationId || researchingId) return
    setResearchingId(item.id)
    setError(null)
    try {
      const response = await fetch(`/api/intelligence/opportunity-theses/${encodeURIComponent(item.id)}/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos re-investigar la tesis.")
      await loadTheses(organizationId)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos re-investigar la tesis.")
    } finally {
      setResearchingId(null)
    }
  }

  const active = useMemo(() => items.filter(item => !["rejected", "archived"].includes(item.status)), [items])
  const prototype = active.filter(item => item.status === "prototype" || item.decision === "build").length
  const watching = active.filter(item => item.status === "watching" || item.decision === "watch").length
  const avgEvidence = active.length ? Math.round(active.reduce((sum, item) => sum + item.evidence_strength, 0) / active.length) : 0
  const changing = active.filter(item => {
    const comparison = latestComparison(item.research_history)
    return comparison?.direction === "strengthening" || comparison?.direction === "weakening"
  }).length

  return <OperationalPage>
    <OperationalHeader
      eyebrow="VIDENTIA / Opportunity Engine / Tesis"
      title={active.length ? `${active.length} tesis de producto bajo seguimiento.` : "Todavía no hay tesis persistentes."}
      description="Cada tesis conserva una línea de convicción. VIDENTIA vuelve a observar investigación y patentes, compara contra el snapshot anterior y sólo mueve score cuando cambian los ejes duros; noticias permanecen como contexto no puntuable."
      meta={<><span>Human-promoted</span><span>Conviction curve</span><span>Delta evidence</span><span>No auto-build</span></>}
      actions={<div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/oportunidades"><ArrowLeft className="h-4 w-4" /> Oportunidades</Link></Button><Button asChild><Link href="/oportunidades/descubrir"><BrainCircuit className="h-4 w-4" /> Descubrir productos</Link></Button></div>}
    />

    <OperationalMetricRail>
      <OperationalMetric value={active.length} label="Activas" detail="Promovidas por una persona" tone={active.length ? "success" : "neutral"} />
      <OperationalMetric value={prototype} label="Para prototipar" detail="Nunca promovidas automáticamente por research" tone={prototype ? "success" : "neutral"} />
      <OperationalMetric value={changing} label="Con movimiento" detail="Último research cambió convicción" tone={changing ? "warning" : "neutral"} />
      <OperationalMetric value={`${avgEvidence}/100`} label="Fuerza de evidencia" detail="Promedio de tesis activas" tone={avgEvidence >= 70 ? "success" : avgEvidence >= 45 ? "warning" : "neutral"} />
    </OperationalMetricRail>

    <section className="grid gap-8 border-b border-border/80 py-8 xl:grid-cols-[minmax(0,1.25fr)_320px] xl:gap-10">
      <div>
        <OperationalSectionHeader eyebrow="01 / Portfolio de tesis" title="Convicción que debe ganarse, no asumirse." meta={`${items.length} guardadas`} />
        {organizations.length > 1 ? <label className="mt-5 block max-w-md"><span className="mb-2 block text-xs text-muted-foreground">Organización</span><select value={organizationId} onChange={event => setOrganizationId(event.target.value)} className="h-11 w-full rounded-[10px] border border-border bg-card/40 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/45">{organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label> : null}
        {loading ? <div className="flex items-center gap-3 py-12 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Cargando tesis…</div> : null}
        {error ? <div role="alert" className="mt-6 border-y border-[#7A5B41]/45 bg-[#332C24]/35 px-4 py-4 text-sm text-[#D6C3A8]">{error}</div> : null}
        {!loading && !error ? <div className="mt-5 divide-y divide-border/80 border-y border-border/80">{items.length ? items.map(item => <ThesisRow key={item.id} item={item} researching={researchingId === item.id} onResearch={() => void researchThesis(item)} />) : <div className="py-10"><p className="text-sm font-medium text-white">Ninguna tesis ha cruzado todavía el gate humano.</p><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Ejecuta Opportunity Engine, revisa por qué una propuesta podría funcionar y guárdala sólo si merece seguimiento real.</p><Button asChild size="sm" className="mt-4"><Link href="/oportunidades/descubrir">Descubrir productos</Link></Button></div>}</div> : null}
      </div>

      <aside><OperationalPanel><OperationalSectionHeader eyebrow="Regla" title="Persistencia ≠ aprobación." /><div className="mt-5 space-y-4 text-sm leading-6 text-muted-foreground"><p>La primera re-investigación establece un baseline estructurado y mueve <span className="text-foreground">0 puntos</span>. Después, sólo cambios respecto del baseline pueden fortalecer o debilitar una tesis.</p><p className="border-t border-border/80 pt-4">Si OpenAlex o INAPI no responden, VIDENTIA no castiga la tesis por ausencia de fuente. GDELT/noticias nunca suben score por volumen.</p><p className="border-t border-border/80 pt-4">Research puede mantener o degradar una recomendación. Nunca transforma automáticamente una tesis en <span className="text-foreground">Prototipo</span> o autorización de inversión.</p></div></OperationalPanel></aside>
    </section>
  </OperationalPage>
}

function ThesisRow({ item, researching, onResearch }: { item: SavedOpportunity; researching: boolean; onResearch: () => void }) {
  const scoreTone = item.evidence_strength >= 70 ? "border-[#96B5A6]/30 bg-[#173B37]/65 text-[#B8D0C2]" : item.evidence_strength >= 45 ? "border-[#D6A46F]/30 bg-[#332C24]/65 text-[#E0B987]" : "border-border bg-card/30 text-muted-foreground"
  const comparison = latestComparison(item.research_history)
  const closed = item.status === "rejected" || item.status === "archived"
  return <article className="py-6">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 max-w-4xl">
        <div className="flex flex-wrap gap-2"><Badge variant="outline" className="rounded-md">{statusLabel[item.status]}</Badge><Badge variant="outline" className={`rounded-md ${scoreTone}`}>{item.overall_score}/100</Badge><Badge variant="outline" className="rounded-md">Evidencia {item.evidence_strength}</Badge><Badge variant="outline" className="rounded-md">Confianza {Math.round(item.confidence * 100)}%</Badge></div>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div><h3 className="text-xl font-light tracking-[-0.02em] text-[#E7DFCE]">{item.title}</h3>{item.thesis.one_line ? <p className="mt-2 text-sm leading-6 text-white">{item.thesis.one_line}</p> : null}</div>
          <div className="shrink-0 md:w-[220px]"><ConvictionSparkline history={item.research_history} currentScore={item.overall_score} /><ConvictionDelta comparison={comparison} /></div>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">{item.thesis.target_buyer ? <Detail label="Comprador" value={item.thesis.target_buyer} /> : null}{item.thesis.problem ? <Detail label="Problema" value={item.thesis.problem} /> : null}{item.thesis.unfair_advantage ? <Detail label="Ventaja" value={item.thesis.unfair_advantage} /> : null}{item.thesis.why_now ? <Detail label="Por qué ahora" value={item.thesis.why_now} /> : null}</div>
        <div className="mt-5 grid gap-5 md:grid-cols-3"><ListBlock label="Research probes" items={item.research_queries} /><ListBlock label="Triggers" items={item.watch_triggers} /><ListBlock label="Evidencia faltante" items={item.thesis.missing_evidence ?? []} /></div>
        {comparison?.reasons?.length ? <div className="mt-5 border-t border-border/70 pt-4"><p className="text-[10px] uppercase tracking-[0.13em] text-muted-foreground">Último cambio de convicción</p><div className="mt-2 space-y-1 text-xs leading-5 text-foreground">{comparison.reasons.slice(0, 4).map(reason => <p key={reason}>• {reason}</p>)}</div></div> : null}
      </div>
      <div className="shrink-0 text-xs leading-5 text-muted-foreground lg:w-48">
        <p>Timing {item.timing_score}/100</p>
        <p>{item.last_researched_at ? `Investigada ${formatDate(item.last_researched_at)}` : "Sin research persistido adicional"}</p>
        <p className="mt-2">Guardada {formatDate(item.created_at)}</p>
        <a href={item.source_website_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-foreground hover:text-white">Fuente web <ExternalLink className="h-3 w-3" /></a>
        {!closed ? <Button type="button" variant="outline" size="sm" className="mt-4 w-full" disabled={researching} onClick={onResearch}>{researching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}{researching ? "Investigando…" : "Re-investigar"}</Button> : null}
      </div>
    </div>
  </article>
}

function ConvictionDelta({ comparison }: { comparison: ResearchComparison | null }) {
  if (!comparison) return <p className="mt-1 text-[11px] text-muted-foreground">Research estructurado aún sin baseline.</p>
  if (comparison.baseline || comparison.direction === "baseline") return <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Minus className="h-3 w-3" /> Baseline establecido · Δ 0</p>
  const delta = comparison.overall_delta ?? 0
  if (comparison.direction === "strengthening") return <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#96B5A6]"><TrendingUp className="h-3 w-3" /> Fortaleciéndose · +{delta}</p>
  if (comparison.direction === "weakening") return <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#E0B987]"><TrendingDown className="h-3 w-3" /> Debilitándose · {delta}</p>
  return <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Minus className="h-3 w-3" /> Estable · Δ 0</p>
}

function ConvictionSparkline({ history, currentScore }: { history: ResearchRun[]; currentScore: number }) {
  const chronological = [...history]
    .filter(run => typeof run.score_snapshot?.overall === "number")
    .sort((a, b) => new Date(a.observed_at).getTime() - new Date(b.observed_at).getTime())
    .slice(-10)
  const scores = chronological.map(run => Number(run.score_snapshot?.overall))
  if (!scores.length) scores.push(currentScore)
  const width = 210
  const height = 48
  const min = Math.max(0, Math.min(...scores) - 3)
  const max = Math.min(100, Math.max(...scores) + 3)
  const span = Math.max(1, max - min)
  const points = scores.map((score, index) => {
    const x = scores.length === 1 ? width : (index / (scores.length - 1)) * width
    const y = height - ((score - min) / span) * (height - 8) - 4
    return { x, y, score }
  })
  const polyline = points.map(point => `${point.x},${point.y}`).join(" ")
  return <div aria-label={`Curva de convicción, score actual ${currentScore} de 100`}>
    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><span>Conviction curve</span><span>{currentScore}</span></div>
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-1 h-12 w-full overflow-visible text-[#96B5A6]" role="img" aria-hidden="true">
      <line x1="0" x2={width} y1={height - 4} y2={height - 4} stroke="currentColor" strokeOpacity="0.16" strokeWidth="1" />
      {points.length > 1 ? <polyline points={polyline} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /> : null}
      {points.map((point, index) => <circle key={`${point.x}:${index}`} cx={point.x} cy={point.y} r={index === points.length - 1 ? 2.6 : 1.8} fill="currentColor" />)}
    </svg>
  </div>
}

function latestComparison(history: ResearchRun[]): ResearchComparison | null {
  for (const run of history) {
    if (run.run_type !== "live_research" && run.run_type !== "scheduled_research") continue
    const comparison = run.evidence_summary?.comparison
    if (comparison && typeof comparison === "object") return comparison
  }
  return null
}

function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] uppercase tracking-[0.13em] text-muted-foreground">{label}</p><p className="mt-1 text-xs leading-5 text-foreground">{value}</p></div> }
function ListBlock({ label, items }: { label: string; items: string[] }) { return <div><p className="text-[10px] uppercase tracking-[0.13em] text-muted-foreground">{label}</p><div className="mt-2 space-y-1 text-xs leading-5 text-foreground">{items.length ? items.map(item => <p key={item}>• {item}</p>) : <p>—</p>}</div></div> }
function formatDate(value: string) { return new Date(value).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" }) }
