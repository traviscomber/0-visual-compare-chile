import { updateSession } from "@/lib/supabase/proxy"
import { NextResponse, type NextRequest } from "next/server"

const PUBLIC_INDEXABLE_PATHS = new Set(["/", "/demo", "/contacto", "/docs"])
const LEGACY_REDIRECTS: Record<string, string> = {
  "/consulta": "/demo",
  "/comparador": "/demo",
  "/brandbook": "/",
  "/casos-de-uso": "/",
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const legacyTarget = LEGACY_REDIRECTS[pathname]

  if (legacyTarget) {
    const url = request.nextUrl.clone()
    url.pathname = legacyTarget
    url.search = ""
    return NextResponse.redirect(url, 308)
  }

  const response = await updateSession(request)

  if (!PUBLIC_INDEXABLE_PATHS.has(pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive")
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
