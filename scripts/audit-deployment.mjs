const activeUrl = process.env.ACTIVE_DEPLOYMENT_URL
const canonicalUrl = process.env.CANONICAL_DEPLOYMENT_URL
const expectedRevision = process.env.EXPECTED_REVISION
const expectedSupabaseProjectRef = process.env.EXPECTED_SUPABASE_PROJECT_REF
const expectedSiteOrigin = process.env.EXPECTED_SITE_ORIGIN
const expectedCallbackUrl = process.env.EXPECTED_CALLBACK_URL

if (!activeUrl) {
  console.error("Missing ACTIVE_DEPLOYMENT_URL")
  process.exit(1)
}

const checks = []

function record(name, ok, detail) {
  checks.push({ name, ok, detail })
}

function normalizeOrigin(value) {
  if (!value) return null

  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
    return new URL(withProtocol).origin
  } catch {
    return null
  }
}

async function inspectBase(url, label) {
  const response = await fetch(url, { redirect: "manual" })
  const text = await response.text()

  record(
    `${label} root`,
    response.status === 200,
    `status=${response.status} server=${response.headers.get("server") ?? "n/d"}`,
  )

  const health = await fetch(new URL("/api/v1/health", url), { redirect: "manual" })
  const healthText = await health.text()
  let parsedHealth = null
  try {
    parsedHealth = JSON.parse(healthText)
  } catch {
    parsedHealth = null
  }

  const hasHealthPayload =
    health.status === 200 &&
    parsedHealth?.status === "ok" &&
    typeof parsedHealth?.version === "string" &&
    typeof parsedHealth?.revision === "string" &&
    typeof parsedHealth?.timestamp === "string" &&
    typeof parsedHealth?.host === "string" &&
    parsedHealth?.config?.supabase_public_env === true &&
    parsedHealth?.config?.supabase_service_env === true &&
    parsedHealth?.config?.auth_callback_path === "/auth/callback" &&
    typeof parsedHealth?.config?.supabase_url_host === "string" &&
    typeof parsedHealth?.config?.supabase_project_ref === "string" &&
    typeof parsedHealth?.config?.site_origin === "string" &&
    Array.isArray(parsedHealth?.config?.callback_urls) &&
    parsedHealth.config.callback_urls.length > 0

  record(`${label} health`, hasHealthPayload, `status=${health.status}`)

  if (expectedRevision && parsedHealth?.revision) {
    const normalizedExpected = expectedRevision.slice(0, parsedHealth.revision.length)
    const revisionMatches =
      parsedHealth.revision === expectedRevision || parsedHealth.revision === normalizedExpected
    record(
      `${label} revision`,
      revisionMatches,
      `expected=${expectedRevision} actual=${parsedHealth.revision}`,
    )
  }

  if (expectedSupabaseProjectRef && parsedHealth?.config?.supabase_project_ref) {
    record(
      `${label} supabase project`,
      parsedHealth.config.supabase_project_ref === expectedSupabaseProjectRef,
      `expected=${expectedSupabaseProjectRef} actual=${parsedHealth.config.supabase_project_ref}`,
    )
  }

  if (expectedSiteOrigin && parsedHealth?.config?.site_origin) {
    const actualOrigin = normalizeOrigin(parsedHealth.config.site_origin)
    const expectedOrigin = normalizeOrigin(expectedSiteOrigin)
    record(
      `${label} site origin`,
      actualOrigin === expectedOrigin,
      `expected=${expectedOrigin ?? expectedSiteOrigin} actual=${actualOrigin ?? parsedHealth.config.site_origin}`,
    )
  }

  if (expectedCallbackUrl && Array.isArray(parsedHealth?.config?.callback_urls)) {
    const normalizedExpectedCallback = normalizeOrigin(expectedCallbackUrl)
      ? expectedCallbackUrl
      : expectedCallbackUrl
    const callbackMatches = parsedHealth.config.callback_urls.includes(normalizedExpectedCallback)
    record(
      `${label} callback url`,
      callbackMatches,
      `expected=${normalizedExpectedCallback} actual=${parsedHealth.config.callback_urls.join(",")}`,
    )
  }

  return { response, text, health, healthText, parsedHealth }
}

async function main() {
  await inspectBase(activeUrl, "active")

  if (canonicalUrl) {
    await inspectBase(canonicalUrl, "canonical")
  }

  for (const check of checks) {
    console.log(`${check.ok ? "PASS" : "FAIL"} ${check.name} (${check.detail})`)
  }

  const failed = checks.filter((check) => !check.ok)
  if (failed.length > 0) {
    console.error(`Deployment audit failed: ${failed.length} check(s) failed.`)
    process.exit(1)
  }

  console.log("Deployment audit passed.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
