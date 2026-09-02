import "server-only"

import { fetchWithRetry } from "@/lib/intelligence/fetch-with-retry"

const GLEIF_BASE = "https://api.gleif.org/api/v1"
const TIMEOUT_MS = 10_000

export type GleifLegalEntityMatch = {
  lei: string
  legalName: string
  country: string | null
  registrationStatus: string | null
  entityStatus: string | null
  sourceUrl: string
  resolution: "normalized_exact"
  confidence: 1
}

type GleifRecord = {
  id?: string
  attributes?: {
    lei?: string
    entity?: {
      legalName?: { name?: string }
      legalAddress?: { country?: string }
      status?: string
    }
    registration?: { status?: string }
  }
}

type GleifResponse = { data?: GleifRecord[] }

export async function resolveLegalEntityInGleif(name: string, countryHint?: string | null): Promise<GleifLegalEntityMatch | null> {
  const normalizedTarget = normalizeLegalName(name)
  if (normalizedTarget.length < 3) return null

  const params = new URLSearchParams()
  params.set("filter[entity.legalName]", name.trim())
  params.set("page[size]", "20")
  const response = await fetchWithRetry(`${GLEIF_BASE}/lei-records?${params.toString()}`, {
    cache: "no-store",
    headers: { Accept: "application/vnd.api+json", "User-Agent": "VIDENTIA/1.0" },
  }, { attempts: 2, baseDelayMs: 400, timeoutMs: TIMEOUT_MS })
  if (!response.ok) throw new Error(`GLEIF LEI search responded ${response.status}`)

  const payload = await response.json() as GleifResponse
  const country = normalizeCountry(countryHint)
  const exact = (payload.data ?? []).map(toCandidate).filter((item): item is GleifLegalEntityMatch => Boolean(item))
    .filter(item => normalizeLegalName(item.legalName) === normalizedTarget)
    .filter(item => !country || !item.country || item.country === country)

  const uniqueByLei = new Map(exact.map(item => [item.lei, item]))
  if (uniqueByLei.size !== 1) return null
  return [...uniqueByLei.values()][0]
}

function toCandidate(record: GleifRecord): GleifLegalEntityMatch | null {
  const lei = String(record.attributes?.lei ?? record.id ?? "").trim().toUpperCase()
  const legalName = String(record.attributes?.entity?.legalName?.name ?? "").trim()
  if (!/^[A-Z0-9]{20}$/.test(lei) || !legalName) return null
  return {
    lei,
    legalName,
    country: normalizeCountry(record.attributes?.entity?.legalAddress?.country),
    registrationStatus: textOrNull(record.attributes?.registration?.status),
    entityStatus: textOrNull(record.attributes?.entity?.status),
    sourceUrl: `https://api.gleif.org/api/v1/lei-records/${encodeURIComponent(lei)}`,
    resolution: "normalized_exact",
    confidence: 1,
  }
}

function normalizeLegalName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\b(INC|INCORPORATED|CORP|CORPORATION|CO|COMPANY|LLC|LTD|LIMITED|PLC|S\.A\.|S A|SPA|SP A|LTDA|LIMITADA|EIRL|SAS|SOCIEDAD POR ACCIONES)\b/g, " ")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

function normalizeCountry(value: string | null | undefined) {
  const text = String(value ?? "").trim().toUpperCase()
  return /^[A-Z]{2}$/.test(text) ? text : null
}
function textOrNull(value: unknown) { const text = String(value ?? "").trim(); return text || null }
