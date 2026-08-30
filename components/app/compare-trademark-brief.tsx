"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSearch } from "@/hooks/useSearch"
import { buildResultReason, buildResultRiskLevel, buildSearchExecutiveSummary, formatRiskLabel } from "@/lib/trademark-insights"

export function CompareTrademarkBrief() {
  const searchParams = useSearchParams()
  const initialBrand = searchParams.get("brand")?.trim() ?? ""
  const [brandName, setBrandName] = useState(initialBrand)
  const [activeBrand, setActiveBrand] = useState(initialBrand)
  const { resultados, cargando, search } = useSearch()

  useEffect(() => {
    if (!initialBrand) return
    void search({ query: initialBrand, type: "nombre", limit: 4 })
    setActiveBrand(initialBrand)
  }, [initialBrand, search])

  const summary = useMemo(
    () => buildSearchExecutiveSummary(activeBrand, "nombre", resultados),
    [activeBrand, resultados],
  )

  return (
    <section aria-labelledby="denominative-context-title">
      <div className="flex items-start gap-3">
        <Search className="mt-1 h-4 w-4 shrink-0 text-[#96B5A6]" strokeWidth={1.6} />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#96B5A6]">Contexto denominativo</p>
          <h2 id="denominative-context-title" className="mt-2 text-2xl font-light tracking-[-0.03em] text-[#E7DFCE]">
            Cruza la imagen con antecedentes por nombre
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            La comparación visual es una señal. Contrástala con denominación, estado y clases antes de decidir qué antecedente revisar.
          </p>
        </div>
      </div>

      <form
        className="mt-5 flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          const nextBrand = brandName.trim()
          if (!nextBrand) return
          setActiveBrand(nextBrand)
          void search({ query: nextBrand, type: "nombre", limit: 4 })
        }}
      >
        <Input
          value={brandName}
          onChange={(event) => setBrandName(event.target.value)}
          placeholder="Ejemplo: FALABELLA"
          className="h-11 border-border bg-[#0D222A] text-white placeholder:text-muted-foreground focus-visible:border-[#4A7F74] focus-visible:ring-[#4A7F74]/30"
        />
        <Button type="submit" disabled={cargando || !brandName.trim()} className="h-11 w-full">
          {cargando ? "Consultando…" : "Cruzar nombre"}
        </Button>
      </form>

      {activeBrand ? (
        <div className="mt-6">
          <div className="border-y border-border py-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Prioridad de revisión</p>
            <p className="mt-2 text-xl font-light text-[#E7DFCE]">{summary.riskLabel}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{summary.recommendation}</p>
            <div className="mt-5 grid grid-cols-2 border-t border-border pt-4">
              <ContextStat label="Priorizados" value={String(summary.criticalCount)} />
              <ContextStat label="Registrados" value={String(summary.registeredCount)} />
            </div>
          </div>

          <div className="divide-y divide-border">
            {resultados.slice(0, 4).map((result) => {
              const priority = buildResultRiskLevel(result, activeBrand, "nombre")
              return (
                <Link
                  key={result.marca.id}
                  href={`/marca/${result.marca.id}`}
                  className="grid gap-3 py-4 transition-colors hover:bg-secondary/20 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:px-2"
                >
                  <div>
                    <p className="font-medium text-foreground">{result.marca.nombre}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{buildResultReason(result, activeBrand, "nombre")}</p>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{result.marca.estado}</span>
                      <span>Niza {result.marca.niza.slice(0, 2).join(", ") || "sin dato"}</span>
                    </div>
                  </div>
                  <span className={priorityClassName(priority)}>{formatRiskLabel(priority)}</span>
                </Link>
              )
            })}
          </div>

          {resultados.length === 0 && !cargando ? (
            <p className="border-b border-border py-5 text-sm leading-6 text-muted-foreground">
              Esta consulta no devolvió antecedentes en la muestra disponible. Eso no equivale a disponibilidad ni registrabilidad.
            </p>
          ) : null}

          <div className="mt-5">
            <Button asChild variant="secondary" className="w-full">
              <Link href={`/consulta-inapi?q=${encodeURIComponent(activeBrand)}&type=nombre&match=3&autorun=1`}>
                Abrir fuente INAPI
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {summary.primaryResult && summary.risk === "high" ? (
            <div className="mt-5 border-l-2 border-destructive/60 pl-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Primera revisión sugerida</p>
              <p className="mt-2 text-sm leading-6 text-foreground/85">
                <strong>{summary.primaryResult.marca.nombre}</strong> concentra la señal denominativa más relevante de esta muestra. Revisa su ficha y clases antes de interpretar la similitud visual.
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-6 border-y border-border py-5 text-sm leading-6 text-muted-foreground">
          Ingresa una denominación para cruzar la comparación visual con antecedentes marcarios disponibles.
        </p>
      )}

      <p className="mt-5 text-xs leading-5 text-muted-foreground">
        Prioridad de revisión ≠ riesgo jurídico ≠ registrabilidad. La fuente oficial y el juicio profesional siguen siendo determinantes.
      </p>
    </section>
  )
}

function ContextStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-border pr-4 last:border-r-0 last:pl-4 last:pr-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-light text-[#E7DFCE]">{value}</p>
    </div>
  )
}

function priorityClassName(priority: "high" | "medium" | "low") {
  if (priority === "high") return "text-[10px] font-semibold uppercase tracking-[0.14em] text-destructive"
  if (priority === "medium") return "text-[10px] font-semibold uppercase tracking-[0.14em] text-warning"
  return "text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
}
