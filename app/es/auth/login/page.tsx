import { safeInternalRedirect } from "@/lib/redirect"
import { LocalizedLoginForm } from "@/components/localized-login-form"

export default async function SpanishLoginPage({ searchParams }: { searchParams?: Promise<{ redirectTo?: string }> }) {
  const params = await searchParams
  return <LocalizedLoginForm locale="es" redirectTo={safeInternalRedirect(params?.redirectTo)} />
}
