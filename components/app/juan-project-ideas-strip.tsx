import Link from "next/link"
import { Activity, ArrowRight, BookOpen, FileSearch, Github, Lightbulb, Radar } from "lucide-react"
import { searchCrossrefWorks } from "@/lib/intelligence/crossref"
import { searchOpenAlexWorks } from "@/lib/intelligence/openalex"
import { listPortfolioOrganizations } from "@/lib/intelligence/portfolio-access"
import { createAdminClient } from "@/lib/supabase/admin"

type Idea = {
  key: string
  title: string
  detail: string
  strength: number
  href: string
  source: string
  capability: string
  researchQuery: string
  patentSignals: string[]
  signalTerms: string[]
}

type PaperEvidence = {
  source: "OpenAlex" | "Crossref"
  title: string
  date: string | null
  url: string
  citedByCount: number
}

type PatentEvidence = {
  title: string
  applicants: string | null
  date: string | null
}

type ExternalSignal = {
  title: string
  summary: string | null
  sourceKey: string
  relevance: string
  date: string | null
  url: string | null
}

const capabilityIdeas: Idea[] = [
  {
    key: "capability:agentic-operations",
    title: "Agentic Operations Control Plane",
    detail: "Una capa común para agentes que ejecutan procesos reales con reglas, aprobación humana, evidencia y trazabilidad.",
    strength: 78,
    href: "/oportunidades/descubrir?q=agentic%20operations%20human%20in%20the%20loop",
    source: "Capacidad propia + frontera tecnológica",
    capability: "Open Agent Builder + MCP + Vertical OS",
    researchQuery: "AI agents human in the loop workflow orchestration",
    patentSignals: ["asignación de tareas", "gestión de asignación de tareas", "restricciones críticas"],
    signalTerms: ["agent", "agentic", "workflow", "autonomous", "automation", "orchestration"],
  },
  {
    key: "capability:agentic-compliance",
    title: "Agentic Compliance Operator",
    detail: "Un agente que reúne evidencia, detecta obligaciones, crea tareas y solicita validación humana antes de cerrar una acción.",
    strength: 76,
    href: "/oportunidades/descubrir?q=agentic%20AI%20compliance%20workflow",
    source: "Capacidad propia + regulación + IA",
    capability: "Kumplio + ChileFlota + PermisologIA + agentes",
    researchQuery: "agentic AI regulatory compliance autonomous workflow",
    patentSignals: ["consultas jurídicas", "tributarios y contadores", "control de marca personal"],
    signalTerms: ["compliance", "regulation", "regulatory", "norm", "legal", "fne", "tdlc", "bcn"],
  },
  {
    key: "capability:physical-intelligence",
    title: "Physical Intelligence Operator",
    detail: "Convertir cámaras y sensores en observaciones confiables que disparan revisión, decisión y trabajo operativo.",
    strength: 74,
    href: "/oportunidades/descubrir?q=multimodal%20AI%20computer%20vision%20edge",
    source: "Capacidad propia + señales físicas",
    capability: "Edge Intelligence + Clar1ty + MOTIL + agro/seafood",
    researchQuery: "multimodal AI computer vision edge autonomous systems",
    patentSignals: ["multimodal", "microscopía óptica", "campo de visión", "cámara con obturador", "reconocimiento de especies"],
    signalTerms: ["computer vision", "multimodal", "camera", "sensor", "edge", "vision", "image"],
  },
  {
    key: "capability:industrial-reliability",
    title: "Industrial AI Reliability Operator",
    detail: "Detectar fallas, restricciones y trabajo pendiente en activos industriales antes de que se conviertan en interrupciones operativas.",
    strength: 73,
    href: "/oportunidades/descubrir?q=industrial%20AI%20predictive%20maintenance%20asset%20reliability",
    source: "Capacidad propia + industria + IA",
    capability: "MOTIL + Facility Core + Edge Intelligence + mantenimiento operacional",
    researchQuery: "industrial AI predictive maintenance asset reliability machine learning",
    patentSignals: ["gestión de activos", "predecir fallas", "restricciones críticas", "equipos de minería"],
    signalTerms: ["maintenance", "asset", "reliability", "mining", "equipment", "industrial", "failure"],
  },
  {
    key: "capability:environmental-operations",
    title: "Environmental Operations Intelligence",
    detail: "Unir proyectos, permisos, fiscalización y evidencia ambiental para convertir cambios regulatorios en tareas concretas de revisión.",
    strength: 72,
    href: "/oportunidades/descubrir?q=AI%20environmental%20compliance%20industrial%20monitoring",
    source: "Capacidad propia + regulación ambiental",
    capability: "VIDENTIA + Kumplio + SEA/SEIA + SNIFA/SMA + agentes",
    researchQuery: "AI environmental compliance industrial monitoring regulation",
    patentSignals: ["monitoreo de variables", "sistema autónomo", "fuente de fluido", "instalación solar"],
    signalTerms: ["seia", "sea", "snifa", "sma", "environment", "ambiental", "permit", "environmental"],
  },
]

export async function JuanProjectIdeasStrip({ userId }: { userId: string }) {
  const admin = createAdminClient()
  const organizations = await listPortfolioOrganizations(admin, userId).catch(() => [])
  const organization = organizations[0] ?? null
  if (!organization) return null

  const [recommendationsResult, thesesResult, patentCandidatesResult, signalCandidatesResult] = await Promise.all([
    admin
      .from("intelligence_recommendations")
      .select("id,headline,recommended_action,score,tier,status,updated_at")
      .eq("organization_id", organization.id)
      .not("status", "in", '("discarded","converted_to_action")')
      .order("score", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(4),
    admin
      .from("innovation_opportunity_theses")
      .select("id,title,overall_score,evidence_strength,status,updated_at")
      .eq("organization_id", organization.id)
      .not("status", "in", '("rejected","archived")')
      .order("overall_score", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(4),
    admin
      .from("patent_records")
      .select("title,applicants,filing_date,publication_date")
      .or("title.ilike.%inteligencia artificial%,title.ilike.%aprendizaje automático%,title.ilike.%sistema autónomo%,title.ilike.%multimodal%,title.ilike.%asignación de tareas%,title.ilike.%microscopía%,title.ilike.%gestión de activos%,title.ilike.%monitoreo%")
      .order("publication_date", { ascending: false, nullsFirst: false })
      .limit(120),
    admin
      .from("intelligence_watch_events")
      .select("title,summary,source_key,relevance,source_url,occurred_at,last_seen_at")
      .eq("user_id", userId)
      .in("relevance", ["alta", "media"])
      .order("last_seen_at", { ascending: false })
      .limit(160),
  ])

  const recommendations = recommendationsResult.error ? [] : recommendationsResult.data ?? []
  const theses = thesesResult.error ? [] : thesesResult.data ?? []
  const patentCandidates = patentCandidatesResult.error ? [] : patentCandidatesResult.data ?? []
  const signalCandidates = signalCandidatesResult.error ? [] : signalCandidatesResult.data ?? []

  const persistedIdeas: Idea[] = [
    ...recommendations.map(item => ({
      key: `recommendation:${item.id}`,
      title: String(item.headline),
      detail: String(item.recommended_action || "Revisar la evidencia y decidir si merece investigación."),
      strength: Number(item.score ?? 0),
      href: "/oportunidades",
      source: "Señales + evidencia",
      capability: "Oportunidad ya detectada por VIDENTIA",
      researchQuery: String(item.headline),
      patentSignals: significantPhrases(String(item.headline)),
      signalTerms: significantPhrases(String(item.headline)),
    })),
    ...theses.map(item => ({
      key: `thesis:${item.id}`,
      title: String(item.title),
      detail: `Evidencia ${Math.round(Number(item.evidence_strength ?? 0))}/100 · conviene revisar la hipótesis y qué falta confirmar.`,
      strength: Number(item.overall_score ?? 0),
      href: "/oportunidades/tesis",
      source: "Hipótesis investigada",
      capability: "Hipótesis ya trabajada dentro de VIDENTIA",
      researchQuery: String(item.title),
      patentSignals: significantPhrases(String(item.title)),
      signalTerms: significantPhrases(String(item.title)),
    })),
  ]

  const candidateIdeas = [...persistedIdeas, ...capabilityIdeas]
    .sort((a, b) => b.strength - a.strength)
    .filter((idea, index, rows) => rows.findIndex(candidate => normalize(candidate.title) === normalize(idea.title)) === index)
    .slice(0, 8)

  const from = new Date(Date.now() - 540 * 86_400_000)
  const to = new Date()
  const enriched = await Promise.all(candidateIdeas.map(async idea => {
    const paper = await findPaperEvidence(idea.researchQuery, from, to)
    const patent = findPatentEvidence(patentCandidates, idea.patentSignals)
    const externalSignal = findExternalSignal(signalCandidates, idea.signalTerms)
    const liveStrength = idea.strength + (paper ? Math.min(8, 3 + Math.log10(Math.max(1, paper.citedByCount + 1)) * 2) : 0) + (patent ? 5 : 0) + (externalSignal ? externalSignal.relevance === "alta" ? 6 : 4 : 0)
    return { ...idea, paper, patent, externalSignal, liveStrength, whyNow: whyNowText(paper, patent, externalSignal) }
  }))

  const ideas = enriched
    .sort((a, b) => b.liveStrength - a.liveStrength)
    .slice(0, 5)

  return (
    <section className="mx-auto mt-4 w-[calc(100%-2rem)] max-w-[1480px] border-y border-[#294047] bg-[#0D2329] sm:w-[calc(100%-3rem)]">
      <div className="flex flex-col gap-3 border-b border-[#294047] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#173B37] text-[#96B5A6]"><Lightbulb className="h-4 w-4" /></span>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#96B5A6]">Ideas para proyectos · Juan</p>
            <p className="mt-1 text-sm text-[#E7DFCE]">Capacidades N3uralia cruzadas con papers, patentes y señales externas. Son hipótesis para investigar, no oportunidades confirmadas.</p>
          </div>
        </div>
        <Link href="/oportunidades/descubrir" className="inline-flex items-center gap-2 text-sm font-medium text-[#96B5A6] hover:text-white">
          Buscar más <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="divide-y divide-[#294047] xl:grid xl:grid-cols-5 xl:divide-x xl:divide-y-0">
        {ideas.map(idea => (
          <article key={idea.key} className="px-4 py-4 sm:px-5">
            <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.12em] text-[#83908F]"><span className="flex items-center gap-2"><Radar className="h-3 w-3" />{idea.source}</span><span>{Math.round(idea.liveStrength)}</span></div>
            <h2 className="mt-2 text-sm font-medium leading-6 text-white">{idea.title}</h2>
            <p className="mt-1.5 text-xs leading-5 text-[#AEB6B4]">{idea.detail}</p>
            <p className="mt-3 text-[11px] leading-5 text-[#D5DDD9]"><span className="font-medium text-[#96B5A6]">Por qué ahora:</span> {idea.whyNow}</p>

            <div className="mt-3 space-y-2 border-t border-[#294047] pt-3">
              <EvidenceLine icon={Github} label="Qué ya tenemos" text={idea.capability} />
              {idea.paper ? <EvidenceLink icon={BookOpen} label={`Paper · ${idea.paper.source}`} text={`${idea.paper.title}${idea.paper.date ? ` · ${idea.paper.date}` : ""}`} href={idea.paper.url} /> : <EvidenceLine icon={BookOpen} label="Papers" text="Sin coincidencia suficientemente precisa en la ventana reciente." muted />}
              {idea.patent ? <EvidenceLine icon={FileSearch} label="Patente" text={`${idea.patent.title}${idea.patent.applicants ? ` · ${idea.patent.applicants}` : ""}${idea.patent.date ? ` · ${idea.patent.date}` : ""}`} /> : <EvidenceLine icon={FileSearch} label="Patentes" text="Sin coincidencia fuerte en el corpus INAPI observado." muted />}
              {idea.externalSignal ? <EvidenceLink icon={Activity} label={`Señal · ${humanSource(idea.externalSignal.sourceKey)}`} text={`${idea.externalSignal.title}${idea.externalSignal.date ? ` · ${idea.externalSignal.date}` : ""}`} href={idea.externalSignal.url} /> : <EvidenceLine icon={Activity} label="Señales" text="Sin señal alta/media suficientemente relacionada en tus seguimientos actuales." muted />}
            </div>

            <Link href={idea.href} className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#96B5A6] hover:text-white">Investigar qué falta <ArrowRight className="h-3.5 w-3.5" /></Link>
          </article>
        ))}
      </div>
    </section>
  )
}

async function findPaperEvidence(query: string, from: Date, to: Date): Promise<PaperEvidence | null> {
  try {
    const works = await searchOpenAlexWorks(query, from, to, 4)
    const best = [...works].sort((a, b) => b.citedByCount - a.citedByCount)[0]
    if (best) return { source: "OpenAlex", title: best.title, date: best.date, url: best.url, citedByCount: best.citedByCount }
  } catch (error) {
    console.warn("[juan-project-ideas:openalex]", error)
  }
  try {
    const works = await searchCrossrefWorks(query, from, to, 4)
    const best = [...works].sort((a, b) => b.citedByCount - a.citedByCount)[0]
    if (best) return { source: "Crossref", title: best.title, date: best.date, url: best.url, citedByCount: best.citedByCount }
  } catch (error) {
    console.warn("[juan-project-ideas:crossref]", error)
  }
  return null
}

function findPatentEvidence(rows: Array<Record<string, unknown>>, signals: string[]): PatentEvidence | null {
  if (!signals.length) return null
  const scored = rows.flatMap(row => {
    const title = typeof row.title === "string" ? row.title.trim() : ""
    if (!title) return []
    const normalizedTitle = normalize(title)
    const score = signals.reduce((total, signal) => total + (normalizedTitle.includes(normalize(signal)) ? Math.max(1, normalize(signal).split(" ").length) : 0), 0)
    if (score <= 0) return []
    return [{ score, title, applicants: typeof row.applicants === "string" && row.applicants.trim() ? row.applicants.trim() : null, date: typeof row.publication_date === "string" && row.publication_date ? row.publication_date : typeof row.filing_date === "string" ? row.filing_date : null }]
  })
  scored.sort((a, b) => b.score - a.score || String(b.date ?? "").localeCompare(String(a.date ?? "")))
  return scored[0] ?? null
}

function findExternalSignal(rows: Array<Record<string, unknown>>, terms: string[]): ExternalSignal | null {
  if (!terms.length) return null
  const scored = rows.flatMap(row => {
    const title = text(row.title)
    if (!title) return []
    const summary = text(row.summary)
    const sourceKey = text(row.source_key) ?? "external"
    const haystack = normalize([title, summary, sourceKey, text(row.event_type)].filter(Boolean).join(" "))
    const score = terms.reduce((total, term) => total + (haystack.includes(normalize(term)) ? Math.max(1, normalize(term).split(" ").length) : 0), 0)
    if (score <= 0) return []
    return [{ score: score + (String(row.relevance) === "alta" ? 2 : 0), title, summary, sourceKey, relevance: text(row.relevance) ?? "media", date: text(row.occurred_at) ?? text(row.last_seen_at), url: text(row.source_url) }]
  })
  scored.sort((a, b) => b.score - a.score || String(b.date ?? "").localeCompare(String(a.date ?? "")))
  return scored[0] ?? null
}

function whyNowText(paper: PaperEvidence | null, patent: PatentEvidence | null, signal: ExternalSignal | null) {
  const layers = [paper ? "hay actividad científica reciente" : null, patent ? "existe actividad patentaria relacionada" : null, signal ? "tus seguimientos ya muestran una señal externa relevante" : null].filter(Boolean)
  return layers.length ? `${layers.join(" y ")}. Conviene comprobar problema, usuario y disposición a actuar antes de tratarlo como oportunidad.` : "La capacidad interna existe, pero todavía falta evidencia externa suficiente. Conviene investigar antes de priorizarla."
}

function significantPhrases(value: string) {
  return normalize(value).split(/[^a-z0-9]+/).filter(token => token.length >= 6).slice(0, 6)
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim()
}

function text(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : null }
function humanSource(value: string) { return value.replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase()) }

function EvidenceLine({ icon: Icon, label, text: value, muted = false }: { icon: typeof Github; label: string; text: string; muted?: boolean }) {
  return <div className="flex items-start gap-2"><Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6F807E]"/><p className={`text-[11px] leading-5 ${muted ? "text-[#738180]" : "text-[#AEB6B4]"}`}><span className="font-medium text-[#D6DDDA]">{label}:</span> {value}</p></div>
}

function EvidenceLink({ icon: Icon, label, text: value, href }: { icon: typeof BookOpen; label: string; text: string; href: string | null }) {
  if (!href) return <EvidenceLine icon={Icon} label={label} text={value} />
  return <div className="flex items-start gap-2"><Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6F807E]"/><p className="text-[11px] leading-5 text-[#AEB6B4]"><span className="font-medium text-[#D6DDDA]">{label}:</span> <a href={href} target="_blank" rel="noreferrer" className="hover:text-white hover:underline">{value}</a></p></div>
}
