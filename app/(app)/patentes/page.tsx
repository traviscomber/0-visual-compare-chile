"use client"

import { FormEvent, useState } from "react"
import { Building2, CalendarDays, FlaskConical, Loader2, Search, ShieldCheck } from "lucide-react"
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

export default function PatentIntelligencePage() {
  const [query, setQuery] = useState("")
  const [ipc, setIpc] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SearchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const search = async (event: FormEvent) => {
    event.preventDefault()
    if (query.trim().length < 2 || loading) return
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ q: query.trim(), limit: "50" })
      if (ipc.trim()) params.set("ipc", ipc.trim())
      const response = await fetch(`/api/patents/search?${params}`, { cache: "no-store" })
      const payload = (await response.json().catch(() => ({}))) as SearchResponse
      if (!response.ok) {
        setResult(null)
        setError(response.status === 401 ? "Tu sesión expiró. Vuelve a iniciar sesión." : payload.error || "No fue posible consultar patentes.")
        return
      }
      setResult(payload)
    } catch {
      setResult(null)
      setError("No fue posible conectar con Patent Intelligence.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
          <FlaskConical className="h-3.5 w-3.5" /> Patent Intelligence · INAPI Open Data
        </div>
        <h1 className="font-serif text-3xl text-foreground">Explorar tecnología, empresas e inventores</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">Busca por tecnología, título o solicitante. Filtra opcionalmente por prefijo IPC para acotar el campo tecnológico.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Búsqueda tecnológica</CardTitle>
          <CardDescription>Ejemplos: NOVARTIS, litio, fungicidas, canales de sodio · IPC: A61, C25C, G06.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={search} className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Empresa o tecnología" maxLength={160} />
            <Input value={ipc} onChange={(event) => setIpc(event.target.value.toUpperCase())} placeholder="IPC opcional" maxLength={12} />
            <Button type="submit" disabled={query.trim().length < 2 || loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              {loading ? "Buscando" : "Buscar patentes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

      {result && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl text-foreground">Resultados</h2>
              <p className="text-sm text-muted-foreground">“{result.query}” · {result.total} resultados · {result.durationMs} ms</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"><ShieldCheck className="mr-1 h-3.5 w-3.5" /> INAPI oficial</Badge>
              {result.newestSync && <Badge variant="outline">Sync {new Date(result.newestSync).toLocaleDateString("es-CL")}</Badge>}
            </div>
          </div>

          {result.results.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">No encontramos patentes con esos criterios.</CardContent></Card>
          ) : (
            <div className="grid gap-4">
              {result.results.map((patent) => (
                <Card key={patent.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="max-w-4xl">
                        <CardTitle className="font-serif text-xl leading-snug">{patent.title}</CardTitle>
                        <CardDescription className="mt-2 flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {patent.applicants || "Solicitante no informado"}</CardDescription>
                      </div>
                      <Badge variant="outline">{patent.status || "Sin estado"}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <Metric label="Solicitud" value={patent.applicationNumber || "—"} />
                      <Metric label="Registro" value={patent.registrationNumber || "—"} />
                      <Metric label="País" value={patent.country || "—"} />
                      <Metric label="Presentación" value={patent.filingDate || "—"} icon={<CalendarDays className="h-3.5 w-3.5" />} />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">IPC</p>
                      <div className="flex flex-wrap gap-1.5">{patent.ipc.slice(0, 14).map((code) => <Badge key={code} variant="secondary">{code}</Badge>)}</div>
                    </div>
                    {patent.inventors && <p className="text-xs leading-relaxed text-muted-foreground"><span className="font-medium text-foreground">Inventores:</span> {patent.inventors}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return <div className="rounded-lg border border-border bg-secondary/20 p-3"><p className="flex items-center gap-1 text-xs text-muted-foreground">{icon}{label}</p><p className="mt-1 font-medium text-foreground">{value}</p></div>
}
