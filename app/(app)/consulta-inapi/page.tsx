"use client"

import { FormEvent, useMemo, useState } from "react"
import { AlertTriangle, Building2, Database, FileSearch, Hash, Loader2, Search, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { Marca } from "@/types/marca"

type SearchType = "nombre" | "registro" | "solicitud"

type SearchResponse = {
  results: Marca[]
  total: number
  source: string
  query: string
  type: SearchType
  error?: string
}

const SEARCH_OPTIONS: Array<{
  value: SearchType
  label: string
  description: string
  placeholder: string
  icon: typeof Search
}> = [
  {
    value: "nombre",
    label: "Marca",
    description: "Busca por nombre, por ejemplo FALABELLA.",
    placeholder: "Ejemplo: FALABELLA",
    icon: Search,
  },
  {
    value: "registro",
    label: "Registro",
    description: "Consulta un número de registro INAPI.",
    placeholder: "Ejemplo: 1236222",
    icon: Hash,
  },
  {
    value: "solicitud",
    label: "Solicitud",
    description: "Consulta un número de solicitud INAPI.",
    placeholder: "Ejemplo: 1220733",
    icon: FileSearch,
  },
]

function stateClasses(state: string) {
  const normalized = state.toLowerCase()
  if (normalized.includes("registr")) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
  if (normalized.includes("pendiente") || normalized.includes("tramite")) return "border-amber-500/30 bg-amber-500/10 text-amber-300"
  if (normalized.includes("deneg") || normalized.includes("no vigente")) return "border-slate-500/30 bg-slate-500/10 text-slate-300"
  return "border-blue-500/30 bg-blue-500/10 text-blue-300"
}

function metadataValue(record: Marca, keys: string[]) {
  for (const key of keys) {
    const value = record.metadata?.[key]
    if (typeof value === "string" && value.trim()) return value.trim()
    if (typeof value === "number") return String(value)
  }
  return ""
}

export default function ConsultaInapiPage() {
  const [searchType, setSearchType] = useState<SearchType>("nombre")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SearchResponse | null>(null)

  const activeOption = useMemo(
    () => SEARCH_OPTIONS.find((option) => option.value === searchType) ?? SEARCH_OPTIONS[0],
    [searchType],
  )

  const runSearch = async (event?: FormEvent) => {
    event?.preventDefault()
    const cleanQuery = query.trim()
    if (!cleanQuery || loading) return

    if (searchType !== "nombre" && !/^\d+$/.test(cleanQuery)) {
      setError("Para registro o solicitud ingresa únicamente números.")
      setResult(null)
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const params = new URLSearchParams({
        q: cleanQuery,
        type: searchType,
        match: searchType === "nombre" ? "1" : "2",
      })
      const response = await fetch(`/api/inapi/search?${params.toString()}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      })
      const payload = (await response.json().catch(() => ({}))) as Partial<SearchResponse>

      if (!response.ok) {
        setError(response.status === 401 ? "Tu sesión expiró. Vuelve a iniciar sesión." : payload.error ?? "No fue posible consultar INAPI.")
        return
      }

      setResult({
        results: Array.isArray(payload.results) ? payload.results : [],
        total: typeof payload.total === "number" ? payload.total : 0,
        source: payload.source ?? "inapi-live",
        query: payload.query ?? cleanQuery,
        type: (payload.type as SearchType) ?? searchType,
      })
    } catch {
      setError("No fue posible conectar con el servicio INAPI.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300">
          <Database className="h-3.5 w-3.5" /> Consulta directa INAPI
        </div>
        <h1 className="font-serif text-3xl text-foreground">Buscar marca o expediente</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Consulta por nombre de marca, número de registro o número de solicitud. No necesitas subir un logo.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Tipo de consulta</CardTitle>
          <CardDescription>Selecciona el dato que tienes disponible.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {SEARCH_OPTIONS.map((option) => {
              const Icon = option.icon
              const active = option.value === searchType
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setSearchType(option.value)
                    setQuery("")
                    setResult(null)
                    setError(null)
                  }}
                  className={`rounded-xl border p-4 text-left transition ${
                    active
                      ? "border-blue-500/60 bg-blue-500/10"
                      : "border-border bg-card hover:border-blue-500/30 hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${active ? "text-blue-400" : "text-muted-foreground"}`} />
                    <span className="font-medium text-foreground">{option.label}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{option.description}</p>
                </button>
              )
            })}
          </div>

          <form onSubmit={runSearch} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              maxLength={120}
              inputMode={searchType === "nombre" ? "text" : "numeric"}
              placeholder={activeOption.placeholder}
              aria-label={`Buscar por ${activeOption.label.toLowerCase()}`}
              className="h-11 flex-1"
            />
            <Button type="submit" disabled={!query.trim() || loading} className="h-11 min-w-40">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              {loading ? "Consultando" : "Buscar en INAPI"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl text-foreground">Resultados</h2>
              <p className="text-sm text-muted-foreground">
                Consulta “{result.query}” · {result.total} {result.total === 1 ? "resultado" : "resultados"}
              </p>
            </div>
            <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-300">
              <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Fuente INAPI
            </Badge>
          </div>

          {result.results.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <FileSearch className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 font-medium text-foreground">No se encontraron antecedentes</p>
                <p className="mx-auto mt-1 max-w-2xl text-sm text-muted-foreground">
                  Esto no demuestra disponibilidad jurídica. Revisa la escritura, el número consultado y las clases relevantes.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {result.results.map((record, index) => {
                const requestNumber = metadataValue(record, ["numeroSolicitud", "numero_solicitud", "solicitud"])
                const originalState = metadataValue(record, ["estadoOriginal", "estado_original"])
                return (
                  <Card key={`${record.id}-${index}`}>
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <CardTitle className="font-serif text-xl">{record.nombre || "Marca sin nombre"}</CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5" /> {record.solicitante || "Solicitante no informado"}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className={stateClasses(record.estado)}>{record.estado || "Sin estado"}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        <div><p className="text-xs text-muted-foreground">Registro</p><p className="mt-1 font-medium text-foreground">{record.numeroRegistro || "—"}</p></div>
                        <div><p className="text-xs text-muted-foreground">Solicitud</p><p className="mt-1 font-medium text-foreground">{requestNumber || "—"}</p></div>
                        <div><p className="text-xs text-muted-foreground">Clases Niza</p><p className="mt-1 font-medium text-foreground">{record.niza?.join(", ") || "—"}</p></div>
                        <div><p className="text-xs text-muted-foreground">Fecha</p><p className="mt-1 font-medium text-foreground">{record.fecha || "—"}</p></div>
                      </div>
                      {originalState && originalState !== record.estado && (
                        <p className="mt-3 text-xs text-muted-foreground">Estado informado por la fuente: {originalState}</p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </section>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">
        La consulta apoya la revisión interna y no constituye una opinión jurídica ni una determinación de registrabilidad.
      </p>
    </div>
  )
}
