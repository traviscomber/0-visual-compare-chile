import { NextResponse } from "next/server"
import { PRIVATE_NO_STORE_HEADERS, requireUser } from "@/lib/auth/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const limitValue = Number(searchParams.get("limit") ?? "20")
  const limit = Number.isFinite(limitValue) ? Math.min(100, Math.max(1, Math.floor(limitValue))) : 20

  const { data, error } = await auth.supabase
    .from("search_history")
    .select("id, query, search_type, results_count, source, match_mode, status, duration_ms, error_code, cached, metadata, created_at")
    .eq("user_id", auth.user.id)
    .eq("source", "inapi-live")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[inapi/history] query error", error.message)
    return NextResponse.json(
      { error: "No fue posible cargar el historial de consultas.", code: "HISTORY_UNAVAILABLE" },
      { status: 500, headers: PRIVATE_NO_STORE_HEADERS },
    )
  }

  return NextResponse.json({ results: data ?? [], total: data?.length ?? 0 }, { headers: PRIVATE_NO_STORE_HEADERS })
}
