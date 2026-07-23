import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  tryGetSupabaseAnonKey,
  tryGetSupabaseUrl,
} from "@/lib/supabase/env"

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

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

function configurationUnavailableResponse(request: NextRequest) {
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next({ request })
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Servicio de autenticacion no disponible." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    )
  }

  const url = request.nextUrl.clone()
  url.pathname = "/auth/login"
  url.search = ""
  url.searchParams.set("error", "configuration")
  return NextResponse.redirect(url)
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const canonicalPath = stripLocalePrefix(pathname)
  if (canonicalPath) {
    const url = request.nextUrl.clone()
    url.pathname = canonicalPath
    return NextResponse.redirect(url)
  }

  const supabaseUrl = tryGetSupabaseUrl()
  const supabaseAnonKey = tryGetSupabaseAnonKey()

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === "production") {
      console.error("[auth] Supabase configuration is unavailable in production")
      return configurationUnavailableResponse(request)
    }

    return NextResponse.next({ request })
  }

  let resolvedSupabaseUrl: string
  let resolvedSupabaseAnonKey: string
  try {
    resolvedSupabaseUrl = getSupabaseUrl()
    resolvedSupabaseAnonKey = getSupabaseAnonKey()
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      console.error("[auth] Supabase configuration could not be resolved", error)
      return configurationUnavailableResponse(request)
    }

    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(resolvedSupabaseUrl, resolvedSupabaseAnonKey, {
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
  })

  let user = null
  try {
    const result = await supabase.auth.getUser()
    user = result.data.user
  } catch (error) {
    console.error("[auth] Could not validate the user session", error)
    user = null
  }

  const protectedPath = isProtectedPath(pathname)

  if (protectedPath && !user) {
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
