import type { Marca } from "@/types/marca"

const INAPI_BASE = "https://buscadormarcas.inapi.cl/Marca"
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
const REQUEST_TIMEOUT_MS = 8_000
const MAX_DETAILS = 3
const CACHE_TTL_MS = 6 * 60 * 60 * 1000

type CacheEntry = { expiresAt: number; imageUrl: string | null }
const detailImageCache = new Map<string, CacheEntry>()

/**
 * Enriches only the first candidates with image references that INAPI itself
 * exposes in its detail payload. It never constructs an image URL from
 * undocumented file sequence/type fields.
 */
export async function enrichCandidatesWithOfficialImages(candidates: Marca[]): Promise<Marca[]> {
  if (candidates.length === 0) return candidates
  const targets = candidates.slice(0, MAX_DETAILS)
  const unresolved = targets.filter((item) => !item.imagenUrl && readCached(item.id) === undefined)
  if (unresolved.length === 0) return applyCachedImages(candidates)

  try {
    const sessionId = await fetchSession()
    for (const candidate of unresolved) {
      try {
        const imageUrl = await fetchDetailImage(candidate.id, sessionId)
        writeCached(candidate.id, imageUrl)
      } catch (error) {
        console.warn("[inapi-visual-detail] candidate detail skipped", candidate.id, error instanceof Error ? error.message : String(error))
        writeCached(candidate.id, null)
      }
    }
  } catch (error) {
    console.warn("[inapi-visual-detail] enrichment unavailable", error instanceof Error ? error.message : String(error))
  }
  return applyCachedImages(candidates)
}

async function fetchDetailImage(numeroSolicitud: string, sessionId: string) {
  const response = await fetchWithTimeout(`${INAPI_BASE}/BuscarMarca.aspx/FindMarcaByNumeroSolicitud`, {
    method: "POST",
    headers: commonHeaders(sessionId),
    body: JSON.stringify({ Hash: "", IDW: "", numeroSolicitud }),
    cache: "no-store",
  })
  if (!response.ok) throw new Error(`detail HTTP ${response.status}`)
  const json = await response.json()
  const detail = JSON.parse(json.d ?? "{}") as unknown
  return findOfficialImageReference(detail)
}

function findOfficialImageReference(value: unknown): string | null {
  const queue: unknown[] = [value]
  while (queue.length) {
    const current = queue.shift()
    if (typeof current === "string") {
      const resolved = normalizeImageReference(current)
      if (resolved) return resolved
      continue
    }
    if (Array.isArray(current)) {
      queue.push(...current)
      continue
    }
    if (current && typeof current === "object") {
      for (const [key, nested] of Object.entries(current as Record<string, unknown>)) {
        if (/imagen|image|logo|etiqueta|archivo|file/i.test(key) && typeof nested === "string") {
          const resolved = normalizeImageReference(nested)
          if (resolved) return resolved
        }
        queue.push(nested)
      }
    }
  }
  return null
}

function normalizeImageReference(raw: string) {
  const value = raw.trim().replace(/&amp;/g, "&")
  if (!value || value.startsWith("data:")) return null
  try {
    const url = new URL(value, "https://buscadormarcas.inapi.cl")
    if (url.protocol !== "https:" || url.hostname !== "buscadormarcas.inapi.cl") return null
    const haystack = `${url.pathname}${url.search}`.toLowerCase()
    const looksLikeImage = /\.(png|jpe?g|gif|webp|bmp)(?:$|\?)/i.test(haystack)
      || /imagen|image|logo|etiqueta|archivo|file/i.test(haystack)
    return looksLikeImage ? url.toString() : null
  } catch {
    return null
  }
}

async function fetchSession() {
  const response = await fetchWithTimeout(`${INAPI_BASE}/BuscarMarca.aspx`, { headers: { "User-Agent": USER_AGENT }, cache: "no-store" })
  if (!response.ok) throw new Error(`session HTTP ${response.status}`)
  const cookie = response.headers.get("set-cookie") ?? ""
  const match = cookie.match(/ASP\.NET_SessionId=([^;]+)/)
  if (!match) throw new Error("session cookie unavailable")
  return match[1]
}

function commonHeaders(sessionId: string) {
  return {
    "Content-Type": "application/json; charset=utf-8",
    Accept: "application/json, text/javascript, */*",
    "X-Requested-With": "XMLHttpRequest",
    Referer: `${INAPI_BASE}/BuscarMarca.aspx`,
    "User-Agent": USER_AGENT,
    Cookie: `ASP.NET_SessionId=${sessionId}`,
  }
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

function readCached(id: string) {
  const entry = detailImageCache.get(id)
  if (!entry) return undefined
  if (entry.expiresAt <= Date.now()) {
    detailImageCache.delete(id)
    return undefined
  }
  return entry.imageUrl
}

function writeCached(id: string, imageUrl: string | null) {
  detailImageCache.set(id, { imageUrl, expiresAt: Date.now() + CACHE_TTL_MS })
}

function applyCachedImages(candidates: Marca[]) {
  return candidates.map((candidate) => {
    if (candidate.imagenUrl) return candidate
    const imageUrl = readCached(candidate.id)
    return imageUrl ? { ...candidate, imagenUrl: imageUrl } : candidate
  })
}
