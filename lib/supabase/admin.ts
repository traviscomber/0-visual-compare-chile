import { createClient } from "@supabase/supabase-js"
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env"

/**
 * Server-only Supabase client with the service role key.
 * NEVER import this from a Client Component or expose its key to the browser.
 */
export function createAdminClient() {
  const url = getSupabaseUrl()
  const serviceKey = getSupabaseServiceRoleKey()

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
