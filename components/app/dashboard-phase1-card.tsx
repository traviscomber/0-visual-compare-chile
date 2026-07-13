"use client"

import Link from "next/link"
import { RefreshCcw } from "lucide-react"
import { Phase1ActionsPanel } from "@/components/app/phase1-actions-panel"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Phase1StatusOverview } from "@/components/app/phase1-status-overview"
import { usePhase1Status } from "@/hooks/use-phase1-status"

export function DashboardPhase1Card() {
  const { summary, fetchedAt, actions, loading, refreshing, error, loadSummary } = usePhase1Status()

  if (loading && !summary) {
    return (
      <Card className="border-white/10 bg-gradient-to-br from-slate-800/40 to-slate-800/20 p-6">
        <p className="text-sm text-slate-400">Cargando estado operativo de Fase 1...</p>
      </Card>
    )
  }

  if (error && !summary) {
    return (
      <Card className="border-white/10 bg-gradient-to-br from-slate-800/40 to-slate-800/20 p-6">
        <p className="text-sm text-rose-300">{error}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-4 border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
          onClick={() => void loadSummary("initial")}
        >
          <RefreshCcw className="h-4 w-4" />
          Reintentar
        </Button>
      </Card>
    )
  }

  if (!summary) {
    return null
  }

  return (
    <Card className="border-white/10 bg-gradient-to-br from-slate-800/40 to-slate-800/20 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-cyan-300">Fase 1 operativa</p>
          <h3 className="mt-1 text-xl font-semibold text-white">Datos reales y control del portal</h3>
          <p className="mt-1 text-xs text-slate-400">
            {fetchedAt ? `Ultima lectura: ${new Date(fetchedAt).toLocaleString("es-CL")}` : "Sin timestamp disponible"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
            onClick={() => void loadSummary("refresh")}
            disabled={refreshing}
          >
            <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Actualizando" : "Actualizar"}
          </Button>
          <Link href="/settings" className="text-sm text-cyan-300 hover:text-cyan-200">
            Abrir Settings
          </Link>
        </div>
      </div>

      {error ? <p className="mb-4 text-sm text-amber-300">{error}</p> : null}
      <Phase1StatusOverview summary={summary} variant="dark" />
      <div className="mt-4">
        <Phase1ActionsPanel actions={actions} variant="dark" compact />
      </div>
    </Card>
  )
}
