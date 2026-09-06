import { NextResponse } from "next/server"
import { listPortfolioOrganizations } from "@/lib/intelligence/portfolio-access"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

const JUAN_EMAIL = "juan@n3uralia.com"
const REVIEW_THRESHOLD = 84
const CHILE_DELTA_CAP = 8
const MAX_ITEMS_PER_PRODUCT = 4

type EvidenceDirection = "strengthen" | "weaken" | "neutral"

type WatchRow = {
  id: string
  metadata: Record<string, unknown> | null
}

type EventRow = {
  id: string
  watch_id: string | null
  title: string
  summary: string | null
  source_key: string
  relevance: string
  source_url: string | null
  occurred_at: string | null
  last_seen_at: string | null
  payload: Record<string, unknown> | null
}

type RecommendationRow = {
  id: string
  product_key: string
  score: number
  status: "researching" | "ready_for_review" | "accepted" | "rejected"
  evidence_snapshot: Record<string, unknown> | null
}

type ChileEvidenceItem = {
  event_id: string
  watch_id: string
  title: string
  summary: string | null
  source: string
  relevance: string
  url: string | null
  date: string | null
  observed_at: string | null
  matched_query: string | null
  search_scope: string | null
  direction: EvidenceDirection
  delta: number
  reason: string
  term_hits: string[]
  chile_markers: string[]
}

const CHILE_TERMS: Record<string, string[]> = {
  motil: ["mineria", "codelco", "sernageomin", "mantenimiento", "faena", "sondaje", "geologia"],
  pescamar: ["salmon", "acuicultura", "pesca", "seafood", "sernapesca", "los lagos"],
  kumplio: ["direccion del trabajo", "cumplimiento", "laboral", "regulacion", "fiscalizacion", "ley"],
  chileflota: ["prt", "revision tecnica", "transporte", "vehiculo", "flota", "mtt", "camion"],
  "property-partners": ["inmobiliario", "vivienda", "propiedad", "tasacion", "valdivia", "mercado inmobiliario"],
  "black-swan": ["agricultura", "los rios", "valdivia", "riego", "cultivo", "agro", "campo"],
}

const CHILE_MARKERS = [
  "chile", "chileno", "chilena", "santiago", "valdivia", "los rios", "los lagos", "antofagasta", "atacama",
  "codelco", "sernageomin", "sernapesca", "direccion del trabajo", "mtt", "ministerio de transportes",
  "inapi", "sma", "snifa", "cmf", "mercado publico", "diario oficial",
]

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const startedAt = Date.now()
  const admin = createAdminClient()
  const { data: users, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (usersError) return NextResponse.json({ ok: false, error: "Could not resolve target user." }, { status: 500 })

  const juan = users.users.find(user => user.email?.trim().toLowerCase() === JUAN_EMAIL)
  if (!juan) return NextResponse.json({ ok: false, error: "Target user not found." }, { status: 404 })

  const organizations = await listPortfolioOrganizations(admin, juan.id).catch(() => [])
  const organization = organizations[0] ?? null
  if (!organization) return NextResponse.json({ ok: false, error: "Target organization not found." }, { status: 404 })

  const [watchesResult, recommendationsResult] = await Promise.all([
    admin.from("intelligence_watches")
      .select("id,metadata")
      .eq("user_id", juan.id)
      .eq("is_active", true),
    admin.from("intelligence_product_evolution_recommendations")
      .select("id,product_key,score,status,evidence_snapshot")
      .eq("user_id", juan.id)
      .eq("organization_id", organization.id),
  ])

  if (watchesResult.error) return NextResponse.json({ ok: false, error: watchesResult.error.message }, { status: 500 })
  if (recommendationsResult.error) return NextResponse.json({ ok: false, error: recommendationsResult.error.message }, { status: 500 })

  const productWatchIds = new Map<string, string[]>()
  for (const watch of (watchesResult.data ?? []) as WatchRow[]) {
    const metadata = watch.metadata && typeof watch.metadata === "object" && !Array.isArray(watch.metadata) ? watch.metadata : {}
    if (metadata.purpose !== "product_evolution_chile_evidence") continue
    const productKey = typeof metadata.product_key === "string" ? metadata.product_key : null
    if (!productKey) continue
    productWatchIds.set(productKey, [...(productWatchIds.get(productKey) ?? []), watch.id])
  }

  const allWatchIds = [...new Set([...productWatchIds.values()].flat())]
  const events: EventRow[] = []
  if (allWatchIds.length) {
    const { data, error } = await admin.from("intelligence_watch_events")
      .select("id,watch_id,title,summary,source_key,relevance,source_url,occurred_at,last_seen_at,payload")
      .eq("user_id", juan.id)
      .in("watch_id", allWatchIds)
      .order("last_seen_at", { ascending: false })
      .limit(1200)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    events.push(...((data ?? []) as EventRow[]))
  }

  const results: Array<Record<string, unknown>> = []
  for (const row of (recommendationsResult.data ?? []) as RecommendationRow[]) {
    const watchIds = new Set(productWatchIds.get(row.product_key) ?? [])
    const terms = CHILE_TERMS[row.product_key] ?? []
    const candidates = events
      .filter(event => event.watch_id && watchIds.has(event.watch_id))
      .map(event => classifyEvent(event, terms))
      .filter((item): item is ChileEvidenceItem => Boolean(item))
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || String(b.date ?? "").localeCompare(String(a.date ?? "")))
      .slice(0, MAX_ITEMS_PER_PRODUCT)

    const chileDelta = clamp(candidates.reduce((sum, item) => sum + item.delta, 0), -CHILE_DELTA_CAP, CHILE_DELTA_CAP)
    const supporting = candidates.filter(item => item.direction === "strengthen")
    const contradicting = candidates.filter(item => item.direction === "weaken")
    const neutral = candidates.filter(item => item.direction === "neutral")
    const chileState = classifyChileState(supporting.length, contradicting.length, neutral.length)

    const snapshot = { ...(row.evidence_snapshot ?? {}) } as Record<string, any>
    const conviction = { ...(snapshot.conviction ?? {}) }
    const base = numberOrZero(conviction.base)
    const paperDelta = numberOrZero(conviction.frontier_delta ?? conviction.paper_delta)
    const patentDelta = numberOrZero(conviction.patent_delta)
    const globalDelta = numberOrZero(conviction.global_delta)
    const effective = clamp(Math.round(base + paperDelta + patentDelta + globalDelta + chileDelta), 0, 100)
    const lockedDecision = row.status === "accepted" || row.status === "rejected"
    const nextStatus = lockedDecision ? row.status : effective >= REVIEW_THRESHOLD ? "ready_for_review" : "researching"

    snapshot.chile_signal = candidates[0] ?? null
    snapshot.chile_evidence = {
      state: chileState,
      delta: chileDelta,
      support_count: supporting.length,
      contradiction_count: contradicting.length,
      neutral_count: neutral.length,
      items: candidates,
      quality_gate: "Only events from the product-specific Chile watch with explicit Chile geography/institution markers are eligible. Neutral matches never change conviction.",
      note: "Low-relevance public news can contribute only a bounded delta when direction is explicit. Absence of Chile evidence remains neutral, never negative.",
      generated_at: new Date().toISOString(),
    }
    snapshot.conviction = {
      ...conviction,
      chile_delta: chileDelta,
      effective,
    }

    const { error: updateError } = await admin.from("intelligence_product_evolution_recommendations")
      .update({
        score: effective,
        status: nextStatus,
        evidence_snapshot: snapshot,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)

    if (updateError) {
      console.error(`[cron/juan-chile-evidence:${row.product_key}]`, updateError)
      results.push({ productKey: row.product_key, ok: false, error: updateError.message })
      continue
    }

    results.push({
      productKey: row.product_key,
      ok: true,
      chileState,
      chileDelta,
      evidenceItems: candidates.length,
      supporting: supporting.length,
      contradicting: contradicting.length,
      neutral: neutral.length,
      effective,
      status: nextStatus,
      humanDecisionPreserved: lockedDecision,
    })
  }

  return NextResponse.json({
    ok: true,
    scoreModel: "chile_evidence_v3.3",
    recommendations: results,
    durationMs: Date.now() - startedAt,
  })
}

function classifyEvent(event: EventRow, terms: string[]): ChileEvidenceItem | null {
  if (!event.watch_id) return null
  const payload = event.payload && typeof event.payload === "object" && !Array.isArray(event.payload) ? event.payload : {}
  const searchScope = typeof payload.search_scope === "string" ? payload.search_scope : null
  if (searchScope !== "chile") return null

  const text = normalize([event.title, event.summary].filter(Boolean).join(" "))
  const termHits = terms.filter(term => contains(text, term))
  if (!termHits.length) return null

  const chileMarkers = CHILE_MARKERS.filter(marker => contains(text, marker))
  const officialSource = Boolean(payload.official_source) || /inapi|bcn|cmf|diario_oficial|mercado_publico|snifa|sma|sernageomin|sernapesca/.test(normalize(event.source_key))
  if (!officialSource && !chileMarkers.length) return null

  const direction = classifyDirection(text)
  const relevanceWeight = event.relevance === "alta" ? 2 : event.relevance === "media" ? 1 : 0
  const provenanceWeight = officialSource ? 1 : 0
  const specificityWeight = termHits.length >= 2 ? 1 : 0
  const magnitude = Math.min(3, 1 + relevanceWeight + provenanceWeight + specificityWeight)
  const delta = direction === "strengthen" ? magnitude : direction === "weaken" ? -magnitude : 0
  const reason = direction === "strengthen"
    ? "Señal chilena específica con lenguaje explícito de adopción, expansión, inversión, implementación o crecimiento."
    : direction === "weaken"
      ? "Señal chilena específica con lenguaje explícito de caída, cancelación, prohibición, rechazo o contracción."
      : "Coincidencia chilena observada, pero sin dirección suficientemente explícita; queda como contexto y no modifica convicción."

  return {
    event_id: event.id,
    watch_id: event.watch_id,
    title: event.title,
    summary: event.summary,
    source: event.source_key,
    relevance: event.relevance,
    url: event.source_url,
    date: event.occurred_at ?? event.last_seen_at,
    observed_at: event.last_seen_at,
    matched_query: typeof payload.matched_query === "string" ? payload.matched_query : null,
    search_scope: searchScope,
    direction,
    delta,
    reason,
    term_hits: termHits,
    chile_markers: chileMarkers,
  }
}

function classifyDirection(text: string): EvidenceDirection {
  const weaken = /\b(cae|caida|disminuye|disminucion|contrae|contraccion|cancela|cancelacion|suspende|suspension|prohibe|prohibicion|rechaza|rechazo|retrocede|abandona|cierre|desacelera|decline|declines|cancel|cancels|ban|bans|reject|rejection|shutdown|contraction)\b/.test(text)
  const strengthen = /\b(crece|crecimiento|aumenta|aumento|expande|expansion|adopta|adopcion|invierte|inversion|licitacion|demanda|moderniza|modernizacion|digitaliza|digitalizacion|automatiza|automatizacion|implementa|implementacion|despliega|despliegue|lanza|lanzamiento|integra|integracion|renovacion|llega|llegada|amplia|ampliacion|grows|growth|expands|expansion|adopts|adoption|invests|investment|deploys|deployment|launches|launch|implements|implementation|integrates|integration)\b/.test(text)
  if (weaken && strengthen) return "neutral"
  if (weaken) return "weaken"
  if (strengthen) return "strengthen"
  return "neutral"
}

function classifyChileState(supporting: number, contradicting: number, neutral: number) {
  if (!supporting && !contradicting && !neutral) return "not_observed"
  if (supporting && contradicting) return "mixed_evidence"
  if (supporting) return "supporting_evidence"
  if (contradicting) return "contradicting_evidence"
  return "insufficient_evidence"
}

function contains(text: string, term: string) {
  const normalizedTerm = normalize(term)
  if (!normalizedTerm) return false
  return ` ${text} `.includes(` ${normalizedTerm} `) || text.includes(normalizedTerm)
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

function numberOrZero(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
