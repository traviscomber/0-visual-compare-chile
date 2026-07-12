import { NextResponse } from "next/server"
import { searchTrademarkRecords } from "@/lib/trademark-records"
import type { SearchFilters } from "@/types/marca"

export const runtime = "nodejs"

const ALLOWED_SEARCH_TYPES = new Set(["nombre", "niza", "viena"] as const)

function parseFilters(searchParams: URLSearchParams): SearchFilters {
  const estado = searchParams.get("estado")
  const pais = searchParams.get("pais")?.trim()
  const fechaDesde = searchParams.get("fechaDesde")?.trim()
  const fechaHasta = searchParams.get("fechaHasta")?.trim()
  const niza = searchParams
    .get("niza")
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean)
  const viena = searchParams
    .get("viena")
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean)

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
  try {
    const url = new URL(request.url)
    const query = url.searchParams.get("q")?.trim() ?? ""
    const rawType = url.searchParams.get("type") ?? "nombre"
    if (!ALLOWED_SEARCH_TYPES.has(rawType as "nombre" | "niza" | "viena")) {
      return NextResponse.json({ error: "Invalid search type" }, { status: 400 })
    }

    const type = rawType as "nombre" | "niza" | "viena"
    const pageParam = url.searchParams.get("page")
    const limitParam = url.searchParams.get("limit")
    const page = pageParam ? Math.max(1, Math.floor(Number(pageParam) || 1)) : 1
    const limit = limitParam ? Math.max(1, Math.floor(Number(limitParam) || 10)) : 0
    const filters = parseFilters(url.searchParams)
    const startedAt = performance.now()
    const response = await searchTrademarkRecords({
      query,
      type,
      filters,
      page,
      limit,
    })
    const tiempo_ms = Math.round(performance.now() - startedAt)

    return NextResponse.json(
      {
        results: response.results,
        total: response.total,
        page: response.page,
        totalPages: response.totalPages,
        limit: response.limit,
        source: response.source,
        tiempo_ms,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] search api error", error)
    return NextResponse.json({ error: "Search request failed" }, { status: 500 })
  }
}
