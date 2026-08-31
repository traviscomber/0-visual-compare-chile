"use client"

import Link from "next/link"
import { FormEvent, useEffect, useState } from "react"
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ExternalLink,
  Loader2,
  Minus,
  Newspaper,
  Search,
} from "lucide-react"
import { OperationalMetric, OperationalMetricRail, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { strategicWatchHref, technologyHref } from "@/lib/intelligence/navigation-context"

const EXAMPLES = ["extracción directa de litio", "hidrógeno verde", "almacenamiento térmico", "desalación electroquímica"]
const SOURCE_LABELS: Record<string, string> = { openalex: "OpenAlex", crossref: "Crossref", gdelt: "GDELT" }

type PublicationEvidence = {
  source: "openalex" | "crossref"
  sourceRecordId: string
  title: string
  date: string | null
  url: string
  doi?: string | null
  citedByCount: number
  authors?: string[]
  institutions?: string[]
  publisher?: string | null
}

type NewsEvidence = {
  source: "gdelt"
  sourceRecordId: string
  title: string
  date: string | null
  url: string
  domain: string | null
  sourceCountry: string | null
  language: string | null
}

type TechnologySignalResponse = {
  query: string
  period_days: number
  observed_at: string
  momentum: {
    available: boolean
    current_publications: number | null
    previous_publications: number | null
    change_percent: number | null
    trend: "acelerando" | "estable" | "desacelerando" | "sin_base" | "no_disponible"
    basis: string
  }
  evidence: {
    publications: PublicationEvidence[]
    news: NewsEvidence[]
  }
  sources: Record<string, { available: boolean; evidence_count: number }>
  error?: string
}

export function TechnologySignalsWorkbench() {
  const [query, setQuery] = useState("")
  const [windowDays, setWindowDays] = useState(180)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TechnologySignalResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async (event?: FormEvent, override?: { query: string; windowDays: number }, syncUrl: boolean = true) => {
    event?.preventDefault()
    const q = (override?.query ?? query).trim()
    const nextWindowDays = override?.windowDays ?? windowDays
    if (q.length < 2 || loading) return

    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ q, windowDays: String(nextWindowDays) })
      if (syncUrl && typeof window !== "undefined") window.history.replaceState(null, "", technologyHref(q, nextWindowDays))
      const response = await fetch(`/api/intelligence/technology-signals?${params}`, { cache: "no-store" })
      const payload = (await response.json().catch(() => ({}))) as TechnologySignalResponse
      if (!response.ok) {
        setResult(null)
        setError(response.status === 401 ? "Tu sesión expiró. Vuelve a iniciar sesión." : payload.error || "No pudimos construir la señal tecnológica.")
        return
      }
      setResult(payload)
    } catch {
      setResult(null)
      setError("No fue posible consultar las fuentes tecnológicas en este momento.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requestedTechnology = params.get("technology")?.trim()
    if (!requestedTechnology) return
    const requestedWindow = Number(params.get("windowDays"))
    const normalizedWindow = requestedWindow === 90 || requestedWindow === 365 ? requestedWindow : 180
    setQuery(requestedTechnology)
    setWindowDays(normalizedWindow)
    void run(undefined, { query: requestedTechnology, windowDays: normalizedWindow }, false)
  }, [])

  const chooseExample = (value: string) => {
    setQuery(value)
    setResult(null)
    setError(null)
  }

  return (
    <div className="py-9">
      <section className="grid gap-7 border-b border-border/80 pb-9 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.55fr)] lg:gap-10">
        <div>
          <OperationalSectionHeader eyebrow="Consulta" title="¿Qué tecnología quiere observar?" />
          <form onSubmit={run} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ej. extracción directa de litio"
              maxLength={160}
              aria-label="Tecnología a analizar"
              className="h-11 flex-1"
            />
            <Button type="submit" disabled={query.trim().length < 2 || loading} className="h-11 px-5">
              {loading ? <Loader2 className="animate-spin" /> : <Search />}
              {loading ? "Analizando" : "Analizar evolución"}
            </Button>
          </form>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
            {EXAMPLES.map((example) => (
              <button key={example} type="button" onClick={() => chooseExample(example)} className="text-left underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:text-white">
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="border-l-0 border-border/80 lg:border-l lg:pl-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">Período de comparación</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[90, 180, 365].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setWindowDays(days)}
                aria-pressed={windowDays === days}
                className={`h-10 rounded-[9px] px-3 text-sm font-medium transition-colors ${windowDays === days ? "bg-[#173B37] text-white shadow-[inset_0_0_0_1px_rgba(150,181,166,0.18)]" : "bg-[#13272D] text-muted-foreground hover:bg-[#172F34] hover:text-white"}`}
              >
                {days === 365 ? "12 meses" : `${days} días`}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">Se compara el período elegido con el período inmediatamente anterior de igual duración.</p>
        </div>
      </section>

      {error ? <div role="alert" className="border-b border-border/80 py-6 text-sm text-[#E8AAA3]">{error}</div> : null}

      {!result && !loading ? <InitialState /> : null}
      {loading ? <LoadingState /> : null}
      {result && !loading ? <TechnologyResult result={result} /> : null}
    </div>
  )
}

function TechnologyResult({ result }: { result: TechnologySignalResponse }) {
  const trend = trendPresentation(result.momentum.trend)
  const TrendIcon = trend.icon
  const change = result.momentum.change_percent
  const publicationCount = result.evidence.publications.length
  const newsCount = result.evidence.news.length
  const unavailableSources = Object.entries(result.sources).filter(([, source]) => !source.available).map(([key]) => SOURCE_LABELS[key] ?? key)
  const publicationSourcesAvailable = Boolean(result.sources.openalex?.available || result.sources.crossref?.available)

  return (
    <div>
      <section className="py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">Señal observada</p>
            <h2 className="mt-2 text-[1.85rem] font-light tracking-[-0.035em] text-[#E7DFCE]">{result.query}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm"><Link href={strategicWatchHref("technology", result.query)}>Vigilar tecnología</Link></Button>
            <Badge variant="outline" className={`${trend.className} gap-1.5 px-3 py-1.5 text-xs`}>
              <TrendIcon className="size-3.5" /> {trend.label}
            </Badge>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">{result.momentum.basis}</p>
        {unavailableSources.length ? (
          <div role="status" className="mt-5 flex max-w-3xl items-start gap-3 border-y border-[#7A5B41]/45 bg-[#332C24]/35 px-3 py-3 text-xs leading-5 text-[#D6C3A8]">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#D6A46F]" />
            <p>Fuentes temporalmente no disponibles: {unavailableSources.join(" · ")}. VIDENTIA no interpreta una fuente sin respuesta como ausencia de actividad.</p>
          </div>
        ) : null}
      </section>

      <OperationalMetricRail>
        <OperationalMetric value={result.momentum.current_publications ?? "—"} label="Publicaciones recientes" detail={result.momentum.available ? `Últimos ${result.period_days} días` : "OpenAlex no disponible"} tone={result.momentum.available ? "success" : "neutral"} />
        <OperationalMetric value={result.momentum.previous_publications ?? "—"} label="Período anterior" detail={result.momentum.available ? `${result.period_days} días anteriores` : "Sin base comparable"} />
        <OperationalMetric value={change === null ? "—" : `${change > 0 ? "+" : ""}${change}%`} label="Variación observada" detail={result.momentum.available ? "Actividad indexada por OpenAlex" : "No calculada"} tone={change !== null && change >= 20 ? "success" : change !== null && change <= -20 ? "warning" : "neutral"} />
        <OperationalMetric value={publicationCount + newsCount} label="Evidencias revisables" detail={`${publicationCount} publicaciones · ${newsCount} noticias`} />
      </OperationalMetricRail>

      <section className="grid gap-10 py-9 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <div>
          <OperationalSectionHeader eyebrow="Evidencia científica" title="Publicaciones recientes" meta={`${publicationCount} seleccionadas`} />
          {publicationCount ? (
            <div className="mt-5 divide-y divide-border/80 border-y border-border/80">
              {result.evidence.publications.map((item) => <PublicationRow key={`${item.source}:${item.sourceRecordId}`} item={item} />)}
            </div>
          ) : <EmptyEvidence text={publicationSourcesAvailable ? "No encontramos publicaciones recientes para esta consulta en las fuentes disponibles." : "Las fuentes científicas no respondieron de forma completa. VIDENTIA no presenta este vacío como ausencia de publicaciones."} />}
        </div>

        <aside>
          <OperationalSectionHeader eyebrow="Señales externas" title="Qué apareció recientemente" meta={`${newsCount} noticias`} />
          {newsCount ? (
            <div className="mt-5 divide-y divide-border/80 border-y border-border/80">
              {result.evidence.news.map((item) => <NewsRow key={item.sourceRecordId} item={item} />)}
            </div>
          ) : <EmptyEvidence text={result.sources.gdelt?.available ? "No encontramos noticias recientes asociadas a la consulta." : "GDELT no está disponible temporalmente. VIDENTIA no presenta este vacío como ausencia de noticias."} />}
          <div className="mt-6 border-t border-border/80 pt-5 text-xs leading-5 text-muted-foreground">
            <p className="font-medium text-white">Cómo leer esta señal</p>
            <p className="mt-2">Un aumento de publicaciones puede indicar mayor actividad investigativa, pero por sí solo no demuestra adopción comercial, inversión ni ventaja competitiva.</p>
          </div>
        </aside>
      </section>
    </div>
  )
}

function PublicationRow({ item }: { item: PublicationEvidence }) {
  const detail = [formatDate(item.date), item.source === "openalex" ? "OpenAlex" : "Crossref", item.citedByCount ? `${item.citedByCount} citas` : null].filter(Boolean).join(" · ")
  return (
    <a href={item.url} target="_blank" rel="noreferrer" className="group grid gap-3 px-2 py-5 outline-none transition-colors hover:bg-secondary/55 focus-visible:bg-secondary/55 sm:grid-cols-[34px_1fr_auto] sm:items-start">
      <span className="flex size-8 items-center justify-center rounded-[8px] bg-[#173B37] text-[#96B5A6]"><BookOpen className="size-3.5" /></span>
      <div className="min-w-0">
        <h3 className="text-sm font-medium leading-6 text-white">{item.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{detail || "Fuente científica"}</p>
        {item.institutions?.length ? <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.institutions.slice(0, 3).join(" · ")}</p> : null}
      </div>
      <ExternalLink className="mt-1 size-3.5 text-muted-foreground transition-colors group-hover:text-white" />
    </a>
  )
}

function NewsRow({ item }: { item: NewsEvidence }) {
  const detail = [formatDate(item.date), item.domain, item.sourceCountry].filter(Boolean).join(" · ")
  return (
    <a href={item.url} target="_blank" rel="noreferrer" className="group flex gap-3 py-4 outline-none transition-colors hover:text-white focus-visible:text-white">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-[#13272D] text-muted-foreground"><Newspaper className="size-3.5" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-5 text-white">{item.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail || "GDELT"}</p>
      </div>
      <ExternalLink className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-white" />
    </a>
  )
}

function InitialState() {
  return (
    <section className="py-12">
      <div className="max-w-2xl">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">Qué obtiene</p>
        <h2 className="mt-2 text-2xl font-light tracking-[-0.03em] text-[#E7DFCE]">Una señal sustentada, no una conclusión automática.</h2>
        <div className="mt-6 divide-y divide-border/80 border-y border-border/80">
          {["Actividad actual versus período anterior", "Publicaciones científicas recientes y sus fuentes", "Noticias recientes que pueden aportar contexto", "Base lista para sumar patentes internacionales vía EPO OPS"].map((item) => (
            <div key={item} className="flex items-center gap-3 py-4 text-sm text-muted-foreground"><ArrowRight className="size-3.5 text-[#96B5A6]" />{item}</div>
          ))}
        </div>
      </div>
    </section>
  )
}

function LoadingState() {
  return (
    <section className="py-12" aria-live="polite">
      <div className="flex items-center gap-3 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin text-[#96B5A6]" />Consultando fuentes y comparando períodos…</div>
      <div className="mt-7 h-px w-full bg-border/80" />
    </section>
  )
}

function EmptyEvidence({ text }: { text: string }) {
  return <div className="mt-5 border-y border-border/80 py-7 text-sm leading-6 text-muted-foreground">{text}</div>
}

function trendPresentation(trend: TechnologySignalResponse["momentum"]["trend"]) {
  if (trend === "acelerando") return { label: "Actividad en aumento", icon: ArrowUpRight, className: "border-[#4A7F74]/50 bg-[#173B37] text-[#96B5A6]" }
  if (trend === "desacelerando") return { label: "Actividad en descenso", icon: ArrowDownRight, className: "border-[#7A5B41]/60 bg-[#332C24] text-[#D6A46F]" }
  if (trend === "sin_base") return { label: "Actividad nueva en la ventana", icon: ArrowUpRight, className: "border-[#456E8E]/55 bg-[#172F34] text-[#B7D3D1]" }
  if (trend === "no_disponible") return { label: "Variación no disponible", icon: AlertTriangle, className: "border-[#7A5B41]/60 bg-[#332C24] text-[#D6A46F]" }
  return { label: "Actividad estable", icon: Minus, className: "border-border bg-[#13272D] text-muted-foreground" }
}

function formatDate(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(date)
}
