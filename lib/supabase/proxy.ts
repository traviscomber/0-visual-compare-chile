import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env"

const PROTECTED_PATHS = ["/dashboard", "/compare", "/comparisons", "/settings", "/history", "/reportes", "/admin"]
const SUPPORTED_LOCALES = new Set(["es", "en"])

function stripLocalePrefix(pathname: string) {
  const segments = pathname.split("/")
  const locale = segments[1]

  if (!locale || !SUPPORTED_LOCALES.has(locale)) {
    return null
  }

  const stripped = `/${segments.slice(2).join("/")}`.replace(/\/+$/, "")
  return stripped === "/" || stripped === "" ? "/" : stripped
}

export async function updateSession(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request })
  }

  let supabaseUrl: string
  let supabaseAnonKey: string
  try {
    supabaseUrl = getSupabaseUrl()
    supabaseAnonKey = getSupabaseAnonKey()
  } catch {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  let user = null
  try {
    const result = await supabase.auth.getUser()
    user = result.data.user
  } catch {
    user = null
  }

  const pathname = request.nextUrl.pathname
  const canonicalPath = stripLocalePrefix(pathname)
  if (canonicalPath) {
    const url = request.nextUrl.clone()
    url.pathname = canonicalPath
    return NextResponse.redirect(url)
  }

  const isProtected = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(url)
  }

  if ((pathname === "/auth/login" || pathname === "/auth/sign-up" || pathname === "/auth/signup") && user) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
