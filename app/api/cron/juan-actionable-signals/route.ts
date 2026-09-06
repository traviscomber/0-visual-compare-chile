import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 120

const POLICY_VERSION = "n3uralia-signal-policy-v1"
const PURPOSE = "product_evolution_chile_evidence"

type SignalType = "competitor" | "applicable_technology" | "product_opportunity" | "integration" | "threat" | "research_frontier"

type WatchRow = {
  id: string
  user_id: string
  query: string
  metadata: Record<string, unknown> | null
}

type EventRow = {
  id: string
  watch_id: string | null
  title: string
  summary: string | null
  source_key: string
  event_type: string
  relevance: string
  payload: Record<string, unknown> | null
  last_seen_at: string | null
}

const DOMAIN_TERMS: Record<string, string[]> = {
  motil: ["mineria", "minero", "faena", "codelco", "geologia", "sondaje", "mantenimiento"],
  pescamar: ["acuicultura", "salmon", "pesca", "seafood", "sernapesca", "planta de proceso"],
  kumplio: ["cumplimiento", "regulatorio", "regulacion", "laboral", "fiscalizacion", "auditoria"],
  chileflota: ["flota", "flotas", "vehiculo", "vehiculos", "transporte", "camion", "camiones", "telematica"],
  "property-partners": ["inmobiliario", "inmobiliaria", "propiedad", "propiedades", "tasacion", "valorizacion", "corredor"],
  "black-swan": ["agricultura", "agricola", "cultivo", "riego", "campo", "granja", "farm", "orchard"],
}

const CAPABILITY_TERMS = [
  "inteligencia artificial", "machine learning", "aprendizaje automatico", "ia", "ai", "software", "saas",
  "automatizacion", "automatizado", "agente", "agentic", "mcp", "workflow", "vision computacional", "computer vision",
  "analitica", "analytics", "predictivo", "predictiva", "prediccion", "telematica", "iot", "sensor", "sensores",
  "api", "integracion", "interoperabilidad", "scada", "erp", "datos", "data platform", "digital twin", "gemelo digital",
]

const INTEGRATION_TERMS = ["mcp", "api", "integracion", "interoperabilidad", "scada", "erp", "iot", "telematica", "conecta", "conectado", "workflow"]
const RESEARCH_TERMS = ["estudio", "investigacion", "paper", "universidad", "modelo", "algoritmo", "benchmark", "research"]
const COMPETITOR_TERMS = ["plataforma", "software", "solucion", "startup", "proveedor", "empresa", "lanza", "presenta", "ofrece", "desarrolla"]
const OPPORTUNITY_TERMS = ["demanda", "adopcion", "inversion", "licitacion", "brecha", "necesita", "crecimiento", "implementa", "despliega"]
const THREAT_TERMS = ["reemplaza", "sustituye", "desplaza", "competidor", "amenaza", "disrupcion", "captura mercado"]

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const startedAt = Date.now()
  const admin = createAdminClient()
  const { data: watchesData, error: watchesError } = await admin
    .from("intelligence_watches")
    .select("id,user_id,query,metadata")
    .eq("is_active", true)
    .limit(200)

  if (watchesError) return NextResponse.json({ ok: false, error: watchesError.message }, { status: 500 })

  const watches = ((watchesData ?? []) as WatchRow[]).filter(watch => {
    const metadata = watch.metadata && typeof watch.metadata === "object" && !Array.isArray(watch.metadata) ? watch.metadata : {}
    return metadata.purpose === PURPOSE && metadata.institution_context === "N3uralia"
  })

  if (!watches.length) {
    return NextResponse.json({ ok: true, watches: 0, classified: 0, removed: 0, durationMs: Date.now() - startedAt })
  }

  const watchById = new Map(watches.map(watch => [watch.id, watch]))
  const watchIds = watches.map(watch => watch.id)
  const since = new Date(Date.now() - 21 * 86_400_000).toISOString()
  const { data: eventsData, error: eventsError } = await admin
    .from("intelligence_watch_events")
    .select("id,watch_id,title,summary,source_key,event_type,relevance,payload,last_seen_at")
    .in("watch_id", watchIds)
    .gte("last_seen_at", since)
    .order("last_seen_at", { ascending: false })
    .limit(1500)

  if (eventsError) return NextResponse.json({ ok: false, error: eventsError.message }, { status: 500 })

  let classified = 0
  let removed = 0
  const byType: Record<SignalType, number> = {
    competitor: 0,
    applicable_technology: 0,
    product_opportunity: 0,
    integration: 0,
    threat: 0,
    research_frontier: 0,
  }

  for (const event of (eventsData ?? []) as EventRow[]) {
    if (!event.watch_id) continue
    const watch = watchById.get(event.watch_id)
    if (!watch) continue
    const metadata = watch.metadata && typeof watch.metadata === "object" && !Array.isArray(watch.metadata) ? watch.metadata : {}
    const productKey = typeof metadata.product_key === "string" ? metadata.product_key : ""
    const domainTerms = DOMAIN_TERMS[productKey] ?? []
    const text = normalize(`${event.title} ${event.summary ?? ""}`)
    const domainHits = domainTerms.filter(term => contains(text, term))
    const capabilityHits = CAPABILITY_TERMS.filter(term => contains(text, term))
    const isPublicContextNews = event.event_type === "news" && ["google_news_rss", "gdelt_doc"].includes(event.source_key)

    if (isPublicContextNews && (!domainHits.length || !capabilityHits.length)) {
      const { error: deleteError } = await admin.from("intelligence_watch_events").delete().eq("id", event.id)
      if (deleteError) {
        console.error(`[juan-actionable-signals:${productKey}] delete`, deleteError)
      } else {
        removed += 1
      }
      continue
    }

    if (!domainHits.length || !capabilityHits.length) continue

    const signalType = classifySignal(text)
    const currentPayload = event.payload && typeof event.payload === "object" && !Array.isArray(event.payload) ? event.payload : {}
    const nextPayload = {
      ...currentPayload,
      institution_context: "N3uralia",
      institutional_signal_type: signalType,
      institutional_relevance: "actionable",
      institutional_fit_reason: `Coincide con ${productKey} y con capacidades de IA/software/automatización aplicables por N3uralia.`,
      domain_hits: domainHits.slice(0, 6),
      capability_hits: capabilityHits.slice(0, 8),
      signal_policy_version: POLICY_VERSION,
    }

    const { error: updateError } = await admin
      .from("intelligence_watch_events")
      .update({ payload: nextPayload, updated_at: new Date().toISOString() })
      .eq("id", event.id)

    if (updateError) {
      console.error(`[juan-actionable-signals:${productKey}] update`, updateError)
      continue
    }

    classified += 1
    byType[signalType] += 1
  }

  return NextResponse.json({
    ok: true,
    policyVersion: POLICY_VERSION,
    watches: watches.length,
    classified,
    removed,
    byType,
    durationMs: Date.now() - startedAt,
  })
}

function classifySignal(text: string): SignalType {
  if (THREAT_TERMS.some(term => contains(text, term))) return "threat"
  if (INTEGRATION_TERMS.some(term => contains(text, term))) return "integration"
  if (RESEARCH_TERMS.some(term => contains(text, term))) return "research_frontier"
  if (COMPETITOR_TERMS.filter(term => contains(text, term)).length >= 2) return "competitor"
  if (OPPORTUNITY_TERMS.some(term => contains(text, term))) return "product_opportunity"
  return "applicable_technology"
}

function contains(text: string, term: string) {
  const normalizedTerm = normalize(term)
  if (!normalizedTerm) return false
  const paddedText = ` ${text} `
  const paddedTerm = ` ${normalizedTerm} `
  if (normalizedTerm.length <= 3) return paddedText.includes(paddedTerm)
  return paddedText.includes(paddedTerm) || text.includes(normalizedTerm)
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}
