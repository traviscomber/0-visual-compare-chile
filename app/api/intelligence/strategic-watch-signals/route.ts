import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { scanStrategicWatch, type StrategicWatch } from "@/lib/intelligence/strategic-watch-scanner"
import { buildWeeklyBriefContext, type WeeklyBriefContext } from "@/lib/intelligence/weekly-brief"
import { buildStrategicSearchIntent, readStrategicQueryAliases, readStrategicSearchScope } from "@/lib/intelligence/search-intent"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ReviewSchema = z.object({ watchId: z.string().uuid().optional() })

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const { data: watches, error: watchError } = await auth.supabase
    .from("intelligence_watches")
    .select("id,watch_type,query,is_active,created_at,last_checked_at,last_reviewed_at,metadata")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(10)

  if (watchError) {
    console.error("[strategic-watch-signals:watches]", watchError)
    return NextResponse.json({ error: "No pudimos cargar las vigilancias estratégicas." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const admin = createAdminClient()
  const active = (watches ?? []) as StrategicWatch[]
  const contextQueries = active.flatMap(watch => {
    const intent = buildStrategicSearchIntent(watch.query, readStrategicSearchScope(watch.metadata), readStrategicQueryAliases(watch.metadata))
    return [intent.canonicalQuery, ...intent.aliases]
  })
  const contextPromise = buildWeeklyBriefContext(admin)
    .then(context => scopeWeeklyBriefContext(context, contextQueries))

  if (!active.length) {
    const context = await contextPromise
    return NextResponse.json({ signals: [], watches: 0, summary: emptySummary(), context }, { headers: PRIVATE_NO_STORE_HEADERS })
  }

  const scanStartedAt = new Date().toISOString()
  const [groups, context] = await Promise.all([
    Promise.all(active.map(async watch => ({ watch, signals: await scanStrategicWatch(admin, watch) }))),
    contextPromise,
  ])
  const rows = groups.flatMap(({ watch, signals }) => signals.map(signal => ({
    user_id: auth.user.id,
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

  if (rows.length) {
    const { error: upsertError } = await auth.supabase
      .from("intelligence_watch_events")
      .upsert(rows, { onConflict: "user_id,watch_id,signal_key", ignoreDuplicates: false })
    if (upsertError) console.error("[strategic-watch-signals:upsert]", upsertError)
  }

  const scanCompletedAt = new Date().toISOString()
  const firstScanIds = active.filter(watch => !watch.last_checked_at).map(watch => watch.id)
  if (firstScanIds.length) {
    const { error: baselineError } = await auth.supabase
      .from("intelligence_watches")
      .update({ last_reviewed_at: scanCompletedAt, updated_at: scanCompletedAt })
      .in("id", firstScanIds)
    if (baselineError) console.error("[strategic-watch-signals:baseline]", baselineError)
  }

  const { error: checkedError } = await auth.supabase
    .from("intelligence_watches")
    .update({ last_checked_at: scanCompletedAt, updated_at: scanCompletedAt })
    .in("id", active.map(item => item.id))
  if (checkedError) console.error("[strategic-watch-signals:checked]", checkedError)

  const { data: history, error: historyError } = await auth.supabase
    .from("intelligence_watch_events")
    .select("id,watch_id,signal_key,source_key,event_type,title,summary,source_url,occurred_at,relevance,payload,first_seen_at,last_seen_at")
    .in("watch_id", active.map(item => item.id))
    .order("first_seen_at", { ascending: false })
    .limit(150)

  if (historyError) {
    console.error("[strategic-watch-signals:history]", historyError)
    return NextResponse.json({ error: "No pudimos construir la línea de tiempo estratégica." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const watchMap = new Map(active.map(watch => [watch.id, watch]))
  const signals = (history ?? []).map(row => {
    const watch = watchMap.get(String(row.watch_id))
    const isFirstScan = !watch?.last_checked_at
    const reviewedAt = watch?.last_reviewed_at
    const isNew = !isFirstScan && (reviewedAt ? new Date(String(row.first_seen_at)).getTime() > new Date(reviewedAt).getTime() : true)
    return {
      ...row,
      watch_query: watch?.query ?? "Vigilancia estratégica",
      watch_type: watch?.watch_type ?? "technology",
      is_new: isNew,
    }
  }).sort((a, b) => {
    if (a.is_new !== b.is_new) return a.is_new ? -1 : 1
    const relevance = rank(String(b.relevance)) - rank(String(a.relevance))
    if (relevance) return relevance
    return new Date(String(b.first_seen_at)).getTime() - new Date(String(a.first_seen_at)).getTime()
  })

  const newSignals = signals.filter(item => item.is_new)
  const summary = {
    new_count: newSignals.length,
    high_new_count: newSignals.filter(item => item.relevance === "alta").length,
    total_history: signals.length,
    patent_new_count: newSignals.filter(item => item.event_type === "patent").length,
    trademark_new_count: newSignals.filter(item => item.event_type === "trademark").length,
    publication_new_count: newSignals.filter(item => item.event_type === "publication").length,
    news_new_count: newSignals.filter(item => item.event_type === "news").length,
  }

  return NextResponse.json({ signals, watches: active.length, summary, context }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const parsed = ReviewSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: "Revisión inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const reviewedAt = new Date().toISOString()
  let query = auth.supabase
    .from("intelligence_watches")
    .update({ last_reviewed_at: reviewedAt, updated_at: reviewedAt })
    .eq("is_active", true)
  if (parsed.data.watchId) query = query.eq("id", parsed.data.watchId)

  const { error } = await query
  if (error) {
    console.error("[strategic-watch-signals:review]", error)
    return NextResponse.json({ error: "No pudimos guardar la revisión estratégica." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json({ ok: true, reviewed_at: reviewedAt }, { headers: PRIVATE_NO_STORE_HEADERS })
}

function emptySummary() {
  return { new_count: 0, high_new_count: 0, total_history: 0, patent_new_count: 0, trademark_new_count: 0, publication_new_count: 0, news_new_count: 0 }
}

function rank(value: string) { return value === "alta" ? 3 : value === "media" ? 2 : 1 }

function scopeWeeklyBriefContext(context: WeeklyBriefContext, queries: string[]): WeeklyBriefContext {
  const tokens = profileTokens(queries)
  if (!tokens.length) {
    return {
      ...context,
      change_detection: {
        ...context.change_detection,
        events_7d: 0,
        strategic_changes_7d: 0,
        last_observed_at: null,
      },
      strategic_changes: [],
      observed_changes: [],
      recent_activity: [],
    }
  }

  const strategicChanges = context.strategic_changes.filter(item => matchesTokens(tokens, [
    item.subject_name,
    item.title,
    item.observed_fact,
    item.interpretation,
    item.why_it_matters,
    ...item.classification_codes,
    ...item.evidence.flatMap(evidence => [evidence.title, evidence.summary ?? ""]),
  ]))
  const observedChanges = context.observed_changes.filter(item => matchesTokens(tokens, [
    item.title,
    item.summary ?? "",
    ...item.changed_fields,
  ]))
  const recentActivity = context.recent_activity.filter(item => matchesTokens(tokens, [
    item.title,
    item.actor ?? "",
  ]))
  const lastObservedAt = [
    ...strategicChanges.map(item => item.last_observed_at),
    ...observedChanges.map(item => item.observed_at),
  ].filter(Boolean).sort().at(-1) ?? null

  return {
    ...context,
    change_detection: {
      ...context.change_detection,
      events_7d: observedChanges.length,
      strategic_changes_7d: strategicChanges.length,
      last_observed_at: lastObservedAt,
    },
    strategic_changes: strategicChanges,
    observed_changes: observedChanges,
    recent_activity: recentActivity,
  }
}

function profileTokens(queries: string[]) {
  const stopwords = new Set(["para", "como", "desde", "sobre", "entre", "hacia", "with", "from", "that", "this", "technology", "tecnologia", "empresa", "empresas"])
  return [...new Set(queries
    .flatMap(query => normalizeText(query).split(/\s+/))
    .filter(token => token.length >= 4 && !stopwords.has(token)))]
}

function matchesTokens(tokens: string[], values: string[]) {
  const haystack = normalizeText(values.join(" "))
  return tokens.some(token => haystack.includes(token))
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}
