import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Watch = {
  id: string
  watch_type: "brand" | "owner"
  query: string
  nice_classes: number[]
  is_active: boolean
  created_at: string
  last_checked_at: string | null
  last_reviewed_at: string | null
}

type CandidateSignal = {
  signal_key: string
  source: "INAPI" | "TDPI"
  watch_id: string
  watch_query: string
  mark_name: string
  applicant_name: string | null
  application_number: string | null
  nice_classes: number[]
  event_date: string | null
  state: string | null
  source_url: string | null
  relevance: "alta" | "media"
  reason: string
}

type StoredSignal = {
  id: string
  signal_key: string
  source: "INAPI" | "TDPI"
  watch_id: string
  mark_name: string
  applicant_name: string | null
  application_number: string | null
  nice_classes: number[]
  event_date: string | null
  state: string | null
  source_url: string | null
  relevance: "alta" | "media"
  reason: string
  first_seen_at: string
  last_seen_at: string
}

const ReviewSchema = z.object({ watchId: z.string().uuid().optional() })

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const { data: watches, error: watchError } = await auth.supabase
    .from("trademark_watches")
    .select("id,watch_type,query,nice_classes,is_active,created_at,last_checked_at,last_reviewed_at")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(40)

  if (watchError) {
    console.error("[trademark-watch-signals:watches]", watchError)
    return NextResponse.json({ error: "No pudimos cargar tus vigilancias." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const active = (watches ?? []) as Watch[]
  if (!active.length) {
    return NextResponse.json({ signals: [], watches: 0, summary: emptySummary() }, { headers: PRIVATE_NO_STORE_HEADERS })
  }

  const admin = createAdminClient()
  const candidates: CandidateSignal[] = []
  const scanStartedAt = new Date().toISOString()
  const since = new Date()
  since.setDate(since.getDate() - 180)
  const sinceDate = since.toISOString().slice(0, 10)

  await Promise.all(active.map(async watch => {
    const escaped = watch.query.replace(/[%_]/g, "\\$&")
    const column = watch.watch_type === "owner" ? "solicitante" : "nombre"
    const tdpiColumn = watch.watch_type === "owner" ? "applicant_name" : "mark_name"

    const [inapiResult, tdpiResult] = await Promise.all([
      admin
        .from("trademark_records")
        .select("id,nombre,solicitante,numero_solicitud,estado,fecha_presentacion,source_url,trademark_record_niza(nice_class)")
        .ilike(column, `%${escaped}%`)
        .gte("fecha_presentacion", sinceDate)
        .order("fecha_presentacion", { ascending: false })
        .limit(12),
      admin
        .from("tdpi_case_signals")
        .select("id,mark_name,applicant_name,application_number,nice_classes,source_date,procedural_state,source_url,confidence")
        .ilike(tdpiColumn, `%${escaped}%`)
        .order("source_date", { ascending: false, nullsFirst: false })
        .limit(12),
    ])

    if (inapiResult.error) {
      console.error("[trademark-watch-signals:inapi]", { watchId: watch.id, error: inapiResult.error })
    } else {
      for (const row of inapiResult.data ?? []) {
        const classes = Array.from(new Set(((row.trademark_record_niza ?? []) as Array<{ nice_class: number }>).map(item => Number(item.nice_class)).filter(Number.isFinite)))
        if (watch.nice_classes.length && classes.length && !classes.some(item => watch.nice_classes.includes(item))) continue
        const exact = normalize(row.nombre) === normalize(watch.query) || normalize(row.solicitante ?? "") === normalize(watch.query)
        candidates.push({
          signal_key: `INAPI:${row.id}`,
          source: "INAPI",
          watch_id: watch.id,
          watch_query: watch.query,
          mark_name: row.nombre,
          applicant_name: row.solicitante,
          application_number: row.numero_solicitud,
          nice_classes: classes,
          event_date: row.fecha_presentacion,
          state: row.estado,
          source_url: row.source_url,
          relevance: exact ? "alta" : "media",
          reason: watch.watch_type === "owner"
            ? `Nueva actividad asociada al titular vigilado ${watch.query}.`
            : exact
              ? "La denominación coincide con la marca vigilada."
              : `La denominación contiene el término vigilado ${watch.query}.`,
        })
      }
    }

    if (tdpiResult.error) {
      console.error("[trademark-watch-signals:tdpi]", { watchId: watch.id, error: tdpiResult.error })
    } else {
      for (const row of tdpiResult.data ?? []) {
        const classes = Array.isArray(row.nice_classes) ? row.nice_classes.map(Number).filter(Number.isFinite) : []
        if (watch.nice_classes.length && classes.length && !classes.some(item => watch.nice_classes.includes(item))) continue
        const exact = normalize(row.mark_name ?? "") === normalize(watch.query) || normalize(row.applicant_name ?? "") === normalize(watch.query)
        candidates.push({
          signal_key: `TDPI:${row.id}`,
          source: "TDPI",
          watch_id: watch.id,
          watch_query: watch.query,
          mark_name: row.mark_name || "Marca no informada",
          applicant_name: row.applicant_name,
          application_number: row.application_number,
          nice_classes: classes,
          event_date: row.source_date,
          state: row.procedural_state,
          source_url: row.source_url,
          relevance: exact || Number(row.confidence ?? 0) >= 0.9 ? "alta" : "media",
          reason: watch.watch_type === "owner"
            ? `Movimiento TDPI relacionado con el titular vigilado ${watch.query}.`
            : exact
              ? "El asunto TDPI coincide con la marca vigilada."
              : `El asunto TDPI contiene el término vigilado ${watch.query}.`,
        })
      }
    }
  }))

  const unique = new Map<string, CandidateSignal>()
  for (const signal of candidates) {
    const key = `${signal.watch_id}:${signal.signal_key}`
    const current = unique.get(key)
    if (!current || (current.relevance === "media" && signal.relevance === "alta")) unique.set(key, signal)
  }

  const currentSignals = [...unique.values()]
  if (currentSignals.length) {
    const { error: upsertError } = await auth.supabase
      .from("trademark_watch_signal_events")
      .upsert(currentSignals.map(signal => ({
        user_id: auth.user.id,
        watch_id: signal.watch_id,
        signal_key: signal.signal_key,
        source: signal.source,
        mark_name: signal.mark_name,
        applicant_name: signal.applicant_name,
        application_number: signal.application_number,
        nice_classes: signal.nice_classes,
        event_date: signal.event_date,
        state: signal.state,
        source_url: signal.source_url,
        relevance: signal.relevance,
        reason: signal.reason,
        last_seen_at: scanStartedAt,
        updated_at: scanStartedAt,
      })), { onConflict: "user_id,watch_id,signal_key", ignoreDuplicates: false })

    if (upsertError) console.error("[trademark-watch-signals:history-upsert]", upsertError)
  }

  const firstScanIds = active.filter(watch => !watch.last_checked_at).map(watch => watch.id)
  if (firstScanIds.length) {
    const { error: baselineError } = await auth.supabase
      .from("trademark_watches")
      .update({ last_reviewed_at: scanStartedAt })
      .in("id", firstScanIds)
    if (baselineError) console.error("[trademark-watch-signals:baseline]", baselineError)
  }

  const { error: checkedError } = await auth.supabase
    .from("trademark_watches")
    .update({ last_checked_at: scanStartedAt })
    .in("id", active.map(item => item.id))
  if (checkedError) console.error("[trademark-watch-signals:checked]", checkedError)

  const { data: history, error: historyError } = await auth.supabase
    .from("trademark_watch_signal_events")
    .select("id,signal_key,source,watch_id,mark_name,applicant_name,application_number,nice_classes,event_date,state,source_url,relevance,reason,first_seen_at,last_seen_at")
    .in("watch_id", active.map(item => item.id))
    .order("first_seen_at", { ascending: false })
    .limit(100)

  if (historyError) {
    console.error("[trademark-watch-signals:history]", historyError)
    return NextResponse.json({ error: "No pudimos construir la línea de tiempo de vigilancia." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const watchMap = new Map(active.map(watch => [watch.id, watch]))
  const signals = ((history ?? []) as StoredSignal[]).map(row => {
    const watch = watchMap.get(row.watch_id)
    const reviewedAt = watch?.last_reviewed_at || (!watch?.last_checked_at ? scanStartedAt : null)
    return {
      ...row,
      watch_query: watch?.query ?? "Vigilancia",
      is_new: reviewedAt ? new Date(row.first_seen_at).getTime() > new Date(reviewedAt).getTime() : true,
    }
  }).sort((a, b) => {
    if (a.is_new !== b.is_new) return a.is_new ? -1 : 1
    if (a.relevance !== b.relevance) return a.relevance === "alta" ? -1 : 1
    return new Date(b.first_seen_at).getTime() - new Date(a.first_seen_at).getTime()
  })

  const newSignals = signals.filter(item => item.is_new)
  const summary = {
    new_count: newSignals.length,
    high_new_count: newSignals.filter(item => item.relevance === "alta").length,
    total_history: signals.length,
    inapi_new_count: newSignals.filter(item => item.source === "INAPI").length,
    tdpi_new_count: newSignals.filter(item => item.source === "TDPI").length,
  }

  return NextResponse.json({ signals, watches: active.length, summary }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const parsed = ReviewSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: "Revisión inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const reviewedAt = new Date().toISOString()
  let query = auth.supabase.from("trademark_watches").update({ last_reviewed_at: reviewedAt }).eq("is_active", true)
  if (parsed.data.watchId) query = query.eq("id", parsed.data.watchId)

  const { error } = await query
  if (error) {
    console.error("[trademark-watch-signals:review]", error)
    return NextResponse.json({ error: "No pudimos guardar la revisión." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json({ ok: true, reviewed_at: reviewedAt }, { headers: PRIVATE_NO_STORE_HEADERS })
}

function emptySummary() {
  return { new_count: 0, high_new_count: 0, total_history: 0, inapi_new_count: 0, tdpi_new_count: 0 }
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}
