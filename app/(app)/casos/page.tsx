"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { ArrowRight, BriefcaseBusiness, FolderOpen, Loader2, Plus, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type CaseSummary = {
  id: string
  title: string
  status: "open" | "review" | "decided" | "archived"
  priority: "low" | "normal" | "high"
  context_type: "general" | "brand" | "company" | "technology"
  context_query: string | null
  decision_summary: string | null
  notes: string | null
  created_at: string
  updated_at: string
  item_count: number
}

const STATUS_LABELS: Record<CaseSummary["status"], string> = { open: "Abierto", review: "En revisión", decided: "Decidido", archived: "Archivado" }
const CONTEXT_LABELS: Record<CaseSummary["context_type"], string> = { general: "General", brand: "Marca", company: "Empresa", technology: "Tecnología" }

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(date)
}

export default function CasesPage() {
  const [cases, setCases] = useState<CaseSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState("")
  const [contextType, setContextType] = useState<CaseSummary["context_type"]>("general")
  const [contextQuery, setContextQuery] = useState("")
  const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/cases", { cache: "no-store" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos cargar los casos.")
      setCases(payload.cases ?? [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos cargar los casos.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return cases
    return cases.filter((item) => [item.title, item.context_query, item.decision_summary].filter(Boolean).some((value) => String(value).toLowerCase().includes(q)))
  }, [cases, search])

  const activeCount = cases.filter((item) => item.status !== "archived" && item.status !== "decided").length
  const reviewCount = cases.filter((item) => item.status === "review").length
  const decidedCount = cases.filter((item) => item.status === "decided").length

  const createCase = async (event: FormEvent) => {
    event.preventDefault()
    if (title.trim().length < 2 || creating) return
    setCreating(true)
    setError(null)
    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, contextType, contextQuery: contextQuery || null }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos crear el caso.")
      setTitle("")
      setContextQuery("")
      setContextType("general")
      setShowCreate(false)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos crear el caso.")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:py-14">
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground"><BriefcaseBusiness className="h-3.5 w-3.5" /> Casos y decisiones</div>
          <h1 className="text-4xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl">Trabaja sobre una decisión, no sobre pantallas.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">Agrupa evaluaciones, investigaciones, vigilancias y señales dentro de un contexto persistente. Documenta qué sabes, qué falta y qué decidiste.</p>
        </div>
        <Button onClick={() => setShowCreate((value) => !value)}><Plus className="mr-2 h-4 w-4" />Nuevo caso</Button>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="Casos activos" value={activeCount} detail="Abiertos o en revisión" />
        <Metric label="En revisión" value={reviewCount} detail="Requieren una decisión" />
        <Metric label="Decididos" value={decidedCount} detail="Con decisión registrada" />
      </section>

      {showCreate && (
        <Card className="border-foreground/15">
          <CardHeader><CardTitle className="text-xl">Crear caso</CardTitle><CardDescription>Define el contexto que quieres seguir. Luego podrás añadir evidencia desde cualquier journey.</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={createCase} className="grid gap-3 lg:grid-cols-[1fr_180px_1fr_auto]">
              <Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} placeholder="Ej: Lanzamiento Marca Atlas" />
              <select value={contextType} onChange={(event) => setContextType(event.target.value as CaseSummary["context_type"])} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground">
                <option value="general">General</option><option value="brand">Marca</option><option value="company">Empresa</option><option value="technology">Tecnología</option>
              </select>
              <Input value={contextQuery} onChange={(event) => setContextQuery(event.target.value)} maxLength={240} placeholder="Contexto opcional: ATLAS, NESTLE, A61…" />
              <Button disabled={title.trim().length < 2 || creating}>{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear"}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3"><Search className="h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar casos" className="border-0 bg-transparent shadow-none focus-visible:ring-0" /></div>

      <section>
        {loading ? (
          <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Cargando casos…</div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center"><FolderOpen className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-4 text-lg font-semibold text-foreground">Todavía no hay casos aquí</h2><p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">Crea uno o guarda un hallazgo desde Evaluar, Investigar o Monitorear. La evidencia quedará conectada a una decisión concreta.</p></div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {visible.map((item) => (
              <Link key={item.id} href={`/casos/${item.id}`} className="group rounded-2xl border border-border bg-card p-5 transition hover:border-foreground/20 hover:bg-secondary/10">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><div className="flex flex-wrap gap-2"><Badge variant="outline">{STATUS_LABELS[item.status]}</Badge><Badge variant="secondary">{CONTEXT_LABELS[item.context_type]}</Badge>{item.priority === "high" && <Badge>Prioridad alta</Badge>}</div><h2 className="mt-4 text-xl font-semibold text-foreground">{item.title}</h2>{item.context_query && <p className="mt-1 text-sm text-muted-foreground">Contexto: {item.context_query}</p>}</div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
                {item.decision_summary && <p className="mt-4 line-clamp-2 text-sm leading-6 text-foreground/80">{item.decision_summary}</p>}
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground"><span>{item.item_count} {item.item_count === 1 ? "evidencia" : "evidencias"}</span><span>Actualizado {formatDate(item.updated_at)}</span></div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Metric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold text-foreground">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>
}