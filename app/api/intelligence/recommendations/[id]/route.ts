import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { assertPortfolioOrganizationAccess } from "@/lib/intelligence/portfolio-access"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ParamsSchema = z.object({ id: z.string().uuid() })
const BodySchema = z.object({
  status: z.enum(["reviewed", "accepted", "discarded"]),
  reason: z.string().trim().max(500).optional(),
})

const SELECT = "id,status,discard_reason,case_id,action_id,updated_at"

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const params = ParamsSchema.safeParse(await context.params)
  const body = BodySchema.safeParse(await request.json().catch(() => null))
  if (!params.success || !body.success) {
    return NextResponse.json({ error: "La transición solicitada no es válida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (body.data.status === "discarded" && (body.data.reason?.length ?? 0) < 5) {
    return NextResponse.json({ error: "Explica brevemente por qué descartas la recomendación." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const admin = createAdminClient()
  try {
    const { data: current, error: currentError } = await admin
      .from("intelligence_recommendations")
      .select("id,organization_id,status,discard_reason,case_id,action_id,updated_at")
      .eq("id", params.data.id)
      .maybeSingle()
    if (currentError) throw new Error(currentError.message)
    if (!current) return NextResponse.json({ error: "La recomendación no existe." }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })

    const access = await assertPortfolioOrganizationAccess(admin, auth.user.id, String(current.organization_id))
    if (!access.ok) return NextResponse.json({ error: "No perteneces a esta organización." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })

    const currentStatus = String(current.status)
    const nextStatus = body.data.status
    if (currentStatus === nextStatus) {
      return NextResponse.json({ recommendation: current, changed: false }, { headers: PRIVATE_NO_STORE_HEADERS })
    }

    const allowed = (currentStatus === "new" && (nextStatus === "reviewed" || nextStatus === "discarded"))
      || (currentStatus === "reviewed" && (nextStatus === "accepted" || nextStatus === "discarded"))
    if (!allowed) {
      return NextResponse.json(
        { error: "La recomendación cambió de estado. Actualiza la vista antes de continuar." },
        { status: 409, headers: PRIVATE_NO_STORE_HEADERS },
      )
    }

    const now = new Date().toISOString()
    const patch: Record<string, unknown> = { status: nextStatus, updated_at: now }
    if (nextStatus === "reviewed") {
      patch.reviewed_by = auth.user.id
      patch.reviewed_at = now
      patch.discard_reason = null
    } else if (nextStatus === "accepted") {
      patch.accepted_by = auth.user.id
      patch.accepted_at = now
      patch.discard_reason = null
    } else {
      patch.discarded_by = auth.user.id
      patch.discarded_at = now
      patch.discard_reason = body.data.reason!.trim()
    }

    const { data, error } = await admin
      .from("intelligence_recommendations")
      .update(patch)
      .eq("id", current.id)
      .eq("status", currentStatus)
      .select(SELECT)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) {
      return NextResponse.json(
        { error: "La recomendación fue modificada por otra sesión. Actualiza la vista." },
        { status: 409, headers: PRIVATE_NO_STORE_HEADERS },
      )
    }

    return NextResponse.json({ recommendation: data, changed: true }, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.error("[recommendations:patch]", error)
    return NextResponse.json({ error: "No pudimos actualizar la recomendación." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
}
