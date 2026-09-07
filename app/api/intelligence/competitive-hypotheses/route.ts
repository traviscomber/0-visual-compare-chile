import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const DECISIONS = new Set(["accepted", "rejected"])

type EvidenceItem = {
  source?: unknown
  title?: unknown
  date?: unknown
  url?: unknown
  activity?: unknown
  directness?: unknown
}

type CorroborationRow = {
  id: string
  signal_event_id: string
  evidence_state: string | null
  new_nice_classes: number[] | null
  activity_types: string[] | null
  evidence: EvidenceItem[] | null
  source_coverage: Record<string, { available?: unknown; evidence_count?: unknown }> | null
  query_context: Record<string, unknown> | null
  completed_at: string | null
}

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const signalEventId = new URL(request.url).searchParams.get("signalEventId")?.trim() ?? ""
  if (!UUID_PATTERN.test(signalEventId)) return badRequest("Señal inválida.")

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("competitive_hypotheses")
    .select("id,signal_event_id,status,hypothesis,evidence_for,evidence_missing,evidence_against,decision_reason,decided_by,decided_at,created_at,updated_at")
    .eq("user_id", auth.user.id)
    .eq("signal_event_id", signalEventId)
    .maybeSingle()
  if (error) {
    console.error("[competitive-hypotheses:get]", error)
    return serverError("No pudimos cargar la hipótesis competitiva.")
  }
  return NextResponse.json({ hypothesis: data ? normalizeHypothesis(data) : null }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({})) as { signalEventId?: unknown }
  const signalEventId = typeof body.signalEventId === "string" ? body.signalEventId.trim() : ""
  if (!UUID_PATTERN.test(signalEventId)) return badRequest("Señal inválida.")

  const admin = createAdminClient()
  const { data: existing, error: existingError } = await admin
    .from("competitive_hypotheses")
    .select("id,signal_event_id,status,hypothesis,evidence_for,evidence_missing,evidence_against,decision_reason,decided_by,decided_at,created_at,updated_at")
    .eq("user_id", auth.user.id)
    .eq("signal_event_id", signalEventId)
    .maybeSingle()
  if (existingError) return serverError("No pudimos verificar la hipótesis existente.")
  if (existing) return NextResponse.json({ hypothesis: normalizeHypothesis(existing), reused: true }, { headers: PRIVATE_NO_STORE_HEADERS })

  const [{ data: corroboration, error: corroborationError }, { data: signal, error: signalError }] = await Promise.all([
    admin.from("trademark_expansion_corroborations")
      .select("id,signal_event_id,evidence_state,new_nice_classes,activity_types,evidence,source_coverage,query_context,completed_at")
      .eq("user_id", auth.user.id)
      .eq("signal_event_id", signalEventId)
      .maybeSingle(),
    admin.from("trademark_watch_signal_events")
      .select("id,mark_name,applicant_name,reason,event_date,source_url")
      .eq("user_id", auth.user.id)
      .eq("id", signalEventId)
      .maybeSingle(),
  ])
  if (corroborationError || signalError) {
    console.error("[competitive-hypotheses:source]", corroborationError || signalError)
    return serverError("No pudimos verificar la evidencia de origen.")
  }
  if (!corroboration || !signal) return NextResponse.json({ error: "La señal o su corroboración ya no está disponible." }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })
  if (corroboration.evidence_state !== "supporting_evidence") {
    return NextResponse.json({ error: "La corroboración todavía no es suficiente para formular una hipótesis competitiva." }, { status: 409, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const draft = buildDraft(corroboration as CorroborationRow, signal)
  const { data, error } = await admin.from("competitive_hypotheses").insert({
    user_id: auth.user.id,
    signal_event_id: signalEventId,
    corroboration_id: corroboration.id,
    status: "draft",
    hypothesis: draft.hypothesis,
    evidence_for: draft.evidenceFor,
    evidence_missing: draft.evidenceMissing,
    evidence_against: draft.evidenceAgainst,
    evidence_snapshot: draft.snapshot,
  }).select("id,signal_event_id,status,hypothesis,evidence_for,evidence_missing,evidence_against,decision_reason,decided_by,decided_at,created_at,updated_at").single()

  if (error) {
    if (error.code === "23505") {
      const { data: concurrent } = await admin.from("competitive_hypotheses")
        .select("id,signal_event_id,status,hypothesis,evidence_for,evidence_missing,evidence_against,decision_reason,decided_by,decided_at,created_at,updated_at")
        .eq("user_id", auth.user.id).eq("signal_event_id", signalEventId).maybeSingle()
      if (concurrent) return NextResponse.json({ hypothesis: normalizeHypothesis(concurrent), reused: true }, { headers: PRIVATE_NO_STORE_HEADERS })
    }
    console.error("[competitive-hypotheses:create]", error)
    return serverError("No pudimos formular la hipótesis competitiva.")
  }

  return NextResponse.json({ hypothesis: normalizeHypothesis(data), reused: false }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS })
}

export async function PATCH(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({})) as { id?: unknown; decision?: unknown; reason?: unknown }
  const id = typeof body.id === "string" ? body.id.trim() : ""
  const decision = typeof body.decision === "string" ? body.decision.trim() : ""
  const reason = typeof body.reason === "string" ? body.reason.trim() : ""
  if (!UUID_PATTERN.test(id) || !DECISIONS.has(decision) || reason.length < 4 || reason.length > 1200) {
    return badRequest("La decisión requiere una justificación breve y válida.")
  }

  const admin = createAdminClient()
  const decidedAt = new Date().toISOString()
  const { data, error } = await admin.from("competitive_hypotheses")
    .update({ status: decision, decision_reason: reason, decided_by: auth.user.id, decided_at: decidedAt, updated_at: decidedAt })
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .eq("status", "draft")
    .select("id,signal_event_id,status,hypothesis,evidence_for,evidence_missing,evidence_against,decision_reason,decided_by,decided_at,created_at,updated_at")
    .maybeSingle()
  if (error) {
    console.error("[competitive-hypotheses:decision]", error)
    return serverError("No pudimos guardar la decisión sobre la hipótesis.")
  }
  if (!data) return NextResponse.json({ error: "La hipótesis ya fue decidida o no existe." }, { status: 409, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ hypothesis: normalizeHypothesis(data) }, { headers: PRIVATE_NO_STORE_HEADERS })
}

function buildDraft(corroboration: CorroborationRow, signal: { mark_name: string | null; applicant_name: string | null; reason: string | null; event_date: string | null; source_url: string | null }) {
  const subject = cleanText(signal.applicant_name) || cleanText(signal.mark_name) || "el competidor observado"
  const classes = Array.isArray(corroboration.new_nice_classes) ? corroboration.new_nice_classes.filter(value => Number.isInteger(value) && value >= 1 && value <= 45) : []
  const activities = Array.isArray(corroboration.activity_types) ? corroboration.activity_types.filter(value => typeof value === "string").slice(0, 6) : []
  const evidenceFor = Array.isArray(corroboration.evidence) ? corroboration.evidence.flatMap(item => {
    const title = cleanText(item?.title)
    if (!title) return []
    return [{ source: cleanText(item.source) || "fuente externa", title, activity: cleanText(item.activity) || null, directness: item.directness === "direct" ? "direct" : "indirect", date: cleanText(item.date) || null, url: safeUrl(item.url) }]
  }).slice(0, 8) : []
  const coverage = corroboration.source_coverage && typeof corroboration.source_coverage === "object" ? Object.entries(corroboration.source_coverage).slice(0, 12).map(([source, value]) => ({ source, available: value?.available === true, evidenceCount: typeof value?.evidence_count === "number" ? Math.max(0, Math.round(value.evidence_count)) : 0 })) : []
  const unavailable = coverage.filter(item => !item.available).map(item => item.source)
  const evidenceMissing = [
    "Confirmar que la actividad observada corresponde a intención competitiva/comercial y no sólo a cobertura marcaria preventiva.",
    "Validar con evidencia humana o corporativa el alcance, mercado y timing de una eventual entrada o ampliación.",
    ...(unavailable.length ? [`Fuentes sin cobertura suficiente en esta corrida: ${unavailable.join(", ")}.`] : []),
  ]
  const evidenceAgainst: string[] = []
  const classText = classes.length ? `las clases Nice ${classes.join(", ")}` : "nuevas clases Nice"
  const activityText = activities.length ? ` y actividad independiente observada (${activities.join(", ")})` : " y evidencia independiente asociada"
  const hypothesis = `La expansión marcaria de ${subject} hacia ${classText}${activityText} podría corresponder a una ampliación competitiva de actividad. Es una hipótesis de trabajo: la evidencia observada no demuestra por sí sola intención comercial, lanzamiento ni entrada efectiva al mercado.`
  return {
    hypothesis,
    evidenceFor,
    evidenceMissing,
    evidenceAgainst,
    snapshot: {
      corroborationId: corroboration.id,
      evidenceState: corroboration.evidence_state,
      newNiceClasses: classes,
      activityTypes: activities,
      sourceCoverage: coverage,
      completedAt: corroboration.completed_at,
      signal: { markName: signal.mark_name, applicantName: signal.applicant_name, reason: signal.reason, eventDate: signal.event_date, sourceUrl: signal.source_url },
    },
  }
}

function normalizeHypothesis(row: Record<string, unknown>) {
  return {
    id: String(row.id ?? ""),
    signalEventId: String(row.signal_event_id ?? ""),
    status: row.status === "accepted" || row.status === "rejected" ? row.status : "draft",
    hypothesis: String(row.hypothesis ?? ""),
    evidenceFor: Array.isArray(row.evidence_for) ? row.evidence_for.slice(0, 8) : [],
    evidenceMissing: Array.isArray(row.evidence_missing) ? row.evidence_missing.filter(value => typeof value === "string").slice(0, 8) : [],
    evidenceAgainst: Array.isArray(row.evidence_against) ? row.evidence_against.filter(value => typeof value === "string").slice(0, 8) : [],
    decisionReason: typeof row.decision_reason === "string" ? row.decision_reason : null,
    decidedBy: typeof row.decided_by === "string" ? row.decided_by : null,
    decidedAt: typeof row.decided_at === "string" ? row.decided_at : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : null,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
  }
}

function cleanText(value: unknown) { return typeof value === "string" ? value.trim().slice(0, 300) : "" }
function safeUrl(value: unknown) { const text = cleanText(value); return /^https?:\/\//i.test(text) ? text : null }
function badRequest(error: string) { return NextResponse.json({ error }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS }) }
function serverError(error: string) { return NextResponse.json({ error }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS }) }
