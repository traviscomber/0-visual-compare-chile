import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { safeInternalRedirect } from "@/lib/redirect"

export default function SignUpSuccessPage({
  searchParams,
}: {
  searchParams?: { next?: string }
}) {
  const next = safeInternalRedirect(searchParams?.next)

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md rounded-2xl">
        <CardHeader>
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <CardTitle>Revisa tu correo</CardTitle>
          <CardDescription>
            Te enviamos un correo de confirmacion. Confirma tu cuenta para acceder a Visual Compare Chile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full bg-transparent">
            <Link href={`/auth/login?redirectTo=${encodeURIComponent(next)}`}>Volver al inicio de sesion</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
