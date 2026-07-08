import { z } from "zod"

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/tiff"] as const
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB

export const compareRequestSchema = z.object({
  image_a_id: z.string().uuid(),
  image_b_id: z.string().uuid(),
})

export type CompareRequest = z.infer<typeof compareRequestSchema>

export function validateImageFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!file || file.size === 0) {
    return { ok: false, error: "El archivo está vacío." }
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return { ok: false, error: "Formato no permitido. Usa JPG, PNG, WEBP o TIFF." }
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: "El archivo supera el tamaño máximo de 50 MB." }
  }
  return { ok: true }
}
