"use client"

import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { safeInternalRedirect } from "@/lib/redirect"

export function SignUpForm({ redirectTo }: { redirectTo: string }) {
  const next = safeInternalRedirect(redirectTo)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.")
      return
    }

    const supabase = createClient()
    if (!supabase) {
      setError("El servicio de acceso no está disponible en este momento.")
      return
    }

    setIsLoading(true)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          data: {
            full_name: fullName.trim(),
            company_name: companyName.trim(),
          },
        },
      })

      if (signUpError) throw signUpError

      if (data.session) {
        router.replace(next)
        router.refresh()
        return
      }

      router.push(`/auth/sign-up-success?next=${encodeURIComponent(next)}`)
    } catch {
      setError("No pudimos crear la cuenta. Revisa los datos e inténtalo nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto grid min-h-svh w-full max-w-[1480px] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex min-h-svh flex-col border-r border-border px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
          <Link href="/" aria-label="Volver a VIDENTIA" className="inline-flex w-fit items-center gap-3">
            <span className="grid h-9 w-9 place-items-center border border-primary/40 bg-primary/[0.08] text-sm font-semibold text-primary">V</span>
            <span className="leading-none">
              <span className="block text-sm font-semibold tracking-[0.16em]">VIDENTIA</span>
              <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">by N3uralia</span>
            </span>
          </Link>

          <div className="my-auto w-full max-w-xl py-12 lg:py-16">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Crear acceso</p>
            <h1 className="mt-4 text-4xl font-medium tracking-[-0.045em] sm:text-5xl">Crea tu espacio de trabajo.</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
              Tu cuenta conserva investigaciones, comparaciones y decisiones trazables dentro de VIDENTIA.
            </p>

            <form onSubmit={handleSignUp} className="mt-8 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="fullName" className="mb-2 block">Nombre completo</Label>
                  <Input id="fullName" type="text" required value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" className="h-11 bg-card/40" />
                </div>
                <div>
                  <Label htmlFor="companyName" className="mb-2 block">Organización</Label>
                  <Input id="companyName" type="text" value={companyName} onChange={(event) => setCompanyName(event.target.value)} autoComplete="organization" className="h-11 bg-card/40" />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="mb-2 block">Correo electrónico</Label>
                <Input id="email" type="email" placeholder="nombre@empresa.cl" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="h-11 bg-card/40" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="password" className="mb-2 block">Contraseña</Label>
                  <Input id="password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" className="h-11 bg-card/40" />
                  <p className="mt-2 text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
                </div>
                <div>
                  <Label htmlFor="repeatPassword" className="mb-2 block">Repetir contraseña</Label>
                  <Input id="repeatPassword" type="password" required value={repeatPassword} onChange={(event) => setRepeatPassword(event.target.value)} autoComplete="new-password" className="h-11 bg-card/40" />
                </div>
              </div>

              {error ? (
                <div role="alert" className="flex items-start gap-2 border-l-2 border-destructive bg-destructive/[0.06] px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <Button type="submit" disabled={isLoading} className="h-11 w-full sm:w-auto">
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />Creando cuenta…</>
                ) : (
                  "Crear cuenta"
                )}
              </Button>

              <p className="text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <Link href={`/auth/login?redirectTo=${encodeURIComponent(next)}`} className="font-medium text-primary hover:text-primary/80">
                  Iniciar sesión
                </Link>
              </p>
            </form>
          </div>
        </section>

        <aside className="hidden min-h-svh flex-col justify-between bg-card/20 px-12 py-10 lg:flex">
          <div className="flex justify-end">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Cuenta → evidencia → decisiones</span>
          </div>
          <div className="max-w-lg pb-12">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Un sistema, no herramientas aisladas</p>
            <p className="mt-5 text-3xl font-medium leading-tight tracking-[-0.035em]">
              Tu contexto permanece unido desde la primera búsqueda hasta la vigilancia posterior.
            </p>
            <div className="mt-8 divide-y divide-border border-y border-border text-sm">
              <AuthLine number="01" text="Investigaciones y fuentes consultadas." />
              <AuthLine number="02" text="Evidencia y comparaciones persistidas." />
              <AuthLine number="03" text="Casos, revisiones y señales nuevas." />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">VIDENTIA · by N3uralia</p>
        </aside>
      </div>
    </main>
  )
}

function AuthLine({ number, text }: { number: string; text: string }) {
  return (
    <div className="grid grid-cols-[36px_1fr] gap-4 py-4">
      <span className="font-mono text-[10px] text-primary">{number}</span>
      <span className="leading-6 text-muted-foreground">{text}</span>
    </div>
  )
}
