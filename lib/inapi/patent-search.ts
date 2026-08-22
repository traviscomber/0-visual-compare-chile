import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

export type PatentSearchHit = {
  id: string
  applicationNumber: string | null
  registrationNumber: string | null
  title: string
  applicants: string | null
  inventors: string | null
  status: string | null
  country: string | null
  filingDate: string | null
  registrationDate: string | null
  expirationDate: string | null
  ipc: string[]
  sourceUrl: string | null
  lastSyncedAt: string | null
  titleSimilarity: number
  applicantSimilarity: number
  relevanceScore: number
}

export async function searchPatentsLocal(query: string, ipcPrefix?: string | null, limit = 25) {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("search_patents_local", {
    p_query: query,
    p_ipc_prefix: ipcPrefix || null,
    p_limit: Math.max(1, Math.min(limit, 100)),
  })

  if (error) throw new Error(`Patent search failed: ${error.message}`)

  const hits: PatentSearchHit[] = (data || []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    applicationNumber: nullableText(row.application_number),
    registrationNumber: nullableText(row.registration_number),
    title: String(row.title || ""),
    applicants: nullableText(row.applicants),
    inventors: nullableText(row.inventors),
    status: nullableText(row.status),
    country: nullableText(row.country),
    filingDate: nullableText(row.filing_date),
    registrationDate: nullableText(row.registration_date),
    expirationDate: nullableText(row.expiration_date),
    ipc: Array.isArray(row.ipc_codes) ? row.ipc_codes.map(String) : [],
    sourceUrl: nullableText(row.source_url),
    lastSyncedAt: nullableText(row.last_synced_at),
    titleSimilarity: Number(row.title_similarity || 0),
    applicantSimilarity: Number(row.applicant_similarity || 0),
    relevanceScore: Number(row.relevance_score || 0),
  }))

  const newestSync = hits.map((hit) => hit.lastSyncedAt).filter(Boolean).sort().at(-1) ?? null
  return { hits, newestSync }
}

function nullableText(value: unknown) {
  if (value === null || value === undefined) return null
  const result = String(value).trim()
  return result || null
}
