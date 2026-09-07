import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 120

const CLASS_EXPANSION_PREFIX = "Expansión competitiva Nice:"

type OwnerWatch = {
  id: string
  user_id: string
  query: string
  nice_classes: number[]
  last_checked_at: string | null
}

type TrademarkRecord = {
  id: string
  nombre: string
  solicitante: string | null
  numero_solicitud: string | null
  estado: string | null
  fecha_presentacion: string | null
  source_url: string | null
  trademark_record_niza: Array<{ code: string }> | null
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const startedAt = Date.now()
  const admin = createAdminClient()
  const { data: watchData, error: watchError } = await admin
    .from("trademark_watches")
    .select("id,user_id,query,nice_classes,last_checked_at")
    .eq("watch_type", "owner")
    .eq("is_active", true)
    .limit(200)

  if (watchError) return NextResponse.json({ ok: false, error: watchError.message }, { status: 500 })

  const watches = (watchData ?? []) as OwnerWatch[]
  if (!watches.length) {
    return NextResponse.json({ ok: true, watches: 0, events: 0, expansions: 0, durationMs: Date.now() - startedAt })
  }

  const scanStartedAt = new Date().toISOString()
  const since = new Date()
  since.setDate(since.getDate() - 180)
  const sinceDate = since.toISOString().slice(0, 10)
  let events = 0
  let expansions = 0
  let failedWatches = 0

  for (const watch of watches) {
    const escaped = watch.query.replace(/[%_]/g, "\\$&")
    const [recentResult, baselineResult] = await Promise.all([
      admin
        .from("trademark_records")
        .select("id,nombre,solicitante,numero_solicitud,estado,fecha_presentacion,source_url,trademark_record_niza(code)")
        .ilike("solicitante", `%${escaped}%`)
        .gte("fecha_presentacion", sinceDate)
        .order("fecha_presentacion", { ascending: false })
        .limit(120),
      admin
        .from("trademark_records")
        .select("id,trademark_record_niza(code)")
        .ilike("solicitante", `%${escaped}%`)
        .lt("fecha_presentacion", sinceDate)
        .order("fecha_presentacion", { ascending: false })
        .limit(1000),
    ])

    if (recentResult.error || baselineResult.error) {
      failedWatches += 1
      console.error("[trademark-owner-watches:scan]", {
        watchId: watch.id,
        recentError: recentResult.error,
        baselineError: baselineResult.error,
      })
      continue
    }

    const historicalNiceClasses = new Set<number>()
    let hasPriorOwnerFootprint = false
    for (const row of baselineResult.data ?? []) {
      const classes = extractNiceClasses((row.trademark_record_niza ?? []) as Array<{ code: string }>)
      if (classes.length) hasPriorOwnerFootprint = true
      for (const niceClass of classes) historicalNiceClasses.add(niceClass)
    }

    const candidates: Array<Record<string, unknown>> = []
    const rows = [...((recentResult.data ?? []) as TrademarkRecord[])]
      .sort((a, b) => String(a.fecha_presentacion ?? "").localeCompare(String(b.fecha_presentacion ?? "")))

    for (const row of rows) {
      const classes = extractNiceClasses(row.trademark_record_niza ?? [])
      const expansionClasses = hasPriorOwnerFootprint
        ? classes.filter(niceClass => !historicalNiceClasses.has(niceClass))
        : []
      const matchesConfiguredClasses = !watch.nice_classes.length || !classes.length || classes.some(item => watch.nice_classes.includes(item))

      if (!matchesConfiguredClasses && !expansionClasses.length) {
        for (const niceClass of classes) historicalNiceClasses.add(niceClass)
        if (classes.length) hasPriorOwnerFootprint = true
        continue
      }

      const previousClasses = [...historicalNiceClasses].sort((a, b) => a - b)
      const isClassExpansion = expansionClasses.length > 0
      if (isClassExpansion) expansions += 1

      candidates.push({
        user_id: watch.user_id,
        watch_id: watch.id,
        signal_key: `INAPI:${row.id}`,
        source: "INAPI",
        mark_name: row.nombre,
        applicant_name: row.solicitante,
        application_number: row.numero_solicitud,
        nice_classes: classes,
        event_date: row.fecha_presentacion,
        state: row.estado,
        source_url: row.source_url,
        relevance: isClassExpansion ? "alta" : "media",
        reason: isClassExpansion
          ? `${CLASS_EXPANSION_PREFIX} ${watch.query} incorpora por primera vez ${formatNiceClasses(expansionClasses)}. Historial previo observado: ${previousClasses.length ? formatNiceClasses(previousClasses) : "sin clases previas comparables"}.`
          : `Nueva actividad asociada al titular vigilado ${watch.query}.`,
        last_seen_at: scanStartedAt,
        updated_at: scanStartedAt,
      })

      for (const niceClass of classes) historicalNiceClasses.add(niceClass)
      if (classes.length) hasPriorOwnerFootprint = true
    }

    if (candidates.length) {
      const { error: upsertError } = await admin
        .from("trademark_watch_signal_events")
        .upsert(candidates, { onConflict: "user_id,watch_id,signal_key", ignoreDuplicates: false })

      if (upsertError) {
        failedWatches += 1
        console.error("[trademark-owner-watches:upsert]", { watchId: watch.id, error: upsertError })
        continue
      }
      events += candidates.length
    }

    if (!watch.last_checked_at) {
      const { error: baselineMarkError } = await admin
        .from("trademark_watches")
        .update({ last_reviewed_at: scanStartedAt })
        .eq("id", watch.id)
      if (baselineMarkError) console.error("[trademark-owner-watches:baseline]", { watchId: watch.id, error: baselineMarkError })
    }

    const { error: checkedError } = await admin
      .from("trademark_watches")
      .update({ last_checked_at: scanStartedAt, updated_at: scanStartedAt })
      .eq("id", watch.id)
    if (checkedError) console.error("[trademark-owner-watches:checked]", { watchId: watch.id, error: checkedError })
  }

  return NextResponse.json({
    ok: failedWatches === 0,
    watches: watches.length,
    events,
    expansions,
    failedWatches,
    durationMs: Date.now() - startedAt,
  }, { status: failedWatches === watches.length ? 500 : 200 })
}

function extractNiceClasses(rows: Array<{ code: string }>) {
  return Array.from(new Set(rows.map(item => Number(item.code)).filter(value => Number.isInteger(value) && value >= 1 && value <= 45)))
    .sort((a, b) => a - b)
}

function formatNiceClasses(classes: number[]) {
  if (!classes.length) return "sin clases"
  return `clase${classes.length === 1 ? "" : "s"} Nice ${classes.join(", ")}`
}
