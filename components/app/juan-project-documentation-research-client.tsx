"use client"

import { useMemo, useState } from "react"
import { ChevronDown, ExternalLink, Loader2, Search, Sparkles } from "lucide-react"

type Source = { title: string; url: string }
type RadarDelta = {
  previousGeneratedAt: string
  summary: string
  newSources: Source[]
  removedSources: Source[]
  retainedSourceCount: number
  sourceSetChanged: boolean
  convictionDelta: 0 | null
  decisionBoundary: string
}
type Radar = {
  generatedAt: string
  query: string
  text: string
  sources: Source[]
  convictionDelta: 0 | null
  decisionBoundary: string
  delta: RadarDelta | null
}

type Project = {
  key: string
  name: string
  direction: string
  status: "researching" | "ready_for_review" | "accepted" | "rejected"
  radar: Radar | null
}

type ResearchResult = {
  project: { key: string; name: string; direction: string; intendedOutcome: string; humanStatus: string; repo: string | null; activeResearchTopics: string[] }
  query: string
  text: string
  sources: Source[]
  decisionBoundary: string
}

const SUGGESTIONS = [
  "Qué avances recientes en IA podríamos aplicar aquí y cómo",
  "Busca documentación oficial sobre agentes, tool use, MCP y automatización aplicable a esta vertical",
  "Busca papers, benchmarks y repos oficiales que puedan mejorar precisión, costo o velocidad operacional",
]

export function JuanProjectDocumentationResearchClient({ projects }: { projects: Project[] }) {
  const [projectKey, setProjectKey] = useState(projects[0]?.key ?? "")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ResearchResult | null>(null)
  const project = useMemo(() => projects.find((item) => item.key === projectKey) ?? projects[0], [projectKey, projects])

  async function runResearch(nextQuery = query) {
    const cleanQuery = nextQuery.trim()
    if (!projectKey || cleanQuery.length < 3 || loading) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const response = await fetch("/api/intelligence/project-documentation-research", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectKey, query: cleanQuery }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pude completar la investigación.")
      setResult(payload as ResearchResult)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pude completar la investigación.")
    } finally {
      setLoading(false)
    }
  }

  return <section className="mx-auto mt-4 w-[calc(100%-2rem)] max-w-[1480px] border border-[#294047] bg-[#0B2025] sm:w-[calc(100%-3rem)]">
    <div className="flex flex-col gap-3 border-b border-[#294047] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.15em] text-[#96B5A6]"><Sparkles className="size-3.5" />I+D por proyecto</div>
        <h2 className="mt-1 text-sm font-medium text-[#E7DFCE]">Qué cambió y qué podemos aplicar</h2>
        <p className="mt-1 text-xs leading-5 text-[#83908F]">El radar automático compara cada lectura con la anterior. Destaca cambios técnicos; la investigación propone, pero no cambia decisiones ni scores.</p>
      </div>
      {project ? <div className="max-w-sm text-right text-[10px] leading-4 text-[#748481]">Dirección actual: <span className="text-[#AEB6B4]">{project.direction}</span></div> : null}
    </div>

    <div className="grid gap-3 px-4 py-4 lg:grid-cols-[240px_minmax(0,1fr)_auto] lg:items-end">
      <label className="grid gap-1.5 text-[10px] uppercase tracking-[0.12em] text-[#748481]">
        Proyecto
        <select value={projectKey} onChange={(event) => { setProjectKey(event.target.value); setResult(null); setError(null) }} className="h-10 border border-[#355C55] bg-[#07181E] px-3 text-xs normal-case tracking-normal text-[#E7DFCE] outline-none focus:border-[#96B5A6]">
          {projects.map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}
        </select>
      </label>
      <label className="grid gap-1.5 text-[10px] uppercase tracking-[0.12em] text-[#748481]">
        Qué quieres investigar
        <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void runResearch() }} placeholder="Ej. agentes de IA para mantenimiento predictivo" className="h-10 border border-[#355C55] bg-[#07181E] px-3 text-xs normal-case tracking-normal text-[#E7DFCE] outline-none placeholder:text-[#546561] focus:border-[#96B5A6]" />
      </label>
      <button type="button" disabled={loading || query.trim().length < 3} onClick={() => void runResearch()} className="inline-flex h-10 items-center justify-center gap-2 bg-[#173B37] px-4 text-xs font-medium text-[#E7DFCE] ring-1 ring-inset ring-[#31534D] transition-colors hover:bg-[#1A4540] disabled:cursor-not-allowed disabled:opacity-45">
        {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Search className="size-3.5 text-[#96B5A6]" />}
        {loading ? "Investigando…" : "Buscar"}
      </button>
    </div>

    {!result && !loading ? <div className="flex flex-wrap gap-2 border-t border-[#294047] px-4 py-3">
      {SUGGESTIONS.map((suggestion) => <button key={suggestion} type="button" onClick={() => { setQuery(suggestion); void runResearch(suggestion) }} className="border border-[#294047] px-2.5 py-1.5 text-left text-[10px] leading-4 text-[#AEB6B4] hover:border-[#355C55] hover:text-[#E7DFCE]">{suggestion}</button>)}
    </div> : null}

    {project?.radar ? <div className="border-t border-[#294047]">
      <div className="px-4 py-4">
        <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#96B5A6]">Radar I+D automático · {project.name}</p>
        {project.radar.delta ? <DeltaSummary delta={project.radar.delta} /> : <div className="mt-2 border-l border-[#355C55] pl-3">
          <p className="text-xs font-medium text-[#E7DFCE]">Primera lectura automática</p>
          <p className="mt-1 text-[10px] leading-4 text-[#748481]">La próxima pasada comparará esta lectura y mostrará sólo los cambios detectados.</p>
        </div>}
      </div>
      <details className="group border-t border-[#294047]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden">
          <div>
            <p className="text-[10px] text-[#AEB6B4]">Ver lectura completa</p>
            <p className="mt-1 text-[10px] text-[#748481]">Última pasada {formatRadarDate(project.radar.generatedAt)} · conviction Δ 0</p>
          </div>
          <ChevronDown className="size-4 shrink-0 text-[#96B5A6] transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-[#294047] px-4 py-4">
          <p className="text-[10px] leading-4 text-[#748481]">{project.radar.decisionBoundary}</p>
          <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#D7DEDA]">{project.radar.text}</div>
          {project.radar.sources.length ? <SourceGrid sources={project.radar.sources} /> : null}
        </div>
      </details>
    </div> : null}

    {error ? <div role="alert" className="border-t border-[#294047] px-4 py-4 text-xs text-[#D6A46F]">{error}</div> : null}

    {result ? <div className="border-t border-[#294047] px-4 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#96B5A6]">{result.project.name} · investigación externa</p>
          <p className="mt-1 text-xs text-[#83908F]">{result.query}</p>
        </div>
        <p className="max-w-lg text-[10px] leading-4 text-[#748481] lg:text-right">{result.decisionBoundary}</p>
      </div>
      <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#D7DEDA]">{result.text}</div>
      {result.sources.length ? <SourceGrid sources={result.sources} /> : null}
    </div> : null}
  </section>
}

function DeltaSummary({ delta }: { delta: RadarDelta }) {
  const newCount = delta.newSources.length
  return <div className="mt-2 border-l border-[#355C55] pl-3">
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <p className="text-xs font-medium text-[#E7DFCE]">Qué cambió desde la pasada anterior</p>
      <span className="text-[9px] uppercase tracking-[0.12em] text-[#96B5A6]">{newCount ? `${newCount} fuente${newCount === 1 ? "" : "s"} nueva${newCount === 1 ? "" : "s"}` : "sin fuentes nuevas"}</span>
    </div>
    <div className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#D7DEDA]">{delta.summary}</div>
    <p className="mt-2 text-[10px] leading-4 text-[#748481]">Comparado con {formatRadarDate(delta.previousGeneratedAt)} · conviction Δ 0</p>
    {delta.newSources.length ? <div className="mt-3 flex flex-wrap gap-2">{delta.newSources.slice(0, 4).map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 border border-[#294047] px-2.5 py-1.5 text-[10px] text-[#AEB6B4] hover:border-[#355C55] hover:text-[#E7DFCE]">{source.title}<ExternalLink className="size-3 shrink-0 text-[#96B5A6]" /></a>)}</div> : null}
  </div>
}

function SourceGrid({ sources }: { sources: Source[] }) {
  return <div className="mt-4 border-t border-[#294047] pt-3">
    <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#748481]">Fuentes</p>
    <div className="mt-2 grid gap-1.5 md:grid-cols-2">
      {sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="flex items-start justify-between gap-2 border border-[#294047] px-3 py-2 text-[10px] leading-4 text-[#AEB6B4] hover:border-[#355C55] hover:text-[#E7DFCE]">
        <span>{source.title}</span><ExternalLink className="mt-0.5 size-3 shrink-0 text-[#96B5A6]" />
      </a>)}
    </div>
  </div>
}

function formatRadarDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "sin fecha"
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date)
}
