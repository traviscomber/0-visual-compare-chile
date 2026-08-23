import crypto from "node:crypto"
import { createAdminClient } from "@/lib/supabase/admin"

const SEARCH_URL = "https://www.cmfchile.cl/portal/principal/623/w4-search.php"
const TIMEOUT_MS = 7000
const REFRESH_MS = 24 * 60 * 60 * 1000

type CmfMatch = {
  rutBody: string
  name: string
  entityType: string | null
  status: string | null
  href: string | null
}

export async function refreshCmfOwnerSignal(entityId: string, rut: string) {
  const normalizedRut = normalizeRut(rut)
  const rutBody = normalizedRut.split("-")[0]
  if (!entityId || !rutBody) return { matched: false, refreshed: false }

  const admin = createAdminClient()
  const { data: source, error: sourceError } = await admin
    .from("intelligence_sources")
    .select("id")
    .eq("source_key", "cmf")
    .maybeSingle()

  if (sourceError || !source?.id) {
    console.warn("[cmf:source]", sourceError)
    return { matched: false, refreshed: false }
  }

  const sourceRecordId = `rut:${normalizedRut}`
  const { data: cached } = await admin
    .from("intelligence_evidence")
    .select("id,updated_at")
    .eq("source_id", source.id)
    .eq("source_record_id", sourceRecordId)
    .eq("evidence_type", "regulatory_status")
    .maybeSingle()

  if (cached?.id && cached.updated_at && Date.now() - new Date(cached.updated_at).getTime() < REFRESH_MS) {
    await ensureEvidenceLink(admin, entityId, String(cached.id))
    return { matched: true, refreshed: false }
  }

  let html: string
  try {
    const response = await fetch(`${SEARCH_URL}?keywords=${encodeURIComponent(rutBody)}`, {
      cache: "no-store",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "N3uralia-Intelligence/1.0",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!response.ok) throw new Error(`CMF respondió ${response.status}`)
    html = await response.text()
  } catch (error) {
    console.warn("[cmf:fetch]", error)
    return { matched: false, refreshed: false }
  }

  const matches = parseMatches(html, rutBody)
  if (!matches.length) return { matched: false, refreshed: true }

  const payload = {
    rut: normalizedRut,
    matches,
    observed_at: new Date().toISOString(),
  }
  const contentHash = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex")
  const names = [...new Set(matches.map(item => item.name).filter(Boolean))]
  const types = [...new Set(matches.map(item => item.entityType).filter((value): value is string => Boolean(value)))]
  const statuses = [...new Set(matches.map(item => item.status).filter((value): value is string => Boolean(value)))]
  const summary = [
    `${matches.length} registro${matches.length === 1 ? "" : "s"} público${matches.length === 1 ? "" : "s"} de la CMF coinciden exactamente con el RUT verificado ${normalizedRut}.`,
    types.length ? `Tipo${types.length === 1 ? "" : "s"}: ${types.slice(0, 4).join(", ")}.` : "",
    statuses.length ? `Estado${statuses.length === 1 ? "" : "s"}: ${statuses.slice(0, 4).join(", ")}.` : "",
  ].filter(Boolean).join(" ")

  const sourceUrl = `${SEARCH_URL}?keywords=${encodeURIComponent(rutBody)}`
  const evidencePayload = {
    source_id: source.id,
    source_record_id: sourceRecordId,
    evidence_type: "regulatory_status",
    title: `CMF · ${names[0] ?? normalizedRut}`,
    summary,
    source_url: sourceUrl,
    occurred_at: null,
    observed_at: new Date().toISOString(),
    payload,
    content_hash: contentHash,
    confidence: "official",
    updated_at: new Date().toISOString(),
  }

  const { data: evidence, error: evidenceError } = await admin
    .from("intelligence_evidence")
    .upsert(evidencePayload, { onConflict: "source_id,source_record_id,evidence_type" })
    .select("id")
    .single()

  if (evidenceError || !evidence?.id) {
    console.warn("[cmf:evidence]", evidenceError)
    return { matched: true, refreshed: true }
  }

  await ensureEvidenceLink(admin, entityId, String(evidence.id))
  return { matched: true, refreshed: true }
}

function parseMatches(html: string, expectedRutBody: string): CmfMatch[] {
  const decoded = decodeHtml(html)
  const blocks = decoded.match(/\{\s*["']rut["']\s*:\s*["'][0-9Kk.-]+["'][\s\S]{0,2200}?\}/g) ?? []
  const matches: CmfMatch[] = []

  for (const block of blocks) {
    const rut = pick(block, /["']rut["']\s*:\s*["']([^"']+)["']/i)
    if (!rut || normalizeRutBody(rut) !== expectedRutBody) continue
    const name = pick(block, /["']name["']\s*:\s*["']([^"']+)["']/i)
      ?? pick(block, /["']razon_social["']\s*:\s*["']([^"']+)["']/i)
      ?? "Entidad CMF"
    matches.push({
      rutBody: expectedRutBody,
      name: cleanText(name),
      entityType: cleanNullable(pick(block, /["']tipo_entidad["']\s*:\s*["']([^"']+)["']/i)),
      status: cleanNullable(pick(block, /["']vigencia["']\s*:\s*["']([^"']+)["']/i)),
      href: cleanNullable(pick(block, /["']link["']\s*:\s*["']([^"']+)["']/i)),
    })
  }

  if (matches.length) return dedupe(matches)

  const visibleRut = new RegExp(`RUT:\\s*${escapeRegex(expectedRutBody)}(?:[-.]?[0-9Kk])?`, "i")
  if (!visibleRut.test(decoded)) return []

  const textWindowIndex = decoded.search(visibleRut)
  const window = decoded.slice(Math.max(0, textWindowIndex - 1200), textWindowIndex + 2200)
  const name = pick(window, /<[^>]*>([^<>]{3,160})<\/[^>]+>\s*[^<]{0,120}RUT:/i)
  const entityType = pick(window, /Tipo de entidad:\s*([^<\n]{2,160})/i)
  const status = pick(window, /Estado:\s*([^<\n]{2,80})/i)
  return [{ rutBody: expectedRutBody, name: cleanText(name ?? "Entidad CMF"), entityType: cleanNullable(entityType), status: cleanNullable(status), href: null }]
}

async function ensureEvidenceLink(admin: ReturnType<typeof createAdminClient>, entityId: string, evidenceId: string) {
  const { error } = await admin
    .from("intelligence_entity_evidence")
    .upsert({ entity_id: entityId, evidence_id: evidenceId, role: "regulated_entity" }, {
      onConflict: "entity_id,evidence_id,role",
    })
  if (error) console.warn("[cmf:evidence-link]", error)
}

function dedupe(items: CmfMatch[]) {
  return [...new Map(items.map(item => [`${item.name}|${item.entityType ?? ""}|${item.status ?? ""}`, item])).values()]
}
function pick(value: string, regex: RegExp) { return value.match(regex)?.[1]?.trim() ?? null }
function normalizeRut(value: string) { const compact = value.toUpperCase().replace(/[^0-9K]/g, ""); return compact.length > 1 ? `${compact.slice(0, -1)}-${compact.slice(-1)}` : value }
function normalizeRutBody(value: string) { const compact = value.toUpperCase().replace(/[^0-9K]/g, ""); return compact.length > 1 ? compact.slice(0, -1) : compact }
function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") }
function cleanNullable(value: string | null) { const cleaned = value ? cleanText(value) : ""; return cleaned || null }
function cleanText(value: string) { return decodeHtml(value).replace(/<[^>]+>/g, " ").replace(/\\\//g, "/").replace(/\s+/g, " ").trim() }
function decodeHtml(value: string) { return value.replace(/&quot;/g, '"').replace(/&#34;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'") }
