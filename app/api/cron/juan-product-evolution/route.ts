import { NextResponse } from "next/server"
import { searchCrossrefWorks } from "@/lib/intelligence/crossref"
import { searchOpenAlexWorks } from "@/lib/intelligence/openalex"
import { listPortfolioOrganizations } from "@/lib/intelligence/portfolio-access"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

const JUAN_EMAIL = "juan@n3uralia.com"
const REVIEW_THRESHOLD = 84

type ReuseAsset = { title: string; url: string; reuse: string }
type ProductEvolution = {
  productKey: string
  productName: string
  repo: string
  title: string
  baseScore: number
  outcome: string
  chileNeed: string
  researchQuery: string
  patentTerms: string[]
  chileTerms: string[]
  globalTerms: string[]
  reuseAssets: ReuseAsset[]
  integrations: string[]
  effort: "bajo" | "medio" | "alto"
}

type SignalRow = {
  title: string
  summary: string | null
  source_key: string
  relevance: string
  source_url: string | null
  occurred_at: string | null
  last_seen_at: string | null
}

type PatentRow = {
  title: string
  applicants: string | null
  publication_date: string | null
  filing_date: string | null
  source_url: string | null
}

const EVOLUTIONS: ProductEvolution[] = [
  {
    productKey: "motil",
    productName: "MOTIL / ERP Minería",
    repo: "https://github.com/traviscomber/v0-erpminia",
    title: "Convertir el Senior Assistant en operador de mantenimiento y geología mediante tools/MCP",
    baseScore: 74,
    outcome: "Pasar de responder preguntas a preparar trabajo real: consultar activos y sondajes, proponer OT/tareas, reunir evidencia y pedir aprobación antes de ejecutar.",
    chileNeed: "La minería chilena necesita reducir coordinación manual, tiempos muertos y pérdida de contexto entre mantenimiento, operación y geología.",
    researchQuery: "agentic AI mining maintenance workflow human approval tool use MCP predictive maintenance",
    patentTerms: ["minería", "mantenimiento", "gestión de activos", "asignación de tareas", "inteligencia artificial"],
    chileTerms: ["mineria", "codelco", "sernageomin", "mantenimiento", "faena", "sondaje", "geologia"],
    globalTerms: ["agentic", "maintenance", "mining", "asset", "mcp", "tool use", "workflow"],
    reuseAssets: [
      { title: "Open Agent Builder", url: "https://github.com/traviscomber/open-agent-buildercrawler", reuse: "MCP, tools, HITL, loops y ejecución de workflows." },
      { title: "VIDENTIA", url: "https://github.com/traviscomber/0-visual-compare-chile", reuse: "Evidencia, provenance, research y decisión humana." },
      { title: "MOTIL", url: "https://github.com/traviscomber/v0-erpminia", reuse: "Activos, mantenimiento, geología y datos canónicos ya operativos." },
    ],
    integrations: ["MCP de mantenimiento/OT", "MCP de geología y sondajes", "aprobación humana", "calendario/alertas operacionales"],
    effort: "medio",
  },
  {
    productKey: "pescamar",
    productName: "Seafood Intelligence OS / Pescamar",
    repo: "https://github.com/traviscomber/pescamar",
    title: "Unir calidad visual, producción, inventario y comercial en un operador seafood agentic",
    baseScore: 72,
    outcome: "Detectar desviaciones de calidad/producción y convertirlas en decisiones de inventario, planificación y comercial con evidencia trazable.",
    chileNeed: "Chile tiene una industria acuícola y pesquera exportadora donde calidad, trazabilidad, merma y coordinación de planta tienen impacto económico directo.",
    researchQuery: "multimodal AI seafood quality inspection aquaculture traceability production agent workflow",
    patentTerms: ["acuícola", "peces", "calidad", "visión", "inteligencia artificial", "trazabilidad"],
    chileTerms: ["salmon", "acuicultura", "pesca", "seafood", "s salmon", "sernapesca", "los lagos"],
    globalTerms: ["aquaculture", "seafood", "computer vision", "multimodal", "quality", "traceability"],
    reuseAssets: [
      { title: "Pescamar", url: "https://github.com/traviscomber/pescamar", reuse: "Recepción, producción, calidad, inventario, comercial e inteligencia ya conectados." },
      { title: "EdgeVision", url: "https://github.com/traviscomber/edgevision", reuse: "Visión/edge intelligence para inspección física." },
      { title: "Open Agent Builder", url: "https://github.com/traviscomber/open-agent-buildercrawler", reuse: "Tools, agentes y aprobación humana." },
    ],
    integrations: ["visión multimodal de calidad", "MCP de inventario/producción", "proveedores/compras", "alertas y decisiones comerciales"],
    effort: "medio",
  },
  {
    productKey: "kumplio",
    productName: "Kumplio",
    repo: "https://github.com/traviscomber/kumplio",
    title: "Evolucionar de monitoreo de cumplimiento a ejecución agentic de obligaciones",
    baseScore: 75,
    outcome: "Una obligación detectada puede convertirse automáticamente en evidencia requerida, tarea, responsable, seguimiento y cierre humano verificable.",
    chileNeed: "Empresas chilenas enfrentan obligaciones laborales, documentales y sectoriales dispersas; el costo está en ejecutar y demostrar cumplimiento, no sólo en conocer la norma.",
    researchQuery: "agentic AI regulatory compliance evidence workflow human oversight policy as code enterprise",
    patentTerms: ["cumplimiento", "regulación", "evidencia", "inteligencia artificial", "automatización"],
    chileTerms: ["dt", "direccion del trabajo", "cumplimiento", "laboral", "regulacion", "fiscalizacion", "ley"],
    globalTerms: ["compliance", "regulatory", "agentic", "audit", "policy", "evidence", "workflow"],
    reuseAssets: [
      { title: "Kumplio", url: "https://github.com/traviscomber/kumplio", reuse: "Obligaciones, brechas, acciones, responsables y evidencia." },
      { title: "ChileFlota", url: "https://github.com/traviscomber/v0-transport-certificates-automation", reuse: "Vencimientos, documentos, tareas y automatización operacional." },
      { title: "VIDENTIA", url: "https://github.com/traviscomber/0-visual-compare-chile", reuse: "Collectors, regulación, evidencia y trazabilidad." },
    ],
    integrations: ["MCP de documentos/Drive", "email y solicitudes de evidencia", "fuentes regulatorias", "RRHH/ERP", "firma/aprobación humana"],
    effort: "medio",
  },
  {
    productKey: "chileflota",
    productName: "ChileFlota",
    repo: "https://github.com/traviscomber/v0-transport-certificates-automation",
    title: "Pasar de certificados y vencimientos a un coordinador autónomo de readiness de flota",
    baseScore: 70,
    outcome: "Anticipar qué vehículo requiere qué acción, reunir documentos, proponer agenda/proveedor y dejar al usuario sólo las decisiones necesarias.",
    chileNeed: "Transporte chileno opera con documentación, PRT, permisos, mantenimiento y disponibilidad fragmentados; anticipar indisponibilidad tiene valor operacional inmediato.",
    researchQuery: "fleet management agentic AI predictive maintenance telematics compliance workflow scheduling",
    patentTerms: ["vehículo", "flota", "mantenimiento", "telemática", "control", "predicción"],
    chileTerms: ["prt", "revision tecnica", "transporte", "vehiculo", "flota", "mtT", "camion"],
    globalTerms: ["fleet", "telematics", "predictive maintenance", "vehicle", "agentic", "scheduling"],
    reuseAssets: [
      { title: "ChileFlota", url: "https://github.com/traviscomber/v0-transport-certificates-automation", reuse: "Documentos, vencimientos y flujo de acciones existentes." },
      { title: "MOTIL", url: "https://github.com/traviscomber/v0-erpminia", reuse: "Patrones de mantenimiento, OT y estado operacional." },
      { title: "Open Agent Builder", url: "https://github.com/traviscomber/open-agent-buildercrawler", reuse: "Orquestación de tools y aprobaciones." },
    ],
    integrations: ["PRT y fuentes oficiales", "GPS/telemática", "calendario", "talleres/proveedores", "MCP de mantenimiento"],
    effort: "medio",
  },
  {
    productKey: "property-partners",
    productName: "Property Partners",
    repo: "https://github.com/traviscomber/n3uralia-intelligence-platform-propertyparners",
    title: "Agregar un operador inmobiliario que conecte mercado, valorización, documentos y próxima acción comercial",
    baseScore: 69,
    outcome: "Preparar valorizaciones y decisiones comerciales con comparables explicables, documentos y contexto de mercado, reduciendo trabajo manual del equipo.",
    chileNeed: "El mercado inmobiliario chileno tiene datos fragmentados y procesos de valorización/comercialización intensivos en revisión humana.",
    researchQuery: "agentic AI real estate valuation comparables market intelligence workflow property",
    patentTerms: ["inmobiliario", "propiedad", "valoración", "tasación", "inteligencia artificial"],
    chileTerms: ["inmobiliario", "vivienda", "propiedad", "tasacion", "valdivia", "mercado inmobiliario"],
    globalTerms: ["real estate", "valuation", "property", "comparables", "agentic", "market intelligence"],
    reuseAssets: [
      { title: "Property Partners", url: "https://github.com/traviscomber/n3uralia-intelligence-platform-propertyparners", reuse: "Valorizador, comparables, mapas, roles y decisión ya implementados." },
      { title: "Sur Realista", url: "https://github.com/traviscomber/surrealista", reuse: "Scraping y señales de mercado inmobiliario." },
      { title: "VIDENTIA", url: "https://github.com/traviscomber/0-visual-compare-chile", reuse: "Research, evidence graph y seguimiento de señales." },
    ],
    integrations: ["listings/market feeds", "CRM", "documentos", "mapas/geocoding", "MCP de valorización y comparables"],
    effort: "medio",
  },
  {
    productKey: "black-swan",
    productName: "Black Swan Facility + Orchard",
    repo: "https://github.com/traviscomber/black-swan-facility-core",
    title: "Unificar Facility, Orchard, inventario, mantenimiento y sensores detrás de un operador de campo",
    baseScore: 68,
    outcome: "Una intención operacional puede consultar el estado físico, coordinar trabajo entre módulos y pedir aprobación sólo cuando exista una excepción o decisión.",
    chileNeed: "Operaciones agrícolas y rurales del sur de Chile necesitan integrar trabajo de campo, inventario, mantenimiento y condiciones físicas sin aumentar carga administrativa.",
    researchQuery: "agentic AI agriculture farm operations sensors maintenance digital twin workflow edge",
    patentTerms: ["agricultura", "cultivo", "sensor", "riego", "visión", "mantenimiento"],
    chileTerms: ["agricultura", "los rios", "valdivia", "riego", "cultivo", "agro", "campo"],
    globalTerms: ["agriculture", "farm", "sensor", "edge", "digital twin", "agentic", "crop"],
    reuseAssets: [
      { title: "Black Swan Facility Core", url: "https://github.com/traviscomber/black-swan-facility-core", reuse: "Facility, inventario, mantenimiento y operación." },
      { title: "EdgeVision", url: "https://github.com/traviscomber/edgevision", reuse: "Observación física mediante visión/edge." },
      { title: "Open Agent Builder", url: "https://github.com/traviscomber/open-agent-buildercrawler", reuse: "MCP/tools y flujo de aprobación." },
    ],
    integrations: ["sensores/IoT", "visión de campo", "MCP Facility", "MCP Orchard", "clima/forecast", "inventario y mantenimiento"],
    effort: "medio",
  },
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

  const [signalsResult, patentsResult, existingResult] = await Promise.all([
    admin.from("intelligence_watch_events")
      .select("title,summary,source_key,relevance,source_url,occurred_at,last_seen_at")
      .eq("user_id", juan.id)
      .in("relevance", ["alta", "media"])
      .order("last_seen_at", { ascending: false })
      .limit(600),
    admin.from("patent_records")
      .select("title,applicants,publication_date,filing_date,source_url")
      .order("publication_date", { ascending: false, nullsFirst: false })
      .limit(1800),
    admin.from("intelligence_product_evolution_recommendations")
      .select("id,product_key,title,status,decision_note,evidence_snapshot")
      .eq("user_id", juan.id)
      .eq("organization_id", organization.id),
  ])

  const signals = (signalsResult.error ? [] : signalsResult.data ?? []) as SignalRow[]
  const patents = (patentsResult.error ? [] : patentsResult.data ?? []) as PatentRow[]
  const existing = existingResult.error ? [] : existingResult.data ?? []
  const existingByKey = new Map(existing.map(row => [`${row.product_key}|${row.title}`, row]))

  const from = new Date(Date.now() - 540 * 86_400_000)
  const to = new Date()
  const results: Array<Record<string, unknown>> = []

  for (const evolution of EVOLUTIONS) {
    const paper = await findPaper(evolution.researchQuery, from, to)
    const patent = findPatent(patents, evolution.patentTerms)
    const chileSignal = findSignal(signals, evolution.chileTerms, true)
    const globalSignal = findSignal(signals, evolution.globalTerms, false)
    const score = Math.min(100, Math.round(
      evolution.baseScore
      + (paper ? Math.min(7, 3 + Math.log10(Math.max(1, paper.citedByCount + 1)) * 2) : 0)
      + (patent ? 5 : 0)
      + (chileSignal ? chileSignal.relevance === "alta" ? 7 : 5 : 0)
      + (globalSignal ? globalSignal.relevance === "alta" ? 5 : 3 : 0)
      + Math.min(5, evolution.reuseAssets.length + 1),
    ))

    const key = `${evolution.productKey}|${evolution.title}`
    const previous = existingByKey.get(key)
    const lockedDecision = previous?.status === "accepted" || previous?.status === "rejected"
    const nextStatus = lockedDecision ? previous.status : score >= REVIEW_THRESHOLD ? "ready_for_review" : "researching"
    const externalSignal = [chileSignal?.title, globalSignal?.title].filter(Boolean).join(" · ") || null
    const reuseSummary = evolution.reuseAssets.map(asset => asset.title).join(" + ")
    const integrationSummary = evolution.integrations.join(" · ")

    const evidenceSnapshot = {
      generated_at: new Date().toISOString(),
      score_model: "outcome + Chile need + external frontier + paper + patent + reuse + integrations",
      repo: evolution.repo,
      paper,
      patent,
      chile_signal: chileSignal,
      global_signal: globalSignal,
      reuse_assets: evolution.reuseAssets,
      integrations: evolution.integrations,
      dimensions: {
        outcome: Math.min(100, evolution.baseScore + 15),
        reuse_advantage: Math.min(100, 55 + evolution.reuseAssets.length * 10),
        integration_leverage: Math.min(100, 55 + evolution.integrations.length * 7),
        agentic_mcp_potential: /MCP|agentic|operador/i.test(`${evolution.title} ${integrationSummary}`) ? 92 : 78,
        chile_fit: chileSignal ? (chileSignal.relevance === "alta" ? 94 : 86) : 72,
      },
    }

    const { error } = await admin.from("intelligence_product_evolution_recommendations").upsert({
      user_id: juan.id,
      organization_id: organization.id,
      product_key: evolution.productKey,
      product_name: evolution.productName,
      title: evolution.title,
      score,
      status: nextStatus,
      outcome: evolution.outcome,
      chile_need: evolution.chileNeed,
      external_signal: externalSignal,
      reuse_summary: reuseSummary,
      integration_summary: integrationSummary,
      effort: evolution.effort,
      evidence_snapshot: evidenceSnapshot,
      decision_note: lockedDecision ? previous.decision_note : null,
      decision_at: lockedDecision ? undefined : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "organization_id,product_key,title" })
    if (error) console.error(`[cron/juan-product-evolution:${evolution.productKey}]`, error)

    results.push({ product: evolution.productName, score, status: nextStatus, paper: Boolean(paper), patent: Boolean(patent), chileSignal: Boolean(chileSignal), globalSignal: Boolean(globalSignal) })
  }

  return NextResponse.json({
    ok: true,
    reviewThreshold: REVIEW_THRESHOLD,
    recommendations: results.sort((a, b) => Number(b.score) - Number(a.score)),
    durationMs: Date.now() - startedAt,
  })
}

async function findPaper(query: string, from: Date, to: Date) {
  try {
    const works = await searchOpenAlexWorks(query, from, to, 5)
    const best = [...works].sort((a, b) => b.citedByCount - a.citedByCount)[0]
    if (best) return { source: "OpenAlex", title: best.title, date: best.date, url: best.url, citedByCount: best.citedByCount }
  } catch (error) { console.warn("[juan-product-evolution:openalex]", error) }
  try {
    const works = await searchCrossrefWorks(query, from, to, 5)
    const best = [...works].sort((a, b) => b.citedByCount - a.citedByCount)[0]
    if (best) return { source: "Crossref", title: best.title, date: best.date, url: best.url, citedByCount: best.citedByCount }
  } catch (error) { console.warn("[juan-product-evolution:crossref]", error) }
  return null
}

function findPatent(rows: PatentRow[], terms: string[]) {
  const normalizedTerms = terms.map(normalize).filter(term => term.length >= 5)
  const matches = rows.flatMap(row => {
    const title = row.title?.trim()
    if (!title) return []
    const normalizedTitle = normalize(title)
    const hits = normalizedTerms.filter(term => normalizedTitle.includes(term))
    // Require two specific concepts. This intentionally rejects generic single-word collisions.
    if (hits.length < 2) return []
    return [{ score: hits.reduce((sum, term) => sum + term.split(" ").length, 0), title, applicants: row.applicants, date: row.publication_date ?? row.filing_date, url: row.source_url }]
  })
  return matches.sort((a, b) => b.score - a.score || String(b.date ?? "").localeCompare(String(a.date ?? "")))[0] ?? null
}

function findSignal(rows: SignalRow[], terms: string[], chileOnly: boolean) {
  const normalizedTerms = terms.map(normalize)
  const matches = rows.flatMap(row => {
    const source = normalize(row.source_key ?? "")
    const haystack = normalize([row.title, row.summary, row.source_key].filter(Boolean).join(" "))
    const hits = normalizedTerms.filter(term => term && haystack.includes(term))
    if (!hits.length) return []
    const chileSource = /sea|seia|sma|snifa|bcn|fne|tdlc|inapi|chile|sernageomin|sernapesca|dt/.test(source)
    const chileText = /chile|chileno|chilena|codelco|sernageomin|sernapesca|valdivia|los rios|los lagos/.test(haystack)
    if (chileOnly && !chileSource && !chileText) return []
    if (!chileOnly && (chileSource || chileText)) return []
    const relevanceBoost = row.relevance === "alta" ? 3 : 1
    return [{ score: hits.length * 2 + relevanceBoost, title: row.title, source: row.source_key, relevance: row.relevance, url: row.source_url, date: row.occurred_at ?? row.last_seen_at }]
  })
  return matches.sort((a, b) => b.score - a.score || String(b.date ?? "").localeCompare(String(a.date ?? "")))[0] ?? null
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim()
}
