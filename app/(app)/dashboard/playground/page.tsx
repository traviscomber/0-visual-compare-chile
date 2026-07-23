"use client"

import { useState, useCallback } from "react"
import { Terminal, Play, Copy, CheckCheck, ChevronDown, ChevronRight, Zap, Shield, BarChart3, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type HttpMethod = "GET" | "POST"

interface Endpoint {
  id: string
  method: HttpMethod
  path: string
  label: string
  description: string
  requiresAuth: boolean
  category: "infra" | "datos" | "api"
  params?: { key: string; label: string; placeholder: string; default: string }[]
  body?: object
}

interface RequestResult {
  status: number
  statusText: string
  data: unknown
  headers: Record<string, string>
  duration: number
  timestamp: string
}

// ---------------------------------------------------------------------------
// Endpoint catalog
// ---------------------------------------------------------------------------

const ENDPOINTS: Endpoint[] = [
  {
    id: "health",
    method: "GET",
    path: "/api/v1/health",
    label: "Health Check",
    description: "Verifica que el API esta operativo y retorna la version.",
    requiresAuth: false,
    category: "infra",
  },
  {
    id: "usage",
    method: "GET",
    path: "/api/v1/usage",
    label: "Estadisticas de uso",
    description: "Cuota diaria/mensual, llamadas, imagenes y comparaciones de la clave actual.",
    requiresAuth: true,
    category: "api",
  },
  {
    id: "search-nombre",
    method: "GET",
    path: "/api/v1/search",
    label: "Buscar marca por nombre",
    description: "Busca marcas registradas en INAPI por nombre. Puede tardar 20-40s (44k+ registros indexados).",
    requiresAuth: false,
    category: "datos",
    params: [
      { key: "q", label: "Nombre a buscar", placeholder: "ej: APPLE, NIKE, SAMSUNG", default: "APPLE" },
      { key: "type", label: "Tipo", placeholder: "nombre | niza | viena", default: "nombre" },
      { key: "limit", label: "Limite", placeholder: "1-50", default: "5" },
    ],
  },
  {
    id: "search-niza",
    method: "GET",
    path: "/api/v1/search",
    label: "Buscar por clase Niza",
    description: "Filtra marcas por su clase de producto/servicio segun la clasificacion Niza.",
    requiresAuth: false,
    category: "datos",
    params: [
      { key: "q", label: "Clase Niza", placeholder: "ej: 9, 25, 42", default: "9" },
      { key: "type", label: "Tipo", placeholder: "niza", default: "niza" },
      { key: "limit", label: "Limite", placeholder: "1-50", default: "5" },
    ],
  },
  {
    id: "search-viena",
    method: "GET",
    path: "/api/v1/search",
    label: "Buscar por codigo Viena",
    description: "Filtra marcas por su codigo de clasificacion visual segun el sistema de Viena.",
    requiresAuth: false,
    category: "datos",
    params: [
      { key: "q", label: "Codigo Viena", placeholder: "ej: 27.5, 1.1", default: "27.5" },
      { key: "type", label: "Tipo", placeholder: "viena", default: "viena" },
      { key: "limit", label: "Limite", placeholder: "1-50", default: "5" },
    ],
  },
]

const CATEGORY_LABELS: Record<string, string> = {
  infra: "Infraestructura",
  datos: "Datos de Marcas",
  api: "Cuenta y Cuota",
}

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  POST: "bg-blue-500/15 text-blue-400 border-blue-500/30",
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusColor(status: number) {
  if (status >= 200 && status < 300) return "text-emerald-400"
  if (status >= 400 && status < 500) return "text-amber-400"
  return "text-red-400"
}

function formatJson(data: unknown) {
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EndpointCard({
  endpoint,
  isSelected,
  onSelect,
}: {
  endpoint: Endpoint
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all ${
        isSelected
          ? "border-primary/60 bg-primary/10"
          : "border-border bg-card hover:border-border/80 hover:bg-secondary/40"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`rounded border px-1.5 py-0.5 text-xs font-mono font-semibold ${METHOD_COLORS[endpoint.method]}`}>
          {endpoint.method}
        </span>
        <span className="text-xs font-medium text-foreground">{endpoint.label}</span>
        {endpoint.requiresAuth && (
          <Shield className="ml-auto h-3 w-3 text-muted-foreground" />
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground leading-snug line-clamp-1">{endpoint.description}</p>
    </button>
  )
}

function ResultPanel({ result }: { result: RequestResult | null; loading: boolean }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    if (!result) return
    navigator.clipboard.writeText(formatJson(result.data))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [result])

  if (!result) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <Terminal className="h-10 w-10 opacity-30" />
        <p className="text-sm">Ejecuta una llamada para ver la respuesta aqui</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Response meta */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold font-mono ${statusColor(result.status)}`}>
            {result.status} {result.statusText}
          </span>
          <span className="text-xs text-muted-foreground">{result.duration}ms</span>
          <span className="text-xs text-muted-foreground">{result.timestamp}</span>
        </div>
        <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs" onClick={handleCopy}>
          {copied ? <CheckCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>

      {/* Headers summary */}
      {Object.keys(result.headers).length > 0 && (
        <div className="border-b border-border bg-secondary/30 px-4 py-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {Object.entries(result.headers).map(([k, v]) => (
              <span key={k} className="text-xs text-muted-foreground">
                <span className="text-foreground/60">{k}:</span> {v}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* JSON body */}
      <div className="flex-1 overflow-auto px-4 py-3">
        <pre className="text-xs leading-relaxed text-emerald-300/90 font-mono whitespace-pre-wrap break-words">
          {formatJson(result.data)}
        </pre>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function PlaygroundPage() {
  const [apiKey, setApiKey] = useState("")
  const [selectedId, setSelectedId] = useState<string>("health")
  const [params, setParams] = useState<Record<string, Record<string, string>>>({})
  const [result, setResult] = useState<RequestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["infra", "datos", "api"]))

  const selected = ENDPOINTS.find((e) => e.id === selectedId)!

  const getParam = (endpointId: string, key: string) => {
    return params[endpointId]?.[key] ?? ""
  }

  const setParam = (endpointId: string, key: string, value: string) => {
    setParams((prev) => ({
      ...prev,
      [endpointId]: { ...(prev[endpointId] ?? {}), [key]: value },
    }))
  }

  const resolvedParams = (ep: Endpoint) => {
    if (!ep.params) return {}
    return Object.fromEntries(
      ep.params.map((p) => [p.key, getParam(ep.id, p.key) || p.default])
    )
  }

  const buildUrl = (ep: Endpoint) => {
    const base = ep.path
    const p = resolvedParams(ep)
    if (ep.method === "GET" && Object.keys(p).length > 0) {
      return base + "?" + new URLSearchParams(p).toString()
    }
    return base
  }

  const buildCurl = (ep: Endpoint) => {
    const p = resolvedParams(ep)
    let url = ep.path
    if (ep.method === "GET" && Object.keys(p).length > 0) {
      url += "?" + new URLSearchParams(p).toString()
    }
    const authFlag = ep.requiresAuth && apiKey ? ` \\\n  -H "Authorization: Bearer ${apiKey}"` : ""
    const bodyFlag = ep.method === "POST" && ep.body ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(ep.body)}'` : ""
    return `curl -s "${url}"${authFlag}${bodyFlag}`
  }

  const handleRun = useCallback(async () => {
    if (!selected) return
    setLoading(true)
    setResult(null)

    const t0 = performance.now()
    try {
      const url = buildUrl(selected)
      const headers: Record<string, string> = {}
      if (selected.requiresAuth && apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`
      }
      if (selected.method === "POST") {
        headers["Content-Type"] = "application/json"
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 60000)
      let res: Response
      try {
        res = await fetch(url, {
          method: selected.method,
          headers,
          body: selected.method === "POST" && selected.body ? JSON.stringify(selected.body) : undefined,
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timeout)
      }

      const duration = Math.round(performance.now() - t0)
      let data: unknown
      try {
        data = await res.json()
      } catch {
        data = await res.text()
      }

      // Extract relevant rate-limit headers
      const rateLimitHeaders: Record<string, string> = {}
      const rlKeys = ["x-ratelimit-limit-daily", "x-ratelimit-remaining-daily", "x-ratelimit-limit-monthly", "x-ratelimit-remaining-monthly"]
      rlKeys.forEach((k) => {
        const v = res.headers.get(k)
        if (v) rateLimitHeaders[k] = v
      })

      setResult({
        status: res.status,
        statusText: res.statusText || (res.ok ? "OK" : "Error"),
        data,
        headers: rateLimitHeaders,
        duration,
        timestamp: new Date().toLocaleTimeString("es-CL"),
      })
    } catch (err) {
      const duration = Math.round(performance.now() - t0)
      setResult({
        status: 0,
        statusText: "Network Error",
        data: { error: err instanceof Error ? err.message : "Connection failed" },
        headers: {},
        duration,
        timestamp: new Date().toLocaleTimeString("es-CL"),
      })
    } finally {
      setLoading(false)
    }
  }, [selected, apiKey, params]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const categories = Object.keys(CATEGORY_LABELS)

  return (
    <div className="flex h-[calc(100svh-4rem)] flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Terminal className="h-4 w-4 text-primary" />
        <h1 className="text-sm font-semibold text-foreground">API Playground</h1>
        <span className="text-xs text-muted-foreground">v1</span>
        <div className="ml-auto flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sc_... (pega tu API key)"
            className="h-7 w-72 font-mono text-xs"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — endpoint list */}
        <aside className="w-64 flex-shrink-0 overflow-y-auto border-r border-border bg-card/50">
          <div className="p-3 space-y-4">
            {categories.map((cat) => {
              const eps = ENDPOINTS.filter((e) => e.category === cat)
              const expanded = expandedCategories.has(cat)
              return (
                <div key={cat}>
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="flex w-full items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 hover:text-foreground transition-colors"
                  >
                    {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    {CATEGORY_LABELS[cat]}
                  </button>
                  {expanded && (
                    <div className="space-y-1.5">
                      {eps.map((ep) => (
                        <EndpointCard
                          key={ep.id}
                          endpoint={ep}
                          isSelected={selectedId === ep.id}
                          onSelect={() => setSelectedId(ep.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </aside>

        {/* Center — request config */}
        <div className="flex w-80 flex-shrink-0 flex-col border-r border-border overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Endpoint header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`rounded border px-1.5 py-0.5 text-xs font-mono font-semibold ${METHOD_COLORS[selected.method]}`}>
                  {selected.method}
                </span>
                <span className="text-xs font-semibold text-foreground">{selected.label}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{selected.description}</p>
              <code className="mt-2 block rounded bg-secondary/60 px-2 py-1 text-xs font-mono text-muted-foreground">
                {selected.path}
              </code>
            </div>

            {/* Auth warning */}
            {selected.requiresAuth && !apiKey && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
                <p className="text-xs text-amber-400 flex items-center gap-1.5">
                  <Shield className="h-3 w-3" />
                  Este endpoint requiere una API key.
                </p>
              </div>
            )}

            {/* Params */}
            {selected.params && selected.params.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Parametros</p>
                {selected.params.map((p) => (
                  <div key={p.key}>
                    <label className="mb-1 block text-xs text-foreground/70">{p.label}</label>
                    <Input
                      value={getParam(selected.id, p.key)}
                      onChange={(e) => setParam(selected.id, p.key, e.target.value)}
                      placeholder={p.placeholder}
                      className="h-8 text-xs font-mono"
                    />
                    <p className="mt-0.5 text-xs text-muted-foreground">default: {p.default}</p>
                  </div>
                ))}
              </div>
            )}

            {/* cURL preview */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">cURL</p>
              <pre className="rounded-lg bg-secondary/60 p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all leading-relaxed">
                {buildCurl(selected)}
              </pre>
            </div>

            {/* Run button */}
            <Button
              onClick={handleRun}
              disabled={loading}
              className="w-full gap-2"
              size="sm"
            >
              {loading ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                  Ejecutando...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Ejecutar llamada
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right — response */}
        <div className="flex flex-1 flex-col overflow-hidden bg-slate-950/60">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 bg-card/30">
            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Respuesta</span>
            {result && (
              <Badge
                variant="outline"
                className={`ml-auto text-xs font-mono ${statusColor(result.status)}`}
              >
                {result.status}
              </Badge>
            )}
          </div>
          <ResultPanel result={result} loading={loading} />
        </div>
      </div>
    </div>
  )
}
