import { createClient } from "@/lib/supabase/server"
import { safeInternalRedirect } from "@/lib/redirect"
import { ensureAccountBootstrap } from "@/lib/supabase/bootstrap-account"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const next = safeInternalRedirect(searchParams.get("next"))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        try {
          await ensureAccountBootstrap(user)
        } catch (bootstrapError) {
          console.error("[v0] account bootstrap error", bootstrapError)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
