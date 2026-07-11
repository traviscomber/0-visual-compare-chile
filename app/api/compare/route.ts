import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { compareRequestSchema } from "@/lib/validations"
import { calculateFinalScore } from "@/lib/image/scoring"
import { generateDiffOverlay } from "@/lib/image/diff"
import { compareExif, type ExifData } from "@/lib/image/exif"
import { BUCKET, createSignedUrl } from "@/lib/storage"
import { GPT4oMiniVisionService } from "@/lib/vision/gpt4o-mini"
import type { ComparisonResultPayload, ExifSummary, ForensicSignals, AiAnalysis } from "@/types/comparison"

export const runtime = "nodejs"
export const maxDuration = 60

interface ImageMetadataJson {
  format?: string | null
  aspect_ratio?: number | null
  avg_color?: { r: number; g: number; b: number } | null
  brightness?: number | null
  exif?: Partial<ExifData> | null
  ela?: { score?: number | null; storage_path?: string | null } | null
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
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 })
    }

    const body = await request.json()
    const parse = compareRequestSchema.safeParse(body)
    if (!parse.success) {
      return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 })
    }

    const { image_a_id, image_b_id } = parse.data
    if (image_a_id === image_b_id) {
      return NextResponse.json({ error: "Selecciona dos imágenes distintas." }, { status: 400 })
    }

    const { data: images, error } = await supabase
      .from("images")
      .select("*")
      .in("id", [image_a_id, image_b_id])
      .eq("status", "active")

    if (error || !images || images.length !== 2) {
      return NextResponse.json({ error: "Imágenes no encontradas." }, { status: 404 })
    }

    const imageA = images.find((i) => i.id === image_a_id)
    const imageB = images.find((i) => i.id === image_b_id)
    if (!imageA || !imageB || imageA.user_id !== user.id || imageB.user_id !== user.id) {
      return NextResponse.json({ error: "No tienes acceso a estas imágenes." }, { status: 403 })
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

    // Download both originals from storage so we can run pixel-level diffing.
    const admin = createAdminClient()
    const [downloadA, downloadB] = await Promise.all([
      admin.storage.from(BUCKET).download(imageA.storage_path),
      admin.storage.from(BUCKET).download(imageB.storage_path),
    ])
    if (downloadA.error || !downloadA.data || downloadB.error || !downloadB.data) {
      return NextResponse.json({ error: "No pudimos cargar las imágenes para comparar." }, { status: 500 })
    }
    const bufferA = Buffer.from(await downloadA.data.arrayBuffer())
    const bufferB = Buffer.from(await downloadB.data.arrayBuffer())

    let pixelSimilarity: number | null = null
    let diffStoragePath: string | null = null
    let aiAnalysis: AiAnalysis | null = null

    // Run diff overlay and AI analysis in parallel to save latency.
    const [diffResult, aiResult] = await Promise.allSettled([
      generateDiffOverlay(bufferA, bufferB),
      process.env.OPENAI_API_KEY
        ? (async () => {
            const vision = new GPT4oMiniVisionService()
            const base64A = bufferA.toString("base64")
            const base64B = bufferB.toString("base64")
            return vision.compareBrands({
              imageA: base64A,
              imageB: base64B,
              brandName1: imageA.filename,
              brandName2: imageB.filename,
            })
          })()
        : Promise.resolve(null),
    ])

    if (diffResult.status === "fulfilled" && diffResult.value) {
      pixelSimilarity = diffResult.value.pixelSimilarity
      try {
        const tempId = crypto.randomUUID()
        const candidatePath = `${user.id}/diffs/${tempId}.png`
        const { error: diffUploadError } = await admin.storage
          .from(BUCKET)
          .upload(candidatePath, diffResult.value.png, { contentType: "image/png", upsert: false })
        if (!diffUploadError) diffStoragePath = candidatePath
      } catch (err) {
        console.error("[v0] diff upload failed", err)
      }
    } else if (diffResult.status === "rejected") {
      console.error("[v0] diff overlay generation failed", diffResult.reason)
    }

    if (aiResult.status === "fulfilled" && aiResult.value) {
      const r = aiResult.value as {
        colorSimilarity: number
        typesSimilarity: number
        styleSimilarity: number
        similarities: string[]
        differences: string[]
        confusionRisk: string
        overallScore: number
        recommendation: string
        colorsA?: string[]
        colorsB?: string[]
        tokensUsed?: number
      }
      aiAnalysis = {
        summary: r.recommendation ?? "",
        similarities: r.similarities ?? [],
        differences: r.differences ?? [],
        ai_score: r.overallScore ?? 0,
        confusion_risk: (["low", "medium", "high"].includes(r.confusionRisk) ? r.confusionRisk : "low") as AiAnalysis["confusion_risk"],
        colors_a: r.colorsA ?? [],
        colors_b: r.colorsB ?? [],
        tokens_used: r.tokensUsed ?? 0,
      }
    } else if (aiResult.status === "rejected") {
      console.error("[v0] AI analysis failed", aiResult.reason)
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
      exif: { a: exifA, b: exifB },
      ela: { a: { score: elaScoreA, storage_path: elaPathA }, b: { score: elaScoreB, storage_path: elaPathB } },
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

    const { data: comparison, error: insertError } = await supabase
      .from("comparisons")
      .insert({
        user_id: user.id,
        image_a_id: imageA.id,
        image_b_id: imageB.id,
        similarity_score: result.similarity_score,
        classification: result.classification,
        signals: result.signals,
        recommendation: result.recommendation,
        result_json: resultJson,
        diff_storage_path: diffStoragePath,
      })
      .select()
      .single()

    if (insertError || !comparison) {
      // Best-effort cleanup of orphan diff overlay
      if (diffStoragePath) await admin.storage.from(BUCKET).remove([diffStoragePath])
      return NextResponse.json({ error: "No pudimos guardar la comparación." }, { status: 500 })
    }

    await supabase.from("usage_logs").insert({
      user_id: user.id,
      organization_id: user.id,
      action: "comparison.created",
      metadata: {
        comparison_id: comparison.id,
        similarity_score: result.similarity_score,
        classification: result.classification,
        had_diff_overlay: diffStoragePath !== null,
        ela_alert: forensics.ela_alert,
      },
    })

    const [diffUrl, elaUrlA, elaUrlB] = await Promise.all([
      diffStoragePath ? createSignedUrl(diffStoragePath, 60 * 60) : Promise.resolve(null),
      elaPathA ? createSignedUrl(elaPathA, 60 * 60) : Promise.resolve(null),
      elaPathB ? createSignedUrl(elaPathB, 60 * 60) : Promise.resolve(null),
    ])

    const payload: ComparisonResultPayload = {
      id: comparison.id,
      similarity_score: Number(comparison.similarity_score),
      classification: comparison.classification,
      recommendation: comparison.recommendation,
      signals: comparison.signals,
      diff_url: diffUrl,
      ela_url_a: elaUrlA,
      ela_url_b: elaUrlB,
      exif_a: exifSummary(exifA),
      exif_b: exifSummary(exifB),
      created_at: comparison.created_at,
      ai_analysis: aiAnalysis,
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error("[v0] compare error", error)
    return NextResponse.json({ error: "Error interno al comparar." }, { status: 500 })
  }
}
