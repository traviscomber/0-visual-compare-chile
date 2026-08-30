import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const QuerySchema = z.object({ q: z.string().trim().min(2).max(160) })

type CandidateRow = {
  id: string
  resolution_key: string
  identity_key: string
  canonical_name: string
  country: string | null
  resolution_confidence: number | string
  similarity_score: number | string
  activity_12m: number | string
}

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const parsed = QuerySchema.safeParse({ q: url.searchParams.get("q") ?? "" })
  if (!parsed.success) {
    return NextResponse.json({ error: "Ingresa una empresa o titular válido." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const { data, error } = await createAdminClient().rpc("search_company_identities", {
    p_query: parsed.data.q,
    p_limit: 8,
  })
  if (error) {
    console.error("[company-identities]", error)
    return NextResponse.json({ error: "No pudimos resolver la empresa." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const candidates = ((data ?? []) as CandidateRow[]).map(item => ({
    id: String(item.id),
    canonical_name: String(item.canonical_name),
    country: item.country ? String(item.country) : null,
    resolution_confidence: Number(item.resolution_confidence ?? 0),
    similarity_score: Number(item.similarity_score ?? 0),
    activity_12m: Number(item.activity_12m ?? 0),
  }))

  return NextResponse.json({ query: parsed.data.q, candidates }, { headers: PRIVATE_NO_STORE_HEADERS })
}
