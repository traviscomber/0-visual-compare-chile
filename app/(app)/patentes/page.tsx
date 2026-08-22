"use client"

import { FormEvent, type ReactNode, useMemo, useState } from "react"
import { Activity, Building2, CalendarDays, FlaskConical, Loader2, Network, Search, ShieldCheck, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type PatentHit = {
  id: string
  applicationNumber: string | null
  registrationNumber: string | null
  title: string
  applicants: string | null
  inventors: string | null
  status: string | null
  country: string | null
  filingDate: string | null
  registrationDate: string | null
  expirationDate: string | null
  ipc: string[]
  sourceUrl: string | null
  lastSyncedAt: string | null
  titleSimilarity: number
  applicantSimilarity: number
  relevanceScore: number
}

type SearchResponse = {
  results: PatentHit[]
  total: number
  query: string
  ipc: string | null
  source: string
  newestSync: string | null
  durationMs: number
  generatedAt: string
  error?: string
}

type CompanyProfile = {
  query: string
  matched: boolean
  portfolio: {
    totalRecords: number
    registered: number
    pending: number
    recentFilings90d: number
    recentPublications90d: number
    firstFilingDate: string | null
    latestActivityDate: string | null
    technologyFamilies: number
    newestSync: string | null
  }
  matchedApplicantNames: Array<{ applicants: string; records: number }>
  topIpc: Array<{ code: string; family: string; records: number }>
  countries: Array<{ country: string; records: number }>
  topInventors: Array<{ inventor: string; records: number }>
  recentPatents: Array<{
    id: string
    application_number: string | null
    registration_number: string | null
    title: string
    status: string | null
    country: string | null
    filing_date: string | null
    publication_date: string | null
    registration_date: string | null
    activity_date: string | null
    ipc_codes: string[]
  }>
  methodology: { scope: string; recentWindowDays: number; growthClaimsEnabled: boolean; note: string }
  durationMs: number
  generatedAt: string
  error?: string
}

type Mode = "search" | "company"

export default function PatentIntelligencePage() {
  const [mode, setMode] = useState<Mode>("search")
  const [query, setQuery] = useState("")
  const [ipc, setIpc] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SearchResponse | null>(null)
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async (event: FormEvent) => {
    event.preventDefault()
    const q = query.trim()
    if (q.length < 2 || loading) return
    setLoading(true)
    setError(null)

    try {
      if (mode === "company") {
        const response = await fetch(`/api/patents/company?q=${encodeURIComponent(q)}`, { cache: "no-store" })
        const payload = (await response.json().catch(() => ({}))) as CompanyProfile
        if (!response.ok) {
          setProfile(null)
          setError(response.status === 401 ? "Tu sesión expiró. Vuelve a iniciar sesión." : payload.error || "No fue posible construir el perfil competitivo.")
          return
        }
        setProfile(payload)
        setResult(null)
      } else {
        const params = new URLSearchParams({ q, limit: "50" })
        if (ipc.trim()) params.set("ipc", ipc.trim())
        const response = await fetch(`/api/patents/search?${params}`, { cache: "no-store" })
        const payload = (await response.json().catch(() => ({}))) as SearchResponse
        if (!response.ok) {
          setResult(null)
          setError(response.status === 401 ? "Tu sesión expiró. Vuelve a iniciar sesión." : payload.error || "No fue posible consultar patentes.")
          return
        }
        setResult(payload)
        setProfile(null)
      }
    } catch {
      setResult(null)
      setProfile(null)
      setError("No fue posible conectar con Patent Intelligence.")
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
    setResult(null)
    setProfile(null)
    if (next === "company") setIpc("")
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
          <FlaskConical className="h-3.5 w-3.5" /> Patent Intelligence · INAPI Open Data
        </div>
        <h1 className="font-serif text-3xl text-foreground">Tecnología y Competitive Intelligence</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">Explora patentes por tecnología o construye un perfil competitivo de una empresa usando su cartera observada, IPC, inventores y actividad reciente.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <ModeButton active={mode === "search"} title="Explorar patentes" description="Tecnología, título, solicitante e IPC." icon={<Search className="h-4 w-4" />} onClick={() => switchMode("search")} />
        <ModeButton active={mode === "company"} title="Perfil competitivo" description="Cartera, actividad, IPC e inventores por empresa." icon={<Building2 className="h-4 w-4" />} onClick={() => switchMode("company")} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">{mode === "company" ? "Inteligencia por empresa" : "Búsqueda tecnológica"}</CardTitle>
          <CardDescription>{mode === "company" ? "Ejemplos: NESTLE, SYNGENTA, CATERPILLAR, NOVARTIS, SIEMENS ENERGY." : "Ejemplos: litio, fungicidas, canales de sodio · IPC: A61, C25C, G06."}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={run} className={`grid gap-3 ${mode === "search" ? "md:grid-cols-[1fr_180px_auto]" : "md:grid-cols-[1fr_auto]"}`}>
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={mode === "company" ? "Nombre de empresa o solicitante" : "Empresa o tecnología"} maxLength={160} />
            {mode === "search" && <Input value={ipc} onChange={(event) => setIpc(event.target.value.toUpperCase())} placeholder="IPC opcional" maxLength={12} />}
            <Button type="submit" disabled={query.trim().length < 2 || loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : mode === "company" ? <Activity className="mr-2 h-4 w-4" /> : <Search className="mr-2 h-4 w-4" />}
              {loading ? "Analizando" : mode === "company" ? "Construir perfil" : "Buscar patentes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

      {profile && <CompanyIntelligence profile={profile} />}
      {result && <PatentResults result={result} />}
    </div>
  )
}

function CompanyIntelligence({ profile }: { profile: CompanyProfile }) {
  const concentration = useMemo(() => {
    const top = profile.topIpc[0]?.records ?? 0
    if (!profile.portfolio.totalRecords) return 0
    return Math.round((top / profile.portfolio.totalRecords) * 100)
  }, [profile])

  const signals = [
    profile.portfolio.recentFilings90d >= 10 ? "Actividad reciente alta" : profile.portfolio.recentFilings90d >= 3 ? "Actividad reciente visible" : "Actividad reciente acotada",
    profile.portfolio.technologyFamilies >= 10 ? "Cartera tecnológica diversificada" : "Cartera tecnológica concentrada",
    concentration >= 30 ? `Foco relevante en ${profile.topIpc[0]?.family || "IPC dominante"}` : "Sin concentración IPC extrema",
  ]

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-foreground">Perfil competitivo · {profile.query}</h2>
          <p className="text-sm text-muted-foreground">{profile.portfolio.totalRecords} expedientes observados · {profile.durationMs} ms</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"><ShieldCheck className="mr-1 h-3.5 w-3.5" /> INAPI oficial</Badge>
          {profile.portfolio.newestSync && <Badge variant="outline">Sync {new Date(profile.portfolio.newestSync).toLocaleDateString("es-CL")}</Badge>}
        </div>
      </div>

      {!profile.matched ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No encontramos expedientes asociados a ese solicitante en el corpus observado.</CardContent></Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Cartera observada" value={String(profile.portfolio.totalRecords)} icon={<Network className="h-3.5 w-3.5" />} />
            <Metric label="En trámite" value={String(profile.portfolio.pending)} icon={<Activity className="h-3.5 w-3.5" />} />
            <Metric label="Filings últimos 90 días" value={String(profile.portfolio.recentFilings90d)} icon={<CalendarDays className="h-3.5 w-3.5" />} />
            <Metric label="Familias tecnológicas" value={String(profile.portfolio.technologyFamilies)} icon={<FlaskConical className="h-3.5 w-3.5" />} />
          </div>

          <Card>
            <CardHeader><CardTitle className="font-serif text-lg">Señales observadas</CardTitle><CardDescription>Hechos derivados del corpus actual; no son predicciones ni crecimiento interanual.</CardDescription></CardHeader>
            <CardContent className="flex flex-wrap gap-2">{signals.map((signal) => <Badge key={signal} variant="secondary" className="px-3 py-1.5">{signal}</Badge>)}</CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="font-serif text-lg">Tecnologías dominantes</CardTitle><CardDescription>IPC con mayor presencia dentro de la cartera observada.</CardDescription></CardHeader>
              <CardContent className="space-y-2">{profile.topIpc.slice(0, 10).map((item) => <RankRow key={item.code} label={item.code} value={`${item.records} expedientes`} />)}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-lg"><Users className="h-4 w-4" /> Inventores recurrentes</CardTitle><CardDescription>Personas con mayor recurrencia en los expedientes coincidentes.</CardDescription></CardHeader>
              <CardContent className="space-y-2">{profile.topInventors.slice(0, 10).map((item) => <RankRow key={item.inventor} label={item.inventor} value={`${item.records}`} />)}</CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="font-serif text-lg">Últimos movimientos</CardTitle><CardDescription>Presentaciones, publicaciones o registros más recientes del portfolio observado.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {profile.recentPatents.map((patent) => (
                <div key={patent.id} className="rounded-xl border border-border bg-secondary/15 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium text-foreground">{patent.title}</p><p className="mt-1 text-xs text-muted-foreground">Solicitud {patent.application_number || "—"} · {patent.country || "País no informado"}</p></div><Badge variant="outline">{patent.status || "Sin estado"}</Badge></div>
                  <div className="mt-3 flex flex-wrap gap-1.5">{patent.ipc_codes.slice(0, 8).map((code) => <Badge key={code} variant="secondary">{code}</Badge>)}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">Metodología:</span> {profile.methodology.note} El perfil usa únicamente expedientes observados en el mirror oficial INAPI actual.
          </div>
        </>
      )}
    </section>
  )
}

function PatentResults({ result }: { result: SearchResponse }) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="font-serif text-2xl text-foreground">Resultados</h2><p className="text-sm text-muted-foreground">“{result.query}” · {result.total} resultados · {result.durationMs} ms</p></div>
        <div className="flex gap-2"><Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"><ShieldCheck className="mr-1 h-3.5 w-3.5" /> INAPI oficial</Badge>{result.newestSync && <Badge variant="outline">Sync {new Date(result.newestSync).toLocaleDateString("es-CL")}</Badge>}</div>
      </div>
      {result.results.length === 0 ? <Card><CardContent className="py-10 text-center text-muted-foreground">No encontramos patentes con esos criterios.</CardContent></Card> : <div className="grid gap-4">{result.results.map((patent) => <Card key={patent.id}><CardHeader className="pb-3"><div className="flex flex-wrap items-start justify-between gap-3"><div className="max-w-4xl"><CardTitle className="font-serif text-xl leading-snug">{patent.title}</CardTitle><CardDescription className="mt-2 flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {patent.applicants || "Solicitante no informado"}</CardDescription></div><Badge variant="outline">{patent.status || "Sin estado"}</Badge></div></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4"><Metric label="Solicitud" value={patent.applicationNumber || "—"} /><Metric label="Registro" value={patent.registrationNumber || "—"} /><Metric label="País" value={patent.country || "—"} /><Metric label="Presentación" value={patent.filingDate || "—"} icon={<CalendarDays className="h-3.5 w-3.5" />} /></div><div><p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">IPC</p><div className="flex flex-wrap gap-1.5">{patent.ipc.slice(0, 14).map((code) => <Badge key={code} variant="secondary">{code}</Badge>)}</div></div>{patent.inventors && <p className="text-xs leading-relaxed text-muted-foreground"><span className="font-medium text-foreground">Inventores:</span> {patent.inventors}</p>}</CardContent></Card>)}</div>}
    </section>
  )
}

function ModeButton({ active, title, description, icon, onClick }: { active: boolean; title: string; description: string; icon: ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`rounded-xl border p-4 text-left transition ${active ? "border-emerald-500/50 bg-emerald-500/10" : "border-border bg-card hover:border-emerald-500/25"}`}><div className="flex items-center gap-2 font-medium text-foreground">{icon}{title}</div><p className="mt-1 text-xs text-muted-foreground">{description}</p></button>
}

function RankRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/15 px-3 py-2"><span className="min-w-0 truncate text-sm text-foreground" title={label}>{label}</span><Badge variant="outline" className="shrink-0">{value}</Badge></div>
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return <div className="rounded-lg border border-border bg-secondary/20 p-3"><p className="flex items-center gap-1 text-xs text-muted-foreground">{icon}{label}</p><p className="mt-1 font-medium text-foreground">{value}</p></div>
}