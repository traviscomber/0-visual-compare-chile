import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { scanSeaSeiaCompanyWatches } from "@/lib/intelligence/sea-seia-watch"

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
    const admin = createAdminClient()
    const summary = await scanSeaSeiaCompanyWatches(admin)
    return NextResponse.json({ ok: true, ...summary, durationMs: Date.now() - startedAt })
  } catch (error) {
    console.error("[cron/sea-seia-watches] sync failed", error)
    return NextResponse.json({
      ok: false,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
