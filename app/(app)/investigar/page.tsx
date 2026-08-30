"use client"

import { type FormEvent, type ReactNode, useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  FlaskConical,
  Loader2,
  Search,
  Tags,
} from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { WatchActionButton } from "@/components/app/watch-action-button"

type ResearchMode = "overview" | "brand" | "company" | "technology"

type BrandHit = {
  id: string
  nombre: string
  solicitante?: string | null
  estado: string
  numeroRegistro?: string | null
  niza?: string[]
}

type BrandResponse = {
  results?: BrandHit[]
  total?: number
  durationMs?: number
  source?: string
  error?: string
}

type PatentHit = {
  id: string
  applicationNumber: string | null
  registrationNumber: string | null
  title: string
  applicants: string | null
  status: string | null
  filingDate: string | null
  ipc: string[]
}

type PatentResponse = {
  results?: PatentHit[]
  total?: number
  durationMs?: number
  source?: string
  error?: string
}

type CompanyResponse = {
  query?: string
  matched?: boolean
  portfolio?: {
    totalRecords: number
    registered: number
    pending: number
    recentFilings90d: number
    technologyFamilies: number
  }
  topIpc?: Array<{ code: string; family: string; records: number }>
  recentPatents?: Array<{ id: string; title: string; status: string | null; ipc_codes: string[] }>
  methodology?: { growthClaimsEnabled: boolean; note: string }
  error?: string
}

type ResearchResult = {
  brands: BrandResponse | null
  patents: PatentResponse | null
  company: CompanyResponse | null
  failures: string[]
}

const MODES: Array<{
  value: ResearchMode
  label: string
  description: string
  icon: (props: { className?: string }) => ReactNode
}> = [
  { value: "overview", label: "Panorama", description: "Marca, patentes y actividad empresarial en una sola lectura.", icon: ({ className }) => <Search className={className} /> },
  { value: "brand", label: "Marca", description: "Antecedentes, titulares, estados y clases Niza.", icon: ({ className }) => <Tags className={className} /> },
  { value: "company", label: "Empresa", description: "Cartera de patentes, IPC y actividad observada.", icon: ({ className }) => <Building2 className={className} /> },
  { value: "technology", label: "Tecnología / patente", description: "Conceptos, títulos, solicitantes e IPC relacionados.", icon: ({ className }) => <FlaskConical className={className} /> },
]

function isResearchMode(value: string | null): value is ResearchMode {
  return value === "overview" || value === "brand" || value === "company" || value === "technology"
}

export default function InvestigarPage() {
  const [mode, setMode] = useState<ResearchMode>("overview")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ResearchResult | null>(null)

  const runResearch = async (rawQuery: string, selectedMode: ResearchMode) => {
    const q = rawQuery.trim()
    if (q.length < 2) return

    setLoading(true)
    setError(null)
    setResult(null)

    const fetchBrands = async (): Promise<BrandResponse> => {
      const params = new URLSearchParams({ q, type: "nombre", match: "3" })
      const response = await fetch(`/api/inapi/search?${params}`, { cache: "no-store" })
      const payload = (await response.json().catch(() => ({}))) as BrandResponse
      if (!response.ok) throw new Error(response.status === 401 ? "Tu sesión expiró. Vuelve a iniciar sesión." : payload.error || "No fue posible consultar marcas.")
      return payload
    }

    const fetchPatents = async (): Promise<PatentResponse> => {
      const params = new URLSearchParams({ q, limit: "20" })
      const response = await fetch(`/api/patents/search?${params}`, { cache: "no-store" })
      const payload = (await response.json().catch(() => ({}))) as PatentResponse
      if (!response.ok) throw new Error(response.status === 401 ? "Tu sesión expiró. Vuelve a iniciar sesión." : payload.error || "No fue posible consultar patentes.")
      return payload
    }

    const fetchCompany = async (): Promise<CompanyResponse> => {
      const response = await fetch(`/api/patents/company?q=${encodeURIComponent(q)}`, { cache: "no-store" })
      const payload = (await response.json().catch(() => ({}))) as CompanyResponse
      if (!response.ok) throw new Error(response.status === 401 ? "Tu sesión expiró. Vuelve a iniciar sesión." : payload.error || "No fue posible construir el perfil empresarial.")
      return payload
    }

    try {
      if (selectedMode === "brand") {
        setResult({ brands: await fetchBrands(), patents: null, company: null, failures: [] })
      } else if (selectedMode === "company") {
        setResult({ brands: null, patents: null, company: await fetchCompany(), failures: [] })
      } else if (selectedMode === "technology") {
        setResult({ brands: null, patents: await fetchPatents(), company: null, failures: [] })
      } else {
        const [brands, patents, company] = await Promise.allSettled([fetchBrands(), fetchPatents(), fetchCompany()])
        const failures = [
          brands.status === "rejected" ? "Marcas" : null,
          patents.status === "rejected" ? "Patentes" : null,
          company.status === "rejected" ? "Perfil empresarial" : null,
        ].filter((value): value is string => Boolean(value))

        if (failures.length === 3) throw new Error("No fue posible consultar las fuentes de investigación.")

        setResult({
          brands: brands.status === "fulfilled" ? brands.value : null,
          patents: patents.status === "fulfilled" ? patents.value : null,
          company: company.status === "fulfilled" ? company.value : null,
          failures,
        })
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible completar la investigación.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const initialQuery = params.get("q")?.trim() ?? ""
    const initialMode = isResearchMode(params.get("mode")) ? (params.get("mode") as ResearchMode) : "overview"
    if (!initialQuery) return
    setQuery(initialQuery)
    setMode(initialMode)
    if (params.get("autorun") === "1") void runResearch(initialQuery, initialMode)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (event: FormEvent) => {
    event.preventDefault()
    if (loading) return
    await runResearch(query, mode)
  }

  const hasResults = Boolean(result?.brands || result?.patents || result?.company)
  const activeMode = MODES.find((item) => item.value === mode) ?? MODES[0]

  return (
    <OperationalPage>
      <OperationalHeader
        eyebrow="VIDENTIA / Investigar"
        title="¿Qué necesitas entender?"
        description={<>Busca una marca, empresa, tecnología o concepto. VIDENTIA consulta las capas disponibles y mantiene separadas la fuente, la observación y el siguiente paso.</>}
        meta={<><span>Fuentes visibles</span><span>Panorama parcial explícito</span><span>Sin análisis generativo en esta vista</span></>}
      />

      <section className="py-7 sm:py-8">
        <OperationalPanel className="p-0 sm:p-0">
          <form onSubmit={run}>
            <div className="p-4 sm:p-5">
              <label htmlFor="research-query" className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">Consulta</label>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Input id="research-query" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Término de investigación" placeholder={mode === "company" ? "Ejemplo: NESTLE" : mode === "technology" ? "Ejemplo: litio, A61, baterías" : mode === "brand" ? "Ejemplo: FALABELLA" : "Marca, empresa o tecnología"} maxLength={160} className="h-12 flex-1 text-base" />
                <Button type="submit" disabled={query.trim().length < 2 || loading} className="h-12 min-w-40 sm:min-w-44">{loading ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Search className="h-4 w-4" />}{loading ? "Investigando" : "Investigar"}</Button>
              </div>

              <div className="mt-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Alcance</p>
                <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Alcance de investigación">
                  {MODES.map((item) => {
                    const active = mode === item.value
                    return (
                      <button
                        key={item.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => { setMode(item.value); setResult(null); setError(null) }}
                        className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-[9px] px-3.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 ${active ? "bg-[#173B37] text-white" : "bg-[#0F2A33] text-muted-foreground hover:bg-[#172F34] hover:text-white"}`}
                      >
                        {item.icon({ className: active ? "h-4 w-4 text-[#96B5A6]" : "h-4 w-4" })}
                        {item.label}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground"><span className="font-medium text-white">{activeMode.label}:</span> {activeMode.description}</p>
              </div>
            </div>
            <div className="border-t border-border/80 px-4 py-3 sm:px-5"><p className="text-xs leading-5 text-muted-foreground">La capa de marcas consulta datos INAPI disponibles en la plataforma. Panorama combina varias fuentes en paralelo y muestra explícitamente cualquier capa que no responda.</p></div>
          </form>
        </OperationalPanel>
      </section>

      {error && <div role="alert" className="flex items-start gap-3 rounded-[10px] bg-[#3A2525] p-4 text-sm text-[#E8AAA3]"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

      {hasResults && result && (
        <section className="pt-2">
          <div className="flex flex-col gap-5 border-b border-border/80 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <OperationalSectionHeader eyebrow="Resultado de investigación" title={<>“{query.trim()}”</>} />
            <SourceStrip result={result} />
          </div>

          {result.failures.length > 0 && <div className="mt-5 flex items-start gap-3 rounded-[10px] bg-[#332C24] p-4"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#D6A46F]" /><div><p className="text-sm font-medium text-white">Panorama parcial</p><p className="mt-1 text-xs leading-5 text-muted-foreground">No respondieron: {result.failures.join(", ")}. Los resultados disponibles se mantienen visibles sin completar esos vacíos por inferencia.</p></div></div>}

          {result.brands && <BrandSection data={result.brands} query={query} />}
          {result.company && <CompanySection data={result.company} query={query} />}
          {result.patents && <PatentSection data={result.patents} />}
        </section>
      )}

      {!hasResults && !loading && !error && <EmptyResearch />}

      <section className="mt-9 grid gap-4 border-t border-border/80 pt-7 md:grid-cols-[1fr_auto] md:items-center"><div><h2 className="text-lg font-light tracking-[-0.02em] text-[#E7DFCE]">Herramientas especializadas siguen disponibles</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Filtros técnicos, expediente completo y consultas avanzadas siguen accesibles sin reemplazar este flujo principal.</p></div><Link href="/consulta" className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-[#96B5A6]">Abrir búsqueda avanzada <ArrowRight className="h-4 w-4" /></Link></section>
    </OperationalPage>
  )
}

function SourceStrip({ result }: { result: ResearchResult }) {
  const sources = [
    ["Marcas", Boolean(result.brands)],
    ["Patentes", Boolean(result.patents)],
    ["Empresa", Boolean(result.company)],
  ] as const

  return <div className="flex flex-wrap items-center gap-2">{sources.map(([label, available]) => <span key={label} className={`inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${available ? "bg-[#173B37] text-[#96B5A6]" : "bg-[#13272D] text-muted-foreground"}`}><span className={`h-1.5 w-1.5 rounded-full ${available ? "bg-[#96B5A6]" : "bg-muted-foreground/35"}`} />{label}</span>)}</div>
}

function BrandSection({ data, query }: { data: BrandResponse; query: string }) {
  const rows = (data.results ?? []).slice(0, 6)
  return (
    <section className="border-b border-border/80 py-8">
      <EvidenceHeading index="01" title="Marcas relacionadas" meta={`${data.total ?? data.results?.length ?? 0} antecedentes encontrados`} action={<Link href={`/consulta-inapi?q=${encodeURIComponent(query.trim())}&type=nombre&match=3&autorun=1`} className="inline-flex items-center gap-1.5 text-sm font-medium text-white hover:text-[#96B5A6]">Profundizar en marcas <ArrowRight className="h-4 w-4" /></Link>} />
      {rows.length > 0 ? <div className="mt-5 divide-y divide-border/80 border-y border-border/80">{rows.map((brand) => <div key={brand.id} className="grid gap-4 px-2 py-4 md:grid-cols-[1fr_auto] md:items-center"><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-white">{brand.nombre || "Marca sin nombre"}</p><Badge variant="outline" className="bg-[#13272D]">{brand.estado || "Sin estado"}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{brand.solicitante || "Titular no informado"}</p><p className="mt-2 text-xs text-muted-foreground">Niza {brand.niza?.join(", ") || "—"} · Registro {brand.numeroRegistro || "—"}</p></div>{brand.nombre && <Button asChild size="sm" variant="ghost" className="justify-self-start md:justify-self-end"><Link href={`/evaluar?brand=${encodeURIComponent(brand.nombre)}`}>Evaluar esta marca <ArrowRight className="h-3.5 w-3.5" /></Link></Button>}</div>)}</div> : <EmptyLine copy="No encontramos antecedentes marcarios para este término." />}
      {data.source && <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Fuente reportada: {data.source}</p>}
    </section>
  )
}

function CompanySection({ data, query }: { data: CompanyResponse; query: string }) {
  return (
    <section className="border-b border-border/80 py-8">
      <EvidenceHeading index="02" title="Actividad empresarial observada" meta={data.matched ? "Perfil construido desde expedientes de patente" : "Sin perfil empresarial suficiente"} action={<div className="flex flex-wrap gap-2">{data.matched && <WatchActionButton type="company" query={data.query || query} />}<Button asChild size="sm" variant="ghost"><Link href="/patentes">Abrir perfil competitivo <ArrowRight className="h-4 w-4" /></Link></Button></div>} />
      {data.matched && data.portfolio ? <><OperationalMetricRail className="mt-5 lg:grid-cols-5"><OperationalMetric label="Cartera observada" value={String(data.portfolio.totalRecords)} detail="Expedientes"/><OperationalMetric label="Registradas" value={String(data.portfolio.registered)} detail="Con registro" tone="success"/><OperationalMetric label="En trámite" value={String(data.portfolio.pending)} detail="Pendientes"/><OperationalMetric label="Solicitudes 90 días" value={String(data.portfolio.recentFilings90d)} detail="Actividad reciente"/><OperationalMetric label="Familias tecnológicas" value={String(data.portfolio.technologyFamilies)} detail="Agrupaciones IPC"/></OperationalMetricRail>{(data.topIpc?.length ?? 0) > 0 && <div className="mt-5 grid gap-px overflow-hidden rounded-[10px] bg-border/70 sm:grid-cols-2 lg:grid-cols-3">{data.topIpc?.slice(0, 6).map((item) => <div key={item.code} className="flex items-center justify-between gap-3 bg-background p-4"><div><p className="text-sm font-medium text-white">{item.code}</p><p className="mt-1 text-xs text-muted-foreground">{item.records} expedientes</p></div><WatchActionButton type="ipc" query={item.code} label="Vigilar" /></div>)}</div>}{data.methodology?.note && <p className="mt-4 text-xs leading-5 text-muted-foreground">Metodología: {data.methodology.note}</p>}</> : <EmptyLine copy="Prueba con el nombre formal del solicitante o utiliza la búsqueda tecnológica." />}
    </section>
  )
}

function PatentSection({ data }: { data: PatentResponse }) {
  const rows = (data.results ?? []).slice(0, 6)
  return (
    <section className="border-b border-border/80 py-8">
      <EvidenceHeading index="03" title="Patentes y tecnología" meta={`${data.total ?? data.results?.length ?? 0} expedientes relacionados`} action={<Button asChild size="sm" variant="ghost"><Link href="/patentes">Profundizar en patentes <ArrowRight className="h-4 w-4" /></Link></Button>} />
      {rows.length > 0 ? <div className="mt-5 divide-y divide-border/80 border-y border-border/80">{rows.map((patent) => <div key={patent.id} className="px-2 py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="max-w-4xl"><p className="font-medium leading-snug text-white">{patent.title}</p><p className="mt-1 text-xs text-muted-foreground">{patent.applicants || "Solicitante no informado"}</p></div><Badge variant="outline" className="bg-[#13272D]">{patent.status || "Sin estado"}</Badge></div><div className="mt-3 flex flex-wrap items-center gap-2">{patent.ipc.slice(0, 5).map((code) => <div key={code} className="flex items-center gap-1"><Badge variant="secondary">{code}</Badge><WatchActionButton type="ipc" query={code} label="Vigilar" /></div>)}</div></div>)}</div> : <EmptyLine copy="No encontramos patentes relacionadas con este término." />}
      {data.source && <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Fuente reportada: {data.source}</p>}
    </section>
  )
}

function EvidenceHeading({ index, title, meta, action }: { index: string; title: string; meta: string; action: ReactNode }) {
  return <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">{index} / evidencia</p><h3 className="mt-2 text-2xl font-light tracking-[-0.03em] text-[#E7DFCE]">{title}</h3><p className="mt-1 text-xs text-muted-foreground">{meta}</p></div>{action}</div>
}

function EmptyLine({ copy }: { copy: string }) {
  return <div className="mt-5 border-y border-border/80 py-8 text-sm text-muted-foreground">{copy}</div>
}

function EmptyResearch() {
  return <section className="mt-2 grid gap-px border-y border-border/80 bg-border/60 md:grid-cols-3"><EmptyPrompt icon={<Tags className="h-5 w-5" />} title="¿Hay marcas parecidas?" copy="Busca nombres cercanos, titulares, estados y clases para dimensionar el panorama marcario." /><EmptyPrompt icon={<Building2 className="h-5 w-5" />} title="¿Qué actividad tiene una empresa?" copy="Observa cartera de patentes, tecnologías dominantes y actividad reciente disponible." /><EmptyPrompt icon={<FlaskConical className="h-5 w-5" />} title="¿Quién trabaja en esta tecnología?" copy="Encuentra expedientes por concepto o IPC e identifica solicitantes relacionados." /></section>
}

function EmptyPrompt({ icon, title, copy }: { icon: ReactNode; title: string; copy: string }) {
  return <div className="bg-background p-5 sm:p-6"><span className="text-[#96B5A6]">{icon}</span><h2 className="mt-4 font-medium text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p></div>
}
