"use client"

import Link from "next/link"
import { type FormEvent, useEffect, useMemo, useState } from "react"
import { ArrowRight, CheckCircle2, FolderOpen, Inbox, Loader2, Plus, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  OperationalHeader,
  OperationalMetric,
  OperationalMetricRail,
  OperationalPage,
  OperationalPanel,
  OperationalSectionHeader,
} from "@/components/app/operational-ui"

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

const STATUS_LABELS: Record<CaseSummary["status"], string> = {
  open: "Abierto",
  review: "En revisión",
  decided: "Decidido",
  archived: "Archivado",
}

const CONTEXT_LABELS: Record<CaseSummary["context_type"], string> = {
  general: "General",
  brand: "Marca",
  company: "Empresa · legacy",
  technology: "Tecnología · legacy",
}

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
  const [contextType, setContextType] = useState<"brand" | "general">("brand")
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

  useEffect(() => {
    void load()
  }, [])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    const statusRank: Record<CaseSummary["status"], number> = { review: 4, open: 3, decided: 2, archived: 1 }
    const priorityRank: Record<CaseSummary["priority"], number> = { high: 3, normal: 2, low: 1 }
    return cases
      .filter((item) => !q || [item.title, item.context_query, item.decision_summary].filter(Boolean).some((value) => String(value).toLowerCase().includes(q)))
      .sort((a, b) => statusRank[b.status] - statusRank[a.status] || priorityRank[b.priority] - priorityRank[a.priority] || Date.parse(b.updated_at) - Date.parse(a.updated_at))
  }, [cases, search])

  const active = cases.filter((item) => item.status === "open" || item.status === "review")
  const review = cases.filter((item) => item.status === "review")
  const decided = cases.filter((item) => item.status === "decided")
  const highPriority = active.filter((item) => item.priority === "high")
  const actionNow = review.length + highPriority.filter((item) => item.status !== "review").length

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
      setContextType("brand")
      setShowCreate(false)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos crear el caso.")
    } finally {
      setCreating(false)
    }
  }

  return (
    <OperationalPage>
      <OperationalHeader
        eyebrow="VIDENTIA / Casos"
        title={actionNow ? `${actionNow} caso${actionNow === 1 ? "" : "s"} requiere${actionNow === 1 ? "" : "n"} acción ahora.` : active.length ? `${active.length} caso${active.length === 1 ? "" : "s"} sigue${active.length === 1 ? "" : "n"} activo${active.length === 1 ? "" : "s"}.` : "No hay casos activos pendientes."}
        description={<p>Primero aparecen los casos en revisión y de prioridad alta. Después se muestran los abiertos, decididos y archivados, manteniendo contexto, evidencia y decisión en un solo registro.</p>}
        meta={<><span>Evidencia conectada</span><span>Revisión humana</span><span>Historial trazable</span></>}
        actions={<><Button asChild variant="secondary"><Link href="/casos/pendientes"><Inbox className="mr-2 h-4 w-4" />Mis pendientes</Link></Button><Button onClick={() => setShowCreate((value) => !value)}><Plus className="mr-2 h-4 w-4" />Nuevo caso</Button></>}
      />

      <OperationalMetricRail>
        <OperationalMetric value={actionNow} label="Para actuar" detail={`${review.length} en revisión · ${highPriority.length} prioridad alta`} tone={actionNow ? "warning" : "neutral"} />
        <OperationalMetric value={active.length} label="Activos" detail="Abiertos o en revisión" />
        <OperationalMetric value={review.length} label="En revisión" detail="Requieren criterio del equipo" tone={review.length ? "warning" : "neutral"} />
        <OperationalMetric value={decided.length} label="Decididos" detail="Con decisión registrada" tone="success" />
      </OperationalMetricRail>

      {showCreate ? (
        <section className="border-b border-border/80 py-8">
          <OperationalPanel>
            <form onSubmit={createCase}>
              <OperationalSectionHeader eyebrow="Nuevo registro" title="¿Qué decisión quieres seguir?" meta="La evidencia puede añadirse después desde Investigar, Evaluar o Vigilancia." />
              <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_minmax(0,0.8fr)_auto]">
                <Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} placeholder="Ej: Evaluar registro de marca Atlas" aria-label="Título del caso" />
                <select value={contextType} onChange={(event) => setContextType(event.target.value as "brand" | "general")} aria-label="Tipo de contexto" className="h-10 rounded-[9px] border border-input bg-[#0F2A33] px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-ring/50"><option value="brand">Marca</option><option value="general">General</option></select>
                <Input value={contextQuery} onChange={(event) => setContextQuery(event.target.value)} maxLength={240} placeholder="Marca o contexto opcional" aria-label="Contexto del caso" />
                <Button disabled={title.trim().length < 2 || creating}>{creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Plus className="mr-2 h-4 w-4" />}Crear caso</Button>
              </div>
            </form>
          </OperationalPanel>
        </section>
      ) : null}

      {error ? <div role="alert" className="mt-6 rounded-[10px] border border-[#D6A46F]/20 bg-[#332C24]/70 p-4 text-sm text-[#E0B987]">{error}</div> : null}

      <section className="py-9">
        <OperationalSectionHeader
          eyebrow="Registro de decisiones"
          title="Primero resuelve. Después consulta historial."
          meta={`${active.length} activos · ${decided.length} decididos`}
          action={<label className="flex w-full max-w-sm items-center gap-2 rounded-[9px] bg-[#13272D] px-3 focus-within:ring-2 focus-within:ring-ring/40 sm:w-80"><Search className="h-4 w-4 shrink-0 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar caso o marca" aria-label="Buscar casos" className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" /></label>}
        />

        <div className="mt-5">
          {loading ? <div className="flex items-center gap-2 border-y border-border/80 py-12 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />Cargando casos…</div> : visible.length === 0 ? (
            <OperationalPanel className="text-center"><FolderOpen className="mx-auto h-6 w-6 text-muted-foreground" /><h3 className="mt-4 text-lg font-medium text-[#E7DFCE]">No hay casos en esta vista</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Crea un caso o guarda un hallazgo desde una investigación. La evidencia quedará conectada a una decisión concreta.</p><Button onClick={() => setShowCreate(true)} variant="secondary" className="mt-5">Crear caso</Button></OperationalPanel>
          ) : (
            <div className="divide-y divide-border/80 border-y border-border/80">
              {visible.map((item) => (
                <Link key={item.id} href={`/casos/${item.id}`} className="group grid gap-4 py-5 outline-none transition-colors hover:bg-[#13272D]/65 focus-visible:bg-[#13272D] md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:px-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={item.status} />
                      <Badge variant="outline" className="rounded-md border-border/80 bg-transparent text-white/70">{CONTEXT_LABELS[item.context_type]}</Badge>
                      {item.priority === "high" ? <Badge className="rounded-md border-[#D6A46F]/20 bg-[#332C24]/70 text-[#E0B987] hover:bg-[#332C24]/70">Prioridad alta</Badge> : null}
                    </div>
                    <h3 className="mt-3 text-lg font-medium text-[#E7DFCE]">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.context_query ? `${item.context_query} · ` : ""}{item.item_count} {item.item_count === 1 ? "evidencia" : "evidencias"}</p>
                    {item.decision_summary ? <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-white/80">{item.decision_summary}</p> : <p className="mt-3 text-sm text-muted-foreground">Aún no hay una decisión resumida.</p>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground"><span className="hidden sm:block">Actualizado {formatDate(item.updated_at)}</span><span className="inline-flex items-center gap-2 text-sm font-medium text-white">{item.status === "review" || item.priority === "high" ? "Resolver" : "Abrir"}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </OperationalPage>
  )
}

function StatusBadge({ status }: { status: CaseSummary["status"] }) {
  if (status === "decided") return <Badge className="rounded-md border-[#4A7F74]/20 bg-[#4A7F74]/[0.07] text-[#96B5A6] hover:bg-[#4A7F74]/[0.07]"><CheckCircle2 className="mr-1 h-3 w-3" />{STATUS_LABELS[status]}</Badge>
  if (status === "review") return <Badge className="rounded-md border-[#D6A46F]/20 bg-[#332C24]/70 text-[#E0B987] hover:bg-[#332C24]/70">{STATUS_LABELS[status]}</Badge>
  return <Badge variant="outline" className="rounded-md border-border/80 bg-transparent text-white/70">{STATUS_LABELS[status]}</Badge>
}
