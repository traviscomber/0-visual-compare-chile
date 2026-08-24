import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AuthErrorPage() {
  return (
    <main className="min-h-svh bg-background px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-xl flex-col justify-center">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">VIDENTIA / Acceso</p>
        <AlertTriangle className="mt-6 h-6 w-6 text-warning" />
        <h1 className="mt-4 text-4xl font-medium tracking-[-0.045em] sm:text-5xl">No pudimos validar el enlace.</h1>
        <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
          El código puede haber expirado, sido utilizado previamente o no corresponder a esta sesión. Ningún cambio fue aplicado.
        </p>
        <div className="mt-8 flex flex-wrap gap-2 border-y border-border py-5">
          <Button asChild>
            <Link href="/auth/login">Volver al acceso</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/auth/forgot-password">Recuperar contraseña</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
