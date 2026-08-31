import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { OperationalHeader, OperationalPage } from "@/components/app/operational-ui"
import { TechnologyStrategyWorkbench } from "@/components/intelligence/technology-strategy-workbench"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default function TechnologyStrategyPage() {
  return (
    <OperationalPage>
      <OperationalHeader
        eyebrow="VIDENTIA / Tecnologías / Estrategia"
        title="De evidencia técnica a lectura estratégica."
        description="Sitúe madurez observable, proxy de adopción, actores visibles y movimientos competitivos sin convertir actividad pública en intención corporativa."
        meta={<><span>Investigación</span><span>Patentes</span><span>Actores observados</span><span>Movimientos verificables</span></>}
        actions={<Button asChild variant="outline" size="sm"><Link href="/tecnologias"><ArrowLeft /> Volver a evidencia</Link></Button>}
      />
      <TechnologyStrategyWorkbench />
    </OperationalPage>
  )
}
