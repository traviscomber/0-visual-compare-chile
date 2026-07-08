import { CompareWorkbench } from "@/components/app/compare-workbench"

export const metadata = {
  title: "Comparar imágenes — Visual Compare Chile",
}

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl text-foreground text-balance">Comparar imágenes</h1>
        <p className="text-foreground mt-1 max-w-2xl leading-relaxed">
          Sube dos imágenes de marca y obtén un análisis de similitud con score, clasificación y señales forenses
          para el flujo de revisión del MVP.
        </p>
      </div>
      <CompareWorkbench />
    </div>
  )
}
