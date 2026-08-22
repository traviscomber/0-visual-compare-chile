import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { searchPatentsLocal } from "@/lib/inapi/patent-search"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_QUERY_LENGTH = 160

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")?.trim() ?? ""
  const ipc = searchParams.get("ipc")?.trim() || null
  const limit = Math.min(Number(searchParams.get("limit") || 25) || 25, 100)

  if (query.length < 2) {
    return NextResponse.json({ error: "Ingresa al menos 2 caracteres.", code: "QUERY_TOO_SHORT" }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: `La consulta no puede superar ${MAX_QUERY_LENGTH} caracteres.`, code: "QUERY_TOO_LONG" }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (ipc && !/^[A-HY]\d{0,2}[A-Z]?\d*(?:\/\d*)?$/i.test(ipc)) {
    return NextResponse.json({ error: "Prefijo IPC inválido.", code: "INVALID_IPC" }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const startedAt = Date.now()
  try {
    const result = await searchPatentsLocal(query, ipc, limit)
    const durationMs = Date.now() - startedAt

    await auth.supabase.from("usage_logs").insert({
      user_id: auth.user.id,
      organization_id: null,
      action: "patent.search",
      metadata: { query, ipc, results_count: result.hits.length, duration_ms: durationMs, source: "inapi-open-data-local" },
    })

    return NextResponse.json({
      results: result.hits,
      total: result.hits.length,
      query,
      ipc,
      source: "inapi-open-data-local",
      newestSync: result.newestSync,
      durationMs,
      generatedAt: new Date().toISOString(),
    }, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.error("[patents/search] failed", error)
    return NextResponse.json({ error: "No pudimos consultar Patent Intelligence.", code: "PATENT_SEARCH_FAILED" }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
}
