import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function requireUser() {
  const supabase = await createClient()
  let user = null
  try {
    const result = await supabase.auth.getUser()
    user = result.data.user
  } catch {
    user = null
  }
  if (!user) {
    redirect("/auth/login")
  }
  return { user, supabase }
}
