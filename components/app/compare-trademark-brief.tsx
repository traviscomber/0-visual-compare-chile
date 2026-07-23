"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AlertTriangle, ArrowRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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

    void search({
      query: initialBrand,
      type: "nombre",
      limit: 4,
    })
    setActiveBrand(initialBrand)
  }, [initialBrand, search])

  const summary = useMemo(
    () => buildSearchExecutiveSummary(activeBrand, "nombre", resultados),
    [activeBrand, resultados],
  )

  return (
    <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="rounded-full border border-white/10 bg-white/5 p-3 text-cyan-200">
          <Search className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Cruce INAPI</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Despues del analisis visual, cruza el nombre</h2>
          <p className="mt-2 text-sm text-slate-300">
            El score visual solo no alcanza. Usa esta misma vista para ver conflictos nominales y clases expuestas.
          </p>
        </div>
      </div>

      <form
        className="mt-5 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          const nextBrand = brandName.trim()
          setActiveBrand(nextBrand)
          void search({ query: nextBrand, type: "nombre", limit: 4 })
        }}
      >
        <Input
          value={brandName}
          onChange={(event) => setBrandName(event.target.value)}
          placeholder="Ej: VISUAL COMPARE"
          className="border-white/10 bg-slate-950/50 text-white placeholder:text-slate-500"
        />
        <Button
          type="submit"
          disabled={cargando || !brandName.trim()}
          className="bg-gradient-to-r from-cyan-600 to-blue-500 text-white hover:from-cyan-500 hover:to-blue-400"
        >
          {cargando ? "Buscando..." : "Cruzar nombre"}
        </Button>
      </form>

      {activeBrand ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Riesgo actual</p>
                <p className="mt-2 text-lg font-semibold text-white">{summary.riskLabel}</p>
              </div>
              <div className="text-right text-sm text-slate-300">
                <p>{summary.criticalCount} conflictos altos</p>
                <p>{summary.registeredCount} registradas en la muestra</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-200">{summary.recommendation}</p>
          </div>

          <div className="space-y-3">
            {resultados.slice(0, 4).map((result) => {
              const risk = buildResultRiskLevel(result, activeBrand, "nombre")
              return (
                <Link
                  key={result.marca.id}
                  href={`/marca/${result.marca.id}`}
                  className="block rounded-2xl border border-white/10 bg-slate-950/45 p-4 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{result.marca.nombre}</p>
                      <p className="mt-1 text-sm text-slate-300">{buildResultReason(result, activeBrand, "nombre")}</p>
                    </div>
                    <span className={compareRiskClassName(risk)}>{formatRiskLabel(risk)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span>{result.marca.estado}</span>
                    <span>Relevancia {result.relevancia}%</span>
                    <span>Niza {result.marca.niza.slice(0, 2).join(", ") || "sin dato"}</span>
                  </div>
                </Link>
              )
            })}
          </div>

          <div className="flex justify-end">
            <Button asChild variant="outline" className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
              <Link href={`/consulta?q=${encodeURIComponent(activeBrand)}&type=nombre`}>
                Abrir consulta completa
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
          Ingresa el nombre de la marca para cruzar el analisis visual con la base sincronizada.
        </div>
      )}

      {summary.primaryResult && summary.risk === "high" ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-50">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          <p>
            La senal mas fuerte ahora mismo es <strong>{summary.primaryResult.marca.nombre}</strong>. Si el logo tambien
            se parece, esta deberia ser la primera revision legal.
          </p>
        </div>
      ) : null}
    </Card>
  )
}

function compareRiskClassName(risk: "high" | "medium" | "low") {
  if (risk === "high") return "rounded-full border border-red-400/30 bg-red-500/15 px-3 py-1 text-xs text-red-100"
  if (risk === "medium") return "rounded-full border border-amber-400/30 bg-amber-500/15 px-3 py-1 text-xs text-amber-100"
  return "rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs text-emerald-100"
}
