import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"

export type CompanyIpActivityInput = {
  entityType: "patent" | "trademark"
  sourceRecordId: string
  applicants: string | null
  title: string
  filingDate: string | null
  status: string | null
  classificationCodes: string[]
  sourceUrl: string | null
  observedAt?: string
}

type IdentityRow = {
  id: string
  resolution_key: string
  identity_key: string
  canonical_name: string
  country: string | null
}

type AliasRow = {
  identity_id: string
  raw_name: string
  confidence: number | string
}

type ApplicantResolution = {
  identityId: string
  rawName: string
}

const MAX_ACTIVITY_AGE_DAYS = 370

export async function recordCompanyIpActivity(
  admin: SupabaseClient,
  records: CompanyIpActivityInput[],
): Promise<{ aliases: number; activities: number }> {
  const cutoff = Date.now() - MAX_ACTIVITY_AGE_DAYS * 86_400_000
  const eligible = records.filter(record => {
    if (!record.filingDate || !record.applicants?.trim()) return false
    const time = new Date(`${record.filingDate}T12:00:00Z`).getTime()
    return Number.isFinite(time) && time >= cutoff
  })
  if (!eligible.length) return { aliases: 0, activities: 0 }

  const rawApplicants = [...new Set(eligible.flatMap(record => splitCompanyApplicants(record.applicants)))]
  if (!rawApplicants.length) return { aliases: 0, activities: 0 }

  const existingByRaw = await loadExistingAliases(admin, rawApplicants)
  const resolutionByRaw = new Map<string, ApplicantResolution>()
  for (const [rawName, identityId] of existingByRaw) resolutionByRaw.set(rawName, { rawName, identityId })

  let aliasesCreated = 0
  for (const rawName of rawApplicants) {
    if (resolutionByRaw.has(rawName)) continue
    const resolved = await resolveOrCreateCompanyIdentity(admin, rawName)
    if (!resolved) continue

    const now = new Date().toISOString()
    const { error: aliasError } = await admin.from("intelligence_company_aliases").upsert({
      identity_id: resolved.id,
      raw_name: rawName,
      alias_key: normalizeSearchText(rawName),
      country_hint: companyCountryHint(rawName),
      source_scope: "inapi_current_sync",
      resolution_method: "normalized_exact",
      confidence: resolved.country ? 0.9 : 0.8,
      first_seen_at: now,
      last_seen_at: now,
      metadata: { identity_key: resolved.identity_key, resolution_key: resolved.resolution_key },
      updated_at: now,
    }, { onConflict: "identity_id,source_scope,raw_name" })
    if (aliasError) {
      console.error("[company-activity:alias]", aliasError.message)
      continue
    }
    aliasesCreated += 1
    resolutionByRaw.set(rawName, { rawName, identityId: resolved.id })
  }

  const activityRows: Array<Record<string, unknown>> = []
  for (const record of eligible) {
    const observedAt = record.observedAt ?? new Date().toISOString()
    for (const rawName of splitCompanyApplicants(record.applicants)) {
      const resolution = resolutionByRaw.get(rawName)
      if (!resolution) continue
      activityRows.push({
        identity_id: resolution.identityId,
        entity_type: record.entityType,
        source_key: "inapi_open_data",
        source_record_id: record.sourceRecordId,
        applicant_raw: rawName,
        title: record.title,
        filing_date: record.filingDate,
        status: record.status,
        classification_codes: [...new Set(record.classificationCodes.filter(Boolean))].sort(),
        source_url: record.sourceUrl,
        metadata: { source: "daily_sync" },
        first_seen_at: observedAt,
        last_seen_at: observedAt,
        updated_at: observedAt,
      })
    }
  }

  if (!activityRows.length) return { aliases: aliasesCreated, activities: 0 }

  const { error: activityError } = await admin
    .from("intelligence_company_ip_activity")
    .upsert(activityRows, { onConflict: "identity_id,entity_type,source_record_id" })
  if (activityError) throw new Error(`Could not persist company IP activity: ${activityError.message}`)

  const touchedIdentityIds = [...new Set(activityRows.map(row => String(row.identity_id)))]
  const now = new Date().toISOString()
  for (const identityId of touchedIdentityIds) {
    const { error } = await admin
      .from("intelligence_company_identities")
      .update({ last_seen_at: now, updated_at: now })
      .eq("id", identityId)
    if (error) console.error("[company-activity:identity-touch]", error.message)
  }

  return { aliases: aliasesCreated, activities: activityRows.length }
}

async function loadExistingAliases(admin: SupabaseClient, rawApplicants: string[]) {
  const output = new Map<string, string>()
  const batchSize = 200
  for (let index = 0; index < rawApplicants.length; index += batchSize) {
    const batch = rawApplicants.slice(index, index + batchSize)
    const { data, error } = await admin
      .from("intelligence_company_aliases")
      .select("identity_id,raw_name,confidence")
      .in("raw_name", batch)
      .order("confidence", { ascending: false })
    if (error) throw new Error(`Could not resolve company aliases: ${error.message}`)

    for (const row of (data ?? []) as AliasRow[]) {
      if (!output.has(String(row.raw_name))) output.set(String(row.raw_name), String(row.identity_id))
    }
  }
  return output
}

async function resolveOrCreateCompanyIdentity(admin: SupabaseClient, rawName: string): Promise<IdentityRow | null> {
  const identityKey = normalizeCompanyIdentity(rawName)
  if (!identityKey || identityKey.length > 200) return null
  const countryHint = companyCountryHint(rawName)

  const { data: matches, error: matchError } = await admin
    .from("intelligence_company_identities")
    .select("id,resolution_key,identity_key,canonical_name,country")
    .eq("identity_key", identityKey)
    .limit(20)
  if (matchError) throw new Error(`Could not inspect company identities: ${matchError.message}`)

  const rows = (matches ?? []) as IdentityRow[]
  const exactCountry = countryHint ? rows.find(row => row.country === countryHint) : null
  if (exactCountry) return exactCountry
  if (!countryHint && rows.length === 1) return rows[0]

  const resolutionKey = `${countryHint ?? "*"}:${identityKey}`
  const exactResolution = rows.find(row => row.resolution_key === resolutionKey)
  if (exactResolution) return exactResolution

  const now = new Date().toISOString()
  const { data: created, error: createError } = await admin
    .from("intelligence_company_identities")
    .upsert({
      resolution_key: resolutionKey,
      identity_key: identityKey,
      canonical_name: rawName,
      country: countryHint,
      resolution_confidence: countryHint ? 0.9 : 0.8,
      metadata: { source: "inapi_current_sync", resolution: "normalized_exact" },
      first_seen_at: now,
      last_seen_at: now,
      updated_at: now,
    }, { onConflict: "resolution_key" })
    .select("id,resolution_key,identity_key,canonical_name,country")
    .single()
  if (createError || !created) {
    console.error("[company-activity:identity]", createError?.message ?? "unknown")
    return null
  }
  return created as IdentityRow
}

export function splitCompanyApplicants(value: string | null | undefined) {
  if (!value) return []
  const prepared = value.replace(/,\s*(\([A-Z]{2}\))/g, "|$1")
  return [...new Set(prepared
    .split(/[;|\n\r]+/)
    .map(item => item.replace(/\s+/g, " ").trim())
    .filter(item => item.length >= 2))]
}

export function normalizeCompanyIdentity(value: string | null | undefined) {
  if (!value) return ""
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/^\s*\([A-Z]{2}\)\s*/, "")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")

  return normalized
    .replace(/^(S A C I|SACI|S A I C|SAIC)\s+/, "")
    .replace(/(\s+(S A|SA|S P A|SPA|LTDA|LIMITADA|INC|LLC|LTD|LIMITED|CO LTD|CORP|CORPORATION|GMBH|SAS|N V|NV|AG|PLC|PTE LTD|S A C I|SACI|S A I C|SAIC|S A C I COMERCIANTE))+$/, "")
    .trim()
}

export function companyCountryHint(value: string | null | undefined) {
  const match = String(value ?? "").trim().toUpperCase().match(/^\(([A-Z]{2})\)/)
  return match?.[1] ?? null
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim()
}
