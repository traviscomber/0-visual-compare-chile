import { createBrowserClient } from "@supabase/ssr"
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env"

export function createClient() {
  try {
    const url = getSupabaseUrl()
    const key = getSupabaseAnonKey()
    return createBrowserClient(url, key)
  } catch {
    return null
  }
}
