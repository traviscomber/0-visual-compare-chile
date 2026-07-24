import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { extractExif, type ExifData } from "@/lib/image/exif"
import { calculateSha256 } from "@/lib/image/hash"
import { computeEla } from "@/lib/image/ela"
import { extractMetadata } from "@/lib/image/metadata"
import { extractImageText, type OcrResult } from "@/lib/image/ocr"
import { calculatePerceptualHash } from "@/lib/image/phash"
import { BUCKET, createSignedUrl } from "@/lib/storage"
import { createClient } from "@/lib/supabase/server"
import {
  detectImageMime,
  sanitizeFilename,
  validateDetectedImageMime,
  validateImageDimensions,
  validateImageFile,
} from "@/lib/validations"

export const runtime = "nodejs"
export const maxDuration = 60

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" }
const ANALYSIS_TIMEOUT_MS = 8_000
const OCR_TIMEOUT_MS = 12_000

type QuotaResult = {
  allowed: boolean
  retry_after_seconds: number
  remaining_minute: number
  remaining_day: number
}

const EMPTY_EXIF: ExifData = {
  camera_make: null,
  camera_model: null,
  software: null,
  taken_at: null,
  modified_at: null,
  orientation: null,
  gps: null,
  exposure: { iso: null, fnumber: null, exposure_time: null, focal_length: null },
  was_edited: false,
  raw: {},
}

const EMPTY_OCR: OcrResult = {
  text: null,
  confidence: null,
  language: "eng+spa",
}

function extensionFromMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg"
  if (mime === "image/png") return "png"
  if (mime === "image/webp") return "webp"
  if (mime === "image/tiff") return "tiff"
  return "bin"
}

function quotaHeaders(quota: QuotaResult): Record<string, string> {
  return {
    ...PRIVATE_HEADERS,
    "X-RateLimit-Remaining-Minute": String(quota.remaining_minute),
    "X-RateLimit-Remaining-Day": String(quota.remaining_day),
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => resolve(fallback), timeoutMs)
      }),
    ])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

async function cleanupStoragePaths(
  admin: ReturnType<typeof createAdminClient>,
  paths: string[],
): Promise<void> {
  if (paths.length === 0) return

  const { error } = await admin.storage.from(BUCKET).remove(paths)
  if (error) {
    console.error("[image-upload] cleanup failed", error.name)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: PRIVATE_HEADERS })
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400, headers: PRIVATE_HEADERS })
    }

    const validation = validateImageFile(file)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400, headers: PRIVATE_HEADERS })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const detectedMimeValidation = validateDetectedImageMime(file.type, detectImageMime(buffer))
    if (!detectedMimeValidation.ok) {
      return NextResponse.json(
        { error: detectedMimeValidation.error },
        { status: 400, headers: PRIVATE_HEADERS },
      )
    }

    const admin = createAdminClient()
    const { data: quotaData, error: quotaError } = await admin.rpc("consume_image_upload_quota", {
      p_user_id: user.id,
      p_bytes: buffer.byteLength,
    })

    if (quotaError) {
      console.error("[image-upload] quota check failed", quotaError.code)
      return NextResponse.json(
        { error: "No pudimos verificar la cuota de subida. Inténtalo nuevamente." },
        { status: 503, headers: { ...PRIVATE_HEADERS, "Retry-After": "30" } },
      )
    }

    const quota = (Array.isArray(quotaData) ? quotaData[0] : quotaData) as QuotaResult | null
    if (!quota) {
      return NextResponse.json(
        { error: "No pudimos verificar la cuota de subida. Inténtalo nuevamente." },
        { status: 503, headers: { ...PRIVATE_HEADERS, "Retry-After": "30" } },
      )
    }

    if (!quota.allowed) {
      return NextResponse.json(
        { error: "Has alcanzado temporalmente el límite de subidas." },
        {
          status: 429,
          headers: {
            ...quotaHeaders(quota),
            "Retry-After": String(Math.max(1, quota.retry_after_seconds)),
          },
        },
      )
    }

    const responseHeaders = quotaHeaders(quota)
    const verifiedMime = detectedMimeValidation.mime
    const safeFilename = sanitizeFilename(file.name)

    let meta
    try {
      meta = await extractMetadata(buffer)
    } catch {
      return NextResponse.json(
        { error: "El archivo está corrupto o no contiene una imagen válida." },
        { status: 400, headers: responseHeaders },
      )
    }

    const dimensionsValidation = validateImageDimensions(meta.width, meta.height)
    if (!dimensionsValidation.ok) {
      return NextResponse.json(
        { error: dimensionsValidation.error },
        { status: 400, headers: responseHeaders },
      )
    }

    const sha256 = calculateSha256(buffer)

    const { data: existing } = await supabase
      .from("images")
      .select("id, filename, size_bytes, width, height, mime_type, storage_path")
      .eq("user_id", user.id)
      .eq("sha256", sha256)
      .eq("status", "active")
      .maybeSingle()

    if (existing) {
      const signedUrl = await createSignedUrl(existing.storage_path, 60 * 60)
      return NextResponse.json(
        {
          id: existing.id,
          filename: existing.filename,
          size_bytes: existing.size_bytes,
          width: existing.width,
          height: existing.height,
          mime_type: existing.mime_type,
          url: signedUrl,
          deduplicated: true,
        },
        { headers: responseHeaders },
      )
    }

    const [phash, exif, ela] = await Promise.all([
      withTimeout(calculatePerceptualHash(buffer).catch(() => null), ANALYSIS_TIMEOUT_MS, null),
      withTimeout(extractExif(buffer).catch(() => EMPTY_EXIF), ANALYSIS_TIMEOUT_MS, EMPTY_EXIF),
      withTimeout(computeEla(buffer).catch(() => null), ANALYSIS_TIMEOUT_MS, null),
    ])

    const ocr = await withTimeout(extractImageText(buffer).catch(() => EMPTY_OCR), OCR_TIMEOUT_MS, EMPTY_OCR)

    const imageId = randomUUID()
    const ext = extensionFromMime(verifiedMime)
    const storagePath = `${user.id}/${imageId}/original.${ext}`
    const uploadedPaths: string[] = []
    let imagePersisted = false

    try {
      const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, buffer, {
        contentType: verifiedMime,
        upsert: false,
      })

      if (uploadError) {
        return NextResponse.json(
          { error: "No pudimos subir la imagen al almacenamiento." },
          { status: 500, headers: responseHeaders },
        )
      }
      uploadedPaths.push(storagePath)

      let elaPath: string | null = null
      if (ela && ela.png.length > 0) {
        const candidate = `${user.id}/${imageId}/ela.png`
        const { error: elaUploadError } = await admin.storage
          .from(BUCKET)
          .upload(candidate, ela.png, { contentType: "image/png", upsert: false })
        if (!elaUploadError) {
          elaPath = candidate
          uploadedPaths.push(candidate)
        }
      }

      const { data: imageRow, error: insertError } = await supabase
        .from("images")
        .insert({
          id: imageId,
          user_id: user.id,
          filename: safeFilename,
          storage_bucket: BUCKET,
          storage_path: storagePath,
          mime_type: verifiedMime,
          size_bytes: buffer.byteLength,
          width: meta.width,
          height: meta.height,
          sha256,
          phash,
          metadata: {
            format: meta.format,
            aspect_ratio: meta.aspect_ratio,
            avg_color: meta.avg_color,
            brightness: meta.brightness,
            ocr: {
              text: ocr.text,
              confidence: ocr.confidence,
              language: ocr.language,
            },
            exif: {
              camera_make: exif.camera_make,
              camera_model: exif.camera_model,
              software: exif.software,
              taken_at: exif.taken_at,
              modified_at: exif.modified_at,
              orientation: exif.orientation,
              was_edited: exif.was_edited,
              has_gps: Boolean(exif.gps),
            },
            ela: ela ? { score: ela.tampering_score, storage_path: elaPath } : null,
          },
        })
        .select("id, filename, size_bytes, width, height, mime_type")
        .single()

      if (insertError || !imageRow) {
        await cleanupStoragePaths(admin, uploadedPaths)
        uploadedPaths.length = 0

        const { data: raceWinner } = await supabase
          .from("images")
          .select("id, filename, size_bytes, width, height, mime_type, storage_path")
          .eq("user_id", user.id)
          .eq("sha256", sha256)
          .eq("status", "active")
          .maybeSingle()

        if (raceWinner) {
          const signedUrl = await createSignedUrl(raceWinner.storage_path, 60 * 60)
          return NextResponse.json(
            {
              id: raceWinner.id,
              filename: raceWinner.filename,
              size_bytes: raceWinner.size_bytes,
              width: raceWinner.width,
              height: raceWinner.height,
              mime_type: raceWinner.mime_type,
              url: signedUrl,
              deduplicated: true,
            },
            { headers: responseHeaders },
          )
        }

        return NextResponse.json(
          { error: "No pudimos registrar la imagen en la base de datos." },
          { status: 500, headers: responseHeaders },
        )
      }

      imagePersisted = true

      const { error: usageError } = await supabase.from("usage_logs").insert({
        user_id: user.id,
        organization_id: null,
        action: "image.uploaded",
        metadata: {
          image_id: imageId,
          size_bytes: buffer.byteLength,
          mime_type: verifiedMime,
          ela_score: ela?.tampering_score ?? null,
          had_exif: Object.keys(exif.raw).length > 0,
          had_ocr: Boolean(ocr.text),
          ocr_confidence: ocr.confidence,
        },
      })

      if (usageError) {
        console.error("[image-upload] usage log failed", usageError.code)
      }

      const signedUrl = await createSignedUrl(storagePath, 60 * 60)
      return NextResponse.json({ ...imageRow, url: signedUrl }, { headers: responseHeaders })
    } catch (error) {
      if (!imagePersisted) {
        await cleanupStoragePaths(admin, uploadedPaths)
      }
      throw error
    }
  } catch (error) {
    console.error("[image-upload] failed", error instanceof Error ? error.name : "unknown")
    return NextResponse.json(
      { error: "Error interno al procesar la imagen." },
      { status: 500, headers: PRIVATE_HEADERS },
    )
  }
}
