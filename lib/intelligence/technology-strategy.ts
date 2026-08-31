export type TechnologyMaturityLevel = "insufficient" | "exploratory" | "emerging" | "scaling" | "established"
export type TechnologyAdoptionLevel = "insufficient" | "early" | "moderate" | "strong"

type Publication = {
  title: string
  date: string | null
  institutions?: string[]
  url: string
}

type Patent = {
  title: string
  applicants: string | null
  filingDate: string | null
  sourceUrl: string | null
  recent: boolean
}

type TechnologySignalsLike = {
  query: string
  period_days: number
  momentum: {
    available: boolean
    current_publications: number | null
    trend: "acelerando" | "estable" | "desacelerando" | "sin_base" | "no_disponible"
  }
  patent_signal: {
    available: boolean
    recent_matches: number
    selected_matches: number
    distinct_applicants: number
  }
  evidence: {
    publications: Publication[]
    patents: Patent[]
  }
}

export function buildTechnologyStrategy(signals: TechnologySignalsLike) {
  const institutions = aggregateInstitutions(signals.evidence.publications)
  const patentActors = aggregatePatentActors(signals.evidence.patents)
  const maturity = maturitySignal(signals, institutions.length)
  const adoption = adoptionSignal(signals, institutions.length)
  const observedActors = observedActorsSignal(patentActors, institutions)
  const competitiveMoves = competitiveMoveSignal(signals.evidence.patents, institutions)

  return {
    scope: "Lectura estratégica derivada únicamente de evidencia científica y de propiedad industrial observada. No infiere intención corporativa ni adopción comercial real.",
    maturity,
    adoption,
    emerging_players: {
      label: "Actores emergentes observados",
      caveat: "Emergente significa visible en la evidencia reciente de esta consulta; no demuestra que el actor sea nuevo en el mercado.",
      actors: observedActors,
    },
    competitive_moves: {
      label: "Movimientos competitivos observados",
      caveat: "Un filing o una publicación es actividad observable, no una declaración de estrategia o intención futura.",
      moves: competitiveMoves,
    },
  }
}

function maturitySignal(signals: TechnologySignalsLike, institutionCount: number) {
  const research = signals.momentum.current_publications ?? 0
  const historicalPatents = signals.patent_signal.selected_matches
  const recentPatents = signals.patent_signal.recent_matches
  const applicants = signals.patent_signal.distinct_applicants
  const bothAvailable = signals.momentum.available && signals.patent_signal.available

  if (!signals.momentum.available && !signals.patent_signal.available) {
    return {
      level: "insufficient" as const,
      label: "Evidencia insuficiente",
      confidence: "insuficiente" as const,
      basis: "No hay dos ejes observables disponibles para situar la madurez de evidencia.",
      factors: [],
    }
  }

  let level: Exclude<TechnologyMaturityLevel, "insufficient"> = "exploratory"
  if (historicalPatents >= 8 && applicants >= 4 && research >= 20) level = "established"
  else if (recentPatents >= 2 && applicants >= 2 && research >= 10) level = "scaling"
  else if (recentPatents > 0 || research >= 5 || signals.momentum.trend === "acelerando") level = "emerging"

  const labels = {
    exploratory: "Exploratoria",
    emerging: "Emergente",
    scaling: "En expansión",
    established: "Evidencia consolidada",
  }

  return {
    level,
    label: labels[level],
    confidence: bothAvailable ? "media" as const : "baja" as const,
    basis: "Clasificación de madurez de evidencia, no de madurez comercial. Combina volumen de investigación, actividad de patentes y diversidad de actores observados.",
    factors: [
      `${research} publicaciones en el período`,
      `${recentPatents} filings recientes entre ${historicalPatents} antecedentes de patente seleccionados`,
      `${applicants} solicitantes de patente distintos`,
      `${institutionCount} instituciones visibles en la muestra científica`,
    ],
  }
}

function adoptionSignal(signals: TechnologySignalsLike, institutionCount: number) {
  if (!signals.momentum.available && !signals.patent_signal.available) {
    return {
      level: "insufficient" as const,
      label: "Sin proxy suficiente",
      basis: "No hay evidencia suficiente para construir un proxy de adopción basado en investigación e IP.",
      indicators: [],
    }
  }

  const recentPatents = signals.patent_signal.recent_matches
  const applicants = signals.patent_signal.distinct_applicants
  let level: Exclude<TechnologyAdoptionLevel, "insufficient"> = "early"
  if (recentPatents >= 3 && applicants >= 3 && institutionCount >= 3) level = "strong"
  else if (recentPatents >= 1 || institutionCount >= 3) level = "moderate"

  const labels = {
    early: "Proxy temprano",
    moderate: "Proxy moderado",
    strong: "Proxy fuerte",
  }

  return {
    level,
    label: labels[level],
    basis: "Proxy de adopción basado en difusión científica y actividad de propiedad industrial. No equivale a ventas, instalaciones, contratos ni adopción de mercado.",
    indicators: [
      recentPatents > 0 ? `${recentPatents} filings recientes observados` : "Sin filing reciente confirmado en la muestra",
      applicants > 0 ? `${applicants} solicitantes de patente distintos` : "Sin diversidad de solicitantes verificable",
      institutionCount > 0 ? `${institutionCount} instituciones científicas observadas` : "Sin instituciones identificadas en la muestra",
    ],
  }
}

function observedActorsSignal(patentActors: Array<{ name: string; count: number; recent: number }>, institutions: Array<{ name: string; count: number }>) {
  const patents = patentActors
    .filter(actor => actor.recent > 0)
    .map(actor => ({
      name: actor.name,
      axis: "patents" as const,
      evidence_count: actor.count,
      reason: `${actor.recent} filing(s) recientes observados en la muestra INAPI.`,
    }))
  const research = institutions
    .filter(actor => actor.count >= 2)
    .map(actor => ({
      name: actor.name,
      axis: "research" as const,
      evidence_count: actor.count,
      reason: `${actor.count} publicaciones seleccionadas asociadas a esta institución.`,
    }))

  return [...patents, ...research]
    .sort((a, b) => b.evidence_count - a.evidence_count || a.name.localeCompare(b.name))
    .slice(0, 8)
}

function competitiveMoveSignal(patents: Patent[], institutions: Array<{ name: string; count: number }>) {
  const filings = patents
    .filter(item => item.recent && item.applicants)
    .sort((a, b) => dateScore(b.filingDate) - dateScore(a.filingDate))
    .slice(0, 6)
    .map(item => ({
      actor: cleanActor(item.applicants!) || "Solicitante no normalizado",
      type: "patent_filing" as const,
      observed_at: item.filingDate,
      evidence: item.title,
      source_url: item.sourceUrl,
    }))

  const research = institutions
    .filter(item => item.count >= 3)
    .slice(0, 3)
    .map(item => ({
      actor: item.name,
      type: "research_presence" as const,
      observed_at: null,
      evidence: `${item.count} publicaciones seleccionadas muestran presencia científica repetida en la consulta.`,
      source_url: null,
    }))

  return [...filings, ...research].slice(0, 8)
}

function aggregatePatentActors(patents: Patent[]) {
  const map = new Map<string, { name: string; count: number; recent: number }>()
  for (const patent of patents) {
    const name = patent.applicants ? cleanActor(patent.applicants) : ""
    if (!name) continue
    const key = name.toLocaleLowerCase()
    const current = map.get(key) ?? { name, count: 0, recent: 0 }
    current.count += 1
    if (patent.recent) current.recent += 1
    map.set(key, current)
  }
  return [...map.values()].sort((a, b) => b.recent - a.recent || b.count - a.count || a.name.localeCompare(b.name))
}

function aggregateInstitutions(publications: Publication[]) {
  const map = new Map<string, { name: string; count: number }>()
  for (const publication of publications) {
    for (const institution of publication.institutions ?? []) {
      const name = institution.trim()
      if (!name) continue
      const key = name.toLocaleLowerCase()
      const current = map.get(key) ?? { name, count: 0 }
      current.count += 1
      map.set(key, current)
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

function cleanActor(value: string) {
  return value.replace(/^\s*\([A-Z]{2}\)\s*/i, "").replace(/\s+/g, " ").trim()
}

function dateScore(value: string | null) {
  if (!value) return 0
  const score = new Date(value).getTime()
  return Number.isFinite(score) ? score : 0
}
