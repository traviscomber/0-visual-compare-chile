import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { fetchWipoPatentScopeRss } from "@/lib/intelligence/wipo-patentscope-rss"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

type WatchRow = {
  id: string
  user_id: string
  query: string
  source_url: string
  source_last_checked_at: string | null
}

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

  const watches = (data ?? []) as WatchRow[]
  const results: Array<{ watchId: string; ok: boolean; fetched: number; inserted: number; baseline: boolean; error?: string }> = []

  for (let index = 0; index < watches.length; index += 4) {
    const batch = watches.slice(index, index + 4)
    const batchResults = await Promise.all(batch.map(watch => scanWatch(admin, watch, scanAt)))
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

async function scanWatch(admin: ReturnType<typeof createAdminClient>, watch: WatchRow, scanAt: string) {
  const baseline = !watch.source_last_checked_at
  try {
    const feed = await fetchWipoPatentScopeRss(watch.source_url, 60)
    const ids = feed.items.map(item => item.sourceRecordId)
    const existing = new Set<string>()
    if (ids.length) {
      const { data, error } = await admin.from("patent_alert_events")
        .select("source_record_id")
        .eq("watch_id", watch.id)
        .eq("source_key", "wipo_patentscope_rss")
        .in("source_record_id", ids)
      if (error) throw new Error(`Could not read WIPO event baseline: ${error.message}`)
      for (const row of data ?? []) if (row.source_record_id) existing.add(row.source_record_id)
    }

    const fresh = feed.items.filter(item => !existing.has(item.sourceRecordId))
    if (fresh.length) {
      const { error } = await admin.from("patent_alert_events").insert(fresh.map(item => ({
        watch_id: watch.id,
        user_id: watch.user_id,
        patent_record_id: null,
        event_type: "wipo_publication_observed",
        title: item.title,
        application_number: item.publicationNumber,
        applicants: null,
        ipc_codes: [],
        filing_date: item.publicationDate,
        detected_at: scanAt,
        read_at: baseline ? scanAt : null,
        source_key: "wipo_patentscope_rss",
        source_record_id: item.sourceRecordId,
        source_url: item.url,
        source_date: item.publicationDate,
        metadata: { feed_url: feed.feedUrl, feed_title: feed.title, description: item.description },
      })))
      if (error) throw new Error(`Could not persist WIPO events: ${error.message}`)
    }

    const { error: checkpointError } = await admin.from("patent_watches").update({
      source_status: "available",
      source_last_error: null,
      source_last_checked_at: scanAt,
      last_checked_at: scanAt,
      updated_at: scanAt,
    }).eq("id", watch.id)
    if (checkpointError) throw new Error(`Could not checkpoint WIPO watch: ${checkpointError.message}`)

    return { watchId: watch.id, ok: true, fetched: feed.items.length, inserted: fresh.length, baseline }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await admin.from("patent_watches").update({
      source_status: "degraded",
      source_last_error: message.slice(0, 500),
      source_last_checked_at: scanAt,
      last_checked_at: scanAt,
      updated_at: scanAt,
    }).eq("id", watch.id)
    console.error("[cron/wipo-patent-watches]", { watchId: watch.id, error: message })
    return { watchId: watch.id, ok: false, fetched: 0, inserted: 0, baseline, error: message }
  }
}
