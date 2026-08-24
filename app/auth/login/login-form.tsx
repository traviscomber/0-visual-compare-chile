"use client"

import type { ChangeEvent, FormEvent } from "react"
import Link from "next/link"
import { useEffect, useState } from "react"
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
      const { data: { user } } = await supabase.auth.getUser()
      if (active && user) window.location.assign(next)
    }
    void recoverExistingSession()
    return () => { active = false }
  }, [next])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!formData.email || !formData.password) {
      setError("Completa tu correo y contraseña.")
      setLoading(false)
      return
    }

    try {
      const supabase = await createClientAsync()
      if (!supabase) throw new Error("SERVICE_UNAVAILABLE")
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: formData.email, password: formData.password })
      if (signInError) throw signInError
      window.location.assign(next)
    } catch {
      setError("No pudimos iniciar sesión. Revisa tus datos e inténtalo nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F8F6] px-5 py-10 text-[#111827]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center">
        <Link href="/" aria-label="Volver a VIDENTIA" className="mb-12 inline-flex w-fit items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-[9px] bg-[#111827] text-sm font-semibold text-white">V</span>
          <span className="leading-none">
            <span className="block text-[15px] font-semibold tracking-[0.16em]">VIDENTIA</span>
            <span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.18em] text-[#98A2B3]">by N3uralia</span>
          </span>
        </Link>

        <section>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0F766E]">Acceso</p>
          <h1 className="mt-4 text-4xl font-normal tracking-[-0.045em]">Entra a tu espacio de trabajo.</h1>
          <p className="mt-3 text-sm leading-6 text-[#667085]">Usa las credenciales de tu organización.</p>

          {error ? <div className="mt-7 border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Correo</span>
              <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="nombre@empresa.cl" disabled={loading} autoComplete="email" className="h-11 rounded-md border-black/15 bg-white shadow-none" />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Contraseña</span>
              <Input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" disabled={loading} autoComplete="current-password" className="h-11 rounded-md border-black/15 bg-white shadow-none" />
            </label>

            <div className="flex items-center justify-between gap-4 text-sm">
              <Link href="/auth/forgot-password" className="text-[#667085] hover:text-[#111827]">Olvidé mi contraseña</Link>
            </div>

            <Button type="submit" disabled={loading} className="h-11 w-full rounded-md bg-[#111827] text-white shadow-none hover:bg-[#273244]">
              {loading ? "Entrando…" : "Entrar"}
            </Button>
          </form>

          <div className="mt-8 border-t border-black/10 pt-6 text-sm text-[#667085]">
            ¿Necesitas acceso? <Link href="/contacto" className="font-semibold text-[#0F766E] hover:text-[#134E4A]">Habla con N3uralia</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
