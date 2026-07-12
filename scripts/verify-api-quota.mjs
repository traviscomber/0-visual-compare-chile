const args = parseArgs(process.argv.slice(2))

const baseUrl = (args.baseUrl ?? process.env.QUOTA_VERIFY_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "")
const apiKey = args.apiKey ?? process.env.QUOTA_VERIFY_API_KEY
const path = args.path ?? "/api/v1/usage"
const expected429On = Number.isFinite(Number(args.expected429On)) ? Math.max(1, Number(args.expected429On)) : 3
const attempts = Number.isFinite(Number(args.attempts)) ? Math.max(expected429On, Number(args.attempts)) : expected429On

if (args.help === "true") {
  printUsage()
  process.exit(0)
}

if (!apiKey) {
  printUsage()
  console.error("Missing API key. Use --apiKey or QUOTA_VERIFY_API_KEY.")
  process.exit(1)
}

const target = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`

console.log(`[quota] target=${target}`)
console.log(`[quota] attempts=${attempts} expected429On=${expected429On}`)

let saw429 = false

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  const response = await fetch(target, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  })

  const bodyText = await response.text()
  const payload = tryParseJson(bodyText)
  const headers = extractQuotaHeaders(response.headers)

  console.log(
    JSON.stringify(
      {
        attempt,
        status: response.status,
        quotaHeaders: headers,
        body: payload ?? bodyText,
      },
      null,
      2,
    ),
  )

  if (attempt < expected429On && response.status >= 400) {
    console.error(`[quota] attempt ${attempt} failed too early with status ${response.status}`)
    process.exit(1)
  }

  if (attempt === expected429On) {
    if (response.status !== 429) {
      console.error(`[quota] expected status 429 on attempt ${attempt}, received ${response.status}`)
      process.exit(1)
    }

    if (!headers["x-ratelimit-limit-daily"] || !headers["x-ratelimit-remaining-daily"]) {
      console.error("[quota] 429 response is missing expected X-RateLimit-* headers")
      process.exit(1)
    }

    saw429 = true
  }
}

if (!saw429) {
  console.error("[quota] verification did not observe a 429 response")
  process.exit(1)
}

console.log("[quota] verification passed")

function parseArgs(argv) {
  const result = {}
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]
    if (!current.startsWith("--")) continue
    const key = current.slice(2)
    const next = argv[index + 1]
    result[key] = next && !next.startsWith("--") ? next : "true"
    if (next && !next.startsWith("--")) {
      index += 1
    }
  }
  return result
}

function tryParseJson(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function extractQuotaHeaders(headers) {
  return {
    "x-ratelimit-limit-daily": headers.get("x-ratelimit-limit-daily"),
    "x-ratelimit-remaining-daily": headers.get("x-ratelimit-remaining-daily"),
    "x-ratelimit-limit-monthly": headers.get("x-ratelimit-limit-monthly"),
    "x-ratelimit-remaining-monthly": headers.get("x-ratelimit-remaining-monthly"),
  }
}

function printUsage() {
  console.log("Usage: node scripts/verify-api-quota.mjs --apiKey sc_xxx [--baseUrl https://v0-visual-compare-chile.vercel.app] [--path /api/v1/usage] [--expected429On 3] [--attempts 3]")
  console.log("Env fallback: QUOTA_VERIFY_API_KEY, QUOTA_VERIFY_BASE_URL")
}
