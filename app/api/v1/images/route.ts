import { createHash, randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { authenticateApiKey, getQuotaHeaders, logApiKeyUsage } from "@/lib/api/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { computeEla } from "@/lib/image/ela"
import { extractExif } from "@/lib/image/exif"
import { extractMetadata } from "@/lib/image/metadata"
import { extractImageText } from "@/lib/image/ocr"
import { calculatePerceptualHash } from "@/lib/image/phash"
import { BUCKET, createSignedUrl } from "@/lib/storage"
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/validations"

export const runtime = "nodejs"
export const maxDuration = 60

interface UploadResponse {
  id: string
  filename: string
  size_bytes: number
  width: number
  height: number
  mime_type: string
  sha256: string
  phash: string | null
  storage_path: string
  signed_url: string | null
  created_at: string
  deduplicated?: boolean
}

function sanitizeFilename(filename: string): string {
  const baseName = filename
    .trim()
    .replace(/[\/\\?%*:|"<>[\]#\x00-\x1F]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "")

  return baseName || `image-${Date.now()}`
}

function extensionFromMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg"
  if (mime === "image/png") return "png"
  if (mime === "image/webp") return "webp"
  if (mime === "image/tiff") return "tiff"
  return "bin"
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
      return NextResponse.json(
        { error: auth.message, reason: auth.reason },
        {
          status: auth.reason === "quota_exceeded" ? 429 : 401,
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

    const formData = await request.formData()
    const fileEntry = formData.get("image")
    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const file = fileEntry
    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 413 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const admin = createAdminClient()
    const sha256 = createHash("sha256").update(buffer).digest("hex")

    const { data: existing } = await admin
      .from("images")
      .select("id, filename, size_bytes, width, height, mime_type, sha256, phash, storage_path, created_at")
      .eq("organization_id", context.organization_id)
      .eq("sha256", sha256)
      .eq("status", "active")
      .maybeSingle()

    if (existing) {
      await logApiKeyUsage({
        user_id: context.user_id,
        organization_id: context.organization_id,
        api_key_id: context.api_key_id,
        action: "image.uploaded",
        metadata: {
          image_id: existing.id,
          filename: existing.filename,
          deduplicated: true,
        },
      })

      const signedUrl = await createSignedUrl(existing.storage_path, 60 * 60)
      const response: UploadResponse = {
        id: existing.id,
        filename: existing.filename,
        size_bytes: existing.size_bytes,
        width: existing.width,
        height: existing.height,
        mime_type: existing.mime_type,
        sha256: existing.sha256,
        phash: existing.phash,
        storage_path: existing.storage_path,
        signed_url: signedUrl,
        created_at: existing.created_at,
        deduplicated: true,
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
            increment: 1,
          }),
        },
      )
    }

    const [phash, meta, exif, ela, ocr] = await Promise.all([
      calculatePerceptualHash(buffer).catch((error) => {
        console.error("[v0] phash failed", error)
        return null
      }),
      extractMetadata(buffer),
      extractExif(buffer),
      computeEla(buffer).catch((error) => {
        console.error("[v0] ela failed", error)
        return null
      }),
      extractImageText(buffer),
    ])

    if (!meta.width || !meta.height) {
      return NextResponse.json({ error: "Invalid image" }, { status: 400 })
    }

    const filename = sanitizeFilename(file.name || "")
    const imageId = randomUUID()
    const ext = extensionFromMime(file.type)
    const storagePath = `${context.organization_id}/${imageId}/original.${ext}`

    const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

    if (uploadError) {
      console.error("[v0] storage upload error", uploadError)
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
    }

    let elaPath: string | null = null
    if (ela && ela.png.length > 0) {
      const candidate = `${context.organization_id}/${imageId}/ela.png`
      const { error: elaUploadError } = await admin.storage
        .from(BUCKET)
        .upload(candidate, ela.png, { contentType: "image/png", upsert: true })

      if (!elaUploadError) {
        elaPath = candidate
      }
    }

    const { data: image, error: dbError } = await admin
      .from("images")
      .insert({
        id: imageId,
        user_id: context.user_id,
        organization_id: context.organization_id,
        filename,
        storage_path: storagePath,
        storage_bucket: BUCKET,
        mime_type: file.type,
        size_bytes: file.size,
        width: meta.width,
        height: meta.height,
        sha256,
        phash,
        status: "active",
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
            gps: exif.gps,
            exposure: exif.exposure,
            was_edited: exif.was_edited,
            raw: exif.raw,
          },
          ela: ela ? { score: ela.tampering_score, storage_path: elaPath } : null,
        },
      })
      .select()
      .single()

    if (dbError || !image) {
      console.error("[v0] database insert error", dbError)
      await admin.storage.from(BUCKET).remove([storagePath])
      if (elaPath) {
        await admin.storage.from(BUCKET).remove([elaPath])
      }

      const { data: raceWinner } = await admin
        .from("images")
        .select("id, filename, size_bytes, width, height, mime_type, sha256, phash, storage_path, created_at")
        .eq("organization_id", context.organization_id)
        .eq("sha256", sha256)
        .eq("status", "active")
        .maybeSingle()

      if (raceWinner) {
        const signedUrl = await createSignedUrl(raceWinner.storage_path, 60 * 60)
        const response: UploadResponse = {
          id: raceWinner.id,
          filename: raceWinner.filename,
          size_bytes: raceWinner.size_bytes,
          width: raceWinner.width,
          height: raceWinner.height,
          mime_type: raceWinner.mime_type,
          sha256: raceWinner.sha256,
          phash: raceWinner.phash,
          storage_path: raceWinner.storage_path,
          signed_url: signedUrl,
          created_at: raceWinner.created_at,
          deduplicated: true,
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
              increment: 1,
            }),
          },
        )
      }

      return NextResponse.json({ error: "Failed to save image metadata" }, { status: 500 })
    }

    await logApiKeyUsage({
      user_id: context.user_id,
      organization_id: context.organization_id,
      api_key_id: context.api_key_id,
      action: "image.uploaded",
      metadata: {
        image_id: image.id,
        filename,
        size_bytes: file.size,
        mime_type: file.type,
        ela_score: ela?.tampering_score ?? null,
        had_exif: Object.keys(exif.raw).length > 0,
        had_ocr: Boolean(ocr.text),
        ocr_confidence: ocr.confidence,
      },
    })

    const signedUrl = await createSignedUrl(image.storage_path, 60 * 60)
    const response: UploadResponse = {
      id: image.id,
      filename: image.filename,
      size_bytes: image.size_bytes,
      width: image.width,
      height: image.height,
      mime_type: image.mime_type,
      sha256: image.sha256,
      phash: image.phash,
      storage_path: image.storage_path,
      signed_url: signedUrl,
      created_at: image.created_at,
    }

    return NextResponse.json(
      { success: true, data: response },
      {
        status: 201,
        headers: getQuotaHeaders({
          quota_daily: context.quota_daily,
          quota_monthly: context.quota_monthly,
          usage_today: context.usage_today,
          usage_month: context.usage_month,
          increment: 1,
        }),
      },
    )
  } catch (error) {
    console.error("[v0] upload error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
