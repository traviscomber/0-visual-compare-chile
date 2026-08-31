"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { ArrowRight, ExternalLink, Loader2, Search } from "lucide-react"
import { OperationalMetric, OperationalMetricRail, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { strategicWatchHref } from "@/lib/intelligence/navigation-context"

type StrategyResponse = {
  signals: {
    query: string
    period_days: number
    momentum: { current_publications: number | null; trend: string }
    patent_signal: { recent_matches: number; selected_matches: number; distinct_applicants: number }
  }
  strategy: {
    scope: string
    maturity: { level: string; label: string; confidence: string; basis: string; factors: string[] }
    adoption: { level: string; label: string; basis: string; indicators: string[] }
    emerging_players: { label: string; caveat: string; actors: Array<{ name: string; axis: "patents" | "research"; evidence_count: number; reason: string }> }
    competitive_moves: { label: string; caveat: string; moves: Array<{ actor: string; type: "patent_filing" | "research_presence"; observed_at: string | null; evidence: string; source_url: string | null }> }
  }
  error?: string
}

const EXAMPLES = ["nanoburbujas", "extracción directa de litio", "hidrógeno verde", "desalación electroquímica"]

export function TechnologyStrategyWorkbench() {
  const [query, setQuery] = useState("")
  const [windowDays, setWindowDays] = useState(180)
  const [result, setResult] = useState<StrategyResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (event: FormEvent) => {
    event.preventDefault()
    const q = query.trim()
    if (q.length < 2 || loading) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ q, windowDays: String(windowDays) })
      const response = await fetch(`/api/intelligence/technology-strategy?${params}`, { cache: "no-store" })
      const payload = await response.json().catch(() => ({})) as StrategyResponse
      if (!response.ok) {
        setResult(null)
        setError(response.status === 401 ? "Tu sesión expiró. Vuelve a iniciar sesión." : payload.error || "No pudimos construir esta lectura.")
        return
      }
      setResult(payload)
    } catch {
      setResult(null)
      setError("No fue posible construir la lectura estratégica.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-9">
      <section className="grid gap-6 border-b border-border/80 pb-8 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          <OperationalSectionHeader eyebrow="Technology Intelligence V2" title="Lea la tecnología como una señal estratégica verificable." />
          <form onSubmit={run} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej. nanoburbujas" maxLength={160} className="h-11 flex-1" />
            <Button type="submit" disabled={query.trim().length < 2 || loading} className="h-11 px-5">
              {loading ? <Loader2 className="animate-spin" /> : <Search />}
              {loading ? "Construyendo" : "Construir lectura"}
            </Button>
          </form>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
            {EXAMPLES.map((example) => <button key={example} type="button" onClick={() => setQuery(example)} className="hover:text-white">{example}</button>)}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">Horizonte</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[90, 180, 365].map(days => <button key={days} type="button" onClick={() => setWindowDays(days)} className={`h-10 rounded-[9px] text-xs ${windowDays === days ? "bg-[#173B37] text-white" : "bg-[#13272D] text-muted-foreground"}`}>{days === 365 ? "12m" : `${days}d`}</button>)}
          </div>
        </div>
      </section>

      {error ? <div role="alert" className="border-b border-border/80 py-6 text-sm text-[#E8AAA3]">{error}</div> : null}
      {!result && !loading ? <p className="py-10 text-sm leading-6 text-muted-foreground">La lectura no intenta adivinar estrategia corporativa. Ordena evidencia científica y de patentes para mostrar madurez observable, proxy de adopción, actores visibles y movimientos verificables.</p> : null}
      {result && !loading ? <StrategyResult result={result} /> : null}
    </div>
  )
}

function StrategyResult({ result }: { result: StrategyResponse }) {
  const { signals, strategy } = result
  return (
    <div>
      <section className="py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">Lectura estratégica</p><h2 className="mt-2 text-3xl font-light tracking-[-0.035em] text-[#E7DFCE]">{signals.query}</h2></div>
          <Badge variant="outline">Confianza {strategy.maturity.confidence}</Badge>
        </div>
        <p className="mt-4 max-w-4xl text-sm leading-6 text-muted-foreground">{strategy.scope}</p>
      </section>

      <OperationalMetricRail>
        <OperationalMetric value={strategy.maturity.label} label="Madurez de evidencia" detail="Investigación + IP observada" tone={strategy.maturity.level === "scaling" || strategy.maturity.level === "established" ? "success" : "neutral"} />
        <OperationalMetric value={strategy.adoption.label} label="Proxy de adopción" detail="No equivale a adopción comercial" tone={strategy.adoption.level === "strong" ? "success" : strategy.adoption.level === "moderate" ? "warning" : "neutral"} />
        <OperationalMetric value={strategy.emerging_players.actors.length} label="Actores observados" detail="Patentes o presencia científica repetida" tone={strategy.emerging_players.actors.length ? "success" : "neutral"} />
        <OperationalMetric value={strategy.competitive_moves.moves.length} label="Movimientos observados" detail={`Ventana ${signals.period_days} días`} tone={strategy.competitive_moves.moves.length ? "success" : "neutral"} />
      </OperationalMetricRail>

      <section className="grid gap-8 border-b border-border/80 py-9 lg:grid-cols-2">
        <SignalBlock eyebrow="Madurez" title={strategy.maturity.label} basis={strategy.maturity.basis} items={strategy.maturity.factors} />
        <SignalBlock eyebrow="Adopción" title={strategy.adoption.label} basis={strategy.adoption.basis} items={strategy.adoption.indicators} />
      </section>

      <section className="grid gap-10 border-b border-border/80 py-9 lg:grid-cols-2">
        <div>
          <OperationalSectionHeader eyebrow="Actores" title={strategy.emerging_players.label} meta={`${strategy.emerging_players.actors.length} observados`} />
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{strategy.emerging_players.caveat}</p>
          <div className="mt-5 divide-y divide-border/80 border-y border-border/80">
            {strategy.emerging_players.actors.length ? strategy.emerging_players.actors.map(actor => (
              <div key={`${actor.axis}:${actor.name}`} className="py-4">
                <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-white">{actor.name}</p><Badge variant="outline">{actor.axis === "patents" ? "Patentes" : "Investigación"}</Badge></div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{actor.reason}</p>
              </div>
            )) : <p className="py-5 text-sm text-muted-foreground">No hay actores suficientes para destacar sin sobreinterpretar la muestra.</p>}
          </div>
        </div>

        <div>
          <OperationalSectionHeader eyebrow="Movimientos" title={strategy.competitive_moves.label} meta={`${strategy.competitive_moves.moves.length} observados`} />
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{strategy.competitive_moves.caveat}</p>
          <div className="mt-5 divide-y divide-border/80 border-y border-border/80">
            {strategy.competitive_moves.moves.length ? strategy.competitive_moves.moves.map((move, index) => (
              <div key={`${move.type}:${move.actor}:${index}`} className="py-4">
                <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-white">{move.actor}</p><span className="text-[10px] uppercase tracking-[0.12em] text-[#96B5A6]">{move.type === "patent_filing" ? "Filing" : "Research"}</span></div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{move.evidence}</p>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">{move.observed_at ? <span>{move.observed_at}</span> : null}{move.source_url ? <a href={move.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-white">Fuente <ExternalLink className="size-3" /></a> : null}</div>
              </div>
            )) : <p className="py-5 text-sm text-muted-foreground">No hay movimientos suficientes para destacar sin inventar intención.</p>}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-sm font-medium text-white">Convierta la señal en seguimiento.</p><p className="mt-1 text-xs text-muted-foreground">La vigilancia conservará la consulta; una nueva lectura permitirá comparar evidencia futura.</p></div>
        <div className="flex gap-2"><Button asChild><Link href={strategicWatchHref("technology", signals.query)}>Vigilar tecnología <ArrowRight /></Link></Button><Button asChild variant="outline"><Link href={`/tecnologias?technology=${encodeURIComponent(signals.query)}&windowDays=${signals.period_days}`}>Ver evidencia base</Link></Button></div>
      </section>
    </div>
  )
}

function SignalBlock({ eyebrow, title, basis, items }: { eyebrow: string; title: string; basis: string; items: string[] }) {
  return <div><p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">{eyebrow}</p><h3 className="mt-2 text-xl font-light text-[#E7DFCE]">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{basis}</p><ul className="mt-4 space-y-2 text-xs leading-5 text-white">{items.map(item => <li key={item}>— {item}</li>)}</ul></div>
}
