import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authorization = request.headers.get("authorization")
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const startedAt = Date.now()
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc("run_intelligence_health_sweep", {
      p_context: "vercel_health_cron",
    })
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true, durationMs: Date.now() - startedAt, result: data })
  } catch (error) {
    console.error("[cron/intelligence-health] sweep failed", error)
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
