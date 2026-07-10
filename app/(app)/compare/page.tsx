import { CompareWorkbench } from "@/components/app/compare-workbench"

export const metadata = {
  title: "Comparar imagenes - Visual Compare Chile",
}

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl text-foreground text-balance">Comparar imagenes</h1>
        <p className="text-foreground mt-1 max-w-2xl leading-relaxed">
          Sube dos imagenes de marca y obten un analisis de similitud con score, clasificacion y señales forenses
          para el flujo de revision del MVP.
        </p>
      </div>
      <CompareWorkbench />
    </div>
  )
}
