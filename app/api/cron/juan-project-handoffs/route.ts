import { NextResponse } from "next/server"
import { searchCrossrefWorks } from "@/lib/intelligence/crossref"
import { searchOpenAlexWorks } from "@/lib/intelligence/openalex"
import { listPortfolioOrganizations } from "@/lib/intelligence/portfolio-access"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

const JUAN_EMAIL = "juan@n3uralia.com"
const READY_THRESHOLD = 90
const MAX_PER_LAYER = 3
const SCOREABLE_EVIDENCE_TYPES = new Set(["paper", "patent", "news", "market", "regulation"])

type ReuseAsset = { title: string; url: string; reuse: string }
type ProjectIdea = {
  key: string
  title: string
  strength: number
  capability: string
  researchQuery: string
  patentSignals: string[]
  signalTerms: string[]
  reuseAssets: ReuseAsset[]
}

type ExistingHandoff = {
  idea_key: string
  status: "ready_for_n3uralia" | "accepted" | "paused" | "closed"
  rationale: string
  evidence_snapshot: Record<string, unknown> | null
}

const PROJECT_IDEAS: ProjectIdea[] = [
  {
    key: "capability:agentic-operations",
    title: "Agentic Operations Control Plane",
    strength: 78,
    capability: "Open Agent Builder + MCP + Vertical OS",
    researchQuery: "AI agents human in the loop workflow orchestration governance control plane",
    patentSignals: ["asignación de tareas", "gestión de asignación de tareas", "restricciones críticas", "agentes", "orquestación"],
    signalTerms: ["agent", "agentic", "workflow", "autonomous", "automation", "orchestration", "governance", "control plane"],
    reuseAssets: [
      { title: "Open Agent Builder", url: "https://github.com/traviscomber/open-agent-buildercrawler", reuse: "Workflows visuales, LangGraph, MCP, loops, streaming y aprobación humana." },
      { title: "Hermes Agent", url: "https://github.com/traviscomber/hermes-agent", reuse: "Patrones de agente autónomo y ejecución de herramientas." },
      { title: "Agency Agents", url: "https://github.com/traviscomber/agency-agents", reuse: "Catálogo y patrones multiagente reutilizables." },
      { title: "VIDENTIA", url: "https://github.com/traviscomber/0-visual-compare-chile", reuse: "Evidencia, provenance, monitoreo, decisiones y trazabilidad." },
    ],
  },
  {
    key: "capability:agentic-compliance",
    title: "Agentic Compliance Operator",
    strength: 76,
    capability: "Kumplio + ChileFlota + VIDENTIA + agentes",
    researchQuery: "agentic AI regulatory compliance autonomous workflow evidence human oversight",
    patentSignals: ["consultas jurídicas", "tributarios y contadores", "cumplimiento", "regulación", "control"],
    signalTerms: ["compliance", "regulation", "regulatory", "norm", "legal", "privacy", "audit", "evidence"],
    reuseAssets: [
      { title: "Kumplio", url: "https://github.com/traviscomber/kumplio", reuse: "Obligaciones, brechas, acciones, responsables, evidencia, revisión y cierre trazable." },
      { title: "ChileFlota", url: "https://github.com/traviscomber/v0-transport-certificates-automation", reuse: "Cumplimiento operacional, documentos, vencimientos, tareas y automatización." },
      { title: "VIDENTIA", url: "https://github.com/traviscomber/0-visual-compare-chile", reuse: "Fuentes, vigilancia, evidence graph, decisiones y provenance." },
      { title: "Open Agent Builder", url: "https://github.com/traviscomber/open-agent-buildercrawler", reuse: "Orquestación de agentes, MCP y human-in-the-loop." },
    ],
  },
  {
    key: "capability:physical-intelligence",
    title: "Physical Intelligence Operator",
    strength: 74,
    capability: "Edge Intelligence + Clar1ty + MOTIL + agro/seafood",
    researchQuery: "multimodal AI computer vision edge autonomous systems industrial operations",
    patentSignals: ["multimodal", "microscopía óptica", "campo de visión", "cámara", "reconocimiento de especies"],
    signalTerms: ["computer vision", "multimodal", "camera", "sensor", "edge", "vision", "image"],
    reuseAssets: [],
  },
  {
    key: "capability:industrial-reliability",
    title: "Industrial AI Reliability Operator",
    strength: 73,
    capability: "MOTIL + Facility Core + Edge Intelligence + mantenimiento operacional",
    researchQuery: "industrial AI predictive maintenance asset reliability machine learning operations",
    patentSignals: ["gestión de activos", "predecir fallas", "restricciones críticas", "equipos de minería"],
    signalTerms: ["maintenance", "asset", "reliability", "mining", "equipment", "industrial", "failure"],
    reuseAssets: [],
  },
  {
    key: "capability:environmental-operations",
    title: "Environmental Operations Intelligence",
    strength: 72,
    capability: "VIDENTIA + Kumplio + SEA/SEIA + SNIFA/SMA + agentes",
    researchQuery: "AI environmental compliance industrial monitoring regulation operations",
    patentSignals: ["monitoreo de variables", "sistema autónomo", "fuente de fluido", "instalación solar"],
    signalTerms: ["seia", "sea", "snifa", "sma", "environment", "ambiental", "permit", "environmental"],
    reuseAssets: [],
  },
]

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authorization = request.headers.get("authorization")
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const startedAt = Date.now()
  const admin = createAdminClient()
  const { data: users, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (usersError) {
    console.error("[cron/juan-project-handoffs:users]", usersError)
    return NextResponse.json({ ok: false, error: "Could not resolve target user." }, { status: 500 })
  }

  const juan = users.users.find(user => user.email?.toLowerCase() === JUAN_EMAIL)
  if (!juan) return NextResponse.json({ ok: false, error: "Target user not found." }, { status: 404 })

  const organizations = await listPortfolioOrganizations(admin, juan.id).catch(() => [])
  const organization = organizations[0] ?? null
  if (!organization) return NextResponse.json({ ok: false, error: "Target organization not found." }, { status: 404 })

  const [patentsResult, signalsResult, evidenceResult, handoffsResult] = await Promise.all([
    admin
      .from("patent_records")
      .select("title,applicants,filing_date,publication_date,source_url")
      .or("title.ilike.%inteligencia artificial%,title.ilike.%aprendizaje automático%,title.ilike.%sistema autónomo%,title.ilike.%multimodal%,title.ilike.%asignación de tareas%,title.ilike.%microscopía%,title.ilike.%gestión de activos%,title.ilike.%monitoreo%,title.ilike.%cumplimiento%,title.ilike.%regulación%")
      .order("publication_date", { ascending: false, nullsFirst: false })
      .limit(240),
    admin
      .from("intelligence_watch_events")
      .select("title,summary,source_key,relevance,source_url,occurred_at,last_seen_at")
      .eq("user_id", juan.id)
      .in("relevance", ["alta", "media"])
      .order("last_seen_at", { ascending: false })
      .limit(320),
    admin
      .from("intelligence_idea_evidence")
      .select("idea_key,evidence_type,title,source_url")
      .eq("user_id", juan.id)
      .eq("organization_id", organization.id)
      .limit(2000),
    admin
      .from("intelligence_project_handoffs")
      .select("idea_key,status,rationale,evidence_snapshot")
      .eq("user_id", juan.id)
      .eq("organization_id", organization.id),
  ])

  const patents = patentsResult.error ? [] : patentsResult.data ?? []
  const signals = signalsResult.error ? [] : signalsResult.data ?? []
  const existingEvidence = evidenceResult.error ? [] : evidenceResult.data ?? []
  const existingHandoffs = handoffsResult.error ? [] : (handoffsResult.data ?? []) as ExistingHandoff[]
  const handoffByIdea = new Map(existingHandoffs.map(row => [row.idea_key, row]))
  const existingKeys = new Set(existingEvidence.map(row => `${String(row.idea_key)}|${normalize(String(row.title ?? ""))}|${String(row.source_url ?? "")}`))

  const from = new Date(Date.now() - 730 * 86_400_000)
  const to = new Date()
  const scored: Array<Record<string, unknown>> = []
  const evidenceToInsert: Array<Record<string, unknown>> = []

  for (const idea of PROJECT_IDEAS) {
    const [papers, patentMatches, signalMatches] = await Promise.all([
      findPapers(idea.researchQuery, from, to),
      Promise.resolve(findPatents(patents, idea.patentSignals)),
      Promise.resolve(findSignals(signals, idea.signalTerms)),
    ])

    const ownEvidence = existingEvidence.filter(row => row.idea_key === idea.key)
    const canonicalEvidenceCount = ownEvidence.filter(row => SCOREABLE_EVIDENCE_TYPES.has(String(row.evidence_type ?? ""))).length
    const liveScore = Math.min(100, Math.round(
      idea.strength
      + (papers.length ? Math.min(8, 3 + Math.log10(Math.max(1, papers[0].citedByCount + 1)) * 2) : 0)
      + (patentMatches.length ? 5 : 0)
      + (signalMatches.length ? signalMatches[0].relevance === "alta" ? 6 : 4 : 0)
      + Math.min(4, canonicalEvidenceCount),
    ))

    for (const paper of papers) addEvidence(evidenceToInsert, existingKeys, {
      user_id: juan.id,
      organization_id: organization.id,
      idea_key: idea.key,
      idea_title: idea.title,
      evidence_type: "paper",
      title: paper.title,
      source_url: paper.url,
      note: `Encontrado automáticamente por VIDENTIA · ${paper.source}${paper.date ? ` · ${paper.date}` : ""} · ${paper.citedByCount} citas`,
      observed_at: paper.date ? `${paper.date}T00:00:00.000Z` : null,
    })

    for (const patent of patentMatches) addEvidence(evidenceToInsert, existingKeys, {
      user_id: juan.id,
      organization_id: organization.id,
      idea_key: idea.key,
      idea_title: idea.title,
      evidence_type: "patent",
      title: patent.title,
      source_url: patent.url,
      note: `Encontrado automáticamente en el corpus de patentes${patent.applicants ? ` · ${patent.applicants}` : ""}${patent.date ? ` · ${patent.date}` : ""}`,
      observed_at: patent.date ? `${patent.date}T00:00:00.000Z` : null,
    })

    for (const signal of signalMatches) addEvidence(evidenceToInsert, existingKeys, {
      user_id: juan.id,
      organization_id: organization.id,
      idea_key: idea.key,
      idea_title: idea.title,
      evidence_type: signal.sourceKey.includes("news") ? "news" : "market",
      title: signal.title,
      source_url: signal.url,
      note: `Señal ${signal.relevance} encontrada automáticamente · ${humanSource(signal.sourceKey)}`,
      observed_at: signal.date,
    })

    for (const asset of idea.reuseAssets) addEvidence(evidenceToInsert, existingKeys, {
      user_id: juan.id,
      organization_id: organization.id,
      idea_key: idea.key,
      idea_title: idea.title,
      evidence_type: "other",
      title: `Código reutilizable · ${asset.title}`,
      source_url: asset.url,
      note: `N3uralia Reuse Advantage · ${asset.reuse}`,
      observed_at: new Date().toISOString(),
    })

    const previous = handoffByIdea.get(idea.key) ?? null
    const humanDecisionLocked = previous?.status === "accepted" || previous?.status === "closed"
    const nextStatus = humanDecisionLocked
      ? previous.status
      : liveScore > READY_THRESHOLD
        ? "ready_for_n3uralia"
        : previous?.status === "ready_for_n3uralia"
          ? "paused"
          : previous?.status ?? "paused"

    const researchSnapshot = {
      threshold: READY_THRESHOLD,
      rule: "evidence-only research score > 90 enters human decision; institutional capability never changes conviction",
      research_mode: "deep_auto_v2_evidence_only",
      research_summary: {
        papers: papers.length,
        patents: patentMatches.length,
        signals: signalMatches.length,
        canonical_evidence: canonicalEvidenceCount,
        reuse_assets: idea.reuseAssets.length,
      },
      papers: papers.map(item => ({ source: item.source, title: item.title, url: item.url, date: item.date, cited_by_count: item.citedByCount })),
      patents: patentMatches.map(item => ({ title: item.title, applicants: item.applicants, date: item.date, url: item.url })),
      signals: signalMatches.map(item => ({ title: item.title, source: item.sourceKey, url: item.url, relevance: item.relevance, date: item.date })),
      reuse_assets: idea.reuseAssets,
      reuse_advantage: {
        score_boost: 0,
        score_effect: "excluded_from_evidence_conviction",
        approach: "reuse_adapt_extract_build_buy_connect",
      },
      evidence_gaps: inferEvidenceGaps(papers.length, patentMatches.length, signalMatches.length, idea.reuseAssets.length),
      observed_at: new Date().toISOString(),
      human_decision: previous?.evidence_snapshot && typeof previous.evidence_snapshot === "object" ? (previous.evidence_snapshot as Record<string, unknown>).human_decision ?? null : null,
    }

    const rationale = liveScore > READY_THRESHOLD
      ? `VIDENTIA completó un estudio automático basado sólo en evidencia con ${papers.length} papers, ${patentMatches.length} patentes y ${signalMatches.length} señales. Los ${idea.reuseAssets.length} activos N3uralia se muestran sólo como capacidad de ejecución y no aumentan la convicción. La decisión final queda exclusivamente en Juan.`
      : `VIDENTIA sigue investigando: la convicción basada sólo en evidencia está en ${liveScore}/100 y todavía no alcanza el umbral de decisión. Los activos N3uralia no afectan este score.`

    const { error: handoffError } = await admin.from("intelligence_project_handoffs").upsert({
      user_id: juan.id,
      organization_id: organization.id,
      idea_key: idea.key,
      idea_title: idea.title,
      score: liveScore,
      status: nextStatus,
      rationale: humanDecisionLocked && previous?.rationale ? previous.rationale : rationale,
      capability_summary: idea.capability,
      evidence_snapshot: researchSnapshot,
      updated_at: new Date().toISOString(),
    }, { onConflict: "organization_id,idea_key" })
    if (handoffError) console.error(`[cron/juan-project-handoffs:handoff:${idea.key}]`, handoffError)

    scored.push({
      key: idea.key,
      title: idea.title,
      score: liveScore,
      status: nextStatus,
      humanDecisionLocked,
      papers: papers.length,
      patents: patentMatches.length,
      signals: signalMatches.length,
      canonicalEvidence: canonicalEvidenceCount,
      reuseAssets: idea.reuseAssets.length,
      institutionalScoreBoost: 0,
    })
  }

  let insertedEvidence = 0
  if (evidenceToInsert.length) {
    const { data, error } = await admin.from("intelligence_idea_evidence").insert(evidenceToInsert).select("id")
    if (error) console.error("[cron/juan-project-handoffs:evidence]", error)
    else insertedEvidence = data?.length ?? 0
  }

  const response = {
    ok: true,
    threshold: READY_THRESHOLD,
    researchMode: "deep_auto_v2_evidence_only",
    ideas: scored,
    awaitingDecision: scored.filter(item => item.status === "ready_for_n3uralia").length,
    evidenceAdded: insertedEvidence,
    durationMs: Date.now() - startedAt,
  }
  console.info("[cron/juan-project-handoffs]", JSON.stringify(response))
  return NextResponse.json(response)
}

async function findPapers(query: string, from: Date, to: Date) {
  const combined: Array<{ source: "OpenAlex" | "Crossref"; title: string; date: string | null; url: string; citedByCount: number }> = []
  try {
    const works = await searchOpenAlexWorks(query, from, to, 8)
    for (const work of works) combined.push({ source: "OpenAlex", title: work.title, date: work.date, url: work.url, citedByCount: work.citedByCount })
  } catch (error) {
    console.warn("[cron/juan-project-handoffs:openalex]", error)
  }
  if (combined.length < MAX_PER_LAYER) {
    try {
      const works = await searchCrossrefWorks(query, from, to, 8)
      for (const work of works) combined.push({ source: "Crossref", title: work.title, date: work.date, url: work.url, citedByCount: work.citedByCount })
    } catch (error) {
      console.warn("[cron/juan-project-handoffs:crossref]", error)
    }
  }
  const seen = new Set<string>()
  return combined
    .sort((a, b) => b.citedByCount - a.citedByCount || String(b.date ?? "").localeCompare(String(a.date ?? "")))
    .filter(item => {
      const key = normalize(item.title)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, MAX_PER_LAYER)
}

function findPatents(rows: Array<Record<string, unknown>>, terms: string[]) {
  return rows.flatMap(row => {
    const title = text(row.title)
    if (!title) return []
    const normalized = normalize(title)
    const score = terms.reduce((total, term) => total + (normalized.includes(normalize(term)) ? Math.max(1, normalize(term).split(" ").length) : 0), 0)
    return score > 0 ? [{
      score,
      title,
      applicants: text(row.applicants),
      date: text(row.publication_date) ?? text(row.filing_date),
      url: text(row.source_url),
    }] : []
  }).sort((a, b) => b.score - a.score || String(b.date ?? "").localeCompare(String(a.date ?? ""))).slice(0, MAX_PER_LAYER)
}

function findSignals(rows: Array<Record<string, unknown>>, terms: string[]) {
  return rows.flatMap(row => {
    const title = text(row.title)
    if (!title) return []
    const sourceKey = text(row.source_key) ?? "external"
    const haystack = normalize([title, text(row.summary), sourceKey].filter(Boolean).join(" "))
    const termScore = terms.reduce((total, term) => total + (haystack.includes(normalize(term)) ? Math.max(1, normalize(term).split(" ").length) : 0), 0)
    if (termScore <= 0) return []
    const relevance = text(row.relevance) ?? "media"
    return [{
      score: termScore + (relevance === "alta" ? 2 : 0),
      title,
      sourceKey,
      relevance,
      url: text(row.source_url),
      date: text(row.occurred_at) ?? text(row.last_seen_at),
    }]
  }).sort((a, b) => b.score - a.score || String(b.date ?? "").localeCompare(String(a.date ?? ""))).slice(0, MAX_PER_LAYER)
}

function inferEvidenceGaps(papers: number, patents: number, signals: number, reuseAssets: number) {
  const gaps: string[] = []
  if (!signals) gaps.push("Confirmar demanda, comprador o señal de mercado reciente.")
  if (!papers) gaps.push("Buscar evidencia científica o técnica reciente.")
  if (!patents) gaps.push("Completar landscape patentario y prior art.")
  if (!reuseAssets) gaps.push("Mapear código N3uralia reutilizable antes de diseñar desde cero.")
  if (!gaps.length) gaps.push("Validar problema real, willingness-to-pay y diferenciación antes de construir.")
  return gaps
}

function addEvidence(target: Array<Record<string, unknown>>, existing: Set<string>, row: Record<string, unknown>) {
  const key = `${String(row.idea_key)}|${normalize(String(row.title ?? ""))}|${String(row.source_url ?? "")}`
  if (existing.has(key)) return
  existing.add(key)
  target.push(row)
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim()
}
function text(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : null }
function humanSource(value: string) { return value.replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase()) }
