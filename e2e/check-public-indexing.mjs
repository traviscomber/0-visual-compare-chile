import { readFile } from "node:fs/promises"

const BASE_URL = (process.env.E2E_BASE_URL ?? "https://videntia.app").replace(/\/$/, "")
const BASE_ORIGIN = new URL(BASE_URL).origin
const REQUEST_HEADERS = { "user-agent": "VIDENTIA Browserin QA" }

function fail(message) {
  throw new Error(`[Browserin indexing guard] ${message}`)
}

function normalizeRoutes(routes) {
  return [...new Set(routes)].sort()
}

async function fetchResponse(url) {
  return fetch(url, {
    headers: REQUEST_HEADERS,
    redirect: "follow",
  })
}

async function fetchText(path, expectedContentType) {
  const response = await fetchResponse(`${BASE_URL}${path}`)

  if (!response.ok) fail(`${path} returned HTTP ${response.status}`)

  const contentType = response.headers.get("content-type") ?? ""
  if (expectedContentType && !contentType.includes(expectedContentType)) {
    fail(`${path} returned unexpected content-type ${contentType || "<missing>"}`)
  }

  return response.text()
}

function extractInternalLinks(html, sourceRoute) {
  const links = []
  const anchorPattern = /<a\b[^>]*\bhref=(?:"([^"]+)"|'([^']+)')[^>]*>/gi

  for (const match of html.matchAll(anchorPattern)) {
    const href = (match[1] ?? match[2] ?? "").trim()
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue

    let url
    try {
      url = new URL(href, `${BASE_URL}${sourceRoute}`)
    } catch {
      fail(`${sourceRoute} contains an invalid href: ${href}`)
    }

    if (url.origin !== BASE_ORIGIN) continue
    url.hash = ""
    links.push(`${url.pathname}${url.search}` || "/")
  }

  return links
}

const browserSpec = await readFile(new URL("./cloud-browser.spec.mjs", import.meta.url), "utf8")
const publicRoutesMatch = browserSpec.match(/const publicRoutes = \[([^\]]+)\]/)
if (!publicRoutesMatch) fail("Could not locate publicRoutes in cloud-browser.spec.mjs")

const auditedRoutes = [...publicRoutesMatch[1].matchAll(/["']([^"']+)["']/g)].map((match) => match[1])
if (auditedRoutes.length === 0) fail("publicRoutes is empty")

const sitemapXml = await fetchText("/sitemap.xml", "application/xml")
const sitemapLocations = [...sitemapXml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((match) => match[1])
if (sitemapLocations.length === 0) fail("sitemap.xml contains no <loc> entries")

const sitemapRoutes = sitemapLocations.map((location) => {
  const url = new URL(location)
  if (url.origin !== BASE_ORIGIN) fail(`sitemap.xml contains foreign origin ${url.origin}`)
  return url.pathname || "/"
})

const normalizedAudit = normalizeRoutes(auditedRoutes)
const normalizedSitemap = normalizeRoutes(sitemapRoutes)
if (JSON.stringify(normalizedAudit) !== JSON.stringify(normalizedSitemap)) {
  fail(`Audited routes ${JSON.stringify(normalizedAudit)} do not match sitemap routes ${JSON.stringify(normalizedSitemap)}`)
}

const robots = await fetchText("/robots.txt", "text/plain")
if (!/^Disallow:\s*\/api\/\s*$/im.test(robots)) fail("robots.txt must disallow /api/")

const expectedSitemapUrl = `${BASE_URL}/sitemap.xml`
const sitemapDirective = robots.match(/^Sitemap:\s*(\S+)\s*$/im)?.[1]
if (sitemapDirective !== expectedSitemapUrl) {
  fail(`robots.txt Sitemap directive is ${sitemapDirective ?? "<missing>"}; expected ${expectedSitemapUrl}`)
}

const discoveredInternalLinks = new Set()
for (const route of normalizedAudit) {
  const html = await fetchText(route, "text/html")
  for (const link of extractInternalLinks(html, route)) discoveredInternalLinks.add(link)
}

const internalLinks = normalizeRoutes(discoveredInternalLinks)
for (const link of internalLinks) {
  const response = await fetchResponse(`${BASE_URL}${link}`)
  if (!response.ok) fail(`Internal link ${link} returned HTTP ${response.status}`)
  if (new URL(response.url).origin !== BASE_ORIGIN) {
    fail(`Internal link ${link} redirected outside ${BASE_ORIGIN} to ${response.url}`)
  }
}

console.log(`Browserin indexing guard PASS: ${normalizedSitemap.length} sitemap routes match publicRoutes; robots.txt protects /api/ and points to sitemap.xml; ${internalLinks.length} internal public links resolve without HTTP errors.`)
