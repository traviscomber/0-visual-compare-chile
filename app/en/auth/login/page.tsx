import type { Metadata } from "next"
import { safeInternalRedirect } from "@/lib/redirect"
import { LocalizedLoginForm } from "@/components/localized-login-form"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your VIDENTIA workspace.",
  robots: { index: false, follow: false },
}

function canonicalEnglishRedirect(value?: string) {
  const redirect = safeInternalRedirect(value)
  if (redirect === "/patentes" || redirect === "/en/patents") return "/patents"
  if (redirect === "/tecnologias" || redirect === "/en/technologies") return "/technologies"
  return redirect
}

export default async function EnglishLoginPage({ searchParams }: { searchParams?: Promise<{ redirectTo?: string }> }) {
  const params = await searchParams
  return <LocalizedLoginForm locale="en" redirectTo={canonicalEnglishRedirect(params?.redirectTo)} />
}
