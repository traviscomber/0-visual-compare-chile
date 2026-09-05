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
    const { data, error } = await admin.rpc("run_case_automation_sweep")
    if (error) throw new Error(error.message)

    const durationMs = Date.now() - startedAt
    const result = data && typeof data === "object" ? data : {}
    console.info("[cron/case-automation] sweep completed", {
      durationMs,
      ranAt: "ranAt" in result ? result.ranAt : new Date().toISOString(),
      reminders: "reminders" in result ? result.reminders : 0,
      priorityEscalations: "priorityEscalations" in result ? result.priorityEscalations : 0,
      actionDueReminders: "actionDueReminders" in result ? result.actionDueReminders : 0,
      actionOverdueEscalations: "actionOverdueEscalations" in result ? result.actionOverdueEscalations : 0,
      executiveUnassignedEscalations:
        "executiveUnassignedEscalations" in result ? result.executiveUnassignedEscalations : 0,
    })

    return NextResponse.json({ ok: true, durationMs, result: data })
  } catch (error) {
    console.error("[cron/case-automation] sweep failed", error)
    return NextResponse.json({ ok: false, durationMs: Date.now() - startedAt, error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
