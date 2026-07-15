import { CompareWorkbench } from "@/components/app/compare-workbench"
import { CompareTrademarkBrief } from "@/components/app/compare-trademark-brief"

export const metadata = {
  title: "Comparar imagenes - Visual Compare Chile",
}

export default function ComparePage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-balance font-serif text-3xl text-foreground">Comparar imagenes</h1>
        <p className="mt-1 max-w-2xl leading-relaxed text-foreground">
          Sube dos imagenes de marca y obten un analisis de similitud con score, clasificacion y senales forenses para
          el flujo de revision del MVP.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <CompareWorkbench />
        <CompareTrademarkBrief />
      </div>
    </div>
  )
}
