import { createHash } from "node:crypto"

export type StrategicSourceEvent = {
  id: string
  source_record_id: string
  entity_type: "patent" | "trademark"
  event_type: string
  title: string | null
  observed_at: string
  materiality: "alta" | "media" | "baja"
  before_snapshot: Record<string, unknown> | null
  after_snapshot: Record<string, unknown> | null
}

export type StrategicChangeType =
  | "protection_acceleration"
  | "cross_ip_expansion"
  | "technology_concentration"
  | "portfolio_maturation"
  | "ownership_concentration"

export type StrategicChangeEvidence = {
  sourceEventId: string
  evidenceRole: string
  weight: number
}

export type StrategicChangeCandidate = {
  changeKey: string
  subjectType: "company"
  subjectKey: string
  subjectName: string
  changeType: StrategicChangeType
  title: string
  observedFact: string
  interpretation: string
  whyItMatters: string
  materiality: "alta" | "media" | "baja"
  confidence: number
  eventCount: number
  distinctRecords: number
  patentEvents: number
  trademarkEvents: number
  classificationCodes: string[]
  periodStart: string
  periodEnd: string
  firstObservedAt: string
  lastObservedAt: string
  evidence: StrategicChangeEvidence[]
  metadata: Record<string, unknown>
}

const WINDOW_DAYS = 30
const PROTECTION_EVENT_TYPES = new Set(["new_record", "classification_changed", "registration_added"])

export function buildStrategicChangeCandidates(
  events: StrategicSourceEvent[],
  referenceDate = new Date(),
): StrategicChangeCandidate[] {
  const cutoff = referenceDate.getTime() - WINDOW_DAYS * 86_400_000
  const recent = events.filter(event => {
    const timestamp = new Date(event.observed_at).getTime()
    return Number.isFinite(timestamp) && timestamp >= cutoff && timestamp <= referenceDate.getTime() + 60_000
  })

  const byCompany = new Map<string, { subjectName: string; events: StrategicSourceEvent[] }>()
  for (const event of recent) {
    for (const applicant of applicantsFrom(event.after_snapshot)) {
      const subjectKey = normalizeSubject(applicant)
      if (!subjectKey) continue
      const current = byCompany.get(subjectKey)
      if (current) current.events.push(event)
      else byCompany.set(subjectKey, { subjectName: applicant, events: [event] })
    }
  }

  const candidates: StrategicChangeCandidate[] = []
  for (const [subjectKey, group] of byCompany) {
    const companyEvents = uniqueEvents(group.events)
    const protectionEvents = companyEvents.filter(event => PROTECTION_EVENT_TYPES.has(event.event_type))
    const protectionRecords = distinctRecords(protectionEvents)

    if (protectionRecords >= 3) {
      candidates.push(buildProtectionAcceleration(subjectKey, group.subjectName, protectionEvents))
    }

    const patentProtection = protectionEvents.filter(event => event.entity_type === "patent")
    const trademarkProtection = protectionEvents.filter(event => event.entity_type === "trademark")
    if (distinctRecords(patentProtection) >= 1 && distinctRecords(trademarkProtection) >= 1 && protectionRecords >= 3) {
      candidates.push(buildCrossIpExpansion(subjectKey, group.subjectName, protectionEvents))
    }

    const concentration = buildTechnologyConcentrations(subjectKey, group.subjectName, patentProtection)
    candidates.push(...concentration)

    const maturationEvents = companyEvents.filter(event =>
      event.event_type === "registration_added" || (event.event_type === "status_changed" && isPositiveStatus(event.after_snapshot?.status)),
    )
    if (distinctRecords(maturationEvents) >= 2) {
      candidates.push(buildPortfolioMaturation(subjectKey, group.subjectName, maturationEvents))
    }

    const ownershipEvents = companyEvents.filter(event => event.event_type === "applicant_changed")
    if (distinctRecords(ownershipEvents) >= 2) {
      candidates.push(buildOwnershipConcentration(subjectKey, group.subjectName, ownershipEvents))
    }
  }

  return dedupeCandidates(candidates).sort((a, b) => {
    const materiality = materialityRank(b.materiality) - materialityRank(a.materiality)
    if (materiality) return materiality
    if (b.confidence !== a.confidence) return b.confidence - a.confidence
    return b.lastObservedAt.localeCompare(a.lastObservedAt)
  })
}

function buildProtectionAcceleration(subjectKey: string, subjectName: string, events: StrategicSourceEvent[]): StrategicChangeCandidate {
  const base = baseCandidate(subjectKey, subjectName, "protection_acceleration", events)
  const patentEvents = countEntity(events, "patent")
  const trademarkEvents = countEntity(events, "trademark")
  const confidence = clamp(62 + Math.min(20, base.distinctRecords * 4) + (patentEvents && trademarkEvents ? 6 : 0), 0, 95)
  return {
    ...base,
    title: `${subjectName}: aceleración de actividad de protección`,
    observedFact: `VIDENTIA observó ${events.length} cambios relevantes en ${base.distinctRecords} expedientes de ${subjectName} durante los últimos ${WINDOW_DAYS} días: ${patentEvents} en patentes y ${trademarkEvents} en marcas.`,
    interpretation: "La concentración temporal supera un hecho aislado y es consistente con un refuerzo de actividad de protección. No demuestra por sí sola un cambio de estrategia corporativa.",
    whyItMatters: "Un aumento sostenido de protección puede anticipar mayor presión competitiva, nuevas prioridades de portafolio o preparación para movimientos comerciales que conviene contrastar con otras señales.",
    materiality: base.distinctRecords >= 5 ? "alta" : "media",
    confidence,
    patentEvents,
    trademarkEvents,
    evidence: evidenceFor(events, "actividad de protección", 3),
    metadata: { rule: "protection_acceleration_v1", window_days: WINDOW_DAYS },
  }
}

function buildCrossIpExpansion(subjectKey: string, subjectName: string, events: StrategicSourceEvent[]): StrategicChangeCandidate {
  const base = baseCandidate(subjectKey, subjectName, "cross_ip_expansion", events)
  const patentEvents = countEntity(events, "patent")
  const trademarkEvents = countEntity(events, "trademark")
  return {
    ...base,
    title: `${subjectName}: actividad coordinada en patentes y marcas`,
    observedFact: `En la misma ventana VIDENTIA observó ${patentEvents} cambios de patente y ${trademarkEvents} cambios marcarios asociados a ${subjectName}, distribuidos en ${base.distinctRecords} expedientes.`,
    interpretation: "La coincidencia temporal entre protección técnica y marcaria es una señal más fuerte que cualquiera de las dos por separado. Puede ser consistente con preparación de mercado o expansión de una línea de negocio, pero requiere corroboración externa.",
    whyItMatters: "La coordinación entre patentes y marcas puede anticipar lanzamiento, posicionamiento o comercialización de capacidades que hasta ahora sólo eran visibles de forma fragmentada.",
    materiality: "alta",
    confidence: clamp(74 + Math.min(16, base.distinctRecords * 3), 0, 94),
    patentEvents,
    trademarkEvents,
    evidence: evidenceFor(events, "convergencia patente-marca", 4),
    metadata: { rule: "cross_ip_expansion_v1", window_days: WINDOW_DAYS },
  }
}

function buildTechnologyConcentrations(subjectKey: string, subjectName: string, patentEvents: StrategicSourceEvent[]) {
  const recordIds = new Set(patentEvents.map(event => event.source_record_id))
  if (recordIds.size < 3) return []

  const byPrefix = new Map<string, StrategicSourceEvent[]>()
  for (const event of patentEvents) {
    for (const prefix of ipcPrefixes(event.after_snapshot?.classification)) {
      const bucket = byPrefix.get(prefix) ?? []
      bucket.push(event)
      byPrefix.set(prefix, bucket)
    }
  }

  const output: StrategicChangeCandidate[] = []
  for (const [prefix, rawEvents] of byPrefix) {
    const events = uniqueEvents(rawEvents)
    const records = distinctRecords(events)
    if (records < 2 || records / recordIds.size < 0.6) continue
    const base = baseCandidate(subjectKey, subjectName, "technology_concentration", events, prefix)
    output.push({
      ...base,
      title: `${subjectName}: concentración tecnológica en IPC ${prefix}`,
      observedFact: `${records} de ${recordIds.size} expedientes de patente observados para ${subjectName} en la ventana comparten la clase IPC ${prefix}.`,
      interpretation: "La actividad reciente de protección se concentra en un mismo dominio técnico. Es una señal de prioridad tecnológica observada, no una prueba suficiente de cambio estratégico por sí sola.",
      whyItMatters: "Una concentración técnica persistente ayuda a detectar hacia dónde se está acumulando protección y dónde podría aumentar la competencia o la necesidad de revisar libertad de operación.",
      materiality: records >= 3 ? "alta" : "media",
      confidence: clamp(68 + Math.round((records / recordIds.size) * 20) + Math.min(8, records * 2), 0, 94),
      patentEvents: events.length,
      trademarkEvents: 0,
      classificationCodes: [prefix],
      evidence: evidenceFor(events, `concentración IPC ${prefix}`, 4),
      metadata: { rule: "technology_concentration_v1", ipc_prefix: prefix, window_days: WINDOW_DAYS, concentration_ratio: records / recordIds.size },
    })
  }
  return output
}

function buildPortfolioMaturation(subjectKey: string, subjectName: string, events: StrategicSourceEvent[]): StrategicChangeCandidate {
  const base = baseCandidate(subjectKey, subjectName, "portfolio_maturation", events)
  return {
    ...base,
    title: `${subjectName}: maduración del portafolio protegido`,
    observedFact: `VIDENTIA observó ${events.length} avances a registro, concesión o estado equivalente en ${base.distinctRecords} expedientes asociados a ${subjectName} durante la ventana analizada.`,
    interpretation: "Varios expedientes están avanzando simultáneamente hacia derechos consolidados. Esto describe una maduración observable del portafolio, no necesariamente un aumento de inversión futura.",
    whyItMatters: "La consolidación de varios derechos puede elevar barreras de entrada, fortalecer capacidad de licenciamiento y modificar el riesgo competitivo alrededor de ese portafolio.",
    materiality: base.distinctRecords >= 3 ? "alta" : "media",
    confidence: clamp(78 + Math.min(14, base.distinctRecords * 4), 0, 96),
    patentEvents: countEntity(events, "patent"),
    trademarkEvents: countEntity(events, "trademark"),
    evidence: evidenceFor(events, "maduración de derechos", 5),
    metadata: { rule: "portfolio_maturation_v1", window_days: WINDOW_DAYS },
  }
}

function buildOwnershipConcentration(subjectKey: string, subjectName: string, events: StrategicSourceEvent[]): StrategicChangeCandidate {
  const base = baseCandidate(subjectKey, subjectName, "ownership_concentration", events)
  return {
    ...base,
    title: `${subjectName}: concentración de cambios de titularidad`,
    observedFact: `VIDENTIA observó ${events.length} cambios de solicitante o titular que convergen en ${subjectName}, afectando ${base.distinctRecords} expedientes durante la ventana analizada.`,
    interpretation: "La repetición de cambios de titularidad hacia un mismo actor puede ser consistente con consolidación de activos, reorganización o adquisición de propiedad intelectual. La causa jurídica exacta debe verificarse en cada expediente.",
    whyItMatters: "La concentración de derechos en un actor puede alterar su posición negociadora, su cobertura defensiva y el mapa de potenciales socios, licenciatarios o competidores.",
    materiality: "alta",
    confidence: clamp(82 + Math.min(12, base.distinctRecords * 4), 0, 97),
    patentEvents: countEntity(events, "patent"),
    trademarkEvents: countEntity(events, "trademark"),
    evidence: evidenceFor(events, "cambio de titularidad", 5),
    metadata: { rule: "ownership_concentration_v1", window_days: WINDOW_DAYS },
  }
}

function baseCandidate(
  subjectKey: string,
  subjectName: string,
  changeType: StrategicChangeType,
  events: StrategicSourceEvent[],
  discriminator = "",
): StrategicChangeCandidate {
  const sorted = uniqueEvents(events).sort((a, b) => a.observed_at.localeCompare(b.observed_at))
  const firstObservedAt = sorted[0]?.observed_at ?? new Date().toISOString()
  const lastObservedAt = sorted.at(-1)?.observed_at ?? firstObservedAt
  const periodStart = weekStart(lastObservedAt)
  const periodEnd = addDays(periodStart, 6)
  return {
    changeKey: strategicKey(subjectKey, changeType, periodStart, discriminator),
    subjectType: "company",
    subjectKey,
    subjectName,
    changeType,
    title: "",
    observedFact: "",
    interpretation: "",
    whyItMatters: "",
    materiality: "media",
    confidence: 0,
    eventCount: sorted.length,
    distinctRecords: distinctRecords(sorted),
    patentEvents: countEntity(sorted, "patent"),
    trademarkEvents: countEntity(sorted, "trademark"),
    classificationCodes: [],
    periodStart,
    periodEnd,
    firstObservedAt,
    lastObservedAt,
    evidence: [],
    metadata: {},
  }
}

function evidenceFor(events: StrategicSourceEvent[], role: string, weight: number): StrategicChangeEvidence[] {
  return uniqueEvents(events).map(event => ({ sourceEventId: event.id, evidenceRole: role, weight }))
}

function applicantsFrom(snapshot: Record<string, unknown> | null | undefined) {
  const value = snapshot?.applicant
  if (value === null || value === undefined) return []
  return [...new Set(String(value)
    .split(/(?:;|\n|\r|\s\|\s)+/)
    .map(item => item.replace(/\s+/g, " ").trim())
    .filter(item => item.length >= 2))]
}

export function normalizeStrategicSubject(value: string) {
  return normalizeSubject(value)
}

function normalizeSubject(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

function ipcPrefixes(value: unknown) {
  const raw = Array.isArray(value) ? value : value === null || value === undefined ? [] : [value]
  const prefixes = raw.flatMap(item => {
    const text = String(item).toUpperCase().replace(/\s+/g, "")
    const match = text.match(/^([A-HY]\d{2}[A-Z])/)
    return match ? [match[1]] : []
  })
  return [...new Set(prefixes)]
}

function isPositiveStatus(value: unknown) {
  if (value === null || value === undefined) return false
  const status = String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  return status.includes("registr") || status.includes("conced") || status.includes("grant")
}

function uniqueEvents(events: StrategicSourceEvent[]) {
  return [...new Map(events.map(event => [event.id, event])).values()]
}

function distinctRecords(events: StrategicSourceEvent[]) {
  return new Set(events.map(event => event.source_record_id)).size
}

function countEntity(events: StrategicSourceEvent[], entity: StrategicSourceEvent["entity_type"]) {
  return events.filter(event => event.entity_type === entity).length
}

function weekStart(value: string) {
  const date = new Date(value)
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = utc.getUTCDay()
  const distance = day === 0 ? -6 : 1 - day
  utc.setUTCDate(utc.getUTCDate() + distance)
  return utc.toISOString().slice(0, 10)
}

function addDays(dateOnly: string, days: number) {
  const date = new Date(`${dateOnly}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function strategicKey(subjectKey: string, changeType: StrategicChangeType, periodStart: string, discriminator: string) {
  const digest = createHash("sha256").update([subjectKey, changeType, periodStart, discriminator].join("|")).digest("hex")
  return `strategic-change:${digest}`
}

function dedupeCandidates(candidates: StrategicChangeCandidate[]) {
  const byKey = new Map<string, StrategicChangeCandidate>()
  for (const candidate of candidates) {
    const current = byKey.get(candidate.changeKey)
    if (!current || candidate.confidence > current.confidence) byKey.set(candidate.changeKey, candidate)
  }
  return [...byKey.values()]
}

function materialityRank(value: StrategicChangeCandidate["materiality"]) {
  return value === "alta" ? 3 : value === "media" ? 2 : 1
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
