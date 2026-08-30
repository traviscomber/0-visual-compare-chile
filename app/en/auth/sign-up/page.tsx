import { safeInternalRedirect } from "@/lib/redirect"
import { LocalizedSignUpForm } from "@/components/localized-sign-up-form"

type Params = { redirectTo?: string; marca?: string }
export default async function EnglishSignUpPage({ searchParams }: { searchParams?: Promise<Params> }) {
  const params = await searchParams
  const brand = params?.marca?.trim().slice(0, 120)
  const demoRedirect = brand ? `/investigar?q=${encodeURIComponent(brand)}&autorun=1` : undefined
  return <LocalizedSignUpForm locale="en" redirectTo={safeInternalRedirect(params?.redirectTo ?? demoRedirect)} />
}
