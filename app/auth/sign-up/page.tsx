import { SignUpForm } from "./sign-up-form"
import { safeInternalRedirect } from "@/lib/redirect"

export default function SignUpPage({
  searchParams,
}: {
  searchParams?: { redirectTo?: string }
}) {
  return <SignUpForm redirectTo={safeInternalRedirect(searchParams?.redirectTo)} />
}
