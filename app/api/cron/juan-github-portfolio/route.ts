import { NextResponse } from "next/server"
import { fetchGitHubRepositoryActivity } from "@/lib/intelligence/github-repository-activity"
import { listPortfolioOrganizations } from "@/lib/intelligence/portfolio-access"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

const JUAN_EMAIL = "juan@n3uralia.com"
const GITHUB_ACTIVITY_NOTE = "GitHub activity is institutional execution context only. It never changes evidence conviction, Chile adoption, market demand or a human decision."

type ProductRow = {
  id: string
  product_key: string
  product_name: string
  evidence_snapshot: Record<string, unknown> | null
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const startedAt = Date.now()
  const admin = createAdminClient()
  const { data: users, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (usersError) return NextResponse.json({ ok: false, error: "Could not resolve target user." }, { status: 500 })

  const juan = users.users.find(user => user.email?.trim().toLowerCase() === JUAN_EMAIL)
  if (!juan) return NextResponse.json({ ok: false, error: "Target user not found." }, { status: 404 })

  const organizations = await listPortfolioOrganizations(admin, juan.id).catch(() => [])
  const organization = organizations[0] ?? null
  if (!organization) return NextResponse.json({ ok: false, error: "Target organization not found." }, { status: 404 })

  const { data, error } = await admin
    .from("intelligence_product_evolution_recommendations")
    .select("id,product_key,product_name,evidence_snapshot")
    .eq("user_id", juan.id)
    .eq("organization_id", organization.id)
    .neq("status", "rejected")

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  const products = (data ?? []) as ProductRow[]
  const results: Array<Record<string, unknown>> = []

  for (const product of products) {
    const snapshot = { ...(product.evidence_snapshot ?? {}) } as Record<string, unknown>
    const repoUrl = typeof snapshot.repo === "string" ? snapshot.repo.trim() : ""
    if (!repoUrl.includes("github.com/")) {
      results.push({ productKey: product.product_key, ok: false, skipped: true, reason: "missing_github_repo" })
      continue
    }

    try {
      const activity = await fetchGitHubRepositoryActivity(repoUrl)
      const nextSnapshot = {
        ...snapshot,
        repo_activity: activity,
        repo_activity_boundary: GITHUB_ACTIVITY_NOTE,
      }
      const { error: updateError } = await admin
        .from("intelligence_product_evolution_recommendations")
        .update({ evidence_snapshot: nextSnapshot })
        .eq("id", product.id)
        .eq("user_id", juan.id)
        .eq("organization_id", organization.id)

      if (updateError) {
        results.push({ productKey: product.product_key, ok: false, error: updateError.message })
        continue
      }

      results.push({
        productKey: product.product_key,
        productName: product.product_name,
        ok: true,
        repo: activity.repoFullName,
        commits7d: activity.commits7d,
        commits24h: activity.commits24h,
        commits24hLowerBound: activity.commits24hLowerBound,
        latestCommitAt: activity.latestCommit?.committedAt ?? null,
        scopeActivity: activity.scopeActivity.slice(0, 5),
        decisionEffect: activity.decisionEffect,
      })
    } catch (cause) {
      const now = new Date().toISOString()
      const previous = isRecord(snapshot.repo_activity) ? snapshot.repo_activity : {}
      const nextSnapshot = {
        ...snapshot,
        repo_activity: {
          ...previous,
          source: "github",
          status: "degraded",
          repoUrl,
          lastAttemptAt: now,
          error: cause instanceof Error ? cause.message : "GitHub repository activity unavailable.",
          decisionEffect: "none",
          note: GITHUB_ACTIVITY_NOTE,
        },
        repo_activity_boundary: GITHUB_ACTIVITY_NOTE,
      }
      const { error: updateError } = await admin
        .from("intelligence_product_evolution_recommendations")
        .update({ evidence_snapshot: nextSnapshot })
        .eq("id", product.id)
        .eq("user_id", juan.id)
        .eq("organization_id", organization.id)

      results.push({
        productKey: product.product_key,
        ok: false,
        degraded: true,
        error: updateError?.message ?? (cause instanceof Error ? cause.message : "GitHub repository activity unavailable."),
      })
    }
  }

  const response = {
    ok: results.some(item => item.ok === true),
    boundary: GITHUB_ACTIVITY_NOTE,
    repositories: results,
    durationMs: Date.now() - startedAt,
  }
  console.info("[cron/juan-github-portfolio]", JSON.stringify(response))
  return NextResponse.json(response)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}
