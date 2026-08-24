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
    <section className="border-y border-border px-5 py-6 sm:px-6">
      <div className="flex items-start gap-3">
        <Search className="mt-1 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Contexto denominativo</p>
          <h2 className="mt-2 text-xl font-medium tracking-tight text-foreground">Cruza la imagen con antecedentes por nombre.</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            La comparación visual es una señal. Contrástala con denominación, estado y clases antes de decidir qué antecedente revisar.
          </p>
        </div>
      </div>

      <form
        className="mt-5 flex flex-col gap-3 sm:flex-row"
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
          className="h-11"
        />
        <Button type="submit" disabled={cargando || !brandName.trim()} className="h-11 shrink-0">
          {cargando ? "Consultando…" : "Cruzar nombre"}
        </Button>
      </form>

      {activeBrand ? (
        <div className="mt-6">
          <div className="grid gap-4 border-y border-border py-4 sm:grid-cols-[1fr_auto] sm:items-start">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Prioridad de revisión</p>
              <p className="mt-2 text-lg font-medium text-foreground">{summary.riskLabel}</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{summary.recommendation}</p>
            </div>
            <div className="grid grid-cols-2 gap-5 text-right sm:grid-cols-1">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Antecedentes priorizados</p>
                <p className="mt-1 text-lg font-medium text-foreground">{summary.criticalCount}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Registrados en muestra</p>
                <p className="mt-1 text-lg font-medium text-foreground">{summary.registeredCount}</p>
              </div>
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

          <div className="mt-5 flex justify-end">
            <Button asChild variant="outline">
              <Link href={`/consulta-inapi?q=${encodeURIComponent(activeBrand)}&type=nombre&match=3&autorun=1`}>
                Abrir fuente INAPI
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {summary.primaryResult && summary.risk === "high" ? (
            <div className="mt-5 border-l-2 border-destructive/60 pl-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Primera revisión sugerida</p>
              <p className="mt-2 text-sm leading-6 text-foreground/85">
                <strong>{summary.primaryResult.marca.nombre}</strong> concentra la señal denominativa más relevante de esta muestra. Revisa su ficha y clases antes de interpretar la similitud visual.
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-6 border-y border-dashed border-border py-5 text-sm leading-6 text-muted-foreground">
          Ingresa una denominación para cruzar la comparación visual con antecedentes marcarios disponibles.
        </p>
      )}

      <p className="mt-5 text-xs leading-5 text-muted-foreground">
        Prioridad de revisión ≠ riesgo jurídico ≠ registrabilidad. La fuente oficial y el juicio profesional siguen siendo determinantes.
      </p>
    </section>
  )
}

function priorityClassName(priority: "high" | "medium" | "low") {
  if (priority === "high") return "font-mono text-[10px] uppercase tracking-[0.14em] text-destructive"
  if (priority === "medium") return "font-mono text-[10px] uppercase tracking-[0.14em] text-warning"
  return "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
}
