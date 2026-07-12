import { createBrowserClient } from "@supabase/ssr"
import { tryGetSupabaseUrl, tryGetSupabaseAnonKey } from "@/lib/supabase/env"

// Module-level cache so we only fetch once per page load
let _cachedUrl: string | null = null
let _cachedKey: string | null = null
let _fetchPromise: Promise<void> | null = null

async function loadConfig(): Promise<void> {
  if (_fetchPromise) return _fetchPromise
  _fetchPromise = (async () => {
    try {
      const res = await fetch("/api/config", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        if (data.url) _cachedUrl = data.url
        if (data.anonKey) _cachedKey = data.anonKey
      }
    } catch {
      // network error — leave null
    }
  })()
  return _fetchPromise
}

/**
 * Returns a Supabase browser client, or null if the env vars are not available.
 * Callers must null-check before use.
 */
export function createClient() {
  // Try process.env first (works when NEXT_PUBLIC_* vars are in the bundle)
  const url = tryGetSupabaseUrl() ?? _cachedUrl
  const key = tryGetSupabaseAnonKey() ?? _cachedKey
  if (!url || !key) return null
  return createBrowserClient(url, key)
}

/**
 * Async version — fetches config from /api/config if vars not in bundle.
 * Use in useEffect / async contexts.
 */
export async function createClientAsync() {
  const url = tryGetSupabaseUrl() ?? _cachedUrl
  const key = tryGetSupabaseAnonKey() ?? _cachedKey
  if (!url || !key) {
    await loadConfig()
  }
  const resolvedUrl = tryGetSupabaseUrl() ?? _cachedUrl
  const resolvedKey = tryGetSupabaseAnonKey() ?? _cachedKey
  if (!resolvedUrl || !resolvedKey) return null
  return createBrowserClient(resolvedUrl, resolvedKey)
}
