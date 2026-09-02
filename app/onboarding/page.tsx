import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { StrategicOnboarding } from "@/components/onboarding/strategic-onboarding"
import { isFreeAccessUser } from "@/lib/free-research-quota"
import { getOrCreatePrimaryOrganization, ensureOrganizationIntelligenceProfile } from "@/lib/onboarding/server"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Configura tu investigación | VIDENTIA",
  robots: { index: false, follow: false, nocache: true },
}

export const dynamic = "force-dynamic"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) redirect("/auth/login")
  if (isFreeAccessUser(user)) redirect("/dashboard")

  const organization = await getOrCreatePrimaryOrganization(user)
  const profile = await ensureOrganizationIntelligenceProfile(user, organization)

  if (profile.onboarding_completed_at) redirect("/dashboard")

  return <StrategicOnboarding organization={organization} initialProfile={profile} />
}
