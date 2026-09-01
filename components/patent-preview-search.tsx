"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { ArrowRight, Loader2, Search } from "lucide-react"
import type { PublicLocale } from "@/lib/marketing-locale"

type PreviewHit = {
  title: string
  status: string | null
  country: string | null
  ipc: string[]
  application_number: string | null
  filing_date: string | null
  source_url: string | null
  last_synced_at: string | null
}

type PreviewResponse = {
  query?: string
  results?: PreviewHit[]
  visible_count?: number
  locked_count?: number
  source?: string
  newest_sync?: string | null
  coverage?: {
    source_jurisdiction?: string
    source_host?: string
    includes?: string[]
    excludes?: string[]
  }
  error?: string
  code?: string
  resetAt?: string
}

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B2027]"

function formatEvidenceDate(value: string | null | undefined, locale: PublicLocale) {
  if (!value) return null
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00Z` : value
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(locale === "es" ? "es-CL" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function PatentPreviewSearch({ locale }: { locale: PublicLocale }) {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PreviewResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [limitResetAt, setLimitResetAt] = useState<string | null>(null)
  const base = `/${locale}`
  const publicReturn = locale === "es" ? "/es/patentes" : "/patents"
  const signupHref = `${base}/auth/sign-up?redirectTo=${encodeURIComponent(publicReturn)}`
  const enterpriseHref = `${base}/acceso-empresarial`
  const labels = locale === "es" ? {
    title: "Prueba una vista preliminar.",
    body: "Puedes hacer hasta 3 consultas por hora. Cada una muestra hasta 3 coincidencias resumidas con procedencia de evidencia pública; expedientes completos, solicitantes, inventores, perfiles competitivos y alertas quedan reservados al workspace empresarial.",
    queryLabel: "Término de búsqueda de patentes",
    placeholder: "Ej. litio, NOVARTIS, baterías",
    submit: "Buscar patentes",
    loading: "Buscando",
    resultsShown: "resultados mostrados",
    locked: "resultados adicionales fuera de esta vista preliminar",
    access: "Acceso empresarial",
    signup: "Crear acceso preliminar",
    signupBody: "Crea tu acceso preliminar sin costo para seguir explorando VIDENTIA. La investigación completa permanece reservada al acceso empresarial.",
    noResults: "No encontramos coincidencias en esta vista preliminar.",
    noResultsBody: "Puedes probar otro término o crear tu acceso preliminar para seguir explorando VIDENTIA.",
    limitTitle: "Ya usaste las 3 consultas preliminares de esta hora.",
    limitReset: "Podrás volver a probar",
    coverageTitle: "COBERTURA DE EVIDENCIA",
    coverageBody: "Referencia de solicitud, fecha, país, estado e IPC desde el espejo de datos abiertos chilenos. Familias internacionales, citas y conclusiones de patentabilidad/FTO no forman parte de esta vista preliminar.",
    source: "FUENTE",
    sync: "ESPEJO ACTUALIZADO",
    application: "SOLICITUD",
    filed: "PRESENTADA",
    officialDataset: "DATASET OFICIAL",
    preliminary: "EVIDENCIA PRELIMINAR · NO ES CONCLUSIÓN LEGAL",
  } : {
    title: "Try a preliminary view.",
    body: "You can run up to 3 queries per hour. Each shows up to 3 summarized matches with public evidence provenance; full records, applicants, inventors, competitive profiles and alerts remain reserved for the enterprise workspace.",
    queryLabel: "Patent search term",
    placeholder: "E.g. lithium, NOVARTIS, batteries",
    submit: "Search patents",
    loading: "Searching",
    resultsShown: "results shown",
    locked: "additional results outside this preliminary view",
    access: "Enterprise access",
    signup: "Create preliminary access",
    signupBody: "Create your preliminary access at no cost to keep exploring VIDENTIA. Full research remains reserved for enterprise access.",
    noResults: "No matches were found in this preliminary view.",
    noResultsBody: "Try another term or create preliminary access to keep exploring VIDENTIA.",
    limitTitle: "You have used the 3 preliminary queries available this hour.",
    limitReset: "You can try again",
    coverageTitle: "EVIDENCE COVERAGE",
    coverageBody: "Application reference, filing date, country, status and IPC from the Chilean open-data mirror. International families, citations and patentability/FTO conclusions are not included in this preliminary view.",
    source: "SOURCE",
    sync: "MIRROR UPDATED",
    application: "APPLICATION",
    filed: "FILED",
    officialDataset: "OFFICIAL DATASET",
    preliminary: "PRELIMINARY EVIDENCE · NOT A LEGAL CONCLUSION",
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const q = query.trim()
    if (q.length < 2 || loading) return
    setLoading(true)
    setError(null)
    setLimitResetAt(null)
    setResult(null)
    try {
      const response = await fetch(`/api/v1/public/patent-preview?q=${encodeURIComponent(q)}`, { cache: "no-store" })
      const payload = (await response.json().catch(() => ({}))) as PreviewResponse
      if (!response.ok) {
        if (payload.code === "PREVIEW_LIMIT_REACHED") {
          setError(labels.limitTitle)
          setLimitResetAt(payload.resetAt ?? null)
        } else {
          setError(payload.error || (locale === "es" ? "No fue posible completar la consulta." : "The query could not be completed."))
        }
        return
      }
      setResult(payload)
    } catch {
      setError(locale === "es" ? "No fue posible conectar con la vista preliminar." : "The preliminary view could not be reached.")
    } finally {
      setLoading(false)
    }
  }

  const resetLabel = limitResetAt
    ? new Date(limitResetAt).toLocaleTimeString(locale === "es" ? "es-CL" : "en-US", { hour: "2-digit", minute: "2-digit" })
    : null
  const visibleResults = result?.results ?? []
  const newestSyncLabel = formatEvidenceDate(result?.newest_sync, locale)
  const liveStatus = loading
    ? labels.loading
    : result
      ? visibleResults.length === 0
        ? labels.noResults
        : `${visibleResults.length} ${labels.resultsShown}`
      : ""

  return (
    <section id="patent-preview-search" aria-labelledby="patent-preview-title" className="scroll-mt-24 border-y border-[#263D44] bg-[#0B2027] px-5 py-14 lg:px-10 lg:py-20">
      <div className="mx-auto grid max-w-[1480px] gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <h2 id="patent-preview-title" className="text-[clamp(2.4rem,4vw,4.2rem)] font-light leading-[0.98] tracking-[-0.045em] text-[#E7DFCE]">{labels.title}</h2>
          <p id="patent-preview-description" className="mt-5 max-w-xl text-sm leading-7 text-[#9EAAA8]">{labels.body}</p>
        </div>
        <div>
          <form onSubmit={submit} aria-busy={loading} className="border border-[#36515A] bg-[#0F2A33] transition-[border-color,box-shadow] focus-within:border-[#96B5A6] focus-within:ring-2 focus-within:ring-[#96B5A6]/30 sm:flex">
            <div className="flex min-w-0 flex-1">
              <Search className="ml-4 mt-4 h-5 w-5 shrink-0 text-[#96B5A6]" strokeWidth={1.5} aria-hidden="true" />
              <label htmlFor="patent-preview-query" className="sr-only">{labels.queryLabel}</label>
              <input id="patent-preview-query" name="query" value={query} onChange={(event) => setQuery(event.target.value)} maxLength={120} placeholder={labels.placeholder} aria-describedby="patent-preview-description" autoComplete="off" className="min-w-0 flex-1 bg-transparent px-4 py-4 text-sm text-white outline-none placeholder:text-[#738180]" />
            </div>
            <button type="submit" disabled={query.trim().length < 2 || loading} className={`inline-flex min-h-12 w-full items-center justify-center gap-2 bg-[#4A7F74] px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-0 sm:w-auto sm:min-w-36 sm:py-0 ${focusRing}`}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}{loading ? labels.loading : labels.submit}
            </button>
          </form>
          <p className="sr-only" aria-live="polite" aria-atomic="true">{liveStatus}</p>

          {error ? (
            <div role="alert" className="mt-4 border-l-2 border-[#C46A61] bg-[#13272D] px-4 py-4 text-sm text-[#E8B0AA]">
              <p>{error}</p>
              {resetLabel ? <p className="mt-1 text-xs text-[#BDBEBD]">{labels.limitReset} {resetLabel}.</p> : null}
              {limitResetAt ? (
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <Link href={signupHref} className={`inline-flex min-h-10 items-center gap-2 bg-[#4A7F74] px-4 text-xs font-medium text-white hover:bg-[#568D81] ${focusRing}`}>
                    {labels.signup}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                  <Link href={enterpriseHref} className={`inline-flex items-center gap-2 text-xs font-medium text-[#96B5A6] hover:text-white ${focusRing}`}>
                    {labels.access}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}

          {result ? (
            <div className="mt-5 border-t border-[#263D44]">
              {visibleResults.length > 0 ? (
                <div className="border-b border-[#263D44] py-5">
                  <p className="text-[10px] font-medium tracking-[0.16em] text-[#96B5A6]">{labels.coverageTitle}</p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-[#BDBEBD]">
                    {result.source ? <span><span className="text-[#6F807E]">{labels.source}</span> · {result.source}</span> : null}
                    {newestSyncLabel ? <span><span className="text-[#6F807E]">{labels.sync}</span> · {newestSyncLabel}</span> : null}
                  </div>
                  <p className="mt-3 max-w-2xl text-xs leading-5 text-[#879492]">{labels.coverageBody}</p>
                </div>
              ) : null}

              {visibleResults.length === 0 ? (
                <div className="py-5">
                  <p className="text-sm text-[#E7DFCE]">{labels.noResults}</p>
                  <p className="mt-2 text-xs leading-5 text-[#9EAAA8]">{labels.noResultsBody}</p>
                </div>
              ) : visibleResults.map((hit, index) => {
                const filingDate = formatEvidenceDate(hit.filing_date, locale)
                const syncDate = formatEvidenceDate(hit.last_synced_at, locale)
                return (
                  <article key={`${hit.application_number || hit.title}-${index}`} className="border-b border-[#263D44] py-5">
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                      <div>
                        <h3 className="text-base font-medium leading-6 text-[#E7DFCE]">{hit.title}</h3>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-[#879492]">
                          {hit.application_number ? <span><span className="text-[#6F807E]">{labels.application}</span> · {hit.application_number}</span> : null}
                          {filingDate ? <span><span className="text-[#6F807E]">{labels.filed}</span> · {filingDate}</span> : null}
                          <span>{hit.country || "—"}</span>
                          <span>{hit.status || "—"}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3">{hit.ipc.map((code) => <span key={code} className="font-mono text-[10px] text-[#96B5A6]">IPC {code}</span>)}</div>
                      </div>
                      <span className="max-w-40 text-right text-[9px] uppercase leading-4 tracking-[0.12em] text-[#6F807E]">{labels.preliminary}</span>
                    </div>
                    {(hit.source_url || syncDate) ? (
                      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#20363E] pt-3 text-[10px] tracking-[0.06em] text-[#6F807E]">
                        {hit.source_url ? <a href={hit.source_url} target="_blank" rel="noreferrer" className={`text-[#96B5A6] underline decoration-[#36515A] underline-offset-4 hover:text-white ${focusRing}`}>{labels.officialDataset}</a> : null}
                        {syncDate ? <span>{labels.sync} · {syncDate}</span> : null}
                      </div>
                    ) : null}
                  </article>
                )
              })}

              <div className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div>
                  {(result.locked_count ?? 0) > 0 ? <p className="text-sm text-[#9EAAA8]"><strong className="font-medium text-[#E7DFCE]">+{result.locked_count}</strong> {labels.locked}</p> : null}
                  <p className={`${(result.locked_count ?? 0) > 0 ? "mt-2 " : ""}max-w-2xl text-xs leading-5 text-[#879492]`}>{labels.signupBody}</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 sm:justify-end">
                  <Link href={signupHref} className={`inline-flex min-h-10 items-center gap-2 bg-[#4A7F74] px-4 text-sm font-medium text-white hover:bg-[#568D81] ${focusRing}`}>
                    {labels.signup}<ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link href={enterpriseHref} className={`inline-flex items-center gap-2 text-sm font-medium text-[#96B5A6] hover:text-white ${focusRing}`}>
                    {labels.access}<ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
