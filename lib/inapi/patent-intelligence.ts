import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

export type PatentCompanyProfile = {
  query: string
  matched: boolean
  portfolio: {
    totalRecords: number
    registered: number
    pending: number
    recentFilings90d: number
    previousFilings90d: number
    recentPublications90d: number
    firstFilingDate: string | null
    latestActivityDate: string | null
    technologyFamilies: number
    newestSync: string | null
  }
  annualActivity: Array<{ year: number; filings: number }>
  growth: {
    comparisonYear: number
    latestFullYearFilings: number
    previousFullYearFilings: number
    yearOverYearPct: number | null
  }
  matchedApplicantNames: Array<{ applicants: string; records: number }>
  topIpc: Array<{ code: string; family: string; records: number }>
  countries: Array<{ country: string; records: number }>
  topInventors: Array<{ inventor: string; records: number }>
  recentPatents: Array<{
    id: string
    application_number: string | null
    registration_number: string | null
    title: string
    status: string | null
    country: string | null
    filing_date: string | null
    publication_date: string | null
    registration_date: string | null
    activity_date: string | null
    ipc_codes: string[]
  }>
  methodology: {
    scope: string
    recentWindowDays: number
    historicalApplicationYearsExpected: number
    historicalApplicationYearsCompleted: number
    growthClaimsEnabled: boolean
    note: string
  }
}

export async function getPatentCompanyIntelligence(company: string, recentLimit = 12): Promise<PatentCompanyProfile> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("get_patent_company_intelligence", {
    p_company: company,
    p_recent_limit: recentLimit,
  })
  if (error) throw new Error(`Patent company intelligence failed: ${error.message}`)
  return data as PatentCompanyProfile
}
