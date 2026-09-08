"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowUp, Bot, Check, ExternalLink, ListChecks, Loader2, Minimize2, Sparkles } from "lucide-react"
import { AssistantResponseFeedback } from "@/components/app/assistant-response-feedback"
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
  executionId?: string
}
type ProposalState = {
  status: "creating" | "created" | "error"
  href?: string
  error?: string
}
type AssistantPageContext = {
  pathname: string
  workspace: string
  focus: Array<{ key: string; value: string }>
}

const PAGE_CONTEXT_KEYS = [
  "ideaKey",
  "ideaTitle",
  "company",
  "companyId",
  "brand",
  "brandId",
  "caseId",
  "watchId",
  "technology",
  "technologyId",
  "target",
  "q",
] as const

const STARTERS = [
  "Explícame esta pantalla y qué requiere atención.",
  "Genera acciones para esta oportunidad y busca papers.",
  "¿Qué evidencia falta para lo que estoy viendo?",
]
const PRIORITY_LABELS = { low: "Baja", normal: "Normal", high: "Alta" } as const
const CONFIDENCE_LABELS = { low: "Baja", medium: "Media", high: "Alta" } as const

export function VidentiaAssistantLauncher() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [proposalStates, setProposalStates] = useState<Record<string, ProposalState>>({})
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("assistant") === "open") {
      setOpen(true)
      params.delete("assistant")
      const query = params.toString()
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const node = scrollRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [open, loading, messages])

  async function send(text = input) {
    const content = text.trim()
    if (!content || loading) return
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content }
    const nextMessages = [...messages, userMessage]
    const pageContext = buildAssistantPageContext()
    setMessages(nextMessages)
    setInput("")
    setError(null)
    setLoading(true)
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content: messageContent }) => ({ role, content: messageContent })),
          pageContext,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "El asistente no pudo completar la orden.")
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: typeof payload.text === "string" ? payload.text : "No recibí una respuesta utilizable.",
        trace: Array.isArray(payload.trace) ? payload.trace : [],
        actionProposals: Array.isArray(payload.actionProposals) ? payload.actionProposals : [],
        executionId: typeof payload.executionId === "string" ? payload.executionId : undefined,
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
    if (["creating", "created"].includes(proposalStates[key]?.status ?? "")) return
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

  if (!open) {
    return <button
      type="button"
      aria-label="Abrir Asistente VIDENTIA"
      aria-expanded="false"
      onClick={() => setOpen(true)}
      className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 border border-[#355C55] bg-[#091A20] px-4 py-3 text-xs font-medium text-[#E7DFCE] shadow-2xl transition-colors hover:bg-[#132E34] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6] md:bottom-5 md:right-5"
    >
      <Bot className="size-4 text-[#96B5A6]" />
      Asistente
    </button>
  }

  return <aside
    role="dialog"
    aria-label="Asistente VIDENTIA"
    aria-modal="false"
    className="fixed inset-x-2 bottom-2 top-[72px] z-50 flex flex-col border border-[#355C55] bg-[#07181E] shadow-2xl md:inset-auto md:bottom-5 md:right-5 md:h-[min(720px,calc(100dvh-40px))] md:w-[min(440px,calc(100vw-40px))]"
  >
    <header className="flex shrink-0 items-center justify-between border-b border-border/70 bg-[#091A20] px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex size-8 shrink-0 items-center justify-center border border-[#355C55] text-[#96B5A6]"><Bot className="size-4" /></span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#E7DFCE]">Asistente VIDENTIA</p>
          <p className="truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Pantalla actual · contexto · papers · acciones</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Minimizar asistente"
        className="inline-flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-[#E7DFCE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6]"
      >
        <Minimize2 className="size-4" />
      </button>
    </header>

    <div ref={scrollRef} aria-live="polite" className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
      {!messages.length ? <div className="grid gap-4">
        <div className="border-l border-[#355C55] pl-3">
          <p className="text-sm leading-6 text-[#E7DFCE]">Pregunta sobre la pantalla actual, una señal, oportunidad, competidor, caso o tecnología mientras sigues trabajando en VIDENTIA.</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">La pantalla sólo orienta el contexto. La evidencia se recupera desde fuentes canónicas y las acciones requieren tu aprobación.</p>
        </div>
        <div className="grid gap-2">
          {STARTERS.map((starter) => <button
            key={starter}
            type="button"
            onClick={() => void send(starter)}
            className="flex items-start gap-2 border border-border/70 bg-[#0D2329] px-3 py-3 text-left text-xs leading-5 text-[#C8D4CD] transition-colors hover:bg-[#132E34] hover:text-[#E7DFCE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6]"
          >
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#96B5A6]" />
            <span>{starter}</span>
          </button>)}
        </div>
      </div> : null}

      <div className="grid gap-4">
        {messages.map((message) => <article key={message.id} className={message.role === "user" ? "ml-7 border-l border-[#456E8E] pl-3" : "mr-2"}>
          <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{message.role === "assistant" ? "VIDENTIA" : "Tú"}</p>
          <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#E7DFCE]">{message.content}</div>

          {message.trace?.length ? <div className="mt-3 flex flex-wrap gap-1.5">{message.trace.map((trace, index) => <Badge key={`${trace.name}-${index}`} variant="outline" className="max-w-full border-[#355C55] bg-[#0D2329] px-2 py-1 text-[9px] font-normal text-[#96B5A6]"><span className="truncate">{trace.label} · {trace.summary}</span></Badge>)}</div> : null}

          {message.role === "assistant" && message.actionProposals?.length ? <div className="mt-4 grid gap-3 border-t border-border/60 pt-3">
            <div className="flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.14em] text-[#96B5A6]"><ListChecks className="size-3.5" />Acciones propuestas · requieren aprobación</div>
            {message.actionProposals.map((proposal) => {
              const key = `${message.id}:${proposal.id}`
              const state = proposalStates[key]
              return <section key={proposal.id} className="border border-border/70 bg-[#091A20] p-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="mr-auto text-sm font-medium leading-5 text-[#E7DFCE]">{proposal.title}</p>
                  <Badge variant="outline" className="border-[#355C55] px-1.5 py-0 text-[9px] text-[#96B5A6]">{PRIORITY_LABELS[proposal.priority]}</Badge>
                  <Badge variant="outline" className="border-border/80 px-1.5 py-0 text-[9px] text-muted-foreground">Conf. {CONFIDENCE_LABELS[proposal.confidence]}</Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{proposal.rationale}</p>
                <p className="mt-2 text-xs leading-5 text-[#C8D4CD]">Impacto: {proposal.expectedImpact}</p>
                {proposal.suggestedDueAt ? <p className="mt-2 text-[10px] text-muted-foreground">Plazo sugerido: {formatDueDate(proposal.suggestedDueAt)}</p> : null}

                {proposal.evidence.length ? <div className="mt-3 grid gap-1.5 border-t border-border/60 pt-2">
                  {proposal.evidence.slice(0, 3).map((paper) => <a key={paper.id} href={paper.url} target="_blank" rel="noreferrer" className="flex items-start justify-between gap-2 text-[10px] leading-4 text-[#C8D4CD] hover:text-[#E7DFCE]">
                    <span>{paper.title}{paper.year ? ` · ${paper.year}` : ""}</span>
                    <ExternalLink className="mt-0.5 size-3 shrink-0 text-[#96B5A6]" />
                  </a>)}
                </div> : <p className="mt-3 text-[10px] leading-4 text-[#D6A46F]">Sin soporte académico suficiente; no se interpreta como evidencia negativa.</p>}

                <div className="mt-3 border-t border-border/60 pt-3">
                  {!proposal.actionRequest ? <p className="text-[10px] leading-4 text-muted-foreground">Propuesta conceptual: todavía no tiene anclaje canónico.</p> : state?.status === "created" ? <div className="flex items-center justify-between gap-3 text-[10px] text-[#96B5A6]"><span className="inline-flex items-center gap-1.5"><Check className="size-3.5" />Acción creada</span>{state.href ? <a href={state.href} className="text-[#C8D4CD] underline-offset-4 hover:underline">Abrir</a> : null}</div> : <Button type="button" size="sm" className="h-8 w-full text-xs" disabled={state?.status === "creating"} onClick={() => void createAction(message.id, proposal)}>
                    {state?.status === "creating" ? <Loader2 className="size-3.5 animate-spin" /> : <ListChecks className="size-3.5" />}
                    {state?.status === "creating" ? "Creando…" : "Crear acción"}
                  </Button>}
                  {state?.status === "error" ? <p role="alert" className="mt-2 text-[10px] leading-4 text-[#D6A46F]">{state.error}</p> : null}
                </div>
              </section>
            })}
          </div> : null}

          {message.role === "assistant" && message.executionId ? <AssistantResponseFeedback executionId={message.executionId} /> : null}
        </article>)}

        {loading ? <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin text-[#96B5A6]" />Investigando contexto, papers y evidencia…</div> : null}
        {error ? <div role="alert" className="border border-[#D6A46F]/20 bg-[#332C24]/60 p-3 text-xs leading-5 text-[#E0B987]">{error}</div> : null}
      </div>
    </div>

    <form onSubmit={(event) => { event.preventDefault(); void send() }} className="shrink-0 border-t border-[#35525A] bg-[#091A20] p-3">
      <textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault()
            if (canSend) void send()
          }
        }}
        rows={2}
        maxLength={8000}
        placeholder="Pregunta por esta pantalla o da una orden…"
        className="w-full resize-none bg-transparent px-1 py-1 text-sm leading-5 text-[#E7DFCE] outline-none placeholder:text-muted-foreground"
      />
      <div className="mt-2 flex items-center justify-between gap-3 border-t border-border/60 pt-2">
        <p className="text-[9px] text-muted-foreground">Enter envía · Shift+Enter agrega línea</p>
        <Button type="submit" size="sm" className="h-8" disabled={!canSend}>{loading ? <Loader2 className="size-3.5 animate-spin" /> : <ArrowUp className="size-3.5" />}Enviar</Button>
      </div>
    </form>
  </aside>
}

function buildAssistantPageContext(): AssistantPageContext {
  const pathname = window.location.pathname.slice(0, 240)
  const params = new URLSearchParams(window.location.search)
  const focus = PAGE_CONTEXT_KEYS.flatMap((key) => {
    const value = params.get(key)?.trim()
    return value ? [{ key, value: value.slice(0, 160) }] : []
  }).slice(0, 6)

  if (pathname.startsWith("/marca/") && !focus.some((item) => item.key === "brandId")) {
    const brandId = decodeURIComponent(pathname.split("/")[2] ?? "").trim().slice(0, 160)
    if (brandId) focus.push({ key: "brandId", value: brandId })
  }

  return {
    pathname,
    workspace: getWorkspaceLabel(pathname),
    focus,
  }
}

function getWorkspaceLabel(pathname: string) {
  if (pathname.startsWith("/oportunidades")) return "Oportunidades"
  if (pathname.startsWith("/monitorear/situaciones")) return "Situaciones competitivas"
  if (pathname.startsWith("/monitorear/hipotesis")) return "Hipótesis competitivas"
  if (pathname.startsWith("/monitorear")) return "Monitoreo"
  if (pathname.startsWith("/marca/")) return "Marca"
  if (pathname.startsWith("/patentes")) return "Patentes"
  if (pathname.startsWith("/tecnologias")) return "Tecnologías"
  if (pathname.startsWith("/portfolio")) return "Portfolio"
  if (pathname.startsWith("/reportes")) return "Reportes"
  if (pathname.startsWith("/fuentes")) return "Fuentes"
  if (pathname.startsWith("/investigar")) return "Investigación"
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/panel")) return "Resumen ejecutivo"
  return "Workspace VIDENTIA"
}

function formatDueDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "sin fecha"
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", year: "numeric" }).format(date)
}
