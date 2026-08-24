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
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10">
      <div className="border-b border-white/[0.08] pb-7">
        <Button asChild variant="ghost" className="mb-4 h-auto p-0 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground">
          <Link href="/evaluar"><ArrowLeft className="mr-2 h-4 w-4" />Volver a Evaluar</Link>
        </Button>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Evaluar · Herramienta avanzada</p>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-foreground">Comparar dos identidades visuales</h1>
        <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground">
          Contrasta dos imágenes y revisa las señales visuales por separado. Esta herramienta profundiza evidencia técnica; no determina disponibilidad, registrabilidad, aceptación ni rechazo jurídico.
        </p>
        <p className="mt-4 text-xs uppercase tracking-[0.12em] text-muted-foreground">Señal visual ≠ análisis marcario completo ≠ decisión jurídica</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <CompareWorkbench />
        <CompareTrademarkBrief />
      </div>
    </div>
  )
}
