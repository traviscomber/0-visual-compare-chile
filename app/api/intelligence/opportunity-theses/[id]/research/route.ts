import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { OpportunityResearchError, researchPersistedOpportunity } from "@/lib/intelligence/opportunity-thesis-research"
import { assertPortfolioOrganizationAccess } from "@/lib/intelligence/portfolio-access"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const RequestSchema = z.object({ organizationId: z.string().uuid() })

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const { id } = await context.params
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Tesis u organización inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const admin = createAdminClient()
  const access = await assertPortfolioOrganizationAccess(admin, auth.user.id, parsed.data.organizationId)
  if (!access.ok) return NextResponse.json({ error: "No perteneces a esta organización." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })

  try {
    const result = await researchPersistedOpportunity({
      admin,
      organizationId: parsed.data.organizationId,
      opportunityId: id,
      actorUserId: auth.user.id,
      runType: "live_research",
    })
    return NextResponse.json(result, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    if (error instanceof OpportunityResearchError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status, headers: PRIVATE_NO_STORE_HEADERS })
    }
    console.error("[opportunity-theses:research]", error)
    return NextResponse.json({ error: "No pudimos re-investigar la tesis. La convicción no fue modificada." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
}
