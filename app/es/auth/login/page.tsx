import { safeInternalRedirect } from "@/lib/redirect"
import { LocalizedLoginForm } from "@/components/localized-login-form"

function canonicalSpanishRedirect(value?: string) {
  const redirect = safeInternalRedirect(value)
  if (redirect === "/patentes") return "/es/patentes"
  if (redirect === "/tecnologias") return "/es/tecnologias"
  return redirect
}

export default async function SpanishLoginPage({ searchParams }: { searchParams?: Promise<{ redirectTo?: string }> }) {
  const params = await searchParams
  return <LocalizedLoginForm locale="es" redirectTo={canonicalSpanishRedirect(params?.redirectTo)} />
}
