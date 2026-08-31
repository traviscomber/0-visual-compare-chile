const TECHNOLOGY_STOPWORDS = new Set([
  "a", "al", "con", "de", "del", "el", "en", "la", "las", "los", "para", "por", "un", "una", "y",
])

export type CorroborationConfidence = "media" | "baja" | "insuficiente"
export type CorroborationStatus = "corroborada" | "parcial" | "sin_senal" | "insuficiente"
export type ResearchAxisStatus = "actividad" | "sin_actividad" | "no_disponible"
export type PatentAxisStatus = "actividad_reciente" | "actividad_historica" | "sin_senal" | "no_disponible"

export function normalizeComparableTechnologyText(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CL")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function meaningfulTechnologyTerms(input: string) {
  return normalizeComparableTechnologyText(input)
    .split(" ")
    .filter(term => term.length >= 3 && !TECHNOLOGY_STOPWORDS.has(term))
}

export function isTechnologyTitleRelevant(query: string, title: string) {
  const terms = [...new Set(meaningfulTechnologyTerms(query))]
  if (!terms.length) return false
  const normalizedTitle = ` ${normalizeComparableTechnologyText(title)} `
  const matched = terms.filter(term => normalizedTitle.includes(` ${term} `)).length

  // Executive technology evidence is precision-first. Short technology names need every
  // meaningful term in the title; longer names may tolerate one contextual omission.
  if (terms.length <= 3) return matched === terms.length
  return matched >= Math.ceil(terms.length * 0.75)
}

export function buildTechnologyCorroboration(input: {
  researchAvailable: boolean
  currentPublications: number | null
  researchTrend: "acelerando" | "estable" | "desacelerando" | "sin_base" | "no_disponible"
  patentsAvailable: boolean
  recentPatentMatches: number
  historicalPatentMatches: number
}) {
  const researchStatus: ResearchAxisStatus = !input.researchAvailable
    ? "no_disponible"
    : (input.currentPublications ?? 0) > 0
      ? "actividad"
      : "sin_actividad"

  const patentStatus: PatentAxisStatus = !input.patentsAvailable
    ? "no_disponible"
    : input.recentPatentMatches > 0
      ? "actividad_reciente"
      : input.historicalPatentMatches > 0
        ? "actividad_historica"
        : "sin_senal"

  const researchConfirmsCurrentActivity = researchStatus === "actividad"
  const patentsConfirmCurrentActivity = patentStatus === "actividad_reciente"
  const availableAxes = Number(input.researchAvailable) + Number(input.patentsAvailable)
  const confirmingAxes = Number(researchConfirmsCurrentActivity) + Number(patentsConfirmCurrentActivity)

  let status: CorroborationStatus
  let confidence: CorroborationConfidence
  let conclusion: string

  if (availableAxes < 2) {
    status = "insuficiente"
    confidence = "insuficiente"
    conclusion = "Falta una de las dos fuentes duras necesarias para corroborar actividad tecnológica reciente."
  } else if (researchConfirmsCurrentActivity && patentsConfirmCurrentActivity) {
    status = "corroborada"
    // V1 deliberately caps confidence at medium: two independent axes are useful, but
    // commercial demand and regulation are not yet part of the score.
    confidence = "media"
    conclusion = "Hay actividad científica y protección patentaria reciente en la misma tecnología. La señal está corroborada por dos familias de evidencia independientes."
  } else if (researchConfirmsCurrentActivity || patentsConfirmCurrentActivity) {
    status = "parcial"
    confidence = "baja"
    conclusion = patentStatus === "actividad_historica" && researchConfirmsCurrentActivity
      ? "Hay actividad científica reciente y protección patentaria histórica, pero no una coincidencia patentaria reciente dentro de la ventana observada."
      : "Sólo uno de los dos ejes duros muestra actividad reciente. VIDENTIA conserva la señal como parcial, no como tendencia corroborada."
  } else {
    status = "sin_senal"
    confidence = "insuficiente"
    conclusion = patentStatus === "actividad_historica"
      ? "No hay actividad científica reciente en la ventana y las coincidencias patentarias fuertes son históricas."
      : "Ninguno de los dos ejes duros muestra actividad reciente suficiente para sostener una conclusión."
  }

  return {
    status,
    confidence,
    confirming_axes: confirmingAxes,
    available_axes: availableAxes,
    axes: {
      research: {
        available: input.researchAvailable,
        status: researchStatus,
        direction: input.researchAvailable ? input.researchTrend : "no_disponible",
        current_count: input.currentPublications,
      },
      patents: {
        available: input.patentsAvailable,
        status: patentStatus,
        recent_matches: input.recentPatentMatches,
        historical_matches: input.historicalPatentMatches,
      },
    },
    conclusion,
    scope: "Confianza limitada a investigación global (OpenAlex) y coincidencias de alta precisión en el corpus de patentes INAPI Chile. Demanda comercial, inversión y regulación aún no se ponderan.",
  }
}
