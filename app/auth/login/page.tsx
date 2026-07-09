import { LoginForm } from "./login-form"
import { safeInternalRedirect } from "@/lib/redirect"

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { redirectTo?: string }
}) {
  return <LoginForm redirectTo={safeInternalRedirect(searchParams?.redirectTo)} />
}
