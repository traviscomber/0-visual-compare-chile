import { z } from "zod"

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/tiff"] as const
export type AllowedImageMime = (typeof ALLOWED_MIME_TYPES)[number]

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB
export const MAX_IMAGE_PIXELS = 64_000_000
export const MAX_IMAGE_DIMENSION = 12_000

export const compareRequestSchema = z.object({
  image_a_id: z.string().uuid(),
  image_b_id: z.string().uuid(),
})

export type CompareRequest = z.infer<typeof compareRequestSchema>

export function validateImageFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!file || file.size === 0) {
    return { ok: false, error: "El archivo está vacío." }
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedImageMime)) {
    return { ok: false, error: "Formato no permitido. Usa JPG, PNG, WEBP o TIFF." }
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: "El archivo supera el tamaño máximo de 50 MB." }
  }
  return { ok: true }
}

export function detectImageMime(buffer: Buffer): AllowedImageMime | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg"
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png"
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp"
  }

  if (
    buffer.length >= 4 &&
    ((buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00) ||
      (buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a))
  ) {
    return "image/tiff"
  }

  return null
}

export function validateDetectedImageMime(
  declaredMime: string,
  detectedMime: AllowedImageMime | null,
): { ok: true; mime: AllowedImageMime } | { ok: false; error: string } {
  if (!detectedMime) {
    return { ok: false, error: "El contenido del archivo no corresponde a una imagen compatible." }
  }

  if (declaredMime !== detectedMime) {
    return { ok: false, error: "El tipo declarado del archivo no coincide con su contenido real." }
  }

  return { ok: true, mime: detectedMime }
}

export function validateImageDimensions(
  width: number | null,
  height: number | null,
): { ok: true } | { ok: false; error: string } {
  if (!width || !height || !Number.isSafeInteger(width) || !Number.isSafeInteger(height)) {
    return { ok: false, error: "No pudimos leer dimensiones válidas de la imagen." }
  }

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    return {
      ok: false,
      error: `La imagen supera la dimensión máxima permitida de ${MAX_IMAGE_DIMENSION}px por lado.`,
    }
  }

  if (width * height > MAX_IMAGE_PIXELS) {
    return { ok: false, error: "La imagen supera el máximo permitido de 64 megapíxeles." }
  }

  return { ok: true }
}

export function sanitizeFilename(filename: string): string {
  const normalized = filename
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/]+/g, "-")
    .trim()

  return (normalized || "imagen").slice(0, 180)
}
