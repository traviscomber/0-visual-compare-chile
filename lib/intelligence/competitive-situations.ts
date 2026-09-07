import type { ExecutiveAttentionItem } from "@/lib/intelligence/executive-attention"

export type CompetitiveSituationSignal = ExecutiveAttentionItem & {
  corroboration?: unknown
}

export type CompetitiveSituation = {
  key: string
  subject: string
  priority: "critica" | "alta" | "media"
  latestOccurredAt: string | null
  signalCount: number
  kinds: Array<ExecutiveAttentionItem["kind"]>
  sources: string[]
  activeHypothesisReviews: number
  competitiveExpansions: number
  regulatoryCases: number
  externalSignals: number
  decisionQuestion: string
  timeline: CompetitiveSituationSignal[]
}

const HYPOTHESIS_REVIEW_SOURCE = "VIDENTIA · Seguimiento de hipótesis"
const PRIORITY_RANK = { critica: 3, alta: 2, media: 1 } as const

export function buildCompetitiveSituations(items: CompetitiveSituationSignal[]): CompetitiveSituation[] {
  const eligible = items.filter(isCompetitiveSituationItem)
  const groups = new Map<string, CompetitiveSituationSignal[]>()

  for (const item of eligible) {
    const key = situationKey(item.subject)
    if (!key) continue
    const current = groups.get(key) ?? []
    current.push(item)
    groups.set(key, current)
  }

  return [...groups.entries()].map(([key, group]) => {
    const timeline = [...group].sort((a, b) => safeTime(b.occurredAt) - safeTime(a.occurredAt) || a.key.localeCompare(b.key))
    const priority = timeline.reduce<CompetitiveSituation["priority"]>((highest, item) => PRIORITY_RANK[item.priority] > PRIORITY_RANK[highest] ? item.priority : highest, "media")
    const subject = preferredSubject(timeline)
    const kinds = [...new Set(timeline.map(item => item.kind))]
    const sources = [...new Set(timeline.map(item => item.source))]
    const activeHypothesisReviews = timeline.filter(item => item.source === HYPOTHESIS_REVIEW_SOURCE).length
    const competitiveExpansions = timeline.filter(item => item.kind === "competitive_expansion").length
    const regulatoryCases = timeline.filter(item => item.kind === "regulatory_case").length
    const externalSignals = timeline.filter(item => item.kind === "new_high_signal" && item.source !== HYPOTHESIS_REVIEW_SOURCE).length

    return {
      key,
      subject,
      priority,
      latestOccurredAt: timeline[0]?.occurredAt ?? null,
      signalCount: timeline.length,
      kinds,
      sources,
      activeHypothesisReviews,
      competitiveExpansions,
      regulatoryCases,
      externalSignals,
      decisionQuestion: decisionQuestion({ activeHypothesisReviews, competitiveExpansions, regulatoryCases, externalSignals }),
      timeline,
    }
  }).sort(compareSituations)
}

export function situationKey(subject: string) {
  const normalized = normalizeSubject(subject)
  return normalized ? `competitive-situation:${normalized}` : ""
}

function isCompetitiveSituationItem(item: CompetitiveSituationSignal) {
  if (item.kind === "opportunity_conviction") return false
  return Boolean(normalizeSubject(item.subject))
}

function normalizeSubject(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(s\.a\.?|sa|spa|s\.p\.a\.?|ltda\.?|limitada|inc\.?|corp\.?|corporation|company|co\.?)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function preferredSubject(items: CompetitiveSituationSignal[]) {
  const canonical = items.find(item => item.kind === "regulatory_case" && item.subject.trim())?.subject
  return canonical ?? items.find(item => item.subject.trim())?.subject ?? "Competidor"
}

function decisionQuestion(input: { activeHypothesisReviews: number; competitiveExpansions: number; regulatoryCases: number; externalSignals: number }) {
  if (input.activeHypothesisReviews > 0) return "¿La nueva evidencia cambia la hipótesis competitiva aceptada o sólo amplía su contexto?"
  if (input.regulatoryCases > 0 && (input.competitiveExpansions > 0 || input.externalSignals > 0)) return "¿La combinación de actividad regulatoria e IP exige una respuesta o seguimiento ejecutivo coordinado?"
  if (input.competitiveExpansions > 0 && input.externalSignals > 0) return "¿La expansión registral está siendo corroborada por actividad real suficiente para formular o revisar una hipótesis competitiva?"
  if (input.competitiveExpansions > 0) return "¿Existe corroboración independiente suficiente antes de inferir entrada efectiva al nuevo espacio?"
  if (input.regulatoryCases > 0) return "¿La trayectoria regulatoria requiere una acción ejecutiva adicional o sólo seguimiento?"
  return "¿Esta señal cambia materialmente lo que debemos vigilar o hacer respecto de este competidor?"
}

function compareSituations(a: CompetitiveSituation, b: CompetitiveSituation) {
  const priority = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]
  if (priority) return priority
  const review = b.activeHypothesisReviews - a.activeHypothesisReviews
  if (review) return review
  const count = b.signalCount - a.signalCount
  if (count) return count
  return safeTime(b.latestOccurredAt) - safeTime(a.latestOccurredAt)
}

function safeTime(value: string | null) {
  if (!value) return 0
  const time = Date.parse(value)
  return Number.isFinite(time) ? time : 0
}
