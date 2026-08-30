import { SignUpForm } from "./sign-up-form"
import { safeInternalRedirect } from "@/lib/redirect"

type SignUpSearchParams = {
  redirectTo?: string
  marca?: string
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams?: Promise<SignUpSearchParams>
}) {
  const params = await searchParams
  const marca = params?.marca?.trim().slice(0, 120)
  const demoRedirect = marca ? `/investigar?q=${encodeURIComponent(marca)}&autorun=1` : undefined
  const redirectTo = safeInternalRedirect(params?.redirectTo ?? demoRedirect)

  return <SignUpForm redirectTo={redirectTo} />
}
