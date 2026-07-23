import { NextResponse } from "next/server"
import { authenticateApiKey, getQuotaHeaders, logApiKeyUsage } from "@/lib/api/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { buildBrandTaxonomyContext, mergeBrandTaxonomyContext } from "@/lib/brand-context"
import { insertComparisonWithFallback } from "@/lib/comparison/persistence"
import { generateDiffOverlay } from "@/lib/image/diff"
import { compareExif, type ExifData } from "@/lib/image/exif"
import { calculateFinalScore } from "@/lib/image/scoring"
import { BUCKET, createSignedUrl } from "@/lib/storage"
import { compareRequestSchema } from "@/lib/validations"
import type {
  BrandTaxonomyContext,
  ComparisonResultPayload,
  ExifSummary,
  ForensicSignals,
} from "@/types/comparison"

export const runtime = "nodejs"
export const maxDuration = 60

interface ImageMetadataJson {
  format?: string | null
  aspect_ratio?: number | null
  avg_color?: { r: number; g: number; b: number } | null
  brightness?: number | null
  ocr?: { text?: string | null; confidence?: number | null; language?: string | null } | null
  exif?: Partial<ExifData> | null
  ela?: { score?: number | null; storage_path?: string | null } | null
}

interface CompareResponse extends ComparisonResultPayload {
  image_a_id: string
  image_b_id: string
}

function exifFromMetadata(meta: ImageMetadataJson | null): ExifData {
  const e = meta?.exif

  return {
    camera_make: e?.camera_make ?? null,
    camera_model: e?.camera_model ?? null,
    software: e?.software ?? null,
    taken_at: e?.taken_at ?? null,
    modified_at: e?.modified_at ?? null,
    orientation: e?.orientation ?? null,
    gps: e?.gps ?? null,
    exposure: e?.exposure ?? { iso: null, fnumber: null, exposure_time: null, focal_length: null },
    was_edited: Boolean(e?.was_edited),
    raw: e?.raw ?? {},
  }
}

function exifSummary(exif: ExifData): ExifSummary {
  const camera = [exif.camera_make, exif.camera_model].filter(Boolean).join(" ").trim() || null

  return {
    camera,
    software: exif.software,
    taken_at: exif.taken_at,
    gps: exif.gps,
    was_edited: exif.was_edited,
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 })
    }

    const apiKey = authHeader.slice(7)
    const auth = await authenticateApiKey(apiKey)
    if (!auth.ok) {
      const status = auth.reason === "quota_exceeded" ? 429 : auth.reason === "unavailable" ? 503 : 401

      return NextResponse.json(
        { error: auth.message, reason: auth.reason },
        {
          status,
          headers:
            auth.reason === "quota_exceeded" &&
            auth.quota_daily !== undefined &&
            auth.quota_monthly !== undefined &&
            auth.usage_today !== undefined &&
            auth.usage_month !== undefined
              ? getQuotaHeaders({
                  quota_daily: auth.quota_daily,
                  quota_monthly: auth.quota_monthly,
                  usage_today: auth.usage_today,
                  usage_month: auth.usage_month,
                })
              : undefined,
        },
      )
    }
    const context = auth.context

    const body = await request.json().catch(() => null)
    const parsed = compareRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Both image_a_id and image_b_id are required" }, { status: 400 })
    }

    const { image_a_id, image_b_id } = parsed.data
    if (image_a_id === image_b_id) {
      return NextResponse.json({ error: "Cannot compare an image with itself" }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: images, error: fetchError } = await admin
      .from("images")
      .select("*")
      .eq("organization_id", context.organization_id)
      .eq("status", "active")
      .in("id", [image_a_id, image_b_id])

    if (fetchError || !images || images.length !== 2) {
      return NextResponse.json({ error: "One or both images not found" }, { status: 404 })
    }

    const imageA = images.find((image) => image.id === image_a_id)
    const imageB = images.find((image) => image.id === image_b_id)
    if (!imageA || !imageB) {
      return NextResponse.json({ error: "One or both images not found" }, { status: 404 })
    }

    const metaA = (imageA.metadata as ImageMetadataJson | null) ?? null
    const metaB = (imageB.metadata as ImageMetadataJson | null) ?? null
    const exifA = exifFromMetadata(metaA)
    const exifB = exifFromMetadata(metaB)
    const exifCompare = compareExif(exifA, exifB)

    const elaScoreA = metaA?.ela?.score ?? null
    const elaScoreB = metaB?.ela?.score ?? null
    const elaPathA = metaA?.ela?.storage_path ?? null
    const elaPathB = metaB?.ela?.storage_path ?? null
    const elaAlert = (elaScoreA ?? 0) > 40 || (elaScoreB ?? 0) > 40

    const forensics: ForensicSignals = {
      camera_match: exifCompare.camera_match,
      software_match: exifCompare.software_match,
      any_edited: exifCompare.any_edited,
      timestamp_delta_seconds: exifCompare.timestamp_delta_seconds,
      gps_distance_meters: exifCompare.gps_distance_meters,
      ela_score_a: elaScoreA,
      ela_score_b: elaScoreB,
      ela_alert: elaAlert,
    }

    const brandContextA = buildBrandTaxonomyContext({
      image_id: imageA.id,
      filename: imageA.filename,
      metadata_hint: [metaA?.ocr?.text, metaA?.format, exifA.camera_make, exifA.camera_model, exifA.software]
        .filter(Boolean)
        .join(" "),
    })
    const brandContextB = buildBrandTaxonomyContext({
      image_id: imageB.id,
      filename: imageB.filename,
      metadata_hint: [metaB?.ocr?.text, metaB?.format, exifB.camera_make, exifB.camera_model, exifB.software]
        .filter(Boolean)
        .join(" "),
    })
    const brandContext: BrandTaxonomyContext | null = mergeBrandTaxonomyContext(brandContextA, brandContextB)

    const [downloadA, downloadB] = await Promise.all([
      admin.storage.from(BUCKET).download(imageA.storage_path),
      admin.storage.from(BUCKET).download(imageB.storage_path),
    ])

    if (downloadA.error || !downloadA.data || downloadB.error || !downloadB.data) {
      return NextResponse.json({ error: "Failed to load images for comparison" }, { status: 500 })
    }

    const bufferA = Buffer.from(await downloadA.data.arrayBuffer())
    const bufferB = Buffer.from(await downloadB.data.arrayBuffer())

    let pixelSimilarity: number | null = null
    let diffStoragePath: string | null = null

    try {
      const overlay = await generateDiffOverlay(bufferA, bufferB)
      pixelSimilarity = overlay.pixelSimilarity

      const candidatePath = `${context.organization_id}/diffs/${crypto.randomUUID()}.png`
      const { error: diffUploadError } = await admin.storage
        .from(BUCKET)
        .upload(candidatePath, overlay.png, { contentType: "image/png", upsert: false })

      if (!diffUploadError) {
        diffStoragePath = candidatePath
      }
    } catch (error) {
      console.error("[v0] diff overlay generation failed", error)
    }

    const result = calculateFinalScore({
      sha256_a: imageA.sha256,
      sha256_b: imageB.sha256,
      phash_a: imageA.phash,
      phash_b: imageB.phash,
      pixel_similarity: pixelSimilarity,
      metadata_a: {
        width: imageA.width,
        height: imageA.height,
        mime_type: imageA.mime_type,
        size_bytes: imageA.size_bytes,
        format: metaA?.format ?? null,
        avg_color: metaA?.avg_color ?? null,
      },
      metadata_b: {
        width: imageB.width,
        height: imageB.height,
        mime_type: imageB.mime_type,
        size_bytes: imageB.size_bytes,
        format: metaB?.format ?? null,
        avg_color: metaB?.avg_color ?? null,
      },
      forensics,
    })

    const resultJson = {
      similarity_score: result.similarity_score,
      classification: result.classification,
      signals: result.signals,
      recommendation: result.recommendation,
      ocr: {
        a: metaA?.ocr ?? null,
        b: metaB?.ocr ?? null,
      },
      exif: { a: exifA, b: exifB },
      ela: { a: { score: elaScoreA, storage_path: elaPathA }, b: { score: elaScoreB, storage_path: elaPathB } },
      brand_context: brandContext,
      images: {
        a: {
          id: imageA.id,
          filename: imageA.filename,
          width: imageA.width,
          height: imageA.height,
          mime_type: imageA.mime_type,
          size_bytes: imageA.size_bytes,
          sha256: imageA.sha256,
          phash: imageA.phash,
        },
        b: {
          id: imageB.id,
          filename: imageB.filename,
          width: imageB.width,
          height: imageB.height,
          mime_type: imageB.mime_type,
          size_bytes: imageB.size_bytes,
          sha256: imageB.sha256,
          phash: imageB.phash,
        },
      },
    }

    const { data: comparison, error: insertError } = await insertComparisonWithFallback(admin, {
      user_id: context.user_id,
      organization_id: context.organization_id,
      image_a_id: imageA.id,
      image_b_id: imageB.id,
      similarity_score: result.similarity_score,
      classification: result.classification,
      signals: result.signals,
      recommendation: result.recommendation,
      result_json: resultJson,
      brand_context: brandContext,
      diff_storage_path: diffStoragePath,
    })

    if (insertError || !comparison) {
      console.error("[v0] comparison insert error", insertError)
      if (diffStoragePath) {
        await admin.storage.from(BUCKET).remove([diffStoragePath])
      }

      return NextResponse.json({ error: "Failed to save comparison" }, { status: 500 })
    }

    await logApiKeyUsage({
      user_id: context.user_id,
      organization_id: context.organization_id,
      api_key_id: context.api_key_id,
      action: "comparison.created",
      metadata: {
        comparison_id: comparison.id,
        similarity_score: result.similarity_score,
        classification: result.classification,
        had_diff_overlay: diffStoragePath !== null,
        ela_alert: forensics.ela_alert,
        has_brand_context: Boolean(brandContext),
      },
    })

    const [diffUrl, elaUrlA, elaUrlB] = await Promise.all([
      diffStoragePath ? createSignedUrl(diffStoragePath, 60 * 60) : Promise.resolve(null),
      elaPathA ? createSignedUrl(elaPathA, 60 * 60) : Promise.resolve(null),
      elaPathB ? createSignedUrl(elaPathB, 60 * 60) : Promise.resolve(null),
    ])

    const response: CompareResponse = {
      id: comparison.id,
      image_a_id: imageA.id,
      image_b_id: imageB.id,
      similarity_score: Number(comparison.similarity_score),
      classification: comparison.classification,
      recommendation: comparison.recommendation,
      signals: comparison.signals,
      diff_url: diffUrl,
      ela_url_a: elaUrlA,
      ela_url_b: elaUrlB,
      exif_a: exifSummary(exifA),
      exif_b: exifSummary(exifB),
      brand_context: brandContext,
      ocr_a: metaA?.ocr ?? null,
      ocr_b: metaB?.ocr ?? null,
      created_at: comparison.created_at,
    }

    return NextResponse.json(
      { success: true, data: response },
      {
        status: 200,
        headers: getQuotaHeaders({
          quota_daily: context.quota_daily,
          quota_monthly: context.quota_monthly,
          usage_today: context.usage_today,
          usage_month: context.usage_month,
        }),
      },
    )
  } catch (error) {
    console.error("[v0] compare error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
