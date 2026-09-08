export type AssistantExecutionMode = "direct" | "canonical_lookup" | "agentic_research"

export type AssistantExecutionPolicy = {
  mode: AssistantExecutionMode
  reason: "router_disabled" | "explicit_action_or_research" | "general_concept" | "canonical_context_available" | "canonical_context_unavailable"
  maxAgentSteps: 0 | 8
  requiresFreshExternalEvidence: boolean
  canonicalContextAvailable: boolean
}

type ClassifyAssistantExecutionInput = {
  latestUserMessage: string
  pathname?: string
  hasPageFocus?: boolean
  hasJuanContext?: boolean
  hasCompetitiveContext?: boolean
  routerEnabled?: boolean
}

const ACTION_OR_RESEARCH = /(?:\b(?:busca|buscar|investiga|investigar|investigue|corrobora|corroborar|contrasta|contrast[aá]|valida externamente|validar externamente|revisa en la web|web|noticias?|papers?|literatura|evidencia acad[eé]mica|fuentes? externas?)\b|(?:genera|generar|crea|crear|prop[oó]n|proponer|recomienda|recomendar|prioriza|priorizar).{0,40}\b(?:acci[oó]n|acciones|experimento|experimentos|pr[oó]ximo paso|pr[oó]ximos pasos)\b|\b(?:lanzando|contratando|integrando|comercializando|market entry|product launch)\b)/i

const GENERAL_CONCEPT = /^(?:\s*[¿?]?\s*)?(?:qu[eé]\s+(?:es|significa|son)|define|defin[eí]|explica\s+(?:qu[eé]\s+es|el concepto de|la diferencia entre)|expl[ií]came\s+(?:qu[eé]\s+es|el concepto de|la diferencia entre)|cu[aá]l\s+es\s+la\s+diferencia\s+entre|diferencia\s+entre|c[oó]mo\s+funciona)\b/i

const CONTEXT_DEPENDENT = /\b(?:esto|esta pantalla|ac[aá]|aqu[ií]|lo que (?:veo|estoy viendo)|esta marca|este competidor|esta oportunidad|esta hip[oó]tesis|mi espacio|mis prioridades|mi marca|mis marcas|mi patente|mis patentes|actual|actualmente|hoy|estado|[uú]ltim[oa]s?|requiere mi atenci[oó]n)\b/i

export function classifyAssistantExecution(input: ClassifyAssistantExecutionInput): AssistantExecutionPolicy {
  const routerEnabled = input.routerEnabled !== false
  const latestUserMessage = input.latestUserMessage.trim()
  const canonicalContextAvailable = Boolean(input.hasJuanContext || input.hasCompetitiveContext)

  if (!routerEnabled) {
    return {
      mode: "agentic_research",
      reason: "router_disabled",
      maxAgentSteps: 8,
      requiresFreshExternalEvidence: false,
      canonicalContextAvailable,
    }
  }

  if (ACTION_OR_RESEARCH.test(latestUserMessage)) {
    return {
      mode: "agentic_research",
      reason: "explicit_action_or_research",
      maxAgentSteps: 8,
      requiresFreshExternalEvidence: true,
      canonicalContextAvailable,
    }
  }

  const hasContextDependency = Boolean(input.hasPageFocus) || CONTEXT_DEPENDENT.test(latestUserMessage)
  if (GENERAL_CONCEPT.test(latestUserMessage) && !hasContextDependency) {
    return {
      mode: "direct",
      reason: "general_concept",
      maxAgentSteps: 0,
      requiresFreshExternalEvidence: false,
      canonicalContextAvailable,
    }
  }

  if (canonicalContextAvailable) {
    return {
      mode: "canonical_lookup",
      reason: "canonical_context_available",
      maxAgentSteps: 0,
      requiresFreshExternalEvidence: false,
      canonicalContextAvailable: true,
    }
  }

  return {
    mode: "agentic_research",
    reason: "canonical_context_unavailable",
    maxAgentSteps: 8,
    requiresFreshExternalEvidence: false,
    canonicalContextAvailable: false,
  }
}
