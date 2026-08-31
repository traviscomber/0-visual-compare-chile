import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { assertPortfolioOrganizationAccess } from "@/lib/intelligence/portfolio-access"
import { recommendationPriority } from "@/lib/intelligence/recommendation-lifecycle"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ParamsSchema = z.object({ id: z.string().uuid() })

type ActionRow = {
  case_id: string
  item_id: string
  action_id: string
  case_created: boolean
  item_created: boolean
  action_created: boolean
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const params = ParamsSchema.safeParse(await context.params)
  if (!params.success) {
    return NextResponse.json({ error: "La recomendación no es válida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const admin = createAdminClient()
  try {
    const { data: recommendation, error: recommendationError } = await admin
      .from("intelligence_recommendations")
      .select("id,organization_id,status,classification,code,score,tier,headline,recommended_action,guardrail,factors,evidence,case_id,action_id")
      .eq("id", params.data.id)
      .maybeSingle()
    if (recommendationError) throw new Error(recommendationError.message)
    if (!recommendation) return NextResponse.json({ error: "La recomendación no existe." }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })

    const access = await assertPortfolioOrganizationAccess(admin, auth.user.id, String(recommendation.organization_id))
    if (!access.ok) return NextResponse.json({ error: "No perteneces a esta organización." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })

    if (recommendation.status === "converted_to_action" && recommendation.case_id && recommendation.action_id) {
      return NextResponse.json(
        { ok: true, caseId: recommendation.case_id, actionId: recommendation.action_id, href: `/casos/${recommendation.case_id}/equipo`, created: false },
        { headers: PRIVATE_NO_STORE_HEADERS },
      )
    }
    if (recommendation.status !== "accepted") {
      return NextResponse.json(
        { error: "Primero revisa y acepta la recomendación antes de convertirla en acción." },
        { status: 409, headers: PRIVATE_NO_STORE_HEADERS },
      )
    }

    const caseTitle = limitText(`Recomendación: ${recommendation.headline}`, 160)
    const contextQuery = limitText(`${recommendation.classification} ${recommendation.code} · ${recommendation.headline}`, 240)
    const actionTitle = limitText(String(recommendation.recommended_action), 240)
    const sourceTitle = limitText(String(recommendation.headline), 240)
    const sourceId = `recommendation:${recommendation.id}`

    const { data, error } = await auth.supabase.rpc("create_intelligence_action", {
      p_context_type: "company",
      p_context_query: contextQuery,
      p_case_title: caseTitle,
      p_item_type: "research",
      p_source_id: sourceId,
      p_source_title: sourceTitle,
      p_action_title: actionTitle,
      p_priority: recommendationPriority(String(recommendation.tier)),
      p_due_at: null,
      p_assigned_to: null,
      p_evidence: {
        origin: "recommendation_lifecycle",
        recommendationId: recommendation.id,
        classification: recommendation.classification,
        code: recommendation.code,
        score: recommendation.score,
        tier: recommendation.tier,
        guardrail: recommendation.guardrail,
        factors: recommendation.factors,
        evidence: recommendation.evidence,
      },
    })
    if (error) {
      console.error("[recommendations:action:create]", { code: error.code, message: error.message })
      return NextResponse.json({ error: "No pudimos crear la acción." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
    }

    const row = (Array.isArray(data) ? data[0] : data) as ActionRow | null
    if (!row?.case_id || !row.action_id) {
      return NextResponse.json({ error: "No pudimos confirmar la acción creada." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
    }

    const now = new Date().toISOString()
    const { data: updated, error: updateError } = await admin
      .from("intelligence_recommendations")
      .update({
        status: "converted_to_action",
        converted_by: auth.user.id,
        converted_at: now,
        case_id: row.case_id,
        action_id: row.action_id,
        updated_at: now,
      })
      .eq("id", recommendation.id)
      .eq("status", "accepted")
      .select("id,status,discard_reason,case_id,action_id,updated_at")
      .maybeSingle()
    if (updateError) throw new Error(updateError.message)

    if (!updated) {
      const { data: latest, error: latestError } = await admin
        .from("intelligence_recommendations")
        .select("id,status,discard_reason,case_id,action_id,updated_at")
        .eq("id", recommendation.id)
        .maybeSingle()
      if (latestError) throw new Error(latestError.message)
      if (latest?.status === "converted_to_action" && latest.case_id) {
        return NextResponse.json({ ok: true, recommendation: latest, href: `/casos/${latest.case_id}/equipo`, created: false }, { headers: PRIVATE_NO_STORE_HEADERS })
      }
      return NextResponse.json({ error: "La recomendación cambió de estado. Actualiza la vista." }, { status: 409, headers: PRIVATE_NO_STORE_HEADERS })
    }

    return NextResponse.json(
      {
        ok: true,
        recommendation: updated,
        caseId: row.case_id,
        actionId: row.action_id,
        href: `/casos/${row.case_id}/equipo`,
        created: Boolean(row.case_created || row.item_created || row.action_created),
      },
      { status: row.action_created ? 201 : 200, headers: PRIVATE_NO_STORE_HEADERS },
    )
  } catch (error) {
    console.error("[recommendations:action]", error)
    return NextResponse.json({ error: "No pudimos convertir la recomendación en acción." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
}

function limitText(value: string, max: number) {
  return value.length <= max ? value : value.slice(0, max).trimEnd()
}
