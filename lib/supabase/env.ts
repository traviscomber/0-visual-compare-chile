/**
 * Resolve a Supabase env var by checking the canonical name first, then
 * numbered suffixes (_2 … _6) injected by previous Supabase integrations.
 * Returns empty string (never throws) so callers can handle the missing case.
 */
function resolveEnv(base: string): string {
  // 1. Canonical name (standard integration)
  const direct = process.env[base]
  if (direct?.trim()) return direct.trim()

  // 2. Numbered suffixes (_2 … _8) from multi-instance setups
  for (let i = 2; i <= 8; i++) {
    const v = process.env[`${base}_${i}`]
    if (v?.trim()) return v.trim()
  }

  // 3. Anon key aliases — prefer full JWT keys (eyJ...) over publishable/sb_ keys
  if (base === "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
    // Full JWT anon keys first (most correct for auth)
    for (let i = 2; i <= 8; i++) {
      const v = process.env[`SUPABASE_ANON_KEY_${i}`]
      if (v?.startsWith("eyJ")) return v.trim()
    }
    const anon = process.env["SUPABASE_ANON_KEY"]
    if (anon?.startsWith("eyJ")) return anon.trim()

    // Fallback: publishable keys (sb_publishable_...)
    const pub1 = process.env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]
    if (pub1?.trim()) return pub1.trim()
    for (let i = 2; i <= 8; i++) {
      const v = process.env[`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY_${i}`]
        ?? process.env[`SUPABASE_PUBLISHABLE_KEY_${i}`]
      if (v?.trim()) return v.trim()
    }
    const pub2 = process.env["SUPABASE_PUBLISHABLE_KEY"]
    if (pub2?.trim()) return pub2.trim()
  }

  if (base === "NEXT_PUBLIC_SUPABASE_URL") {
    // SUPABASE_URL (no NEXT_PUBLIC prefix) is sometimes set instead
    const plain = process.env["SUPABASE_URL"]
    if (plain?.trim()) return plain.trim()
    // Numbered SUPABASE_URL_N variants
    for (let i = 2; i <= 8; i++) {
      const v = process.env[`SUPABASE_URL_${i}`]
      if (v?.trim()) return v.trim()
    }
    // Build from POSTGRES_HOST_N if available
    for (let i = 1; i <= 8; i++) {
      const key = i === 1 ? "POSTGRES_HOST" : `POSTGRES_HOST_${i}`
      const host = process.env[key]
      if (host?.trim()) {
        const match = host.match(/^db\.([^.]+)\.supabase\.co$/)
        if (match) return `https://${match[1]}.supabase.co`
      }
    }
  }

  if (base === "SUPABASE_SERVICE_ROLE_KEY") {
    for (let i = 2; i <= 8; i++) {
      const v = process.env[`SUPABASE_SERVICE_ROLE_KEY_${i}`]
      if (v?.trim()) return v.trim()
    }

    const secretKey = process.env["SUPABASE_SECRET_KEY"]
    if (secretKey?.trim()) return secretKey.trim()
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

export function getSupabaseServiceRoleKey(): string {
  const key = resolveEnv("SUPABASE_SERVICE_ROLE_KEY")
  if (!key) {
    throw new Error(
      "Missing Supabase service role key. Add SUPABASE_SERVICE_ROLE_KEY to your environment variables."
    )
  }
  return key
}

export function tryGetSupabaseServiceRoleKey(): string | null {
  return resolveEnv("SUPABASE_SERVICE_ROLE_KEY") || null
}
