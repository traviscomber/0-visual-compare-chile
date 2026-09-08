import Link from "next/link"

const HTTPS_URL = /^https:\/\//i

type SubsectionPaper = {
  source?: string
  title?: string
  date?: string | null
  url?: string
  citedByCount?: number
  earlySignal?: boolean
}

type SubsectionTopic = {
  key?: string
  label?: string
  paper_count?: number
  papers?: SubsectionPaper[]
  source_coverage?: Record<string, string>
}

type SubsectionResearch = {
  generated_at?: string
  topic_count?: number
  paper_count?: number
  source_count?: number
  independent_institution_count?: number
  topics?: SubsectionTopic[]
  scoring_state?: string
  decision_effect?: string
  boundary?: string
}

type Props = {
  snapshot: Record<string, unknown> | null
  productKey: string
  productName: string
}

export function JuanSubsectionResearch({ snapshot, productKey, productName }: Props) {
  const research = readResearch(snapshot)
  if (!research) {
    return (
      <div className="border-t border-[#294047] pt-3 lg:col-span-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#83908F]">Investigación por subsección</p>
          <span className="text-[9px] text-[#748481]">Esperando primera pasada programada</span>
        </div>
        <p className="mt-1 text-[10px] leading-4 text-[#748481]">VIDENTIA usará las áreas activas del producto para orientar papers externos. La actividad de desarrollo sólo decide qué investigar.</p>
      </div>
    )
  }

  const topics = (research.topics ?? []).filter(topic => topic.label || topic.key).slice(0, 3)
  const papers = uniquePapers(topics.flatMap(topic => topic.papers ?? [])).slice(0, 2)
  const paperCount = numberOrZero(research.paper_count)
  const sourceCount = numberOrZero(research.source_count)
  const institutionCount = numberOrZero(research.independent_institution_count)
  const recommendation = buildRecommendation(topics, paperCount, sourceCount, institutionCount)
  const assistantQuery = `Analiza la investigación activa de ${productName} (${productKey}). Indica qué conviene incorporar, qué investigar más y qué no deberíamos concluir todavía a partir de estos papers.`

  return (
    <div className="border-t border-[#294047] pt-3 lg:col-span-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)] xl:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#96B5A6]">Investigación activa · discovery externo</p>
            <span className="text-[8px] uppercase tracking-[0.1em] text-[#748481]">No modifica convicción</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {topics.length ? topics.map(topic => (
              <span key={topic.key ?? topic.label} className="rounded-[5px] bg-[#102A2E] px-2 py-1 text-[9px] text-[#C7D3CF] ring-1 ring-inset ring-[#294047]">
                {topic.label ?? topic.key} · {numberOrZero(topic.paper_count)} paper{numberOrZero(topic.paper_count) === 1 ? "" : "s"}
              </span>
            )) : <span className="text-[10px] text-[#748481]">Sin subsecciones activas con papers retenidos.</span>}
          </div>
          <p className="mt-2 text-[9px] leading-4 text-[#748481]">
            {paperCount} papers retenidos · {sourceCount} fuente{sourceCount === 1 ? "" : "s"} · {institutionCount} instituci{institutionCount === 1 ? "ón" : "ones"}{research.generated_at ? ` · actualizado ${formatDate(research.generated_at)}` : ""}
          </p>
        </div>

        <div className="border-l border-[#294047] pl-3 xl:pl-4">
          <p className="text-[8px] font-medium uppercase tracking-[0.12em] text-[#83908F]">Siguiente lectura</p>
          <p className="mt-1 text-[10px] leading-4 text-[#C9D1CF]">{recommendation}</p>
          <Link href={`/mi-espacio?assistant=open&q=${encodeURIComponent(assistantQuery)}`} className="mt-2 inline-flex items-center text-[9px] font-medium text-[#96B5A6] hover:text-white">
            Analizar con VIDENTIA →
          </Link>
        </div>
      </div>

      {papers.length ? (
        <div className="mt-3 grid gap-px bg-[#294047] md:grid-cols-2">
          {papers.map((paper, index) => {
            const href = safeExternalUrl(paper.url)
            return (
              <div key={`${paper.url ?? paper.title}-${index}`} className="bg-[#0C2327] px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2 text-[8px] uppercase tracking-[0.1em] text-[#748481]">
                  <span>{paper.source ?? "Paper"}</span>
                  {paper.date ? <span>{paper.date.slice(0, 4)}</span> : null}
                  {paper.earlySignal ? <span className="text-[#A7C5B8]">señal reciente</span> : null}
                </div>
                {href ? (
                  <a href={href} target="_blank" rel="noreferrer" className="mt-1 block text-[10px] font-medium leading-4 text-[#D6DDDA] hover:text-white">{paper.title ?? "Abrir paper"}</a>
                ) : <p className="mt-1 text-[10px] font-medium leading-4 text-[#D6DDDA]">{paper.title ?? "Paper sin enlace válido"}</p>}
                {typeof paper.citedByCount === "number" ? <p className="mt-1 text-[8px] text-[#748481]">{paper.citedByCount} citas registradas</p> : null}
              </div>
            )
          })}
        </div>
      ) : (
        <p className="mt-3 border-t border-[#294047] pt-2 text-[9px] leading-4 text-[#748481]">No hay papers que superen todavía el gate dominio + subsección + tecnología. La ausencia se mantiene neutral.</p>
      )}
    </div>
  )
}

function readResearch(snapshot: Record<string, unknown> | null): SubsectionResearch | null {
  const value = snapshot?.subsection_research
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as SubsectionResearch
}

function buildRecommendation(topics: SubsectionTopic[], paperCount: number, sourceCount: number, institutionCount: number) {
  const labels = topics.flatMap(topic => topic.label || topic.key ? [topic.label ?? topic.key ?? ""] : []).filter(Boolean)
  const subject = labels.length ? labels.join(" · ") : "las subsecciones activas"
  if (!paperCount) return `Mantener ${subject} en observación. No hay convergencia bibliográfica suficiente para incorporar ni descartar cambios.`
  if (paperCount >= 4 && sourceCount >= 2 && institutionCount >= 2) return `Priorizar revisión técnica de ${subject}. Hay convergencia en más de una fuente; comparar estos hallazgos con la implementación actual antes de incorporar cambios.`
  return `Investigar más ${subject} antes de incorporar cambios. La señal externa es útil para discovery, pero todavía necesita mayor convergencia o validación independiente.`
}

function uniquePapers(papers: SubsectionPaper[]) {
  const seen = new Set<string>()
  return papers.filter(paper => {
    const key = `${paper.url ?? ""}|${paper.title ?? ""}`.toLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return Boolean(paper.title)
  })
}

function safeExternalUrl(value: unknown) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return HTTPS_URL.test(trimmed) ? trimmed : null
}

function numberOrZero(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0 }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "sin fecha" : new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", year: "numeric" }).format(date) }
