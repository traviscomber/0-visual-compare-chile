"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, ExternalLink, Loader2, RefreshCw } from "lucide-react"
import { buildCompetitiveSituations, type CompetitiveSituation, type CompetitiveSituationSignal } from "@/lib/intelligence/competitive-situations"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const PRIORITY_LABEL = { critica: "Crítica", alta: "Alta", media: "Media" } as const
const KIND_LABEL: Record<CompetitiveSituationSignal["kind"], string> = {
  regulatory_case: "Regulatorio",
  competitive_expansion: "Expansión Nice",
  new_high_signal: "Señal externa",
  opportunity_conviction: "Oportunidad",
}
const HYPOTHESIS_REVIEW_SOURCE = "VIDENTIA · Seguimiento de hipótesis"

export default function CompetitiveSituationsPage() {
  const [items, setItems] = useState<CompetitiveSituationSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/intelligence/watches/signals", { cache: "no-store" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos construir las situaciones competitivas.")
      setItems(Array.isArray(payload.attentionQueue) ? payload.attentionQueue : [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos construir las situaciones competitivas.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])
  const situations = useMemo(() => buildCompetitiveSituations(items), [items])
  const multiSignal = situations.filter(item => item.signalCount > 1).length
  const hypothesisReview = situations.filter(item => item.activeHypothesisReviews > 0).length
  const critical = situations.filter(item => item.priority === "critica").length
  const headline = situations.length
    ? `${situations.length} situación${situations.length === 1 ? " competitiva" : "es competitivas"} requiere${situations.length === 1 ? "" : "n"} lectura ejecutiva`
    : "No hay situaciones competitivas activas"

  return <OperationalPage>
    <OperationalHeader
      eyebrow="VIDENTIA / Competitive Situations"
      title={headline}
      description={<>Una situación reúne señales del mismo competidor sin fusionar su evidencia. La unidad de lectura cambia de “alerta” a “qué está pasando con esta empresa y qué decisión requiere”.</>}
      meta={<><span>{critical} críticas</span><span>{multiSignal} con señales cruzadas</span><span>{hypothesisReview} con hipótesis en revisión</span></>}
      actions={<div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/monitorear/atencion"><ArrowLeft className="h-4 w-4"/>Atención ejecutiva</Link></Button><Button onClick={() => void load()} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4"/>}Actualizar</Button></div>}
    />

    <OperationalMetricRail>
      <OperationalMetric value={situations.length} label="Situaciones" detail="Competidores con atención activa" tone={situations.length ? "warning" : "success"}/>
      <OperationalMetric value={multiSignal} label="Señales cruzadas" detail="Dos o más señales relacionadas" tone={multiSignal ? "warning" : "neutral"}/>
      <OperationalMetric value={hypothesisReview} label="Hipótesis en revisión" detail="Cambio material después de aceptación humana" tone={hypothesisReview ? "warning" : "neutral"}/>
      <OperationalMetric value={critical} label="Críticas" detail="Máxima materialidad observada" tone={critical ? "warning" : "neutral"}/>
    </OperationalMetricRail>

    <section className="py-9"><OperationalPanel>
      <OperationalSectionHeader eyebrow="01 / Situaciones activas" title="Una empresa, una lectura ejecutiva" meta="Materialidad → hipótesis → señales cruzadas → recencia"/>
      {error ? <div role="alert" className="mt-5 border border-[#D6A46F]/20 bg-[#332C24]/70 p-4 text-sm text-[#E0B987]">{error}</div> : null}
      {loading ? <div className="mt-5 flex items-center gap-2 border-y border-border/80 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Agrupando evidencia sin perder trazabilidad…</div> : situations.length ? <div className="mt-5 divide-y divide-border/80 border-y border-border/80">{situations.slice(0, 20).map((situation, index) => <SituationRow key={situation.key} situation={situation} index={index}/>)}</div> : <div className="mt-5 border-y border-border/80 py-10"><p className="font-medium text-white">No hay situaciones competitivas priorizadas.</p><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Las tesis de oportunidad permanecen fuera de esta vista. Aquí sólo se agrupan señales competitivas, regulatorias e hipótesis vinculadas a un competidor.</p></div>}
    </OperationalPanel></section>
  </OperationalPage>
}

function SituationRow({ situation, index }: { situation: CompetitiveSituation; index: number }) {
  const [open, setOpen] = useState(index < 3)
  const priorityClass = situation.priority === "critica"
    ? "border-[#D6A46F]/30 bg-[#332C24]/80 text-[#E0B987]"
    : situation.priority === "alta"
      ? "border-[#D6A46F]/20 bg-[#332C24]/55 text-[#E0B987]"
      : ""

  return <article className="py-5">
    <button type="button" onClick={() => setOpen(value => !value)} className="grid w-full gap-4 text-left md:grid-cols-[64px_minmax(0,1fr)_auto] md:items-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
      <div><span className="font-mono text-sm text-[#96B5A6]">{String(index + 1).padStart(2, "0")}</span></div>
      <div>
        <div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className={priorityClass}>{PRIORITY_LABEL[situation.priority]}</Badge><Badge variant="outline">{situation.signalCount} señal{situation.signalCount === 1 ? "" : "es"}</Badge>{situation.activeHypothesisReviews ? <Badge variant="outline" className="border-[#96B5A6]/30 text-[#96B5A6]">Hipótesis en revisión</Badge> : null}</div>
        <h2 className="mt-3 text-base font-medium leading-6 text-white">{situation.subject}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#E7DFCE]">{situation.decisionQuestion}</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground"><span>{situation.competitiveExpansions} expansión Nice</span><span>{situation.regulatoryCases} regulatoria{situation.regulatoryCases === 1 ? "" : "s"}</span><span>{situation.externalSignals} externa{situation.externalSignals === 1 ? "" : "s"}</span>{situation.latestOccurredAt ? <span>Último cambio · {formatDate(situation.latestOccurredAt)}</span> : null}</div>
      </div>
      <span className="text-xs text-muted-foreground">{open ? "Ocultar" : "Ver cronología"}</span>
    </button>

    {open ? <div className="mt-5 ml-0 border-l border-border/80 pl-4 md:ml-16">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#96B5A6]">Qué cambió</p>
      <div className="mt-3 divide-y divide-border/60 border-y border-border/60">{situation.timeline.map(item => <TimelineRow key={item.key} item={item}/>)}</div>
      <p className="mt-3 text-[11px] leading-5 text-muted-foreground">La agrupación es una proyección de lectura. No fusiona registros fuente, no aumenta conviction y no convierte correlación temporal en causalidad competitiva.</p>
    </div> : null}
  </article>
}

function TimelineRow({ item }: { item: CompetitiveSituationSignal }) {
  const external = item.href.startsWith("http")
  const kind = item.source === HYPOTHESIS_REVIEW_SOURCE ? "Revisión de hipótesis" : KIND_LABEL[item.kind]
  return <div className="grid gap-2 py-3 md:grid-cols-[140px_minmax(0,1fr)_auto] md:items-start">
    <div><p className="text-[11px] text-muted-foreground">{item.occurredAt ? formatDate(item.occurredAt) : "Fecha no disponible"}</p><p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#96B5A6]">{kind}</p></div>
    <div><p className="text-sm leading-6 text-white">{item.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.reason}</p><p className="mt-1 text-[11px] text-muted-foreground">{item.source}</p></div>
    <Button asChild size="sm" variant="ghost"><Link href={item.href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>Evidencia{external ? <ExternalLink className="h-3.5 w-3.5"/> : null}</Link></Button>
  </div>
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(date)
}
