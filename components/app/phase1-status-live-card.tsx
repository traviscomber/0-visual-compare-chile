"use client"

import { Activity, RefreshCcw } from "lucide-react"
import { Phase1ActionsPanel } from "@/components/app/phase1-actions-panel"
import { Phase1StatusOverview } from "@/components/app/phase1-status-overview"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePhase1Status } from "@/hooks/use-phase1-status"
import type { Phase1StatusPayload } from "@/lib/phase1-status"

export function Phase1StatusLiveCard({ initialPayload }: { initialPayload: Phase1StatusPayload }) {
  const { summary, fetchedAt, loading, refreshing, error, loadSummary, actions } = usePhase1Status(initialPayload)

  if (loading && !summary) {
    return (
      <Card className="border-[#294047] bg-[#10262D] text-white shadow-none">
        <CardHeader>
          <CardTitle className="text-lg font-normal text-[#E7DFCE]">Estado operativo</CardTitle>
          <CardDescription className="text-[#8F9A98]">Cargando disponibilidad INAPI y capacidad de integración…</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error && !summary) {
    return (
      <Card className="border-[#5C3D39] bg-[#10262D] text-white shadow-none">
        <CardHeader>
          <CardTitle className="text-lg font-normal text-[#E7DFCE]">Estado operativo no disponible</CardTitle>
          <CardDescription className="text-[#D9A39B]">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void loadSummary("initial")}
            className="bg-[#172F34] text-white hover:bg-[#20393A]"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!summary) return null

  return (
    <Card className="overflow-hidden border-[#294047] bg-[#10262D] text-white shadow-none">
      <CardHeader className="border-b border-[#294047] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[#96B5A6]">
              <Activity className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">Phase1 / estado operativo</p>
            </div>
            <CardTitle className="mt-2 text-xl font-normal tracking-[-0.02em] text-[#E7DFCE]">
              Cobertura, capacidad y gates de salida
            </CardTitle>
            <CardDescription className="mt-2 text-sm leading-6 text-[#AEB6B4]">
              Consolida ingestión INAPI y capacidad de integración sin convertir estas métricas en una conclusión jurídica.
            </CardDescription>
            <p className="mt-3 text-xs text-[#7F8C8A]">
              {fetchedAt ? `Última lectura: ${new Date(fetchedAt).toLocaleString("es-CL")}` : "Sin hora de lectura disponible"}
            </p>
            {error ? <p className="mt-2 text-xs leading-5 text-[#D6B56F]">Última actualización: {error}</p> : null}
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={() => void loadSummary("refresh")}
            disabled={refreshing}
            className="h-9 shrink-0 bg-[#172F34] text-white hover:bg-[#20393A]"
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin motion-reduce:animate-none" : ""}`} />
            {refreshing ? "Actualizando" : "Actualizar"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-5 sm:p-6">
        <Phase1StatusOverview summary={summary} variant="dark" />
        <Phase1ActionsPanel actions={actions} variant="dark" />
      </CardContent>
    </Card>
  )
}
