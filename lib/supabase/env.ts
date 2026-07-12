/**
 * Resolve a Supabase env var by checking the canonical name first, then
 * numbered suffixes (_2 … _6) injected by previous Supabase integrations.
 * Returns empty string (never throws) so callers can handle the missing case.
 */
function resolveEnv(base: string): string {
  // 1. Canonical name (standard integration)
  const direct = process.env[base]
  if (direct?.trim()) return direct.trim()

  // 2. Numbered suffixes (_2 … _6) from multi-instance setups
  for (let i = 2; i <= 6; i++) {
    const v = process.env[`${base}_${i}`]
    if (v?.trim()) return v.trim()
  }

  // 3. Anon key aliases — Supabase integration uses different names depending on version
  if (base === "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
    // New Supabase integration style (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
    const pub1 = process.env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]
    if (pub1?.trim()) return pub1.trim()
    for (let i = 2; i <= 6; i++) {
      const v = process.env[`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY_${i}`]
      if (v?.trim()) return v.trim()
    }
    // Older style without NEXT_PUBLIC prefix
    for (let i = 2; i <= 6; i++) {
      const v = process.env[`SUPABASE_PUBLISHABLE_KEY_${i}`]
      if (v?.trim()) return v.trim()
    }
    const pub2 = process.env["SUPABASE_PUBLISHABLE_KEY"]
    if (pub2?.trim()) return pub2.trim()
    const anon = process.env["SUPABASE_ANON_KEY"]
    if (anon?.trim()) return anon.trim()
  }

  if (base === "NEXT_PUBLIC_SUPABASE_URL") {
    // SUPABASE_URL (no NEXT_PUBLIC prefix) is sometimes set instead
    const plain = process.env["SUPABASE_URL"]
    if (plain?.trim()) return plain.trim()
    // Build from POSTGRES_HOST if available
    const host = process.env["POSTGRES_HOST"] || process.env["POSTGRES_HOST_2"]
    if (host?.trim()) {
      // POSTGRES_HOST is db.xxxx.supabase.co → project ref is the subdomain
      const match = host.match(/^db\.([^.]+)\.supabase\.co$/)
      if (match) return `https://${match[1]}.supabase.co`
    }
  }

  return ""
}

export function getSupabaseUrl(): string {
  const url = resolveEnv("NEXT_PUBLIC_SUPABASE_URL")
  if (!url) {
    throw new Error(
      "Missing Supabase URL. Add NEXT_PUBLIC_SUPABASE_URL to your environment variables."
    )
  }
  return url
}

export function getSupabaseAnonKey(): string {
  const key = resolveEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  if (!key) {
    throw new Error(
      "Missing Supabase anon key. Add NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables."
    )
  }
  return key
}

/**
 * Safe versions — return null instead of throwing, useful for optional Supabase calls.
 */
export function tryGetSupabaseUrl(): string | null {
  return resolveEnv("NEXT_PUBLIC_SUPABASE_URL") || null
}

export function tryGetSupabaseAnonKey(): string | null {
  return resolveEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") || null
}
