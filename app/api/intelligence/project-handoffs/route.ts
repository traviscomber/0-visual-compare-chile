import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { assertPortfolioOrganizationAccess } from "@/lib/intelligence/portfolio-access"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const QuerySchema = z.object({
  organizationId: z.string().uuid(),
  ideaKey: z.string().trim().min(2).max(180),
})

const DecisionSchema = QuerySchema.extend({
  decision: z.enum(["approve", "reject"]),
})

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const parsed = QuerySchema.safeParse({
    organizationId: url.searchParams.get("organizationId") ?? "",
    ideaKey: url.searchParams.get("ideaKey") ?? "",
  })
  if (!parsed.success) {
    return NextResponse.json({ error: "Organización o idea inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const admin = createAdminClient()
  const access = await assertPortfolioOrganizationAccess(admin, auth.user.id, parsed.data.organizationId)
  if (!access.ok) return NextResponse.json({ error: "No perteneces a esta organización." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })

  const { data, error } = await admin
    .from("intelligence_project_handoffs")
    .select("id,idea_key,idea_title,score,status,rationale,capability_summary,evidence_snapshot,created_at,updated_at")
    .eq("user_id", auth.user.id)
    .eq("organization_id", parsed.data.organizationId)
    .eq("idea_key", parsed.data.ideaKey)
    .maybeSingle()

  if (error) {
    console.error("[project-handoffs:get]", error)
    return NextResponse.json({ error: "No pudimos cargar el estudio del proyecto." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json({ handoff: data ?? null }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const parsed = DecisionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Decisión inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const admin = createAdminClient()
  const access = await assertPortfolioOrganizationAccess(admin, auth.user.id, parsed.data.organizationId)
  if (!access.ok) return NextResponse.json({ error: "No perteneces a esta organización." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })

  const { data: current, error: currentError } = await admin
    .from("intelligence_project_handoffs")
    .select("id,status,evidence_snapshot")
    .eq("user_id", auth.user.id)
    .eq("organization_id", parsed.data.organizationId)
    .eq("idea_key", parsed.data.ideaKey)
    .maybeSingle()

  if (currentError) {
    console.error("[project-handoffs:decision:load]", currentError)
    return NextResponse.json({ error: "No pudimos cargar el proyecto." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (!current) {
    return NextResponse.json({ error: "Este proyecto todavía no está listo para decisión." }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const nextStatus = parsed.data.decision === "approve" ? "accepted" : "closed"
  const previousSnapshot = current.evidence_snapshot && typeof current.evidence_snapshot === "object" && !Array.isArray(current.evidence_snapshot)
    ? current.evidence_snapshot as Record<string, unknown>
    : {}
  const decidedAt = new Date().toISOString()

  const { data, error } = await admin
    .from("intelligence_project_handoffs")
    .update({
      status: nextStatus,
      evidence_snapshot: {
        ...previousSnapshot,
        human_decision: {
          decision: parsed.data.decision,
          decided_at: decidedAt,
          decided_by: auth.user.email ?? auth.user.id,
          source: "human",
          sovereign: true,
        },
      },
      updated_at: decidedAt,
    })
    .eq("id", current.id)
    .eq("user_id", auth.user.id)
    .select("id,idea_key,idea_title,score,status,rationale,capability_summary,evidence_snapshot,created_at,updated_at")
    .single()

  if (error || !data) {
    console.error("[project-handoffs:decision:update]", error)
    return NextResponse.json({ error: "No pudimos registrar tu decisión." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json({ ok: true, handoff: data }, { headers: PRIVATE_NO_STORE_HEADERS })
}
