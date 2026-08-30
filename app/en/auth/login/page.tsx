import { safeInternalRedirect } from "@/lib/redirect"
import { LocalizedLoginForm } from "@/components/localized-login-form"

export default async function EnglishLoginPage({ searchParams }: { searchParams?: Promise<{ redirectTo?: string }> }) {
  const params = await searchParams
  return <LocalizedLoginForm locale="en" redirectTo={safeInternalRedirect(params?.redirectTo)} />
}
