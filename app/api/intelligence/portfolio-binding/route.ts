import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { assertPortfolioOrganizationAccess, listPortfolioOrganizations } from "@/lib/intelligence/portfolio-access"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BodySchema = z.object({
  organizationId: z.string().uuid(),
  identityId: z.string().uuid(),
})
const DeleteSchema = z.object({ organizationId: z.string().uuid() })

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  try {
    const organizations = await listPortfolioOrganizations(createAdminClient(), auth.user.id)
    return NextResponse.json({ organizations }, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.error("[portfolio-binding:get]", error)
    return NextResponse.json({ error: "No pudimos cargar la empresa vinculada." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const parsed = BodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Selecciona una organización y una identidad válidas." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const admin = createAdminClient()
  try {
    const access = await assertPortfolioOrganizationAccess(admin, auth.user.id, parsed.data.organizationId, true)
    if (!access.ok) {
      return NextResponse.json(
        { error: access.reason === "not_admin" ? "Sólo un administrador de la organización puede cambiar la empresa propia." : "No perteneces a esta organización." },
        { status: 403, headers: PRIVATE_NO_STORE_HEADERS },
      )
    }

    const { data: identity, error: identityError } = await admin
      .from("intelligence_company_identities")
      .select("id")
      .eq("id", parsed.data.identityId)
      .maybeSingle()
    if (identityError) throw new Error(identityError.message)
    if (!identity) return NextResponse.json({ error: "La identidad corporativa no existe." }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })

    const { error: bindingError } = await admin.rpc("set_intelligence_portfolio_binding", {
      p_organization_id: parsed.data.organizationId,
      p_identity_id: parsed.data.identityId,
      p_created_by: auth.user.id,
    })
    if (bindingError) throw new Error(bindingError.message)

    const organizations = await listPortfolioOrganizations(admin, auth.user.id)
    return NextResponse.json({ organizations }, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.error("[portfolio-binding:post]", error)
    return NextResponse.json({ error: "No pudimos vincular la empresa al portafolio." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
}

export async function DELETE(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const parsed = DeleteSchema.safeParse({ organizationId: url.searchParams.get("organizationId") ?? "" })
  if (!parsed.success) {
    return NextResponse.json({ error: "Selecciona una organización válida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const admin = createAdminClient()
  try {
    const access = await assertPortfolioOrganizationAccess(admin, auth.user.id, parsed.data.organizationId, true)
    if (!access.ok) return NextResponse.json({ error: "No tienes permisos para cambiar este portafolio." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })

    const { error } = await admin
      .from("intelligence_portfolio_bindings")
      .delete()
      .eq("organization_id", parsed.data.organizationId)
    if (error) throw new Error(error.message)

    const organizations = await listPortfolioOrganizations(admin, auth.user.id)
    return NextResponse.json({ organizations }, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.error("[portfolio-binding:delete]", error)
    return NextResponse.json({ error: "No pudimos desvincular la empresa." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
}
