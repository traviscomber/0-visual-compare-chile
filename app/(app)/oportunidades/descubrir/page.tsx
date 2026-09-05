"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { ArrowLeft, BrainCircuit, ExternalLink, Loader2, Radar, Save, Sparkles } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Organization = { id: string; name: string; slug: string; role: string }
type Capability = {
  name: string
  category: "technical" | "operational" | "data" | "distribution" | "domain" | "workflow"
  description: string
  confidence: number
  evidence: string[]
  leverage: string
}
type Opportunity = {
  name: string
  one_line: string
  target_buyer: string
  problem: string
  product_shape: string
  wedge: string
  unfair_advantage: string
  why_now: string
  contrarian_reason: string
  second_order_effect: string
  capability_reuse: string[]
  observed_signals: string[]
  assumptions: string[]
  disconfirming_signals: string[]
  moat: string
  first_experiments: string[]
  watch_triggers: string[]
  research_queries: string[]
  missing_evidence: string[]
  evidence_state: "observed" | "mixed" | "hypothesis"
  decision: "build" | "investigate" | "watch" | "reject"
  confidence: number
  scores: {
    strategic_fit: number
    capability_reuse: number
    novelty: number
    timing: number
    evidence_strength: number
    defensibility: number
    overall: number
  }
}
type Analysis = {
  company_summary: string
  market_posture: string
  capabilities: Capability[]
  opportunities: Opportunity[]
  do_not_build: Array<{ idea: string; reason: string }>
  frontier_questions: string[]
  next_research: string[]
}
type EngineResponse = {
  analysis: Analysis
  context: {
    organization: { id: string; name: string; slug: string }
    website: { canonicalUrl: string; pagesRead: number }
    signals: { searches: number; watches: number; events?: number; recommendations: number }
    generatedAt: string
  }
  model: string
  usage: { promptTokens: number; completionTokens: number; estimatedCostUsd: number }
}

const decisionLabel: Record<Opportunity["decision"], string> = {
  build: "Prototipar",
  investigate: "Investigar",
  watch: "Vigilar",
  reject: "Descartar",
}

export default function OpportunityDiscoveryPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [organizationId, setOrganizationId] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [challenge, setChallenge] = useState("")
  const [loading, setLoading] = useState(false)
  const [booting, setBooting] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EngineResponse | null>(null)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, string>>({})
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({})

  useEffect(() => { void loadOrganizations() }, [])

  async function loadOrganizations() {
    setBooting(true)
    try {
      const response = await fetch("/api/intelligence/portfolio-binding", { cache: "no-store" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos cargar tu organización.")
      const next = (payload.organizations ?? []) as Organization[]
      setOrganizations(next)
      setOrganizationId(next[0]?.id ?? "")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos cargar tu organización.")
    } finally {
      setBooting(false)
    }
  }

  async function run(event: FormEvent) {
    event.preventDefault()
    if (!organizationId || !websiteUrl.trim() || loading) return
    setLoading(true)
    setError(null)
    setResult(null)
    setSaved({})
    setSaveErrors({})
    try {
      const response = await fetch("/api/intelligence/opportunity-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, websiteUrl: websiteUrl.trim(), challenge: challenge.trim() || undefined }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos construir la lectura de oportunidades.")
      setResult(payload as EngineResponse)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos construir la lectura de oportunidades.")
    } finally {
      setLoading(false)
    }
  }

  async function promote(item: Opportunity) {
    if (!result || saving[item.name]) return
    setSaving(current => ({ ...current, [item.name]: true }))
    setSaveErrors(current => ({ ...current, [item.name]: "" }))
    try {
      const response = await fetch("/api/intelligence/opportunity-theses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: result.context.organization.id,
          model: result.model,
          thesis: item,
          context: {
            website: result.context.website,
            signals: { ...result.context.signals, events: result.context.signals.events ?? 0 },
            generatedAt: result.context.generatedAt,
          },
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos guardar la tesis.")
      setSaved(current => ({ ...current, [item.name]: String(payload.opportunity?.id ?? "saved") }))
    } catch (cause) {
      setSaveErrors(current => ({ ...current, [item.name]: cause instanceof Error ? cause.message : "No pudimos guardar la tesis." }))
    } finally {
      setSaving(current => ({ ...current, [item.name]: false }))
    }
  }

  const ranked = useMemo(() => [...(result?.analysis.opportunities ?? [])].sort((a, b) => b.scores.overall - a.scores.overall), [result])
  const prototypeCount = ranked.filter(item => item.decision === "build").length
  const investigateCount = ranked.filter(item => item.decision === "investigate").length
  const evidenceAverage = ranked.length ? Math.round(ranked.reduce((sum, item) => sum + item.scores.evidence_strength, 0) / ranked.length) : 0

  return <OperationalPage>
    <OperationalHeader
      eyebrow="VIDENTIA / Opportunity Engine"
      title="¿Qué debería construir esta empresa antes de que sea obvio?"
      description="VIDENTIA reconstruye capacidades, cruza señales del OS, investiga las tesis mejor rankeadas y exige evidencia que pueda confirmarlas o invalidarlas. Nada entra al roadmap hasta que una persona lo promueve explícitamente."
      meta={<><span>Capability graph</span><span>Live research</span><span>Falsifiable theses</span><span>Human gate</span></>}
      actions={<div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/oportunidades"><ArrowLeft className="h-4 w-4" /> Volver</Link></Button><Button asChild variant="outline"><Link href="/oportunidades/tesis">Tesis guardadas</Link></Button></div>}
    />

    {result ? <OperationalMetricRail>
      <OperationalMetric value={prototypeCount} label="Para prototipar" detail="Pasaron el umbral de evidencia del servidor" tone={prototypeCount ? "success" : "neutral"} />
      <OperationalMetric value={investigateCount} label="Para investigar" detail="Prometedoras, aún incompletas" tone={investigateCount ? "warning" : "neutral"} />
      <OperationalMetric value={result.analysis.capabilities.length} label="Capacidades" detail="Reconstruidas desde evidencia autorizada" tone="neutral" />
      <OperationalMetric value={`${evidenceAverage}/100`} label="Fuerza de evidencia" detail="Promedio de las tesis" tone={evidenceAverage >= 70 ? "success" : evidenceAverage >= 45 ? "warning" : "neutral"} />
    </OperationalMetricRail> : null}

    <section className="grid gap-9 border-b border-border/80 py-9 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] xl:gap-12">
      <div>
        <OperationalSectionHeader eyebrow="01 / Contexto" title="Entienda primero lo que la empresa realmente sabe hacer." />
        <form onSubmit={run} className="mt-5 space-y-4">
          {organizations.length > 1 ? <label className="block max-w-xl"><span className="mb-2 block text-xs text-muted-foreground">Organización</span><select value={organizationId} onChange={event => setOrganizationId(event.target.value)} className="h-11 w-full rounded-[10px] border border-border bg-card/40 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/45">{organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label> : null}
          <label className="block"><span className="mb-2 block text-xs text-muted-foreground">Web pública de la empresa</span><Input value={websiteUrl} onChange={event => setWebsiteUrl(event.target.value)} placeholder="https://www.empresa.com" className="h-11" inputMode="url" /></label>
          <label className="block"><span className="mb-2 block text-xs text-muted-foreground">Desafío opcional</span><textarea value={challenge} onChange={event => setChallenge(event.target.value)} maxLength={600} rows={3} placeholder="Ej. busca plataformas que podamos lanzar antes que el mercado, evitando SaaS genérico y priorizando ventajas difíciles de copiar." className="w-full rounded-[10px] border border-border bg-card/40 px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/45" /></label>
          <Button type="submit" disabled={booting || loading || !organizationId || websiteUrl.trim().length < 8} className="h-11 px-5">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}{loading ? "Investigando…" : "Descubrir oportunidades"}</Button>
        </form>
        {error ? <div role="alert" className="mt-6 border-y border-[#7A5B41]/45 bg-[#332C24]/35 px-4 py-4 text-sm leading-6 text-[#D6C3A8]">{error}</div> : null}
      </div>
      <OperationalPanel>
        <OperationalSectionHeader eyebrow="Método" title="No es un generador de ideas." />
        <div className="mt-5 space-y-4 text-sm leading-6 text-muted-foreground">
          <p>Cada tesis debe reutilizar capacidades observadas, definir comprador y problema, explicar una ventaja compuesta y declarar qué evidencia la invalidaría.</p>
          <p className="border-t border-border/80 pt-4">Las mejores tesis se contrastan automáticamente contra investigación, patentes y señales públicas. Noticias por sí solas nunca validan demanda.</p>
          <p className="border-t border-border/80 pt-4">Guardar una tesis es una acción humana explícita. Sólo entonces se convierte en un activo persistente del OS.</p>
        </div>
      </OperationalPanel>
    </section>

    {!result && !loading && !error ? <section className="py-12"><Sparkles className="h-5 w-5 text-[#96B5A6]" /><h2 className="mt-3 text-2xl font-light tracking-[-0.03em] text-[#E7DFCE]">Busque ventajas compuestas, no features.</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">El objetivo es descubrir intersecciones difíciles de copiar entre tecnología, datos, workflows, dominio y distribución; y también decir con claridad qué no conviene construir.</p></section> : null}

    {result ? <>
      <section className="border-b border-border/80 py-9">
        <OperationalSectionHeader eyebrow="02 / Capability graph" title="Qué sabe hacer esta empresa" meta={`${result.analysis.capabilities.length} capacidades`} />
        <p className="mt-4 max-w-4xl text-base leading-7 text-white">{result.analysis.company_summary}</p>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">{result.analysis.market_posture}</p>
        <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{result.analysis.capabilities.map(capability => <article key={`${capability.category}:${capability.name}`} className="border-t border-border/80 py-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.14em] text-[#96B5A6]">{capability.category}</p><h3 className="mt-1 text-sm font-medium text-white">{capability.name}</h3></div><span className="text-xs tabular-nums text-muted-foreground">{Math.round(capability.confidence * 100)}%</span></div><p className="mt-2 text-xs leading-5 text-muted-foreground">{capability.description}</p><p className="mt-3 text-xs leading-5 text-foreground">Palanca: {capability.leverage}</p></article>)}</div>
      </section>

      <section className="border-b border-border/80 py-9">
        <OperationalSectionHeader eyebrow="03 / Product frontier" title="Tesis que merecen ser desafiadas" meta={`${ranked.length} propuestas`} />
        <div className="mt-6 divide-y divide-border/80 border-y border-border/80">{ranked.map((item, index) => <OpportunityRow key={item.name} item={item} index={index + 1} saving={Boolean(saving[item.name])} savedId={saved[item.name]} saveError={saveErrors[item.name]} onPromote={() => promote(item)} />)}</div>
      </section>

      <section className="grid gap-10 border-b border-border/80 py-9 lg:grid-cols-2">
        <div><OperationalSectionHeader eyebrow="04 / Anti-roadmap" title="Qué NO construir" /><div className="mt-5 divide-y divide-border/80 border-y border-border/80">{result.analysis.do_not_build.map(item => <div key={item.idea} className="py-4"><p className="text-sm font-medium text-white">{item.idea}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.reason}</p></div>)}</div></div>
        <div><OperationalSectionHeader eyebrow="05 / Frontier questions" title="Preguntas que podrían desbloquear algo único" /><div className="mt-5 divide-y divide-border/80 border-y border-border/80">{result.analysis.frontier_questions.map((question, index) => <div key={question} className="flex gap-3 py-4"><span className="text-xs tabular-nums text-[#96B5A6]">{String(index + 1).padStart(2, "0")}</span><p className="text-sm leading-6 text-foreground">{question}</p></div>)}</div></div>
      </section>

      <section className="grid gap-8 py-9 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div><OperationalSectionHeader eyebrow="Siguiente investigación" title="Qué evidencia falta antes de decidir" /><div className="mt-5 space-y-2">{result.analysis.next_research.map(item => <div key={item} className="flex items-start gap-3 text-sm leading-6 text-foreground"><Radar className="mt-1 h-4 w-4 shrink-0 text-[#96B5A6]" /><span>{item}</span></div>)}</div></div>
        <OperationalPanel><p className="text-[10px] uppercase tracking-[0.14em] text-[#96B5A6]">Trazabilidad</p><div className="mt-4 space-y-2 text-xs leading-5 text-muted-foreground"><p>{result.context.website.pagesRead} páginas públicas leídas.</p><p>{result.context.signals.searches} búsquedas · {result.context.signals.watches} watches · {result.context.signals.events ?? 0} eventos observados · {result.context.signals.recommendations} recomendaciones.</p><p>Modelo: {result.model}</p><a href={result.context.website.canonicalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-foreground hover:text-white">Abrir fuente web <ExternalLink className="h-3 w-3" /></a></div></OperationalPanel>
      </section>
    </> : null}
  </OperationalPage>
}

function OpportunityRow({ item, index, saving, savedId, saveError, onPromote }: { item: Opportunity; index: number; saving: boolean; savedId?: string; saveError?: string; onPromote: () => void }) {
  const tone = item.decision === "build" ? "border-[#96B5A6]/30 bg-[#173B37]/70 text-[#B8D0C2]" : item.decision === "investigate" ? "border-[#D6A46F]/30 bg-[#332C24]/70 text-[#E0B987]" : "border-border bg-card/30 text-muted-foreground"
  return <article className="py-6">
    <div className="grid gap-6 xl:grid-cols-[72px_minmax(0,1fr)_250px]">
      <div><span className="text-3xl font-light tabular-nums text-[#E7DFCE]">{String(index).padStart(2, "0")}</span></div>
      <div>
        <div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className={`rounded-md ${tone}`}>{decisionLabel[item.decision]}</Badge><Badge variant="outline" className="rounded-md">{item.scores.overall}/100</Badge><Badge variant="outline" className="rounded-md">{item.evidence_state === "observed" ? "Observada" : item.evidence_state === "mixed" ? "Evidencia + hipótesis" : "Hipótesis"}</Badge></div>
        <h3 className="mt-3 text-xl font-light tracking-[-0.02em] text-[#E7DFCE]">{item.name}</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white">{item.one_line}</p>
        <div className="mt-5 grid gap-5 md:grid-cols-2"><Detail label="Comprador inicial" value={item.target_buyer} /><Detail label="Problema" value={item.problem} /><Detail label="Wedge" value={item.wedge} /><Detail label="Ventaja injusta" value={item.unfair_advantage} /><Detail label="Por qué ahora" value={item.why_now} /><Detail label="Razón contraria" value={item.contrarian_reason} /><Detail label="Moat" value={item.moat} /><Detail label="Segundo orden" value={item.second_order_effect} /></div>
        <div className="mt-5 grid gap-5 md:grid-cols-3"><ListBlock label="Capacidades reutilizadas" items={item.capability_reuse} /><ListBlock label="Qué la invalidaría" items={item.disconfirming_signals} /><ListBlock label="Evidencia faltante" items={item.missing_evidence} /></div>
        <div className="mt-5 border-y border-border/80 py-4"><p className="text-[10px] uppercase tracking-[0.14em] text-[#96B5A6]">Primeros experimentos</p><div className="mt-2 space-y-1 text-xs leading-5 text-foreground">{item.first_experiments.map(experiment => <p key={experiment}>— {experiment}</p>)}</div></div>
        <div className="mt-4 flex flex-wrap items-center gap-3"><Button type="button" size="sm" onClick={onPromote} disabled={saving || Boolean(savedId)}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{savedId ? "Tesis guardada" : "Guardar para seguimiento"}</Button>{savedId ? <Button asChild size="sm" variant="outline"><Link href="/oportunidades/tesis">Ver tesis guardadas</Link></Button> : null}{saveError ? <span className="text-xs text-[#D6A46F]">{saveError}</span> : null}</div>
      </div>
      <aside className="border-l-0 border-border/80 xl:border-l xl:pl-6"><p className="text-[10px] uppercase tracking-[0.14em] text-[#96B5A6]">Scorecard</p><div className="mt-3 space-y-2"><Score label="Fit" value={item.scores.strategic_fit} /><Score label="Reuse" value={item.scores.capability_reuse} /><Score label="Novelty" value={item.scores.novelty} /><Score label="Timing" value={item.scores.timing} /><Score label="Evidence" value={item.scores.evidence_strength} /><Score label="Defensibility" value={item.scores.defensibility} /></div><div className="mt-5 border-t border-border/80 pt-4"><p className="text-[10px] uppercase tracking-[0.14em] text-[#96B5A6]">Research probes</p><div className="mt-2 space-y-2 text-xs leading-5 text-muted-foreground">{item.research_queries.map(query => <p key={query}>• {query}</p>)}</div></div><div className="mt-5 border-t border-border/80 pt-4"><p className="text-[10px] uppercase tracking-[0.14em] text-[#96B5A6]">Triggers a vigilar</p><div className="mt-2 space-y-2 text-xs leading-5 text-muted-foreground">{item.watch_triggers.map(trigger => <p key={trigger}>• {trigger}</p>)}</div></div></aside>
    </div>
  </article>
}

function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] uppercase tracking-[0.13em] text-muted-foreground">{label}</p><p className="mt-1 text-xs leading-5 text-foreground">{value}</p></div> }
function ListBlock({ label, items }: { label: string; items: string[] }) { return <div><p className="text-[10px] uppercase tracking-[0.13em] text-muted-foreground">{label}</p><div className="mt-2 space-y-1 text-xs leading-5 text-foreground">{items.length ? items.map(item => <p key={item}>• {item}</p>) : <p>—</p>}</div></div> }
function Score({ label, value }: { label: string; value: number }) { return <div className="grid grid-cols-[80px_1fr_34px] items-center gap-2 text-xs"><span className="text-muted-foreground">{label}</span><div className="h-px bg-border"><div className="h-px bg-[#96B5A6]" style={{ width: `${value}%` }} /></div><span className="text-right tabular-nums text-foreground">{value}</span></div> }
