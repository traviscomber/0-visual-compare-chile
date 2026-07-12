import { createBrowserClient } from "@supabase/ssr"
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env"

export function createClient() {
  try {
    const url = getSupabaseUrl()
    const key = getSupabaseAnonKey()
    return createBrowserClient(url, key)
  } catch (error) {
    // Return null if env vars are missing - app will work in limited capacity
    console.warn("[v0] Supabase env vars not configured, auth features disabled")
    return null
  }
}
