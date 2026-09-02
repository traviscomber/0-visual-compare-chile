export const DISCOVERY_GOALS = [
  { value: "new_technologies", label: "Nuevas tecnologías" },
  { value: "opportunities", label: "Oportunidades" },
  { value: "competition", label: "Competencia" },
  { value: "replicable_offers", label: "Productos o servicios replicables" },
  { value: "risks_changes", label: "Riesgos y cambios" },
  { value: "other", label: "Otro" },
] as const

export const STRATEGIC_FOCUS_OPTIONS = [
  { value: "innovate", label: "Innovar" },
  { value: "grow", label: "Crecer" },
  { value: "operations", label: "Mejorar operaciones" },
  { value: "costs", label: "Reducir costos" },
  { value: "anticipate", label: "Anticiparse al mercado" },
  { value: "risk", label: "Reducir riesgo" },
  { value: "other", label: "Otro" },
] as const

export type DiscoveryGoal = (typeof DISCOVERY_GOALS)[number]["value"]
export type StrategicFocus = (typeof STRATEGIC_FOCUS_OPTIONS)[number]["value"]

export type OrganizationIntelligenceProfile = {
  organization_id: string
  website: string | null
  company_summary: string | null
  industry: string | null
  country: string | null
  offerings: string[]
  capabilities: string[]
  discovery_goals: string[]
  strategic_focus: string | null
  onboarding_step: number
  onboarding_version: number
  profile_completeness: number
  onboarding_completed_at: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type StrategicProfileInput = Pick<
  OrganizationIntelligenceProfile,
  "website" | "company_summary" | "industry" | "country" | "offerings" | "capabilities" | "discovery_goals" | "strategic_focus"
>

export function calculateProfileCompleteness(profile: Partial<StrategicProfileInput>) {
  let score = 0

  if (cleanText(profile.website) || cleanText(profile.company_summary) || cleanText(profile.industry)) score += 25
  if (cleanList(profile.offerings).length > 0 || cleanList(profile.capabilities).length > 0) score += 25
  if (cleanList(profile.discovery_goals).length > 0) score += 25
  if (cleanText(profile.strategic_focus)) score += 25

  return score
}

export function inferOnboardingStep(profile: Partial<StrategicProfileInput>) {
  if (!cleanText(profile.website) && !cleanText(profile.company_summary) && !cleanText(profile.industry)) return 1
  if (cleanList(profile.offerings).length === 0 && cleanList(profile.capabilities).length === 0) return 2
  if (cleanList(profile.discovery_goals).length === 0) return 3
  return 4
}

export function cleanList(value: unknown) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((item): item is string => typeof item === "string").map(item => item.trim()).filter(Boolean))].slice(0, 20)
}

export function cleanText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}
