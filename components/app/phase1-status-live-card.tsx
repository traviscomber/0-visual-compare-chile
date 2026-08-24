"use client"

import { RefreshCcw } from "lucide-react"
import { Phase1ActionsPanel } from "@/components/app/phase1-actions-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Phase1StatusOverview } from "@/components/app/phase1-status-overview"
import { usePhase1Status } from "@/hooks/use-phase1-status"
import type { Phase1StatusPayload } from "@/lib/phase1-status"

export function Phase1StatusLiveCard({ initialPayload }: { initialPayload: Phase1StatusPayload }) {
  const { summary, fetchedAt, loading, refreshing, error, loadSummary, actions } = usePhase1Status(initialPayload)

  if (loading && !summary) return <Card><CardHeader><CardTitle className="text-lg">Estado operativo</CardTitle><CardDescription>Resumen de disponibilidad INAPI, credenciales API y uso de cuota.</CardDescription></CardHeader><CardContent><p className="text-sm text-muted-foreground">Cargando estado operativo…</p></CardContent></Card>

  if (error && !summary) return <Card><CardHeader><CardTitle className="text-lg">Estado operativo</CardTitle><CardDescription>Resumen de disponibilidad INAPI, credenciales API y uso de cuota.</CardDescription></CardHeader><CardContent><p className="text-sm text-red-300">{error}</p><Button type="button" variant="outline" className="mt-4" onClick={() => void loadSummary("initial")}><RefreshCcw className="h-4 w-4"/>Reintentar</Button></CardContent></Card>

  if (!summary) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div><CardTitle className="text-lg">Estado operativo</CardTitle><CardDescription>Resumen de disponibilidad INAPI, credenciales API y uso de cuota.</CardDescription></div>
          <Button type="button" variant="outline" onClick={() => void loadSummary("refresh")} disabled={refreshing}><RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin motion-reduce:animate-none" : ""}`}/>{refreshing?"Actualizando":"Actualizar"}</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4"><p className="text-xs text-muted-foreground">{fetchedAt?`Última lectura: ${new Date(fetchedAt).toLocaleString("es-CL")}`:"Sin hora de lectura disponible"}</p>{error?<p className="mt-2 text-sm text-amber-300">{error}</p>:null}</div>
        <Phase1StatusOverview summary={summary}/>
        <div className="mt-6"><Phase1ActionsPanel actions={actions}/></div>
      </CardContent>
    </Card>
  )
}
