"use client"

import type { ChangeEvent, FormEvent } from "react"
import Link from "next/link"
import { Eye } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClientAsync } from "@/lib/supabase/client"
import { safeInternalRedirect } from "@/lib/redirect"

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const next = safeInternalRedirect(redirectTo)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  useEffect(() => {
    let active = true

    const recoverExistingSession = async () => {
      const supabase = await createClientAsync()
      if (!active || !supabase) return

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (active && user) {
        // Force a document navigation so the server-side auth guard sees fresh auth cookies.
        window.location.assign(next)
      }
    }

    void recoverExistingSession()

    return () => {
      active = false
    }
  }, [next])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!formData.email || !formData.password) {
      setError("Por favor completa todos los campos")
      setLoading(false)
      return
    }

    try {
      const supabase = await createClientAsync()
      if (!supabase) {
        throw new Error("Supabase no está configurado. Verifica las variables de entorno.")
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (signInError) {
        throw signInError
      }

      // A full reload is more reliable here than client-side navigation because
      // the protected app routes read auth from server cookies immediately.
      window.location.assign(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesion. Verifica tus datos.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Eye className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Visual Compare Chile</span>
          </Link>
          <h1 className="mb-2 text-3xl font-bold text-foreground">Inicia sesion</h1>
          <p className="text-muted-foreground">Continua con tu cuenta</p>
        </div>

        <Card className="border-border p-8">
          {error && (
            <div className="mb-6 rounded border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Correo electronico</label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Contrasena</label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="********"
                disabled={loading}
              />
            </div>

            <div className="text-right">
              <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                Olvidaste tu contrasena?
              </Link>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90">
              {loading ? "Iniciando sesion..." : "Iniciar sesion"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            No tienes cuenta?{" "}
            <Link
              href={`/auth/sign-up?redirectTo=${encodeURIComponent(next)}`}
              className="text-primary hover:underline"
            >
              Registrate gratis
            </Link>
          </div>
        </Card>

        <div className="mt-6 rounded border border-blue-500/30 bg-primary/5 p-4 text-center text-sm text-muted-foreground">
          <p>Usa tu cuenta Supabase para entrar</p>
        </div>
      </div>
    </div>
  )
}
