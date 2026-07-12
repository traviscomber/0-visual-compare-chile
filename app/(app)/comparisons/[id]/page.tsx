import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { ComparisonResultView } from "@/components/app/comparison-result-view"
import { DeleteComparisonButton } from "@/components/app/delete-comparison-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getOperationalClassificationLabel } from "@/lib/classification-knowledge"
import { resolveBrandContext, resolveComparisonOcr } from "@/lib/comparison/context"
import { classificationLabel, classificationTone, formatDateLong } from "@/lib/format"
import { createSignedImageUrl } from "@/lib/storage"
import { createClient } from "@/lib/supabase/server"
import type {
  BrandTaxonomyContext,
  ComparisonResultPayload,
  ComparisonSignals,
  ExifSummary,
} from "@/types/comparison"

export const dynamic = "force-dynamic"

interface ResultJson {
  ocr?: {
    a?: { text?: string | null; confidence?: number | null; language?: string | null } | null
    b?: { text?: string | null; confidence?: number | null; language?: string | null } | null
  }
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
  brand_context?: BrandTaxonomyContext | null
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
      "id, similarity_score, classification, recommendation, signals, created_at, image_a_id, image_b_id, diff_storage_path, result_json, brand_context",
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

  const imgA = images?.find((image) => image.id === comparison.image_a_id) ?? null
  const imgB = images?.find((image) => image.id === comparison.image_b_id) ?? null

  const resultJson = (comparison.result_json as ResultJson | null) ?? null
  const elaPathA = resultJson?.ela?.a?.storage_path ?? null
  const elaPathB = resultJson?.ela?.b?.storage_path ?? null
  const brandContext = resolveBrandContext({
    brand_context: comparison.brand_context as BrandTaxonomyContext | null,
    result_json: resultJson,
  })
  const ocr = resolveComparisonOcr({ result_json: resultJson })

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
    brand_context: brandContext,
    ocr_a: ocr.a,
    ocr_b: ocr.b,
    created_at: comparison.created_at,
  }

  const score = Math.round(Number(result.similarity_score))
  const tone = classificationTone(result.classification)
  const phashDistance = result.signals.phash_distance
  const phashSimilarity = Math.round(result.signals.phash_similarity)
  const pixelSimilarity =
    result.signals.pixel_similarity != null ? Math.round(result.signals.pixel_similarity) : null
  const sharedNiza = brandContext?.shared_niza ?? []
  const sharedViena = brandContext?.shared_viena ?? []
  const forensicsState = result.signals.forensics.ela_alert
    ? "Alerta ELA"
    : result.signals.forensics.any_edited
      ? "Editada"
      : "Sin alertas"
  const operationalRisk =
    result.signals.forensics.ela_alert || score >= 85 || result.classification === "exact_match"
      ? "Revision prioritaria"
      : score >= 60 || result.classification === "visually_similar"
        ? "Revision media"
        : "Bajo"
  const evidenceCoverage = buildEvidenceCoverage(result)
  const consultationRoute =
    sharedNiza.length || sharedViena.length
      ? `${sharedNiza.length + sharedViena.length} cruces`
      : "Sin cruce"
  const nextAction = buildNextAction({
    operationalRisk,
    evidenceCoverage,
    sharedNizaCount: sharedNiza.length,
    sharedVienaCount: sharedViena.length,
  })

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10">
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
        <h1 className="font-serif text-3xl text-foreground">Detalle de comparacion</h1>
        <p className="mt-1 text-muted-foreground">
          Analisis completo y senales utilizadas para la clasificacion.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-xl">Resumen operativo</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-5">
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
            helper={pixelSimilarity != null ? "Senal principal del motor" : "Fallback pHash + metadatos"}
            tone="neutral"
          />
          <SummaryStat
            label="Cobertura"
            value={evidenceCoverage}
            helper={consultationRoute}
            tone="neutral"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-xl">Ruta operativa recomendada</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{nextAction}</p>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Clases Niza compartidas</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {sharedNiza.length > 0 ? (
                  sharedNiza.map((code) => (
                    <Link key={`summary-niza-${code}`} href={`/consulta?type=niza&q=${encodeURIComponent(code)}`}>
                      <Badge variant="outline" className="gap-1 hover:bg-background">
                        <span>Niza {code}</span>
                        <span className="text-muted-foreground">
                          {getOperationalClassificationLabel("niza", code)}
                        </span>
                      </Badge>
                    </Link>
                  ))
                ) : (
                  <Badge variant="secondary">Sin clase Niza compartida</Badge>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Codigos Viena compartidos</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {sharedViena.length > 0 ? (
                  sharedViena.map((code) => (
                    <Link key={`summary-viena-${code}`} href={`/consulta?type=viena&q=${encodeURIComponent(code)}`}>
                      <Badge variant="outline" className="gap-1 hover:bg-background">
                        <span>Viena {code}</span>
                        <span className="text-muted-foreground">
                          {getOperationalClassificationLabel("viena", code)}
                        </span>
                      </Badge>
                    </Link>
                  ))
                ) : (
                  <Badge variant="secondary">Sin codigo Viena compartido</Badge>
                )}
              </div>
            </div>
          </div>
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

function buildEvidenceCoverage(result: ComparisonResultPayload): string {
  let score = 0
  if (result.signals.pixel_similarity != null) score += 1
  if (result.ocr_a?.text || result.ocr_b?.text) score += 1
  if (result.exif_a || result.exif_b) score += 1
  if (result.brand_context?.shared_niza?.length || result.brand_context?.shared_viena?.length) score += 1

  if (score >= 4) return "Alta"
  if (score >= 2) return "Media"
  return "Basica"
}

function buildNextAction({
  operationalRisk,
  evidenceCoverage,
  sharedNizaCount,
  sharedVienaCount,
}: {
  operationalRisk: string
  evidenceCoverage: string
  sharedNizaCount: number
  sharedVienaCount: number
}) {
  if (operationalRisk === "Revision prioritaria") {
    return sharedNizaCount || sharedVienaCount
      ? "Escala esta comparacion a revision humana y abre Consulta sobre las clasificaciones compartidas antes de aprobar cualquier uso."
      : "Escala esta comparacion a revision humana. El riesgo es alto aunque aun no haya cruce claro de clasificaciones."
  }

  if (evidenceCoverage === "Alta") {
    return "La evidencia es suficiente para seguir con consulta reglada en Niza y Viena desde este mismo resultado."
  }

  return "Completa la validacion con una nueva carga o una consulta dirigida para reforzar el contexto de marca antes de decidir."
}
