import { NextResponse } from "next/server"
import { OpportunityResearchError, researchPersistedOpportunity } from "@/lib/intelligence/opportunity-thesis-research"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

const CLAIM_LIMIT = 4

type ClaimedThesis = {
  id: string
  organization_id: string
  research_claim_token: string | null
  title: string
}

type ResearchFailure = {
  id: string
  title: string
  code: string
  error: string
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authorization = request.headers.get("authorization")
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const startedAt = Date.now()
  const admin = createAdminClient()
  const { data, error: claimError } = await admin.rpc("claim_innovation_opportunity_theses", { p_limit: CLAIM_LIMIT })
  if (claimError) {
    console.error("[cron/opportunity-conviction] claim failed", claimError)
    return NextResponse.json({ ok: false, claimed: 0, completed: 0, failed: 0, error: "Could not claim due opportunity theses." }, { status: 500 })
  }

  const claims = (data ?? []) as ClaimedThesis[]
  if (!claims.length) {
    const response = { ok: true, claimed: 0, completed: 0, baselines: 0, changed: 0, failed: 0, releaseFailures: 0, durationMs: Date.now() - startedAt }
    console.info("[cron/opportunity-conviction]", JSON.stringify(response))
    return NextResponse.json(response)
  }

  let completed = 0
  let baselines = 0
  let changed = 0
  let releaseFailures = 0
  const failures: ResearchFailure[] = []

  // Sequential execution keeps third-party pressure bounded: each thesis can query OpenAlex, Crossref, INAPI and GDELT.
  for (const claim of claims) {
    try {
      const result = await researchPersistedOpportunity({
        admin,
        organizationId: claim.organization_id,
        opportunityId: claim.id,
        actorUserId: null,
        runType: "scheduled_research",
      })
      completed += 1
      if (result.comparison.baseline) baselines += 1
      if ((result.comparison.overall_delta ?? 0) !== 0) changed += 1
    } catch (error) {
      const code = error instanceof OpportunityResearchError ? error.code : "unexpected"
      const message = error instanceof Error ? error.message : String(error)
      failures.push({ id: claim.id, title: claim.title, code, error: message })
      console.error(`[cron/opportunity-conviction] research failed for ${claim.id}`, error)
    } finally {
      if (claim.research_claim_token) {
        const { error: releaseError } = await admin
          .from("innovation_opportunity_theses")
          .update({ research_claimed_at: null, research_claim_token: null })
          .eq("id", claim.id)
          .eq("organization_id", claim.organization_id)
          .eq("research_claim_token", claim.research_claim_token)
        if (releaseError) {
          releaseFailures += 1
          console.error(`[cron/opportunity-conviction] claim release failed for ${claim.id}`, releaseError)
        }
      }
    }
  }

  const ok = failures.length === 0 && releaseFailures === 0
  const response = {
    ok,
    claimed: claims.length,
    completed,
    baselines,
    changed,
    failed: failures.length,
    releaseFailures,
    failures,
    durationMs: Date.now() - startedAt,
  }
  console.info("[cron/opportunity-conviction]", JSON.stringify(response))
  return NextResponse.json(response, { status: ok ? 200 : 503 })
}
