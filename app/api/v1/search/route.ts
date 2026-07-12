import { NextResponse } from "next/server"
import { API_PORTAL_MARCAS } from "@/lib/api-portal-data"
import { resetSearchEngine } from "@/lib/search-engine"
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

function matchesFilters(marca: (typeof API_PORTAL_MARCAS)[number], filters: SearchFilters) {
  if (filters.estado && marca.estado !== filters.estado) return false
  if (filters.pais && marca.pais !== filters.pais.toUpperCase()) return false
  if (filters.fechaDesde && new Date(marca.fecha) < new Date(filters.fechaDesde)) return false
  if (filters.fechaHasta && new Date(marca.fecha) > new Date(filters.fechaHasta)) return false
  if (filters.niza?.length && !filters.niza.some((item) => marca.niza.includes(item))) return false
  if (filters.viena?.length && !filters.viena.some((item) => marca.viena.includes(item))) return false
  return true
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

    const engine = resetSearchEngine(API_PORTAL_MARCAS)
    const startedAt = performance.now()
    const allResults = query
      ? engine.search({ query, type, filters })
      : API_PORTAL_MARCAS.filter((marca) => matchesFilters(marca, filters)).map((marca) => ({
          marca,
          relevancia: 0,
          matchType: "partial" as const,
        }))

    const total = allResults.length
    const isPaginated = limit > 0
    const totalPages = isPaginated ? Math.max(1, Math.ceil(total / limit)) : 1
    const from = isPaginated ? (page - 1) * limit : 0
    const results = isPaginated ? allResults.slice(from, from + limit) : allResults
    const tiempo_ms = Math.round(performance.now() - startedAt)

    return NextResponse.json(
      {
        results,
        total,
        page,
        totalPages,
        limit: isPaginated ? limit : total || 0,
        tiempo_ms,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] search api error", error)
    return NextResponse.json({ error: "Search request failed" }, { status: 500 })
  }
}
