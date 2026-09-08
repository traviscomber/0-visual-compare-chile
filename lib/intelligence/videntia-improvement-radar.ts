import type { AssistantExecutionMetricsSummary } from "@/lib/intelligence/assistant-execution-metrics"
import type { loadAssistantJuanWorkspace } from "@/lib/intelligence/assistant-juan-workspace"

type JuanWorkspaceSnapshot = Awaited<ReturnType<typeof loadAssistantJuanWorkspace>>

export type VidentiaImprovementPriority = "alta" | "media" | "baja"
export type VidentiaImprovementConfidence = "alta" | "media" | "baja"
export type VidentiaImprovementSourceKind = "canonical_internal" | "product_observability"

export type VidentiaImprovementCandidate = {
  id: string
  priority: VidentiaImprovementPriority
  confidence: VidentiaImprovementConfidence
  sourceKind: VidentiaImprovementSourceKind
  finding: string
  proposal: string
  expectedImpact: string
  validation: string
  source: string
  humanDecisionRequired: true
  convictionDelta: 0
}

export type VidentiaImprovementRadar = {
  generatedAt: string
  observedSignalCount: number
  candidates: VidentiaImprovementCandidate[]
  boundary: string
}

const PRIORITY_ORDER: Record<VidentiaImprovementPriority, number> = { alta: 0, media: 1, baja: 2 }

export function buildVidentiaImprovementRadar(snapshot: JuanWorkspaceSnapshot, assistant?: AssistantExecutionMetricsSummary): VidentiaImprovementRadar {
  const candidates: VidentiaImprovementCandidate[] = []
  const summary = snapshot.summary

  if (summary.pendingDecisions > 0) {
    candidates.push(candidate({
      id: "decision-cycle",
      priority: "alta",
      confidence: "alta",
      finding: `${summary.pendingDecisions} decisión${summary.pendingDecisions === 1 ? "" : "es"} ya superó el umbral de evidencia y sigue pendiente de revisión humana.`,
      proposal: "Hacer visible, por decisión, la brecha exacta que queda por revisar y una síntesis de qué evidencia cambió desde la última lectura.",
      expectedImpact: "Reducir ida y vuelta entre evidencia y decisión sin automatizar la aprobación.",
      validation: "Medir tiempo desde ready_for_n3uralia hasta decisión humana y número de reaperturas por evidencia faltante.",
      source: "intelligence_project_handoffs · ready_for_n3uralia",
    }))
  }

  if (summary.overdueActions > 0) {
    candidates.push(candidate({
      id: "action-hygiene",
      priority: "alta",
      confidence: "alta",
      finding: `${summary.overdueActions} acción${summary.overdueActions === 1 ? "" : "es"} vencida${summary.overdueActions === 1 ? "" : "s"} permanece${summary.overdueActions === 1 ? "" : "n"} abierta${summary.overdueActions === 1 ? "" : "s"}.`,
      proposal: "Añadir aging, responsable, bloqueo y próxima acción explícita en la cola ejecutiva; separar ruido de QA de trabajo operacional real.",
      expectedImpact: "Menos deuda operacional y una bandeja de atención más confiable.",
      validation: "Comparar acciones vencidas, mediana de antigüedad y porcentaje sin responsable antes y después del cambio.",
      source: "case_actions · due_at vencido",
    }))
  }

  if (summary.researchingHandoffs > 0) {
    candidates.push(candidate({
      id: "evidence-closure",
      priority: "media",
      confidence: "alta",
      finding: `${summary.researchingHandoffs} línea${summary.researchingHandoffs === 1 ? "" : "s"} de investigación sigue${summary.researchingHandoffs === 1 ? "" : "n"} abierta${summary.researchingHandoffs === 1 ? "" : "s"} sin superar el umbral de decisión.`,
      proposal: "Agrupar los evidence gaps por familia —mercado, papers, patentes, Chile, validación técnica— y proponer el siguiente chequeo independiente de mayor valor.",
      expectedImpact: "Cerrar investigación con menos búsquedas redundantes y preservar unknown como estado válido.",
      validation: "Medir cuántas investigaciones cierran una brecha explícita por ciclo y cuántas quedan abiertas sin nueva evidencia.",
      source: "intelligence_project_handoffs · paused + evidence_gaps",
    }))
  }

  const acceptedProducts = snapshot.acceptedProducts
  const githubGaps = acceptedProducts.filter(item => item.repoActivity?.status !== "ok")
  if (githubGaps.length > 0) {
    candidates.push(candidate({
      id: "github-freshness",
      priority: "media",
      confidence: "alta",
      finding: `${githubGaps.length}/${acceptedProducts.length} producto${acceptedProducts.length === 1 ? "" : "s"} aprobado${acceptedProducts.length === 1 ? "" : "s"} no tiene${githubGaps.length === 1 ? "" : "n"} actividad GitHub observada en estado ok.`,
      proposal: "Mostrar cobertura y frescura del contexto de ejecución por producto, con estado degradado explícito cuando el sync no sea confiable.",
      expectedImpact: "Recomendaciones de ejecución mejor contextualizadas sin confundir actividad de desarrollo con evidencia de mercado.",
      validation: "Medir cobertura de repos observados, edad del último sync y frecuencia de estados degradados.",
      source: "acceptedProducts.repoActivity · contexto institucional",
    }))
  }

  if (summary.subsectionNewPapersObserved > 0) {
    candidates.push(candidate({
      id: "paper-review-loop",
      priority: "media",
      confidence: "media",
      finding: `${summary.subsectionNewPapersObserved} paper${summary.subsectionNewPapersObserved === 1 ? "" : "s"} nuevo${summary.subsectionNewPapersObserved === 1 ? "" : "s"} apareció${summary.subsectionNewPapersObserved === 1 ? "" : "n"} en subsecciones activas de ${summary.subsectionProductsWithFreshPapers} producto${summary.subsectionProductsWithFreshPapers === 1 ? "" : "s"}.`,
      proposal: "Crear una cola de revisión técnica que compare cada paper nuevo con la implementación actual y sólo promueva evidencia después de corroboración independiente.",
      expectedImpact: "Convertir discovery académico en experimentos útiles sin inflar conviction por novedad bibliográfica.",
      validation: "Medir papers revisados, experimentos derivados y porcentaje promovido a evidencia canónica tras revisión independiente.",
      source: "subsectionResearch.delta · discovery_only · conviction_delta=0",
    }))
  }

  const direct = assistant?.modes.find(item => item.mode === "direct")
  const canonical = assistant?.modes.find(item => item.mode === "canonical_lookup")
  const agentic = assistant?.modes.find(item => item.mode === "agentic_research")
  const assistantFinding = assistant && assistant.sampleSize > 0
    ? `El Assistant ya tiene ${assistant.sampleSize} ejecuciones observadas en ${assistant.windowDays}d: DIRECT ${direct?.requests ?? 0}, CANONICAL_LOOKUP ${canonical?.requests ?? 0}, AGENTIC_RESEARCH ${agentic?.requests ?? 0}; p50 ${formatMs(assistant.p50DurationMs)}, p95 ${formatMs(assistant.p95DurationMs)}, ${formatNumber(assistant.averageToolCalls)} tool calls promedio y ${formatNumber(assistant.averageTotalTokens)} tokens promedio cuando usage está disponible.`
    : "El Assistant ya enruta DIRECT / CANONICAL_LOOKUP / AGENTIC_RESEARCH, pero todavía no existe una muestra persistida suficiente para evaluar su efectividad en producción."

  candidates.push(candidate({
    id: "assistant-effectiveness",
    priority: "media",
    confidence: assistant && assistant.sampleSize >= 5 ? "alta" : "media",
    sourceKind: "product_observability",
    finding: assistantFinding,
    proposal: "Comparar por modo la latencia p50/p95, tool calls y tokens; optimizar sólo después de una baseline estable y sin degradar grounding ni seguridad.",
    expectedImpact: "Saber dónde VIDENTIA está gastando complejidad de más y reducir latencia/costo con evidencia real del propio producto.",
    validation: "Fijar baseline con al menos 5 ejecuciones y comparar la misma familia de métricas después de la implementación; medir no equivale a declarar éxito.",
    source: "intelligence_assistant_execution_metrics · observabilidad privada sin prompts ni rutas crudas",
  }))

  const sorted = candidates
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    .slice(0, 6)

  return {
    generatedAt: snapshot.generatedAt,
    observedSignalCount: sorted.filter(item => item.sourceKind === "canonical_internal").length,
    candidates: sorted,
    boundary: "Este radar mejora VIDENTIA; no puntúa oportunidades, no modifica conviction y no ejecuta cambios automáticamente. GitHub, telemetría y operación interna son señales de producto, no evidencia del mercado.",
  }
}

function candidate(input: Omit<VidentiaImprovementCandidate, "humanDecisionRequired" | "convictionDelta" | "sourceKind"> & { sourceKind?: VidentiaImprovementSourceKind }): VidentiaImprovementCandidate {
  return {
    ...input,
    sourceKind: input.sourceKind ?? "canonical_internal",
    humanDecisionRequired: true,
    convictionDelta: 0,
  }
}

function formatMs(value: number | null | undefined) { return typeof value === "number" ? `${Math.round(value)} ms` : "n/d" }
function formatNumber(value: number | null | undefined) { return typeof value === "number" ? String(Math.round(value * 100) / 100) : "n/d" }
