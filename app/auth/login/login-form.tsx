"use client"

import type { ChangeEvent, FormEvent } from "react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClientAsync } from "@/lib/supabase/client"
import { safeInternalRedirect } from "@/lib/redirect"

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const next = safeInternalRedirect(redirectTo)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({ email: "", password: "" })

  useEffect(() => {
    let active = true
    const recoverExistingSession = async () => {
      const supabase = await createClientAsync()
      if (!active || !supabase) return
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (active && user) window.location.assign(next)
    }
    void recoverExistingSession()
    return () => {
      active = false
    }
  }, [next])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!formData.email || !formData.password) {
      setError("Completa tu correo y contraseña.")
      return
    }

    setLoading(true)
    try {
      const supabase = await createClientAsync()
      if (!supabase) throw new Error("SERVICE_UNAVAILABLE")
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      })
      if (signInError) throw signInError
      window.location.assign(next)
    } catch {
      setError("No pudimos iniciar sesión. Revisa tus datos e inténtalo nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto grid min-h-svh w-full max-w-[1480px] lg:grid-cols-[0.92fr_1.08fr]">
        <section className="flex min-h-svh flex-col border-r border-border px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
          <Link href="/" aria-label="Volver a VIDENTIA" className="inline-flex w-fit items-center gap-3">
            <span className="grid h-9 w-9 place-items-center border border-primary/40 bg-primary/[0.08] text-sm font-semibold text-primary">V</span>
            <span className="leading-none">
              <span className="block text-sm font-semibold tracking-[0.16em]">VIDENTIA</span>
              <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">by N3uralia</span>
            </span>
          </Link>

          <div className="my-auto w-full max-w-md py-16 lg:py-20">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Acceso</p>
            <h1 className="mt-4 text-4xl font-medium tracking-[-0.045em] sm:text-5xl">Entra a tu espacio de trabajo.</h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
              Investiga antecedentes, revisa evidencia, gestiona casos y vigila cambios desde un mismo sistema.
            </p>

            {error ? (
              <div role="alert" className="mt-7 border-l-2 border-destructive bg-destructive/[0.06] px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Correo</span>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nombre@empresa.cl"
                  disabled={loading}
                  autoComplete="email"
                  className="h-11 bg-card/40 shadow-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">Contraseña</span>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="current-password"
                  className="h-11 bg-card/40 shadow-none"
                />
              </label>

              <div className="flex items-center justify-between gap-4 text-sm">
                <Link href="/auth/forgot-password" className="text-muted-foreground transition-colors hover:text-foreground">
                  Recuperar contraseña
                </Link>
              </div>

              <Button type="submit" disabled={loading} className="h-11 w-full">
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />Entrando…</>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <div className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">
              ¿Necesitas acceso?{" "}
              <Link href="/contacto" className="font-medium text-primary transition-colors hover:text-primary/80">
                Habla con N3uralia
              </Link>
            </div>
          </div>
        </section>

        <aside className="hidden min-h-svh flex-col justify-between bg-card/20 px-12 py-10 lg:flex">
          <div className="flex justify-end">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Fuente → evidencia → contexto → acción</span>
          </div>
          <div className="max-w-xl pb-12">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">VIDENTIA / inteligencia marcaria</p>
            <p className="mt-5 text-3xl font-medium leading-tight tracking-[-0.035em] text-foreground">
              Busca. Entiende.<br />Decide. Vigila.
            </p>
            <div className="mt-8 divide-y divide-border border-y border-border">
              <AuthPrinciple number="01" title="Fuente visible" text="El origen y la disponibilidad de la evidencia no se ocultan." />
              <AuthPrinciple number="02" title="Señales separadas" text="La prioridad organiza revisión; no reemplaza el juicio jurídico." />
              <AuthPrinciple number="03" title="Trazabilidad" text="Casos, decisiones y cambios conservan contexto para volver a revisar." />
            </div>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">VIDENTIA · by N3uralia</p>
        </aside>
      </div>
    </main>
  )
}

function AuthPrinciple({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="grid grid-cols-[36px_1fr] gap-4 py-4">
      <span className="font-mono text-[10px] text-primary">{number}</span>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}
