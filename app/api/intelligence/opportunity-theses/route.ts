import { createHash } from "node:crypto"
import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { assertPortfolioOrganizationAccess } from "@/lib/intelligence/portfolio-access"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ScoreSchema = z.object({
  strategic_fit: z.number().int().min(0).max(100),
  capability_reuse: z.number().int().min(0).max(100),
  novelty: z.number().int().min(0).max(100),
  timing: z.number().int().min(0).max(100),
  evidence_strength: z.number().int().min(0).max(100),
  defensibility: z.number().int().min(0).max(100),
  overall: z.number().int().min(0).max(100),
})

const ThesisSchema = z.object({
  name: z.string().trim().min(2).max(180),
  one_line: z.string().trim().min(2).max(700),
  target_buyer: z.string().trim().min(2).max(500),
  problem: z.string().trim().min(2).max(900),
  product_shape: z.string().trim().min(2).max(900),
  wedge: z.string().trim().min(2).max(900),
  unfair_advantage: z.string().trim().min(2).max(900),
  why_now: z.string().trim().min(2).max(1800),
  contrarian_reason: z.string().trim().min(2).max(1200),
  second_order_effect: z.string().trim().min(2).max(1200),
  capability_reuse: z.array(z.string().trim().min(1).max(300)).min(2).max(8),
  observed_signals: z.array(z.string().trim().min(1).max(1000)).max(10),
  assumptions: z.array(z.string().trim().min(1).max(700)).max(6),
  disconfirming_signals: z.array(z.string().trim().min(1).max(700)).max(6),
  moat: z.string().trim().min(2).max(1000),
  first_experiments: z.array(z.string().trim().min(1).max(700)).min(1).max(4),
  watch_triggers: z.array(z.string().trim().min(1).max(700)).min(1).max(5),
  research_queries: z.array(z.string().trim().min(2).max(180)).min(1).max(3),
  missing_evidence: z.array(z.string().trim().min(1).max(700)).max(6),
  evidence_state: z.enum(["observed", "mixed", "hypothesis"]),
  decision: z.enum(["build", "investigate", "watch", "reject"]),
  confidence: z.number().min(0).max(1),
  scores: ScoreSchema,
})

const ContextSchema = z.object({
  website: z.object({ canonicalUrl: z.string().url().max(500), pagesRead: z.number().int().min(1).max(10) }),
  signals: z.object({
    searches: z.number().int().min(0).max(1000),
    watches: z.number().int().min(0).max(1000),
    events: z.number().int().min(0).max(10000).optional().default(0),
    recommendations: z.number().int().min(0).max(1000),
  }),
  generatedAt: z.string().datetime(),
})

const PromoteSchema = z.object({
  organizationId: z.string().uuid(),
  model: z.string().trim().min(1).max(120),
  thesis: ThesisSchema,
  context: ContextSchema,
})

const ListSchema = z.object({ organizationId: z.string().uuid() })

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const parsed = ListSchema.safeParse({ organizationId: new URL(request.url).searchParams.get("organizationId") ?? "" })
  if (!parsed.success) {
    return NextResponse.json({ error: "Organización inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const admin = createAdminClient()
  const access = await assertPortfolioOrganizationAccess(admin, auth.user.id, parsed.data.organizationId)
  if (!access.ok) return NextResponse.json({ error: "No perteneces a esta organización." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })

  const [{ data: theses, error: thesesError }, { data: history, error: historyError }] = await Promise.all([
    admin
      .from("innovation_opportunity_theses")
      .select("id,title,status,decision,evidence_state,confidence,overall_score,evidence_strength,timing_score,research_queries,watch_triggers,thesis,source_website_url,source_generated_at,model,last_researched_at,created_at,updated_at")
      .eq("organization_id", parsed.data.organizationId)
      .order("overall_score", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(100),
    admin
      .from("innovation_opportunity_research_runs")
      .select("id,opportunity_id,run_type,evidence_summary,score_snapshot,confidence,observed_at,created_at")
      .eq("organization_id", parsed.data.organizationId)
      .order("observed_at", { ascending: false })
      .limit(1000),
  ])

  if (thesesError) {
    console.error("[opportunity-theses:list]", thesesError)
    return NextResponse.json({ error: "No pudimos cargar las tesis guardadas." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (historyError) {
    console.error("[opportunity-theses:history]", historyError)
    return NextResponse.json({ error: "No pudimos cargar el historial de convicción." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const historyByOpportunity = new Map<string, Array<Record<string, unknown>>>()
  for (const row of history ?? []) {
    const key = String(row.opportunity_id)
    const bucket = historyByOpportunity.get(key) ?? []
    if (bucket.length < 20) bucket.push(row as Record<string, unknown>)
    historyByOpportunity.set(key, bucket)
  }

  return NextResponse.json({
    opportunities: (theses ?? []).map((thesis) => ({
      ...thesis,
      research_history: historyByOpportunity.get(String(thesis.id)) ?? [],
    })),
  }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const parsed = PromoteSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "La tesis no cumple el contrato de persistencia." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const admin = createAdminClient()
  const access = await assertPortfolioOrganizationAccess(admin, auth.user.id, parsed.data.organizationId)
  if (!access.ok) return NextResponse.json({ error: "No perteneces a esta organización." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })

  const { thesis, context } = parsed.data
  const dedupeKey = thesisDedupeKey(parsed.data.organizationId, thesis)

  const { data: existing, error: existingError } = await admin
    .from("innovation_opportunity_theses")
    .select("id,status,updated_at")
    .eq("organization_id", parsed.data.organizationId)
    .eq("dedupe_key", dedupeKey)
    .maybeSingle()

  if (existingError) {
    console.error("[opportunity-theses:dedupe]", existingError)
    return NextResponse.json({ error: "No pudimos verificar si la tesis ya estaba guardada." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (existing) {
    return NextResponse.json({ opportunity: existing, created: false }, { headers: PRIVATE_NO_STORE_HEADERS })
  }

  const row = {
    organization_id: parsed.data.organizationId,
    created_by: auth.user.id,
    dedupe_key: dedupeKey,
    title: thesis.name,
    status: "exploring",
    source_website_url: context.website.canonicalUrl,
    source_generated_at: context.generatedAt,
    model: parsed.data.model,
    decision: thesis.decision,
    evidence_state: thesis.evidence_state,
    confidence: thesis.confidence,
    overall_score: thesis.scores.overall,
    evidence_strength: thesis.scores.evidence_strength,
    timing_score: thesis.scores.timing,
    strategic_fit: thesis.scores.strategic_fit,
    capability_reuse_score: thesis.scores.capability_reuse,
    novelty_score: thesis.scores.novelty,
    defensibility_score: thesis.scores.defensibility,
    research_queries: thesis.research_queries,
    watch_triggers: thesis.watch_triggers,
    thesis,
    context_summary: {
      website: context.website,
      signals: context.signals,
      promotion: "explicit_user_action",
    },
    last_researched_at: thesis.observed_signals.some((signal) => signal.includes("Investigación automática VIDENTIA") || signal.includes("Probe “"))
      ? context.generatedAt
      : null,
  }

  const { data: created, error: createError } = await admin
    .from("innovation_opportunity_theses")
    .insert(row)
    .select("id,title,status,decision,evidence_state,confidence,overall_score,evidence_strength,timing_score,created_at")
    .single()

  if (createError || !created) {
    if (createError?.code === "23505") {
      const { data: raced } = await admin
        .from("innovation_opportunity_theses")
        .select("id,status,updated_at")
        .eq("organization_id", parsed.data.organizationId)
        .eq("dedupe_key", dedupeKey)
        .maybeSingle()
      if (raced) return NextResponse.json({ opportunity: raced, created: false }, { headers: PRIVATE_NO_STORE_HEADERS })
    }
    console.error("[opportunity-theses:create]", createError)
    return NextResponse.json({ error: "No pudimos guardar la tesis." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const { error: snapshotError } = await admin.from("innovation_opportunity_research_runs").insert({
    opportunity_id: created.id,
    organization_id: parsed.data.organizationId,
    run_type: "generated",
    research_queries: thesis.research_queries,
    evidence_summary: {
      observed_signals: thesis.observed_signals,
      missing_evidence: thesis.missing_evidence,
      disconfirming_signals: thesis.disconfirming_signals,
      context: context.signals,
    },
    score_snapshot: thesis.scores,
    confidence: thesis.confidence,
    observed_at: context.generatedAt,
    created_by: auth.user.id,
  })

  if (snapshotError) console.warn("[opportunity-theses:snapshot] thesis saved but initial history snapshot failed", snapshotError)

  return NextResponse.json({ opportunity: created, created: true }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS })
}

function thesisDedupeKey(organizationId: string, thesis: z.infer<typeof ThesisSchema>) {
  const identity = [organizationId, thesis.name, thesis.target_buyer, thesis.product_shape]
    .map((value) => value.toLowerCase().replace(/\s+/g, " ").trim())
    .join("\u0000")
  return createHash("sha256").update(identity).digest("hex")
}
