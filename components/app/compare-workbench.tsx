"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { GitCompareArrows, Loader2, RotateCcw } from "lucide-react"
import { ImageDropzone } from "@/components/app/image-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
      <Card>
        <CardContent className="flex items-center gap-3 py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div className="text-sm text-foreground">Cargando resultado detallado...</div>
        </CardContent>
      </Card>
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
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error ?? "Error al comparar")
      }

      setResult(json as ComparisonResultPayload)
      toast.success("Comparacion completada")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al comparar")
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
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-foreground">Resultado guardado en tu historial.</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Nueva comparacion
            </Button>
            <Button onClick={() => router.push(`/comparisons/${result.id}`)}>Ver detalle</Button>
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

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ImageDropzone label="Imagen A" image={imageA} onChange={setImageA} />
        <ImageDropzone label="Imagen B" image={imageB} onChange={setImageB} />
      </div>

      <Card>
        <CardContent className="flex flex-col items-start justify-between gap-4 py-5 sm:flex-row sm:items-center">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">Listo para analizar</span>
            <span className="text-sm text-foreground">
              Sube ambas imagenes y ejecuta el analisis. El resultado se guarda automaticamente.
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} disabled={!imageA && !imageB}>
              Limpiar
            </Button>
            <Button onClick={handleCompare} disabled={!imageA || !imageB || comparing}>
              {comparing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <GitCompareArrows className="mr-2 h-4 w-4" />
                  Comparar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
