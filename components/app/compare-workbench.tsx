"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { GitCompareArrows, Loader2, RotateCcw } from "lucide-react"
import { ImageDropzone } from "@/components/app/image-dropzone"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { ComparisonResultPayload } from "@/types/comparison"

type UploadedImage = {
  id: string
  filename: string
  size_bytes: number
  width: number | null
  height: number | null
  url: string
}

const ComparisonResultView = dynamic(
  () => import("@/components/app/comparison-result-view").then((mod) => mod.ComparisonResultView),
  {
    loading: () => (
      <div className="flex items-center gap-3 border-y border-border py-8 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary motion-reduce:animate-none" />
        Cargando evidencia de la comparación…
      </div>
    ),
  },
)

export function CompareWorkbench() {
  const router = useRouter()
  const [imageA, setImageA] = useState<UploadedImage | null>(null)
  const [imageB, setImageB] = useState<UploadedImage | null>(null)
  const [comparing, setComparing] = useState(false)
  const [result, setResult] = useState<ComparisonResultPayload | null>(null)

  const handleCompare = async () => {
    if (!imageA || !imageB) return
    setComparing(true)

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image_a_id: imageA.id, image_b_id: imageB.id }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? "No fue posible comparar las imágenes.")

      setResult(json as ComparisonResultPayload)
      toast.success("Comparación guardada en tu actividad")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "No fue posible comparar las imágenes.")
    } finally {
      setComparing(false)
    }
  }

  const handleReset = () => {
    setImageA(null)
    setImageB(null)
    setResult(null)
  }

  if (result) {
    return (
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-4 border-y border-border bg-card/25 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#96B5A6]">Comparación persistida</p>
            <p className="mt-2 text-sm leading-6 text-white/80">La evidencia quedó disponible en Reportes y en el detalle técnico.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" /> Nueva comparación
            </Button>
            <Button onClick={() => router.push(`/comparisons/${result.id}`)}>Abrir detalle</Button>
          </div>
        </div>
        <ComparisonResultView
          result={result}
          imageA={imageA ? { url: imageA.url, filename: imageA.filename } : null}
          imageB={imageB ? { url: imageB.url, filename: imageB.filename } : null}
        />
      </div>
    )
  }

  const ready = Boolean(imageA && imageB)

  return (
    <section aria-labelledby="compare-workbench-title">
      <div className="mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#96B5A6]">Evidencia visual</p>
        <h2 id="compare-workbench-title" className="mt-2 text-2xl font-light tracking-[-0.03em] text-[#E7DFCE]">
          Prepara las dos imágenes a contrastar
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Mantén cada imagen como evidencia separada. La comparación se ejecuta sólo cuando ambas están listas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ImageDropzone label="01 / Imagen A" image={imageA} onChange={setImageA} />
        <ImageDropzone label="02 / Imagen B" image={imageB} onChange={setImageB} />
      </div>

      <div className="mt-5 flex flex-col gap-4 border-y border-border bg-card/20 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">03 / Ejecutar comparación</p>
          <p className="mt-2 text-sm font-medium text-foreground">
            {ready ? "Ambas evidencias están listas." : "Selecciona dos imágenes para habilitar la comparación."}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">El resultado se guarda automáticamente y conserva sus señales técnicas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={handleReset} disabled={!imageA && !imageB}>Limpiar</Button>
          <Button onClick={handleCompare} disabled={!ready || comparing}>
            {comparing ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />Comparando…</>
            ) : (
              <><GitCompareArrows className="mr-2 h-4 w-4" />Comparar evidencia</>
            )}
          </Button>
        </div>
      </div>
    </section>
  )
}
