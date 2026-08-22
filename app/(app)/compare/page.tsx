import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { CompareWorkbench } from "@/components/app/compare-workbench"
import { CompareTrademarkBrief } from "@/components/app/compare-trademark-brief"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Comparación visual - Visual Compare",
}

export default function ComparePage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10">
      <div>
        <Button asChild variant="ghost" className="mb-4 h-auto p-0 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground">
          <Link href="/evaluar"><ArrowLeft className="mr-2 h-4 w-4" />Volver a Evaluar</Link>
        </Button>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Evaluar · Evidencia visual</p>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-foreground">Comparar dos identidades visuales</h1>
        <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground">
          Contrasta dos imágenes para entender similitudes visuales relevantes. Esta vista es una herramienta de profundización dentro del flujo de evaluación, no una conclusión jurídica por sí sola.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <CompareWorkbench />
        <CompareTrademarkBrief />
      </div>
    </div>
  )
}
