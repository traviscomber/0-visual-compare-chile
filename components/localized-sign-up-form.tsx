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
import { localePath, type PublicLocale } from "@/lib/marketing-locale"

const copy = {
  es: {
    back: "Volver a VIDENTIA",
    eyebrow: "Vista preliminar",
    title: "Evalúa VIDENTIA para tu organización.",
    body: "Crea un acceso preliminar con 3 vistas al mes. Sirve para comprobar cobertura y coincidencias antes de solicitar el workspace empresarial.",
    fullName: "Nombre completo",
    company: "Empresa u organización",
    companyPlaceholder: "Ejemplo: Estudio Legal Sur",
    email: "Correo de trabajo",
    emailPlaceholder: "nombre@empresa.cl",
    emailHelp: "Usa el correo con el que quieres asociar la evaluación de tu organización.",
    password: "Contraseña",
    passwordHelp: "Mínimo 8 caracteres.",
    repeat: "Repetir contraseña",
    create: "Crear acceso preliminar",
    creating: "Creando acceso…",
    existing: "¿Ya tienes acceso?",
    login: "Iniciar sesión",
    companyError: "Indica la empresa u organización con la que quieres evaluar VIDENTIA.",
    passwordMismatch: "Las contraseñas no coinciden.",
    passwordLength: "La contraseña debe tener al menos 8 caracteres.",
    serviceError: "El servicio de acceso no está disponible en este momento.",
    genericError: "No pudimos crear el acceso preliminar. Revisa los datos e inténtalo nuevamente.",
    sideEyebrow: "Antes del workspace",
    sideTitle: "Comprueba si VIDENTIA encaja con el trabajo de tu organización antes de solicitar acceso completo.",
    lines: ["3 vistas preliminares al mes.", "Muestra limitada de coincidencias, estados y clases.", "Sin recomendaciones, estrategia ni asesoría jurídica."],
    flow: "Demo → preview → empresa",
  },
  en: {
    back: "Back to VIDENTIA",
    eyebrow: "Preliminary view",
    title: "Evaluate VIDENTIA for your organization.",
    body: "Create preliminary access with 3 views per month. It lets your team verify coverage and matches before requesting an enterprise workspace.",
    fullName: "Full name",
    company: "Company or organization",
    companyPlaceholder: "Example: South Legal Partners",
    email: "Work email",
    emailPlaceholder: "name@company.com",
    emailHelp: "Use the email you want associated with your organization's evaluation.",
    password: "Password",
    passwordHelp: "At least 8 characters.",
    repeat: "Repeat password",
    create: "Create preliminary access",
    creating: "Creating access…",
    existing: "Already have access?",
    login: "Sign in",
    companyError: "Enter the company or organization evaluating VIDENTIA.",
    passwordMismatch: "Passwords do not match.",
    passwordLength: "The password must contain at least 8 characters.",
    serviceError: "The access service is not available right now.",
    genericError: "We could not create preliminary access. Check the information and try again.",
    sideEyebrow: "Before the workspace",
    sideTitle: "Check whether VIDENTIA fits your organization's workflow before requesting full access.",
    lines: ["3 preliminary views per month.", "Limited sample of matches, statuses and classes.", "No recommendations, strategy or legal advice."],
    flow: "Demo → preview → enterprise",
  },
} as const

export function LocalizedSignUpForm({ redirectTo, locale }: { redirectTo: string; locale: PublicLocale }) {
  const t = copy[locale]
  const next = safeInternalRedirect(redirectTo)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (companyName.trim().length < 2) return setError(t.companyError)
    if (password !== repeatPassword) return setError(t.passwordMismatch)
    if (password.length < 8) return setError(t.passwordLength)

    const supabase = createClient()
    if (!supabase) return setError(t.serviceError)

    setIsLoading(true)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          data: { full_name: fullName.trim(), company_name: companyName.trim(), access_tier: "free" },
        },
      })
      if (signUpError) throw signUpError
      if (data.session) {
        router.replace(next)
        router.refresh()
        return
      }
      router.push(`${localePath(locale, "/auth/sign-up-success")}?next=${encodeURIComponent(next)}`)
    } catch {
      setError(t.genericError)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto grid min-h-svh w-full max-w-[1480px] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex min-h-svh flex-col border-r border-border px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
          <Link href={localePath(locale)} aria-label={t.back} className="inline-flex w-fit items-center gap-3"><span className="grid h-9 w-9 place-items-center border border-primary/40 bg-primary/[0.08] text-sm font-semibold text-primary">V</span><span className="leading-none"><span className="block text-sm font-semibold tracking-[0.16em]">VIDENTIA</span><span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">by N3uralia</span></span></Link>
          <div className="my-auto w-full max-w-lg py-12 lg:py-16">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">{t.eyebrow}</p>
            <h1 className="mt-4 text-4xl font-medium tracking-[-0.045em] sm:text-5xl">{t.title}</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">{t.body}</p>
            <form onSubmit={handleSignUp} className="mt-8 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label htmlFor={`fullName-${locale}`} className="mb-2 block">{t.fullName}</Label><Input id={`fullName-${locale}`} type="text" required value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" className="h-11 bg-card/40" /></div>
                <div><Label htmlFor={`companyName-${locale}`} className="mb-2 block">{t.company}</Label><Input id={`companyName-${locale}`} type="text" required value={companyName} onChange={(event) => setCompanyName(event.target.value)} autoComplete="organization" placeholder={t.companyPlaceholder} className="h-11 bg-card/40" /></div>
              </div>
              <div><Label htmlFor={`email-${locale}`} className="mb-2 block">{t.email}</Label><Input id={`email-${locale}`} type="email" placeholder={t.emailPlaceholder} required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="h-11 bg-card/40" /><p className="mt-2 text-xs text-muted-foreground">{t.emailHelp}</p></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label htmlFor={`password-${locale}`} className="mb-2 block">{t.password}</Label><Input id={`password-${locale}`} type="password" required value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" className="h-11 bg-card/40" /><p className="mt-2 text-xs text-muted-foreground">{t.passwordHelp}</p></div>
                <div><Label htmlFor={`repeatPassword-${locale}`} className="mb-2 block">{t.repeat}</Label><Input id={`repeatPassword-${locale}`} type="password" required value={repeatPassword} onChange={(event) => setRepeatPassword(event.target.value)} autoComplete="new-password" className="h-11 bg-card/40" /></div>
              </div>
              {error ? <div role="alert" className="flex items-start gap-2 border-l-2 border-destructive bg-destructive/[0.06] px-4 py-3 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div> : null}
              <Button type="submit" disabled={isLoading} className="h-11 w-full sm:w-auto">{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />{t.creating}</> : t.create}</Button>
              <p className="text-sm text-muted-foreground">{t.existing} <Link href={`${localePath(locale, "/auth/login")}?redirectTo=${encodeURIComponent(next)}`} className="font-medium text-primary hover:text-primary/80">{t.login}</Link></p>
            </form>
          </div>
        </section>
        <aside className="hidden min-h-svh flex-col justify-between bg-card/20 px-12 py-10 lg:flex"><div className="flex justify-end"><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{t.flow}</span></div><div className="max-w-lg pb-12"><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">{t.sideEyebrow}</p><p className="mt-5 text-3xl font-medium leading-tight tracking-[-0.035em]">{t.sideTitle}</p><div className="mt-8 divide-y divide-border border-y border-border text-sm">{t.lines.map((line, index) => <div key={line} className="grid grid-cols-[36px_1fr] gap-4 py-4"><span className="font-mono text-[10px] text-primary">0{index + 1}</span><span className="leading-6 text-muted-foreground">{line}</span></div>)}</div></div><p className="text-xs text-muted-foreground">VIDENTIA · by N3uralia</p></aside>
      </div>
    </main>
  )
}
