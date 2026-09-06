export type WatchTaskSignal = {
  key: string
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
}

export type TriagedWatchTask<T extends WatchTaskSignal> = T & {
  duplicateCount: number
  groupedKeys: string[]
}

export function triageWatchTasks<T extends WatchTaskSignal>(signals: T[]) {
  const pending = signals.filter(signal => signal.isNew)
  const actionable = pending.filter(signal => signal.relevance !== "baja")
  const informational = pending.filter(signal => signal.relevance === "baja")
  const tasks = dedupeSignals(actionable)
  const information = dedupeSignals(informational)

  return {
    tasks,
    information,
    rawPendingCount: pending.length,
    hiddenDuplicateCount: actionable.length - tasks.length + informational.length - information.length,
    actionableRawCount: actionable.length,
    informationalRawCount: informational.length,
  }
}

export function dedupeSignals<T extends WatchTaskSignal>(signals: T[]): Array<TriagedWatchTask<T>> {
  const groups = new Map<string, T[]>()
  for (const signal of signals) {
    const key = evidenceFingerprint(signal)
    const bucket = groups.get(key) ?? []
    bucket.push(signal)
    groups.set(key, bucket)
  }

  return [...groups.values()]
    .map(group => {
      const sorted = [...group].sort((a, b) => relevanceRank(b.relevance) - relevanceRank(a.relevance) || timestamp(b) - timestamp(a))
      const representative = sorted[0]
      return {
        ...representative,
        duplicateCount: group.length - 1,
        groupedKeys: group.map(item => item.key),
      }
    })
    .sort((a, b) => relevanceRank(b.relevance) - relevanceRank(a.relevance) || timestamp(b) - timestamp(a))
}

function evidenceFingerprint(signal: WatchTaskSignal) {
  const href = normalizeUrl(signal.href)
  if (href && href !== "https://videntia.app/monitorear" && href !== "https://videntia.app/monitorear/estrategico") return `url:${href}`

  const title = normalizeText(signal.title)
  const query = normalizeText(signal.watchQuery)
  const date = dayBucket(signal.occurredAt || signal.firstSeenAt)
  return `${signal.type}:${query}:${title}:${date}`
}

function normalizeUrl(value: string) {
  if (!value) return ""
  try {
    const url = new URL(value, "https://videntia.app")
    url.hash = ""
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"]) url.searchParams.delete(key)
    return `${url.origin}${url.pathname}${url.search}`.toLowerCase().replace(/\/$/, "")
  } catch {
    return value.trim().toLowerCase()
  }
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+-\s+[^-]{2,60}$/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function dayBucket(value: string | null) {
  const timestamp = value ? Date.parse(value) : NaN
  if (!Number.isFinite(timestamp)) return "unknown"
  return new Date(timestamp).toISOString().slice(0, 10)
}

function timestamp(signal: WatchTaskSignal) {
  const value = Date.parse(signal.occurredAt || signal.firstSeenAt)
  return Number.isFinite(value) ? value : 0
}

function relevanceRank(value: WatchTaskSignal["relevance"]) {
  return value === "alta" ? 3 : value === "media" ? 2 : 1
}
