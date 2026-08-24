import type React from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { tryGetSupabaseUrl, tryGetSupabaseAnonKey } from "@/lib/supabase/env"
import { AppNav } from "@/components/app/app-nav"

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

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppNav
        userEmail={user.email ?? ""}
        fullName={profile?.full_name ?? null}
        companyName={profile?.company_name ?? null}
      />
      <main className="flex-1">{children}</main>
    </div>
  )
}
