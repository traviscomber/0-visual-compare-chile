import { AlertTriangle, BookOpen, ExternalLink } from "lucide-react"
import { OperationalPanel } from "@/components/app/operational-ui"

export type LiteratureSource = "openalex" | "crossref"
export type LiteratureEvidenceAvailability = "not_requested" | "available" | "partial" | "degraded"

export type PatentLiteratureWork = {
  key: string
  title: string
  date: string | null
  url: string
  doi: string | null
  authors: string[]
  institutions: string[]
  publisher: string | null
  topic: string | null
  citedByCount: number
  sources: LiteratureSource[]
  bestSourceRank: number
}

export type PatentLiteratureEvidence = {
  requested: boolean
  availability: LiteratureEvidenceAvailability
  works: PatentLiteratureWork[]
  sources: Array<{ source: LiteratureSource; availability: "available" | "degraded"; resultCount: number }>
  limitations: string[]
  searchedFrom: string | null
  searchedTo: string | null
}

const STATUS: Record<LiteratureEvidenceAvailability, string> = {
  not_requested: "No solicitada",
  available: "OpenAlex + Crossref disponibles",
  partial: "Cobertura parcial",
  degraded: "Fuentes degradadas",
}

const SOURCE_LABEL: Record<LiteratureSource, string> = {
  openalex: "OpenAlex",
  crossref: "Crossref",
}

export function PatentLiteratureEvidencePanel({ evidence }: { evidence: PatentLiteratureEvidence }) {
  return <OperationalPanel className="mt-4">
    <div className="flex items-start gap-3"><BookOpen className="mt-0.5 h-5 w-5 text-[#96B5A6]" /><div><p className="font-medium text-white">Literatura científica · non-patent literature</p><p className="mt-1 text-xs text-muted-foreground">{STATUS[evidence.availability]}</p></div></div>

    {evidence.sources.length ? <div className="mt-4 grid grid-cols-2 gap-3 border-y border-border/70 py-3">{evidence.sources.map(source => <div key={source.source}><p className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">{SOURCE_LABEL[source.source]}</p><p className={`mt-1 text-[10px] ${source.availability === "available" ? "text-[#BDBEBD]" : "text-[#D6A46F]"}`}>{source.availability === "available" ? `${source.resultCount} resultado${source.resultCount === 1 ? "" : "s"}` : "No disponible"}</p></div>)}</div> : null}

    {evidence.availability === "not_requested" ? <p className="mt-4 text-xs leading-5 text-muted-foreground">Activa literatura científica antes de buscar para contrastar el corpus de patentes con publicaciones indexadas.</p> : null}
    {evidence.availability === "degraded" ? <p className="mt-4 flex gap-2 text-xs leading-5 text-[#D6A46F]"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />OpenAlex y Crossref no respondieron de forma utilizable en esta revisión.</p> : null}
    {evidence.requested && evidence.availability !== "degraded" && evidence.works.length === 0 ? <p className="mt-4 text-xs leading-5 text-muted-foreground">Las fuentes respondieron sin publicaciones suficientemente relevantes para esta consulta. Esto no demuestra ausencia de literatura técnica anterior.</p> : null}

    {evidence.works.length ? <div className="mt-5 divide-y divide-border/80 border-y border-border/80">{evidence.works.map((work, index) => <article key={work.key} className="py-4">
      <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] uppercase tracking-[0.12em] text-[#96B5A6]">NPL {String(index + 1).padStart(2, "0")} · {work.sources.map(source => SOURCE_LABEL[source]).join(" + ")}</p><p className="mt-1 text-sm font-medium leading-5 text-white">{work.title}</p></div><a href={work.url} target="_blank" rel="noreferrer" aria-label={`Abrir publicación ${work.title}`} className="shrink-0 text-muted-foreground transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6]"><ExternalLink className="h-4 w-4" /></a></div>
      <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{work.date ? `Publicada ${formatDate(work.date)}` : "Fecha bibliográfica no disponible"}{work.citedByCount ? ` · ${work.citedByCount} citas indexadas` : ""}</p>
      {work.authors.length ? <p className="mt-1 text-[11px] leading-5 text-[#BDBEBD]">{work.authors.slice(0, 4).join(" · ")}{work.authors.length > 4 ? ` · +${work.authors.length - 4}` : ""}</p> : null}
      {work.doi ? <p className="mt-1 break-all text-[10px] leading-5 text-muted-foreground">DOI · {work.doi}</p> : null}
      {work.topic || work.publisher ? <p className="mt-1 text-[10px] leading-5 text-muted-foreground">{[work.topic, work.publisher].filter(Boolean).join(" · ")}</p> : null}
    </article>)}</div> : null}

    <div className="mt-5 space-y-2">{evidence.limitations.map(item => <p key={item} className="text-[10px] leading-5 text-muted-foreground">{item}</p>)}</div>
  </OperationalPanel>
}

function formatDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(date)
}
