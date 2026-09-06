import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { assertPortfolioOrganizationAccess } from "@/lib/intelligence/portfolio-access"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const EvidenceType = z.enum(["news", "data", "paper", "patent", "market", "regulation", "other"])
const PostSchema = z.object({
  organizationId: z.string().uuid(),
  ideaKey: z.string().trim().min(2).max(180),
  ideaTitle: z.string().trim().min(2).max(240),
  evidenceType: EvidenceType,
  title: z.string().trim().min(2).max(300),
  sourceUrl: z.string().trim().url().max(1200).optional().nullable(),
  note: z.string().trim().max(3000).optional().nullable(),
  observedAt: z.string().datetime({ offset: true }).optional().nullable(),
})

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const organizationId = url.searchParams.get("organizationId") ?? ""
  const ideaKey = (url.searchParams.get("ideaKey") ?? "").trim()
  if (!z.string().uuid().safeParse(organizationId).success || !ideaKey) {
    return NextResponse.json({ error: "Organización o idea inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const admin = createAdminClient()
  const access = await assertPortfolioOrganizationAccess(admin, auth.user.id, organizationId)
  if (!access.ok) return NextResponse.json({ error: "No perteneces a esta organización." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })

  const { data, error } = await admin
    .from("intelligence_idea_evidence")
    .select("id,idea_key,idea_title,evidence_type,title,source_url,note,observed_at,created_at")
    .eq("user_id", auth.user.id)
    .eq("organization_id", organizationId)
    .eq("idea_key", ideaKey)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("[idea-evidence:get]", error)
    return NextResponse.json({ error: "No pudimos cargar la evidencia agregada." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json({ evidence: data ?? [] }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const parsed = PostSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Revisa el tipo de evidencia, título y enlace." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const admin = createAdminClient()
  const access = await assertPortfolioOrganizationAccess(admin, auth.user.id, parsed.data.organizationId)
  if (!access.ok) return NextResponse.json({ error: "No perteneces a esta organización." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })

  const sourceUrl = parsed.data.sourceUrl?.trim() || null
  if (sourceUrl) {
    const { data: existing } = await admin
      .from("intelligence_idea_evidence")
      .select("id")
      .eq("user_id", auth.user.id)
      .eq("organization_id", parsed.data.organizationId)
      .eq("idea_key", parsed.data.ideaKey)
      .eq("source_url", sourceUrl)
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ ok: true, duplicate: true, evidenceId: existing.id }, { headers: PRIVATE_NO_STORE_HEADERS })
    }
  }

  const { data, error } = await admin
    .from("intelligence_idea_evidence")
    .insert({
      user_id: auth.user.id,
      organization_id: parsed.data.organizationId,
      idea_key: parsed.data.ideaKey,
      idea_title: parsed.data.ideaTitle,
      evidence_type: parsed.data.evidenceType,
      title: parsed.data.title,
      source_url: sourceUrl,
      note: parsed.data.note?.trim() || null,
      observed_at: parsed.data.observedAt ?? null,
    })
    .select("id,idea_key,idea_title,evidence_type,title,source_url,note,observed_at,created_at")
    .single()

  if (error || !data) {
    console.error("[idea-evidence:post]", error)
    return NextResponse.json({ error: "No pudimos guardar esta evidencia." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json({ ok: true, duplicate: false, evidence: data }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS })
}
