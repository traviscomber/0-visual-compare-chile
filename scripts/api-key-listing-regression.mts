import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

const routePath = fileURLToPath(new URL("../app/api/account/api-keys/route.ts", import.meta.url))
const managerPath = fileURLToPath(new URL("../lib/api/key-management.ts", import.meta.url))

const [routeSource, managerSource] = await Promise.all([
  readFile(routePath, "utf8"),
  readFile(managerPath, "utf8"),
])

function fail(message: string): never {
  console.error(`API key listing regression FAIL: ${message}`)
  process.exit(1)
}

if (routeSource.includes("POSTGRES_URL_4")) {
  fail("GET route must not depend on the direct Postgres connection URL")
}

if (routeSource.includes('require("pg")') || routeSource.includes("new Client(")) {
  fail("GET route must not open a direct pg client")
}

if (!routeSource.includes("listApiKeys(user.id)")) {
  fail("GET route must list credentials through the canonical key-management layer")
}

if (!routeSource.includes("status: 503")) {
  fail("database listing failures must be observable instead of returning a silent empty 200 response")
}

for (const field of ["usage_today", "usage_month", "quota_daily", "quota_monthly"]) {
  if (!managerSource.includes(field)) {
    fail(`canonical listApiKeys result is missing ${field}`)
  }
}

console.log("API key listing regression PASS: canonical Supabase-backed listing path enforced.")
