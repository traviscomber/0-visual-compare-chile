"use client"

import type { FormEvent } from "react"
import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClientAsync } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const cleanEmail = email.trim()
    if (!cleanEmail) {
      setError("Ingresa tu correo.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const supabase = await createClientAsync()
      if (!supabase) throw new Error("SERVICE_UNAVAILABLE")
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/update-password")}`
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo })
      if (resetError) throw resetError
      setSent(true)
    } catch {
      setError("No pudimos iniciar la recuperación. Inténtalo nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-svh bg-background px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-xl flex-col">
        <Link href="/auth/login" className="inline-flex w-fit items-center text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al acceso
        </Link>

        <div className="my-auto py-14">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">VIDENTIA / Recuperar acceso</p>
          <h1 className="mt-4 text-4xl font-medium tracking-[-0.045em] sm:text-5xl">Recupera tu contraseña.</h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
            Enviaremos un enlace para definir una nueva contraseña. Por seguridad, la respuesta es la misma aunque el correo no esté registrado.
          </p>

          {sent ? (
            <div className="mt-8 border-y border-border py-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Revisa tu correo.</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Si existe una cuenta asociada a <span className="text-foreground">{email.trim()}</span>, recibirás instrucciones para continuar.
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" className="mt-6">
                <Link href="/auth/login">Volver al acceso</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Correo</span>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nombre@empresa.cl"
                  autoComplete="email"
                  disabled={loading}
                  className="h-11 bg-card/40"
                />
              </label>

              {error ? (
                <div role="alert" className="border-l-2 border-destructive bg-destructive/[0.06] px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <Button type="submit" disabled={loading} className="h-11 w-full sm:w-auto">
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />Enviando…</>
                ) : (
                  "Enviar enlace de recuperación"
                )}
              </Button>
            </form>
          )}
        </div>

        <p className="border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
          El enlace de recuperación usa la sesión segura de VIDENTIA y sólo permite actualizar la contraseña después de validar el código recibido.
        </p>
      </div>
    </main>
  )
}
