import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { extractExif } from "@/lib/image/exif"
import { calculateSha256 } from "@/lib/image/hash"
import { computeEla } from "@/lib/image/ela"
import { extractMetadata } from "@/lib/image/metadata"
import { extractImageText } from "@/lib/image/ocr"
import { calculatePerceptualHash } from "@/lib/image/phash"
import { BUCKET, createSignedUrl } from "@/lib/storage"
import { createClient } from "@/lib/supabase/server"
import { validateImageFile } from "@/lib/validations"

export const runtime = "nodejs"
export const maxDuration = 60

function extensionFromMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg"
  if (mime === "image/png") return "png"
  if (mime === "image/webp") return "webp"
  if (mime === "image/tiff") return "tiff"
  return "bin"
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

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No se recibio ningun archivo." }, { status: 400 })
    }

    const validation = validateImageFile(file)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
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

      return NextResponse.json({
        id: existing.id,
        filename: existing.filename,
        size_bytes: existing.size_bytes,
        width: existing.width,
        height: existing.height,
        mime_type: existing.mime_type,
        url: signedUrl,
        deduplicated: true,
      })
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

    const imageId = randomUUID()
    const ext = extensionFromMime(file.type)
    const storagePath = `${user.id}/${imageId}/original.${ext}`

    const admin = createAdminClient()
    const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

    if (uploadError) {
      return NextResponse.json({ error: "No pudimos subir la imagen al almacenamiento." }, { status: 500 })
    }

    let elaPath: string | null = null
    if (ela && ela.png.length > 0) {
      const candidate = `${user.id}/${imageId}/ela.png`
      const { error: elaUploadError } = await admin.storage
        .from(BUCKET)
        .upload(candidate, ela.png, { contentType: "image/png", upsert: true })

      if (!elaUploadError) {
        elaPath = candidate
      }
    }

    const { data: imageRow, error: insertError } = await supabase
      .from("images")
      .insert({
        id: imageId,
        user_id: user.id,
        filename: file.name,
        storage_bucket: BUCKET,
        storage_path: storagePath,
        mime_type: file.type,
        size_bytes: file.size,
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

    if (insertError || !imageRow) {
      await admin.storage.from(BUCKET).remove([storagePath])
      if (elaPath) {
        await admin.storage.from(BUCKET).remove([elaPath])
      }

      const { data: raceWinner } = await supabase
        .from("images")
        .select("id, filename, size_bytes, width, height, mime_type, storage_path")
        .eq("user_id", user.id)
        .eq("sha256", sha256)
        .eq("status", "active")
        .maybeSingle()

      if (raceWinner) {
        const signedUrl = await createSignedUrl(raceWinner.storage_path, 60 * 60)

        return NextResponse.json({
          id: raceWinner.id,
          filename: raceWinner.filename,
          size_bytes: raceWinner.size_bytes,
          width: raceWinner.width,
          height: raceWinner.height,
          mime_type: raceWinner.mime_type,
          url: signedUrl,
          deduplicated: true,
        })
      }

      return NextResponse.json({ error: "No pudimos registrar la imagen en la base de datos." }, { status: 500 })
    }

    await supabase.from("usage_logs").insert({
      user_id: user.id,
      organization_id: user.id,
      action: "image.uploaded",
      metadata: {
        image_id: imageId,
        size_bytes: file.size,
        mime_type: file.type,
        ela_score: ela?.tampering_score ?? null,
        had_exif: Object.keys(exif.raw).length > 0,
        had_ocr: Boolean(ocr.text),
        ocr_confidence: ocr.confidence,
      },
    })

    const signedUrl = await createSignedUrl(storagePath, 60 * 60)

    return NextResponse.json({
      id: imageRow.id,
      filename: imageRow.filename,
      size_bytes: imageRow.size_bytes,
      width: imageRow.width,
      height: imageRow.height,
      mime_type: imageRow.mime_type,
      url: signedUrl,
    })
  } catch (error) {
    console.error("[v0] upload error", error)
    return NextResponse.json({ error: "Error interno al procesar la imagen." }, { status: 500 })
  }
}
