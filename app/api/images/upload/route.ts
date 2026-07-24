import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { calculateSha256 } from "@/lib/image/hash"
import { extractMetadata } from "@/lib/image/metadata"
import { BUCKET, createSignedUrl } from "@/lib/storage"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import {
  detectImageMime,
  sanitizeFilename,
  validateDetectedImageMime,
  validateImageDimensions,
  validateImageFile,
} from "@/lib/validations"

export const runtime = "nodejs"
export const maxDuration = 30

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" }

type QuotaResult = {
  allowed: boolean
  retry_after_seconds: number
  remaining_minute: number
  remaining_day: number
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

async function enqueueImage(
  admin: ReturnType<typeof createAdminClient>,
  imageId: string,
  userId: string,
): Promise<boolean> {
  const { error } = await admin.rpc("enqueue_image_processing_job", {
    p_image_id: imageId,
    p_user_id: userId,
    p_priority: 100,
  })

  if (!error) return true

  console.error("[image-upload] enqueue failed", error.code)
  await admin
    .from("images")
    .update({
      processing_status: "failed",
      processing_error: "No se pudo agregar la imagen a la cola de procesamiento.",
    })
    .eq("id", imageId)
    .eq("user_id", userId)

  return false
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
      .select("id, filename, size_bytes, width, height, mime_type, storage_path, processing_status")
      .eq("user_id", user.id)
      .eq("sha256", sha256)
      .eq("status", "active")
      .maybeSingle()

    if (existing) {
      let processingStatus = existing.processing_status
      if (processingStatus === "failed") {
        const requeued = await enqueueImage(admin, existing.id, user.id)
        if (requeued) processingStatus = "queued"
      }

      const signedUrl = await createSignedUrl(existing.storage_path, 60 * 60)
      return NextResponse.json(
        {
          id: existing.id,
          filename: existing.filename,
          size_bytes: existing.size_bytes,
          width: existing.width,
          height: existing.height,
          mime_type: existing.mime_type,
          processing_status: processingStatus,
          url: signedUrl,
          deduplicated: true,
        },
        { headers: responseHeaders },
      )
    }

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
          phash: null,
          processing_status: "queued",
          processing_error: null,
          processed_at: null,
          metadata: {
            format: meta.format,
            aspect_ratio: meta.aspect_ratio,
            avg_color: meta.avg_color,
            brightness: meta.brightness,
            ocr: null,
            exif: null,
            ela: null,
          },
        })
        .select("id, filename, size_bytes, width, height, mime_type, processing_status")
        .single()

      if (insertError || !imageRow) {
        await cleanupStoragePaths(admin, uploadedPaths)
        uploadedPaths.length = 0

        const { data: raceWinner } = await supabase
          .from("images")
          .select("id, filename, size_bytes, width, height, mime_type, storage_path, processing_status")
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
              processing_status: raceWinner.processing_status,
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
      const queued = await enqueueImage(admin, imageId, user.id)

      const { error: usageError } = await supabase.from("usage_logs").insert({
        user_id: user.id,
        organization_id: null,
        action: "image.uploaded",
        metadata: {
          image_id: imageId,
          size_bytes: buffer.byteLength,
          mime_type: verifiedMime,
          processing_status: queued ? "queued" : "failed",
        },
      })

      if (usageError) {
        console.error("[image-upload] usage log failed", usageError.code)
      }

      const signedUrl = await createSignedUrl(storagePath, 60 * 60)
      if (!queued) {
        return NextResponse.json(
          {
            ...imageRow,
            processing_status: "failed",
            processing_error: "La imagen fue subida, pero no pudo entrar a la cola de procesamiento.",
            url: signedUrl,
          },
          { status: 202, headers: responseHeaders },
        )
      }

      return NextResponse.json(
        { ...imageRow, processing_status: "queued", url: signedUrl },
        { status: 202, headers: responseHeaders },
      )
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
