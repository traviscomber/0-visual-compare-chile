type RuntimeConfigSummary = {
  supabase_public_env: boolean
  supabase_service_env: boolean
  supabase_url_host: string | null
  supabase_project_ref: string | null
  auth_callback_path: string
  site_origin: string
  callback_urls: string[]
}

const AUTH_CALLBACK_PATH = "/auth/callback"

function normalizeOrigin(value: string | null | undefined): string | null {
  if (!value) return null

  const trimmed = value.trim()
  if (!trimmed) return null

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    return new URL(withProtocol).origin
  } catch {
    return null
  }
}

function parseSupabaseHost(url: string | null | undefined): string | null {
  if (!url) return null

  try {
    return new URL(url).host
  } catch {
    return null
  }
}

function parseSupabaseProjectRef(host: string | null): string | null {
  if (!host) return null

  const match = host.match(/^([a-z0-9-]+)\.supabase\.co$/i)
  return match?.[1] ?? null
}

function dedupe(values: Array<string | null>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

function resolveConfiguredOrigin(requestHost: string) {
  const siteEnvOrigin =
    normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeOrigin(process.env.SITE_URL) ??
    normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL)

  const requestOrigin = normalizeOrigin(requestHost) ?? `https://${requestHost}`

  return siteEnvOrigin ?? requestOrigin
}

export function buildRuntimeConfigSummary(requestHost: string): RuntimeConfigSummary {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseUrlHost = parseSupabaseHost(supabaseUrl)
  const siteOrigin = resolveConfiguredOrigin(requestHost)
  const callbackUrls = dedupe([
    `${siteOrigin}${AUTH_CALLBACK_PATH}`,
    normalizeOrigin(process.env.VERCEL_URL)
      ? `${normalizeOrigin(process.env.VERCEL_URL)}${AUTH_CALLBACK_PATH}`
      : null,
  ])

  return {
    supabase_public_env: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabase_service_env: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    supabase_url_host: supabaseUrlHost,
    supabase_project_ref: parseSupabaseProjectRef(supabaseUrlHost),
    auth_callback_path: AUTH_CALLBACK_PATH,
    site_origin: siteOrigin,
    callback_urls: callbackUrls,
  }
}
