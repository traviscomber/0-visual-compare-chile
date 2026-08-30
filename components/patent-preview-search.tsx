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
}

type PreviewResponse = {
  query?: string
  results?: PreviewHit[]
  visible_count?: number
  locked_count?: number
  source?: string
  newest_sync?: string | null
  error?: string
  code?: string
  resetAt?: string
}

export function PatentPreviewSearch({ locale }: { locale: PublicLocale }) {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PreviewResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [limitResetAt, setLimitResetAt] = useState<string | null>(null)
  const base = `/${locale}`
  const publicReturn = locale === "es" ? "/es/patentes" : "/en/patents"
  const signupHref = `${base}/auth/sign-up?redirectTo=${encodeURIComponent(publicReturn)}`
  const enterpriseHref = `${base}/acceso-empresarial`
  const labels = locale === "es" ? {
    title: "Prueba una vista preliminar.",
    body: "Puedes hacer hasta 3 consultas por hora. Cada una muestra hasta 3 coincidencias resumidas; expedientes, solicitantes, inventores, perfiles competitivos y alertas quedan reservados al workspace empresarial.",
    placeholder: "Ej. litio, NOVARTIS, baterías",
    submit: "Buscar patentes",
    loading: "Buscando",
    locked: "resultados adicionales fuera de esta vista preliminar",
    access: "Acceso empresarial",
    signup: "Crear acceso preliminar",
    signupBody: "Crea tu acceso preliminar sin costo para seguir explorando VIDENTIA. La investigación completa permanece reservada al acceso empresarial.",
    noResults: "No encontramos coincidencias en esta vista preliminar.",
    noResultsBody: "Puedes probar otro término o crear tu acceso preliminar para seguir explorando VIDENTIA.",
    limitTitle: "Ya usaste las 3 consultas preliminares de esta hora.",
    limitReset: "Podrás volver a probar",
  } : {
    title: "Try a preliminary view.",
    body: "You can run up to 3 queries per hour. Each shows up to 3 summarized matches; records, applicants, inventors, competitive profiles and alerts remain reserved for the enterprise workspace.",
    placeholder: "E.g. lithium, NOVARTIS, batteries",
    submit: "Search patents",
    loading: "Searching",
    locked: "additional results outside this preliminary view",
    access: "Enterprise access",
    signup: "Create preliminary access",
    signupBody: "Create your preliminary access at no cost to keep exploring VIDENTIA. Full research remains reserved for enterprise access.",
    noResults: "No matches were found in this preliminary view.",
    noResultsBody: "Try another term or create preliminary access to keep exploring VIDENTIA.",
    limitTitle: "You have used the 3 preliminary queries available this hour.",
    limitReset: "You can try again",
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

  return (
    <section className="border-y border-[#263D44] bg-[#0B2027] px-5 py-14 lg:px-10 lg:py-20">
      <div className="mx-auto grid max-w-[1480px] gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <h2 className="text-[clamp(2.4rem,4vw,4.2rem)] font-light leading-[0.98] tracking-[-0.045em] text-[#E7DFCE]">{labels.title}</h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[#9EAAA8]">{labels.body}</p>
        </div>
        <div>
          <form onSubmit={submit} className="flex border border-[#36515A] bg-[#0F2A33]">
            <Search className="ml-4 mt-4 h-5 w-5 shrink-0 text-[#96B5A6]" strokeWidth={1.5} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={120} placeholder={labels.placeholder} className="min-w-0 flex-1 bg-transparent px-4 py-4 text-sm text-white outline-none placeholder:text-[#738180]" />
            <button type="submit" disabled={query.trim().length < 2 || loading} className="inline-flex min-w-36 items-center justify-center gap-2 bg-[#4A7F74] px-5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-45">
              {loading ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : null}{loading ? labels.loading : labels.submit}
            </button>
          </form>

          {error ? (
            <div role="alert" className="mt-4 border-l-2 border-[#C46A61] bg-[#13272D] px-4 py-4 text-sm text-[#E8B0AA]">
              <p>{error}</p>
              {resetLabel ? <p className="mt-1 text-xs text-[#BDBEBD]">{labels.limitReset} {resetLabel}.</p> : null}
              {limitResetAt ? (
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <Link href={signupHref} className="inline-flex min-h-10 items-center gap-2 bg-[#4A7F74] px-4 text-xs font-medium text-white hover:bg-[#568D81]">
                    {labels.signup}<ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link href={enterpriseHref} className="inline-flex items-center gap-2 text-xs font-medium text-[#96B5A6] hover:text-white">
                    {labels.access}<ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}

          {result ? (
            <div className="mt-5 border-t border-[#263D44]">
              {(result.results ?? []).length === 0 ? (
                <div className="py-5">
                  <p className="text-sm text-[#E7DFCE]">{labels.noResults}</p>
                  <p className="mt-2 text-xs leading-5 text-[#9EAAA8]">{labels.noResultsBody}</p>
                </div>
              ) : (result.results ?? []).map((hit, index) => (
                <article key={`${hit.title}-${index}`} className="grid gap-3 border-b border-[#263D44] py-5 sm:grid-cols-[1fr_auto] sm:items-start">
                  <div>
                    <h3 className="text-base font-medium leading-6 text-[#E7DFCE]">{hit.title}</h3>
                    <p className="mt-2 text-xs text-[#879492]">{hit.country || "—"} · {hit.status || "—"}</p>
                    <div className="mt-3 flex flex-wrap gap-2">{hit.ipc.map((code) => <span key={code} className="font-mono text-[10px] text-[#96B5A6]">IPC {code}</span>)}</div>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-[#6F807E]">Preview</span>
                </article>
              ))}

              <div className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div>
                  {(result.locked_count ?? 0) > 0 ? <p className="text-sm text-[#9EAAA8]"><strong className="font-medium text-[#E7DFCE]">+{result.locked_count}</strong> {labels.locked}</p> : null}
                  <p className={`${(result.locked_count ?? 0) > 0 ? "mt-2 " : ""}max-w-2xl text-xs leading-5 text-[#879492]`}>{labels.signupBody}</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 sm:justify-end">
                  <Link href={signupHref} className="inline-flex min-h-10 items-center gap-2 bg-[#4A7F74] px-4 text-sm font-medium text-white hover:bg-[#568D81]">
                    {labels.signup}<ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href={enterpriseHref} className="inline-flex items-center gap-2 text-sm font-medium text-[#96B5A6] hover:text-white">
                    {labels.access}<ArrowRight className="h-4 w-4" />
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
