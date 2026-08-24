"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  FileSearch,
  Hash,
  History,
  Loader2,
  Search,
  ShieldCheck,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  { value: "nombre" as const, label: "Marca", description: "Nombre denominativo", placeholder: "Ejemplo: FALABELLA", icon: Search },
  { value: "registro" as const, label: "Registro", description: "Número de registro INAPI", placeholder: "Ejemplo: 1236222", icon: Hash },
  { value: "solicitud" as const, label: "Solicitud", description: "Número de solicitud INAPI", placeholder: "Ejemplo: 1220733", icon: FileSearch },
]

const MATCH_OPTIONS = [
  { value: "1" as const, label: "Exacta", description: "Mismo nombre normalizado" },
  { value: "2" as const, label: "Contiene", description: "Incluye el término consultado" },
  { value: "3" as const, label: "Similar", description: "Variantes cercanas informadas por la fuente" },
]

function isSearchType(value: string | null): value is SearchType {
  return value === "nombre" || value === "registro" || value === "solicitud"
}

function isMatchMode(value: string | null): value is MatchMode {
  return value === "1" || value === "2" || value === "3"
}

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
  if (normalized.includes("registr")) return "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-300"
  if (normalized.includes("pendiente") || normalized.includes("tramite")) return "border-amber-400/25 bg-amber-400/[0.06] text-amber-200"
  if (normalized.includes("deneg") || normalized.includes("no vigente")) return "border-border bg-secondary/30 text-muted-foreground"
  return "border-primary/25 bg-primary/[0.06] text-primary"
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

  useEffect(() => {
    void loadHistory()
    const params = new URLSearchParams(window.location.search)
    const initialQuery = params.get("q")?.trim() ?? ""
    const initialType = isSearchType(params.get("type")) ? (params.get("type") as SearchType) : "nombre"
    const initialMatch = isMatchMode(params.get("match")) ? (params.get("match") as MatchMode) : "1"
    if (!initialQuery) return
    setQuery(initialQuery.slice(0, 120))
    setSearchType(initialType)
    setMatchMode(initialType === "nombre" ? initialMatch : "2")
    if (params.get("autorun") === "1") void runSearch(undefined, { query: initialQuery.slice(0, 120), type: initialType, match: initialMatch })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className="mx-auto w-full max-w-[1480px] px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
      <header className="grid gap-8 border-b border-border pb-9 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">VIDENTIA / Fuente INAPI</p>
          <h1 className="mt-4 max-w-[10ch] text-4xl font-normal leading-[0.96] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-6xl">Abre la fuente. Conserva el contexto.</h1>
        </div>
        <div className="max-w-2xl lg:justify-self-end">
          <p className="text-base leading-7 text-muted-foreground sm:text-lg">Consulta por marca, registro o solicitud y revisa el expediente recuperado sin mezclar la fuente oficial con una conclusión jurídica.</p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground"><span>Fuente identificada</span><span>Caché visible</span><span>Detalle trazable</span></div>
        </div>
      </header>

      <section className="mt-8 border-y border-border bg-card/30">
        <div className="grid md:grid-cols-3">
          {SEARCH_OPTIONS.map((option) => {
            const Icon = option.icon
            const active = option.value === searchType
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => { setSearchType(option.value); setQuery(""); setResult(null); setError(null); setPage(1) }}
                className={`relative border-b border-border p-4 text-left outline-none transition md:border-b-0 md:border-r md:last:border-r-0 ${active ? "bg-secondary/40" : "hover:bg-secondary/20"} focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-primary/40`}
              >
                {active && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />}
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Icon className={active ? "h-4 w-4 text-primary" : "h-4 w-4 text-muted-foreground"} />{option.label}</div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{option.description}</p>
              </button>
            )
          })}
        </div>

        {searchType === "nombre" && (
          <div className="grid border-t border-border sm:grid-cols-3">
            {MATCH_OPTIONS.map((option) => {
              const active = matchMode === option.value
              return (
                <button key={option.value} type="button" aria-pressed={active} onClick={() => setMatchMode(option.value)} className={`border-b border-border px-4 py-3 text-left outline-none transition sm:border-b-0 sm:border-r sm:last:border-r-0 ${active ? "bg-primary/[0.05]" : "hover:bg-secondary/20"} focus-visible:ring-2 focus-visible:ring-primary/40`}>
                  <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-foreground">{option.label}</p>{active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                </button>
              )
            })}
          </div>
        )}

        <form onSubmit={runSearch} className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:p-5">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={120} inputMode={searchType === "nombre" ? "text" : "numeric"} placeholder={activeOption.placeholder} aria-label={`Buscar por ${activeOption.label.toLowerCase()}`} className="h-12 flex-1 text-base" />
          <Button type="submit" disabled={!query.trim() || loading} className="h-12 min-w-44">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Search className="mr-2 h-4 w-4" />}{loading ? "Consultando" : "Consultar INAPI"}</Button>
        </form>
        <div className="border-t border-border px-4 py-3 sm:px-5"><p className="text-xs leading-5 text-muted-foreground">La consulta recupera los datos disponibles en la integración INAPI de VIDENTIA. Un resultado vacío o parcial no demuestra disponibilidad jurídica.</p></div>
      </section>

      {error && <div role="alert" className="mt-6 flex items-start gap-3 border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><div><p>{error.message}</p>{error.code && <p className="mt-1 text-xs opacity-80">Código: {error.code}</p>}</div></div>}

      {result && (
        <section className="mt-9">
          <div className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Resultado de fuente</p>
              <h2 className="mt-2 text-3xl font-normal tracking-[-0.04em] text-foreground sm:text-4xl">“{result.query}”</h2>
              <p className="mt-2 text-sm text-muted-foreground">{result.total} antecedentes informados · {formatDate(result.generatedAt)}</p>
            </div>
            <SourceStatus result={result} />
          </div>

          {result.truncated && <div className="mt-5 flex items-start gap-3 border border-amber-500/25 bg-amber-500/[0.06] p-4"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /><div><p className="text-sm font-medium text-foreground">Vista parcial</p><p className="mt-1 text-xs leading-5 text-muted-foreground">La fuente informó {result.total} antecedentes y esta vista recibió {result.returned}. No se completa lo que falta por inferencia.</p></div></div>}

          {result.results.length > 0 && (
            <div className="mt-6 grid gap-4 border-y border-border py-5 sm:grid-cols-2">
              <label className="text-sm"><span className="mb-1 block text-xs text-muted-foreground">Estado</span><select value={stateFilter} onChange={(event) => { setStateFilter(event.target.value); setPage(1) }} className="h-10 w-full rounded-md border border-border bg-background px-3 text-foreground"><option value="all">Todos</option><option value="Registrada">Registradas</option><option value="Pendiente">Pendientes</option><option value="No Vigente">No vigentes</option><option value="Denegada">Denegadas</option></select></label>
              <label className="text-sm"><span className="mb-1 block text-xs text-muted-foreground">Clase Niza</span><select value={nizaFilter} onChange={(event) => { setNizaFilter(event.target.value); setPage(1) }} className="h-10 w-full rounded-md border border-border bg-background px-3 text-foreground"><option value="all">Todas</option>{availableNiza.map((value) => <option key={value} value={value}>Clase {value}</option>)}</select></label>
            </div>
          )}

          {filteredResults.length === 0 ? (
            <div className="border-b border-border py-12 text-center"><FileSearch className="mx-auto h-7 w-7 text-muted-foreground" /><p className="mt-3 font-medium text-foreground">No se encontraron antecedentes con estos criterios</p><p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Esto no demuestra disponibilidad jurídica. Cambia el modo de coincidencia o revisa las clases relevantes.</p></div>
          ) : (
            <div className="divide-y divide-border border-b border-border">
              {visibleResults.map((record, index) => <ResultRow key={`${record.id}-${index}`} record={record} index={(page - 1) * PAGE_SIZE + index} onOpen={() => setSelected(record)} />)}
            </div>
          )}

          {filteredResults.length > PAGE_SIZE && <div className="flex items-center justify-between border-b border-border py-5"><Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft className="mr-2 h-4 w-4" />Anterior</Button><span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span><Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Siguiente<ChevronRight className="ml-2 h-4 w-4" /></Button></div>}
        </section>
      )}

      <section className="mt-10 grid gap-6 border-t border-border pt-8 lg:grid-cols-[0.7fr_1.3fr]">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Historial</p><h2 className="mt-2 text-2xl font-normal tracking-[-0.03em] text-foreground">Consultas recientes</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Reabre una búsqueda anterior sin reconstruir manualmente sus parámetros.</p></div>
        <div className="divide-y divide-border border-y border-border">{history.length === 0 ? <p className="py-6 text-sm text-muted-foreground">Aún no hay consultas registradas.</p> : history.map((item) => <button key={item.id} type="button" onClick={() => void runSearch(undefined, { query: item.query, type: item.search_type, match: item.match_mode || "1" })} className="flex w-full items-center justify-between gap-4 py-4 text-left outline-none transition hover:bg-secondary/10 focus-visible:ring-2 focus-visible:ring-primary/40"><div><p className="font-medium text-foreground">{item.query}</p><p className="mt-1 text-xs text-muted-foreground">{item.search_type} · {item.results_count ?? 0} resultados · {formatDate(item.created_at)}</p></div><Badge variant="outline" className={item.status === "success" ? "rounded-md text-emerald-300" : "rounded-md text-red-300"}>{item.status === "success" ? "Correcta" : "Fallida"}</Badge></button>)}</div>
      </section>

      {selected && <RecordDialog record={selected} onClose={() => setSelected(null)} />}

      <p className="mt-8 text-xs leading-5 text-muted-foreground">VIDENTIA organiza la consulta y conserva su trazabilidad. INAPI permanece como fuente oficial y la ficha no constituye una determinación de registrabilidad.</p>
    </div>
  )
}

function SourceStatus({ result }: { result: SearchResponse }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em]">
      <span className="inline-flex items-center gap-1.5 border border-primary/25 px-2.5 py-1 text-primary"><ShieldCheck className="h-3 w-3" />{result.source || "INAPI"}</span>
      <span className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1 text-muted-foreground"><Database className="h-3 w-3" />{result.cached ? "Respuesta desde caché" : "Consulta ejecutada"}</span>
      <span className="inline-flex items-center border border-border px-2.5 py-1 text-muted-foreground">{result.durationMs} ms</span>
    </div>
  )
}

function ResultRow({ record, index, onOpen }: { record: Marca; index: number; onOpen: () => void }) {
  const requestNumber = metadataValue(record, ["numeroSolicitud", "numero_solicitud", "solicitud"])
  return (
    <article className="grid gap-5 py-6 lg:grid-cols-[64px_1fr_auto] lg:items-start">
      <div className="font-mono text-[10px] text-muted-foreground">{String(index + 1).padStart(2, "0")}</div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-semibold tracking-[-0.02em] text-foreground">{record.nombre || "Marca sin nombre"}</h3><Badge variant="outline" className={`rounded-md ${stateClasses(record.estado)}`}>{record.estado || "Sin estado"}</Badge></div>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground"><Building2 className="h-3.5 w-3.5" />{record.solicitante || "Solicitante no informado"}</p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground"><span>Registro <strong className="font-medium text-foreground">{record.numeroRegistro || "—"}</strong></span><span>Solicitud <strong className="font-medium text-foreground">{requestNumber || "—"}</strong></span><span>Niza <strong className="font-medium text-foreground">{record.niza?.join(", ") || "—"}</strong></span><span>Fecha <strong className="font-medium text-foreground">{record.fecha || "—"}</strong></span></div>
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end"><Button variant="outline" size="sm" onClick={onOpen}>Abrir expediente</Button>{record.nombre && <Button asChild size="sm"><Link href={`/evaluar?brand=${encodeURIComponent(record.nombre)}`}>Evaluar marca <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>}</div>
    </article>
  )
}

function RecordDialog({ record, onClose }: { record: Marca; onClose: () => void }) {
  const requestNumber = metadataValue(record, ["numeroSolicitud", "numero_solicitud", "solicitud"])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-label={`Expediente ${record.nombre}`}>
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto border border-border bg-background shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5 sm:p-6">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">Expediente recuperado</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">{record.nombre}</h2><p className="mt-1 text-sm text-muted-foreground">{record.solicitante || "Solicitante no informado"}</p></div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar detalle"><X className="h-5 w-5" /></Button>
        </div>
        <div className="p-5 sm:p-6">
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Estado normalizado" value={record.estado || "—"} /><Metric label="Estado original INAPI" value={metadataValue(record, ["estadoOriginal", "estado_original"]) || "—"} /><Metric label="Número de registro" value={record.numeroRegistro || "—"} /><Metric label="Número de solicitud" value={requestNumber || "—"} /><Metric label="Clases Niza" value={record.niza?.join(", ") || "—"} /><Metric label="Códigos Viena" value={record.viena?.join(", ") || "—"} /><Metric label="Fecha" value={record.fecha || "—"} /><Metric label="País" value={record.pais || "—"} /></div>
          {record.descripcion && <div className="mt-7 border-t border-border pt-5"><p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">Descripción</p><p className="mt-2 text-sm leading-6 text-foreground">{record.descripcion}</p></div>}
          <div className="mt-7 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-2 text-xs leading-5 text-muted-foreground"><Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" /><p>La ficha refleja la fuente recuperada. No constituye una opinión jurídica.</p></div>{record.nombre && <Button asChild><Link href={`/evaluar?brand=${encodeURIComponent(record.nombre)}`}>Evaluar esta marca <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>}</div>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-1.5 text-sm font-medium text-foreground">{value}</p></div>
}
