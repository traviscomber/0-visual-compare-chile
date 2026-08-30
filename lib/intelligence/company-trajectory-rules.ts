export type TrajectoryAssetType = "patent" | "trademark"
export type TrajectoryState = "emerging" | "accelerating" | "persistent" | "declining" | "experimental" | "stable"

export type TrajectoryActivity = {
  entity_type: TrajectoryAssetType
  filing_date: string | null
  classification_codes: string[]
}

export type TrajectorySignal = {
  code: string
  asset_type: TrajectoryAssetType
  state: TrajectoryState
  windows: [number, number, number, number]
  current: number
  prior: number
  total: number
  active_quarters: number
  momentum: number
  confidence: number
}

export type TrajectoryQuarter = {
  key: "q0" | "q1" | "q2" | "q3"
  label: string
  start: string
  end: string
  patents: number
  trademarks: number
  total: number
}

export type CompanyTrajectory = {
  window_days: 360
  quarters: TrajectoryQuarter[]
  technical: {
    emerging: TrajectorySignal[]
    accelerating: TrajectorySignal[]
    persistent: TrajectorySignal[]
    declining: TrajectorySignal[]
    experimental: TrajectorySignal[]
  }
  commercial: {
    emerging: TrajectorySignal[]
    accelerating: TrajectorySignal[]
    persistent: TrajectorySignal[]
    declining: TrajectorySignal[]
    experimental: TrajectorySignal[]
  }
  direction: {
    headline: string
    observed_fact: string
    interpretation: string
    why_it_matters: string
    confidence: number
    evidence_level: "alta" | "media" | "baja"
    guardrail: string
  } | null
}

const DAY_MS = 86_400_000
const WINDOW_DAYS = 360 as const
const QUARTER_DAYS = 90

export function buildCompanyTrajectory(
  companyName: string,
  activities: TrajectoryActivity[],
  now = new Date(),
): CompanyTrajectory {
  const quarterTotals = Array.from({ length: 4 }, () => ({ patents: 0, trademarks: 0, total: 0 }))
  const codeCounts = new Map<string, { asset: TrajectoryAssetType; windows: [number, number, number, number] }>()

  const nowDay = utcDay(now)
  for (const activity of activities) {
    if (!activity.filing_date) continue
    const filing = parseDate(activity.filing_date)
    if (!filing) continue
    const ageDays = Math.floor((nowDay.getTime() - filing.getTime()) / DAY_MS)
    if (ageDays < 0 || ageDays >= WINDOW_DAYS) continue
    const quarter = Math.floor(ageDays / QUARTER_DAYS)
    if (quarter < 0 || quarter > 3) continue

    quarterTotals[quarter].total += 1
    if (activity.entity_type === "patent") quarterTotals[quarter].patents += 1
    else quarterTotals[quarter].trademarks += 1

    for (const code of new Set(activity.classification_codes.map(value => normalizeClassification(value, activity.entity_type)).filter(Boolean))) {
      const key = `${activity.entity_type}:${code}`
      const existing = codeCounts.get(key) ?? { asset: activity.entity_type, windows: [0, 0, 0, 0] as [number, number, number, number] }
      existing.windows[quarter] += 1
      codeCounts.set(key, existing)
    }
  }

  const signals = [...codeCounts.entries()].map(([key, item]) => {
    const code = key.slice(key.indexOf(":") + 1)
    return classifyTrajectorySignal(code, item.asset, item.windows)
  })

  const quarters = quarterTotals.map((totals, index) => {
    const endOffset = index * QUARTER_DAYS
    const startOffset = endOffset + QUARTER_DAYS - 1
    return {
      key: `q${index}` as TrajectoryQuarter["key"],
      label: index === 0 ? "Últimos 90 días" : `${index * 90 + 1}–${(index + 1) * 90} días atrás`,
      start: dateOnly(addDays(nowDay, -startOffset)),
      end: dateOnly(addDays(nowDay, -endOffset)),
      ...totals,
    }
  })

  const technical = bucket(signals.filter(item => item.asset_type === "patent"))
  const commercial = bucket(signals.filter(item => item.asset_type === "trademark"))
  const totalEvidence = quarterTotals.reduce((sum, item) => sum + item.total, 0)
  const direction = buildDirection(companyName, quarters, technical, commercial, totalEvidence)

  return { window_days: WINDOW_DAYS, quarters, technical, commercial, direction }
}

export function classifyTrajectorySignal(
  code: string,
  assetType: TrajectoryAssetType,
  windows: [number, number, number, number],
): TrajectorySignal {
  const [q0, q1, q2, q3] = windows
  const prior = q1 + q2 + q3
  const total = q0 + prior
  const activeQuarters = windows.filter(value => value > 0).length
  const priorAverage = prior / 3

  let state: TrajectoryState = "stable"
  if (q0 >= 2 && prior === 0) {
    state = "emerging"
  } else if (q0 === 1 && prior === 0) {
    state = "experimental"
  } else if (q0 >= 2 && prior > 0 && q0 >= q1 + 1 && q0 >= Math.ceil(priorAverage * 1.5)) {
    state = "accelerating"
  } else if ((q0 === 0 && (q1 >= 2 || q2 >= 2)) || (q0 > 0 && q1 >= 3 && q0 * 2 <= q1)) {
    state = "declining"
  } else if (activeQuarters >= 3 && total >= 4) {
    state = "persistent"
  }

  const momentum = q0 * 3 + q1 * 2 + q2 - q3
  const confidence = clamp(
    45 + Math.min(25, total * 4) + Math.min(12, activeQuarters * 3) + (state === "emerging" || state === "accelerating" ? 6 : 0),
    45,
    94,
  )

  return {
    code,
    asset_type: assetType,
    state,
    windows,
    current: q0,
    prior,
    total,
    active_quarters: activeQuarters,
    momentum,
    confidence,
  }
}

function bucket(signals: TrajectorySignal[]) {
  const sorted = [...signals].sort((a, b) => priority(a.state) - priority(b.state) || b.momentum - a.momentum || b.total - a.total || a.code.localeCompare(b.code))
  return {
    emerging: sorted.filter(item => item.state === "emerging").slice(0, 8),
    accelerating: sorted.filter(item => item.state === "accelerating").slice(0, 8),
    persistent: sorted.filter(item => item.state === "persistent").slice(0, 8),
    declining: sorted.filter(item => item.state === "declining").slice(0, 8),
    experimental: sorted.filter(item => item.state === "experimental").slice(0, 8),
  }
}

function buildDirection(
  name: string,
  quarters: TrajectoryQuarter[],
  technical: ReturnType<typeof bucket>,
  commercial: ReturnType<typeof bucket>,
  evidence: number,
): CompanyTrajectory["direction"] {
  if (!evidence) return null

  const emergingTech = technical.emerging.slice(0, 3).map(item => item.code)
  const acceleratingTech = technical.accelerating.slice(0, 3).map(item => item.code)
  const persistentTech = technical.persistent.slice(0, 3).map(item => item.code)
  const emergingCommercial = commercial.emerging.slice(0, 3).map(item => item.code)
  const experimentalTech = technical.experimental.length

  let headline = `${name}: sin una nueva dirección técnica robusta en los últimos 90 días`
  let interpretation = "La actividad de protección observada no muestra todavía una señal técnica nueva con repetición suficiente para clasificarla como emergente o acelerando."
  let why = "Mantener la línea base evita confundir una presentación aislada con un cambio de dirección."

  if (emergingTech.length) {
    headline = `${name}: aparecen nuevas áreas técnicas con repetición reciente`
    interpretation = `VIDENTIA observa actividad repetida en IPC ${emergingTech.join(", ")} durante los últimos 90 días, sin presencia en los tres trimestres anteriores.`
    why = "Una aparición repetida y nueva permite priorizar análisis competitivo, libertad de operación y vigilancia antes de que el movimiento madure."
  } else if (acceleratingTech.length) {
    headline = `${name}: refuerza actividad de protección en áreas técnicas existentes`
    interpretation = `La intensidad reciente aumenta en IPC ${acceleratingTech.join(", ")} frente a los trimestres anteriores. Es consistente con un refuerzo de protección, no con una intención corporativa confirmada.`
    why = "La aceleración sostenida puede indicar dónde está concentrándose la protección técnica y qué áreas conviene seguir con mayor frecuencia."
  } else if (persistentTech.length) {
    headline = `${name}: mantiene un núcleo técnico persistente`
    interpretation = `IPC ${persistentTech.join(", ")} aparece en al menos tres de los cuatro trimestres observados, lo que lo distingue de movimientos aislados.`
    why = "Un núcleo persistente sirve como referencia para detectar desviaciones futuras, expansiones y entradas de competidores adyacentes."
  } else if (emergingCommercial.length) {
    headline = `${name}: expande cobertura comercial sin una señal técnica equivalente todavía`
    interpretation = `Aparecen de forma repetida nuevas clases Niza ${emergingCommercial.join(", ")} en el trimestre actual. La señal es comercial/marcaria y debe contrastarse con patentes y mercado.`
    why = "La divergencia entre marcas y patentes ayuda a separar expansión comercial observable de desarrollo tecnológico comprobado."
  } else if (experimentalTech) {
    interpretation += ` Hay ${experimentalTech} señal${experimentalTech === 1 ? "" : "es"} IPC de una sola presentación reciente, clasificadas como experimentales hasta que exista repetición.`
  }

  const q0 = quarters[0]
  const q1 = quarters[1]
  const robustSignals = technical.emerging.length + technical.accelerating.length + technical.persistent.length + commercial.emerging.length + commercial.accelerating.length
  const confidence = clamp(48 + Math.min(24, evidence * 2) + Math.min(12, robustSignals * 4) + (q0.total + q1.total > 0 ? 6 : 0), 45, 92)

  return {
    headline,
    observed_fact: `En cuatro ventanas de 90 días VIDENTIA observa ${quarters.map(item => item.total).join(" / ")} expedientes desde el trimestre más reciente al más antiguo. El trimestre actual contiene ${q0.patents} patentes y ${q0.trademarks} marcas.`,
    interpretation,
    why_it_matters: why,
    confidence,
    evidence_level: confidence >= 78 ? "alta" : confidence >= 62 ? "media" : "baja",
    guardrail: "La trayectoria describe persistencia, aparición y aceleración de protección observada. No prueba por sí sola inversión, producto, lanzamiento ni estrategia corporativa.",
  }
}

function normalizeClassification(value: string, asset: TrajectoryAssetType) {
  const code = String(value ?? "").toUpperCase().replace(/\s+/g, "").trim()
  if (!code) return ""
  if (asset === "patent") return code.match(/^([A-HY]\d{2}[A-Z])/)?.[1] ?? code.slice(0, 12)
  const match = code.match(/^(?:0?([1-9])|([1-3]\d)|4[0-5])$/)
  return match ? String(Number(code)) : code.slice(0, 12)
}

function priority(state: TrajectoryState) {
  return ({ emerging: 0, accelerating: 1, persistent: 2, declining: 3, experimental: 4, stable: 5 } as const)[state]
}

function parseDate(value: string) {
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value)
  return Number.isNaN(date.getTime()) ? null : utcDay(date)
}
function utcDay(value: Date) { return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())) }
function addDays(value: Date, days: number) { return new Date(value.getTime() + days * DAY_MS) }
function dateOnly(value: Date) { return value.toISOString().slice(0, 10) }
function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, Math.round(value))) }
