"use client"

import { useState } from "react"
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { PublicLocale } from "@/lib/marketing-locale"

const copy = {
  es: {
    title: "Solicita acceso empresarial",
    body: "Tres datos. El equipo revisa el contexto y te contacta para definir alcance y habilitación.",
    company: "Empresa u organización",
    users: "Número aproximado de usuarios",
    usersPlaceholder: "Ej. 8",
    use: "Uso esperado",
    usePlaceholder: "Ej. investigación previa, cartera de marcas, vigilancia y trabajo del equipo legal.",
    send: "Enviar solicitud",
    sending: "Enviando solicitud",
    expired: "Tu sesión expiró. Inicia sesión y vuelve a intentarlo.",
    failed: "No pudimos registrar la solicitud. Inténtalo nuevamente.",
    doneTitle: "Solicitud recibida.",
    doneBody: "El equipo revisará la organización, cantidad de usuarios y uso esperado antes de habilitar el acceso empresarial.",
    context: "Contexto conservado",
  },
  en: {
    title: "Request enterprise access",
    body: "Three details. The team reviews the context and contacts you to define scope and activation.",
    company: "Company or organization",
    users: "Approximate number of users",
    usersPlaceholder: "e.g. 8",
    use: "Expected use",
    usePlaceholder: "e.g. clearance research, trademark portfolio, monitoring and legal team workflows.",
    send: "Send request",
    sending: "Sending request",
    expired: "Your session expired. Sign in and try again.",
    failed: "We could not register the request. Please try again.",
    doneTitle: "Request received.",
    doneBody: "The team will review your organization, number of users and expected use before enabling enterprise access.",
    context: "Context preserved",
  },
} as const

type Props = { initialCompany: string; brandContext: string; locale: PublicLocale }

export function LocalizedEnterpriseAccessForm({ initialCompany, brandContext, locale }: Props) {
  const t = copy[locale]
  const [companyName, setCompanyName] = useState(initialCompany)
  const [userCount, setUserCount] = useState("")
  const [useCase, setUseCase] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const response = await fetch("/api/enterprise-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, userCount: userCount ? Number(userCount) : null, useCase, brandContext }),
      })
      if (!response.ok) {
        if (response.status === 401) throw new Error(t.expired)
        throw new Error(t.failed)
      }
      setDone(true)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.failed)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return <div className="border-y border-[#263D44] py-9"><CheckCircle2 className="h-5 w-5 text-[#96B5A6]" /><h2 className="mt-5 text-3xl font-light tracking-[-0.04em] text-[#E7DFCE]">{t.doneTitle}</h2><p className="mt-4 max-w-lg text-sm leading-7 text-[#BDBEBD]">{t.doneBody}</p>{brandContext ? <p className="mt-3 text-xs text-[#96B5A6]">{t.context}: {brandContext}</p> : null}</div>
  }

  return (
    <form onSubmit={submit} className="border-y border-[#263D44] py-8">
      <h2 className="text-2xl font-light tracking-[-0.03em] text-[#E7DFCE]">{t.title}</h2>
      <p className="mt-3 max-w-lg text-sm leading-6 text-[#BDBEBD]">{t.body}</p>
      <div className="mt-7 space-y-5">
        <div><Label htmlFor={`enterprise-company-${locale}`} className="mb-2 block text-[#D8DDDB]">{t.company}</Label><Input id={`enterprise-company-${locale}`} value={companyName} onChange={(event) => setCompanyName(event.target.value)} required maxLength={160} className="h-11 border-[#314950] bg-[#0B222A]" /></div>
        <div><Label htmlFor={`enterprise-users-${locale}`} className="mb-2 block text-[#D8DDDB]">{t.users}</Label><Input id={`enterprise-users-${locale}`} type="number" min={1} max={100000} inputMode="numeric" value={userCount} onChange={(event) => setUserCount(event.target.value)} placeholder={t.usersPlaceholder} className="h-11 border-[#314950] bg-[#0B222A]" /></div>
        <div><Label htmlFor={`enterprise-use-${locale}`} className="mb-2 block text-[#D8DDDB]">{t.use}</Label><textarea id={`enterprise-use-${locale}`} required minLength={8} maxLength={1200} rows={5} value={useCase} onChange={(event) => setUseCase(event.target.value)} placeholder={t.usePlaceholder} className="w-full resize-y border border-[#314950] bg-[#0B222A] px-3 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#71807F] focus:border-[#4A7F74]" /></div>
      </div>
      {error ? <p role="alert" className="mt-4 text-sm text-red-200">{error}</p> : null}
      <Button type="submit" disabled={loading} className="mt-7 min-h-11 bg-[#4A7F74] px-5 text-white hover:bg-[#568D81]">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : null}{loading ? t.sending : t.send}{!loading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}</Button>
    </form>
  )
}
