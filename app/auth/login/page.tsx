import { LoginForm } from "./login-form"
import { safeInternalRedirect } from "@/lib/redirect"

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirectTo?: string }>
}) {
  const params = await searchParams
  return <LoginForm redirectTo={safeInternalRedirect(params?.redirectTo)} />
}
