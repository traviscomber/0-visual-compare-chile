"use client"

import { useMemo, useState } from "react"
import { ArrowUp, BookOpen, Bot, Loader2, Search, Sparkles } from "lucide-react"
import { OperationalPage, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type ToolTrace = { name: string; label: string; summary: string }
type ChatMessage = { id: string; role: "user" | "assistant"; content: string; trace?: ToolTrace[] }

const STARTERS = [
  "Resume qué requiere mi atención ahora y por qué.",
  "Busca papers recientes sobre agentes autónomos y aplícalos a mi oportunidad más relevante.",
  "¿Qué evidencia falta hoy para mis hipótesis competitivas activas?",
]

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
      }])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "El asistente no pudo completar la orden.")
    } finally {
      setLoading(false)
    }
  }

  return <OperationalPage>
    <section className="border-b border-border/80 py-8">
      <div className="max-w-4xl">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">VIDENTIA / Asistente</p>
        <h1 className="mt-2 text-3xl font-light tracking-[-0.03em] text-[#E7DFCE] sm:text-4xl">Pregunta, investiga y aplica.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Usa tu contexto VIDENTIA, busca papers y aplica la evidencia al objetivo que indiques. Esta versión no cambia estados canónicos automáticamente.</p>
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
        </article>)}
        {loading ? <div className="flex items-center gap-3 py-7 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin text-[#96B5A6]"/>Investigando y cruzando contexto…</div> : null}
        {!messages.length && !loading ? <div className="flex min-h-[260px] items-center justify-center px-6 text-center text-sm leading-6 text-muted-foreground">Pregunta por cualquier información que VIDENTIA te entregue o da una orden concreta de investigación.</div> : null}
      </div>

      {error ? <div role="alert" className="border border-[#D6A46F]/20 bg-[#332C24]/70 p-4 text-sm text-[#E0B987]">{error}</div> : null}

      <form onSubmit={(event) => { event.preventDefault(); void send() }} className="sticky bottom-4 border border-[#35525A] bg-[#091A20] p-3 shadow-2xl">
        <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); if (canSend) void send() } }} rows={3} maxLength={8000} placeholder="Ej: busca papers sobre graph RAG y aplícalos a nuestro monitoreo competitivo" className="w-full resize-none bg-transparent px-2 py-2 text-sm leading-6 text-[#E7DFCE] outline-none placeholder:text-muted-foreground" />
        <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-3">
          <p className="text-[10px] text-muted-foreground">Enter envía · Shift+Enter agrega línea</p>
          <Button type="submit" size="sm" disabled={!canSend}>{loading ? <Loader2 className="size-4 animate-spin"/> : <ArrowUp className="size-4"/>}Enviar</Button>
        </div>
      </form>
    </section>
  </OperationalPage>
}
