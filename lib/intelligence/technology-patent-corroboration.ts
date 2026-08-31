import "server-only"

import { searchPatentsLocal, type PatentSearchHit } from "@/lib/inapi/patent-search"
import { isTechnologyTitleRelevant } from "@/lib/intelligence/technology-corroboration-rules"

const MIN_PATENT_RELEVANCE = 65
const PATENT_SEARCH_LIMIT = 50
const PATENT_EVIDENCE_LIMIT = 8

export type TechnologyPatentEvidence = {
  source: "inapi_patents"
  sourceRecordId: string
  applicationNumber: string | null
  registrationNumber: string | null
  title: string
  applicants: string | null
  filingDate: string | null
  ipc: string[]
  sourceUrl: string | null
  relevanceScore: number
  recent: boolean
}

export type TechnologyPatentSignal = {
  recentMatches: number
  historicalMatches: number
  distinctApplicants: number
  latestFilingDate: string | null
  evidence: TechnologyPatentEvidence[]
}

export function emptyTechnologyPatentSignal(): TechnologyPatentSignal {
  return {
    recentMatches: 0,
    historicalMatches: 0,
    distinctApplicants: 0,
    latestFilingDate: null,
    evidence: [],
  }
}

export async function buildTechnologyPatentSignal(query: string, currentFrom: Date, now: Date): Promise<TechnologyPatentSignal> {
  const { hits } = await searchPatentsLocal(query, undefined, PATENT_SEARCH_LIMIT)
  const strong = hits.filter(hit => isStrongTechnologyPatent(query, hit))
  const currentFromTime = currentFrom.getTime()
  const nowTime = now.getTime()
  const isRecent = (hit: PatentSearchHit) => {
    if (!hit.filingDate) return false
    const filedAt = new Date(hit.filingDate).getTime()
    return Number.isFinite(filedAt) && filedAt >= currentFromTime && filedAt <= nowTime
  }
  const recent = strong.filter(isRecent)
  const applicants = new Set(strong.map(hit => hit.applicants?.trim()).filter((value): value is string => Boolean(value)))
  const latestFilingDate = strong
    .map(hit => hit.filingDate)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null

  return {
    recentMatches: recent.length,
    historicalMatches: strong.length,
    distinctApplicants: applicants.size,
    latestFilingDate,
    evidence: strong.slice(0, PATENT_EVIDENCE_LIMIT).map(hit => ({
      source: "inapi_patents" as const,
      sourceRecordId: hit.id,
      applicationNumber: hit.applicationNumber,
      registrationNumber: hit.registrationNumber,
      title: hit.title,
      applicants: hit.applicants,
      filingDate: hit.filingDate,
      ipc: hit.ipc,
      sourceUrl: hit.sourceUrl,
      relevanceScore: Math.round(hit.relevanceScore * 10) / 10,
      recent: isRecent(hit),
    })),
  }
}

function isStrongTechnologyPatent(query: string, hit: PatentSearchHit) {
  return hit.relevanceScore >= MIN_PATENT_RELEVANCE && isTechnologyTitleRelevant(query, hit.title)
}
