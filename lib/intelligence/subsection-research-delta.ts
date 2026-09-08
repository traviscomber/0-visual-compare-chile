export const SUBSECTION_DELTA_BOUNDARY = "Subsection deltas describe discovery freshness only. A new paper is not proof of market movement, and a previously retained paper that is not observed again is neutral rather than negative evidence."

export type SubsectionDiscoveryPaper = {
  source?: string
  sourceRecordId?: string
  title?: string
  date?: string | null
  url?: string
  doi?: string | null
}

export type SubsectionDiscoveryTopic = {
  key: string
  papers: SubsectionDiscoveryPaper[]
}

export type StoredSubsectionResearchForDelta = {
  generated_at?: string
  paper_count?: number
  topics?: Array<{ key?: string; label?: string; papers?: SubsectionDiscoveryPaper[] }>
}

export type SubsectionDiscoveryDelta = {
  baseline_created: boolean
  previous_generated_at: string | null
  previous_paper_count: number | null
  new_paper_count: number
  new_topic_count: number
  not_observed_again_count: number
  new_topics: string[]
  new_papers: Array<{ source: string; title: string; date: string | null; url: string; topic_key: string }>
  decision_effect: "none"
  boundary: string
}

export function buildSubsectionDiscoveryDelta(
  previous: StoredSubsectionResearchForDelta | null,
  currentTopics: SubsectionDiscoveryTopic[],
  options: { topicLimit?: number; maxNewPapers?: number } = {},
): SubsectionDiscoveryDelta {
  const topicLimit = Math.max(1, options.topicLimit ?? 3)
  const maxNewPapers = Math.max(1, options.maxNewPapers ?? 8)

  if (!previous) {
    return {
      baseline_created: true,
      previous_generated_at: null,
      previous_paper_count: null,
      new_paper_count: 0,
      new_topic_count: 0,
      not_observed_again_count: 0,
      new_topics: [],
      new_papers: [],
      decision_effect: "none",
      boundary: SUBSECTION_DELTA_BOUNDARY,
    }
  }

  const previousPapers = flattenStoredPapers(previous.topics ?? [])
  const currentPapers = flattenCurrentPapers(currentTopics)
  const previousIds = new Set(previousPapers.map(item => paperIdentity(item.paper)).filter(Boolean))
  const currentIds = new Set(currentPapers.map(item => paperIdentity(item.paper)).filter(Boolean))
  const previousTopicKeys = new Set((previous.topics ?? []).flatMap(topic => stringValue(topic.key) ? [stringValue(topic.key)!] : []))
  const currentTopicKeys = new Set(currentTopics.map(topic => topic.key).filter(Boolean))

  const newPapers = dedupeByIdentity(currentPapers.filter(item => {
    const identity = paperIdentity(item.paper)
    return Boolean(identity && !previousIds.has(identity))
  })).slice(0, maxNewPapers).flatMap(item => {
    const title = stringValue(item.paper.title)
    if (!title) return []
    return [{
      source: stringValue(item.paper.source) ?? "paper",
      title,
      date: stringValue(item.paper.date),
      url: stringValue(item.paper.url) ?? "",
      topic_key: item.topicKey,
    }]
  })

  const newTopics = [...currentTopicKeys].filter(key => !previousTopicKeys.has(key)).slice(0, topicLimit)
  const notObservedAgain = [...previousIds].filter(identity => !currentIds.has(identity)).length

  return {
    baseline_created: false,
    previous_generated_at: stringValue(previous.generated_at),
    previous_paper_count: typeof previous.paper_count === "number" ? previous.paper_count : previousIds.size,
    new_paper_count: [...currentIds].filter(identity => !previousIds.has(identity)).length,
    new_topic_count: newTopics.length,
    not_observed_again_count: notObservedAgain,
    new_topics: newTopics,
    new_papers: newPapers,
    decision_effect: "none",
    boundary: SUBSECTION_DELTA_BOUNDARY,
  }
}

export function readStoredSubsectionResearchForDelta(value: unknown): StoredSubsectionResearchForDelta | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const row = value as StoredSubsectionResearchForDelta
  return stringValue(row.generated_at) || Array.isArray(row.topics) ? row : null
}

export function subsectionPaperIdentity(paper: SubsectionDiscoveryPaper) {
  return paperIdentity(paper)
}

function flattenStoredPapers(topics: NonNullable<StoredSubsectionResearchForDelta["topics"]>) {
  return topics.flatMap(topic => (topic.papers ?? []).map(paper => ({ topicKey: stringValue(topic.key) ?? "unknown", paper })))
}

function flattenCurrentPapers(topics: SubsectionDiscoveryTopic[]) {
  return topics.flatMap(topic => topic.papers.map(paper => ({ topicKey: topic.key, paper })))
}

function dedupeByIdentity(items: Array<{ topicKey: string; paper: SubsectionDiscoveryPaper }>) {
  const seen = new Set<string>()
  return items.filter(item => {
    const identity = paperIdentity(item.paper)
    if (!identity || seen.has(identity)) return false
    seen.add(identity)
    return true
  })
}

function paperIdentity(paper: SubsectionDiscoveryPaper) {
  const doi = stringValue(paper.doi)
  if (doi) return `doi:${normalize(doi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, ""))}`
  const sourceRecordId = stringValue(paper.sourceRecordId)
  if (sourceRecordId) return `record:${normalize(stringValue(paper.source) ?? "paper")}:${normalize(sourceRecordId)}`
  const url = stringValue(paper.url)
  if (url) return `url:${url.toLowerCase()}`
  const title = stringValue(paper.title)
  return title ? `title:${normalize(title)}` : ""
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim()
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}
