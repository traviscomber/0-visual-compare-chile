import { buildCaseIntelligence, type CaseContextType, type CaseItemType, type CaseStatus } from "@/lib/cases/intelligence"

export type DecisionBriefInput = {
  caseRow: {
    title: string
    status: CaseStatus
    priority: "low" | "normal" | "high"
    context_type: CaseContextType | string
    context_query: string | null
    decision_summary: string | null
    notes: string | null
    last_reviewed_at: string | null
    created_at: string
    updated_at: string
  }
  items: Array<{
    item_type: CaseItemType
    title: string
    metadata?: Record<string, unknown>
    created_at: string
  }>
  events: Array<{
    event_type: string
    title: string
    occurred_at: string
  }>
}

export type DecisionBrief = {
  question: string
  executiveSummary: string
  evidence: Array<{ type: CaseItemType; title: string; subtitle: string | null; createdAt: string }>
  recentChanges: string[]
  risksAndGaps: string[]
  decision: string
  nextSteps: string[]
  readiness: "early" | "developing" | "decision-ready" | "decided"
}

function contextQuestion(contextType: string, contextQuery: string | null) {
  const query = contextQuery?.trim()
  if (contextType === "brand") return query ? `¿Conviene avanzar con la marca “${query}” y bajo qué condiciones?` : "¿Conviene avanzar con esta marca y bajo qué condiciones?"
  if (contextType === "company") return query ? `¿Qué implica la actividad de ${query} para esta decisión?` : "¿Qué implica la actividad de esta empresa para esta decisión?"
  if (contextType === "technology") return query ? `¿Qué debemos decidir respecto de la tecnología ${query}?` : "¿Qué debemos decidir respecto de esta tecnología?"
  return query ? `¿Qué decisión debemos tomar respecto de ${query}?` : "¿Qué decisión concreta debe resolver este caso?"
}

export function buildDecisionBrief(input: DecisionBriefInput): DecisionBrief {
  const intelligence = buildCaseIntelligence({
    status: input.caseRow.status,
    contextType: input.caseRow.context_type,
    decisionSummary: input.caseRow.decision_summary,
    notes: input.caseRow.notes,
    lastReviewedAt: input.caseRow.last_reviewed_at,
    items: input.items,
  })

  const evidence = [...input.items]
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, 8)
    .map((item) => ({
      type: item.item_type,
      title: item.title,
      subtitle: typeof item.metadata?.subtitle === "string" ? item.metadata.subtitle : null,
      createdAt: item.created_at,
    }))

  const recentEvents = [...input.events]
    .sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at))
    .slice(0, 5)

  const recentChanges = recentEvents.length
    ? recentEvents.map((event) => `${event.title}`)
    : intelligence.changed

  const evidenceCount = input.items.length
  const executiveSummary = intelligence.readiness === "decided"
    ? `El caso tiene una decisión registrada y ${evidenceCount} evidencia${evidenceCount === 1 ? "" : "s"} vinculada${evidenceCount === 1 ? "" : "s"}. ${intelligence.newEvidenceCount > 0 ? `Hay ${intelligence.newEvidenceCount} evidencia${intelligence.newEvidenceCount === 1 ? "" : "s"} nueva${intelligence.newEvidenceCount === 1 ? "" : "s"} desde la última revisión.` : "No hay evidencia nueva pendiente desde la última revisión."}`
    : `El caso está ${intelligence.readiness === "decision-ready" ? "listo para una decisión" : intelligence.readiness === "developing" ? "en desarrollo" : "en etapa temprana"} y reúne ${evidenceCount} evidencia${evidenceCount === 1 ? "" : "s"}. ${intelligence.pendingDecision}`

  const risksAndGaps = intelligence.missing.filter((item) => !item.startsWith("No hay brechas"))
  if (!risksAndGaps.length) risksAndGaps.push("No se detectan brechas estructurales evidentes con la información vinculada actualmente.")

  const nextSteps = [intelligence.pendingDecision]
  if (intelligence.newEvidenceCount > 0) nextSteps.push("Revisar la evidencia nueva y confirmar si cambia la lectura del caso.")
  if (!input.caseRow.last_reviewed_at) nextSteps.push("Registrar un primer checkpoint de revisión para separar evidencia actual de cambios futuros.")

  return {
    question: contextQuestion(input.caseRow.context_type, input.caseRow.context_query),
    executiveSummary,
    evidence,
    recentChanges,
    risksAndGaps,
    decision: input.caseRow.decision_summary?.trim() || "Aún no se ha registrado una decisión final.",
    nextSteps: Array.from(new Set(nextSteps)),
    readiness: intelligence.readiness,
  }
}
