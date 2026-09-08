import { createAdminClient } from "@/lib/supabase/admin"

type HandoffRow = {
  idea_key: string
  idea_title: string
  score: number
  status: string
  rationale: string | null
  evidence_snapshot: Record<string, unknown> | null
  updated_at: string
}

type ProductRow = {
  product_key: string
  product_name: string
  title: string
  score: number
  status: string
  outcome: string
  decision_note: string | null
  decision_at: string | null
  evidence_snapshot: Record<string, unknown> | null
  updated_at: string
}

type CaseRow = { id: string; title: string; priority: string | null; status: string }
type ActionRow = { id: string; case_id: string; title: string; status: string; due_at: string | null; outcome: string | null; updated_at: string }

type HandoffSnapshot = {
  research_mode?: string
  research_summary?: { papers?: number; patents?: number; signals?: number; curated_evidence?: number; reuse_assets?: number }
  evidence_gaps?: string[]
}

type RepoActivity = {
  status?: string
  repoFullName?: string
  repoUrl?: string
  observedAt?: string
  lastAttemptAt?: string
  commits7d?: number
  commits24h?: number
  commits24hLowerBound?: boolean
  scopeActivity?: Array<{ scope?: string; count?: number }>
  latestCommit?: { sha?: string; message?: string; committedAt?: string | null; url?: string | null } | null
  decisionEffect?: string
}

type ProductSnapshot = {
  repo?: string
  repo_activity?: RepoActivity
  chile_evidence?: { state?: string; delta?: number }
  world_frontier?: { state?: string; delta?: number; paper_count?: number }
  conviction?: { effective?: number; base?: number; chile_delta?: number; frontier_delta?: number; paper_delta?: number; patent_delta?: number; global_delta?: number }
  dimensions?: Record<string, unknown>
}

export async function loadAssistantJuanWorkspace(userId: string) {
  const admin = createAdminClient()
  const [handoffsResult, productsResult, casesResult] = await Promise.all([
    admin
      .from("intelligence_project_handoffs")
      .select("idea_key,idea_title,score,status,rationale,evidence_snapshot,updated_at")
      .eq("user_id", userId)
      .neq("status", "closed")
      .order("score", { ascending: false }),
    admin
      .from("intelligence_product_evolution_recommendations")
      .select("product_key,product_name,title,score,status,outcome,decision_note,decision_at,evidence_snapshot,updated_at")
      .eq("user_id", userId)
      .neq("status", "rejected")
      .order("score", { ascending: false }),
    admin
      .from("cases")
      .select("id,title,priority,status")
      .eq("user_id", userId)
      .neq("status", "closed")
      .limit(200),
  ])

  const handoffs = (handoffsResult.error ? [] : handoffsResult.data ?? []) as HandoffRow[]
  const products = (productsResult.error ? [] : productsResult.data ?? []) as ProductRow[]
  const cases = (casesResult.error ? [] : casesResult.data ?? []) as CaseRow[]
  const caseById = new Map(cases.map(item => [item.id, item]))

  let actions: ActionRow[] = []
  if (cases.length) {
    const actionsResult = await admin
      .from("case_actions")
      .select("id,case_id,title,status,due_at,outcome,updated_at")
      .in("case_id", cases.map(item => item.id))
      .neq("status", "done")
      .limit(200)
    actions = (actionsResult.error ? [] : actionsResult.data ?? []) as ActionRow[]
  }

  const now = Date.now()
  const pendingDecisions = handoffs.filter(item => item.status === "ready_for_n3uralia").map(item => {
    const snapshot = (item.evidence_snapshot ?? {}) as HandoffSnapshot
    return {
      ideaKey: item.idea_key,
      title: item.idea_title,
      evidenceScore: item.score,
      status: item.status,
      rationale: item.rationale,
      evidenceGaps: snapshot.evidence_gaps ?? [],
      researchSummary: snapshot.research_summary ?? {},
      researchMode: snapshot.research_mode ?? null,
      updatedAt: item.updated_at,
    }
  })

  const researching = handoffs.filter(item => item.status === "paused").map(item => {
    const snapshot = (item.evidence_snapshot ?? {}) as HandoffSnapshot
    return {
      ideaKey: item.idea_key,
      title: item.idea_title,
      evidenceScore: item.score,
      status: item.status,
      evidenceGaps: snapshot.evidence_gaps ?? [],
      researchSummary: snapshot.research_summary ?? {},
      researchMode: snapshot.research_mode ?? null,
      updatedAt: item.updated_at,
    }
  })

  const acceptedProducts = products.filter(item => item.status === "accepted").map(item => {
    const snapshot = (item.evidence_snapshot ?? {}) as ProductSnapshot
    return {
      productKey: item.product_key,
      productName: item.product_name,
      direction: item.title,
      evidenceScore: item.score,
      humanStatus: item.status,
      humanDecisionAt: item.decision_at,
      humanDecisionNote: item.decision_note,
      intendedOutcome: item.outcome,
      repository: snapshot.repo ?? null,
      repoActivity: snapshot.repo_activity ?? null,
      chileEvidence: snapshot.chile_evidence ?? null,
      worldFrontier: snapshot.world_frontier ?? null,
      conviction: snapshot.conviction ?? null,
      executionDimensions: snapshot.dimensions ?? null,
      updatedAt: item.updated_at,
    }
  })

  const overdueActions = actions.flatMap(action => {
    if (!action.due_at) return []
    const due = Date.parse(action.due_at)
    if (!Number.isFinite(due) || due >= now) return []
    const parentCase = caseById.get(action.case_id)
    return [{
      actionId: action.id,
      title: action.title,
      status: action.status,
      dueAt: action.due_at,
      caseId: action.case_id,
      caseTitle: parentCase?.title ?? null,
      casePriority: parentCase?.priority ?? null,
      outcome: action.outcome,
      updatedAt: action.updated_at,
    }]
  })

  const githubReposObserved = acceptedProducts.filter(item => item.repoActivity?.status === "ok").length
  const githubLatestObservedAt = acceptedProducts
    .map(item => item.repoActivity?.observedAt ?? item.repoActivity?.lastAttemptAt ?? null)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null

  return {
    generatedAt: new Date().toISOString(),
    decisionBoundary: "Read-only executive context. Evidence scores, GitHub activity and execution readiness do not create, approve, reject, reopen or reprioritize human decisions automatically.",
    evidenceBoundary: "Patent activity is a separate evidence family and is not market adoption. Missing Chile evidence is neutral. GitHub activity and institutional reuse/integration are execution context only and never increase evidence conviction.",
    summary: {
      pendingDecisions: pendingDecisions.length,
      researchingHandoffs: researching.length,
      acceptedProducts: acceptedProducts.length,
      overdueActions: overdueActions.length,
      githubReposObserved,
      githubLatestObservedAt,
    },
    pendingDecisions,
    researching,
    acceptedProducts,
    overdueActions,
  }
}
