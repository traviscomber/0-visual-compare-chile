import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { searchCrossrefWorks } from "@/lib/intelligence/crossref"
import { hasEpoOpsCredentials, searchEpoPatentFamilies } from "@/lib/intelligence/epo-ops"
import { probeGdeltRawFeed } from "@/lib/intelligence/gdelt-raw-feed"
import { searchGoogleNews } from "@/lib/intelligence/google-news"
import {
  failIntelligenceIngestion,
  finishIntelligenceIngestion,
  IntelligenceCircuitOpenError,
  startIntelligenceIngestion,
} from "@/lib/intelligence/ingestion-observability"
import { searchOpenAlexWorks } from "@/lib/intelligence/openalex"
import { scanStrategicWatch, type StrategicWatch } from "@/lib/intelligence/strategic-watch-scanner"
import { persistIntelligenceWatchEvents } from "@/lib/intelligence/watch-event-writer"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

type CronWatch = StrategicWatch & { user_id: string }
type ProbeResult = {
  source: string
  ok: boolean | null
  fetched: number
  blocking?: boolean
  error?: string
  blockedUntil?: string | null
  skipped?: string
  details?: Record<string, unknown>
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authorization = request.headers.get("authorization")
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const startedAt = Date.now()
  const scanStartedAt = new Date().toISOString()
  const admin = createAdminClient()

  try {
    const { data, error } = await admin
      .from("intelligence_watches")
      .select("id,user_id,watch_type,query,is_active,created_at,last_checked_at,last_reviewed_at,metadata")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(50)

    if (error) throw new Error(`Could not load active watches: ${error.message}`)
    const watches = (data ?? []) as CronWatch[]

    if (!watches.length) {
      return NextResponse.json({ ok: true, watches: 0, signals: 0, probes: [], durationMs: Date.now() - startedAt })
    }

    const probeQuery = watches.find(watch => watch.watch_type === "technology")?.query ?? watches[0].query
    const probesPromise = runSourceProbes(admin, probeQuery)

    const groups = [] as Array<{ watch: CronWatch; signals: Awaited<ReturnType<typeof scanStrategicWatch>> }>
    for (let index = 0; index < watches.length; index += 3) {
      const batch = watches.slice(index, index + 3)
      const scanned = await Promise.all(batch.map(async watch => ({
        watch,
        signals: await scanStrategicWatch(admin, watch),
      })))
      groups.push(...scanned)
    }

    const rows = groups.flatMap(({ watch, signals }) => signals.map(signal => ({
      user_id: watch.user_id,
      watch_id: watch.id,
      signal_key: signal.signal_key,
      source_key: signal.source_key,
      event_type: signal.event_type,
      title: signal.title,
      summary: signal.summary,
      source_url: signal.source_url,
      occurred_at: signal.occurred_at,
      relevance: signal.relevance,
      payload: signal.payload,
      last_seen_at: scanStartedAt,
      updated_at: scanStartedAt,
    })))

    if (rows.length) await persistIntelligenceWatchEvents(admin, rows)

    const baselineIds = watches.filter(watch => !watch.last_checked_at).map(watch => watch.id)
    if (baselineIds.length) {
      const { error: baselineError } = await admin
        .from("intelligence_watches")
        .update({ last_reviewed_at: scanStartedAt, updated_at: scanStartedAt })
        .in("id", baselineIds)
      if (baselineError) throw new Error(`Could not establish watch baselines: ${baselineError.message}`)
    }

    const { error: checkedError } = await admin
      .from("intelligence_watches")
      .update({ last_checked_at: scanStartedAt, updated_at: scanStartedAt })
      .in("id", watches.map(watch => watch.id))
    if (checkedError) throw new Error(`Could not update watch checkpoints: ${checkedError.message}`)

    const probes = await probesPromise
    const failedProbes = probes.filter(probe => probe.ok === false && probe.blocking !== false)

    return NextResponse.json({
      ok: failedProbes.length === 0,
      watches: watches.length,
      signals: rows.length,
      probes,
      durationMs: Date.now() - startedAt,
    }, { status: failedProbes.length ? 503 : 200 })
  } catch (error) {
    console.error("[cron/strategic-watches] sync failed", error)
    return NextResponse.json({
      ok: false,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

async function runSourceProbes(admin: ReturnType<typeof createAdminClient>, query: string): Promise<ProbeResult[]> {
  const now = new Date()
  const fromScience = new Date(now.getTime() - 30 * 86400000)
  const fromNews = new Date(now.getTime() - 7 * 86400000)

  const probes = await Promise.all([
    probeSource(admin, "openalex", async () => (await searchOpenAlexWorks(query, fromScience, now, 3)).length),
    probeSource(admin, "crossref", async () => (await searchCrossrefWorks(query, fromScience, now, 3)).length),
    probeSource(admin, "google_news_rss", async () => (await searchGoogleNews(query, fromNews, now, 3)).length),
  ])

  try {
    const raw = await probeGdeltRawFeed(now)
    probes.push({
      source: "gdelt_raw_feed",
      ok: true,
      fetched: 1,
      blocking: false,
      details: {
        lastUpdateStatus: raw.lastUpdateStatus,
        artifactStatus: raw.artifactStatus,
        artifactUrl: raw.artifactUrl,
        artifactBytes: raw.artifactBytes,
        artifactTimestamp: raw.artifactTimestamp,
        ageMinutes: raw.ageMinutes,
        sampleBytes: raw.sampleBytes,
        zipMagic: raw.zipMagic,
      },
    })
  } catch (error) {
    probes.push({
      source: "gdelt_raw_feed",
      ok: false,
      fetched: 0,
      blocking: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  if (hasEpoOpsCredentials()) {
    probes.push(await probeSource(admin, "epo_ops", async () => (await searchEpoPatentFamilies(query, 3)).length))
  } else {
    probes.push({ source: "epo_ops", ok: null, fetched: 0, skipped: "credentials_not_configured" })
  }

  return probes
}

async function probeSource(
  admin: ReturnType<typeof createAdminClient>,
  sourceKey: "openalex" | "crossref" | "google_news_rss" | "epo_ops",
  operation: () => Promise<number>,
): Promise<ProbeResult> {
  let ingestion: Awaited<ReturnType<typeof startIntelligenceIngestion>> | null = null
  try {
    ingestion = await startIntelligenceIngestion(admin, {
      sourceKey,
      runType: "on_demand",
      scope: { trigger: "vercel-cron", pipeline: "strategic-watches", purpose: "health-probe" },
    })
    const fetched = await operation()
    await finishIntelligenceIngestion(admin, {
      runId: ingestion.runId,
      sourceId: ingestion.sourceId,
      fetched,
      status: "completed",
      metadata: { pipeline: "strategic-watches", purpose: "health-probe" },
    })
    return { source: sourceKey, ok: true, fetched }
  } catch (error) {
    if (error instanceof IntelligenceCircuitOpenError) {
      return { source: sourceKey, ok: false, fetched: 0, error: error.message, blockedUntil: error.openUntil }
    }
    if (ingestion) {
      await failIntelligenceIngestion(admin, {
        runId: ingestion.runId,
        sourceId: ingestion.sourceId,
        error,
        metadata: { pipeline: "strategic-watches", purpose: "health-probe" },
      }).catch(healthError => console.error(`[cron/strategic-watches] ${sourceKey} health failure`, healthError))
    }
    return { source: sourceKey, ok: false, fetched: 0, error: error instanceof Error ? error.message : String(error) }
  }
}
