import { NextResponse } from "next/server"
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
}

type Signal = {
  id: string
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

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const { data: watches, error: watchError } = await auth.supabase
    .from("trademark_watches")
    .select("id,watch_type,query,nice_classes,is_active,created_at,last_checked_at")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(25)

  if (watchError) {
    console.error("[trademark-watch-signals:watches]", watchError)
    return NextResponse.json({ error: "No pudimos cargar tus vigilancias." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const active = (watches ?? []) as Watch[]
  if (!active.length) return NextResponse.json({ signals: [], watches: 0 }, { headers: PRIVATE_NO_STORE_HEADERS })

  const admin = createAdminClient()
  const signals: Signal[] = []
  const since = new Date()
  since.setDate(since.getDate() - 120)
  const sinceDate = since.toISOString().slice(0, 10)

  for (const watch of active) {
    const escaped = watch.query.replace(/[%_]/g, "\\$&")
    const column = watch.watch_type === "owner" ? "solicitante" : "nombre"

    const { data: records, error: recordError } = await admin
      .from("trademark_records")
      .select("id,nombre,solicitante,numero_solicitud,estado,fecha_presentacion,source_url,trademark_record_niza(nice_class)")
      .ilike(column, `%${escaped}%`)
      .gte("fecha_presentacion", sinceDate)
      .order("fecha_presentacion", { ascending: false })
      .limit(8)

    if (recordError) {
      console.error("[trademark-watch-signals:inapi]", { watchId: watch.id, error: recordError })
    } else {
      for (const row of records ?? []) {
        const classes = Array.from(new Set(((row.trademark_record_niza ?? []) as Array<{ nice_class: number }>).map(item => Number(item.nice_class)).filter(Number.isFinite)))
        if (watch.nice_classes.length && classes.length && !classes.some(item => watch.nice_classes.includes(item))) continue
        const exact = normalize(row.nombre) === normalize(watch.query) || normalize(row.solicitante ?? "") === normalize(watch.query)
        signals.push({
          id: `inapi:${row.id}`,
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

    const tdpiColumn = watch.watch_type === "owner" ? "applicant_name" : "mark_name"
    const { data: tdpi, error: tdpiError } = await admin
      .from("tdpi_case_signals")
      .select("id,mark_name,applicant_name,application_number,nice_classes,source_date,procedural_state,source_url,confidence")
      .ilike(tdpiColumn, `%${escaped}%`)
      .order("source_date", { ascending: false, nullsFirst: false })
      .limit(8)

    if (tdpiError) {
      console.error("[trademark-watch-signals:tdpi]", { watchId: watch.id, error: tdpiError })
    } else {
      for (const row of tdpi ?? []) {
        const classes = Array.isArray(row.nice_classes) ? row.nice_classes.map(Number).filter(Number.isFinite) : []
        if (watch.nice_classes.length && classes.length && !classes.some(item => watch.nice_classes.includes(item))) continue
        const exact = normalize(row.mark_name ?? "") === normalize(watch.query) || normalize(row.applicant_name ?? "") === normalize(watch.query)
        signals.push({
          id: `tdpi:${row.id}`,
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
  }

  const unique = new Map<string, Signal>()
  for (const signal of signals) {
    const key = `${signal.source}:${signal.application_number ?? signal.id}:${signal.watch_id}`
    const current = unique.get(key)
    if (!current || (current.relevance === "media" && signal.relevance === "alta")) unique.set(key, signal)
  }

  const result = [...unique.values()]
    .sort((a, b) => {
      if (a.relevance !== b.relevance) return a.relevance === "alta" ? -1 : 1
      return String(b.event_date ?? "").localeCompare(String(a.event_date ?? ""))
    })
    .slice(0, 60)

  await auth.supabase
    .from("trademark_watches")
    .update({ last_checked_at: new Date().toISOString() })
    .in("id", active.map(item => item.id))

  return NextResponse.json({ signals: result, watches: active.length }, { headers: PRIVATE_NO_STORE_HEADERS })
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
