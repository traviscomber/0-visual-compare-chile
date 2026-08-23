import type { Marca } from "@/types/marca"

const INAPI_BASE = "https://buscadormarcas.inapi.cl/Marca"
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
const REQUEST_TIMEOUT_MS = 8_000
const MAX_DETAILS = 3
const CACHE_TTL_MS = 6 * 60 * 60 * 1000

type CacheEntry = { expiresAt: number; imageUrl: string | null }
const detailImageCache = new Map<string, CacheEntry>()

interface InapiSearchPayload {
  Hash?: string
  Marcas?: Array<{ id: string; cell: string[] }>
}

/**
 * Enriches only the first registry candidates with image references that are
 * actually exposed by INAPI's own detail payload. No URL is synthesized from
 * fileSeq/fileType or other undocumented fields.
 */
export async function enrichCandidatesWithOfficialImages(
  query: string,
  candidates: Marca[],
): Promise<Marca[]> {
  if (!query.trim() || candidates.length === 0) return candidates

  const targets = candidates.slice(0, MAX_DETAILS)
  const unresolved = targets.filter((item) => !item.imagenUrl && !readCached(item.id))
  if (unresolved.length === 0) return applyCachedImages(candidates)

  let sessionId = ""
  try {
    sessionId = await fetchSession()
    const search = await fetchPrimarySearch(query, sessionId)
    const hash = search.Hash ?? ""
    const ids = new Set((search.Marcas ?? []).map((item) => item.id))

    for (const candidate of unresolved) {
      if (!ids.has(candidate.id)) {
        writeCached(candidate.id, null)
        continue
      }
      try {
        const imageUrl = await fetchDetailImage(candidate.id, hash, sessionId)
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

async function fetchPrimarySearch(query: string, sessionId: string): Promise<InapiSearchPayload> {
  const params: Record<string, string> = {
    LastNumSol: "", Hash: "", IDW: "", responseCaptcha: "",
    param1: "", param2: "", param3: normalizeQuery(query), param4: "", param5: "",
    param6: "", param7: "", param8: "", param9: "", param10: "", param11: "",
    param12: "", param13: "", param14: "", param15: "", param16: "", param17: "2",
  }
  const response = await fetchWithTimeout(`${INAPI_BASE}/BuscarMarca.aspx/FindMarcas`, {
    method: "POST",
    headers: commonHeaders(sessionId),
    body: JSON.stringify(params),
    cache: "no-store",
  })
  if (!response.ok) throw new Error(`search HTTP ${response.status}`)
  const json = await response.json()
  return JSON.parse(json.d ?? "{}") as InapiSearchPayload
}

async function fetchDetailImage(numeroSolicitud: string, hash: string, sessionId: string) {
  const response = await fetchWithTimeout(`${INAPI_BASE}/BuscarMarca.aspx/FindMarcaByNumeroSolicitud`, {
    method: "POST",
    headers: commonHeaders(sessionId),
    body: JSON.stringify({ Hash: hash, IDW: "", numeroSolicitud }),
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
    if (url.protocol !== "https:") return null
    if (url.hostname !== "buscadormarcas.inapi.cl") return null
    const path = url.pathname.toLowerCase()
    const looksLikeImage = /\.(png|jpe?g|gif|webp|bmp)(?:$|\?)/i.test(url.pathname + url.search)
      || /imagen|image|logo|etiqueta|archivo|file/i.test(path + url.search)
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

function normalizeQuery(value: string) {
  return value.trim().toUpperCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ")
}
