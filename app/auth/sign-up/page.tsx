import { SignUpForm } from "./sign-up-form"
import { safeInternalRedirect } from "@/lib/redirect"

export default async function SignUpPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirectTo?: string }>
}) {
  const params = await searchParams
  return <SignUpForm redirectTo={safeInternalRedirect(params?.redirectTo)} />
}
