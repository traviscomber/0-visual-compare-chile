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
}

export default function InvestigarPage() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BrandResponse | null>(null)

  const runResearch = async (rawQuery: string) => {
    const q = rawQuery.trim()
    if (q.length < 2) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const params = new URLSearchParams({ q, type: "nombre", match: "3" })
      const response = await fetch(`/api/inapi/search?${params}`, { cache: "no-store" })
      const payload = (await response.json().catch(() => ({}))) as BrandResponse
      if (!response.ok) {
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

  const rows = (result?.results ?? []).slice(0, 8)
  const hasResult = result !== null

  return (
    <OperationalPage>
      <OperationalHeader
        eyebrow="VIDENTIA / Investigar"
        title={<>Investiga una marca antes de decidir.</>}
        description={
          <p>
            Revisa antecedentes marcarios disponibles, titulares, estados y clases Niza. La evidencia se mantiene separada de cualquier conclusión jurídica.
          </p>
        }
        meta={
          <>
            <span>Fuente visible</span>
            <span>Evidencia trazable</span>
            <span>Chile primero</span>
          </>
        }
        actions={
          <Button asChild variant="secondary">
            <Link href="/consulta">
              Búsqueda avanzada <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <section className="py-8 sm:py-10">
        <OperationalPanel className="p-4 sm:p-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
            <form onSubmit={run} className="min-w-0">
              <label htmlFor="trademark-query" className="mb-2 block text-[10px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">
                Marca a investigar
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
                  {loading ? "Consultando" : "Investigar marca"}
                </Button>
              </div>
            </form>

            <div className="border-t border-border/70 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Qué obtienes</p>
              <div className="mt-3 space-y-2 text-sm text-white/85">
                <p className="flex items-center gap-2"><Database className="h-4 w-4 text-[#96B5A6]" />Antecedentes disponibles</p>
                <p className="flex items-center gap-2"><Tags className="h-4 w-4 text-[#96B5A6]" />Clases Niza y titulares</p>
                <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#96B5A6]" />Fuente y estado visibles</p>
              </div>
            </div>
          </div>
        </OperationalPanel>
      </section>

      {error ? (
        <div role="alert" className="flex items-start gap-3 rounded-[10px] border border-red-500/25 bg-red-500/[0.07] p-4 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {hasResult && result ? (
        <section className="pb-10">
          <OperationalSectionHeader
            eyebrow="Resultado de investigación"
            title={<>“{query.trim()}”</>}
            meta={`${result.total ?? result.results?.length ?? 0} antecedentes encontrados`}
          />

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-border/80 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[#4A7F74]/25 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#96B5A6]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4A7F74]" />Marcas
              </span>
              {result.source ? <span className="text-xs text-muted-foreground">Fuente reportada: {result.source}</span> : null}
            </div>
            {typeof result.durationMs === "number" ? <span className="text-xs text-muted-foreground">Consulta {result.durationMs} ms</span> : null}
          </div>

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
                    <p className="mt-1 text-sm text-white/80">{brand.solicitante || "Titular no informado"}</p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      Niza {brand.niza?.join(", ") || "—"} · Registro {brand.numeroRegistro || "—"}
                    </p>
                  </div>
                  {brand.nombre ? (
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
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Esto describe la cobertura de esta consulta; no equivale a una conclusión de registrabilidad.
              </p>
            </OperationalPanel>
          )}

          <div className="mt-6 flex flex-col gap-3 border-t border-border/80 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
              VIDENTIA organiza antecedentes para revisión. La ausencia o presencia de resultados no sustituye una evaluación jurídica profesional.
            </p>
            <Link href={`/consulta-inapi?q=${encodeURIComponent(query.trim())}&type=nombre&match=3&autorun=1`} className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-[#96B5A6] hover:text-white">
              Abrir expediente de búsqueda <ArrowRight className="h-4 w-4" />
            </Link>
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
      <ResearchPrompt index="01" title="Busca el signo" copy="Ingresa la denominación que quieres investigar y revisa antecedentes relacionados." />
      <ResearchPrompt index="02" title="Lee la evidencia" copy="Compara titular, estado, clases Niza y registro sin ocultar la fuente disponible." />
      <ResearchPrompt index="03" title="Decide el siguiente paso" copy="Pasa a evaluación para profundizar los conflictos que realmente requieren revisión." />
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
