import { OperationalHeader, OperationalPage } from "@/components/app/operational-ui"
import { TechnologySignalsWorkbench } from "@/components/intelligence/technology-signals-workbench"

export const dynamic = "force-dynamic"

export default function TechnologyIntelligencePage() {
  return (
    <OperationalPage>
      <OperationalHeader
        eyebrow="VIDENTIA / Tecnologías"
        title="Descubra qué tecnologías están ganando terreno."
        description="Busque una tecnología y vea, en una sola lectura, si crece la investigación, si aparecen nuevas patentes y si vale la pena seguirla."
        meta={<><span>Investigación global</span><span>Patentes INAPI Chile</span><span>Fuentes verificables</span><span>Noticias como contexto</span></>}
      />
      <TechnologySignalsWorkbench />
    </OperationalPage>
  )
}
