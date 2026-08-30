"use client"

import { useState } from "react"
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  initialCompany: string
  brandContext: string
}

export function EnterpriseAccessForm({ initialCompany, brandContext }: Props) {
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
        body: JSON.stringify({
          companyName,
          userCount: userCount ? Number(userCount) : null,
          useCase,
          brandContext,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) throw new Error("Tu sesión expiró. Inicia sesión y vuelve a intentarlo.")
        throw new Error("No pudimos registrar la solicitud. Inténtalo nuevamente.")
      }

      setDone(true)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No pudimos registrar la solicitud.")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="border-y border-[#263D44] py-9">
        <CheckCircle2 className="h-5 w-5 text-[#96B5A6]" />
        <h2 className="mt-5 text-3xl font-light tracking-[-0.04em] text-[#E7DFCE]">Solicitud recibida.</h2>
        <p className="mt-4 max-w-lg text-sm leading-7 text-[#BDBEBD]">
          El equipo revisará la organización, cantidad de usuarios y uso esperado antes de habilitar el acceso empresarial.
        </p>
        {brandContext ? <p className="mt-3 text-xs text-[#96B5A6]">Contexto conservado: {brandContext}</p> : null}
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="border-y border-[#263D44] py-8">
      <h2 className="text-2xl font-light tracking-[-0.03em] text-[#E7DFCE]">Solicita acceso empresarial</h2>
      <p className="mt-3 max-w-lg text-sm leading-6 text-[#BDBEBD]">
        Tres datos. El equipo revisa el contexto y te contacta para definir alcance y habilitación.
      </p>

      <div className="mt-7 space-y-5">
        <div>
          <Label htmlFor="enterprise-company" className="mb-2 block text-[#D8DDDB]">Empresa u organización</Label>
          <Input
            id="enterprise-company"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            required
            maxLength={160}
            className="h-11 border-[#314950] bg-[#0B222A]"
          />
        </div>

        <div>
          <Label htmlFor="enterprise-users" className="mb-2 block text-[#D8DDDB]">Número aproximado de usuarios</Label>
          <Input
            id="enterprise-users"
            type="number"
            min={1}
            max={100000}
            inputMode="numeric"
            value={userCount}
            onChange={(event) => setUserCount(event.target.value)}
            placeholder="Ej. 8"
            className="h-11 border-[#314950] bg-[#0B222A]"
          />
        </div>

        <div>
          <Label htmlFor="enterprise-use" className="mb-2 block text-[#D8DDDB]">Uso esperado</Label>
          <textarea
            id="enterprise-use"
            required
            minLength={8}
            maxLength={1200}
            rows={5}
            value={useCase}
            onChange={(event) => setUseCase(event.target.value)}
            placeholder="Ej. investigación previa, cartera de marcas, vigilancia y trabajo del equipo legal."
            className="w-full resize-y border border-[#314950] bg-[#0B222A] px-3 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#71807F] focus:border-[#4A7F74]"
          />
        </div>
      </div>

      {error ? <p role="alert" className="mt-4 text-sm text-red-200">{error}</p> : null}

      <Button type="submit" disabled={loading} className="mt-7 min-h-11 bg-[#4A7F74] px-5 text-white hover:bg-[#568D81]">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : null}
        {loading ? "Enviando solicitud" : "Enviar solicitud"}
        {!loading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
      </Button>
    </form>
  )
}
