import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { authenticateApiKey } from "@/lib/api/auth"
import { BUCKET } from "@/lib/storage"
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/validations"
import { calculatePerceptualHash } from "@/lib/image/phash"
import { createHash, randomUUID } from "node:crypto"
import sharp from "sharp"

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
  phash: string
  storage_path: string
  created_at: string
}

function sanitizeFilename(filename: string): string {
  const baseName = filename
    .trim()
    .replace(/[\/\\?%*:|"<>[\]#\x00-\x1F]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "")

  return baseName || `image-${Date.now()}`
}

export async function POST(request: Request) {
  try {
    // Extract API key from Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 })
    }

    const apiKey = authHeader.slice(7)
    const context = await authenticateApiKey(apiKey)
    if (!context) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const fileEntry = formData.get("image")
    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }
    const file = fileEntry

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 })
    }

    // Validate file size (max 50MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 413 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const admin = createAdminClient()

    // Calculate SHA-256
    const sha256 = createHash("sha256").update(buffer).digest("hex")

    // Extract image metadata using sharp
    const metadata = await sharp(buffer).metadata()
    if (!metadata.width || !metadata.height) {
      return NextResponse.json({ error: "Invalid image" }, { status: 400 })
    }

    // Calculate perceptual hash used by the compare engine.
    const phash = await calculatePerceptualHash(buffer)

    // Upload to Supabase storage
    const filename = sanitizeFilename(file.name || "")
    const storagePath = `${context.organization_id}/${randomUUID()}-${filename}`

    const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: file.type,
    })

    if (uploadError) {
      console.error("[v0] Storage upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
    }

    // Save image metadata to database
    const { data: image, error: dbError } = await admin
      .from("images")
      .insert({
        user_id: context.user_id,
        organization_id: context.organization_id,
        filename,
        storage_path: storagePath,
        storage_bucket: BUCKET,
        mime_type: file.type,
        size_bytes: file.size,
        width: metadata.width,
        height: metadata.height,
        sha256,
        phash,
        status: "active",
        metadata: {
          format: metadata.format,
          hasAlpha: metadata.hasAlpha,
          colorspace: metadata.space,
        },
      })
      .select()
      .single()

    if (dbError || !image) {
      console.error("[v0] Database insert error:", dbError)
      // Cleanup storage
      await admin.storage.from(BUCKET).remove([storagePath])
      return NextResponse.json({ error: "Failed to save image metadata" }, { status: 500 })
    }

    // Log usage
    await admin.from("usage_logs").insert({
      user_id: context.user_id,
      organization_id: context.organization_id,
      action: "image.uploaded",
      metadata: {
        image_id: image.id,
        filename,
        size_bytes: file.size,
      },
    })

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
      created_at: image.created_at,
    }

    return NextResponse.json({ success: true, data: response }, { status: 201 })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

