import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { assertPortfolioOrganizationAccess } from "@/lib/intelligence/portfolio-access"
import { buildPortfolioGap } from "@/lib/intelligence/portfolio-gap"
import { isTerminalRecommendationStatus, portfolioGapRecommendationKey } from "@/lib/intelligence/recommendation-lifecycle"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

const CreateSchema = z.object({
  organizationId: z.string().uuid(),
  competitorIdentityId: z.string().uuid(),
  assetType: z.enum(["patent", "trademark"]),
  code: z.string().trim().min(1).max(32),
})

const ListSchema = z.object({
  organizationId: z.string().uuid(),
  competitorIdentityId: z.string().uuid().optional(),
})

const LIFECYCLE_SELECT = "id,status,discard_reason,case_id,action_id,updated_at"

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const parsed = ListSchema.safeParse({
    organizationId: url.searchParams.get("organizationId") ?? "",
    competitorIdentityId: url.searchParams.get("competitorIdentityId") || undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: "Selecciona una organización válida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const admin = createAdminClient()
  try {
    const access = await assertPortfolioOrganizationAccess(admin, auth.user.id, parsed.data.organizationId)
    if (!access.ok) return NextResponse.json({ error: "No perteneces a esta organización." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })

    let query = admin
      .from("intelligence_recommendations")
      .select("id,organization_id,competitor_identity_id,asset_type,classification,code,score,tier,headline,recommended_action,guardrail,factors,evidence,status,discard_reason,case_id,action_id,created_at,updated_at")
      .eq("organization_id", parsed.data.organizationId)
      .order("updated_at", { ascending: false })
      .limit(100)
    if (parsed.data.competitorIdentityId) query = query.eq("competitor_identity_id", parsed.data.competitorIdentityId)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return NextResponse.json({ recommendations: data ?? [] }, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.error("[recommendations:get]", error)
    return NextResponse.json({ error: "No pudimos cargar las recomendaciones." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const parsed = CreateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "La recomendación seleccionada no es válida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const admin = createAdminClient()
  try {
    const access = await assertPortfolioOrganizationAccess(admin, auth.user.id, parsed.data.organizationId)
    if (!access.ok) return NextResponse.json({ error: "No perteneces a esta organización." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })

    const { data: binding, error: bindingError } = await admin
      .from("intelligence_portfolio_bindings")
      .select("identity_id")
      .eq("organization_id", parsed.data.organizationId)
      .eq("is_primary", true)
      .maybeSingle()
    if (bindingError) throw new Error(bindingError.message)
    if (!binding) return NextResponse.json({ error: "Primero vincula la empresa propia." }, { status: 409, headers: PRIVATE_NO_STORE_HEADERS })

    const ownIdentityId = String(binding.identity_id)
    if (ownIdentityId === parsed.data.competitorIdentityId) {
      return NextResponse.json({ error: "Selecciona un competidor distinto de la empresa propia." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
    }

    const analysis = await buildPortfolioGap(admin, ownIdentityId, parsed.data.competitorIdentityId)
    const item = analysis.recommendations.find(candidate => candidate.asset_type === parsed.data.assetType && candidate.code === parsed.data.code)
    if (!item) {
      return NextResponse.json(
        { error: "Esta señal ya no cumple el umbral para una recomendación. Actualiza el análisis." },
        { status: 409, headers: PRIVATE_NO_STORE_HEADERS },
      )
    }

    const dedupeKey = portfolioGapRecommendationKey(ownIdentityId, parsed.data.competitorIdentityId, item.asset_type, item.code)
    const { data: existing, error: existingError } = await admin
      .from("intelligence_recommendations")
      .select(`id,status,discard_reason,case_id,action_id,updated_at`)
      .eq("organization_id", parsed.data.organizationId)
      .eq("dedupe_key", dedupeKey)
      .maybeSingle()
    if (existingError) throw new Error(existingError.message)

    if (existing && isTerminalRecommendationStatus(String(existing.status))) {
      return NextResponse.json({ recommendation: existing, created: false, refreshed: false }, { headers: PRIVATE_NO_STORE_HEADERS })
    }

    const snapshot = {
      source_type: "portfolio_gap",
      own_identity_id: ownIdentityId,
      competitor_identity_id: parsed.data.competitorIdentityId,
      asset_type: item.asset_type,
      classification: item.classification,
      code: item.code,
      score: item.score.total,
      tier: item.score.tier,
      headline: item.headline,
      recommended_action: item.action,
      guardrail: item.guardrail,
      factors: item.score.components,
      evidence: item.evidence,
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      const { data, error } = await admin
        .from("intelligence_recommendations")
        .update(snapshot)
        .eq("id", existing.id)
        .eq("organization_id", parsed.data.organizationId)
        .select(LIFECYCLE_SELECT)
        .single()
      if (error) throw new Error(error.message)
      return NextResponse.json({ recommendation: data, created: false, refreshed: true }, { headers: PRIVATE_NO_STORE_HEADERS })
    }

    const { data, error } = await admin
      .from("intelligence_recommendations")
      .insert({
        organization_id: parsed.data.organizationId,
        dedupe_key: dedupeKey,
        created_by: auth.user.id,
        ...snapshot,
      })
      .select(LIFECYCLE_SELECT)
      .single()
    if (error) throw new Error(error.message)

    return NextResponse.json({ recommendation: data, created: true, refreshed: false }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.error("[recommendations:post]", error)
    return NextResponse.json({ error: "No pudimos guardar la recomendación." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
}
