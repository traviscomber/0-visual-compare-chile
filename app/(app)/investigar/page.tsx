"use client"

import { type FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowRight, Database, Loader2, Search, ShieldCheck, Tags } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  OperationalHeader,
  OperationalPage,
  OperationalPanel,
  OperationalSectionHeader,
} from "@/components/app/operational-ui"

type BrandHit = {
  id: string
  nombre: string
  solicitante?: string | null
  estado: string
  numeroRegistro?: string | null
  niza?: string[]
}

type BrandResponse = {
  results?: BrandHit[]
  total?: number
  durationMs?: number
  source?: string
  error?: string
  code?: string
  resetAt?: string
  preview?: boolean
  accessTier?: "free" | "full"
  hiddenResults?: number
}

export default function InvestigarPage() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [result, setResult] = useState<BrandResponse | null>(null)

  const runResearch = async (rawQuery: string) => {
    const q = rawQuery.trim()
    if (q.length < 2) return

    setLoading(true)
    setError(null)
    setErrorCode(null)
    setResult(null)

    try {
      const params = new URLSearchParams({ q, type: "nombre", match: "3" })
      const response = await fetch(`/api/inapi/search?${params}`, { cache: "no-store" })
      const payload = (await response.json().catch(() => ({}))) as BrandResponse
      if (!response.ok) {
        setErrorCode(payload.code ?? null)
        throw new Error(
          response.status === 401
            ? "Tu sesión expiró. Vuelve a iniciar sesión."
            : payload.error || "No fue posible consultar antecedentes marcarios.",
        )
      }
      setResult(payload)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible completar la investigación.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const initialQuery = params.get("q")?.trim() ?? ""
    if (!initialQuery) return
    setQuery(initialQuery)
    if (params.get("autorun") === "1") void runResearch(initialQuery)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (event: FormEvent) => {
    event.preventDefault()
    if (loading) return
    await runResearch(query)
  }

  const rows = result?.results ?? []
  const hasResult = result !== null
  const isPreview = result?.preview === true || result?.accessTier === "free"
  const freeLimitReached = errorCode === "FREE_MONTHLY_LIMIT"
  const enterpriseHref = `/acceso-empresarial?marca=${encodeURIComponent(query.trim())}`

  return (
    <OperationalPage>
      <OperationalHeader
        eyebrow="VIDENTIA / Investigar"
        title={<>Revisa una marca antes de avanzar.</>}
        description={
          <p>
            Consulta antecedentes marcarios disponibles y clases Niza. La vista preliminar no incluye evaluación jurídica, estrategia ni recomendaciones operativas.
          </p>
        }
        meta={
          <>
            <span>Fuente visible</span>
            <span>Vista preliminar</span>
            <span>Chile primero</span>
          </>
        }
      />

      <section className="py-8 sm:py-10">
        <OperationalPanel className="p-4 sm:p-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
            <form onSubmit={run} className="min-w-0">
              <label htmlFor="trademark-query" className="mb-2 block text-[10px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">
                Marca a revisar
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  id="trademark-query"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ejemplo: FALABELLA"
                  maxLength={160}
                  className="h-12 flex-1 bg-[#0F2A33] text-base"
                  autoComplete="off"
                />
                <Button type="submit" disabled={query.trim().length < 2 || loading} className="h-12 min-w-44">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Search className="mr-2 h-4 w-4" />}
                  {loading ? "Consultando" : "Revisar marca"}
                </Button>
              </div>
            </form>

            <div className="border-t border-border/70 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">La vista incluye</p>
              <div className="mt-3 space-y-2 text-sm text-white/85">
                <p className="flex items-center gap-2"><Database className="h-4 w-4 text-[#96B5A6]" />Coincidencias principales</p>
                <p className="flex items-center gap-2"><Tags className="h-4 w-4 text-[#96B5A6]" />Clases Niza observadas</p>
                <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#96B5A6]" />Estado visible de la marca</p>
              </div>
            </div>
          </div>
        </OperationalPanel>
      </section>

      {error ? (
        <div role="alert" className="flex items-start gap-3 border border-red-500/25 bg-red-500/[0.07] p-4 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0">
            <p>{error}</p>
            {freeLimitReached ? (
              <div className="mt-3">
                <Link href="/acceso-empresarial" className="inline-flex min-h-9 items-center gap-2 bg-[#4A7F74] px-3 text-xs font-medium text-white transition-colors hover:bg-[#568D81]">
                  Solicitar acceso empresarial <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {hasResult && result ? (
        <section className="pb-10">
          <OperationalSectionHeader
            eyebrow={isPreview ? "Vista preliminar" : "Resultado de investigación"}
            title={<>“{query.trim()}”</>}
            meta={`${result.total ?? result.results?.length ?? 0} antecedentes detectados`}
          />

          {isPreview ? (
            <div className="mt-5 grid gap-5 border-y border-border/80 py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div>
                <p className="text-sm font-medium text-[#E7DFCE]">Esta cuenta muestra sólo una muestra de antecedentes.</p>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  No incluye titulares completos, números de expediente, análisis de conflicto, recomendaciones, estrategia de registro, vigilancia ni informe descargable.
                </p>
                {typeof result.hiddenResults === "number" && result.hiddenResults > 0 ? (
                  <p className="mt-2 text-xs text-[#96B5A6]">Hay {result.hiddenResults} antecedentes adicionales fuera de esta vista.</p>
                ) : null}
              </div>
              <Button asChild className="justify-self-start lg:justify-self-end">
                <Link href={enterpriseHref}>Solicitar acceso empresarial <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-border/80 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 border border-[#4A7F74]/25 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#96B5A6]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4A7F74]" />Marcas
                </span>
                {result.source ? <span className="text-xs text-muted-foreground">Fuente reportada: {result.source}</span> : null}
              </div>
              {typeof result.durationMs === "number" ? <span className="text-xs text-muted-foreground">Consulta {result.durationMs} ms</span> : null}
            </div>
          )}

          {rows.length > 0 ? (
            <div className="divide-y divide-border/80">
              {rows.map((brand) => (
                <article key={brand.id} className="grid gap-5 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-medium text-[#E7DFCE]">{brand.nombre || "Marca sin nombre"}</h3>
                      <Badge variant="outline" className="rounded-md border-border/80 bg-transparent text-white/75">
                        {brand.estado || "Sin estado"}
                      </Badge>
                    </div>
                    {isPreview ? (
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">Clases Niza {brand.niza?.join(", ") || "—"}</p>
                    ) : (
                      <>
                        <p className="mt-1 text-sm text-white/80">{brand.solicitante || "Titular no informado"}</p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">Niza {brand.niza?.join(", ") || "—"} · Registro {brand.numeroRegistro || "—"}</p>
                      </>
                    )}
                  </div>
                  {!isPreview && brand.nombre ? (
                    <Button asChild size="sm" variant="secondary" className="justify-self-start md:justify-self-end">
                      <Link href={`/evaluar?brand=${encodeURIComponent(brand.nombre)}`}>
                        Evaluar evidencia <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <OperationalPanel className="mt-5">
              <p className="text-sm font-medium text-[#E7DFCE]">No encontramos antecedentes marcarios para este término.</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Esto describe la cobertura de esta consulta; no equivale a una conclusión de registrabilidad.</p>
            </OperationalPanel>
          )}

          <div className="mt-6 flex flex-col gap-3 border-t border-border/80 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
              La presencia o ausencia de coincidencias no constituye disponibilidad, registrabilidad ni asesoría jurídica.
            </p>
            {isPreview ? (
              <Link href={enterpriseHref} className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-[#96B5A6] hover:text-white">
                Acceso empresarial <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link href={`/consulta-inapi?q=${encodeURIComponent(query.trim())}&type=nombre&match=3&autorun=1`} className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-[#96B5A6] hover:text-white">
                Abrir expediente de búsqueda <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </section>
      ) : null}

      {!hasResult && !loading && !error ? <EmptyResearch /> : null}
    </OperationalPage>
  )
}

function EmptyResearch() {
  return (
    <section className="grid gap-px border-y border-border/80 bg-border/70 md:grid-cols-3">
      <ResearchPrompt index="01" title="Busca el signo" copy="Ingresa la denominación y revisa una muestra de antecedentes relacionados." />
      <ResearchPrompt index="02" title="Observa la cobertura" copy="Compara nombres, estados y clases Niza sin convertir la búsqueda en una conclusión jurídica." />
      <ResearchPrompt index="03" title="Profundiza en empresa" copy="El análisis completo, los expedientes y la vigilancia forman parte del acceso empresarial." />
    </section>
  )
}

function ResearchPrompt({ index, title, copy }: { index: string; title: string; copy: string }) {
  return (
    <div className="min-h-44 bg-background p-6">
      <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">{index}</span>
      <h2 className="mt-5 text-xl font-light tracking-[-0.025em] text-[#E7DFCE]">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{copy}</p>
    </div>
  )
}
