export type SnifaTimelineEvent = {
  id: string
  watch_id: string
  source_key: string
  event_type: string
  title: string
  summary: string | null
  source_url: string | null
  occurred_at: string | null
  relevance: string | null
  first_seen_at: string
  payload?: unknown
}

export type SnifaTimelineMilestone = {
  id: string
  stage: string
  label: string
  title: string
  detail: string | null
  occurredAt: string | null
  firstSeenAt: string
  href: string | null
  relevance: "alta" | "media" | "baja"
}

export type SnifaTimelineCollapsedEvent = SnifaTimelineEvent & {
  timeline?: {
    canonicalCompanyId: string
    canonicalCompanyName: string | null
    expediente: string
    milestones: SnifaTimelineMilestone[]
  }
}

const STAGE_LABEL: Record<string, string> = {
  seia_entry_requirement: "Requerimiento SEIA",
  provisional_measure: "Medida provisional",
  sanctioning_proceeding: "Procedimiento sancionatorio",
  compliance_program: "Programa de Cumplimiento",
  firm_sanction: "Sanción firme",
}

const STAGE_RANK: Record<string, number> = {
  seia_entry_requirement: 1,
  provisional_measure: 2,
  sanctioning_proceeding: 3,
  compliance_program: 4,
  firm_sanction: 5,
}

export function collapseSnifaRegulatoryEvents(events: SnifaTimelineEvent[]): SnifaTimelineCollapsedEvent[] {
  const groups = new Map<string, SnifaTimelineEvent[]>()
  const passthrough: SnifaTimelineCollapsedEvent[] = []

  for (const event of events) {
    const identity = readTimelineIdentity(event)
    if (!identity) {
      passthrough.push(event)
      continue
    }
    const key = `${event.watch_id}\u0000${identity.canonicalCompanyId}\u0000${normalizeExpediente(identity.expediente)}`
    const bucket = groups.get(key)
    if (bucket) bucket.push(event)
    else groups.set(key, [event])
  }

  const collapsed: SnifaTimelineCollapsedEvent[] = [...passthrough]
  for (const items of groups.values()) {
    if (items.length < 2) {
      collapsed.push(items[0])
      continue
    }

    const identity = readTimelineIdentity(items[0])!
    const milestones = items.map(toMilestone).sort(compareMilestones)
    const datedMilestones = milestones.filter(item => item.occurredAt && safeTime(item.occurredAt) > 0)
    const latestByEvidence = (datedMilestones.length ? datedMilestones : milestones).at(-1)!
    const newestObserved = [...items].sort((a, b) => safeTime(b.first_seen_at) - safeTime(a.first_seen_at))[0]
    const relevance = highestRelevance(items.map(item => normalizeRelevance(item.relevance)))

    collapsed.push({
      ...newestObserved,
      id: `timeline:${identity.canonicalCompanyId}:${normalizeExpediente(identity.expediente)}`,
      source_key: "snifa_sma",
      event_type: "regulatory_timeline",
      title: `Hitos regulatorios SMA · ${identity.expediente}`,
      summary: buildTimelineDetail(milestones),
      source_url: latestByEvidence.href || newestObserved.source_url,
      occurred_at: latestByEvidence.occurredAt || newestObserved.occurred_at,
      relevance,
      first_seen_at: newestObserved.first_seen_at,
      payload: {
        official_source: true,
        evidence_type: "regulatory_timeline",
        canonical_company_id: identity.canonicalCompanyId,
        canonical_company_name: identity.canonicalCompanyName,
        expediente: identity.expediente,
        milestone_count: milestones.length,
        derived_view: true,
      },
      timeline: {
        canonicalCompanyId: identity.canonicalCompanyId,
        canonicalCompanyName: identity.canonicalCompanyName,
        expediente: identity.expediente,
        milestones,
      },
    })
  }

  return collapsed.sort((a, b) => safeTime(b.first_seen_at) - safeTime(a.first_seen_at))
}

function readTimelineIdentity(event: SnifaTimelineEvent) {
  if (event.source_key !== "snifa_sma") return null
  if (!event.payload || typeof event.payload !== "object" || Array.isArray(event.payload)) return null
  const payload = event.payload as Record<string, unknown>
  const canonicalCompanyId = typeof payload.canonical_company_id === "string" ? payload.canonical_company_id.trim() : ""
  const canonicalCompanyName = typeof payload.canonical_company_name === "string" ? payload.canonical_company_name.trim() || null : null
  const expediente = typeof payload.expediente === "string" ? payload.expediente.trim() : ""
  const stage = typeof payload.regulatory_stage === "string" ? payload.regulatory_stage.trim() : ""
  if (!canonicalCompanyId || !expediente || !STAGE_LABEL[stage]) return null
  return { canonicalCompanyId, canonicalCompanyName, expediente, stage }
}

function toMilestone(event: SnifaTimelineEvent): SnifaTimelineMilestone {
  const identity = readTimelineIdentity(event)!
  return {
    id: event.id,
    stage: identity.stage,
    label: STAGE_LABEL[identity.stage] ?? identity.stage,
    title: event.title,
    detail: event.summary,
    occurredAt: event.occurred_at,
    firstSeenAt: event.first_seen_at,
    href: event.source_url,
    relevance: normalizeRelevance(event.relevance),
  }
}

function compareMilestones(a: SnifaTimelineMilestone, b: SnifaTimelineMilestone) {
  const aTime = a.occurredAt && safeTime(a.occurredAt) > 0 ? safeTime(a.occurredAt) : Number.POSITIVE_INFINITY
  const bTime = b.occurredAt && safeTime(b.occurredAt) > 0 ? safeTime(b.occurredAt) : Number.POSITIVE_INFINITY
  if (aTime !== bTime) return aTime - bTime
  const stageDelta = (STAGE_RANK[a.stage] ?? 99) - (STAGE_RANK[b.stage] ?? 99)
  if (stageDelta) return stageDelta
  return safeTime(a.firstSeenAt) - safeTime(b.firstSeenAt)
}

function buildTimelineDetail(milestones: SnifaTimelineMilestone[]) {
  const path = milestones.map(item => `${item.label}${item.occurredAt ? ` ${formatDate(item.occurredAt)}` : ""}`).join(" → ")
  return `${milestones.length} hitos · ${path}`
}

function normalizeExpediente(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, " ")
}

function normalizeRelevance(value: string | null): "alta" | "media" | "baja" {
  if (value === "alta" || value === "baja") return value
  return "media"
}

function highestRelevance(values: Array<"alta" | "media" | "baja">): "alta" | "media" | "baja" {
  if (values.includes("alta")) return "alta"
  if (values.includes("media")) return "media"
  return "baja"
}

function safeTime(value: string) {
  const time = Date.parse(value)
  return Number.isFinite(time) ? time : 0
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(date)
}
