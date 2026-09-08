import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { assertPortfolioOrganizationAccess } from "@/lib/intelligence/portfolio-access"
import { buildVidentiaImprovementSnapshot, hasMeaningfulAssistantBaseline, type VidentiaImprovementStatus } from "@/lib/intelligence/videntia-improvement-lifecycle"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ActionSchema = z.enum(["begin_research", "propose", "approve", "mark_implemented", "measure"])
const RequestSchema = z.object({
  improvementId: z.string().uuid(),
  organizationId: z.string().uuid(),
  action: ActionSchema,
  implementationRef: z.string().trim().min(3).max(500).optional(),
  note: z.string().trim().max(1000).optional(),
})

const EXPECTED_STATUS: Record<z.infer<typeof ActionSchema>, VidentiaImprovementStatus> = {
  begin_research: "detected",
  propose: "researching",
  approve: "proposed",
  mark_implemented: "approved",
  measure: "implemented",
}

const NEXT_STATUS: Record<z.infer<typeof ActionSchema>, VidentiaImprovementStatus> = {
  begin_research: "researching",
  propose: "proposed",
  approve: "approved",
  mark_implemented: "implemented",
  measure: "measured",
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  if (auth.user.email?.trim().toLowerCase() !== "juan@n3uralia.com") {
    return NextResponse.json({ error: "Este ciclo está reservado al propietario de Mi espacio." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const parsed = RequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Transición inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (parsed.data.action === "mark_implemented" && !parsed.data.implementationRef) {
    return NextResponse.json({ error: "Debes indicar PR, SHA, deployment u otra referencia verificable de implementación." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const admin = createAdminClient()
  const access = await assertPortfolioOrganizationAccess(admin, auth.user.id, parsed.data.organizationId)
  if (!access.ok) {
    return NextResponse.json({ error: "No perteneces a esta organización." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const { data: existing, error: loadError } = await admin
    .from("intelligence_videntia_improvements")
    .select("id,candidate_key,status")
    .eq("id", parsed.data.improvementId)
    .eq("user_id", auth.user.id)
    .eq("organization_id", parsed.data.organizationId)
    .maybeSingle()

  if (loadError || !existing) {
    return NextResponse.json({ error: "No encontramos esta mejora." }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const action = parsed.data.action
  if (existing.status !== EXPECTED_STATUS[action]) {
    return NextResponse.json({ error: `La mejora está en ${existing.status}; esta acción requiere ${EXPECTED_STATUS[action]}.` }, { status: 409, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const now = new Date().toISOString()
  const update: Record<string, unknown> = {
    status: NEXT_STATUS[action],
    last_actor_id: auth.user.id,
    transition_note: parsed.data.note?.trim() || transitionNote(action),
    updated_at: now,
  }

  if (action === "approve") {
    const baseline = await buildVidentiaImprovementSnapshot(auth.user.id, existing.candidate_key)
    if (existing.candidate_key === "assistant-effectiveness" && !hasMeaningfulAssistantBaseline(baseline)) {
      return NextResponse.json({ error: "Aún no hay muestra suficiente del Assistant para fijar una baseline: se requieren al menos 5 ejecuciones observadas." }, { status: 409, headers: PRIVATE_NO_STORE_HEADERS })
    }
    update.baseline_snapshot = baseline
    update.baseline_recorded_at = now
    update.approved_by = auth.user.id
    update.approved_at = now
    update.decision_note = parsed.data.note?.trim() || "Aprobada explícitamente desde Mi espacio con baseline canónica registrada."
  }

  if (action === "mark_implemented") {
    update.implementation_ref = parsed.data.implementationRef
    update.implemented_at = now
  }

  if (action === "measure") {
    const result = await buildVidentiaImprovementSnapshot(auth.user.id, existing.candidate_key)
    update.result_snapshot = result
    update.measured_at = now
    update.measurement_note = parsed.data.note?.trim() || "Medición posterior registrada desde fuentes canónicas; la interpretación de éxito o fracaso permanece humana."
  }

  const { data, error } = await admin
    .from("intelligence_videntia_improvements")
    .update(update)
    .eq("id", existing.id)
    .eq("user_id", auth.user.id)
    .eq("organization_id", parsed.data.organizationId)
    .eq("status", EXPECTED_STATUS[action])
    .select("id,candidate_key,status,baseline_snapshot,baseline_recorded_at,approved_at,implementation_ref,implemented_at,result_snapshot,measured_at,measurement_note,updated_at")
    .maybeSingle()

  if (error) {
    console.error("[videntia-improvement-transition]", error)
    return NextResponse.json({ error: "No pudimos registrar la transición." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (!data) {
    return NextResponse.json({ error: "La mejora cambió mientras se procesaba la transición. Recarga antes de continuar." }, { status: 409, headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json({ ok: true, improvement: data }, { headers: PRIVATE_NO_STORE_HEADERS })
}

function transitionNote(action: z.infer<typeof ActionSchema>) {
  return ({
    begin_research: "Investigación iniciada explícitamente por el propietario.",
    propose: "Investigación convertida explícitamente en propuesta para decisión.",
    approve: "Propuesta aprobada explícitamente por el propietario.",
    mark_implemented: "Implementación vinculada a una referencia verificable.",
    measure: "Medición posterior registrada sin inferir automáticamente éxito o fracaso.",
  } as const)[action]
}
