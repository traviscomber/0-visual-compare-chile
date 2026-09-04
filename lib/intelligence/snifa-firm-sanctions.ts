import "server-only"

import { fetchWithRetry } from "@/lib/intelligence/fetch-with-retry"

const SNIFA_BASE = "https://snifa.sma.gob.cl"
const SNIFA_RESULTS_PATH = "/RegistroPublico/Resultado"
const MAX_RESULTS = 20

export type SnifaRiskLevel = "critical" | "high" | "medium" | "low"

export type SnifaFirmSanction = {
  source: "snifa_sma"
  sourceRecordId: string
  expediente: string
  unitName: string
  holderName: string
  category: string | null
  region: string | null
  fineUta: number | null
  paymentStatus: string | null
  startedAt: string | null
  endedAt: string | null
  status: string | null
  sanctionDetail: string | null
  infringementCount: number
  gravisimaCount: number
  graveCount: number
  leveCount: number
  environmentalRiskLevel: SnifaRiskLevel
  environmentalRiskBasis: string[]
  sourceUrl: string
}

export async function searchSnifaFirmSanctions(query: string, limit = 12): Promise<SnifaFirmSanction[]> {
  const normalizedQuery = normalizeEntity(query)
  if (normalizedQuery.length < 2) return []

  const safeLimit = Math.max(1, Math.min(MAX_RESULTS, Math.trunc(limit)))
  const response = await fetchWithRetry(new URL(SNIFA_RESULTS_PATH, SNIFA_BASE), {
    cache: "no-store",
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "VIDENTIA/1.0 external-intelligence",
    },
  }, { attempts: 2, baseDelayMs: 500, timeoutMs: 15_000 })

  if (!response.ok) throw new Error(`SNIFA Registro Público respondió ${response.status}`)
  const html = await response.text()
  const sanctions = parseFirmSanctions(html)
    .filter(item => entityMatches(item, normalizedQuery))
    .slice(0, safeLimit)

  return Promise.all(sanctions.map(item => enrichFirmSanction(item)))
}

export function parseFirmSanctions(html: string): SnifaFirmSanction[] {
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
  const results: SnifaFirmSanction[] = []

  for (const rowMatch of rows) {
    const rowHtml = rowMatch[1] ?? ""
    const detailMatch = rowHtml.match(/href=["']([^"']*\/RegistroPublico\/Ficha\/(\d+))[^"']*["']/i)
    if (!detailMatch) continue

    const cells = [...rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(match => cleanVisibleText(match[1] ?? ""))
    if (cells.length < 8) continue

    const expediente = cells[1]?.trim() ?? ""
    const unitName = cells[2]?.trim() ?? ""
    const holderName = cells[3]?.trim() ?? ""
    if (!expediente || !unitName || !holderName) continue

    const sourceRecordId = detailMatch[2]
    const sourceUrl = normalizeSnifaUrl(detailMatch[1])
    if (!sourceRecordId || !sourceUrl) continue

    const fineUta = parseFine(cells[6])
    const risk = classifyEnvironmentalRisk(fineUta, null)

    results.push({
      source: "snifa_sma",
      sourceRecordId,
      expediente,
      unitName,
      holderName,
      category: cells[4]?.trim() || null,
      region: cells[5]?.trim() || null,
      fineUta,
      paymentStatus: cells[7]?.trim() || null,
      startedAt: null,
      endedAt: null,
      status: null,
      sanctionDetail: null,
      ...risk,
      sourceUrl,
    })
  }

  return dedupe(results)
}

async function enrichFirmSanction(item: SnifaFirmSanction): Promise<SnifaFirmSanction> {
  try {
    const response = await fetchWithRetry(item.sourceUrl, {
      cache: "no-store",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "VIDENTIA/1.0 external-intelligence",
      },
    }, { attempts: 2, baseDelayMs: 400, timeoutMs: 10_000 })

    if (!response.ok) return item
    const html = await response.text()
    const detail = parseFirmSanctionDetail(html)
    return {
      ...item,
      ...detail,
      ...classifyEnvironmentalRisk(item.fineUta, detail.sanctionDetail),
    }
  } catch (error) {
    console.warn("[snifa] sanction detail unavailable", { sourceRecordId: item.sourceRecordId, error })
    return item
  }
}

export function parseFirmSanctionDetail(html: string): Pick<SnifaFirmSanction, "startedAt" | "endedAt" | "status" | "sanctionDetail"> {
  const text = cleanVisibleText(html)
  return {
    startedAt: normalizeDate(labelValue(text, "Fecha Inicio")),
    endedAt: normalizeDate(labelValue(text, "Fecha Término") ?? labelValue(text, "Fecha Termino")),
    status: labelValue(text, "Estado"),
    sanctionDetail: labelValue(text, "Detalle Sanción") ?? labelValue(text, "Detalle Sancion"),
  }
}

export function classifyEnvironmentalRisk(fineUta: number | null, sanctionDetail: string | null): Pick<SnifaFirmSanction, "infringementCount" | "gravisimaCount" | "graveCount" | "leveCount" | "environmentalRiskLevel" | "environmentalRiskBasis"> {
  const normalized = normalizeEntity(sanctionDetail ?? "")
  const gravisimaCount = countWord(normalized, "gravisimas")
  const graveCount = countWord(normalized, "graves")
  const leveCount = countWord(normalized, "leves")
  const infringementCount = gravisimaCount + graveCount + leveCount
  const basis: string[] = []

  if (gravisimaCount > 0) basis.push(`${gravisimaCount} infracción(es) gravísima(s)`)
  if (graveCount > 0) basis.push(`${graveCount} infracción(es) grave(s)`)
  if (leveCount > 0) basis.push(`${leveCount} infracción(es) leve(s)`)
  if (fineUta != null) basis.push(`${fineUta.toLocaleString("es-CL")} UTA`)
  if (infringementCount > 0) basis.push(`${infringementCount} hecho(s) sancionados`)

  let environmentalRiskLevel: SnifaRiskLevel = "low"
  if (gravisimaCount > 0 || (fineUta ?? 0) >= 5000) environmentalRiskLevel = "critical"
  else if (graveCount > 0 || (fineUta ?? 0) >= 1000) environmentalRiskLevel = "high"
  else if (leveCount > 0 || (fineUta ?? 0) >= 100) environmentalRiskLevel = "medium"

  return {
    infringementCount,
    gravisimaCount,
    graveCount,
    leveCount,
    environmentalRiskLevel,
    environmentalRiskBasis: basis,
  }
}

function countWord(value: string, word: string) {
  if (!value || !word) return 0
  const matches = value.match(new RegExp(`\\b${escapeRegExp(word)}\\b`, "g"))
  return matches?.length ?? 0
}

function labelValue(text: string, label: string) {
  const normalizedLabel = escapeRegExp(label)
  const boundary = "(?=\\s+(?:Fecha Inicio|Fecha T[eé]rmino|Estado|Multa|Estado Pago|Detalle Sanci[oó]n|Unidad fiscalizable|Titular)\\s*:|$)"
  const match = text.match(new RegExp(`${normalizedLabel}\\s*:\\s*([\\s\\S]*?)${boundary}`, "i"))
  return match?.[1]?.replace(/\s+/g, " ").trim() || null
}

function normalizeDate(value: string | null) {
  if (!value) return null
  const match = value.match(/\b(\d{2})-(\d{2})-(\d{4})\b/)
  if (!match) return value
  return `${match[3]}-${match[2]}-${match[1]}`
}

function entityMatches(item: SnifaFirmSanction, normalizedQuery: string) {
  const holder = normalizeEntity(item.holderName)
  const unit = normalizeEntity(item.unitName)
  return holder.includes(normalizedQuery) || unit.includes(normalizedQuery)
}

function normalizeSnifaUrl(value: string) {
  try {
    const url = new URL(value, SNIFA_BASE)
    if (url.hostname !== "snifa.sma.gob.cl") return null
    url.protocol = "https:"
    return url.toString()
  } catch {
    return null
  }
}

function parseFine(value?: string) {
  if (!value) return null
  const match = value.replace(/\s+/g, " ").match(/([\d.]+(?:,\d+)?)/)
  if (!match) return null
  const normalized = match[1].replace(/\./g, "").replace(",", ".")
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function dedupe(items: SnifaFirmSanction[]) {
  const map = new Map<string, SnifaFirmSanction>()
  for (const item of items) map.set(item.sourceRecordId, item)
  return [...map.values()]
}

function cleanVisibleText(value: string) {
  return decodeHtml(value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim()
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
}

function normalizeEntity(value: string) {
  return cleanVisibleText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
