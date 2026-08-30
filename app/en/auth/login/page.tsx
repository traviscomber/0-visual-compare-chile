import type { Metadata } from "next"
import { safeInternalRedirect } from "@/lib/redirect"
import { LocalizedLoginForm } from "@/components/localized-login-form"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your VIDENTIA workspace.",
  robots: { index: false, follow: false },
}

export default async function EnglishLoginPage({ searchParams }: { searchParams?: Promise<{ redirectTo?: string }> }) {
  const params = await searchParams
  return <LocalizedLoginForm locale="en" redirectTo={safeInternalRedirect(params?.redirectTo)} />
}
