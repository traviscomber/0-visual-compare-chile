import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { CompareWorkbench } from "@/components/app/compare-workbench"
import { CompareTrademarkBrief } from "@/components/app/compare-trademark-brief"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Comparación visual · VIDENTIA",
}

export default function ComparePage() {
  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <Button
        asChild
        variant="ghost"
        className="mb-6 h-auto w-fit p-0 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground"
      >
        <Link href="/evaluar">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Evaluar
        </Link>
      </Button>

      <header className="grid gap-7 border-b border-border pb-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#96B5A6]">
            VIDENTIA / EVIDENCIA VISUAL
          </p>
          <h1 className="mt-3 max-w-4xl text-balance text-4xl font-light tracking-[-0.045em] text-[#E7DFCE] sm:text-5xl lg:text-6xl">
            Comparar dos identidades visuales
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/85">
            Contrasta dos imágenes y revisa las señales visuales por separado. Esta herramienta profundiza evidencia técnica; no determina disponibilidad, registrabilidad, aceptación ni rechazo jurídico.
          </p>
        </div>

        <div className="border-l border-border pl-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Cómo leer el resultado</p>
          <p className="mt-2 text-sm leading-6 text-white/80">
            La señal visual debe revisarse junto con denominación, clases, estado y fuente oficial antes de tomar una decisión.
          </p>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">Señal visual ≠ análisis marcario completo ≠ decisión jurídica.</p>
        </div>
      </header>

      <div className="grid border-b border-border xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <div className="py-8 xl:pr-8">
          <CompareWorkbench />
        </div>
        <div className="border-t border-border py-8 xl:border-l xl:border-t-0 xl:pl-8">
          <CompareTrademarkBrief />
        </div>
      </div>
    </div>
  )
}
