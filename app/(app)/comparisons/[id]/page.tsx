import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ComparisonResultView } from "@/components/app/comparison-result-view"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { createSignedImageUrl } from "@/lib/storage"
import { formatDateLong } from "@/lib/format"
import { DeleteComparisonButton } from "@/components/app/delete-comparison-button"
import type {
  ComparisonResultPayload,
  ComparisonSignals,
  ExifSummary,
} from "@/types/comparison"

export const dynamic = "force-dynamic"

interface ResultJson {
  exif?: {
    a?: { camera_make?: string | null; camera_model?: string | null; software?: string | null; taken_at?: string | null; gps?: { lat: number; lng: number } | null; was_edited?: boolean }
    b?: { camera_make?: string | null; camera_model?: string | null; software?: string | null; taken_at?: string | null; gps?: { lat: number; lng: number } | null; was_edited?: boolean }
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
    .maybeSingle()

  if (error || !comparison) notFound()

  const { data: images } = await supabase
    .from("images")
    .select("id, filename, storage_path")
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
        <p className="text-muted-foreground mt-1">Análisis completo y señales utilizadas para la clasificación.</p>
      </div>

      <ComparisonResultView
        result={result}
        imageA={imgA && urlA ? { url: urlA, filename: imgA.filename } : null}
        imageB={imgB && urlB ? { url: urlB, filename: imgB.filename } : null}
      />
    </div>
  )
}
