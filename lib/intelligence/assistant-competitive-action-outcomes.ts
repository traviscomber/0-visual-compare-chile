import { createAdminClient } from "@/lib/supabase/admin"
import type { loadAssistantCompetitiveSituations } from "@/lib/intelligence/assistant-competitive-situations"

type CompetitiveSnapshot = Awaited<ReturnType<typeof loadAssistantCompetitiveSituations>>

type CaseRow = {
  id: string
  title: string
  context_query: string | null
  status: string
  updated_at: string
}

type ItemRow = {
  id: string
  case_id: string
  source_id: string
  title: string
  metadata: unknown
}

type ActionRow = {
  id: string
  case_id: string
  title: string
  status: string
  due_at: string | null
  created_at: string
  completed_at: string | null
  outcome: string | null
  outcome_at: string | null
  updated_at: string
}

export async function attachCompetitiveActionOutcomes(userId: string, snapshot: CompetitiveSnapshot) {
  const hypothesisIds = Array.from(new Set(
    snapshot.situations.flatMap((situation) => situation.acceptedHypotheses.map((hypothesis) => hypothesis.id)),
  ))
  const empty = () => ({
    ...snapshot,
    actionOutcomeSummary: { completed: 0, open: 0 },
    situations: snapshot.situations.map((situation) => ({
      ...situation,
      completedActionOutcomes: [],
      openActions: [],
    })),
    actionOutcomeBoundary: "Human-recorded action outcomes are internal execution context, not independent market evidence. They may trigger new research or human review, but they do not change conviction, corroboration, hypothesis acceptance or lifecycle automatically.",
  })
  if (!hypothesisIds.length) return empty()

  const admin = createAdminClient()
  const sourceIds = hypothesisIds.map((id) => `competitive_hypothesis:${id}`)
  const { data: caseData, error: caseError } = await admin
    .from("cases")
    .select("id,title,context_query,status,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(500)
  if (caseError) {
    console.error("[assistant-competitive-action-outcomes:cases]", caseError)
    throw new Error("Could not load competitive action cases")
  }

  const cases = (caseData ?? []) as CaseRow[]
  const caseIds = cases.map((row) => row.id)
  if (!caseIds.length) return empty()

  const { data: itemData, error: itemError } = await admin
    .from("case_items")
    .select("id,case_id,source_id,title,metadata")
    .in("case_id", caseIds)
    .in("source_id", sourceIds)
    .limit(500)
  if (itemError) {
    console.error("[assistant-competitive-action-outcomes:items]", itemError)
    throw new Error("Could not load competitive action lineage")
  }

  const items = (itemData ?? []) as ItemRow[]
  const linkedCaseIds = Array.from(new Set(items.map((row) => row.case_id)))
  if (!linkedCaseIds.length) return empty()

  const { data: actionData, error: actionError } = await admin
    .from("case_actions")
    .select("id,case_id,title,status,due_at,created_at,completed_at,outcome,outcome_at,updated_at")
    .in("case_id", linkedCaseIds)
    .order("updated_at", { ascending: false })
    .limit(500)
  if (actionError) {
    console.error("[assistant-competitive-action-outcomes:actions]", actionError)
    throw new Error("Could not load competitive action outcomes")
  }

  const actions = (actionData ?? []) as ActionRow[]
  const casesById = new Map(cases.map((row) => [row.id, row]))
  const itemsBySource = new Map<string, ItemRow[]>()
  for (const item of items) {
    const current = itemsBySource.get(item.source_id) ?? []
    current.push(item)
    itemsBySource.set(item.source_id, current)
  }
  const actionsByCase = new Map<string, ActionRow[]>()
  for (const action of actions) {
    const current = actionsByCase.get(action.case_id) ?? []
    current.push(action)
    actionsByCase.set(action.case_id, current)
  }

  let completed = 0
  let open = 0
  const situations = snapshot.situations.map((situation) => {
    const linked = situation.acceptedHypotheses.flatMap((hypothesis) => {
      const sourceId = `competitive_hypothesis:${hypothesis.id}`
      return (itemsBySource.get(sourceId) ?? []).flatMap((item) => {
        const caseRow = casesById.get(item.case_id)
        if (!caseRow) return []
        const proposalLineage = normalizeProposalLineage(item.metadata)
        return (actionsByCase.get(item.case_id) ?? []).map((action) => ({
          action,
          caseRow,
          sourceId,
          hypothesisId: hypothesis.id,
          hypothesis: hypothesis.hypothesis,
          proposalLineage,
        }))
      })
    })

    const deduped = Array.from(new Map(linked.map((entry) => [entry.action.id, entry])).values())
    const completedActionOutcomes = deduped.flatMap((entry) => {
      if (entry.action.status !== "done" || !entry.action.outcome?.trim()) return []
      completed += 1
      return [{
        actionId: entry.action.id,
        actionTitle: text(entry.action.title, 240),
        outcome: text(entry.action.outcome, 1_200),
        outcomeAt: entry.action.outcome_at,
        completedAt: entry.action.completed_at,
        caseTitle: text(entry.caseRow.title, 160),
        hypothesisId: entry.hypothesisId,
        hypothesis: text(entry.hypothesis, 500),
        proposalLineage: entry.proposalLineage,
        evidenceRole: "internal_execution_context" as const,
        humanRecorded: true as const,
        independentMarketEvidence: false as const,
      }]
    }).slice(0, 8)
    const openActions = deduped.flatMap((entry) => {
      if (entry.action.status !== "open") return []
      open += 1
      return [{
        actionId: entry.action.id,
        actionTitle: text(entry.action.title, 240),
        dueAt: entry.action.due_at,
        createdAt: entry.action.created_at,
        caseTitle: text(entry.caseRow.title, 160),
        hypothesisId: entry.hypothesisId,
        proposalLineage: entry.proposalLineage,
      }]
    }).slice(0, 8)

    return {
      ...situation,
      completedActionOutcomes,
      openActions,
    }
  })

  return {
    ...snapshot,
    actionOutcomeSummary: { completed, open },
    situations,
    actionOutcomeBoundary: "Human-recorded action outcomes are internal execution context, not independent market evidence. They may trigger new research or human review, but they do not change conviction, corroboration, hypothesis acceptance or lifecycle automatically.",
  }
}

function normalizeProposalLineage(value: unknown) {
  if (!isPlainObject(value)) return null
  const origin = text(value.origin, 120)
  const target = text(value.target, 300)
  const researchQuery = text(value.researchQuery, 400)
  const rationale = text(value.rationale, 800)
  const expectedImpact = text(value.expectedImpact, 600)
  const academicSupport = text(value.academicSupport, 80)
  const papers = Array.isArray(value.papers) ? value.papers.flatMap((paper) => {
    if (!isPlainObject(paper)) return []
    const title = text(paper.title, 300)
    const url = safeUrl(paper.url)
    if (!title) return []
    return [{
      title,
      year: typeof paper.year === "number" && Number.isFinite(paper.year) ? Math.round(paper.year) : null,
      url,
      doi: text(paper.doi, 200) || null,
    }]
  }).slice(0, 5) : []
  if (!origin && !target && !researchQuery && !rationale && !expectedImpact && !papers.length) return null
  return { origin, target, researchQuery, rationale, expectedImpact, academicSupport, papers }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : ""
}

function safeUrl(value: unknown) {
  const normalized = text(value, 800)
  return /^https?:\/\//i.test(normalized) ? normalized : null
}
