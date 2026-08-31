import { OperationalHeader, OperationalPage } from "@/components/app/operational-ui"
import { TechnologySignalsWorkbench } from "@/components/intelligence/technology-signals-workbench"

export const dynamic = "force-dynamic"

export default function TechnologyIntelligencePage() {
  return (
    <OperationalPage>
      <OperationalHeader
        eyebrow="VIDENTIA / Tecnologías"
        title="Vea qué tecnologías están tomando velocidad."
        description="Compare momentum científico con protección patentaria reciente y revise la evidencia que sostiene cada eje. VIDENTIA separa señal, corroboración y contexto para no presentar actividad como predicción."
        meta={<><span>OpenAlex</span><span>Crossref</span><span>Patentes INAPI activas</span><span>EPO OPS preparado</span><span>GDELT contexto</span></>}
      />
      <TechnologySignalsWorkbench />
    </OperationalPage>
  )
}
