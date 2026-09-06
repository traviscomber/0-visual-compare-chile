import Link from "next/link"
import { Activity, ArrowRight, BookOpen, CheckCircle2, FileSearch, GitBranch, Github, Lightbulb, Plus, Radar } from "lucide-react"
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
type PaperEvidence = { source: "OpenAlex" | "Crossref" | "VIDENTIA"; title: string; date: string | null; url: string; citedByCount: number }
type PatentEvidence = { title: string; applicants: string | null; date: string | null; url?: string | null }
type ExternalSignal = { title: string; summary: string | null; sourceKey: string; relevance: string; date: string | null; url: string | null }
type ManualEvidence = { idea_key: string; evidence_type: string; title: string; source_url: string | null; note: string | null; observed_at: string | null; created_at: string }
type ReuseAsset = { title?: string; url?: string; reuse?: string }
type ProjectHandoff = {
  idea_key: string
  score: number
  status: "ready_for_n3uralia" | "accepted" | "paused" | "closed"
  rationale: string | null
  evidence_snapshot: Record<string, unknown> | null
  updated_at: string
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
    researchQuery: "AI agents human in the loop workflow orchestration governance control plane",
    patentSignals: ["asignación de tareas", "gestión de asignación de tareas", "restricciones críticas", "agentes"],
    signalTerms: ["agent", "agentic", "workflow", "autonomous", "automation", "orchestration", "governance"],
  },
  {
    key: "capability:agentic-compliance",
    title: "Agentic Compliance Operator",
    detail: "Un agente que reúne evidencia, detecta obligaciones, crea tareas y solicita validación humana antes de cerrar una acción.",
    strength: 76,
    href: "/oportunidades/descubrir?q=agentic%20AI%20compliance%20workflow",
    source: "Capacidad propia + regulación + IA",
    capability: "Kumplio + ChileFlota + VIDENTIA + agentes",
    researchQuery: "agentic AI regulatory compliance autonomous workflow evidence human oversight",
    patentSignals: ["consultas jurídicas", "tributarios y contadores", "cumplimiento", "regulación"],
    signalTerms: ["compliance", "regulation", "regulatory", "norm", "legal", "privacy", "audit"],
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
    patentSignals: ["multimodal", "microscopía óptica", "campo de visión", "cámara", "reconocimiento de especies"],
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

  const [recommendationsResult, thesesResult, patentCandidatesResult, signalCandidatesResult, evidenceResult, handoffsResult] = await Promise.all([
    admin.from("intelligence_recommendations").select("id,headline,recommended_action,score,status,updated_at").eq("organization_id", organization.id).not("status", "in", '("discarded","converted_to_action")').order("score", { ascending: false }).limit(4),
    admin.from("innovation_opportunity_theses").select("id,title,overall_score,evidence_strength,status,updated_at").eq("organization_id", organization.id).not("status", "in", '("rejected","archived")').order("overall_score", { ascending: false }).limit(4),
    admin.from("patent_records").select("title,applicants,filing_date,publication_date,source_url").or("title.ilike.%inteligencia artificial%,title.ilike.%aprendizaje automático%,title.ilike.%sistema autónomo%,title.ilike.%multimodal%,title.ilike.%asignación de tareas%,title.ilike.%gestión de activos%,title.ilike.%monitoreo%,title.ilike.%cumplimiento%").order("publication_date", { ascending: false, nullsFirst: false }).limit(160),
    admin.from("intelligence_watch_events").select("title,summary,source_key,relevance,source_url,occurred_at,last_seen_at").eq("user_id", userId).in("relevance", ["alta", "media"]).order("last_seen_at", { ascending: false }).limit(220),
    admin.from("intelligence_idea_evidence").select("idea_key,evidence_type,title,source_url,note,observed_at,created_at").eq("user_id", userId).eq("organization_id", organization.id).order("created_at", { ascending: false }).limit(500),
    admin.from("intelligence_project_handoffs").select("idea_key,score,status,rationale,evidence_snapshot,updated_at").eq("user_id", userId).eq("organization_id", organization.id).order("score", { ascending: false }),
  ])

  const recommendations = recommendationsResult.error ? [] : recommendationsResult.data ?? []
  const theses = thesesResult.error ? [] : thesesResult.data ?? []
  const patents = patentCandidatesResult.error ? [] : patentCandidatesResult.data ?? []
  const signals = signalCandidatesResult.error ? [] : signalCandidatesResult.data ?? []
  const evidence = evidenceResult.error ? [] : (evidenceResult.data ?? []) as ManualEvidence[]
  const handoffs = handoffsResult.error ? [] : (handoffsResult.data ?? []) as ProjectHandoff[]
  const handoffByIdea = new Map(handoffs.map(item => [item.idea_key, item]))

  const persistedIdeas: Idea[] = [
    ...recommendations.map(item => ({ key: `recommendation:${item.id}`, title: String(item.headline), detail: String(item.recommended_action || "Revisar la evidencia y decidir si merece investigación."), strength: Number(item.score ?? 0), href: "/oportunidades", source: "Señales + evidencia", capability: "Oportunidad ya detectada por VIDENTIA", researchQuery: String(item.headline), patentSignals: significantPhrases(String(item.headline)), signalTerms: significantPhrases(String(item.headline)) })),
    ...theses.map(item => ({ key: `thesis:${item.id}`, title: String(item.title), detail: `Evidencia ${Math.round(Number(item.evidence_strength ?? 0))}/100 · VIDENTIA sigue completando la hipótesis.`, strength: Number(item.overall_score ?? 0), href: "/oportunidades/tesis", source: "Hipótesis investigada", capability: "Hipótesis ya trabajada dentro de VIDENTIA", researchQuery: String(item.title), patentSignals: significantPhrases(String(item.title)), signalTerms: significantPhrases(String(item.title)) })),
  ]

  const candidates = [...persistedIdeas, ...capabilityIdeas]
    .sort((a, b) => b.strength - a.strength)
    .filter((idea, index, rows) => rows.findIndex(candidate => normalize(candidate.title) === normalize(idea.title)) === index)
    .slice(0, 10)

  const from = new Date(Date.now() - 730 * 86_400_000)
  const to = new Date()
  const enriched = await Promise.all(candidates.map(async idea => {
    const autoPaper = await findPaperEvidence(idea.researchQuery, from, to)
    const autoPatent = findPatentEvidence(patents, idea.patentSignals)
    const autoExternalSignal = findExternalSignal(signals, idea.signalTerms)
    const ownEvidence = evidence
      .filter(item => item.idea_key === idea.key)
      .sort((a, b) => evidenceTimestamp(b).localeCompare(evidenceTimestamp(a)) || a.title.localeCompare(b.title))
    const canonicalPaper = ownEvidence.find(item => item.evidence_type === "paper") ?? null
    const canonicalPatent = ownEvidence.find(item => item.evidence_type === "patent") ?? null
    const canonicalSignal = ownEvidence.find(item => ["market", "regulation", "signal"].includes(item.evidence_type)) ?? null
    const paper = canonicalPaper ? manualPaperEvidence(canonicalPaper) : null
    const patent = canonicalPatent ? manualPatentEvidence(canonicalPatent) : null
    const externalSignal = canonicalSignal ? manualExternalSignal(canonicalSignal) : null
    const handoff = handoffByIdea.get(idea.key) ?? null
    // Preserve the existing score inputs. Canonical selection changes presentation only,
    // never conviction, handoff state or a human decision.
    const computedScore = Math.min(100, idea.strength
      + (autoPaper ? Math.min(8, 3 + Math.log10(Math.max(1, autoPaper.citedByCount + 1)) * 2) : 0)
      + (autoPatent ? 5 : 0)
      + (autoExternalSignal ? autoExternalSignal.relevance === "alta" ? 6 : 4 : 0)
      + Math.min(6, ownEvidence.length))
    const liveStrength = handoff ? Number(handoff.score) : computedScore
    const reuseAssets = readReuseAssets(handoff?.evidence_snapshot)
    return { ...idea, paper, patent, externalSignal, ownEvidence, handoff, reuseAssets, liveStrength, whyNow: whyNowText(paper, patent, externalSignal, ownEvidence.length) }
  }))

  const visible = enriched
    .filter(idea => idea.handoff?.status !== "closed")
    .sort((a, b) => b.liveStrength - a.liveStrength)
    .slice(0, 5)
  const awaiting = visible.filter(idea => idea.handoff?.status === "ready_for_n3uralia")
  const accepted = visible.filter(idea => idea.handoff?.status === "accepted")
  const researching = visible.filter(idea => !idea.handoff || idea.handoff.status === "paused")

  return <section className="mx-auto mt-4 w-[calc(100%-2rem)] max-w-[1480px] border-y border-[#294047] bg-[#0D2329] sm:w-[calc(100%-3rem)]">
    <div className="flex flex-col gap-3 border-b border-[#294047] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#173B37] text-[#96B5A6]"><Lightbulb className="h-4 w-4" /></span>
        <div><p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#96B5A6]">Nuevas oportunidades institucionales · Juan</p><p className="mt-1 text-sm text-[#E7DFCE]">VIDENTIA investiga evidencia específica para cada oportunidad y enlaza capacidad N3uralia por separado. Tú decides cuando el estudio está listo.</p></div>
      </div>
      <Link href="/oportunidades/descubrir" className="inline-flex items-center gap-2 text-sm font-medium text-[#96B5A6] hover:text-white">Buscar más <ArrowRight className="h-4 w-4" /></Link>
    </div>

    {awaiting.length ? <IdeaGroup title={`Pendientes de tu decisión · ${awaiting.length}`} tone="decision" ideas={awaiting} /> : null}
    {accepted.length ? <IdeaGroup title={`Aprobados · ${accepted.length}`} tone="accepted" ideas={accepted} /> : null}
    {researching.length ? <IdeaGroup title={`VIDENTIA sigue investigando · ${researching.length}`} tone="research" ideas={researching} /> : null}
  </section>
}

type EnrichedIdea = Idea & {
  paper: PaperEvidence | null
  patent: PatentEvidence | null
  externalSignal: ExternalSignal | null
  ownEvidence: ManualEvidence[]
  handoff: ProjectHandoff | null
  reuseAssets: ReuseAsset[]
  liveStrength: number
  whyNow: string
}

type GroupTone = "decision" | "accepted" | "research"
function IdeaGroup({ title, ideas, tone }: { title: string; ideas: EnrichedIdea[]; tone: GroupTone }) {
  return <div className="border-b border-[#294047] last:border-b-0">
    <div className="flex items-center gap-2 border-b border-[#294047] px-4 py-2.5 sm:px-5">
      {tone === "decision" ? <CheckCircle2 className="h-3.5 w-3.5 text-[#96B5A6]" /> : tone === "accepted" ? <CheckCircle2 className="h-3.5 w-3.5 text-[#B8D5C6]" /> : <Radar className="h-3.5 w-3.5 text-[#83908F]" />}
      <p className={`text-[10px] font-medium uppercase tracking-[0.14em] ${tone === "research" ? "text-[#83908F]" : "text-[#96B5A6]"}`}>{title}</p>
    </div>
    <div className={`divide-y divide-[#294047] ${ideas.length > 1 ? "xl:grid xl:grid-cols-5 xl:divide-x xl:divide-y-0" : ""}`}>
      {ideas.map(idea => <IdeaCard key={idea.key} idea={idea} tone={tone} />)}
    </div>
  </div>
}

function IdeaCard({ idea, tone }: { idea: EnrichedIdea; tone: GroupTone }) {
  const evidenceHref = `/oportunidades/evidencia?ideaKey=${encodeURIComponent(idea.key)}&ideaTitle=${encodeURIComponent(idea.title)}`
  const decision = tone === "decision"
  const accepted = tone === "accepted"
  return <article className={`px-4 py-4 sm:px-5 ${decision ? "bg-[#102A2C]" : ""}`}>
    <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.12em] text-[#83908F]"><span className="flex min-w-0 items-center gap-2"><Radar className="h-3 w-3 shrink-0" /><span className="truncate">{idea.source}</span></span><span className={decision || accepted ? "font-semibold text-[#B8D5C6]" : ""}>{Math.round(idea.liveStrength)}</span></div>
    {decision ? <div className="mt-2 inline-flex items-center gap-1.5 rounded-[6px] bg-[#173B37] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#B8D5C6]"><CheckCircle2 className="h-3 w-3" />Estudio listo · decide tú</div> : null}
    {accepted ? <div className="mt-2 inline-flex items-center gap-1.5 rounded-[6px] bg-[#173B37] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#B8D5C6]"><CheckCircle2 className="h-3 w-3" />Aprobado</div> : null}
    <h2 className="mt-2 text-sm font-medium leading-6 text-white">{idea.title}</h2>
    <p className="mt-1.5 text-xs leading-5 text-[#AEB6B4]">{idea.detail}</p>
    <p className="mt-3 text-[11px] leading-5 text-[#D5DDD9]"><span className="font-medium text-[#96B5A6]">{decision ? "Conclusión del estudio:" : accepted ? "Decisión:" : "Por qué ahora:"}</span> {idea.handoff?.rationale || idea.whyNow}</p>

    <div className="mt-3 space-y-2 border-t border-[#294047] pt-3">
      <EvidenceLine icon={Github} label="Qué ya tenemos" text={idea.capability} />
      {idea.reuseAssets.length ? <EvidenceLine icon={GitBranch} label="Código reciclable" text={`${idea.reuseAssets.length} repos/componentes enlazados en el expediente.`} /> : null}
      {idea.paper ? <EvidenceLink icon={BookOpen} label={`Paper · ${idea.paper.source}`} text={compactEvidence(idea.paper.title)} meta={idea.paper.date} href={idea.paper.url} /> : <EvidenceLine icon={BookOpen} label="Papers" text="Sin paper específico validado para esta oportunidad todavía." muted />}
      {idea.patent ? <EvidenceLink icon={FileSearch} label="Patente" text={compactEvidence(idea.patent.title)} meta={[idea.patent.applicants, idea.patent.date].filter(Boolean).join(" · ")} href={idea.patent.url ?? null} /> : <EvidenceLine icon={FileSearch} label="Patentes" text="Sin patente específica validada para esta oportunidad todavía." muted />}
      {idea.externalSignal ? <EvidenceLink icon={Activity} label={`Señal · ${humanSource(idea.externalSignal.sourceKey)}`} text={compactEvidence(idea.externalSignal.title)} meta={idea.externalSignal.date} href={idea.externalSignal.url} /> : <EvidenceLine icon={Activity} label="Señales" text="Sin señal específica validada para esta oportunidad todavía." muted />}
    </div>

    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
      {decision ? <Link href={evidenceHref} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B8D5C6] hover:text-white">Revisar y decidir <ArrowRight className="h-3.5 w-3.5" /></Link> : accepted ? <Link href={evidenceHref} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B8D5C6] hover:text-white">Abrir proyecto <ArrowRight className="h-3.5 w-3.5" /></Link> : <Link href={evidenceHref} className="inline-flex items-center gap-1.5 text-xs font-medium text-[#96B5A6] hover:text-white">Ver estudio <ArrowRight className="h-3.5 w-3.5" /></Link>}
      {!decision && !accepted ? <Link href={evidenceHref} className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D6DDDA] hover:text-white"><Plus className="h-3.5 w-3.5" />Agregar dato</Link> : null}
    </div>
  </article>
}

async function findPaperEvidence(query: string, from: Date, to: Date): Promise<PaperEvidence | null> {
  try {
    const works = await searchOpenAlexWorks(query, from, to, 4)
    const best = [...works].sort((a, b) => b.citedByCount - a.citedByCount)[0]
    if (best) return { source: "OpenAlex", title: best.title, date: best.date, url: best.url, citedByCount: best.citedByCount }
  } catch (error) { console.warn("[juan-project-ideas:openalex]", error) }
  try {
    const works = await searchCrossrefWorks(query, from, to, 4)
    const best = [...works].sort((a, b) => b.citedByCount - a.citedByCount)[0]
    if (best) return { source: "Crossref", title: best.title, date: best.date, url: best.url, citedByCount: best.citedByCount }
  } catch (error) { console.warn("[juan-project-ideas:crossref]", error) }
  return null
}

function findPatentEvidence(rows: Array<Record<string, unknown>>, terms: string[]): PatentEvidence | null {
  const matches = rows.flatMap(row => {
    const title = text(row.title)
    if (!title) return []
    const normalized = normalize(title)
    const score = terms.reduce((total, term) => total + (normalized.includes(normalize(term)) ? Math.max(1, normalize(term).split(" ").length) : 0), 0)
    return score > 0 ? [{ score, title, applicants: text(row.applicants), date: text(row.publication_date) ?? text(row.filing_date), url: text(row.source_url) }] : []
  })
  return matches.sort((a, b) => b.score - a.score || String(b.date ?? "").localeCompare(String(a.date ?? "")))[0] ?? null
}

function findExternalSignal(rows: Array<Record<string, unknown>>, terms: string[]): ExternalSignal | null {
  const matches = rows.flatMap(row => {
    const title = text(row.title)
    if (!title) return []
    const sourceKey = text(row.source_key) ?? "external"
    const haystack = normalize([title, text(row.summary), sourceKey].filter(Boolean).join(" "))
    const score = terms.reduce((total, term) => total + (haystack.includes(normalize(term)) ? Math.max(1, normalize(term).split(" ").length) : 0), 0)
    if (score <= 0) return []
    const relevance = text(row.relevance) ?? "media"
    return [{ score: score + (relevance === "alta" ? 2 : 0), title, summary: text(row.summary), sourceKey, relevance, date: text(row.occurred_at) ?? text(row.last_seen_at), url: text(row.source_url) }]
  })
  return matches.sort((a, b) => b.score - a.score || String(b.date ?? "").localeCompare(String(a.date ?? "")))[0] ?? null
}

function evidenceTimestamp(item: ManualEvidence) {
  return item.observed_at || item.created_at || ""
}
function manualPaperEvidence(item: ManualEvidence): PaperEvidence {
  return { source: "VIDENTIA", title: item.title, date: item.observed_at ?? item.created_at, url: item.source_url ?? "", citedByCount: 0 }
}
function manualPatentEvidence(item: ManualEvidence): PatentEvidence {
  return { title: item.title, applicants: null, date: item.observed_at ?? item.created_at, url: item.source_url }
}
function manualExternalSignal(item: ManualEvidence): ExternalSignal {
  return { title: item.title, summary: item.note, sourceKey: item.evidence_type, relevance: "alta", date: item.observed_at ?? item.created_at, url: item.source_url }
}
function readReuseAssets(snapshot: Record<string, unknown> | null | undefined): ReuseAsset[] {
  if (!snapshot || typeof snapshot !== "object") return []
  const value = snapshot.reuse_assets
  return Array.isArray(value) ? value.filter(item => item && typeof item === "object") as ReuseAsset[] : []
}
function whyNowText(paper: PaperEvidence | null, patent: PatentEvidence | null, signal: ExternalSignal | null, evidenceCount: number) {
  const layers = [paper ? "actividad científica específica" : null, patent ? "actividad patentaria específica" : null, signal ? "una señal externa específica" : null, evidenceCount ? `${evidenceCount} evidencias canónicas acumuladas` : null].filter(Boolean)
  return layers.length ? `VIDENTIA ya observa ${layers.join(", ")}; sigue profundizando antes de pedir una decisión.` : "La capacidad interna existe, pero VIDENTIA todavía no tiene evidencia externa específica validada para esta oportunidad."
}
function significantPhrases(value: string) { return normalize(value).split(/[^a-z0-9]+/).filter(token => token.length >= 6).slice(0, 6) }
function normalize(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim() }
function compactEvidence(value: string, max = 135) {
  const clean = value.replace(/^(title|abstract|document type|author|date):\s*/i, "").replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  const clipped = clean.slice(0, max)
  const lastSpace = clipped.lastIndexOf(" ")
  return `${clipped.slice(0, lastSpace > max * 0.7 ? lastSpace : max).trim()}…`
}
function text(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : null }
function humanSource(value: string) { return value.replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase()) }

function EvidenceLine({ icon: Icon, label, text: value, meta, muted = false }: { icon: typeof Github; label: string; text: string; meta?: string | null; muted?: boolean }) {
  return <div className="flex items-start gap-2"><Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6F807E]"/><p className={`text-[11px] leading-5 ${muted ? "text-[#738180]" : "text-[#AEB6B4]"}`}><span className="font-medium text-[#D6DDDA]">{label}:</span> {value}{meta ? <span className="text-[#738180]"> · {compactEvidence(meta, 70)}</span> : null}</p></div>
}
function EvidenceLink({ icon: Icon, label, text: value, meta, href }: { icon: typeof BookOpen; label: string; text: string; meta?: string | null; href: string | null }) {
  if (!href) return <EvidenceLine icon={Icon} label={label} text={value} meta={meta} />
  return <div className="flex items-start gap-2"><Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6F807E]"/><p className="text-[11px] leading-5 text-[#AEB6B4]"><span className="font-medium text-[#D6DDDA]">{label}:</span> {value}{meta ? <span className="text-[#738180]"> · {compactEvidence(meta, 70)}</span> : null} <a href={href} target="_blank" rel="noreferrer" className="whitespace-nowrap text-[#96B5A6] hover:text-white hover:underline">Ver fuente</a></p></div>
}
