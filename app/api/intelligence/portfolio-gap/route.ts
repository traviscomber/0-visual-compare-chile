import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { assertPortfolioOrganizationAccess } from "@/lib/intelligence/portfolio-access"
import { buildPortfolioGap } from "@/lib/intelligence/portfolio-gap"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

const QuerySchema = z.object({
  organizationId: z.string().uuid(),
  competitorIdentityId: z.string().uuid(),
})

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const parsed = QuerySchema.safeParse({
    organizationId: url.searchParams.get("organizationId") ?? "",
    competitorIdentityId: url.searchParams.get("competitorIdentityId") ?? "",
  })
  if (!parsed.success) {
    return NextResponse.json({ error: "Selecciona una organización y un competidor válidos." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
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
    if (!binding) {
      return NextResponse.json(
        { error: "Primero vincula la empresa propia de esta organización." },
        { status: 409, headers: PRIVATE_NO_STORE_HEADERS },
      )
    }

    if (String(binding.identity_id) === parsed.data.competitorIdentityId) {
      return NextResponse.json({ error: "Selecciona un competidor distinto de la empresa propia." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
    }

    const result = await buildPortfolioGap(admin, String(binding.identity_id), parsed.data.competitorIdentityId)
    return NextResponse.json(result, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.error("[portfolio-gap]", error)
    return NextResponse.json({ error: "No pudimos construir las brechas competitivas." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
}
