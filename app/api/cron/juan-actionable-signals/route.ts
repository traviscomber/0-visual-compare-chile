import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 120

const POLICY_VERSION = "n3uralia-signal-policy-v1.2"
const CONCEPT_FILTER_VERSION = "n3uralia-concept-filter-v1"
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

type ProductConceptPack = {
  domain: string[]
  capability: string[]
  exclusions?: string[]
}

const PRODUCT_CONCEPTS: Record<string, ProductConceptPack> = {
  motil: {
    domain: ["mineria", "minero", "mineral", "mineralogia", "mineralogico", "faena", "codelco", "geologia", "sondaje", "litio", "cobre"],
    capability: ["inteligencia artificial", "machine learning", "aprendizaje automatico", "ia", "ai", "software", "automatizacion", "automatizado", "predictive maintenance", "mantenimiento predictivo", "gemelo digital", "digital twin", "vision computacional", "computer vision", "sensor", "sensores", "analitica", "analytics"],
    exclusions: ["mineria de datos", "data mining"],
  },
  pescamar: {
    domain: ["acuicultura", "salmon", "salmonicultura", "pesca", "seafood", "sernapesca", "planta de proceso", "pez", "peces", "biomasa", "marine", "marino"],
    capability: ["inteligencia artificial", "machine learning", "aprendizaje automatico", "ia", "ai", "software", "automatizacion", "vision computacional", "computer vision", "multimodal", "sensor", "sensores", "analitica", "analytics", "predictivo", "trazabilidad digital"],
  },
  kumplio: {
    domain: ["cumplimiento", "compliance", "fiscalizacion", "auditoria", "audit", "obligacion", "obligaciones", "privacidad", "proteccion de datos", "laboral", "gobernanza", "policy as code"],
    capability: ["inteligencia artificial", "machine learning", "aprendizaje automatico", "ia", "ai", "software", "automatizacion", "automatizado", "agente", "agentic", "workflow", "documental", "document management", "rag", "retrieval augmented", "mcp", "api"],
  },
  chileflota: {
    domain: ["flota", "flotas", "vehiculo", "vehiculos", "transporte", "camion", "camiones", "telematica", "revision tecnica", "prt"],
    capability: ["inteligencia artificial", "machine learning", "aprendizaje automatico", "ia", "ai", "software", "automatizacion", "mantenimiento predictivo", "predictive maintenance", "telematica", "iot", "sensor", "sensores", "analitica", "analytics", "gemelo digital", "digital twin", "api"],
  },
  "property-partners": {
    domain: ["inmobiliario", "inmobiliaria", "propiedad", "propiedades", "tasacion", "valorizacion", "avaluo", "real estate", "housing", "vivienda"],
    capability: ["inteligencia artificial", "machine learning", "aprendizaje automatico", "ia", "ai", "software", "automatizacion", "automated valuation", "avm", "analitica", "analytics", "modelo predictivo", "predictive model", "computer vision", "vision computacional", "api"],
  },
  "black-swan": {
    domain: ["agricultura", "agricola", "cultivo", "riego", "campo", "granja", "farm", "orchard", "agronomia", "horticultura", "crop"],
    capability: ["inteligencia artificial", "machine learning", "aprendizaje automatico", "ia", "ai", "software", "automatizacion", "robotica", "robotics", "vision computacional", "computer vision", "iot", "sensor", "sensores", "edge ai", "gemelo digital", "digital twin", "analitica", "analytics"],
  },
}

const INTEGRATION_TERMS = ["mcp", "api", "integracion", "interoperabilidad", "scada", "erp", "iot", "telematica", "conecta", "conectado", "workflow"]
const COMPETITOR_TERMS = ["plataforma", "software", "solucion", "startup", "proveedor", "empresa", "lanza", "presenta", "ofrece", "desarrolla"]
const OPPORTUNITY_TERMS = ["demanda", "adopcion", "inversion", "licitacion", "brecha", "necesita", "crecimiento", "implementa", "despliega"]
const THREAT_TERMS = ["reemplaza", "sustituye", "desplaza", "competidor", "amenaza", "disrupcion", "captura mercado"]

const INSTITUTIONAL_PAYLOAD_KEYS = new Set([
  "institution_context",
  "institutional_signal_type",
  "institutional_relevance",
  "institutional_fit_reason",
  "institutional_action_hint",
  "domain_hits",
  "capability_hits",
  "concept_exclusion_hits",
  "concept_filter_version",
  "signal_policy_version",
])

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
    return NextResponse.json({ ok: true, watches: 0, classified: 0, removed: 0, declassified: 0, durationMs: Date.now() - startedAt })
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
  let declassified = 0
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
    const conceptPack = PRODUCT_CONCEPTS[productKey]
    if (!conceptPack) continue

    const text = sourceNativeText(event)
    const domainHits = conceptPack.domain.filter(term => contains(text, term))
    const capabilityHits = conceptPack.capability.filter(term => contains(text, term))
    const exclusionHits = (conceptPack.exclusions ?? []).filter(term => contains(text, term))
    const isPublicContextNews = event.event_type === "news" && ["google_news_rss", "gdelt_doc"].includes(event.source_key)
    const hasInstitutionalFit = domainHits.length > 0 && capabilityHits.length > 0 && exclusionHits.length === 0

    if (!hasInstitutionalFit) {
      if (isPublicContextNews) {
        const { error: deleteError } = await admin.from("intelligence_watch_events").delete().eq("id", event.id)
        if (deleteError) {
          console.error(`[juan-actionable-signals:${productKey}] delete`, deleteError)
        } else {
          removed += 1
        }
        continue
      }

      const currentPayload = event.payload && typeof event.payload === "object" && !Array.isArray(event.payload) ? event.payload : {}
      if (hasInstitutionalFields(currentPayload)) {
        const cleanedPayload = stripInstitutionalFields(currentPayload)
        const { error: cleanupError } = await admin
          .from("intelligence_watch_events")
          .update({ payload: cleanedPayload, updated_at: new Date().toISOString() })
          .eq("id", event.id)
        if (cleanupError) {
          console.error(`[juan-actionable-signals:${productKey}] declassify`, cleanupError)
        } else {
          declassified += 1
        }
      }
      continue
    }

    const signalType = classifySignal(event, text)
    const currentPayload = event.payload && typeof event.payload === "object" && !Array.isArray(event.payload) ? event.payload : {}
    const nextPayload = {
      ...currentPayload,
      institution_context: "N3uralia",
      institutional_signal_type: signalType,
      institutional_relevance: "actionable",
      institutional_fit_reason: `La evidencia propia de la fuente coincide con el dominio ${productKey} y con una capacidad tecnológica aplicable por N3uralia.`,
      institutional_action_hint: actionHint(signalType),
      domain_hits: domainHits.slice(0, 6),
      capability_hits: capabilityHits.slice(0, 8),
      concept_exclusion_hits: exclusionHits.slice(0, 4),
      concept_filter_version: CONCEPT_FILTER_VERSION,
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
    conceptFilterVersion: CONCEPT_FILTER_VERSION,
    watches: watches.length,
    classified,
    removed,
    declassified,
    byType,
    durationMs: Date.now() - startedAt,
  })
}

function sourceNativeText(event: EventRow) {
  // Patent/trademark summaries produced by the scanner can contain the watch query itself.
  // Never use that synthetic text to establish institutional relevance.
  if (event.source_key === "inapi_open_data" && ["patent", "trademark"].includes(event.event_type)) {
    return normalize(event.title)
  }
  return normalize(`${event.title} ${event.summary ?? ""}`)
}

function hasInstitutionalFields(payload: Record<string, unknown>) {
  return Object.keys(payload).some(key => INSTITUTIONAL_PAYLOAD_KEYS.has(key))
}

function stripInstitutionalFields(payload: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(payload).filter(([key]) => !INSTITUTIONAL_PAYLOAD_KEYS.has(key)))
}

function classifySignal(event: EventRow, text: string): SignalType {
  if (event.event_type === "publication") return "research_frontier"
  if (event.event_type === "patent") return "applicable_technology"
  if (THREAT_TERMS.some(term => contains(text, term))) return "threat"
  if (INTEGRATION_TERMS.some(term => contains(text, term))) return "integration"
  if (COMPETITOR_TERMS.filter(term => contains(text, term)).length >= 2) return "competitor"
  if (OPPORTUNITY_TERMS.some(term => contains(text, term))) return "product_opportunity"
  return "applicable_technology"
}

function actionHint(type: SignalType) {
  if (type === "competitor") return "Comparar capacidad, distribución y workflow; decidir qué superar, copiar o evitar."
  if (type === "applicable_technology") return "Evaluar un POC pequeño contra el baseline del producto antes de incorporarla."
  if (type === "product_opportunity") return "Validar dolor, comprador y frecuencia antes de abrir desarrollo."
  if (type === "integration") return "Revisar API/MCP, coste operativo, permisos y rollback antes de conectar."
  if (type === "threat") return "Medir impacto sobre diferenciación, clientes y roadmap antes de reaccionar."
  return "Seguir madurez, evidencia independiente y benchmark reproducible antes de promoverla a producto."
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
