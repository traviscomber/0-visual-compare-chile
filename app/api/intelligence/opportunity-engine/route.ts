import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { readPublicCompanyWebsite } from "@/lib/intelligence/company-website-profile"
import { runOpportunityEngine } from "@/lib/intelligence/opportunity-engine"
import { assertPortfolioOrganizationAccess } from "@/lib/intelligence/portfolio-access"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const RequestSchema = z.object({
  organizationId: z.string().uuid(),
  websiteUrl: z.string().trim().url().max(500),
  challenge: z.string().trim().max(600).optional(),
})

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const parsed = RequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Selecciona una organización e ingresa una web pública válida." },
      { status: 400, headers: PRIVATE_NO_STORE_HEADERS },
    )
  }

  const admin = createAdminClient()
  try {
    const access = await assertPortfolioOrganizationAccess(admin, auth.user.id, parsed.data.organizationId)
    if (!access.ok) return NextResponse.json({ error: "No perteneces a esta organización." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })

    const [{ data: organization, error: organizationError }, website] = await Promise.all([
      admin.from("organizations").select("id,name,slug").eq("id", parsed.data.organizationId).maybeSingle(),
      readPublicCompanyWebsite(parsed.data.websiteUrl),
    ])
    if (organizationError || !organization) {
      return NextResponse.json({ error: "No pudimos cargar la organización." }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })
    }

    const [
      { data: binding },
      { data: orgSearches },
      { data: userSearches },
      { data: intelligenceWatches },
      { data: patentWatches },
      { data: trademarkWatches },
      { data: intelligenceEvents },
      { data: patentEvents },
      { data: trademarkEvents },
      { data: recommendations },
    ] = await Promise.all([
      admin
        .from("intelligence_portfolio_bindings")
        .select("identity_id,intelligence_company_identities(canonical_name,country,metadata)")
        .eq("organization_id", parsed.data.organizationId)
        .eq("is_primary", true)
        .maybeSingle(),
      admin
        .from("search_history")
        .select("query,search_type,source,results_count,status,metadata,created_at")
        .eq("organization_id", parsed.data.organizationId)
        .order("created_at", { ascending: false })
        .limit(30),
      admin
        .from("search_history")
        .select("query,search_type,source,results_count,status,metadata,created_at")
        .eq("user_id", auth.user.id)
        .is("organization_id", null)
        .order("created_at", { ascending: false })
        .limit(20),
      admin
        .from("intelligence_watches")
        .select("id,watch_type,query,is_active,last_checked_at,last_reviewed_at,metadata,created_at")
        .eq("user_id", auth.user.id)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(30),
      admin
        .from("patent_watches")
        .select("id,watch_type,query,is_active,last_checked_at,source_type,source_url,source_status,source_last_checked_at,created_at")
        .eq("user_id", auth.user.id)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(30),
      admin
        .from("trademark_watches")
        .select("id,watch_type,query,nice_classes,is_active,last_checked_at,last_reviewed_at,created_at")
        .eq("user_id", auth.user.id)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(30),
      admin
        .from("intelligence_watch_events")
        .select("event_type,title,summary,source_key,source_url,occurred_at,relevance,first_seen_at,last_seen_at")
        .eq("user_id", auth.user.id)
        .order("occurred_at", { ascending: false })
        .limit(30),
      admin
        .from("patent_alert_events")
        .select("event_type,title,applicants,ipc_codes,filing_date,detected_at,source_key,source_url,source_date,metadata")
        .eq("user_id", auth.user.id)
        .order("detected_at", { ascending: false })
        .limit(30),
      admin
        .from("trademark_watch_signal_events")
        .select("source,mark_name,applicant_name,application_number,nice_classes,event_date,state,source_url,relevance,reason,first_seen_at,last_seen_at")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(30),
      admin
        .from("intelligence_recommendations")
        .select("source_type,asset_type,classification,code,score,tier,headline,recommended_action,guardrail,evidence,status,updated_at")
        .eq("organization_id", parsed.data.organizationId)
        .neq("status", "discarded")
        .order("updated_at", { ascending: false })
        .limit(30),
    ])

    const ownIdentityRaw = binding?.intelligence_company_identities as unknown
    const ownIdentityRow = Array.isArray(ownIdentityRaw) ? ownIdentityRaw[0] : ownIdentityRaw
    const ownIdentity = ownIdentityRow && typeof ownIdentityRow === "object"
      ? {
          canonicalName: String((ownIdentityRow as Record<string, unknown>).canonical_name ?? organization.name),
          country: (ownIdentityRow as Record<string, unknown>).country ? String((ownIdentityRow as Record<string, unknown>).country) : null,
          metadata: (ownIdentityRow as Record<string, unknown>).metadata ?? null,
        }
      : null

    const recentSearches = dedupeSignals([...(orgSearches ?? []), ...(userSearches ?? [])], "query").slice(0, 35)
    const allWatches = [
      ...(intelligenceWatches ?? []).map((item) => ({ ...item, family: "intelligence" })),
      ...(patentWatches ?? []).map((item) => ({ ...item, family: "patent" })),
      ...(trademarkWatches ?? []).map((item) => ({ ...item, family: "trademark" })),
    ].slice(0, 60)
    const observedEvents = [
      ...(intelligenceEvents ?? []).map((item) => ({ ...item, family: "intelligence" })),
      ...(patentEvents ?? []).map((item) => ({ ...item, family: "patent" })),
      ...(trademarkEvents ?? []).map((item) => ({ ...item, family: "trademark" })),
    ].slice(0, 75)

    const generatedAt = new Date().toISOString()
    const result = await runOpportunityEngine({
      organization: {
        id: String(organization.id),
        name: String(organization.name),
        slug: String(organization.slug),
        ownIdentity,
      },
      website,
      recentSearches: recentSearches as Array<Record<string, unknown>>,
      userWatches: allWatches as Array<Record<string, unknown>>,
      observedEvents: observedEvents as Array<Record<string, unknown>>,
      recommendations: (recommendations ?? []) as Array<Record<string, unknown>>,
      generatedAt,
      challenge: parsed.data.challenge || null,
    })

    return NextResponse.json({
      analysis: result.output,
      context: {
        organization: { id: organization.id, name: organization.name, slug: organization.slug },
        website: { canonicalUrl: website.canonicalUrl, pagesRead: website.pages.length },
        signals: {
          searches: recentSearches.length,
          watches: allWatches.length,
          events: observedEvents.length,
          recommendations: recommendations?.length ?? 0,
        },
        generatedAt,
      },
      model: result.model,
      usage: {
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        estimatedCostUsd: result.estimatedCostUsd,
      },
    }, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.error("[opportunity-engine]", error)
    const message = error instanceof Error ? error.message : ""
    if (message.includes("URL") || message.includes("web") || message.includes("pública") || message.includes("direcciones públicas")) {
      return NextResponse.json({ error: message || "No pudimos leer la web pública." }, { status: 422, headers: PRIVATE_NO_STORE_HEADERS })
    }
    if (message.includes("OPENAI_API_KEY")) {
      return NextResponse.json({ error: "El motor de oportunidad no está disponible en este entorno." }, { status: 503, headers: PRIVATE_NO_STORE_HEADERS })
    }
    return NextResponse.json(
      { error: "No pudimos construir la lectura de oportunidades. Ningún dato canónico fue modificado." },
      { status: 502, headers: PRIVATE_NO_STORE_HEADERS },
    )
  }
}

function dedupeSignals<T extends Record<string, unknown>>(rows: T[], key: keyof T): T[] {
  const seen = new Set<string>()
  return rows.filter((row) => {
    const value = String(row[key] ?? "").trim().toLowerCase()
    if (!value || seen.has(value)) return false
    seen.add(value)
    return true
  })
}
