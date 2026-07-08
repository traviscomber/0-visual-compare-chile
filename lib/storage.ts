import type { SupabaseClient } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"

export const BUCKET = "comparison-images"

export async function createSignedUrl(
  storagePath: string,
  expiresInSec = 60 * 10,
): Promise<string | null> {
  const admin = createAdminClient()
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(storagePath, expiresInSec)
  if (error || !data?.signedUrl) {
    return null
  }
  return data.signedUrl
}

export async function createSignedImageUrl(
  client: SupabaseClient,
  storagePath: string,
  expiresInSec = 60 * 10,
): Promise<string | null> {
  const { data, error } = await client.storage.from(BUCKET).createSignedUrl(storagePath, expiresInSec)
  if (error || !data?.signedUrl) {
    return null
  }
  return data.signedUrl
}
