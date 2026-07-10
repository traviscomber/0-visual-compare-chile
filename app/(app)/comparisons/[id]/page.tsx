import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ComparisonResultView } from "@/components/app/comparison-result-view"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { createSignedImageUrl } from "@/lib/storage"
import { classificationLabel, classificationTone, formatDateLong } from "@/lib/format"
import { DeleteComparisonButton } from "@/components/app/delete-comparison-button"
import type {
  ComparisonResultPayload,
  ComparisonSignals,
  ExifSummary,
} from "@/types/comparison"

export const dynamic = "force-dynamic"

interface ResultJson {
  exif?: {
    a?: {
      camera_make?: string | null
      camera_model?: string | null
      software?: string | null
      taken_at?: string | null
      gps?: { lat: number; lng: number } | null
      was_edited?: boolean
    }
    b?: {
      camera_make?: string | null
      camera_model?: string | null
      software?: string | null
      taken_at?: string | null
      gps?: { lat: number; lng: number } | null
      was_edited?: boolean
    }
  }
  ela?: {
    a?: { storage_path?: string | null; score?: number | null }
    b?: { storage_path?: string | null; score?: number | null }
  }
}

function exifSummaryFromJson(
  e: NonNullable<ResultJson["exif"]>["a"] | undefined,
): ExifSummary | null {
  if (!e) return null
  const camera = [e.camera_make, e.camera_model].filter(Boolean).join(" ").trim() || null
  return {
    camera,
    software: e.software ?? null,
    taken_at: e.taken_at ?? null,
    gps: e.gps ?? null,
    was_edited: Boolean(e.was_edited),
  }
}

export default async function ComparisonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  let user = null
  try {
    const result = await supabase.auth.getUser()
    user = result.data.user
  } catch {
    user = null
  }

  if (!user) {
    redirect(`/auth/login?redirectTo=${encodeURIComponent(`/comparisons/${id}`)}`)
  }

  const { data: comparison, error } = await supabase
    .from("comparisons")
    .select(
      "id, similarity_score, classification, recommendation, signals, created_at, image_a_id, image_b_id, diff_storage_path, result_json",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (error || !comparison) notFound()

  const { data: images } = await supabase
    .from("images")
    .select("id, filename, storage_path")
    .eq("user_id", user.id)
    .in("id", [comparison.image_a_id, comparison.image_b_id])

  const imgA = images?.find((i) => i.id === comparison.image_a_id) ?? null
  const imgB = images?.find((i) => i.id === comparison.image_b_id) ?? null

  const resultJson = (comparison.result_json as ResultJson | null) ?? null
  const elaPathA = resultJson?.ela?.a?.storage_path ?? null
  const elaPathB = resultJson?.ela?.b?.storage_path ?? null

  const [urlA, urlB, diffUrl, elaUrlA, elaUrlB] = await Promise.all([
    imgA ? createSignedImageUrl(supabase, imgA.storage_path) : Promise.resolve(null),
    imgB ? createSignedImageUrl(supabase, imgB.storage_path) : Promise.resolve(null),
    comparison.diff_storage_path
      ? createSignedImageUrl(supabase, comparison.diff_storage_path)
      : Promise.resolve(null),
    elaPathA ? createSignedImageUrl(supabase, elaPathA) : Promise.resolve(null),
    elaPathB ? createSignedImageUrl(supabase, elaPathB) : Promise.resolve(null),
  ])

  const result: ComparisonResultPayload = {
    id: comparison.id,
    similarity_score: Number(comparison.similarity_score),
    classification: comparison.classification,
    recommendation: comparison.recommendation,
    signals: comparison.signals as ComparisonSignals,
    diff_url: diffUrl,
    ela_url_a: elaUrlA,
    ela_url_b: elaUrlB,
    exif_a: exifSummaryFromJson(resultJson?.exif?.a),
    exif_b: exifSummaryFromJson(resultJson?.exif?.b),
    created_at: comparison.created_at,
  }

  const score = Math.round(Number(result.similarity_score))
  const tone = classificationTone(result.classification)
  const phashDistance = result.signals.phash_distance
  const phashSimilarity = Math.round(result.signals.phash_similarity)
  const pixelSimilarity =
    result.signals.pixel_similarity != null ? Math.round(result.signals.pixel_similarity) : null
  const forensicsState = result.signals.forensics.ela_alert
    ? "Alerta ELA"
    : result.signals.forensics.any_edited
      ? "Editada"
      : "Sin alertas"
  const operationalRisk =
    result.signals.forensics.ela_alert || score >= 85 || result.classification === "exact_match"
      ? "Revisión prioritaria"
      : score >= 60 || result.classification === "visually_similar"
        ? "Revisión media"
        : "Bajo"

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" asChild className="gap-1 -ml-2">
          <Link href="/history">
            <ArrowLeft className="h-4 w-4" />
            Volver al historial
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{formatDateLong(comparison.created_at)}</span>
          <DeleteComparisonButton id={comparison.id} redirectTo="/history" />
        </div>
      </div>

      <div>
        <h1 className="font-serif text-3xl text-foreground">Detalle de comparación</h1>
        <p className="text-muted-foreground mt-1">
          Análisis completo y señales utilizadas para la clasificación.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-xl">Resumen operativo</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <SummaryStat
            label="Veredicto"
            value={classificationLabel(result.classification)}
            helper={`${score}% de similitud`}
            tone={tone}
          />
          <SummaryStat label="Riesgo" value={operationalRisk} helper={forensicsState} tone={tone} />
          <SummaryStat
            label="pHash"
            value={`${phashSimilarity}%`}
            helper={phashDistance != null ? `Distancia ${phashDistance} bits` : "Sin dato"}
            tone="neutral"
          />
          <SummaryStat
            label="Diff visual"
            value={pixelSimilarity != null ? `${pixelSimilarity}%` : "No disponible"}
            helper={pixelSimilarity != null ? "Señal principal del motor" : "Fallback pHash + metadatos"}
            tone="neutral"
          />
        </CardContent>
      </Card>

      <ComparisonResultView
        result={result}
        imageA={imgA && urlA ? { url: urlA, filename: imgA.filename } : null}
        imageB={imgB && urlB ? { url: urlB, filename: imgB.filename } : null}
      />
    </div>
  )
}

function SummaryStat({
  label,
  value,
  helper,
  tone,
}: {
  label: string
  value: string
  helper: string
  tone: ReturnType<typeof classificationTone> | "neutral"
}) {
  const toneStyles =
    tone === "danger"
      ? "border-destructive bg-destructive/5 text-destructive"
      : tone === "warn"
        ? "border-warning bg-warning/5 text-warning"
        : tone === "ok"
          ? "border-success bg-success/5 text-success"
          : "border-border bg-card text-foreground"

  return (
    <div className={`rounded-lg border p-4 ${toneStyles}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <Badge variant="outline" className="text-[10px]">
          Operativo
        </Badge>
      </div>
      <div className="mt-2 text-2xl font-serif font-semibold">{value}</div>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  )
}
