import { lookup } from "node:dns/promises"
import { isIP } from "node:net"

export type CompanyWebsitePage = {
  url: string
  title: string | null
  text: string
}

export type CompanyWebsiteProfile = {
  canonicalUrl: string
  hostname: string
  pages: CompanyWebsitePage[]
  combinedText: string
}

const MAX_RESPONSE_BYTES = 1_500_000
const MAX_PAGE_TEXT = 9_000
const MAX_PAGES = 5
const LINK_KEYWORDS = [
  "solution", "solutions", "solucion", "soluciones", "product", "products", "producto", "productos",
  "project", "projects", "proyecto", "proyectos", "service", "services", "servicio", "servicios",
  "platform", "platforms", "plataforma", "plataformas", "technology", "technologies", "tecnologia", "tecnologias",
  "expertise", "capabilities", "capability", "about", "nosotros", "intelligence", "inteligencia",
]

export async function readPublicCompanyWebsite(inputUrl: string): Promise<CompanyWebsiteProfile> {
  const start = normalizePublicUrl(inputUrl)
  const first = await fetchHtmlValidated(start)
  const canonicalHost = new URL(first.url).hostname
  const pages: CompanyWebsitePage[] = [toPage(first.url, first.html)]

  const candidates = extractSameOriginLinks(first.html, first.url)
    .map((url) => ({ url, score: linkScore(url) }))
    .sort((a, b) => b.score - a.score || a.url.localeCompare(b.url))

  for (const candidate of candidates) {
    if (pages.length >= MAX_PAGES) break
    if (candidate.score <= 0) break
    if (pages.some((page) => page.url === candidate.url)) continue
    try {
      const fetched = await fetchHtmlValidated(new URL(candidate.url))
      if (new URL(fetched.url).hostname !== canonicalHost) continue
      pages.push(toPage(fetched.url, fetched.html))
    } catch {
      // A secondary page is optional. The root page remains authoritative input.
    }
  }

  const combinedText = pages
    .map((page, index) => `PAGE ${index + 1}: ${page.title ?? page.url}\nURL: ${page.url}\n${page.text}`)
    .join("\n\n---\n\n")
    .slice(0, 42_000)

  return {
    canonicalUrl: first.url,
    hostname: canonicalHost,
    pages,
    combinedText,
  }
}

function normalizePublicUrl(inputUrl: string): URL {
  let url: URL
  try {
    url = new URL(inputUrl.trim())
  } catch {
    throw new Error("Ingresa una URL pública válida.")
  }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("La web debe usar HTTP o HTTPS.")
  if (url.username || url.password) throw new Error("La URL no puede incluir credenciales.")
  url.hash = ""
  return url
}

async function fetchHtmlValidated(initialUrl: URL): Promise<{ url: string; html: string }> {
  let current = initialUrl
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    await assertPublicHostname(current.hostname)
    const response = await fetch(current, {
      redirect: "manual",
      cache: "no-store",
      headers: {
        "User-Agent": "VIDENTIA-OpportunityEngine/1.0 (+https://videntia.app)",
        Accept: "text/html,text/plain;q=0.9,*/*;q=0.1",
      },
      signal: AbortSignal.timeout(10_000),
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location")
      if (!location) throw new Error("La web respondió con una redirección inválida.")
      current = normalizePublicUrl(new URL(location, current).toString())
      continue
    }

    if (!response.ok) throw new Error(`No pudimos leer la web (${response.status}).`)
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? ""
    if (contentType && !contentType.includes("text/html") && !contentType.includes("text/plain")) {
      throw new Error("La URL no apunta a una página HTML legible.")
    }
    const declaredLength = Number(response.headers.get("content-length") ?? 0)
    if (declaredLength > MAX_RESPONSE_BYTES) throw new Error("La página es demasiado grande para analizarla de forma segura.")

    const html = (await response.text()).slice(0, MAX_RESPONSE_BYTES)
    return { url: current.toString(), html }
  }
  throw new Error("La web tiene demasiadas redirecciones.")
}

async function assertPublicHostname(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/\.$/, "")
  if (!normalized || normalized === "localhost" || normalized.endsWith(".local") || normalized.endsWith(".internal")) {
    throw new Error("La URL debe apuntar a una web pública.")
  }

  const directIp = isIP(normalized) ? [normalized] : (await lookup(normalized, { all: true, verbatim: true })).map((entry) => entry.address)
  if (!directIp.length || directIp.some(isPrivateAddress)) throw new Error("La URL debe resolver sólo a direcciones públicas.")
}

function isPrivateAddress(address: string): boolean {
  const value = address.toLowerCase()
  if (value === "::1" || value === "::" || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe8") || value.startsWith("fe9") || value.startsWith("fea") || value.startsWith("feb")) return true
  if (value.startsWith("::ffff:")) return isPrivateAddress(value.slice(7))
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(value)) return false

  const [a, b] = value.split(".").map(Number)
  return a === 10
    || a === 127
    || a === 0
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 198 && (b === 18 || b === 19))
}

function toPage(url: string, html: string): CompanyWebsitePage {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return {
    url,
    title: titleMatch ? decodeEntities(stripTags(titleMatch[1])).slice(0, 180) : null,
    text: extractVisibleText(html).slice(0, MAX_PAGE_TEXT),
  }
}

function extractSameOriginLinks(html: string, baseUrl: string): string[] {
  const base = new URL(baseUrl)
  const seen = new Set<string>()
  const regex = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(html))) {
    try {
      const url = new URL(match[1], base)
      if (!["http:", "https:"].includes(url.protocol) || url.hostname !== base.hostname) continue
      url.hash = ""
      url.search = ""
      const normalized = url.toString().replace(/\/$/, "")
      if (normalized !== base.toString().replace(/\/$/, "")) seen.add(normalized)
    } catch {
      // Ignore malformed links.
    }
  }
  return [...seen]
}

function linkScore(url: string): number {
  const path = new URL(url).pathname.toLowerCase()
  return LINK_KEYWORDS.reduce((score, keyword) => score + (path.includes(keyword) ? 2 : 0), 0) - Math.max(0, path.split("/").filter(Boolean).length - 3)
}

function extractVisibleText(html: string): string {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|noscript|svg|canvas|template)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|section|article|li|h1|h2|h3|h4|h5|h6)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t\f\v]+/g, " ")
      .replace(/\n\s*\n+/g, "\n")
      .trim(),
  )
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
}
