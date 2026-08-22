export type CaseStatus = "open" | "review" | "decided" | "archived"
export type CaseContextType = "general" | "brand" | "company" | "technology"
export type CaseItemType = "comparison" | "search" | "watch" | "alert" | "research"

export type CaseIntelligenceInput = {
  status: CaseStatus
  contextType: CaseContextType | string
  decisionSummary: string | null
  notes: string | null
  lastReviewedAt: string | null
  items: Array<{ item_type: CaseItemType; title: string; created_at: string; metadata?: Record<string, unknown> }>
}

export type CaseIntelligence = {
  known: string[]
  missing: string[]
  changed: string[]
  pendingDecision: string
  readiness: "early" | "developing" | "decision-ready" | "decided"
  newEvidenceCount: number
  counts: Record<CaseItemType, number>
}

const EMPTY_COUNTS: Record<CaseItemType, number> = {
  comparison: 0,
  search: 0,
  watch: 0,
  alert: 0,
  research: 0,
}

function itemLabel(type: CaseItemType, count: number) {
  const labels: Record<CaseItemType, [string, string]> = {
    comparison: ["evaluación", "evaluaciones"],
    search: ["búsqueda", "búsquedas"],
    watch: ["vigilancia", "vigilancias"],
    alert: ["señal", "señales"],
    research: ["investigación", "investigaciones"],
  }
  return `${count} ${count === 1 ? labels[type][0] : labels[type][1]}`
}

export function buildCaseIntelligence(input: CaseIntelligenceInput): CaseIntelligence {
  const counts = { ...EMPTY_COUNTS }
  for (const item of input.items) counts[item.item_type] += 1

  const known: string[] = []
  if (counts.comparison) known.push(`${itemLabel("comparison", counts.comparison)} aportan evidencia de riesgo o similitud.`)
  if (counts.research || counts.search) known.push(`${itemLabel("research", counts.research)} y ${itemLabel("search", counts.search)} documentan el panorama investigado.`)
  if (counts.watch) known.push(`${itemLabel("watch", counts.watch)} mantienen seguimiento activo del contexto.`)
  if (counts.alert) known.push(`${itemLabel("alert", counts.alert)} registran cambios detectados por monitoreo.`)
  if (input.decisionSummary?.trim()) known.push("El caso ya contiene una conclusión explícita registrada por el usuario.")
  if (!known.length) known.push("El caso todavía no tiene evidencia suficiente para formar una lectura útil.")

  const missing: string[] = []
  const hasResearch = counts.research + counts.search > 0
  const hasMonitoring = counts.watch + counts.alert > 0
  if (input.contextType === "brand" && !counts.comparison) missing.push("Falta una evaluación de marca para sostener el nivel de riesgo.")
  if (!hasResearch) missing.push("Falta investigación de antecedentes o contexto externo.")
  if ((input.contextType === "company" || input.contextType === "technology") && !hasMonitoring) missing.push("Falta una vigilancia o señal que mantenga actualizado el caso.")
  if (input.status !== "decided" && !input.decisionSummary?.trim()) missing.push("Falta registrar la decisión o criterio de cierre.")
  if (!input.notes?.trim() && input.status !== "decided") missing.push("Conviene registrar hipótesis, pendientes o criterios de revisión.")
  if (!missing.length) missing.push("No hay brechas estructurales evidentes con la información actual.")

  const reviewedAt = input.lastReviewedAt ? Date.parse(input.lastReviewedAt) : Number.NaN
  const newItems = Number.isNaN(reviewedAt)
    ? input.items
    : input.items.filter((item) => Date.parse(item.created_at) > reviewedAt)

  const changed: string[] = []
  if (newItems.length) {
    const newCounts = { ...EMPTY_COUNTS }
    for (const item of newItems) newCounts[item.item_type] += 1
    const summary = (Object.keys(newCounts) as CaseItemType[])
      .filter((type) => newCounts[type] > 0)
      .map((type) => itemLabel(type, newCounts[type]))
      .join(", ")
    changed.push(`${newItems.length} evidencias nuevas desde la última revisión: ${summary}.`)
    const latest = [...newItems].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0]
    if (latest) changed.push(`Lo más reciente es “${latest.title}”.`)
  } else if (input.lastReviewedAt) {
    changed.push("No hay evidencia nueva desde la última revisión.")
  } else {
    changed.push("Este caso aún no ha sido marcado como revisado; toda la evidencia actual se considera nueva.")
  }

  const evidenceBreadth = [counts.comparison > 0, hasResearch, hasMonitoring].filter(Boolean).length
  let readiness: CaseIntelligence["readiness"] = "early"
  if (input.status === "decided" || input.decisionSummary?.trim()) readiness = "decided"
  else if (evidenceBreadth >= 3 && input.items.length >= 3) readiness = "decision-ready"
  else if (input.items.length >= 2) readiness = "developing"

  let pendingDecision = "Definir qué pregunta concreta debe resolver este caso antes de seguir agregando evidencia."
  if (readiness === "decision-ready") pendingDecision = "La evidencia ya cubre evaluación, investigación y monitoreo. Corresponde registrar una decisión o pasar el caso a revisión final."
  else if (readiness === "developing") pendingDecision = `Cerrar las brechas principales antes de decidir: ${missing[0] ?? "completar evidencia"}`
  else if (readiness === "decided") pendingDecision = newItems.length ? "La decisión existe, pero llegó evidencia nueva. Conviene confirmar si la conclusión sigue vigente." : "La decisión está registrada y no hay cambios pendientes desde la última revisión."

  return { known, missing, changed, pendingDecision, readiness, newEvidenceCount: newItems.length, counts }
}
