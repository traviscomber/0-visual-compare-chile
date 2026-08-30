import { OperationalHeader, OperationalPage } from "@/components/app/operational-ui"
import { TechnologySignalsWorkbench } from "@/components/intelligence/technology-signals-workbench"

export const dynamic = "force-dynamic"

export default function TechnologyIntelligencePage() {
  return (
    <OperationalPage>
      <OperationalHeader
        eyebrow="VIDENTIA / Tecnologías"
        title="Vea qué tecnologías están tomando velocidad."
        description="Compare actividad reciente con el período anterior y revise la evidencia que sustenta cada señal. VIDENTIA combina publicaciones científicas y noticias recientes sin presentar señales como predicciones."
        meta={<><span>OpenAlex</span><span>Crossref</span><span>GDELT</span><span>Patentes: EPO OPS preparado</span></>}
      />
      <TechnologySignalsWorkbench />
    </OperationalPage>
  )
}
