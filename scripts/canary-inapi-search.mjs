#!/usr/bin/env node

const baseUrl = (process.env.INAPI_CANARY_BASE_URL || "http://localhost:3000").replace(/\/$/, "")
const cookie = process.env.INAPI_CANARY_COOKIE || ""
const adminCookie = process.env.INAPI_ADMIN_CANARY_COOKIE || ""

const checks = []

async function request(path, options = {}, authCookie = cookie) {
  const headers = { Accept: "application/json", ...(options.headers || {}) }
  if (authCookie) headers.Cookie = authCookie
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers, redirect: "manual" })
  const payload = await response.json().catch(() => ({}))
  return { response, payload }
}

function assert(name, condition, detail) {
  checks.push({ name, ok: Boolean(condition), detail })
  if (!condition) throw new Error(`${name}: ${detail}`)
}

async function runPublicBoundaryChecks() {
  const { response } = await request("/api/inapi/search?q=FALABELLA&type=nombre&match=1", {}, "")
  assert("unauthenticated search returns 401", response.status === 401, `received ${response.status}`)

  const adminResponse = await request("/api/admin/inapi-operations", {}, cookie)
  if (cookie && !adminCookie) {
    assert("non-admin operations access returns 403", adminResponse.response.status === 403, `received ${adminResponse.response.status}`)
  }
}

async function runAuthenticatedChecks() {
  if (!cookie) {
    console.log("Authenticated canaries skipped: set INAPI_CANARY_COOKIE with a dedicated test-user session.")
    return
  }

  const cases = [
    { name: "exact FALABELLA", path: "/api/inapi/search?q=FALABELLA&type=nombre&match=1", verify: (payload) => Array.isArray(payload.results) && payload.total >= 1 },
    { name: "registration 1236222", path: "/api/inapi/search?q=1236222&type=registro&match=2", verify: (payload) => Array.isArray(payload.results) && payload.results.some((item) => String(item.numeroRegistro) === "1236222") },
    { name: "application 1220733", path: "/api/inapi/search?q=1220733&type=solicitud&match=2", verify: (payload) => Array.isArray(payload.results) && payload.results.length >= 1 },
  ]

  for (const testCase of cases) {
    const { response, payload } = await request(testCase.path)
    assert(`${testCase.name} returns 200`, response.status === 200, `received ${response.status}: ${JSON.stringify(payload)}`)
    assert(`${testCase.name} returns expected evidence`, testCase.verify(payload), JSON.stringify(payload))
  }

  const invalid = await request("/api/inapi/search?q=ABC&type=registro&match=2")
  assert("invalid numeric registration returns 400", invalid.response.status === 400, `received ${invalid.response.status}`)
  assert("invalid numeric registration has stable code", invalid.payload.code === "NUMERIC_QUERY_REQUIRED", JSON.stringify(invalid.payload))

  const history = await request("/api/inapi/history?limit=5")
  assert("private history returns 200", history.response.status === 200, `received ${history.response.status}`)
  assert("private history contains canary searches", Array.isArray(history.payload.results) && history.payload.results.length >= 3, JSON.stringify(history.payload))
}

async function runAdminChecks() {
  if (!adminCookie) return
  const operations = await request("/api/admin/inapi-operations", {}, adminCookie)
  assert("admin operations returns 200", operations.response.status === 200, `received ${operations.response.status}`)
  assert("admin operations includes direct-search metrics", typeof operations.payload.directSearch === "object", JSON.stringify(operations.payload))
}

try {
  await runPublicBoundaryChecks()
  await runAuthenticatedChecks()
  await runAdminChecks()
  console.table(checks)
  console.log(`INAPI canary suite completed: ${checks.filter((item) => item.ok).length}/${checks.length} passed.`)
} catch (error) {
  console.table(checks)
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
