"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { AlertTriangle, Building2, ChevronLeft, ChevronRight, Clock3, Database, FileSearch, Hash, History, Loader2, Search, ShieldCheck, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { Marca } from "@/types/marca"

type SearchType = "nombre" | "registro" | "solicitud"
type MatchMode = "1" | "2" | "3"

type SearchResponse = {
  results: Marca[]
  total: number
  returned: number
  truncated: boolean
  source: string
  cached: boolean
  query: string
  type: SearchType
  matchMode: MatchMode
  durationMs: number
  generatedAt: string
  error?: string
  code?: string
}

type HistoryItem = {
  id: string
  query: string
  search_type: SearchType
  results_count: number
  match_mode: MatchMode
  status: string
  duration_ms: number | null
  error_code: string | null
  cached: boolean
  created_at: string
}

const PAGE_SIZE = 10
const SEARCH_OPTIONS = [
  { value: "nombre" as const, label: "Marca", description: "Nombre denominativo, por ejemplo FALABELLA.", placeholder: "Ejemplo: FALABELLA", icon: Search },
  { value: "registro" as const, label: "Registro", description: "Número de registro INAPI.", placeholder: "Ejemplo: 1236222", icon: Hash },
  { value: "solicitud" as const, label: "Solicitud", description: "Número de solicitud INAPI.", placeholder: "Ejemplo: 1220733", icon: FileSearch },
]

const MATCH_OPTIONS = [
  { value: "1" as const, label: "Exacta", description: "Mismo nombre normalizado." },
  { value: "2" as const, label: "Contiene", description: "Incluye el término consultado." },
  { value: "3" as const, label: "Similar", description: "Variantes cercanas informadas por INAPI." },
]

function metadataValue(record: Marca, keys: string[]) {
  for (const key of keys) {
    const value = record.metadata?.[key]
    if (typeof value === "string" && value.trim()) return value.trim()
    if (typeof value === "number") return String(value)
  }
  return ""
}

function stateClasses(state: string) {
  const normalized = state.toLowerCase()
  if (normalized.includes("registr")) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
  if (normalized.includes("pendiente") || normalized.includes("tramite")) return "border-amber-500/30 bg-amber-500/10 text-amber-300"
  if (normalized.includes("deneg") || normalized.includes("no vigente")) return "border-slate-500/30 bg-slate-500/10 text-slate-300"
  return "border-blue-500/30 bg-blue-500/10 text-blue-300"
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

export default function ConsultaInapiPage() {
  const [searchType, setSearchType] = useState<SearchType>("nombre")
  const [matchMode, setMatchMode] = useState<MatchMode>("1")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ message: string; code?: string } | null>(null)
  const [result, setResult] = useState<SearchResponse | null>(null)
  const [stateFilter, setStateFilter] = useState("all")
  const [nizaFilter, setNizaFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Marca | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])

  const activeOption = SEARCH_OPTIONS.find((option) => option.value === searchType) ?? SEARCH_OPTIONS[0]

  const loadHistory = async () => {
    try {
      const response = await fetch("/api/inapi/history?limit=12", { cache: "no-store" })
      if (!response.ok) return
      const payload = await response.json()
      setHistory(Array.isArray(payload.results) ? payload.results : [])
    } catch {
      // El historial es auxiliar; la consulta principal sigue operativa.
    }
  }

  useEffect(() => { void loadHistory() }, [])

  const runSearch = async (event?: FormEvent, override?: { query: string; type: SearchType; match: MatchMode }) => {
    event?.preventDefault()
    const nextQuery = (override?.query ?? query).trim()
    const nextType = override?.type ?? searchType
    const nextMatch = nextType === "nombre" ? (override?.match ?? matchMode) : "2"
    if (!nextQuery || loading) return

    if (nextType !== "nombre" && !/^\d+$/.test(nextQuery)) {
      setError({ message: "Para registro o solicitud ingresa únicamente números.", code: "NUMERIC_QUERY_REQUIRED" })
      setResult(null)
      return
    }

    setQuery(nextQuery)
    setSearchType(nextType)
    setMatchMode(nextMatch)
    setLoading(true)
    setError(null)
    setResult(null)
    setStateFilter("all")
    setNizaFilter("all")
    setPage(1)
    setSelected(null)

    try {
      const params = new URLSearchParams({ q: nextQuery, type: nextType, match: nextMatch })
      const response = await fetch(`/api/inapi/search?${params.toString()}`, { headers: { Accept: "application/json" }, cache: "no-store" })
      const payload = (await response.json().catch(() => ({}))) as Partial<SearchResponse>
      if (!response.ok) {
        setError({
          message: response.status === 401 ? "Tu sesión expiró. Vuelve a iniciar sesión." : payload.error ?? "No fue posible consultar INAPI.",
          code: payload.code,
        })
        void loadHistory()
        return
      }
      setResult(payload as SearchResponse)
      void loadHistory()
    } catch {
      setError({ message: "No fue posible conectar con el servicio INAPI.", code: "NETWORK_ERROR" })
    } finally {
      setLoading(false)
    }
  }

  const availableNiza = useMemo(() => {
    const values = new Set<string>()
    result?.results.forEach((record) => record.niza?.forEach((item) => values.add(item)))
    return [...values].sort((a, b) => Number(a) - Number(b))
  }, [result])

  const filteredResults = useMemo(() => {
    return (result?.results ?? [])
      .filter((record) => stateFilter === "all" || record.estado === stateFilter)
      .filter((record) => nizaFilter === "all" || record.niza?.includes(nizaFilter))
      .sort((a, b) => {
        const priority = (value: string) => value === "Registrada" ? 0 : value === "Pendiente" ? 1 : 2
        return priority(a.estado) - priority(b.estado) || a.nombre.localeCompare(b.nombre)
      })
  }, [nizaFilter, result, stateFilter])

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / PAGE_SIZE))
  const visibleResults = filteredResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300"><Database className="h-3.5 w-3.5" /> Consulta directa INAPI</div>
        <h1 className="font-serif text-3xl text-foreground">Buscar marca o expediente</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">Consulta actual por nombre, registro o solicitud. Para explorar la base interna, clasificaciones y antecedentes históricos utiliza “Consulta de marcas”.</p>
      </header>

      <Card>
        <CardHeader><CardTitle className="font-serif text-xl">Consulta</CardTitle><CardDescription>Selecciona el identificador y el alcance de coincidencia.</CardDescription></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {SEARCH_OPTIONS.map((option) => {
              const Icon = option.icon
              const active = option.value === searchType
              return <button key={option.value} type="button" onClick={() => { setSearchType(option.value); setQuery(""); setResult(null); setError(null); setPage(1) }} className={`rounded-xl border p-4 text-left transition ${active ? "border-blue-500/60 bg-blue-500/10" : "border-border bg-card hover:border-blue-500/30 hover:bg-secondary/40"}`}><div className="flex items-center gap-2"><Icon className={`h-4 w-4 ${active ? "text-blue-400" : "text-muted-foreground"}`} /><span className="font-medium text-foreground">{option.label}</span></div><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{option.description}</p></button>
            })}
          </div>

          {searchType === "nombre" && <div className="mt-4 grid gap-2 sm:grid-cols-3">{MATCH_OPTIONS.map((option) => <button key={option.value} type="button" onClick={() => setMatchMode(option.value)} className={`rounded-lg border px-3 py-2 text-left ${matchMode === option.value ? "border-blue-500/50 bg-blue-500/10" : "border-border"}`}><p className="text-sm font-medium text-foreground">{option.label}</p><p className="text-xs text-muted-foreground">{option.description}</p></button>)}</div>}

          <form onSubmit={runSearch} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={120} inputMode={searchType === "nombre" ? "text" : "numeric"} placeholder={activeOption.placeholder} aria-label={`Buscar por ${activeOption.label.toLowerCase()}`} className="h-11 flex-1" />
            <Button type="submit" disabled={!query.trim() || loading} className="h-11 min-w-40">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}{loading ? "Consultando" : "Buscar en INAPI"}</Button>
          </form>
        </CardContent>
      </Card>

      {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"><div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><div><p>{error.message}</p>{error.code && <p className="mt-1 text-xs opacity-80">Código: {error.code}</p>}</div></div></div>}

      {result && <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-serif text-2xl text-foreground">Resultados</h2><p className="text-sm text-muted-foreground">“{result.query}” · {result.total} antecedentes · {result.durationMs} ms · {formatDate(result.generatedAt)}</p></div><div className="flex gap-2"><Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-300"><ShieldCheck className="mr-1 h-3.5 w-3.5" /> Fuente INAPI</Badge>{result.truncated && <Badge variant="outline">Vista limitada a {result.returned}</Badge>}</div></div>

        {result.results.length > 0 && <Card><CardContent className="grid gap-3 pt-6 sm:grid-cols-2"><label className="text-sm"><span className="mb-1 block text-xs text-muted-foreground">Estado</span><select value={stateFilter} onChange={(event) => { setStateFilter(event.target.value); setPage(1) }} className="h-10 w-full rounded-md border border-border bg-background px-3"><option value="all">Todos</option><option value="Registrada">Registradas</option><option value="Pendiente">Pendientes</option><option value="No Vigente">No vigentes</option><option value="Denegada">Denegadas</option></select></label><label className="text-sm"><span className="mb-1 block text-xs text-muted-foreground">Clase Niza</span><select value={nizaFilter} onChange={(event) => { setNizaFilter(event.target.value); setPage(1) }} className="h-10 w-full rounded-md border border-border bg-background px-3"><option value="all">Todas</option>{availableNiza.map((value) => <option key={value} value={value}>Clase {value}</option>)}</select></label></CardContent></Card>}

        {filteredResults.length === 0 ? <Card><CardContent className="py-10 text-center"><FileSearch className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 font-medium text-foreground">No se encontraron antecedentes con estos criterios</p><p className="mx-auto mt-1 max-w-2xl text-sm text-muted-foreground">Esto no demuestra disponibilidad jurídica. Cambia el modo de coincidencia o revisa las clases relevantes.</p></CardContent></Card> : <div className="grid gap-4">{visibleResults.map((record, index) => {
          const requestNumber = metadataValue(record, ["numeroSolicitud", "numero_solicitud", "solicitud"])
          return <Card key={`${record.id}-${index}`} className="cursor-pointer transition hover:border-blue-500/40" onClick={() => setSelected(record)}><CardHeader className="pb-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="font-serif text-xl">{record.nombre || "Marca sin nombre"}</CardTitle><CardDescription className="mt-1 flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {record.solicitante || "Solicitante no informado"}</CardDescription></div><Badge variant="outline" className={stateClasses(record.estado)}>{record.estado || "Sin estado"}</Badge></div></CardHeader><CardContent><div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4"><Metric label="Registro" value={record.numeroRegistro || "—"} /><Metric label="Solicitud" value={requestNumber || "—"} /><Metric label="Clases Niza" value={record.niza?.join(", ") || "—"} /><Metric label="Fecha" value={record.fecha || "—"} /></div><p className="mt-3 text-xs text-blue-300">Abrir detalle del expediente</p></CardContent></Card>
        })}</div>}

        {filteredResults.length > PAGE_SIZE && <div className="flex items-center justify-between"><Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft className="mr-2 h-4 w-4" />Anterior</Button><span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span><Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Siguiente<ChevronRight className="ml-2 h-4 w-4" /></Button></div>}
      </section>}

      <Card><CardHeader><CardTitle className="flex items-center gap-2 font-serif text-lg"><History className="h-4 w-4" /> Historial reciente</CardTitle><CardDescription>Consultas directas registradas para tu usuario.</CardDescription></CardHeader><CardContent>{history.length === 0 ? <p className="text-sm text-muted-foreground">Aún no hay consultas registradas.</p> : <div className="divide-y divide-border">{history.map((item) => <button key={item.id} type="button" onClick={() => void runSearch(undefined, { query: item.query, type: item.search_type, match: item.match_mode || "1" })} className="flex w-full items-center justify-between gap-4 py-3 text-left"><div><p className="font-medium text-foreground">{item.query}</p><p className="text-xs text-muted-foreground">{item.search_type} · {item.results_count ?? 0} resultados · {formatDate(item.created_at)}</p></div><Badge variant="outline" className={item.status === "success" ? "text-emerald-300" : "text-red-300"}>{item.status === "success" ? "Correcta" : "Fallida"}</Badge></button>)}</div>}</CardContent></Card>

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true"><Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto"><CardHeader><div className="flex items-start justify-between gap-4"><div><CardTitle className="font-serif text-2xl">{selected.nombre}</CardTitle><CardDescription>{selected.solicitante || "Solicitante no informado"}</CardDescription></div><Button variant="ghost" size="icon" onClick={() => setSelected(null)} aria-label="Cerrar detalle"><X className="h-5 w-5" /></Button></div></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><Metric label="Estado normalizado" value={selected.estado || "—"} /><Metric label="Estado original INAPI" value={metadataValue(selected, ["estadoOriginal", "estado_original"]) || "—"} /><Metric label="Número de registro" value={selected.numeroRegistro || "—"} /><Metric label="Número de solicitud" value={metadataValue(selected, ["numeroSolicitud", "numero_solicitud", "solicitud"]) || "—"} /><Metric label="Clases Niza" value={selected.niza?.join(", ") || "—"} /><Metric label="Códigos Viena" value={selected.viena?.join(", ") || "—"} /><Metric label="Fecha" value={selected.fecha || "—"} /><Metric label="País" value={selected.pais || "—"} /></div>{selected.descripcion && <div><p className="text-xs text-muted-foreground">Descripción</p><p className="mt-1 text-sm leading-relaxed text-foreground">{selected.descripcion}</p></div>}<div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-foreground"><Clock3 className="mr-1 inline h-3.5 w-3.5" /> Fuente consultada en tiempo real. Esta ficha no constituye una opinión jurídica.</div></CardContent></Card></div>}

      <p className="text-xs leading-relaxed text-muted-foreground">La consulta apoya la revisión interna y no constituye una determinación de registrabilidad.</p>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium text-foreground">{value}</p></div>
}
