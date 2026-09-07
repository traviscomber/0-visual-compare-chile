"use client"

import { useMemo, useState } from "react"
import { ArrowUp, BookOpen, Bot, Check, ExternalLink, ListChecks, Loader2, Search, Sparkles } from "lucide-react"
import { OperationalPage, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type ToolTrace = { name: string; label: string; summary: string }
type ActionRequest = {
  contextType: "general" | "brand" | "company" | "technology"
  contextQuery: string
  caseTitle: string
  itemType: "research" | "watch"
  sourceId: string
  sourceTitle: string
  actionTitle: string
  priority: "low" | "normal" | "high"
  dueAt: string | null
  assignedTo: null
  evidence: Record<string, unknown>
}
type ActionProposal = {
  id: string
  title: string
  rationale: string
  expectedImpact: string
  confidence: "low" | "medium" | "high"
  priority: "low" | "normal" | "high"
  suggestedDueAt: string | null
  supportState: "paper_supported" | "insufficient_academic_evidence"
  evidence: Array<{ id: string; title: string; year: number | null; url: string; doi: string | null }>
  humanApprovalRequired: true
  actionRequest: ActionRequest | null
}
type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  trace?: ToolTrace[]
  actionProposals?: ActionProposal[]
}
type ProposalState = {
  status: "creating" | "created" | "error"
  href?: string
  error?: string
}

const STARTERS = [
  "Resume qué requiere mi atención ahora y por qué.",
  "Genera acciones para mi oportunidad más relevante y busca papers recientes que las respalden.",
  "¿Qué evidencia falta hoy para mis hipótesis competitivas activas?",
]

const PRIORITY_LABELS = { low: "Baja", normal: "Normal", high: "Alta" } as const
const CONFIDENCE_LABELS = { low: "Baja", medium: "Media", high: "Alta" } as const

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [proposalStates, setProposalStates] = useState<Record<string, ProposalState>>({})
  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading])

  async function send(text = input) {
    const content = text.trim()
    if (!content || loading) return
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput("")
    setError(null)
    setLoading(true)
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.map(({ role, content: messageContent }) => ({ role, content: messageContent })) }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "El asistente no pudo completar la orden.")
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: typeof payload.text === "string" ? payload.text : "No recibí una respuesta utilizable.",
        trace: Array.isArray(payload.trace) ? payload.trace : [],
        actionProposals: Array.isArray(payload.actionProposals) ? payload.actionProposals : [],
      }])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "El asistente no pudo completar la orden.")
    } finally {
      setLoading(false)
    }
  }

  async function createAction(messageId: string, proposal: ActionProposal) {
    if (!proposal.actionRequest || !proposal.humanApprovalRequired) return
    const key = `${messageId}:${proposal.id}`
    if (proposalStates[key]?.status === "creating" || proposalStates[key]?.status === "created") return
    setProposalStates((current) => ({ ...current, [key]: { status: "creating" } }))
    try {
      const response = await fetch("/api/intelligence/actions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(proposal.actionRequest),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos crear la acción.")
      setProposalStates((current) => ({
        ...current,
        [key]: { status: "created", href: typeof payload.href === "string" ? payload.href : undefined },
      }))
    } catch (cause) {
      setProposalStates((current) => ({
        ...current,
        [key]: { status: "error", error: cause instanceof Error ? cause.message : "No pudimos crear la acción." },
      }))
    }
  }

  return <OperationalPage>
    <section className="border-b border-border/80 py-8">
      <div className="max-w-4xl">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">VIDENTIA / Asistente</p>
        <h1 className="mt-2 text-3xl font-light tracking-[-0.03em] text-[#E7DFCE] sm:text-4xl">Pregunta, investiga y aplica.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Usa tu contexto VIDENTIA, busca papers y fundamenta las acciones propuestas con evidencia académica. Ninguna acción se crea hasta que la apruebas explícitamente.</p>
      </div>
    </section>

    <section className="mx-auto grid max-w-5xl gap-7 py-8">
      {!messages.length ? <div>
        <OperationalSectionHeader eyebrow="Empieza con una orden" title="Lenguaje natural, contexto real" />
        <div className="mt-5 grid gap-px overflow-hidden border border-border/70 bg-border/70 md:grid-cols-3">
          {STARTERS.map((starter, index) => <button key={starter} type="button" onClick={() => void send(starter)} className="bg-[#0D2329] p-5 text-left transition-colors hover:bg-[#132E34] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#96B5A6]">
            <span className="inline-flex size-8 items-center justify-center border border-[#355C55] text-[#96B5A6]">{index === 0 ? <Sparkles className="size-4"/> : index === 1 ? <BookOpen className="size-4"/> : <Search className="size-4"/>}</span>
            <p className="mt-4 text-sm leading-6 text-[#E7DFCE]">{starter}</p>
          </button>)}
        </div>
      </div> : null}

      <div aria-live="polite" className="min-h-[340px] border-y border-border/80">
        {messages.map((message) => <article key={message.id} className={`border-b border-border/60 py-6 last:border-b-0 ${message.role === "user" ? "pl-0 sm:pl-16" : "pr-0 sm:pr-16"}`}>
          <div className="flex items-center gap-2">
            {message.role === "assistant" ? <Bot className="size-4 text-[#96B5A6]"/> : <span className="size-2 bg-[#456E8E]"/>}
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">{message.role === "assistant" ? "Asistente VIDENTIA" : "Tú"}</p>
          </div>
          <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#E7DFCE]">{message.content}</div>
          {message.trace?.length ? <div className="mt-4 flex flex-wrap gap-2">{message.trace.map((trace, index) => <Badge key={`${trace.name}-${index}`} variant="outline" className="max-w-full gap-2 border-[#355C55] bg-[#0D2329] text-[#96B5A6]"><span>{trace.label}</span><span className="truncate text-muted-foreground">{trace.summary}</span></Badge>)}</div> : null}
          {message.role === "assistant" && message.actionProposals?.length ? <div className="mt-6 border-t border-border/70 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ListChecks className="size-4 text-[#96B5A6]" />
                <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#96B5A6]">Acciones propuestas · requieren aprobación</p>
              </div>
              <p className="text-[10px] text-muted-foreground">Sólo se crea la acción que confirmes.</p>
            </div>
            <div className="mt-4 divide-y divide-border/60 border-y border-border/60">
              {message.actionProposals.map((proposal) => {
                const key = `${message.id}:${proposal.id}`
                const state = proposalStates[key]
                return <section key={proposal.id} className="py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-medium text-[#E7DFCE]">{proposal.title}</h3>
                        <Badge variant="outline" className="border-[#355C55] text-[#96B5A6]">Prioridad {PRIORITY_LABELS[proposal.priority]}</Badge>
                        <Badge variant="outline" className="border-border/80 text-muted-foreground">Confianza {CONFIDENCE_LABELS[proposal.confidence]}</Badge>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground"><span className="text-[#C8D4CD]">Motivo:</span> {proposal.rationale}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground"><span className="text-[#C8D4CD]">Impacto esperado:</span> {proposal.expectedImpact}</p>
                      {proposal.suggestedDueAt ? <p className="mt-2 text-xs text-muted-foreground">Plazo sugerido: {formatDueDate(proposal.suggestedDueAt)}</p> : null}

                      <div className="mt-4">
                        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Evidencia académica</p>
                        {proposal.evidence.length ? <div className="mt-2 grid gap-2">
                          {proposal.evidence.map((paper) => <a key={paper.id} href={paper.url} target="_blank" rel="noreferrer" className="group flex items-start justify-between gap-3 border-l border-[#355C55] pl-3 text-xs leading-5 text-[#C8D4CD] hover:text-[#E7DFCE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6]">
                            <span>{paper.title}{paper.year ? ` · ${paper.year}` : ""}</span>
                            <ExternalLink className="mt-0.5 size-3 shrink-0 text-muted-foreground group-hover:text-[#96B5A6]" />
                          </a>)}
                        </div> : <p className="mt-2 text-xs leading-5 text-[#D6A46F]">Sin soporte académico suficiente. Esto no se interpreta como evidencia negativa.</p>}
                      </div>
                    </div>

                    <div className="w-full shrink-0 lg:w-40">
                      {!proposal.actionRequest ? <div className="border border-border/70 px-3 py-3 text-xs leading-5 text-muted-foreground">Sin anclaje canónico. Propuesta conceptual; no se puede crear como tarea todavía.</div> : state?.status === "created" ? <div className="grid gap-2">
                        <div className="flex items-center justify-center gap-2 border border-[#355C55] px-3 py-2 text-xs text-[#96B5A6]"><Check className="size-3.5"/>Creada</div>
                        {state.href ? <a href={state.href} className="text-center text-xs text-[#C8D4CD] underline-offset-4 hover:underline">Abrir tarea</a> : null}
                      </div> : <Button type="button" size="sm" className="w-full" disabled={state?.status === "creating"} onClick={() => void createAction(message.id, proposal)}>
                        {state?.status === "creating" ? <Loader2 className="size-4 animate-spin"/> : <ListChecks className="size-4"/>}
                        {state?.status === "creating" ? "Creando…" : "Crear acción"}
                      </Button>}
                      {proposal.actionRequest && state?.status !== "created" ? <p className="mt-2 text-center text-[10px] leading-4 text-muted-foreground">Requiere tu confirmación.</p> : null}
                      {state?.status === "error" ? <p role="alert" className="mt-2 text-xs leading-5 text-[#D6A46F]">{state.error}</p> : null}
                    </div>
                  </div>
                </section>
              })}
            </div>
          </div> : null}
        </article>)}
        {loading ? <div className="flex items-center gap-3 py-7 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin text-[#96B5A6]"/>Investigando contexto, papers y evidencia…</div> : null}
        {!messages.length && !loading ? <div className="flex min-h-[260px] items-center justify-center px-6 text-center text-sm leading-6 text-muted-foreground">Pregunta por cualquier información que VIDENTIA te entregue o da una orden concreta de investigación.</div> : null}
      </div>

      {error ? <div role="alert" className="border border-[#D6A46F]/20 bg-[#332C24]/70 p-4 text-sm text-[#E0B987]">{error}</div> : null}

      <form onSubmit={(event) => { event.preventDefault(); void send() }} className="sticky bottom-4 border border-[#35525A] bg-[#091A20] p-3 shadow-2xl">
        <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); if (canSend) void send() } }} rows={3} maxLength={8000} placeholder="Ej: genera acciones para XXX y busca papers recientes que las respalden" className="w-full resize-none bg-transparent px-2 py-2 text-sm leading-6 text-[#E7DFCE] outline-none placeholder:text-muted-foreground" />
        <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-3">
          <p className="text-[10px] text-muted-foreground">Enter envía · Shift+Enter agrega línea</p>
          <Button type="submit" size="sm" disabled={!canSend}>{loading ? <Loader2 className="size-4 animate-spin"/> : <ArrowUp className="size-4"/>}Enviar</Button>
        </div>
      </form>
    </section>
  </OperationalPage>
}

function formatDueDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "sin fecha"
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", year: "numeric" }).format(date)
}