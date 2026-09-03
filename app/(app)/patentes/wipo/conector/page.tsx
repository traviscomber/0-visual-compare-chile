import Link from "next/link"
import { ArrowLeft, CheckCircle2, Download, ExternalLink, ShieldCheck } from "lucide-react"
import { OperationalHeader, OperationalPage, OperationalPanel } from "@/components/app/operational-ui"
import { Button } from "@/components/ui/button"

const CONNECTOR_DOWNLOAD="/videntia-wipo-connector/videntia-wipo-connector.zip"

export default function WipoConnectorPage(){
  return <OperationalPage>
    <Button asChild variant="ghost" size="sm" className="mb-4 w-fit px-0 text-muted-foreground hover:bg-transparent hover:text-white"><Link href="/patentes/wipo"><ArrowLeft className="h-4 w-4"/>Volver a Seguimientos WIPO</Link></Button>
    <OperationalHeader
      eyebrow="VIDENTIA / WIPO / CONECTOR"
      title="Activa WIPO una sola vez."
      description={<>El conector permite que VIDENTIA use tu sesión ya iniciada de PATENTSCOPE para preparar seguimientos sin pedirte enlaces ni contraseñas.</>}
      meta={<><span>Una sola instalación</span><span>Sin credenciales WIPO</span><span>patentscope.wipo.int</span></>}
    />

    <section className="py-8">
      <OperationalPanel className="overflow-hidden p-0">
        <div className="grid md:grid-cols-3">
          <div className="border-b border-border/80 p-6 md:border-b-0 md:border-r">
            <p className="text-2xl font-light text-[#96B5A6]">1</p>
            <h2 className="mt-4 text-base font-medium text-white">Descarga</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Descarga el conector oficial de VIDENTIA y descomprime la carpeta.</p>
            <Button asChild size="sm" className="mt-4"><a href={CONNECTOR_DOWNLOAD} download><Download className="h-4 w-4"/>Descargar conector</a></Button>
          </div>
          <div className="border-b border-border/80 p-6 md:border-b-0 md:border-r">
            <p className="text-2xl font-light text-[#96B5A6]">2</p>
            <h2 className="mt-4 text-base font-medium text-white">Activa en Opera</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Abre <span className="font-mono text-[#E7DFCE]">opera://extensions</span>, activa Developer mode y elige Load unpacked sobre la carpeta descomprimida.</p>
          </div>
          <div className="p-6">
            <p className="text-2xl font-light text-[#96B5A6]">3</p>
            <h2 className="mt-4 text-base font-medium text-white">Vuelve a VIDENTIA</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Recarga Seguimientos WIPO. Desde ese momento sólo escribes qué quieres seguir y pulsas Activar seguimiento.</p>
            <Button asChild variant="outline" size="sm" className="mt-4"><Link href="/patentes/wipo"><CheckCircle2 className="h-4 w-4"/>Volver y comprobar</Link></Button>
          </div>
        </div>
      </OperationalPanel>
    </section>

    <section className="pb-8">
      <OperationalPanel>
        <div className="flex items-start gap-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#96B5A6]"/>
          <div>
            <h2 className="text-sm font-medium text-[#E7DFCE]">Qué hace el conector</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Sólo opera dentro de VIDENTIA y PATENTSCOPE. Detecta o prepara la consulta guardada, solicita a WIPO su enlace oficial de seguimiento y lo entrega a VIDENTIA. No lee, almacena ni envía tu usuario o contraseña de WIPO.</p>
            <a href="https://patentscope.wipo.int/search/en/reg/user_queries.jsf" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#96B5A6] hover:text-[#B9D2C6]">Abrir PATENTSCOPE <ExternalLink className="h-3.5 w-3.5"/></a>
          </div>
        </div>
      </OperationalPanel>
    </section>
  </OperationalPage>
}
