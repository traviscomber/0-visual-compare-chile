export type ExecutiveAttentionSignal = {
  key: string
  watchKey: string
  type: "brand" | "patent" | "technology"
  watchQuery: string
  source: string
  title: string
  detail: string | null
  occurredAt: string | null
  firstSeenAt: string
  relevance: "alta" | "media" | "baja"
  isNew: boolean
  href: string
  timeline?: {
    expediente: string
    canonicalCompanyName: string | null
    assessment: {
      latestStage: string
      latestStageLabel: string
      latestMovementAt: string | null
      direction: "observacion" | "escalando" | "mitigacion" | "materializado"
      attention: "alta" | "media"
      durationDays: number | null
      rationale: string
    }
  } | null
}

export type ExecutiveAttentionItem = {
  key: string
  signalKey: string
  watchKey: string
  title: string
  subject: string
  source: string
  href: string
  priority: "critica" | "alta" | "media"
  reason: string
  occurredAt: string | null
  isNew: boolean
  kind: "regulatory_case" | "new_high_signal"
}

export function buildExecutiveAttentionQueue(signals: ExecutiveAttentionSignal[]): ExecutiveAttentionItem[] {
  const items = signals.flatMap(signal => toAttentionItem(signal))
  return items.sort(compareAttention)
}

function toAttentionItem(signal: ExecutiveAttentionSignal): ExecutiveAttentionItem[] {
  const assessment = signal.timeline?.assessment
  if (assessment) {
    const priority = assessment.direction === "materializado"
      ? "critica" as const
      : assessment.attention === "alta"
        ? "alta" as const
        : "media" as const
    return [{
      key: `attention:${signal.key}`,
      signalKey: signal.key,
      watchKey: signal.watchKey,
      title: signal.timeline?.expediente ? `${assessment.latestStageLabel} · ${signal.timeline.expediente}` : signal.title,
      subject: signal.timeline?.canonicalCompanyName || signal.watchQuery,
      source: signal.source,
      href: signal.href,
      priority,
      reason: regulatoryReason(assessment),
      occurredAt: assessment.latestMovementAt || signal.occurredAt || signal.firstSeenAt,
      isNew: signal.isNew,
      kind: "regulatory_case",
    }]
  }

  if (!signal.isNew || signal.relevance !== "alta") return []
  return [{
    key: `attention:${signal.key}`,
    signalKey: signal.key,
    watchKey: signal.watchKey,
    title: signal.title,
    subject: signal.watchQuery,
    source: signal.source,
    href: signal.href,
    priority: "alta",
    reason: `Nueva señal de alta relevancia en ${signal.source}. Requiere revisión de evidencia y decisión de seguimiento.`,
    occurredAt: signal.occurredAt || signal.firstSeenAt,
    isNew: true,
    kind: "new_high_signal",
  }]
}

function regulatoryReason(assessment: NonNullable<NonNullable<ExecutiveAttentionSignal["timeline"]>["assessment"]>) {
  const duration = assessment.durationDays === null ? "" : ` Trayectoria observada: ${assessment.durationDays} días.`
  if (assessment.direction === "materializado") return `El expediente alcanzó ${assessment.latestStageLabel}; el riesgo regulatorio ya se materializó.${duration}`
  if (assessment.direction === "escalando") return `El expediente avanzó hasta ${assessment.latestStageLabel}; la trayectoria oficial está escalando.${duration}`
  if (assessment.direction === "mitigacion") return `El último hito es ${assessment.latestStageLabel}; existe una señal formal de mitigación que debe seguirse hasta su resultado.${duration}`
  return `El último hito oficial es ${assessment.latestStageLabel}; mantener observación activa.${duration}`
}

function compareAttention(a: ExecutiveAttentionItem, b: ExecutiveAttentionItem) {
  const rank = { critica: 3, alta: 2, media: 1 } as const
  const priorityDelta = rank[b.priority] - rank[a.priority]
  if (priorityDelta) return priorityDelta
  const kindDelta = Number(b.kind === "regulatory_case") - Number(a.kind === "regulatory_case")
  if (kindDelta) return kindDelta
  const newDelta = Number(b.isNew) - Number(a.isNew)
  if (newDelta) return newDelta
  return safeTime(b.occurredAt) - safeTime(a.occurredAt)
}

function safeTime(value: string | null) {
  if (!value) return 0
  const time = Date.parse(value)
  return Number.isFinite(time) ? time : 0
}
