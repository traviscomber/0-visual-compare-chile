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
    <div className="dark relative min-h-svh overflow-x-hidden bg-[#071018] text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(900px_520px_at_86%_-8%,rgba(99,199,184,0.09),transparent_62%),radial-gradient(780px_520px_at_18%_84%,rgba(70,102,130,0.09),transparent_68%),linear-gradient(180deg,#071018_0%,#09131b_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,#000_0%,transparent_88%)]"
      />

      <AppNav
        userEmail={user.email ?? ""}
        fullName={profile?.full_name ?? null}
        companyName={profile?.company_name ?? null}
      />

      <div className="relative z-10 min-w-0 lg:pl-[244px] lg:pt-[68px]">
        <main className="min-h-[calc(100svh-68px)] min-w-0">{children}</main>
      </div>
    </div>
  )
}
