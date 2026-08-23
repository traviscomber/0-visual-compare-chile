import { NextResponse } from "next/server"
import { authenticateApiKey, getQuotaHeaders, logApiKeyUsage } from "@/lib/api/auth"
import { searchTrademarkRecords } from "@/lib/trademark-records"
import type { SearchFilters } from "@/types/marca"

export const runtime = "nodejs"

const ALLOWED_SEARCH_TYPES = new Set(["nombre", "niza", "viena"] as const)

function parseFilters(searchParams: URLSearchParams): SearchFilters {
  const estado = searchParams.get("estado")
  const pais = searchParams.get("pais")?.trim()
  const fechaDesde = searchParams.get("fechaDesde")?.trim()
  const fechaHasta = searchParams.get("fechaHasta")?.trim()
  const niza = searchParams.get("niza")?.split(",").map((item) => item.trim()).filter(Boolean)
  const viena = searchParams.get("viena")?.split(",").map((item) => item.trim()).filter(Boolean)

  return {
    estado: estado === "Registrada" || estado === "Pendiente" || estado === "Denegada" ? estado : undefined,
    pais: pais || undefined,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta || undefined,
    niza: niza?.length ? niza : undefined,
    viena: viena?.length ? viena : undefined,
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 })
  }

  const auth = await authenticateApiKey(authHeader.slice(7))
  if (!auth.ok) {
    const status = auth.reason === "quota_exceeded" ? 429 : auth.reason === "unavailable" ? 503 : 401
    return NextResponse.json(
      { error: auth.message, reason: auth.reason },
      {
        status,
        headers:
          auth.reason === "quota_exceeded" &&
          auth.quota_daily !== undefined &&
          auth.quota_monthly !== undefined &&
          auth.usage_today !== undefined &&
          auth.usage_month !== undefined
            ? getQuotaHeaders({
                quota_daily: auth.quota_daily,
                quota_monthly: auth.quota_monthly,
                usage_today: auth.usage_today,
                usage_month: auth.usage_month,
              })
            : undefined,
      },
    )
  }

  try {
    const url = new URL(request.url)
    const query = url.searchParams.get("q")?.trim() ?? ""
    const rawType = url.searchParams.get("type") ?? "nombre"
    if (!query) return NextResponse.json({ error: "Query is required" }, { status: 400 })
    if (!ALLOWED_SEARCH_TYPES.has(rawType as "nombre" | "niza" | "viena")) {
      return NextResponse.json({ error: "Invalid search type" }, { status: 400 })
    }

    const type = rawType as "nombre" | "niza" | "viena"
    const page = Math.max(1, Math.floor(Number(url.searchParams.get("page")) || 1))
    const limit = Math.min(100, Math.max(1, Math.floor(Number(url.searchParams.get("limit")) || 20)))
    const filters = parseFilters(url.searchParams)
    const startedAt = performance.now()
    const response = await searchTrademarkRecords({ query, type, filters, page, limit })
    const tiempo_ms = Math.round(performance.now() - startedAt)
    const context = auth.context

    await logApiKeyUsage({
      user_id: context.user_id,
      organization_id: context.organization_id,
      api_key_id: context.api_key_id,
      action: "trademark.search",
      metadata: { type, result_count: response.results.length, total: response.total },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          results: response.results,
          total: response.total,
          page: response.page,
          total_pages: response.totalPages,
          limit: response.limit,
          source: response.source,
          tiempo_ms,
        },
      },
      {
        status: 200,
        headers: getQuotaHeaders({
          quota_daily: context.quota_daily,
          quota_monthly: context.quota_monthly,
          usage_today: context.usage_today,
          usage_month: context.usage_month,
        }),
      },
    )
  } catch (error) {
    console.error("[trademark-search] failed", error)
    return NextResponse.json({ error: "Search request failed" }, { status: 500 })
  }
}
