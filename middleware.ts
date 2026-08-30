import { NextRequest, NextResponse } from "next/server"

const PUBLIC_LOCALES = new Set(["es", "en"])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const segments = pathname.split("/").filter(Boolean)
  const locale = segments[0]

  if (!PUBLIC_LOCALES.has(locale)) return NextResponse.next()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-videntia-locale", locale)

  if (segments.length <= 1) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  const target = request.nextUrl.clone()
  target.pathname = `/${segments.slice(1).join("/")}`

  return NextResponse.rewrite(target, { request: { headers: requestHeaders } })
}

export const config = {
  matcher: ["/es/:path*", "/en/:path*"],
}
