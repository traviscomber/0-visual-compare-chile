"use client"

import Link from "next/link"
import { type FormEvent, useState } from "react"
import { AlertTriangle, ArrowLeft, ExternalLink, FileSearch, Globe2, History, Loader2, Search, ShieldCheck } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { PatentExternalVerification } from "@/components/app/patent-external-verification"
import { PatentLiteratureEvidencePanel, type PatentLiteratureEvidence } from "@/components/app/patent-literature-evidence"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type PriorityClaim = { country: string | null; number: string; date: string }
type EpoPriorityClaim = { country: string; number: string; kind: string | null; date: string | null }
type LegalEvent = { jurisdiction: string | null; code: string; description: string | null; date: string | null }
type EvidenceCoverage = {
  family: "family_endpoint" | "equivalents_fallback" | "source_not_found" | "unavailable"
  priorities: "family_endpoint" | "source_not_found" | "unavailable"
  citations: "family_endpoint" | "source_not_found" | "unavailable"
  legalEvents: "family_endpoint" | "source_not_found" | "unavailable"
}
type GlobalFamilyMatch = { sourceRecordId: string; publication: string; matchedPriorities: Array<{ country: string; localNumber: string; epoNumber: string; date: string }>; jurisdictions: string[]; evidenceCoverage: EvidenceCoverage }
type ObservedFieldChange = { field: string; before: string | null; after: string | null }
type ObservedChange = { eventType: "new_record" | "status_changed" | "registration_added" | "applicant_changed" | "classification_changed" | "title_changed" | "record_updated"; summary: string | null; observedAt: string; sourceDate: string | null; materiality: "alta" | "media" | "baja"; changedFields: string[]; fieldChanges: ObservedFieldChange[]; sourceUrl: string | null }
type Candidate = { id: string; applicationNumber: string | null; registrationNumber: string | null; title: string; applicants: string | null; inventors: string | null; status: string | null; country: string | null; filingDate: string | null; registrationDate: string | null; expirationDate: string | null; ipc: string[]; sourceUrl: string | null; lastSyncedAt: string | null; technicalScore: number; reviewLevel: "close_review" | "relevant" | "background"; matchedConcepts: string[]; reasons: string[]; publicationDate: string | null; pctApplicationDate: string | null; pctPublicationDate: string | null; prioritiesRaw: string | null; priorityClaims: PriorityClaim[]; familyCandidate: { key: string; sizeInResult: number } | null; globalFamilyMatches: GlobalFamilyMatch[]; typeName: string | null; subtypeName: string | null; observedChangeCount: number; observedChanges: ObservedChange[] }
type GlobalFamily = { source: "epo_ops"; sourceRecordId: string; publication: string; title: string; familyMembers: string[]; jurisdictions: string[]; priorityClaims: EpoPriorityClaim[]; citations: string[]; legalEvents: LegalEvent[]; evidenceCoverage: EvidenceCoverage; retrievedAt: string; url: string }
type GlobalEvidence = { requested: boolean; source: "EPO OPS"; availability: "not_requested" | "credential_required" | "available" | "degraded"; families: GlobalFamily[]; limitations: string[] }
type Review = { query: string; ipc: string | null; concepts: string[]; searchStrategy: "full_query" | "concept_fallback" | "hybrid"; candidates: Candidate[]; summary: { total: number; closeReview: number; relevant: number; background: number; familyCandidates: number; candidatesWithObservedChanges: number; observedChanges: number; globalFamilyLinkedCandidates: number; literatureWorks: number }; coverage: { source: string; scope: string; limitations: string[]; newestSync: string | null; changeObservationSince: string | null }; globalEvidence: GlobalEvidence; literatureEvidence: PatentLiteratureEvidence; generatedAt: string; durationMs: number }

const LEVEL = {
  close_review: { label: "Revisión cercana", className: "bg-[#5A432B] text-[#E8CFAE]" },
  relevant: { label: "Relevante", className: "bg-[#173B37] text-[#96B5A6]" },
  background: { label: "Contexto", className: "bg-[#172F34] text-[#BDBEBD]" },
} as const

const GLOBAL_STATUS: Record<GlobalEvidence["availability"], string> = {
  not_requested: "No solicitada",
  credential_required: "Credenciales requeridas",
  available: "Fuente disponible",
  degraded: "Fuente degradada",
}

const LITERATURE_STATUS: Record<PatentLiteratureEvidence["availability"], string> = {
  not_requested: "No solicitada",
  available: "OpenAlex + Crossref",
  partial: "Cobertura parcial",
  degraded: "Fuentes degradadas",
}

const COVERAGE_LABEL = {
  family_endpoint: "Observado en family endpoint",
  equivalents_fallback: "Familia por fallback equivalents",
  source_not_found: "No encontrado en la fuente",
  unavailable: "Cobertura no disponible",
} as const

const CHANGE_LABEL: Record<ObservedChange["eventType"], string> = {
  new_record: "Primera observación",
  status_changed: "Estado actualizado",
  registration_added: "Registro o concesión incorporado",
  applicant_changed: "Solicitante o titular actualizado",
  classification_changed: "Clasificación actualizada",
  title_changed: "Título actualizado",
  record_updated: "Expediente actualizado",
}

const FIELD_LABEL: Record<string, string> = {
  status: "Estado",
  applicant: "Solicitante / titular",
  classification: "Clasificación",
  title: "Título",
  registration_number: "Registro",
  registration_date: "Fecha de registro",
  publication_date: "Fecha de publicación",
  filing_date: "Fecha de presentación",
  country: "País",
  inventors: "Inventores",
}

export default function PriorArtPage() {
  const [query, setQuery] = useState("Sistema de nanoburbujas de bajo consumo para oxigenar estanques de acuicultura")
  const [ipc, setIpc] = useState("")
  const [includeGlobal, setIncludeGlobal] = useState(false)
  const [includeLiterature, setIncludeLiterature] = useState(true)
  const [review, setReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(event: FormEvent) {
    event.preventDefault()
    if (query.trim().length < 3 || loading) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ q: query.trim(), limit: "30", global: includeGlobal ? "1" : "0", literature: includeLiterature ? "1" : "0" })
      if (ipc.trim()) params.set("ipc", ipc.trim().toUpperCase())
      const response = await fetch(`/api/patents/prior-art?${params}`, { cache: "no-store" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos revisar prior art.")
      setReview(payload)
    } catch (cause) {
      setReview(null)
      setError(cause instanceof Error ? cause.message : "No pudimos revisar prior art.")
    } finally {
      setLoading(false)
    }
  }

  return <OperationalPage>
    <Button asChild variant="ghost" size="sm" className="mb-4 w-fit px-0 text-muted-foreground hover:bg-transparent hover:text-white"><Link href="/patentes"><ArrowLeft className="h-4 w-4" />Volver a Patentes</Link></Button>
    <OperationalHeader eyebrow="VIDENTIA / Patentes / Prior Art" title="Describe una invención. Revisa qué antecedentes técnicos merecen atención." description={<>La consulta larga se descompone en conceptos técnicos cuando la búsqueda literal no encuentra suficiente evidencia. VIDENTIA separa patentes INAPI, literatura científica indexada y cobertura internacional EPO OPS sin convertir ninguna fuente en una conclusión legal.</>} meta={<><span>INAPI Chile</span><span>OpenAlex + Crossref</span><span>Prioridades + PCT</span><span>Cambios observados</span><span>EPO OPS opcional</span><span>Revisión humana</span></>} />

    <section className="border-b border-border/80 py-7">
      <OperationalPanel>
        <form onSubmit={run}>
          <OperationalSectionHeader eyebrow="Invención" title="¿Qué estás intentando construir?" meta="Lenguaje natural · IPC opcional" />
          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_auto]">
            <Input value={query} onChange={event => setQuery(event.target.value)} maxLength={240} placeholder="Describe la invención en lenguaje natural" aria-label="Descripción de la invención" />
            <Input value={ipc} onChange={event => setIpc(event.target.value.toUpperCase())} maxLength={16} placeholder="IPC opcional" aria-label="IPC opcional" />
            <Button disabled={loading || query.trim().length < 3}>{loading ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Search className="h-4 w-4" />}{loading ? "Buscando" : "Revisar prior art"}</Button>
          </div>
          <div className="mt-4 grid gap-3 border-t border-border/70 pt-4 lg:grid-cols-2">
            <div className="flex flex-col gap-3 border-b border-border/60 pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
              <div className="max-w-2xl">
                <p className="text-xs font-medium text-white">Literatura científica</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Cruza la consulta con OpenAlex y Crossref para recuperar literatura técnica no-patente indexada con DOI, autores, fecha y provenance.</p>
              </div>
              <Button type="button" variant={includeLiterature ? "secondary" : "outline"} size="sm" aria-pressed={includeLiterature} onClick={() => setIncludeLiterature(current => !current)} className="w-fit shrink-0">
                <FileSearch className="h-4 w-4" />{includeLiterature ? "Literatura activada" : "Activar literatura"}
              </Button>
            </div>
            <div className="flex flex-col gap-3 lg:pl-2">
              <div className="max-w-2xl">
                <p className="text-xs font-medium text-white">Cobertura internacional</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Si la activas, esta consulta técnica también se envía a EPO OPS para recuperar familias, prioridades, jurisdicciones, citas y eventos jurídicos observados.</p>
              </div>
              <Button type="button" variant={includeGlobal ? "secondary" : "outline"} size="sm" aria-pressed={includeGlobal} onClick={() => setIncludeGlobal(current => !current)} className="w-fit shrink-0">
                <Globe2 className="h-4 w-4" />{includeGlobal ? "EPO OPS activado" : "Activar EPO OPS"}
              </Button>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">No responde “patentable / no patentable”. Recupera candidatos de patente, cambios observados, literatura no-patente y evidencia de fuente para revisión técnica y jurídica posterior.</p>
        </form>
      </OperationalPanel>
    </section>

    {error ? <div role="alert" className="mt-6 bg-[#3A2525] p-4 text-sm text-[#E8AAA3]">{error}</div> : null}

    {review ? <>
      <OperationalMetricRail>
        <OperationalMetric value={review.summary.total} label="Candidatos" detail={`${review.summary.candidatesWithObservedChanges} con cambios observados`} />
        <OperationalMetric value={review.summary.closeReview} label="Revisión cercana" detail="Mayor cobertura de conceptos técnicos" tone={review.summary.closeReview ? "warning" : "neutral"} />
        <OperationalMetric value={review.summary.literatureWorks} label="Literatura NPL" detail={LITERATURE_STATUS[review.literatureEvidence.availability]} tone={review.literatureEvidence.availability === "partial" || review.literatureEvidence.availability === "degraded" ? "warning" : review.literatureEvidence.availability === "available" && review.summary.literatureWorks ? "success" : "neutral"} />
        <OperationalMetric value={review.globalEvidence.families.length} label="Familias EPO" detail={GLOBAL_STATUS[review.globalEvidence.availability]} tone={review.globalEvidence.availability === "degraded" || review.globalEvidence.availability === "credential_required" ? "warning" : review.globalEvidence.availability === "available" ? "success" : "neutral"} />
      </OperationalMetricRail>

      <section className="grid gap-9 py-9 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)] xl:gap-10">
        <div>
          <OperationalSectionHeader eyebrow="Resultados" title="Potential prior art" meta={`${review.durationMs} ms · ${strategyLabel(review.searchStrategy)} · ${review.summary.observedChanges} cambios observados`} />
          {review.candidates.length ? <div className="mt-5 divide-y divide-border/80 border-y border-border/80">{review.candidates.map((candidate, index) => <CandidateRow key={candidate.id} candidate={candidate} index={index} />)}</div> : <div className="mt-5 border-y border-border/80 py-10"><FileSearch className="h-5 w-5 text-[#96B5A6]" /><p className="mt-4 font-medium text-white">No encontramos candidatos en el corpus observado.</p><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Esto no demuestra ausencia de prior art. Amplía términos, revisa IPC o utiliza literatura científica y cobertura internacional antes de una conclusión.</p></div>}
        </div>
        <aside>
          <OperationalPanel>
            <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-[#96B5A6]" /><div><p className="font-medium text-white">{review.coverage.source}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{review.coverage.scope}</p></div></div>
            {review.coverage.changeObservationSince ? <div className="mt-5 border-t border-border/80 pt-4"><p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#96B5A6]">Change detection</p><p className="mt-2 text-xs leading-5 text-muted-foreground">VIDENTIA conserva diferencias entre snapshots oficiales observados desde {formatDate(review.coverage.changeObservationSince)}. Es una ventana de observación, no la historia completa del expediente.</p></div> : null}
            <div className="mt-6 border-t border-border/80 pt-5"><p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#96B5A6]">Límites</p><div className="mt-3 space-y-3">{review.coverage.limitations.map(item => <p key={item} className="flex gap-2 text-xs leading-5 text-muted-foreground"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D6A46F]" />{item}</p>)}</div></div>
            {review.coverage.newestSync ? <p className="mt-5 border-t border-border/80 pt-4 text-[11px] text-muted-foreground">Último sync observado · {formatDate(review.coverage.newestSync)}</p> : null}
          </OperationalPanel>
          <PatentLiteratureEvidencePanel evidence={review.literatureEvidence} />
          <GlobalEvidencePanel evidence={review.globalEvidence} />
          <OperationalPanel className="mt-4"><p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#96B5A6]">Siguiente paso</p><p className="mt-3 text-sm font-medium text-white">Guarda la evidencia patentaria en un reporte común.</p><p className="mt-2 text-xs leading-5 text-muted-foreground">El reporte actual conserva consulta, candidatos, vínculos de familia, límites y fecha como snapshot versionado. La literatura científica se mantiene visible en esta revisión hasta incorporar su snapshot dedicado.</p><Button asChild size="sm" className="mt-4"><Link href={`/reportes?create=patent&subject=${encodeURIComponent(review.query)}${review.ipc ? `&ipc=${encodeURIComponent(review.ipc)}` : ""}${review.globalEvidence.requested ? "&global=1" : ""}`}>Crear reporte</Link></Button></OperationalPanel>
        </aside>
      </section>
    </> : !loading ? <section className="py-10"><p className="max-w-2xl text-sm leading-7 text-muted-foreground">Empieza con una descripción completa. Si la frase literal no encuentra antecedentes, VIDENTIA extrae conceptos técnicos y los combina sin inventar sinónimos ni traducciones.</p></section> : null}
  </OperationalPage>
}

function GlobalEvidencePanel({ evidence }: { evidence: GlobalEvidence }) {
  return <OperationalPanel className="mt-4">
    <div className="flex items-start gap-3"><Globe2 className="mt-0.5 h-5 w-5 text-[#96B5A6]" /><div><p className="font-medium text-white">EPO OPS · cobertura global</p><p className="mt-1 text-xs text-muted-foreground">{GLOBAL_STATUS[evidence.availability]}</p></div></div>
    {evidence.availability === "not_requested" ? <p className="mt-4 text-xs leading-5 text-muted-foreground">La consulta internacional no se ejecutó. Actívala antes de buscar si necesitas ampliar la revisión fuera del corpus chileno.</p> : null}
    {evidence.availability === "credential_required" ? <p className="mt-4 text-xs leading-5 text-[#D6A46F]">La integración está preparada, pero EPO OPS requiere credenciales activas en el entorno para recuperar evidencia.</p> : null}
    {evidence.availability === "degraded" ? <p className="mt-4 text-xs leading-5 text-[#D6A46F]">La fuente internacional no respondió de forma utilizable. Los resultados INAPI siguen siendo válidos dentro de su cobertura.</p> : null}
    {evidence.availability === "available" && evidence.families.length === 0 ? <p className="mt-4 text-xs leading-5 text-muted-foreground">EPO OPS respondió sin familias para esta consulta. Esto no demuestra que no exista prior art internacional.</p> : null}
    {evidence.families.length ? <div className="mt-5 divide-y divide-border/80 border-y border-border/80">{evidence.families.map(family => <GlobalFamilyRow key={family.sourceRecordId} family={family} />)}</div> : null}
    <div className="mt-5 space-y-2">{evidence.limitations.map(item => <p key={item} className="text-[11px] leading-5 text-muted-foreground">{item}</p>)}</div>
  </OperationalPanel>
}

function GlobalFamilyRow({ family }: { family: GlobalFamily }) {
  const jurisdictions = jurisdictionEvidence(family)
  const legalEvents = sortLegalEvents(family.legalEvents)

  return <article className="py-5">
    <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#96B5A6]">{family.publication}</p><p className="mt-1 text-sm font-medium leading-5 text-white">{family.title}</p></div><a href={family.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${family.publication} en Espacenet`} className="text-muted-foreground transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6]"><ExternalLink className="h-4 w-4" /></a></div>
    <p className="mt-3 text-xs text-muted-foreground">{family.familyMembers.length} miembros · {family.priorityClaims.length} prioridades · {family.jurisdictions.length} jurisdicciones · {family.citations.length} citas · {family.legalEvents.length} eventos jurídicos observados</p>

    <div className="mt-4 border-y border-border/70 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#96B5A6]">Cobertura de evidencia</p>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
        <CoverageCell label="Familia" value={COVERAGE_LABEL[family.evidenceCoverage.family]} warning={family.evidenceCoverage.family === "unavailable"} />
        <CoverageCell label="Prioridades" value={COVERAGE_LABEL[family.evidenceCoverage.priorities]} warning={family.evidenceCoverage.priorities === "unavailable"} />
        <CoverageCell label="Citas" value={COVERAGE_LABEL[family.evidenceCoverage.citations]} warning={family.evidenceCoverage.citations === "unavailable"} />
        <CoverageCell label="Eventos" value={COVERAGE_LABEL[family.evidenceCoverage.legalEvents]} warning={family.evidenceCoverage.legalEvents === "unavailable"} />
      </div>
    </div>

    {family.priorityClaims.length ? <div className="mt-4"><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#96B5A6]">Prioridades EPO observadas</p><div className="mt-2 space-y-1">{family.priorityClaims.slice(0, 5).map((claim, index) => <p key={`${claim.country}:${claim.number}:${claim.date}:${index}`} className="text-[11px] leading-5 text-muted-foreground">{claim.country} · {claim.number}{claim.kind ? ` ${claim.kind}` : ""}{claim.date ? ` · ${claim.date}` : ""}</p>)}</div></div> : <p className="mt-4 text-[11px] leading-5 text-muted-foreground">{priorityCoverageSummary(family.evidenceCoverage.priorities)}</p>}

    {jurisdictions.length ? <div className="mt-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#96B5A6]">Jurisdicciones observadas</p>
      <div className="mt-2 divide-y divide-border/70 border-y border-border/70">{jurisdictions.slice(0, 10).map(item => <div key={item.code} className="grid gap-1 py-2.5 sm:grid-cols-[48px_1fr]">
        <span className="text-xs font-medium text-white">{item.code}</span>
        <div><p className="text-[11px] leading-5 text-[#BDBEBD]">{item.members.length} miembro{item.members.length === 1 ? "" : "s"} de familia · {item.events.length} evento{item.events.length === 1 ? "" : "s"} observado{item.events.length === 1 ? "" : "s"}</p><p className="text-[10px] leading-5 text-muted-foreground">{jurisdictionLegalSummary(item.latestEvent, family.evidenceCoverage.legalEvents)}</p></div>
      </div>)}</div>
    </div> : <p className="mt-4 text-[11px] leading-5 text-muted-foreground">No hay jurisdicciones derivables de los miembros recuperados en esta respuesta.</p>}

    {family.citations.length ? <div className="mt-4"><p className="text-[10px] uppercase tracking-[0.12em] text-[#96B5A6]">Citas observadas</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{family.citations.slice(0, 6).join(" · ")}{family.citations.length > 6 ? ` · +${family.citations.length - 6}` : ""}</p></div> : <p className="mt-4 text-[11px] leading-5 text-muted-foreground">{citationCoverageSummary(family.evidenceCoverage.citations)}</p>}

    {legalEvents.length ? <div className="mt-4"><p className="text-[10px] uppercase tracking-[0.12em] text-[#96B5A6]">Eventos jurídicos observados</p><div className="mt-1 space-y-1">{legalEvents.slice(0, 4).map((event, index) => <p key={`${event.jurisdiction}:${event.code}:${event.date}:${index}`} className="text-[11px] leading-5 text-muted-foreground">{event.jurisdiction ? `${event.jurisdiction} · ` : ""}{event.code}{event.date ? ` · ${event.date}` : ""}{event.description ? ` · ${event.description}` : ""}</p>)}</div></div> : null}
    <p className="mt-3 text-[10px] leading-5 text-[#D6A46F]">No se infiere estado jurídico actual a partir de estos eventos. Se muestra sólo evidencia observada en la respuesta EPO OPS.</p>
  </article>
}

function CoverageCell({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return <div><p className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">{label}</p><p className={`mt-1 text-[10px] leading-4 ${warning ? "text-[#D6A46F]" : "text-[#BDBEBD]"}`}>{value}</p></div>
}

function CandidateRow({ candidate, index }: { candidate: Candidate; index: number }) {
  const level = LEVEL[candidate.reviewLevel]
  return <article className="py-6"><div className="grid gap-5 lg:grid-cols-[48px_minmax(0,1fr)_180px]"><span className="text-[10px] text-[#456E8E]">{String(index + 1).padStart(2, "0")}</span><div><div className="flex flex-wrap items-center gap-2"><Badge className={level.className}>{level.label}</Badge><Badge variant="outline">Score técnico {candidate.technicalScore}</Badge>{candidate.familyCandidate ? <Badge variant="secondary">Familia candidata · {candidate.familyCandidate.sizeInResult}</Badge> : null}{candidate.globalFamilyMatches.length ? <Badge className="bg-[#173B37] text-[#96B5A6]">EPO link · {candidate.globalFamilyMatches.length}</Badge> : null}{candidate.observedChangeCount ? <Badge variant="outline">{candidate.observedChangeCount} cambio{candidate.observedChangeCount === 1 ? "" : "s"} observado{candidate.observedChangeCount === 1 ? "" : "s"}</Badge> : null}</div><h3 className="mt-3 text-base font-medium leading-7 text-white">{candidate.title}</h3><p className="mt-1 text-xs text-muted-foreground">{candidate.applicants || "Solicitante no informado"}</p><div className="mt-4 flex flex-wrap gap-2">{candidate.ipc.slice(0, 6).map(code => <Badge key={code} variant="outline">IPC {code}</Badge>)}</div><div className="mt-4 space-y-1">{candidate.reasons.map(reason => <p key={reason} className="text-xs leading-5 text-[#BDBEBD]">• {reason}</p>)}</div>{candidate.priorityClaims.length ? <div className="mt-4 border-l-2 border-[#456E8E] pl-3"><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#96B5A6]">Prioridades observadas</p>{candidate.priorityClaims.slice(0, 4).map(claim => <p key={`${claim.country}:${claim.number}:${claim.date}`} className="mt-1 text-xs text-muted-foreground">{claim.country ? `${claim.country} · ` : ""}{claim.number} · {claim.date}</p>)}</div> : null}{candidate.globalFamilyMatches.length ? <GlobalFamilyMatches matches={candidate.globalFamilyMatches} /> : null}{candidate.observedChanges.length ? <ObservedChanges changes={candidate.observedChanges} total={candidate.observedChangeCount} /> : null}</div><div className="text-xs leading-6 text-muted-foreground"><p>{candidate.applicationNumber ? `Solicitud ${candidate.applicationNumber}` : "Sin número"}</p><p>{candidate.country || "País no informado"}</p><p>{candidate.filingDate ? `Presentada ${candidate.filingDate}` : "Fecha no informada"}</p><p>{candidate.status || "Estado no informado"}</p>{candidate.pctApplicationDate ? <p>PCT · {candidate.pctApplicationDate}</p> : null}{candidate.sourceUrl ? <Button asChild variant="ghost" size="sm" className="mt-3 px-0"><a href={candidate.sourceUrl} target="_blank" rel="noreferrer">Fuente <ExternalLink className="h-3.5 w-3.5" /></a></Button> : null}<PatentExternalVerification applicationNumber={candidate.applicationNumber} title={candidate.title} priorityClaims={candidate.priorityClaims} /></div></div></article>
}

function GlobalFamilyMatches({ matches }: { matches: GlobalFamilyMatch[] }) {
  return <div className="mt-5 border-l-2 border-[#4A7F74] pl-3">
    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#96B5A6]">Familia EPO vinculada por prioridad</p>
    <p className="mt-1 text-[11px] leading-5 text-muted-foreground">Coincidencia observada por país + fecha + número normalizado. No es una conclusión jurídica ni demuestra cobertura global completa.</p>
    <div className="mt-3 space-y-3">{matches.slice(0, 3).map(match => <div key={match.sourceRecordId} className="border-t border-border/70 pt-3 first:border-t-0 first:pt-0"><p className="text-xs font-medium text-white">{match.publication}</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{match.jurisdictions.length ? `${match.jurisdictions.slice(0, 8).join(" · ")} · ` : ""}{match.matchedPriorities.length} prioridad{match.matchedPriorities.length === 1 ? "" : "es"} coincidente{match.matchedPriorities.length === 1 ? "" : "s"}</p>{match.matchedPriorities.slice(0, 3).map(priority => <p key={`${match.sourceRecordId}:${priority.country}:${priority.localNumber}:${priority.date}`} className="mt-1 text-[10px] leading-5 text-[#BDBEBD]">{priority.country} · INAPI {priority.localNumber} ↔ EPO {priority.epoNumber} · {priority.date}</p>)}</div>)}</div>
  </div>
}

function ObservedChanges({ changes, total }: { changes: ObservedChange[]; total: number }) {
  return <div className="mt-5 border-l-2 border-[#4A7F74] pl-3">
    <div className="flex items-center gap-2"><History className="h-3.5 w-3.5 text-[#96B5A6]" /><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#96B5A6]">Cambios observados en fuente</p></div>
    <p className="mt-1 text-[11px] leading-5 text-muted-foreground">Diferencias detectadas entre snapshots INAPI desde el baseline de VIDENTIA. No es la historia jurídica completa.</p>
    <div className="mt-3 space-y-3">{changes.slice(0, 3).map((change, index) => <div key={`${change.observedAt}:${change.eventType}:${index}`} className="border-t border-border/70 pt-3 first:border-t-0 first:pt-0"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-medium text-white">{CHANGE_LABEL[change.eventType]}</p><span className="text-[10px] text-muted-foreground">Observado {formatDateTime(change.observedAt)}</span></div>{change.summary ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{change.summary}</p> : null}{change.eventType !== "new_record" && change.fieldChanges.length ? <div className="mt-2 space-y-1">{change.fieldChanges.slice(0, 2).map(field => <p key={`${change.observedAt}:${field.field}`} className="text-[11px] leading-5 text-[#BDBEBD]"><span className="text-muted-foreground">{FIELD_LABEL[field.field] || field.field}:</span> {field.before || "—"} → {field.after || "—"}</p>)}</div> : null}</div>)}</div>
    {total > 3 ? <p className="mt-3 text-[10px] text-muted-foreground">Mostrando 3 de {total} cambios observados.</p> : null}
  </div>
}

function jurisdictionEvidence(family: GlobalFamily) {
  const byCode = new Map<string, { code: string; members: string[]; events: LegalEvent[]; latestEvent: LegalEvent | null }>()
  for (const member of family.familyMembers) {
    const code = member.slice(0, 2).toUpperCase()
    if (!/^[A-Z]{2}$/.test(code)) continue
    const current = byCode.get(code) ?? { code, members: [], events: [], latestEvent: null }
    current.members.push(member)
    byCode.set(code, current)
  }
  for (const event of sortLegalEvents(family.legalEvents)) {
    const code = event.jurisdiction?.trim().toUpperCase()
    if (!code || !/^[A-Z]{2}$/.test(code)) continue
    const current = byCode.get(code) ?? { code, members: [], events: [], latestEvent: null }
    current.events.push(event)
    if (!current.latestEvent) current.latestEvent = event
    byCode.set(code, current)
  }
  return [...byCode.values()].sort((a, b) => b.events.length - a.events.length || b.members.length - a.members.length || a.code.localeCompare(b.code))
}

function jurisdictionLegalSummary(event: LegalEvent | null, coverage: EvidenceCoverage["legalEvents"]) {
  if (event) return `Último evento observado · ${event.date || "fecha no informada"} · ${event.code}`
  if (coverage === "family_endpoint") return "Sin evento jurídico observado en esta respuesta EPO"
  if (coverage === "source_not_found") return "Endpoint de familia sin eventos observables para esta publicación"
  return "Cobertura de eventos jurídicos no disponible"
}

function priorityCoverageSummary(coverage: EvidenceCoverage["priorities"]) {
  if (coverage === "family_endpoint") return "Sin prioridades observadas en esta respuesta EPO."
  if (coverage === "source_not_found") return "El endpoint de familia no devolvió prioridades para esta publicación."
  return "Cobertura de prioridades no disponible para esta familia."
}

function citationCoverageSummary(coverage: EvidenceCoverage["citations"]) {
  if (coverage === "family_endpoint") return "Sin citas observadas en esta respuesta EPO."
  if (coverage === "source_not_found") return "El endpoint de familia no devolvió citas para esta publicación."
  return "Cobertura de citas no disponible para esta familia."
}

function sortLegalEvents(events: LegalEvent[]) {
  return [...events].sort((a, b) => (b.date || "").localeCompare(a.date || "") || (a.jurisdiction || "").localeCompare(b.jurisdiction || "") || a.code.localeCompare(b.code))
}

function strategyLabel(value: Review["searchStrategy"]) { return value === "concept_fallback" ? "por conceptos" : value === "hybrid" ? "híbrida" : "consulta completa" }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(date) }
function formatDateTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(date) }
