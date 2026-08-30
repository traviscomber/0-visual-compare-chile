import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, BriefcaseBusiness, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { EnterpriseAccessForm } from "./enterprise-access-form"

export const metadata: Metadata = {
  title: "Acceso empresarial",
  description: "Solicita acceso empresarial a VIDENTIA para investigación, casos, vigilancia y trabajo colaborativo.",
  robots: { index: false, follow: false },
}

const included = [
  "Investigación completa y antecedentes sin recorte de preview",
  "Evaluación asistida y evidencia trazable",
  "Casos, expedientes, colaboración y reportes",
  "Vigilancia y seguimiento de marcas",
]

type Params = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function EnterpriseAccessPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams
  const marca = (first(params.marca) ?? "").trim().slice(0, 120)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const next = `/acceso-empresarial${marca ? `?marca=${encodeURIComponent(marca)}` : ""}`
    redirect(`/auth/sign-up?redirectTo=${encodeURIComponent(next)}`)
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_name")
    .eq("id", user.id)
    .maybeSingle()

  const initialCompany = (profile?.company_name || user.user_metadata?.company_name || "").toString().slice(0, 160)

  return (
    <main className="min-h-svh bg-[#0F2A33] text-white">
      <header className="border-b border-[#263D44] bg-[#091A20]">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 lg:px-8">
          <Link href="/investigar" className="inline-flex items-center gap-2 text-sm text-[#BDBEBD] hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <Link href="/" className="text-[15px] font-light tracking-[0.22em] text-[#E7DFCE]">ViDENTiA</Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1280px] gap-12 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:px-8 lg:py-24">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#96B5A6]">Acceso empresarial</p>
          <h1 className="mt-5 max-w-[11ch] text-5xl font-light leading-[0.98] tracking-[-0.05em] text-[#E7DFCE] sm:text-6xl">
            VIDENTIA completo para equipos que trabajan con marcas.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#BDBEBD]">
            La vista preliminar permite comprobar cobertura. El análisis profundo, los expedientes y la operación continua se habilitan dentro de un acceso empresarial.
          </p>
          {marca ? <p className="mt-5 text-sm text-[#96B5A6]">Contexto conservado: {marca}</p> : null}

          <div className="mt-10 border-y border-[#263D44] py-7">
            <div className="flex items-center gap-3 text-[#E7DFCE]">
              <BriefcaseBusiness className="h-5 w-5 text-[#96B5A6]" />
              <h2 className="text-xl font-light tracking-[-0.03em]">Qué se habilita</h2>
            </div>
            <div className="mt-5 divide-y divide-[#263D44] border-y border-[#263D44]">
              {included.map((item) => (
                <div key={item} className="flex items-start gap-3 py-4 text-sm leading-6 text-[#BDBEBD]">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-[#96B5A6]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:mt-2">
          <EnterpriseAccessForm initialCompany={initialCompany} brandContext={marca} />
          <p className="mt-4 max-w-lg text-xs leading-5 text-[#83908F]">
            No necesitas elegir entre plataforma o API en este paso. Revisamos organización, usuarios y uso esperado antes de definir la habilitación.
          </p>
        </div>
      </section>
    </main>
  )
}
