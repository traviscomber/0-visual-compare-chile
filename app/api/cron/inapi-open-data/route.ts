import { NextResponse } from "next/server"
import { syncCurrentYearInapiOpenData } from "@/lib/inapi/open-data-sync"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authorization = request.headers.get("authorization")

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const startedAt = Date.now()
  try {
    const summary = await syncCurrentYearInapiOpenData()
    return NextResponse.json({
      ok: true,
      durationMs: Date.now() - startedAt,
      ...summary,
    })
  } catch (error) {
    console.error("[cron/inapi-open-data] sync failed", error)
    return NextResponse.json(
      {
        ok: false,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
