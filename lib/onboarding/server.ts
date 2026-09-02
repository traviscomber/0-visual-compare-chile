import type { User } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"
import { calculateProfileCompleteness, cleanList, cleanText, inferOnboardingStep, type OrganizationIntelligenceProfile } from "@/lib/onboarding/profile"

export type UserOrganization = {
  id: string
  name: string
  slug: string
  role: string | null
}

export async function getOrCreatePrimaryOrganization(user: User): Promise<UserOrganization> {
  const admin = createAdminClient()
  const { data: membership, error: membershipError } = await admin
    .from("organization_members")
    .select("organization_id, role, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (membershipError) throw membershipError

  if (membership?.organization_id) {
    const { data: organization, error: organizationError } = await admin
      .from("organizations")
      .select("id, name, slug")
      .eq("id", membership.organization_id)
      .single()
    if (organizationError) throw organizationError
    return { ...organization, role: membership.role ?? null }
  }

  const name = organizationNameFor(user)
  const slug = slugify(`${name}-${user.id.slice(0, 8)}`)
  const { data: organization, error: createError } = await admin
    .from("organizations")
    .insert({ name, slug, created_by: user.id })
    .select("id, name, slug")
    .single()
  if (createError) throw createError

  const { error: memberError } = await admin.from("organization_members").insert({
    organization_id: organization.id,
    user_id: user.id,
    role: "admin",
  })
  if (memberError) throw memberError

  return { ...organization, role: "admin" }
}

export async function readOrganizationIntelligenceProfile(organizationId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("organization_intelligence_profiles")
    .select("organization_id, website, company_summary, industry, country, offerings, capabilities, discovery_goals, strategic_focus, onboarding_step, onboarding_version, profile_completeness, onboarding_completed_at, metadata, created_at, updated_at")
    .eq("organization_id", organizationId)
    .maybeSingle()
  if (error) throw error
  return normalizeProfile(data)
}

export async function ensureOrganizationIntelligenceProfile(user: User, organization: UserOrganization) {
  const current = await readOrganizationIntelligenceProfile(organization.id)
  if (current) return current

  const admin = createAdminClient()
  const website = websiteFromUser(user)
  const initial = {
    organization_id: organization.id,
    website,
    company_summary: null,
    industry: null,
    country: null,
    offerings: [],
    capabilities: [],
    discovery_goals: [],
    strategic_focus: null,
    onboarding_step: website ? 2 : 1,
    onboarding_version: 1,
    profile_completeness: website ? 25 : 0,
    metadata: {},
    created_by: user.id,
    updated_by: user.id,
  }
  const { data, error } = await admin
    .from("organization_intelligence_profiles")
    .insert(initial)
    .select("organization_id, website, company_summary, industry, country, offerings, capabilities, discovery_goals, strategic_focus, onboarding_step, onboarding_version, profile_completeness, onboarding_completed_at, metadata, created_at, updated_at")
    .single()
  if (error) throw error
  return normalizeProfile(data)!
}

export async function saveOrganizationIntelligenceProfile(params: {
  user: User
  organization: UserOrganization
  input: Record<string, unknown>
  completed?: boolean
}) {
  const current = await ensureOrganizationIntelligenceProfile(params.user, params.organization)
  const website = params.input.website === undefined ? current.website : cleanText(params.input.website)
  const companySummary = params.input.company_summary === undefined ? current.company_summary : cleanText(params.input.company_summary)
  const industry = params.input.industry === undefined ? current.industry : cleanText(params.input.industry)
  const country = params.input.country === undefined ? current.country : cleanText(params.input.country)
  const offerings = params.input.offerings === undefined ? current.offerings : cleanList(params.input.offerings)
  const capabilities = params.input.capabilities === undefined ? current.capabilities : cleanList(params.input.capabilities)
  const discoveryGoals = params.input.discovery_goals === undefined ? current.discovery_goals : cleanList(params.input.discovery_goals).slice(0, 5)
  const strategicFocus = params.input.strategic_focus === undefined ? current.strategic_focus : cleanText(params.input.strategic_focus)

  const merged = {
    website,
    company_summary: companySummary,
    industry,
    country,
    offerings,
    capabilities,
    discovery_goals: discoveryGoals,
    strategic_focus: strategicFocus,
  }
  const profileCompleteness = calculateProfileCompleteness(merged)
  const inferredStep = inferOnboardingStep(merged)
  const requestedStep = Number(params.input.onboarding_step)
  const onboardingStep = Number.isInteger(requestedStep) && requestedStep >= 1 && requestedStep <= 4
    ? Math.max(inferredStep, requestedStep)
    : inferredStep
  const completedAt = params.completed && profileCompleteness >= 75
    ? current.onboarding_completed_at ?? new Date().toISOString()
    : current.onboarding_completed_at
  const metadata = params.input.metadata && typeof params.input.metadata === "object" && !Array.isArray(params.input.metadata)
    ? { ...current.metadata, ...(params.input.metadata as Record<string, unknown>) }
    : current.metadata

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("organization_intelligence_profiles")
    .update({
      ...merged,
      onboarding_step: onboardingStep,
      profile_completeness: profileCompleteness,
      onboarding_completed_at: completedAt,
      metadata,
      updated_by: params.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", params.organization.id)
    .select("organization_id, website, company_summary, industry, country, offerings, capabilities, discovery_goals, strategic_focus, onboarding_step, onboarding_version, profile_completeness, onboarding_completed_at, metadata, created_at, updated_at")
    .single()
  if (error) throw error
  return normalizeProfile(data)!
}

function normalizeProfile(data: unknown): OrganizationIntelligenceProfile | null {
  if (!data || typeof data !== "object") return null
  const row = data as Record<string, unknown>
  return {
    organization_id: String(row.organization_id ?? ""),
    website: cleanText(row.website),
    company_summary: cleanText(row.company_summary),
    industry: cleanText(row.industry),
    country: cleanText(row.country),
    offerings: cleanList(row.offerings),
    capabilities: cleanList(row.capabilities),
    discovery_goals: cleanList(row.discovery_goals),
    strategic_focus: cleanText(row.strategic_focus),
    onboarding_step: Number(row.onboarding_step ?? 1),
    onboarding_version: Number(row.onboarding_version ?? 1),
    profile_completeness: Number(row.profile_completeness ?? 0),
    onboarding_completed_at: cleanText(row.onboarding_completed_at),
    metadata: row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata) ? row.metadata as Record<string, unknown> : {},
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  }
}

function organizationNameFor(user: User) {
  const company = cleanText(user.user_metadata?.company_name)
  if (company) return company
  const fullName = cleanText(user.user_metadata?.full_name)
  if (fullName) return fullName
  const local = user.email?.split("@")[0]?.replace(/[._-]+/g, " ").trim()
  return local ? titleCase(local) : "Mi organización"
}

function websiteFromUser(user: User) {
  const website = cleanText(user.user_metadata?.website)
  return website ? normalizeWebsite(website) : null
}

export function normalizeWebsite(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(withProtocol)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    url.hash = ""
    return url.toString()
  } catch {
    return null
  }
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "organization"
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, char => char.toUpperCase())
}
