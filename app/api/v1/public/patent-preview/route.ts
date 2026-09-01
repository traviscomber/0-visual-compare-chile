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
const PUBLIC_SOURCE_HOST = "datos.gob.cl"

function previewHeaders(extra: Record<string, string> = {}) {
  return {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    ...extra,
  }
}

function publicSourceUrl(value: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol !== "https:" || url.hostname !== PUBLIC_SOURCE_HOST) return null
    return url.toString()
  } catch {
    return null
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

  const quota = await reservePublicDemoQuota(getPublicDemoIdentity(request.headers), "patent")
  if (!quota.ok) {
    return NextResponse.json(
      { error: "La vista preliminar de patentes no está disponible en este momento." },
      { status: 503, headers: previewHeaders() },
    )
  }

  const rateHeaders = getPublicDemoRateHeaders(quota)
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: "Ya utilizaste las consultas preliminares disponibles por esta hora.",
        code: "PREVIEW_LIMIT_REACHED",
        resetAt: quota.resetAt,
      },
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
      application_number: hit.applicationNumber,
      filing_date: hit.filingDate,
      source_url: publicSourceUrl(hit.sourceUrl),
      last_synced_at: hit.lastSyncedAt,
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
        coverage: {
          source_jurisdiction: "CL",
          source_host: PUBLIC_SOURCE_HOST,
          includes: ["application_number", "filing_date", "country", "status", "ipc", "source_url", "last_synced_at"],
          excludes: ["international_family_resolution", "citations", "patentability_conclusion", "fto_conclusion"],
        },
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
