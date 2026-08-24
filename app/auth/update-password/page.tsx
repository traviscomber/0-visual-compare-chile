"use client"

import type { FormEvent } from "react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClientAsync } from "@/lib/supabase/client"

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [checking, setChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const verifySession = async () => {
      try {
        const supabase = await createClientAsync()
        if (!supabase) return
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (active) setAuthorized(Boolean(user))
      } finally {
        if (active) setChecking(false)
      }
    }
    void verifySession()
    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.")
      return
    }
    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }

    setLoading(true)
    try {
      const supabase = await createClientAsync()
      if (!supabase) throw new Error("SERVICE_UNAVAILABLE")
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setDone(true)
    } catch {
      setError("No pudimos actualizar la contraseña. Solicita un nuevo enlace e inténtalo nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-svh bg-background px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-xl flex-col justify-center">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">VIDENTIA / Nueva contraseña</p>

        {checking ? (
          <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> Validando enlace…
          </div>
        ) : !authorized ? (
          <div className="mt-6 border-y border-border py-6">
            <h1 className="text-3xl font-medium tracking-[-0.04em]">El enlace ya no es válido.</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Solicita un nuevo enlace de recuperación para continuar de forma segura.
            </p>
            <Button asChild className="mt-6">
              <Link href="/auth/forgot-password">Solicitar nuevo enlace</Link>
            </Button>
          </div>
        ) : done ? (
          <div className="mt-6 border-y border-border py-6">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <h1 className="mt-4 text-4xl font-medium tracking-[-0.045em]">Contraseña actualizada.</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Ya puedes volver a VIDENTIA con tu nueva contraseña.</p>
            <Button asChild className="mt-6">
              <Link href="/dashboard">Ir al espacio de trabajo</Link>
            </Button>
          </div>
        ) : (
          <>
            <h1 className="mt-4 text-4xl font-medium tracking-[-0.045em] sm:text-5xl">Define una nueva contraseña.</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
              Usa al menos 8 caracteres y evita reutilizar una contraseña de otro servicio.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Nueva contraseña</span>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                  className="h-11 bg-card/40"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Repetir contraseña</span>
                <Input
                  type="password"
                  value={repeatPassword}
                  onChange={(event) => setRepeatPassword(event.target.value)}
                  autoComplete="new-password"
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
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />Actualizando…</>
                ) : (
                  "Guardar nueva contraseña"
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
