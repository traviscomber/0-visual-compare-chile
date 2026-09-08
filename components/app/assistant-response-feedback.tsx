"use client"

import { useState } from "react"
import { Check, Loader2 } from "lucide-react"

type Outcome = "resolved" | "partial" | "not_resolved"
type IssueReason = "incorrect" | "missing_evidence" | "incomplete" | "misunderstood" | "needed_followup" | "other"

type FeedbackState = {
  outcome: Outcome | null
  issueReason: IssueReason | null
  status: "idle" | "saving" | "saved" | "error"
}

const OUTCOMES: Array<{ value: Outcome; label: string }> = [
  { value: "resolved", label: "Sí" },
  { value: "partial", label: "Parcial" },
  { value: "not_resolved", label: "No" },
]

const REASONS: Array<{ value: IssueReason; label: string }> = [
  { value: "missing_evidence", label: "Faltó evidencia" },
  { value: "incomplete", label: "Incompleta" },
  { value: "incorrect", label: "Incorrecta" },
  { value: "misunderstood", label: "No entendió" },
  { value: "needed_followup", label: "Necesité repreguntar" },
  { value: "other", label: "Otro" },
]

export function AssistantResponseFeedback({ executionId }: { executionId: string }) {
  const [state, setState] = useState<FeedbackState>({ outcome: null, issueReason: null, status: "idle" })

  async function save(outcome: Outcome, issueReason: IssueReason | null) {
    setState({ outcome, issueReason, status: "saving" })
    try {
      const response = await fetch("/api/assistant/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ executionId, outcome, issueReason }),
      })
      if (!response.ok) throw new Error("feedback_failed")
      setState({ outcome, issueReason, status: "saved" })
    } catch {
      setState({ outcome, issueReason, status: "error" })
    }
  }

  const needsReason = state.outcome === "partial" || state.outcome === "not_resolved"

  return <div className="mt-3 border-t border-border/60 pt-2.5" aria-label="Evaluar respuesta del Asistente">
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground">¿Resolvió tu consulta?</span>
      {OUTCOMES.map((option) => <button
        key={option.value}
        type="button"
        aria-pressed={state.outcome === option.value}
        disabled={state.status === "saving"}
        onClick={() => void save(option.value, null)}
        className={`min-h-7 border px-2 text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6] ${state.outcome === option.value ? "border-[#4D746B] bg-[#132E34] text-[#DCE8E2]" : "border-border/70 text-muted-foreground hover:border-[#355C55] hover:text-[#C8D4CD]"}`}
      >{option.label}</button>)}
      {state.status === "saving" ? <Loader2 className="ml-1 size-3 animate-spin text-[#96B5A6]" /> : null}
      {state.status === "saved" && !needsReason ? <Check className="ml-1 size-3 text-[#96B5A6]" aria-label="Feedback guardado" /> : null}
    </div>

    {needsReason ? <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Motivo opcional">
      {REASONS.map((reason) => <button
        key={reason.value}
        type="button"
        aria-pressed={state.issueReason === reason.value}
        disabled={state.status === "saving"}
        onClick={() => state.outcome ? void save(state.outcome, reason.value) : undefined}
        className={`min-h-7 border px-2 text-[9px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6] ${state.issueReason === reason.value ? "border-[#4D746B] bg-[#10262B] text-[#C8D4CD]" : "border-border/60 text-muted-foreground hover:border-[#355C55] hover:text-[#C8D4CD]"}`}
      >{reason.label}</button>)}
      {state.status === "saved" && state.issueReason ? <span className="inline-flex items-center gap-1 text-[9px] text-[#96B5A6]"><Check className="size-3" />Guardado</span> : null}
    </div> : null}

    {state.status === "error" ? <p role="alert" className="mt-1.5 text-[9px] leading-4 text-[#D6A46F]">No pudimos guardar esta evaluación. Puedes reintentar.</p> : null}
    <p className="mt-1.5 text-[8px] leading-3 text-[#667572]">Se guarda sólo la evaluación estructurada de esta respuesta; no el texto de la conversación.</p>
  </div>
}
