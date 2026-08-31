import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { buildPatentPriorArtReview } from "@/lib/intelligence/patent-prior-art"
import { buildTechnologySignals } from "@/lib/intelligence/technology-signals"
import { resolvePrimaryBrandName } from "@/lib/comparison/context"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const CreateSchema = z.discriminatedUnion("vertical", [
  z.object({ vertical: z.literal("brand"), comparisonId: z.string().uuid(), organizationId: z.string().uuid().nullable().optional(), seriesId: z.string().uuid().nullable().optional() }),
  z.object({ vertical: z.literal("patent"), query: z.string().trim().min(3).max(240), ipc: z.string().trim().max(16).nullable().optional(), organizationId: z.string().uuid().nullable().optional(), seriesId: z.string().uuid().nullable().optional() }),
  z.object({ vertical: z.literal("technology"), query: z.string().trim().min(2).max(160), windowDays: z.number().int().min(30).max(730).default(180), organizationId: z.string().uuid().nullable().optional(), seriesId: z.string().uuid().nullable().optional() }),
])

type ReportPayload = {
  vertical: "brand" | "patent" | "technology"
  subject: string
  title: string
  periodStart: string | null
  periodEnd: string | null
  whatChanged: string[]
  whatMatters: string[]
  evidence: Array<Record<string, unknown>>
  recommendedReview: string[]
  watchNext: string[]
  sourceSnapshot: Record<string, unknown>
}

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const url = new URL(request.url)
  const vertical = url.searchParams.get("vertical")
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 60) || 60, 1), 100)

  let query = auth.supabase
    .from("intelligence_reports")
    .select("id,series_id,version,created_by,organization_id,vertical,subject,title,period_start,period_end,what_changed,what_matters,evidence,recommended_review,watch_next,source_snapshot,created_at")
    .order("created_at", { ascending: false })
    .limit(limit)
  if (vertical && ["brand", "patent", "technology"].includes(vertical)) query = query.eq("vertical", vertical)
  const { data, error } = await query
  if (error) {
    console.error("[intelligence-reports:get]", error)
    return NextResponse.json({ error: "No pudimos cargar los reportes." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
  return NextResponse.json({ reports: data ?? [] }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const parsed = CreateSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Solicitud de reporte inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })

  try {
    const payload = parsed.data.vertical === "brand"
      ? await buildBrandReport(auth, parsed.data.comparisonId)
      : parsed.data.vertical === "patent"
        ? await buildPatentReport(parsed.data.query, parsed.data.ipc || null)
        : await buildTechnologyReport(parsed.data.query, parsed.data.windowDays)

    const previous = await findPrevious(auth.supabase, payload.vertical, payload.subject, parsed.data.organizationId ?? null)
    payload.whatChanged = reportDiff(payload, previous?.source_snapshot as Record<string, unknown> | undefined)

    const { data, error } = await auth.supabase.rpc("create_intelligence_report_snapshot", {
      p_vertical: payload.vertical,
      p_subject: payload.subject,
      p_title: payload.title,
      p_what_changed: payload.whatChanged,
      p_what_matters: payload.whatMatters,
      p_evidence: payload.evidence,
      p_recommended_review: payload.recommendedReview,
      p_watch_next: payload.watchNext,
      p_source_snapshot: payload.sourceSnapshot,
      p_organization_id: parsed.data.organizationId ?? null,
      p_period_start: payload.periodStart,
      p_period_end: payload.periodEnd,
      p_series_id: parsed.data.seriesId ?? previous?.series_id ?? null,
    })
    if (error) {
      console.error("[intelligence-reports:create]", { code: error.code, message: error.message })
      const forbidden = /policy|permission|organization|series/i.test(error.message)
      return NextResponse.json({ error: forbidden ? "No tienes acceso para guardar este reporte." : "No pudimos guardar el reporte." }, { status: forbidden ? 403 : 500, headers: PRIVATE_NO_STORE_HEADERS })
    }
    const created = Array.isArray(data) ? data[0] : data
    if (!created?.id) return NextResponse.json({ error: "No pudimos confirmar el snapshot creado." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })

    const { data: report, error: readError } = await auth.supabase
      .from("intelligence_reports")
      .select("id,series_id,version,created_by,organization_id,vertical,subject,title,period_start,period_end,what_changed,what_matters,evidence,recommended_review,watch_next,source_snapshot,created_at")
      .eq("id", created.id)
      .single()
    if (readError) return NextResponse.json({ ok: true, id: created.id, seriesId: created.series_id, version: created.version }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS })
    return NextResponse.json({ ok: true, report }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.error("[intelligence-reports:build]", error)
    return NextResponse.json({ error: "No pudimos construir el reporte desde la evidencia actual." }, { status: 502, headers: PRIVATE_NO_STORE_HEADERS })
  }
}

export async function DELETE(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const id = new URL(request.url).searchParams.get("id") ?? ""
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Reporte inválido." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  const { data, error } = await auth.supabase.from("intelligence_reports").delete().eq("id", id).eq("created_by", auth.user.id).select("id").maybeSingle()
  if (error) return NextResponse.json({ error: "No pudimos eliminar el reporte." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  if (!data) return NextResponse.json({ error: "Reporte no encontrado o no editable por este usuario." }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS })
}

async function buildBrandReport(auth: Extract<Awaited<ReturnType<typeof requireUser>>, { ok: true }>, comparisonId: string): Promise<ReportPayload> {
  const { data: comparison, error } = await auth.supabase
    .from("comparisons")
    .select("id,similarity_score,classification,recommendation,brand_context,result_json,created_at")
    .eq("id", comparisonId)
    .eq("user_id", auth.user.id)
    .maybeSingle()
  if (error || !comparison) throw new Error("Brand comparison not found")

  const subject = resolvePrimaryBrandName(comparison as Parameters<typeof resolvePrimaryBrandName>[0]) || "Marca evaluada"
  const result = asObject(comparison.result_json)
  const report = asObject(result.informe)
  const registration = asObject(result.registrabilidad)
  const antecedents = asArray(registration.antecedentes).slice(0, 25).map(value => {
    const item = asObject(value)
    return { kind: "trademark_record", source: "INAPI", sourceRecordId: text(item.id), title: text(item.nombre), owner: text(item.solicitante), status: text(item.estado), classes: asArray(item.clases).map(String), relevance: numberOrNull(item.puntaje_relevancia) }
  })
  const summary = text(report.resumen_ejecutivo) || text(comparison.recommendation) || "Evaluación técnica persistida para revisión."
  const recommendations = stringArray(report.recomendaciones)
  const nextSteps = stringArray(report.proximos_pasos)

  return {
    vertical: "brand",
    subject,
    title: `Brand Intelligence · ${subject}`,
    periodStart: null,
    periodEnd: null,
    whatChanged: [],
    whatMatters: [summary, `Clasificación técnica persistida: ${comparison.classification || "sin clasificación"}.`],
    evidence: antecedents,
    recommendedReview: recommendations.length ? recommendations : [text(report.analisis_conflictos) || text(comparison.recommendation) || "Revisar evidencia oficial antes de una decisión."],
    watchNext: nextSteps.length ? nextSteps : [`Crear o revisar vigilancia para ${subject}.`],
    sourceSnapshot: { kind: "brand_comparison", comparisonId: comparison.id, classification: comparison.classification, similarityScore: comparison.similarity_score, evidenceIds: antecedents.map(item => item.sourceRecordId).filter(Boolean), sourceCreatedAt: comparison.created_at },
  }
}

async function buildPatentReport(query: string, ipc: string | null): Promise<ReportPayload> {
  const review = await buildPatentPriorArtReview(query, ipc, 30)
  const evidence = review.candidates.slice(0, 25).map(item => ({ kind: "patent_record", source: "INAPI Chile", sourceRecordId: item.id, applicationNumber: item.applicationNumber, title: item.title, applicant: item.applicants, status: item.status, country: item.country, ipc: item.ipc, filingDate: item.filingDate, priorities: item.priorityClaims, familyCandidate: item.familyCandidate, technicalScore: item.technicalScore, reviewLevel: item.reviewLevel, reasons: item.reasons, sourceUrl: item.sourceUrl }))
  const close = review.candidates.filter(item => item.reviewLevel === "close_review")
  return {
    vertical: "patent",
    subject: review.query,
    title: `Patent Intelligence · ${review.query}`,
    periodStart: null,
    periodEnd: null,
    whatChanged: [],
    whatMatters: [
      `${review.summary.total} candidatos observados; ${review.summary.closeReview} requieren revisión cercana según cobertura de conceptos técnicos.`,
      review.coverage.scope,
    ],
    evidence,
    recommendedReview: close.length ? close.slice(0, 8).map(item => `Revisar ${item.applicationNumber || item.id}: ${item.title}`) : ["No cerrar una conclusión de novedad con este corpus; ampliar cobertura y revisar IPC/prioridades."],
    watchNext: [`Crear watch de patente/IPC para “${review.query}”.`, ...review.coverage.limitations.slice(0, 2)],
    sourceSnapshot: { kind: "patent_prior_art", query: review.query, ipc: review.ipc, strategy: review.searchStrategy, candidateIds: review.candidates.map(item => item.id), closeReview: review.summary.closeReview, relevant: review.summary.relevant, familyCandidates: review.summary.familyCandidates, newestSync: review.coverage.newestSync },
  }
}

async function buildTechnologyReport(query: string, windowDays: number): Promise<ReportPayload> {
  const signals = await buildTechnologySignals(query, windowDays)
  const evidence = [
    ...signals.evidence.publications.slice(0, 12).map(item => ({ kind: "publication", source: item.source, sourceRecordId: item.sourceRecordId, title: item.title, date: item.date, url: item.url, citedByCount: item.citedByCount })),
    ...signals.evidence.patents.slice(0, 12).map(item => ({ kind: "patent_record", source: item.source, sourceRecordId: item.sourceRecordId, title: item.title, applicationNumber: item.applicationNumber, applicants: item.applicants, filingDate: item.filingDate, ipc: item.ipc, sourceUrl: item.sourceUrl })),
    ...signals.evidence.news.slice(0, 6).map(item => ({ kind: "context_news", source: item.source, sourceRecordId: item.sourceRecordId, title: item.title, date: item.date, url: item.url, domain: item.domain })),
  ]
  const observedAt = new Date(signals.observed_at)
  const periodEnd = Number.isNaN(observedAt.getTime()) ? null : observedAt.toISOString().slice(0, 10)
  const periodStart = periodEnd ? new Date(observedAt.getTime() - windowDays * 86400000).toISOString().slice(0, 10) : null
  const unavailable = Object.entries(signals.sources).filter(([, source]) => !source.available).map(([key]) => key)
  return {
    vertical: "technology",
    subject: signals.query,
    title: `Technology Intelligence · ${signals.query}`,
    periodStart,
    periodEnd,
    whatChanged: [],
    whatMatters: [signals.corroboration.conclusion, signals.corroboration.scope],
    evidence,
    recommendedReview: [
      `Revisar ${signals.patent_signal.recent_matches} patentes recientes y ${signals.momentum.current_publications ?? 0} publicaciones del período.`,
      unavailable.length ? `Repetir revisión cuando vuelvan las fuentes no disponibles: ${unavailable.join(", ")}.` : "Contrastar las señales fuertes con sus fuentes antes de una decisión.",
    ],
    watchNext: [`Mantener vigilancia de “${signals.query}” para detectar cambios entre períodos.`, "Separar investigación y patentes de noticias contextuales en cada revisión."],
    sourceSnapshot: { kind: "technology_signals", query: signals.query, windowDays, observedAt: signals.observed_at, trend: signals.momentum.trend, currentPublications: signals.momentum.current_publications, previousPublications: signals.momentum.previous_publications, changePercent: signals.momentum.change_percent, recentPatents: signals.patent_signal.recent_matches, corroboration: signals.corroboration.status, confidence: signals.corroboration.confidence, evidenceIds: evidence.map(item => item.sourceRecordId).filter(Boolean) },
  }
}

async function findPrevious(supabase: Extract<Awaited<ReturnType<typeof requireUser>>, { ok: true }>["supabase"], vertical: ReportPayload["vertical"], subject: string, organizationId: string | null) {
  const subjectKey = normalizeSubjectKey(subject)
  let query = supabase.from("intelligence_reports").select("series_id,version,source_snapshot,created_at").eq("vertical", vertical).eq("subject_key", subjectKey).order("created_at", { ascending: false }).limit(1)
  query = organizationId ? query.eq("organization_id", organizationId) : query.is("organization_id", null)
  const { data } = await query.maybeSingle()
  return data ?? null
}

function reportDiff(current: ReportPayload, previous?: Record<string, unknown>): string[] {
  if (!previous) return [`Baseline creado para ${current.subject}. No se presenta como cambio temporal hasta existir una versión anterior comparable.`]
  if (current.vertical === "patent") {
    const nowIds = new Set(asArray(current.sourceSnapshot.candidateIds).map(String))
    const oldIds = new Set(asArray(previous.candidateIds).map(String))
    const added = [...nowIds].filter(id => !oldIds.has(id)).length
    const removed = [...oldIds].filter(id => !nowIds.has(id)).length
    const closeDelta = Number(current.sourceSnapshot.closeReview || 0) - Number(previous.closeReview || 0)
    return [`${added} candidato${added === 1 ? "" : "s"} nuevo${added === 1 ? "" : "s"}; ${removed} dejó${removed === 1 ? "" : "aron"} de aparecer en el corte actual.`, `Cambio en revisión cercana: ${closeDelta >= 0 ? "+" : ""}${closeDelta}.`]
  }
  if (current.vertical === "technology") {
    return [`Tendencia: ${String(previous.trend || "sin base")} → ${String(current.sourceSnapshot.trend || "sin base")}.`, `Patentes recientes: ${Number(previous.recentPatents || 0)} → ${Number(current.sourceSnapshot.recentPatents || 0)}; publicaciones: ${Number(previous.currentPublications || 0)} → ${Number(current.sourceSnapshot.currentPublications || 0)}.`]
  }
  return [`Nueva evaluación comparada con la versión anterior: clasificación ${String(previous.classification || "sin dato")} → ${String(current.sourceSnapshot.classification || "sin dato")}.`]
}

function normalizeSubjectKey(value: string) { return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ") }
function asObject(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {} }
function asArray(value: unknown): unknown[] { return Array.isArray(value) ? value : [] }
function text(value: unknown) { return typeof value === "string" ? value.trim() : "" }
function numberOrNull(value: unknown) { const result = Number(value); return Number.isFinite(result) ? result : null }
function stringArray(value: unknown) { return asArray(value).map(text).filter(Boolean).slice(0, 20) }
