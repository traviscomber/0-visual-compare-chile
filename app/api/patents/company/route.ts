import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { getPatentCompanyIntelligence } from "@/lib/inapi/patent-intelligence"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_QUERY_LENGTH = 160

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const company = searchParams.get("q")?.trim() ?? ""

  if (company.length < 2) {
    return NextResponse.json({ error: "Ingresa al menos 2 caracteres.", code: "QUERY_TOO_SHORT" }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (company.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: `La empresa no puede superar ${MAX_QUERY_LENGTH} caracteres.`, code: "QUERY_TOO_LONG" }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const startedAt = Date.now()
  try {
    const profile = await getPatentCompanyIntelligence(company, 12)
    const durationMs = Date.now() - startedAt

    await auth.supabase.from("usage_logs").insert({
      user_id: auth.user.id,
      organization_id: null,
      action: "patent.company_intelligence",
      metadata: {
        query: company,
        matched: profile.matched,
        total_records: profile.portfolio.totalRecords,
        recent_filings_90d: profile.portfolio.recentFilings90d,
        technology_families: profile.portfolio.technologyFamilies,
        duration_ms: durationMs,
        source: "inapi-open-data-local",
      },
    })

    return NextResponse.json({ ...profile, durationMs, generatedAt: new Date().toISOString() }, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.error("[patents/company] failed", error)
    return NextResponse.json({ error: "No pudimos construir el perfil competitivo.", code: "PATENT_COMPANY_PROFILE_FAILED" }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
}