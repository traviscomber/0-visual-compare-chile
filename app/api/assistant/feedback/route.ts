import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { recordAssistantResponseFeedback } from "@/lib/intelligence/assistant-response-feedback"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const RequestSchema = z.object({
  executionId: z.string().uuid(),
  outcome: z.enum(["resolved", "partial", "not_resolved"]),
  issueReason: z.enum(["incorrect", "missing_evidence", "incomplete", "misunderstood", "needed_followup", "other"]).nullable().optional(),
}).superRefine((value, ctx) => {
  if (value.outcome === "resolved" && value.issueReason) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["issueReason"], message: "Una respuesta resuelta no puede registrar una causa de falla." })
  }
})

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const parsed = RequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Feedback inválido." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const result = await recordAssistantResponseFeedback({
    userId: auth.user.id,
    executionMetricId: parsed.data.executionId,
    outcome: parsed.data.outcome,
    issueReason: parsed.data.issueReason ?? null,
  })

  if (!result.ok && result.reason === "not_found") {
    return NextResponse.json({ error: "Ejecución no encontrada." }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (!result.ok) {
    return NextResponse.json({ error: "No pudimos registrar el feedback." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS })
}
