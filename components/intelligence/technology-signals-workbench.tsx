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
  ShieldCheck,
} from "lucide-react"
import { OperationalMetric, OperationalMetricRail, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { strategicWatchHref, technologyHref } from "@/lib/intelligence/navigation-context"

const EXAMPLES = ["extracción directa de litio", "hidrógeno verde", "almacenamiento térmico", "desalación electroquímica"]
const SOURCE_LABELS: Record<string, string> = { openalex: "OpenAlex", crossref: "Crossref", inapi_patents: "INAPI · Patentes", gdelt: "GDELT" }

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

type PatentEvidence = {
  source: "inapi_patents"
  sourceRecordId: string
  applicationNumber: string | null
  registrationNumber: string | null
  title: string
  applicants: string | null
  filingDate: string | null
  ipc: string[]
  sourceUrl: string | null
  relevanceScore: number
  recent: boolean
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
  corroboration: {
    status: "corroborada" | "parcial" | "sin_senal" | "insuficiente"
    confidence: "media" | "baja" | "insuficiente"
    confirming_axes: number
    available_axes: number
    axes: {
      research: { available: boolean; status: "actividad" | "sin_actividad" | "no_disponible"; direction: string; current_count: number | null }
      patents: { available: boolean; status: "actividad_reciente" | "actividad_historica" | "sin_senal" | "no_disponible"; recent_matches: number; historical_matches: number }
    }
    conclusion: string
    scope: string
  }
  patent_signal: {
    available: boolean
    recent_matches: number
    selected_matches: number
    distinct_applicants: number
    latest_filing_date: string | null
    basis: string
  }
  evidence: {
    publications: PublicationEvidence[]
    patents: PatentEvidence[]
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
        setError(response.status === 401 ? "Tu sesión expiró. Vuelve a iniciar sesión." : payload.error || "No pudimos evaluar esta tecnología.")
        return
      }
      setResult(payload)
    } catch {
      setResult(null)
      setError("No fue posible revisar esta tecnología en este momento.")
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
      <section id="consulta" className="scroll-mt-24 grid gap-7 border-b border-border/80 pb-9 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.55fr)] lg:gap-10">
        <div>
          <OperationalSectionHeader eyebrow="Evaluación" title="¿Qué tecnología quiere evaluar?" />
          <form onSubmit={run} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ej. extracción directa de litio"
              maxLength={160}
              aria-label="Tecnología a evaluar"
              className="h-11 flex-1"
            />
            <Button type="submit" disabled={query.trim().length < 2 || loading} className="h-11 px-5">
              {loading ? <Loader2 className="animate-spin" /> : <Search />}
              {loading ? "Evaluando" : "Evaluar tecnología"}
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
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">Horizonte</p>
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
          <p className="mt-3 text-xs leading-5 text-muted-foreground">Comparamos este período con el anterior para mostrar si la actividad sube, baja o se mantiene.</p>
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
  const patentCount = result.evidence.patents.length
  const newsCount = result.evidence.news.length
  const unavailableSources = Object.entries(result.sources).filter(([, source]) => !source.available).map(([key]) => SOURCE_LABELS[key] ?? key)
  const publicationSourcesAvailable = Boolean(result.sources.openalex?.available || result.sources.crossref?.available)
  const reading = executiveReading(result)

  return (
    <div>
      <section className="py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">Resultado</p>
            <h2 className="mt-2 text-[1.85rem] font-light tracking-[-0.035em] text-[#E7DFCE]">{result.query}</h2>
          </div>
          <Badge variant="outline" className={`${trend.className} w-fit gap-1.5 px-3 py-1.5 text-xs`}>
            <TrendIcon className="size-3.5" /> {trend.label}
          </Badge>
        </div>
        <p className="mt-4 max-w-3xl text-base leading-7 text-white">{reading.summary}</p>
        {unavailableSources.length ? (
          <div role="status" className="mt-5 flex max-w-3xl items-start gap-3 border-y border-[#7A5B41]/45 bg-[#332C24]/35 px-3 py-3 text-xs leading-5 text-[#D6C3A8]">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#D6A46F]" />
            <p>No pudimos consultar: {unavailableSources.join(" · ")}. El resultado no asume que eso signifique cero actividad.</p>
          </div>
        ) : null}
      </section>

      <OperationalMetricRail>
        <OperationalMetric value={result.momentum.current_publications ?? "—"} label="Investigación reciente" detail={result.momentum.available ? `Últimos ${result.period_days} días` : "Sin datos suficientes"} tone={result.momentum.available ? "success" : "neutral"} />
        <OperationalMetric value={result.patent_signal.recent_matches} label="Nuevas patentes" detail={result.patent_signal.available ? `Presentadas en Chile · ${result.period_days} días` : "Sin datos suficientes"} tone={result.patent_signal.recent_matches > 0 ? "success" : "neutral"} />
        <OperationalMetric value={change === null ? "—" : `${change > 0 ? "+" : ""}${change}%`} label="Cambio en investigación" detail={result.momentum.available ? "Versus el período anterior" : "No calculado"} tone={change !== null && change >= 20 ? "success" : change !== null && change <= -20 ? "warning" : "neutral"} />
        <OperationalMetric value={confidenceLabel(result.corroboration.confidence)} label="Fuerza de la señal" detail={confidenceDetail(result)} tone={result.corroboration.status === "corroborada" ? "success" : result.corroboration.status === "parcial" ? "warning" : "neutral"} />
      </OperationalMetricRail>

      <section className="border-b border-border/80 py-9">
        <OperationalSectionHeader eyebrow="En simple" title="¿Qué está pasando?" meta={corroborationLabel(result.corroboration.status)} />
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <AxisCard
            label="Investigación"
            value={researchAxisLabel(result)}
            detail={result.corroboration.axes.research.available ? `${result.momentum.current_publications ?? 0} publicaciones recientes · Fuente: OpenAlex` : "No pudimos consultar esta fuente"}
          />
          <AxisCard
            label="Patentes"
            value={patentAxisLabel(result.corroboration.axes.patents.status)}
            detail={result.patent_signal.available ? `${result.patent_signal.recent_matches} nuevas · ${result.patent_signal.selected_matches} antecedentes relevantes · Fuente: INAPI Chile` : "No pudimos consultar esta fuente"}
          />
        </div>
        <p className="mt-5 max-w-4xl text-sm leading-6 text-white">{reading.meaning}</p>
        <p className="mt-2 max-w-4xl text-xs leading-5 text-muted-foreground">La señal se basa en investigación y patentes. Las noticias sirven como contexto y no cambian por sí solas la conclusión.</p>

        <div className="mt-7 flex flex-col gap-4 border-y border-border/80 bg-[#13272D]/35 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#96B5A6]">Próximo paso</p>
            <p className="mt-2 text-base font-medium text-white">{reading.actionTitle}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{reading.actionDetail}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {reading.primary === "watch" ? (
              <Button asChild size="sm"><Link href={strategicWatchHref("technology", result.query)}>Vigilar esta tecnología</Link></Button>
            ) : (
              <Button asChild size="sm"><a href="#consulta">Evaluar otra tecnología</a></Button>
            )}
            <Button asChild variant="outline" size="sm"><a href={patentCount > 0 ? "#patentes" : "#evidencia"}>{patentCount > 0 ? "Revisar patentes" : "Ver evidencia"}</a></Button>
            {reading.primary !== "watch" ? <Button asChild variant="ghost" size="sm"><Link href={strategicWatchHref("technology", result.query)}>Vigilar de todos modos</Link></Button> : null}
          </div>
        </div>
      </section>

      <section id="evidencia" className="scroll-mt-24 grid gap-10 py-9 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div>
          <OperationalSectionHeader eyebrow="Investigación" title="Qué encontramos" meta={`${publicationCount} seleccionadas`} />
          {publicationCount ? (
            <div className="mt-5 divide-y divide-border/80 border-y border-border/80">
              {result.evidence.publications.map((item) => <PublicationRow key={`${item.source}:${item.sourceRecordId}`} item={item} />)}
            </div>
          ) : <EmptyEvidence text={publicationSourcesAvailable ? "No encontramos publicaciones recientes para esta búsqueda." : "No pudimos consultar todas las fuentes de investigación. No interpretamos ese vacío como ausencia de actividad."} />}
        </div>

        <div id="patentes" className="scroll-mt-24">
          <OperationalSectionHeader eyebrow="Patentes" title="Quién está protegiendo esta tecnología" meta={`${patentCount} seleccionadas`} />
          {patentCount ? (
            <div className="mt-5 divide-y divide-border/80 border-y border-border/80">
              {result.evidence.patents.map((item) => <PatentRow key={item.sourceRecordId} item={item} />)}
            </div>
          ) : <EmptyEvidence text={result.patent_signal.available ? "No encontramos patentes con una coincidencia suficientemente directa para esta tecnología." : "No pudimos consultar el corpus de patentes INAPI. No interpretamos ese vacío como ausencia de protección."} />}
          <p className="mt-4 text-xs leading-5 text-muted-foreground">Mostramos coincidencias directas en títulos de solicitudes INAPI para evitar resultados que sólo se parecen por palabras sueltas.</p>
        </div>
      </section>

      <section className="border-t border-border/80 py-9">
        <OperationalSectionHeader eyebrow="Contexto" title="Qué está pasando alrededor" meta={`${newsCount} noticias`} />
        {newsCount ? (
          <div className="mt-5 divide-y divide-border/80 border-y border-border/80">
            {result.evidence.news.map((item) => <NewsRow key={item.sourceRecordId} item={item} />)}
          </div>
        ) : <EmptyEvidence text={result.sources.gdelt?.available ? "No encontramos noticias recientes relacionadas con esta tecnología." : "Las noticias no están disponibles temporalmente. Esto no cambia la señal de investigación y patentes."} />}
        <div className="mt-6 max-w-3xl border-t border-border/80 pt-5 text-xs leading-5 text-muted-foreground">
          <p className="font-medium text-white">Cómo usar este contexto</p>
          <p className="mt-2">Las noticias ayudan a entender el entorno. No bastan, por sí solas, para decir que una tecnología está creciendo o entrando al mercado.</p>
        </div>
      </section>
    </div>
  )
}

function AxisCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border-y border-border/80 bg-[#13272D]/45 px-4 py-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#96B5A6]">{label}</p>
      <p className="mt-2 text-base font-medium text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
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
        <p className="mt-1 text-xs text-muted-foreground">{detail || "Fuente de investigación"}</p>
        {item.institutions?.length ? <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.institutions.slice(0, 3).join(" · ")}</p> : null}
      </div>
      <ExternalLink className="mt-1 size-3.5 text-muted-foreground transition-colors group-hover:text-white" />
    </a>
  )
}

function PatentRow({ item }: { item: PatentEvidence }) {
  const detail = [formatDate(item.filingDate), item.applicationNumber ? `Solicitud ${item.applicationNumber}` : null, item.recent ? "Nueva en este período" : "Antecedente anterior"].filter(Boolean).join(" · ")
  const content = (
    <>
      <span className="flex size-8 items-center justify-center rounded-[8px] bg-[#173B37] text-[#96B5A6]"><ShieldCheck className="size-3.5" /></span>
      <div className="min-w-0">
        <h3 className="text-sm font-medium leading-6 text-white">{item.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{detail || "Patente INAPI"}</p>
        {item.applicants ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.applicants}</p> : null}
        {item.ipc.length ? <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">Clasificación técnica: {item.ipc.slice(0, 5).join(" · ")}</p> : null}
      </div>
      {item.sourceUrl ? <ExternalLink className="mt-1 size-3.5 text-muted-foreground transition-colors group-hover:text-white" /> : null}
    </>
  )

  if (!item.sourceUrl) return <div className="grid gap-3 px-2 py-5 sm:grid-cols-[34px_1fr_auto] sm:items-start">{content}</div>
  return <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="group grid gap-3 px-2 py-5 outline-none transition-colors hover:bg-secondary/55 focus-visible:bg-secondary/55 sm:grid-cols-[34px_1fr_auto] sm:items-start">{content}</a>
}

function NewsRow({ item }: { item: NewsEvidence }) {
  const detail = [formatDate(item.date), item.domain, item.sourceCountry].filter(Boolean).join(" · ")
  return (
    <a href={item.url} target="_blank" rel="noreferrer" className="group flex gap-3 py-4 outline-none transition-colors hover:text-white focus-visible:text-white">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-[#13272D] text-muted-foreground"><Newspaper className="size-3.5" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-5 text-white">{item.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail || "Noticia"}</p>
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
        <h2 className="mt-2 text-2xl font-light tracking-[-0.03em] text-[#E7DFCE]">Sepa si una tecnología está ganando terreno.</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">VIDENTIA reúne la evidencia y la convierte en una lectura clara para decidir qué mirar, qué investigar y qué vigilar.</p>
        <div className="mt-6 divide-y divide-border/80 border-y border-border/80">
          {["Si está creciendo la actividad de investigación", "Si aparecen nuevas patentes en Chile", "Qué evidencia respalda la señal", "Qué conviene hacer después"].map((item) => (
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
      <div className="flex items-center gap-3 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin text-[#96B5A6]" />Revisando investigación, patentes y contexto…</div>
      <div className="mt-7 h-px w-full bg-border/80" />
    </section>
  )
}

function EmptyEvidence({ text }: { text: string }) {
  return <div className="mt-5 border-y border-border/80 py-7 text-sm leading-6 text-muted-foreground">{text}</div>
}

function executiveReading(result: TechnologySignalResponse) {
  if (result.corroboration.status === "corroborada") {
    return {
      summary: "Esta tecnología muestra movimiento reciente tanto en investigación como en nuevas patentes.",
      meaning: "Hay dos señales independientes apuntando en la misma dirección. Eso no prueba adopción comercial, pero sí justifica seguirla de cerca.",
      actionTitle: "Vale la pena vigilar esta tecnología",
      actionDetail: "Active una vigilancia para detectar nuevas patentes, publicaciones y cambios relevantes sin repetir la búsqueda manualmente.",
      primary: "watch" as const,
    }
  }
  if (result.corroboration.status === "parcial") {
    return {
      summary: "Hay movimiento reciente, pero todavía no aparece confirmado en más de un frente.",
      meaning: "La señal merece atención, aunque todavía es pronto para concluir que la tecnología esté ganando terreno de forma consistente.",
      actionTitle: "Siga la señal antes de sacar una conclusión",
      actionDetail: "Vigílela y revise la evidencia nueva a medida que aparezca.",
      primary: "watch" as const,
    }
  }
  if (result.corroboration.status === "sin_senal") {
    return {
      summary: "No encontramos actividad reciente suficiente para decir que esta tecnología esté ganando terreno.",
      meaning: "Puede existir actividad histórica o en otras fuentes, pero la evidencia reciente disponible no sostiene una señal clara.",
      actionTitle: "Pruebe otra tecnología o amplíe el horizonte",
      actionDetail: "También puede vigilarla si es estratégica para usted, aunque hoy no muestre una señal reciente fuerte.",
      primary: "search" as const,
    }
  }
  return {
    summary: "Faltan datos suficientes para dar una lectura confiable de esta tecnología.",
    meaning: "Preferimos mostrar una conclusión incompleta antes que convertir una fuente sin respuesta en una falsa ausencia de actividad.",
    actionTitle: "Revise otra tecnología o vuelva a intentarlo después",
    actionDetail: "Si esta tecnología es prioritaria, puede dejarla en vigilancia mientras se recuperan las fuentes faltantes.",
    primary: "search" as const,
  }
}

function confidenceDetail(result: TechnologySignalResponse) {
  if (result.corroboration.status === "corroborada") return "Investigación + patentes"
  if (result.corroboration.status === "parcial") return "Sólo un frente muestra actividad"
  if (result.corroboration.status === "sin_senal") return "Sin actividad reciente confirmada"
  return "Faltan datos para confirmar"
}

function corroborationLabel(status: TechnologySignalResponse["corroboration"]["status"]) {
  if (status === "corroborada") return "Señal confirmada"
  if (status === "parcial") return "Señal parcial"
  if (status === "sin_senal") return "Sin señal reciente"
  return "Faltan datos"
}

function confidenceLabel(confidence: TechnologySignalResponse["corroboration"]["confidence"]) {
  if (confidence === "media") return "Media"
  if (confidence === "baja") return "Baja"
  return "Insuficiente"
}

function researchAxisLabel(result: TechnologySignalResponse) {
  if (!result.corroboration.axes.research.available) return "Sin datos"
  if (result.corroboration.axes.research.status === "sin_actividad") return "Sin actividad reciente"
  return trendPresentation(result.momentum.trend).label
}

function patentAxisLabel(status: TechnologySignalResponse["corroboration"]["axes"]["patents"]["status"]) {
  if (status === "actividad_reciente") return "Hay nuevas patentes"
  if (status === "actividad_historica") return "Hay antecedentes"
  if (status === "sin_senal") return "No vemos nuevas patentes"
  return "Sin datos"
}

function trendPresentation(trend: TechnologySignalResponse["momentum"]["trend"]) {
  if (trend === "acelerando") return { label: "En aumento", icon: ArrowUpRight, className: "border-[#4A7F74]/50 bg-[#173B37] text-[#96B5A6]" }
  if (trend === "desacelerando") return { label: "En descenso", icon: ArrowDownRight, className: "border-[#7A5B41]/60 bg-[#332C24] text-[#D6A46F]" }
  if (trend === "sin_base") return { label: "Actividad nueva", icon: ArrowUpRight, className: "border-[#456E8E]/55 bg-[#172F34] text-[#B7D3D1]" }
  if (trend === "no_disponible") return { label: "Sin datos", icon: AlertTriangle, className: "border-[#7A5B41]/60 bg-[#332C24] text-[#D6A46F]" }
  return { label: "Estable", icon: Minus, className: "border-border bg-[#13272D] text-muted-foreground" }
}

function formatDate(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(date)
}
