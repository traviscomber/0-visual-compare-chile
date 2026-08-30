import { NextRequest, NextResponse } from "next/server"
import { searchPatentsLocal } from "@/lib/inapi/patent-search"
import {
  getPublicDemoIdentity,
  getPublicDemoRateHeaders,
  reservePublicDemoQuota,
} from "@/lib/public-demo-rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_QUERY_LENGTH = 120
const PUBLIC_RESULT_LIMIT = 3

function previewHeaders(extra: Record<string, string> = {}) {
  return {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    ...extra,
  }
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? ""
  if (query.length < 2) {
    return NextResponse.json(
      { error: "Ingresa al menos 2 caracteres." },
      { status: 400, headers: previewHeaders() },
    )
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `La consulta no puede superar ${MAX_QUERY_LENGTH} caracteres.` },
      { status: 400, headers: previewHeaders() },
    )
  }

  const quota = await reservePublicDemoQuota(getPublicDemoIdentity(request.headers))
  if (!quota.ok) {
    return NextResponse.json(
      { error: "La vista preliminar de patentes no está disponible en este momento." },
      { status: 503, headers: previewHeaders() },
    )
  }

  const rateHeaders = getPublicDemoRateHeaders(quota)
  if (!quota.allowed) {
    return NextResponse.json(
      { error: "Ya utilizaste la vista preliminar disponible. Solicita acceso empresarial para continuar." },
      { status: 429, headers: previewHeaders(rateHeaders) },
    )
  }

  try {
    const result = await searchPatentsLocal(query, null, 25)
    const visible = result.hits.slice(0, PUBLIC_RESULT_LIMIT).map((hit) => ({
      title: hit.title,
      status: hit.status,
      country: hit.country,
      ipc: hit.ipc.slice(0, 4),
    }))

    return NextResponse.json(
      {
        query,
        results: visible,
        visible_count: visible.length,
        locked_count: Math.max(0, result.hits.length - visible.length),
        preview: true,
        source: "INAPI Open Data · VIDENTIA mirror",
        newest_sync: result.newestSync,
      },
      { headers: previewHeaders(rateHeaders) },
    )
  } catch (error) {
    console.error("[public-patent-preview] failed", error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: "No fue posible completar la vista preliminar de patentes." },
      { status: 500, headers: previewHeaders(rateHeaders) },
    )
  }
}
