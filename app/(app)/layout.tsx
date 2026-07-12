import type React from "react"
import { redirect } from "next/navigation"
import { tryGetSupabaseUrl, tryGetSupabaseAnonKey } from "@/lib/supabase/env"
import { AppNav } from "@/components/app/app-nav"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Guard: if Supabase is not configured, skip auth check and render with guest nav
  const supabaseReady = !!(tryGetSupabaseUrl() && tryGetSupabaseAnonKey())

  let user = null
  let profile: { full_name: string | null; company_name: string | null } | null = null

  if (supabaseReady) {
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
        // Silently ignore if profiles table doesn't exist yet (PGRST205)
        if (!error || (error as { code?: string }).code === "PGRST205") {
          profile = data ?? null
        }
      }
    } catch {
      user = null
    }

    if (!user) {
      redirect("/auth/login")
    }
  }

  return (
    <div className="min-h-svh bg-background flex flex-col">
      <AppNav
        userEmail={user?.email ?? "demo@visualcompare.cl"}
        fullName={profile?.full_name ?? null}
        companyName={profile?.company_name ?? null}
      />
      <main className="flex-1">{children}</main>
    </div>
  )
}
