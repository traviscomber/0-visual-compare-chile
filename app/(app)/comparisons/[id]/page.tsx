import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { ComparisonResultView } from "@/components/app/comparison-result-view"
import { DeleteComparisonButton } from "@/components/app/delete-comparison-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getOperationalClassificationLabel } from "@/lib/classification-knowledge"
import { resolveBrandContext, resolveComparisonOcr } from "@/lib/comparison/context"
import { classificationLabel, formatDateLong } from "@/lib/format"
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

function exifSummaryFromJson(e: NonNullable<ResultJson["exif"]>["a"] | undefined): ExifSummary | null {
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

export default async function ComparisonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  let user = null

  try {
    user = (await supabase.auth.getUser()).data.user
  } catch {
    user = null
  }

  if (!user) redirect(`/auth/login?redirectTo=${encodeURIComponent(`/comparisons/${id}`)}`)

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
    comparison.diff_storage_path ? createSignedImageUrl(supabase, comparison.diff_storage_path) : Promise.resolve(null),
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

  const sharedNiza = brandContext?.shared_niza ?? []
  const sharedViena = brandContext?.shared_viena ?? []
  const evidenceCoverage = buildEvidenceCoverage(result)

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-7 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <Button variant="ghost" asChild className="-ml-3">
          <Link href="/history">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Actividad
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{formatDateLong(comparison.created_at)}</span>
          <DeleteComparisonButton id={comparison.id} redirectTo="/history" />
        </div>
      </div>

      <header className="grid gap-6 border-b border-border pb-7 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">VIDENTIA / Evidencia visual</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] text-foreground sm:text-5xl">Comparación guardada.</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Registro técnico de una comparación persistida, con sus imágenes, señales, artefactos y contexto marcario disponible.
          </p>
        </div>
        <p className="border-l border-border pl-5 text-sm leading-6 text-muted-foreground">
          La comparación organiza evidencia visual. No determina confundibilidad jurídica, registrabilidad ni una decisión de INAPI.
        </p>
      </header>

      <section className="grid border-y border-border sm:grid-cols-4">
        <DetailStat label="Lectura técnica" value={classificationLabel(result.classification)} />
        <DetailStat label="Cobertura" value={evidenceCoverage} />
        <DetailStat label="Niza compartida" value={sharedNiza.length ? String(sharedNiza.length) : "—"} />
        <DetailStat label="Viena compartida" value={sharedViena.length ? String(sharedViena.length) : "—"} />
      </section>

      {(sharedNiza.length > 0 || sharedViena.length > 0) && (
        <section className="border-y border-border px-5 py-5 sm:px-6">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Continuar investigación</p>
          <h2 className="mt-2 text-xl font-medium text-foreground">Clasificaciones compartidas detectadas</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Usa estas señales para abrir una investigación más amplia; son contexto, no una conclusión por sí mismas.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {sharedNiza.map((code) => (
              <Link key={`detail-niza-${code}`} href={`/investigar?q=${encodeURIComponent(code)}`}>
                <Badge variant="outline" className="gap-1 hover:bg-secondary/30">
                  Niza {code} · {getOperationalClassificationLabel("niza", code)}
                </Badge>
              </Link>
            ))}
            {sharedViena.map((code) => (
              <Link key={`detail-viena-${code}`} href={`/investigar?q=${encodeURIComponent(code)}`}>
                <Badge variant="outline" className="gap-1 hover:bg-secondary/30">
                  Viena {code} · {getOperationalClassificationLabel("viena", code)}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ComparisonResultView
        result={result}
        imageA={imgA && urlA ? { url: urlA, filename: imgA.filename } : null}
        imageB={imgB && urlB ? { url: urlB, filename: imgB.filename } : null}
      />
    </div>
  )
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border py-4 sm:border-b-0 sm:border-r sm:px-5 sm:first:pl-0 sm:last:border-r-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-medium text-foreground">{value}</p>
    </div>
  )
}

function buildEvidenceCoverage(result: ComparisonResultPayload): string {
  let coverage = 0
  if (result.signals.pixel_similarity != null) coverage += 1
  if (result.ocr_a?.text || result.ocr_b?.text) coverage += 1
  if (result.exif_a || result.exif_b) coverage += 1
  if (result.brand_context?.shared_niza?.length || result.brand_context?.shared_viena?.length) coverage += 1

  if (coverage >= 4) return "Alta"
  if (coverage >= 2) return "Media"
  return "Básica"
}
