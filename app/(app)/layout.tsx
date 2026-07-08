import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppNav } from "@/components/app/app-nav"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name")
    .eq("id", user.id)
    .maybeSingle()

  return (
    <div className="min-h-svh bg-background flex flex-col">
      <AppNav
        userEmail={user.email ?? ""}
        fullName={profile?.full_name ?? null}
        companyName={profile?.company_name ?? null}
      />
      <main className="flex-1">{children}</main>
    </div>
  )
}
