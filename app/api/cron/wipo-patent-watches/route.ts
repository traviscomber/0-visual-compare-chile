import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { scanWipoPatentWatch, type WipoPatentWatchRow } from "@/lib/intelligence/wipo-patent-watch-scan"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()
  const startedAt = Date.now()
  const scanAt = new Date().toISOString()
  const { data, error } = await admin.from("patent_watches")
    .select("id,user_id,query,source_url,source_last_checked_at")
    .eq("source_type", "wipo_patentscope_rss")
    .eq("is_active", true)
    .not("source_url", "is", null)
    .order("source_last_checked_at", { ascending: true, nullsFirst: true })
    .limit(50)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  const watches = (data ?? []) as WipoPatentWatchRow[]
  const results = []

  for (let index = 0; index < watches.length; index += 4) {
    const batch = watches.slice(index, index + 4)
    const batchResults = await Promise.all(batch.map(watch => scanWipoPatentWatch(admin, watch, scanAt)))
    results.push(...batchResults)
  }

  const failed = results.filter(item => !item.ok)
  return NextResponse.json({
    ok: failed.length === 0,
    watches: watches.length,
    fetched: results.reduce((sum, item) => sum + item.fetched, 0),
    inserted: results.reduce((sum, item) => sum + item.inserted, 0),
    failed: failed.length,
    results,
    durationMs: Date.now() - startedAt,
  }, { status: failed.length ? 207 : 200 })
}
