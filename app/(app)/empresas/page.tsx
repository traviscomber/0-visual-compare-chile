"use client"

import { FormEvent, useState } from "react"
import { Activity, AlertTriangle, Building2, ExternalLink, FlaskConical, Loader2, Newspaper, Search, Tag } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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
  direction: null | {
    headline: string
    observed_fact: string
    interpretation: string
    why_it_matters: string
    confidence: number
    evidence_level: "alta" | "media" | "baja"
    guardrail: string
  }
  recent_evidence: Evidence[]
  external: {
    openalex_current: number | null
    openalex_previous: number | null
    publications: ExternalItem[]
    news: ExternalItem[]
    errors: string[]
  }
}

export default function CompaniesPage() {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runSearch(event?: FormEvent, identityId?: string) {
    event?.preventDefault()
    if (query.trim().length < 2 || loading) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ q: query.trim() })
      if (identityId) params.set("identityId", identityId)
      const response = await fetch(`/api/intelligence/company-direction?${params.toString()}`, { cache: "no-store" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos analizar la empresa.")
      setResult(payload as Result)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos analizar la empresa.")
    } finally {
      setLoading(false)
    }
  }

  const deltaLabel = result?.metrics.delta_pct === null
    ? "Sin base previa"
    : `${result.metrics.delta_pct > 0 ? "+" : ""}${result.metrics.delta_pct}% vs semestre anterior`

  return <OperationalPage>
    <OperationalHeader
      eyebrow="VIDENTIA / Empresas"
      title="Qué está protegiendo ahora que hace seis meses no protegía."
      description={<>Compara la actividad de propiedad intelectual de una empresa en dos ventanas consecutivas de 180 días. VIDENTIA normaliza variantes de titular, separa patentes y marcas y muestra qué clases técnicas o comerciales aparecieron por primera vez.</>}
      meta={<><span>INAPI</span><span>IPC + Niza</span><span>OpenAlex + Crossref</span><span>GDELT</span></>}
    />

    <section className="border-b border-border/80 py-8">
      <form onSubmit={event => void runSearch(event)} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <Input
          value={query}
          onChange={event => setQuery(event.target.value)}
          maxLength={160}
          placeholder="Ej: Falabella, SQM, CMPC, Apple"
          aria-label="Empresa o titular"
        />
        <Button disabled={query.trim().length < 2 || loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Comparar 6 meses
        </Button>
      </form>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">La resolución une sólo variantes tipográficas y formas jurídicas conservadoras. Si existen varias identidades plausibles, puedes elegir cuál analizar.</p>
    </section>

    {error ? <div role="alert" className="mt-6 rounded-[10px] bg-[#3A2525] p-4 text-sm text-[#E8AAA3]">{error}</div> : null}

    {!result && !loading ? <InitialState /> : null}
    {result && !result.selected ? <NoMatch /> : null}

    {result?.selected ? <>
      <OperationalMetricRail>
        <OperationalMetric value={result.metrics.current_total} label="Expedientes / 180 días" detail={deltaLabel} tone={result.metrics.delta > 0 ? "success" : "neutral"} />
        <OperationalMetric value={result.metrics.current_patents} label="Patentes" detail={`${result.metrics.previous_patents} en los 180 días anteriores`} />
        <OperationalMetric value={result.metrics.current_trademarks} label="Marcas" detail={`${result.metrics.previous_trademarks} en los 180 días anteriores`} />
        <OperationalMetric value={result.new_ipc.length + result.new_niza.length} label="Áreas nuevas" detail="IPC + Niza no presentes en la ventana anterior" tone={result.new_ipc.length + result.new_niza.length ? "success" : "neutral"} />
      </OperationalMetricRail>

      <IdentitySection result={result} loading={loading} onSelect={id => void runSearch(undefined, id)} />
      <DirectionSection result={result} />
      <ProtectionDeltaSection result={result} />
      <EvidenceSection evidence={result.recent_evidence} />
      <ExternalSignalsSection result={result} />
    </> : null}
  </OperationalPage>
}

function InitialState() {
  return <section className="py-14">
    <Building2 className="h-6 w-6 text-[#96B5A6]" />
    <h2 className="mt-4 text-xl font-medium text-white">Compara la dirección observable de una empresa.</h2>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">VIDENTIA toma el portafolio de los últimos 12 meses y compara dos semestres consecutivos. El resultado muestra cambios de intensidad, nuevas áreas IPC/Niza y los expedientes que sostienen la lectura.</p>
  </section>
}

function NoMatch() {
  return <section className="py-14">
    <AlertTriangle className="h-5 w-5 text-[#C9A56A]" />
    <p className="mt-3 font-medium text-white">No encontramos una identidad suficientemente cercana.</p>
    <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Prueba con la razón social completa o el nombre que aparece como solicitante/titular en INAPI.</p>
  </section>
}

function IdentitySection({ result, loading, onSelect }: { result: Result; loading: boolean; onSelect: (id: string) => void }) {
  const selected = result.selected!
  const alternatives = result.candidates.filter(item => item.id !== selected.id).slice(0, 5)
  return <section className="border-b border-border/80 py-8">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Identidad resuelta</p>
        <h2 className="mt-2 text-xl font-medium text-white">{selected.canonical_name}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{selected.country ? `País ${selected.country} · ` : ""}{result.aliases.length} alias observados · {selected.activity_12m} expedientes en 12 meses · confianza de resolución {Math.round(selected.resolution_confidence * 100)}%</p>
        {result.aliases.length > 1 ? <p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">Variantes: {result.aliases.slice(0, 5).join(" · ")}</p> : null}
      </div>
      {alternatives.length ? <div className="min-w-0 lg:max-w-xl"><p className="text-xs text-muted-foreground">¿Buscabas otra identidad?</p><div className="mt-2 flex flex-wrap gap-2">{alternatives.map(item => <Button key={item.id} variant="outline" size="sm" disabled={loading} onClick={() => onSelect(item.id)}>{item.canonical_name}</Button>)}</div></div> : null}
    </div>
  </section>
}

function DirectionSection({ result }: { result: Result }) {
  const direction = result.direction
  if (!direction) return <section className="border-b border-border/80 py-9"><OperationalSectionHeader title="Dirección observada" /><p className="mt-4 text-sm leading-6 text-muted-foreground">No hay suficiente actividad en los últimos 12 meses para comparar dos ventanas semestrales.</p></section>

  return <section className="border-b border-border/80 py-9">
    <OperationalSectionHeader title="Dirección observada" action={<span className="text-xs text-muted-foreground">Confianza {direction.confidence}/100 · evidencia {direction.evidence_level}</span>} />
    <h3 className="mt-5 max-w-4xl text-2xl font-medium leading-8 text-white">{direction.headline}</h3>
    <div className="mt-7 grid gap-7 lg:grid-cols-3">
      <Fact label="Hecho observado" text={direction.observed_fact} />
      <Fact label="Interpretación" text={direction.interpretation} />
      <Fact label="Por qué importa" text={direction.why_it_matters} />
    </div>
    <div className="mt-6 flex max-w-4xl gap-3 border-l-2 border-[#C9A56A] pl-4"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A56A]" /><p className="text-xs leading-5 text-[#D8C49C]">{direction.guardrail}</p></div>
  </section>
}

function ProtectionDeltaSection({ result }: { result: Result }) {
  return <section className="border-b border-border/80 py-9">
    <OperationalSectionHeader title="Qué aparece ahora y no aparecía hace seis meses" />
    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Sólo se muestran clasificaciones presentes en los últimos 180 días y ausentes en los 180 días anteriores. Una clase nueva indica expansión observable de cobertura, no necesariamente una tecnología o negocio completamente nuevo.</p>
    <div className="mt-7 grid gap-8 xl:grid-cols-2">
      <MovementList icon={FlaskConical} title="Nuevas áreas técnicas · IPC" items={result.new_ipc} empty="No aparecen nuevas subclases IPC en la ventana actual." />
      <MovementList icon={Tag} title="Nuevas áreas comerciales · Niza" items={result.new_niza} empty="No aparecen nuevas clases Niza en la ventana actual." />
    </div>
  </section>
}

function MovementList({ icon: Icon, title, items, empty }: { icon: typeof Activity; title: string; items: Movement[]; empty: string }) {
  return <div>
    <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-[#96B5A6]" /><h3 className="font-medium text-white">{title}</h3></div>
    {items.length ? <div className="mt-4 divide-y divide-border/80 border-y border-border/80">{items.map(item => <div key={item.code} className="flex items-center justify-between gap-4 py-4"><div><p className="font-medium text-white">{item.code}</p><p className="mt-1 text-xs text-muted-foreground">Ausente en el semestre anterior</p></div><div className="text-right"><p className="text-lg text-[#96B5A6]">{item.current}</p><p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">expedientes</p></div></div>)}</div> : <p className="mt-4 border-y border-border/80 py-6 text-sm text-muted-foreground">{empty}</p>}
  </div>
}

function EvidenceSection({ evidence }: { evidence: Evidence[] }) {
  return <section className="border-b border-border/80 py-9">
    <OperationalSectionHeader title="Expedientes que sostienen la lectura" />
    {evidence.length ? <div className="mt-5 divide-y divide-border/80 border-y border-border/80">{evidence.map(item => <article key={item.id} className="grid gap-3 py-5 sm:grid-cols-[34px_minmax(0,1fr)_auto] sm:items-start"><span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#173B37] text-[#96B5A6]">{item.entity_type === "patent" ? <FlaskConical className="h-3.5 w-3.5" /> : <Tag className="h-3.5 w-3.5" />}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="bg-[#13272D]">{item.entity_type === "patent" ? "Patente" : "Marca"}</Badge>{item.filing_date ? <span className="text-xs text-muted-foreground">{formatDate(item.filing_date)}</span> : null}{item.classification_codes.slice(0, 4).map(code => <span key={code} className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{code}</span>)}</div><p className="mt-2 font-medium leading-6 text-white">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.applicant_raw}{item.status ? ` · ${item.status}` : ""}</p></div>{item.source_url ? <Button asChild variant="ghost" size="sm"><a href={item.source_url} target="_blank" rel="noreferrer">Fuente <ExternalLink className="h-3.5 w-3.5" /></a></Button> : null}</article>)}</div> : <p className="mt-5 text-sm text-muted-foreground">No hay expedientes recientes en la ventana actual.</p>}
  </section>
}

function ExternalSignalsSection({ result }: { result: Result }) {
  const external = result.external
  const hasExternal = external.publications.length || external.news.length || external.openalex_current !== null
  if (!hasExternal && !external.errors.length) return null
  return <section className="py-9">
    <OperationalSectionHeader title="Señales externas para contrastar" />
    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Estas señales se buscan por el nombre resuelto de la empresa. Sirven para corroborar contexto científico o público, pero no se consideran evidencia de identidad ni de intención corporativa por sí solas.</p>
    {external.openalex_current !== null ? <div className="mt-5 border-y border-border/80 py-4 text-sm text-muted-foreground">OpenAlex: <span className="text-white">{external.openalex_current}</span> publicaciones coincidentes en la ventana actual{external.openalex_previous !== null ? <> vs <span className="text-white">{external.openalex_previous}</span> en la anterior</> : null}.</div> : null}
    <div className="mt-7 grid gap-8 xl:grid-cols-2">
      <ExternalList icon={Activity} title="Publicaciones" items={external.publications} />
      <ExternalList icon={Newspaper} title="Noticias recientes" items={external.news} />
    </div>
    {external.errors.length ? <p className="mt-6 text-xs text-muted-foreground">Fuentes temporalmente no disponibles: {external.errors.map(item => item.split(":")[0]).join(", ")}.</p> : null}
  </section>
}

function ExternalList({ icon: Icon, title, items }: { icon: typeof Activity; title: string; items: ExternalItem[] }) {
  return <div><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-[#96B5A6]" /><h3 className="font-medium text-white">{title}</h3></div>{items.length ? <div className="mt-4 divide-y divide-border/80 border-y border-border/80">{items.map(item => <a key={item.url} href={item.url} target="_blank" rel="noreferrer" className="block py-4 transition-colors hover:text-white"><div className="flex items-center gap-2"><span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{item.source}</span>{item.date ? <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span> : null}</div><p className="mt-1 text-sm leading-6 text-[#D5E0E3]">{item.title}</p></a>)}</div> : <p className="mt-4 border-y border-border/80 py-6 text-sm text-muted-foreground">Sin señales coincidentes en la ventana consultada.</p>}</div>
}

function Fact({ label, text }: { label: string; text: string }) {
  return <div><p className="text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground">{label}</p><p className="mt-2 text-sm leading-6 text-[#D5E0E3]">{text}</p></div>
}

function formatDate(value: string) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  const date = new Date(dateOnly ? `${value}T12:00:00Z` : value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeZone: dateOnly ? "UTC" : "America/Santiago" }).format(date)
}
