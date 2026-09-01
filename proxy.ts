import { updateSession } from "@/lib/supabase/proxy"
import { NextResponse, type NextRequest } from "next/server"

const PUBLIC_INDEXABLE_PATHS = new Set([
  "/",
  "/trademarks",
  "/patents",
  "/technologies",
  "/es",
  "/en",
  "/demo",
  "/contacto",
  "/docs",
  "/privacidad",
  "/terminos",
  "/es/marcas",
  "/es/patentes",
  "/en/patents",
  "/es/tecnologias",
  "/en/technologies",
  "/es/demo",
  "/en/demo",
  "/es/docs",
  "/en/docs",
  "/es/privacidad",
  "/en/privacidad",
  "/es/terminos",
  "/en/terminos",
])

const LEGACY_REDIRECTS: Record<string, string> = {
  "/consulta": "/demo",
  "/comparador": "/demo",
  "/brandbook": "/",
  "/casos-de-uso": "/",
}

const CANONICAL_ENGLISH_PATHS = new Set(["/", "/trademarks", "/patents", "/technologies"])

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const legacyTarget = LEGACY_REDIRECTS[pathname]

  if (legacyTarget) {
    const url = request.nextUrl.clone()
    url.pathname = legacyTarget
    url.search = ""
    return NextResponse.redirect(url, 308)
  }

  const localeSegment = pathname.split("/")[1]
  const requestHeaders = new Headers(request.headers)
  const localized = localeSegment === "es" || localeSegment === "en"

  if (localized) requestHeaders.set("x-videntia-locale", localeSegment)
  else if (CANONICAL_ENGLISH_PATHS.has(pathname)) requestHeaders.set("x-videntia-locale", "en")

  const response = await updateSession(request, requestHeaders)

  if (!PUBLIC_INDEXABLE_PATHS.has(pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive")
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
