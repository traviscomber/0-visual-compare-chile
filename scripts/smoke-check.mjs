const baseUrl = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000"

const checks = []

async function fetchText(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    ...options,
  })
  const text = await response.text()
  return { response, text }
}

function isVercelSsoRedirect(response) {
  const location = response.headers.get("location") || ""
  return response.status === 302 && location.includes("vercel.com/sso-api")
}

function isLoginRedirect(location, path) {
  if (!location.startsWith("/auth/login")) {
    return false
  }

  const url = new URL(`http://localhost${location}`)
  const redirectTo = url.searchParams.get("redirectTo")
  return redirectTo === path || redirectTo === encodeURIComponent(path)
}

function record(name, ok, detail = "") {
  checks.push({ name, ok, detail })
}

async function main() {
  const publicPages = [
    { path: "/", contains: ["Visual Compare Chile", "Flujo MVP"] },
    { path: "/auth/login", contains: ["Visual Compare Chile", "Iniciar"] },
    { path: "/demo", contains: ["MVP"] },
    { path: "/roadmap", contains: ["Roadmap", "MVP"] },
  ]

  for (const page of publicPages) {
    const { response, text } = await fetchText(page.path)
    const protectedBySso = isVercelSsoRedirect(response)
    const ok = response.status === 200 && page.contains.every((needle) => text.includes(needle))
    record(
      `GET ${page.path}`,
      ok,
      protectedBySso ? "protected by Vercel SSO" : `status=${response.status}`,
    )
  }

  const redirects = [
    ["/auth/signup", "/auth/sign-up"],
    ["/compare", "/auth/login"],
    ["/dashboard", "/auth/login"],
    ["/history", "/auth/login"],
    ["/settings", "/auth/login"],
    ["/reportes", "/auth/login"],
    ["/admin", "/auth/login"],
  ]

  for (const [path, location] of redirects) {
    const { response } = await fetchText(path)
    const protectedBySso = isVercelSsoRedirect(response)
    const responseLocation = response.headers.get("location") || ""
    const ok =
      response.status === 307 &&
      (responseLocation === location || isLoginRedirect(responseLocation, path))
    record(
      `REDIRECT ${path}`,
      ok,
      protectedBySso
        ? "protected by Vercel SSO"
        : `status=${response.status} location=${responseLocation}`,
    )
  }

  const protectedApis = [
    { path: "/api/comparisons", method: "GET", expectedStatus: 401 },
    { path: "/api/compare", method: "POST", expectedStatus: 401, body: JSON.stringify({ image_a_id: "a", image_b_id: "b" }) },
    { path: "/api/images/upload", method: "POST", expectedStatus: 401, body: new FormData() },
  ]

  for (const api of protectedApis) {
    const { response } = await fetchText(api.path, {
      method: api.method,
      headers: api.body instanceof FormData ? undefined : { "content-type": "application/json" },
      body: api.body instanceof FormData ? api.body : api.body,
    })
    const protectedBySso = isVercelSsoRedirect(response)
    const ok = response.status === api.expectedStatus
    record(
      `${api.method} ${api.path}`,
      ok,
      protectedBySso ? "protected by Vercel SSO" : `status=${response.status}`,
    )
  }

  const failed = checks.filter((check) => !check.ok)
  for (const check of checks) {
    console.log(`${check.ok ? "PASS" : "FAIL"} ${check.name}${check.detail ? ` (${check.detail})` : ""}`)
  }

  if (failed.length > 0) {
    console.error(`Smoke check failed: ${failed.length} check(s) failed.`)
    process.exit(1)
  }

  console.log(`Smoke check passed for ${baseUrl}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
