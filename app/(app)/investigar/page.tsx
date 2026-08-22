"use client"

import { FormEvent, type ReactNode, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Building2,
  Database,
  FlaskConical,
  Loader2,
  Search,
  ShieldCheck,
  Tags,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

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
}

const MODES: Array<{
  value: ResearchMode
  label: string
  description: string
  icon: (props: { className?: string }) => ReactNode
}> = [
  {
    value: "overview",
    label: "Panorama",
    description: "Busca el término en marcas, patentes y actividad empresarial.",
    icon: ({ className }) => <Search className={className} />,
  },
  {
    value: "brand",
    label: "Marca",
    description: "Antecedentes marcarios, titulares, estados y clases Niza.",
    icon: ({ className }) => <Tags className={className} />,
  },
  {
    value: "company",
    label: "Empresa",
    description: "Cartera de patentes, actividad, IPC y señales competitivas.",
    icon: ({ className }) => <Building2 className={className} />,
  },
  {
    value: "technology",
    label: "Tecnología / patente",
    description: "Conceptos, títulos, solicitantes e IPC relevantes.",
    icon: ({ className }) => <FlaskConical className={className} />,
  },
]

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}

export default function InvestigarPage() {
  const [mode, setMode] = useState<ResearchMode>("overview")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ResearchResult | null>(null)

  const run = async (event: FormEvent) => {
    event.preventDefault()
    const q = query.trim()
    if (q.length < 2 || loading) return

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
      if (mode === "brand") {
        const brands = await fetchBrands()
        setResult({ brands, patents: null, company: null })
      } else if (mode === "company") {
        const company = await fetchCompany()
        setResult({ brands: null, patents: null, company })
      } else if (mode === "technology") {
        const patents = await fetchPatents()
        setResult({ brands: null, patents, company: null })
      } else {
        const [brands, patents, company] = await Promise.allSettled([fetchBrands(), fetchPatents(), fetchCompany()])
        setResult({
          brands: brands.status === "fulfilled" ? brands.value : null,
          patents: patents.status === "fulfilled" ? patents.value : null,
          company: company.status === "fulfilled" ? company.value : null,
        })
        if (brands.status === "rejected" && patents.status === "rejected" && company.status === "rejected") {
          throw new Error("No fue posible consultar las fuentes de investigación.")
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible completar la investigación.")
    } finally {
      setLoading(false)
    }
  }

  const hasResults = Boolean(result?.brands || result?.patents || result?.company)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="max-w-4xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <Database className="h-3.5 w-3.5" /> Investigación
        </div>
        <h1 className="text-4xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl lg:text-6xl">
          ¿Qué necesitas entender?
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
          Busca una marca, empresa, tecnología o concepto. Visual Compare consulta el corpus local de INAPI y organiza la evidencia para que puedas decidir dónde profundizar.
        </p>
      </header>

      <section className="mt-10 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
        <div className="grid gap-3 md:grid-cols-4">
          {MODES.map((item) => {
            const active = mode === item.value
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => { setMode(item.value); setResult(null); setError(null) }}
                className={`rounded-2xl border p-4 text-left transition ${active ? "border-foreground/30 bg-foreground text-background" : "border-border bg-background hover:border-foreground/20 hover:bg-secondary/30"}`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">{item.icon({ className: "h-4 w-4" })}{item.label}</div>
                <p className={`mt-2 text-xs leading-5 ${active ? "text-background/70" : "text-muted-foreground"}`}>{item.description}</p>
              </button>
            )
          })}
        </div>

        <form onSubmit={run} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={mode === "company" ? "Ejemplo: NESTLE" : mode === "technology" ? "Ejemplo: litio, A61, baterías" : mode === "brand" ? "Ejemplo: FALABELLA" : "Marca, empresa o tecnología"}
            maxLength={160}
            className="h-12 flex-1 text-base"
          />
          <Button type="submit" disabled={query.trim().length < 2 || loading} className="h-12 min-w-44">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            {loading ? "Investigando" : "Investigar"}
          </Button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">Las búsquedas usan el mirror oficial local de INAPI. “Panorama” consulta varias capas en paralelo y no ejecuta análisis generativo.</p>
      </section>

      {error && <div role="alert" className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

      {hasResults && (
        <section className="mt-8 space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Panorama para</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">“{query.trim()}”</h2>
            </div>
            <Badge variant="outline" className="gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Datos INAPI</Badge>
          </div>

          {result?.brands && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><CardTitle className="text-xl">Marcas relacionadas</CardTitle><CardDescription>{result.brands.total ?? result.brands.results?.length ?? 0} antecedentes encontrados</CardDescription></div>
                  <Link href="/consulta-inapi" className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline">Profundizar en marcas <ArrowRight className="h-4 w-4" /></Link>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {(result.brands.results ?? []).slice(0, 6).map((brand) => (
                  <div key={brand.id} className="rounded-xl border border-border bg-secondary/15 p-4">
                    <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-foreground">{brand.nombre || "Marca sin nombre"}</p><p className="mt-1 text-xs text-muted-foreground">{brand.solicitante || "Titular no informado"}</p></div><Badge variant="outline">{brand.estado || "Sin estado"}</Badge></div>
                    <p className="mt-3 text-xs text-muted-foreground">Niza {brand.niza?.join(", ") || "—"} · Registro {brand.numeroRegistro || "—"}</p>
                  </div>
                ))}
                {(result.brands.results?.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">No encontramos antecedentes marcarios para este término.</p>}
              </CardContent>
            </Card>
          )}

          {result?.company && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><CardTitle className="text-xl">Actividad empresarial observada</CardTitle><CardDescription>{result.company.matched ? "Perfil construido desde expedientes de patente." : "No se encontró un perfil empresarial suficiente."}</CardDescription></div>
                  <Link href="/patentes" className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline">Abrir perfil competitivo <ArrowRight className="h-4 w-4" /></Link>
                </div>
              </CardHeader>
              <CardContent>
                {result.company.matched && result.company.portfolio ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      <Metric label="Cartera observada" value={String(result.company.portfolio.totalRecords)} />
                      <Metric label="Registradas" value={String(result.company.portfolio.registered)} />
                      <Metric label="En trámite" value={String(result.company.portfolio.pending)} />
                      <Metric label="Filings 90 días" value={String(result.company.portfolio.recentFilings90d)} />
                      <Metric label="Familias tecnológicas" value={String(result.company.portfolio.technologyFamilies)} />
                    </div>
                    {(result.company.topIpc?.length ?? 0) > 0 && <div className="mt-4 flex flex-wrap gap-2">{result.company.topIpc?.slice(0, 8).map((item) => <Badge key={item.code} variant="secondary">{item.code} · {item.records}</Badge>)}</div>}
                  </>
                ) : <p className="text-sm text-muted-foreground">Prueba con el nombre formal del solicitante o utiliza la búsqueda tecnológica.</p>}
              </CardContent>
            </Card>
          )}

          {result?.patents && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><CardTitle className="text-xl">Patentes y tecnología</CardTitle><CardDescription>{result.patents.total ?? result.patents.results?.length ?? 0} expedientes relacionados</CardDescription></div>
                  <Link href="/patentes" className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline">Profundizar en patentes <ArrowRight className="h-4 w-4" /></Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {(result.patents.results ?? []).slice(0, 6).map((patent) => (
                  <div key={patent.id} className="rounded-xl border border-border bg-secondary/15 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3"><div className="max-w-4xl"><p className="font-semibold leading-snug text-foreground">{patent.title}</p><p className="mt-1 text-xs text-muted-foreground">{patent.applicants || "Solicitante no informado"}</p></div><Badge variant="outline">{patent.status || "Sin estado"}</Badge></div>
                    <div className="mt-3 flex flex-wrap gap-1.5">{patent.ipc.slice(0, 8).map((code) => <Badge key={code} variant="secondary">{code}</Badge>)}</div>
                  </div>
                ))}
                {(result.patents.results?.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">No encontramos patentes relacionadas con este término.</p>}
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {!hasResults && !loading && (
        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <Card><CardContent className="p-6"><Tags className="h-5 w-5 text-muted-foreground" /><h2 className="mt-5 font-semibold text-foreground">¿Hay marcas parecidas?</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Busca nombres cercanos, titulares, estados y clases para dimensionar el panorama marcario.</p></CardContent></Card>
          <Card><CardContent className="p-6"><Building2 className="h-5 w-5 text-muted-foreground" /><h2 className="mt-5 font-semibold text-foreground">¿Qué está haciendo una empresa?</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Observa actividad, cartera de patentes, tecnologías dominantes e inventores recurrentes.</p></CardContent></Card>
          <Card><CardContent className="p-6"><FlaskConical className="h-5 w-5 text-muted-foreground" /><h2 className="mt-5 font-semibold text-foreground">¿Quién trabaja en esta tecnología?</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Encuentra expedientes por concepto o IPC y descubre solicitantes activos.</p></CardContent></Card>
        </section>
      )}

      <section className="mt-10 grid gap-4 border-t border-border pt-8 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Herramientas especializadas siguen disponibles</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Cuando necesites filtros técnicos, expediente completo o consultas avanzadas puedes entrar a las vistas especializadas sin perder el flujo principal.</p>
        </div>
        <Link href="/consulta" className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:underline">Abrir búsqueda avanzada <ArrowRight className="h-4 w-4" /></Link>
      </section>
    </div>
  )
}
