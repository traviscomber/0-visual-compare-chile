import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { buildPatentPriorArtReview } from "@/lib/intelligence/patent-prior-art"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const QuerySchema = z.object({
  q: z.string().trim().min(3).max(240),
  ipc: z.string().trim().max(16).optional(),
  limit: z.coerce.number().int().min(5).max(50).default(30),
  includeGlobal: z.enum(["0", "1"]).default("0").transform(value => value === "1"),
})

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const parsed = QuerySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    ipc: url.searchParams.get("ipc") || undefined,
    limit: url.searchParams.get("limit") ?? 30,
    includeGlobal: url.searchParams.get("global") === "1" ? "1" : "0",
  })
  if (!parsed.success) return NextResponse.json({ error: "Consulta de prior art inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  if (parsed.data.ipc && !/^[A-HY]\d{0,2}[A-Z]?\d*(?:\/\d*)?$/i.test(parsed.data.ipc)) return NextResponse.json({ error: "Prefijo IPC inválido." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })

  const startedAt = Date.now()
  try {
    const review = await buildPatentPriorArtReview(parsed.data.q, parsed.data.ipc || null, parsed.data.limit, { includeGlobal: parsed.data.includeGlobal })
    await auth.supabase.from("usage_logs").insert({
      user_id: auth.user.id,
      organization_id: null,
      action: "patent.prior_art_review",
      metadata: {
        query: parsed.data.q,
        ipc: parsed.data.ipc || null,
        candidates: review.summary.total,
        close_review: review.summary.closeReview,
        strategy: review.searchStrategy,
        candidates_with_observed_changes: review.summary.candidatesWithObservedChanges,
        observed_change_events: review.summary.observedChanges,
        global_requested: parsed.data.includeGlobal,
        global_availability: review.globalEvidence.availability,
        global_families: review.globalEvidence.families.length,
        global_family_linked_candidates: review.summary.globalFamilyLinkedCandidates,
        duration_ms: Date.now() - startedAt,
      },
    })
    return NextResponse.json({ ...review, durationMs: Date.now() - startedAt }, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.error("[patents:prior-art]", error)
    return NextResponse.json({ error: "No pudimos construir la revisión de prior art." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
}
