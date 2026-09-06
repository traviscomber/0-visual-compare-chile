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

type ProjectIdea = {
  key: string
  title: string
  strength: number
  capability: string
  researchQuery: string
  patentSignals: string[]
  signalTerms: string[]
}

const PROJECT_IDEAS: ProjectIdea[] = [
  {
    key: "capability:agentic-operations",
    title: "Agentic Operations Control Plane",
    strength: 78,
    capability: "Open Agent Builder + MCP + Vertical OS",
    researchQuery: "AI agents human in the loop workflow orchestration",
    patentSignals: ["asignación de tareas", "gestión de asignación de tareas", "restricciones críticas"],
    signalTerms: ["agent", "agentic", "workflow", "autonomous", "automation", "orchestration"],
  },
  {
    key: "capability:agentic-compliance",
    title: "Agentic Compliance Operator",
    strength: 76,
    capability: "Kumplio + ChileFlota + PermisologIA + agentes",
    researchQuery: "agentic AI regulatory compliance autonomous workflow",
    patentSignals: ["consultas jurídicas", "tributarios y contadores", "control de marca personal"],
    signalTerms: ["compliance", "regulation", "regulatory", "norm", "legal", "fne", "tdlc", "bcn"],
  },
  {
    key: "capability:physical-intelligence",
    title: "Physical Intelligence Operator",
    strength: 74,
    capability: "Edge Intelligence + Clar1ty + MOTIL + agro/seafood",
    researchQuery: "multimodal AI computer vision edge autonomous systems",
    patentSignals: ["multimodal", "microscopía óptica", "campo de visión", "cámara con obturador", "reconocimiento de especies"],
    signalTerms: ["computer vision", "multimodal", "camera", "sensor", "edge", "vision", "image"],
  },
  {
    key: "capability:industrial-reliability",
    title: "Industrial AI Reliability Operator",
    strength: 73,
    capability: "MOTIL + Facility Core + Edge Intelligence + mantenimiento operacional",
    researchQuery: "industrial AI predictive maintenance asset reliability machine learning",
    patentSignals: ["gestión de activos", "predecir fallas", "restricciones críticas", "equipos de minería"],
    signalTerms: ["maintenance", "asset", "reliability", "mining", "equipment", "industrial", "failure"],
  },
  {
    key: "capability:environmental-operations",
    title: "Environmental Operations Intelligence",
    strength: 72,
    capability: "VIDENTIA + Kumplio + SEA/SEIA + SNIFA/SMA + agentes",
    researchQuery: "AI environmental compliance industrial monitoring regulation",
    patentSignals: ["monitoreo de variables", "sistema autónomo", "fuente de fluido", "instalación solar"],
    signalTerms: ["seia", "sea", "snifa", "sma", "environment", "ambiental", "permit", "environmental"],
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

  const [patentsResult, signalsResult, manualResult] = await Promise.all([
    admin
      .from("patent_records")
      .select("title,applicants,filing_date,publication_date")
      .or("title.ilike.%inteligencia artificial%,title.ilike.%aprendizaje automático%,title.ilike.%sistema autónomo%,title.ilike.%multimodal%,title.ilike.%asignación de tareas%,title.ilike.%microscopía%,title.ilike.%gestión de activos%,title.ilike.%monitoreo%")
      .order("publication_date", { ascending: false, nullsFirst: false })
      .limit(160),
    admin
      .from("intelligence_watch_events")
      .select("title,summary,source_key,relevance,source_url,occurred_at,last_seen_at")
      .eq("user_id", juan.id)
      .in("relevance", ["alta", "media"])
      .order("last_seen_at", { ascending: false })
      .limit(220),
    admin
      .from("intelligence_idea_evidence")
      .select("idea_key,title,source_url")
      .eq("user_id", juan.id)
      .eq("organization_id", organization.id)
      .limit(1000),
  ])

  const patents = patentsResult.error ? [] : patentsResult.data ?? []
  const signals = signalsResult.error ? [] : signalsResult.data ?? []
  const existing = manualResult.error ? [] : manualResult.data ?? []
  const existingKeys = new Set(existing.map(row => `${String(row.idea_key)}|${normalize(String(row.title ?? ""))}|${String(row.source_url ?? "")}`))

  const from = new Date(Date.now() - 540 * 86_400_000)
  const to = new Date()
  const scored = [] as Array<Record<string, unknown>>
  const evidenceToInsert: Array<Record<string, unknown>> = []

  for (const idea of PROJECT_IDEAS) {
    const paper = await findPaper(idea.researchQuery, from, to)
    const patent = findPatent(patents, idea.patentSignals)
    const signal = findSignal(signals, idea.signalTerms)
    const ownCount = existing.filter(row => row.idea_key === idea.key).length
    const liveScore = Math.min(100, Math.round(
      idea.strength
      + (paper ? Math.min(8, 3 + Math.log10(Math.max(1, paper.citedByCount + 1)) * 2) : 0)
      + (patent ? 5 : 0)
      + (signal ? signal.relevance === "alta" ? 6 : 4 : 0)
      + Math.min(6, ownCount * 2),
    ))

    if (paper) addEvidence(evidenceToInsert, existingKeys, {
      user_id: juan.id,
      organization_id: organization.id,
      idea_key: idea.key,
      evidence_type: "paper",
      title: paper.title,
      source_url: paper.url,
      note: `Encontrado automáticamente por VIDENTIA · ${paper.source}${paper.date ? ` · ${paper.date}` : ""}`,
    })
    if (patent) addEvidence(evidenceToInsert, existingKeys, {
      user_id: juan.id,
      organization_id: organization.id,
      idea_key: idea.key,
      evidence_type: "patent",
      title: patent.title,
      source_url: null,
      note: `Encontrado automáticamente en el corpus de patentes${patent.applicants ? ` · ${patent.applicants}` : ""}${patent.date ? ` · ${patent.date}` : ""}`,
    })
    if (signal) addEvidence(evidenceToInsert, existingKeys, {
      user_id: juan.id,
      organization_id: organization.id,
      idea_key: idea.key,
      evidence_type: signal.sourceKey.includes("news") ? "news" : "market",
      title: signal.title,
      source_url: signal.url,
      note: `Señal ${signal.relevance} encontrada automáticamente · ${humanSource(signal.sourceKey)}`,
    })

    const ready = liveScore > READY_THRESHOLD
    if (ready) {
      const { error: handoffError } = await admin.from("intelligence_project_handoffs").upsert({
        user_id: juan.id,
        organization_id: organization.id,
        idea_key: idea.key,
        idea_title: idea.title,
        score: liveScore,
        status: "ready_for_n3uralia",
        rationale: "Superó el umbral de 90 con evidencia tecnológica y señales externas suficientes para preparar el traspaso a N3uralia.",
        capability_summary: idea.capability,
        evidence_snapshot: {
          threshold: READY_THRESHOLD,
          rule: "score > 90",
          paper: paper ? { source: paper.source, title: paper.title, url: paper.url, date: paper.date } : null,
          patent: patent ? { title: patent.title, applicants: patent.applicants, date: patent.date } : null,
          signal: signal ? { title: signal.title, source: signal.sourceKey, url: signal.url, relevance: signal.relevance } : null,
          observed_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: "organization_id,idea_key" })
      if (handoffError) console.error(`[cron/juan-project-handoffs:handoff:${idea.key}]`, handoffError)
    }

    scored.push({ key: idea.key, title: idea.title, score: liveScore, ready, paper: Boolean(paper), patent: Boolean(patent), signal: Boolean(signal) })
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
    ideas: scored,
    ready: scored.filter(item => item.ready).length,
    evidenceAdded: insertedEvidence,
    durationMs: Date.now() - startedAt,
  }
  console.info("[cron/juan-project-handoffs]", JSON.stringify(response))
  return NextResponse.json(response)
}

async function findPaper(query: string, from: Date, to: Date) {
  try {
    const works = await searchOpenAlexWorks(query, from, to, 4)
    const best = [...works].sort((a, b) => b.citedByCount - a.citedByCount)[0]
    if (best) return { source: "OpenAlex" as const, title: best.title, date: best.date, url: best.url, citedByCount: best.citedByCount }
  } catch (error) {
    console.warn("[cron/juan-project-handoffs:openalex]", error)
  }
  try {
    const works = await searchCrossrefWorks(query, from, to, 4)
    const best = [...works].sort((a, b) => b.citedByCount - a.citedByCount)[0]
    if (best) return { source: "Crossref" as const, title: best.title, date: best.date, url: best.url, citedByCount: best.citedByCount }
  } catch (error) {
    console.warn("[cron/juan-project-handoffs:crossref]", error)
  }
  return null
}

function findPatent(rows: Array<Record<string, unknown>>, terms: string[]) {
  const matches = rows.flatMap(row => {
    const title = text(row.title)
    if (!title) return []
    const normalized = normalize(title)
    const score = terms.reduce((total, term) => total + (normalized.includes(normalize(term)) ? Math.max(1, normalize(term).split(" ").length) : 0), 0)
    return score > 0 ? [{ score, title, applicants: text(row.applicants), date: text(row.publication_date) ?? text(row.filing_date) }] : []
  })
  return matches.sort((a, b) => b.score - a.score || String(b.date ?? "").localeCompare(String(a.date ?? "")))[0] ?? null
}

function findSignal(rows: Array<Record<string, unknown>>, terms: string[]) {
  const matches = rows.flatMap(row => {
    const title = text(row.title)
    if (!title) return []
    const sourceKey = text(row.source_key) ?? "external"
    const haystack = normalize([title, text(row.summary), sourceKey].filter(Boolean).join(" "))
    const termScore = terms.reduce((total, term) => total + (haystack.includes(normalize(term)) ? Math.max(1, normalize(term).split(" ").length) : 0), 0)
    if (termScore <= 0) return []
    const relevance = text(row.relevance) ?? "media"
    return [{ score: termScore + (relevance === "alta" ? 2 : 0), title, sourceKey, relevance, url: text(row.source_url), date: text(row.occurred_at) ?? text(row.last_seen_at) }]
  })
  return matches.sort((a, b) => b.score - a.score || String(b.date ?? "").localeCompare(String(a.date ?? "")))[0] ?? null
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
