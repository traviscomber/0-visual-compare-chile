import type React from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { tryGetSupabaseUrl, tryGetSupabaseAnonKey } from "@/lib/supabase/env"
import { AppNav } from "@/components/app/app-nav"
import { FreePreviewShell } from "@/components/app/free-preview-shell"
import { isFreeAccessUser } from "@/lib/free-research-quota"

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabaseReady = !!(tryGetSupabaseUrl() && tryGetSupabaseAnonKey())
  if (!supabaseReady) redirect("/auth/login?error=configuration")

  let user = null
  let profile: { full_name: string | null; company_name: string | null } | null = null

  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    const result = await supabase.auth.getUser()
    user = result.data.user ?? null

    if (user) {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, company_name")
        .eq("id", user.id)
        .maybeSingle()
      if (!error) profile = data ?? null
    }
  } catch {
    user = null
  }

  if (!user) redirect("/auth/login")

  if (isFreeAccessUser(user)) {
    return <FreePreviewShell userEmail={user.email ?? ""}>{children}</FreePreviewShell>
  }

  let onboardingComplete = true
  try {
    const { getOrCreatePrimaryOrganization, ensureOrganizationIntelligenceProfile } = await import("@/lib/onboarding/server")
    const organization = await getOrCreatePrimaryOrganization(user)
    const strategicProfile = await ensureOrganizationIntelligenceProfile(user, organization)
    onboardingComplete = Boolean(strategicProfile.onboarding_completed_at)
  } catch (error) {
    console.error("[app-layout:onboarding]", error)
  }

  if (!onboardingComplete) redirect("/onboarding")

  const metadataName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null
  const metadataCompany = typeof user.user_metadata?.company_name === "string" ? user.user_metadata.company_name : null

  return (
    <AppNav
      userEmail={user.email ?? ""}
      fullName={profile?.full_name ?? metadataName}
      companyName={profile?.company_name ?? metadataCompany}
    >
      {children}
    </AppNav>
  )
}
