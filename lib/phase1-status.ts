import { listApiKeys } from "@/lib/api/key-management"
import { buildPhase1WindowPlan } from "@/lib/inapi/phase1"
import { createAdminClient } from "@/lib/supabase/admin"

export interface Phase1StatusSummary {
  apiKeys: {
    total: number
    active: number
    monthlyQuota: number
    monthlyUsage: number
    monthlyRemaining: number
    atRisk: number
  }
  inapi: {
    totalRecords: number
    targetRecords: number
    completedRuns: number
    failedRuns: number
    phase1JobsCovered: number
    phase1JobsTotal: number
    phase1ProgressPct: number
    nextWindow: {
      startIndex: number
      maxJobs: number
    } | null
  }
}

export interface Phase1StatusPayload {
  summary: Phase1StatusSummary
  fetchedAt: string
  actions: {
    nextInapiCommand: string
    quotaFixtureCommand: string
    evidenceCommand: string
    quotaVerifyCommand: string
  }
}

export async function getPhase1StatusSummary(organizationId: string): Promise<Phase1StatusSummary> {
  const admin = createAdminClient()
  const [keys, recordsResponse, completedRunsResponse, failedRunsResponse, phase1CompletedResponse] = await Promise.all([
    listApiKeys(organizationId),
    admin.from("trademark_records").select("id", { count: "exact", head: true }),
    admin.from("inapi_sync_runs").select("id", { count: "exact", head: true }).eq("status", "completed"),
    admin.from("inapi_sync_runs").select("id", { count: "exact", head: true }).eq("status", "failed"),
    admin.from("inapi_sync_runs").select("metadata").eq("status", "completed").order("created_at", { ascending: false }).limit(200),
  ])

  const resolvedKeys = keys ?? []
  const activeKeys = resolvedKeys.filter((key) => key.is_active)
  const monthlyQuota = activeKeys.reduce((sum, key) => sum + key.quota_monthly, 0)
  const monthlyUsage = activeKeys.reduce((sum, key) => sum + key.usage_month, 0)
  const atRisk = activeKeys.filter((key) => key.quota_monthly > 0 && key.usage_month / key.quota_monthly >= 0.7).length
  const phase1Plan = buildPhase1WindowPlan(phase1CompletedResponse.data ?? [], 25)

  return {
    apiKeys: {
      total: resolvedKeys.length,
      active: activeKeys.length,
      monthlyQuota,
      monthlyUsage,
      monthlyRemaining: Math.max(monthlyQuota - monthlyUsage, 0),
      atRisk,
    },
    inapi: {
      totalRecords: recordsResponse.count ?? 0,
      targetRecords: 10000,
      completedRuns: completedRunsResponse.count ?? 0,
      failedRuns: failedRunsResponse.count ?? 0,
      phase1JobsCovered: phase1Plan.coveredJobs,
      phase1JobsTotal: phase1Plan.totalJobs,
      phase1ProgressPct: phase1Plan.progressPct,
      nextWindow: phase1Plan.nextWindow,
    },
  }
}

export async function getPhase1StatusPayload(organizationId: string): Promise<Phase1StatusPayload> {
  const summary = await getPhase1StatusSummary(organizationId)

  return {
    summary,
    fetchedAt: new Date().toISOString(),
    actions: {
      nextInapiCommand: summary.inapi.nextWindow
        ? `pnpm sync:inapi --preset phase1-10k --startIndex ${summary.inapi.nextWindow.startIndex} --maxJobs ${summary.inapi.nextWindow.maxJobs} --delayMs 400`
        : "pnpm evidence:inapi",
      quotaFixtureCommand: `pnpm fixture:api-key --organizationId ${organizationId} --quotaDaily 2 --quotaMonthly 10`,
      evidenceCommand: "pnpm evidence:inapi",
      quotaVerifyCommand: "QUOTA_VERIFY_API_KEY=sc_xxx QUOTA_VERIFY_BASE_URL=https://v0-visual-compare-chile.vercel.app pnpm verify:quota",
    },
  }
}
