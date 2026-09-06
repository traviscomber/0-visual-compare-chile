import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { assertPortfolioOrganizationAccess } from "@/lib/intelligence/portfolio-access"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DecisionSchema = z.object({
  recommendationId: z.string().uuid(),
  organizationId: z.string().uuid(),
  decision: z.enum(["accepted", "rejected"]),
  note: z.string().trim().max(1000).optional().nullable(),
})

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  if (auth.user.email?.trim().toLowerCase() !== "juan@n3uralia.com") {
    return NextResponse.json({ error: "Esta decisión está reservada al propietario de esta bandeja." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const parsed = DecisionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Decisión inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const admin = createAdminClient()
  const access = await assertPortfolioOrganizationAccess(admin, auth.user.id, parsed.data.organizationId)
  if (!access.ok) {
    return NextResponse.json({ error: "No perteneces a esta organización." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const { data: existing, error: loadError } = await admin
    .from("intelligence_product_evolution_recommendations")
    .select("id,status,product_name,title")
    .eq("id", parsed.data.recommendationId)
    .eq("user_id", auth.user.id)
    .eq("organization_id", parsed.data.organizationId)
    .maybeSingle()

  if (loadError || !existing) {
    return NextResponse.json({ error: "No encontramos esta recomendación." }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const { data, error } = await admin
    .from("intelligence_product_evolution_recommendations")
    .update({
      status: parsed.data.decision,
      decision_note: parsed.data.note?.trim() || null,
      decision_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.recommendationId)
    .eq("user_id", auth.user.id)
    .eq("organization_id", parsed.data.organizationId)
    .select("id,status,decision_at")
    .single()

  if (error || !data) {
    console.error("[product-evolution-decision]", error)
    return NextResponse.json({ error: "No pudimos registrar tu decisión." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json({ ok: true, decision: data }, { headers: PRIVATE_NO_STORE_HEADERS })
}
