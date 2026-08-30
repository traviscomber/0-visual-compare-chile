import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check } from "lucide-react"

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
  const subject = encodeURIComponent("Acceso empresarial VIDENTIA")
  const body = encodeURIComponent(
    `Hola N3uralia, quiero solicitar acceso empresarial a VIDENTIA.${marca ? `\n\nMarca revisada: ${marca}` : ""}\n\nEmpresa:\nNúmero de usuarios:\nUso esperado:`,
  )
  const mailto = `mailto:info@n3uralia.com?subject=${subject}&body=${body}`

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
            La cuenta gratuita sirve para una vista preliminar. El análisis profundo, los expedientes y la operación continua se habilitan dentro de un acceso empresarial.
          </p>
          {marca ? <p className="mt-5 text-sm text-[#96B5A6]">Contexto conservado: {marca}</p> : null}
        </div>

        <div className="border-y border-[#263D44] py-8 lg:mt-2">
          <div className="flex items-center gap-3 text-[#E7DFCE]">
            <BriefcaseBusiness className="h-5 w-5 text-[#96B5A6]" />
            <h2 className="text-2xl font-light tracking-[-0.03em]">Un solo acceso. Sin elegir productos.</h2>
          </div>
          <div className="mt-6 divide-y divide-[#263D44] border-y border-[#263D44]">
            {included.map((item) => (
              <div key={item} className="flex items-start gap-3 py-4 text-sm leading-6 text-[#BDBEBD]">
                <Check className="mt-1 h-4 w-4 shrink-0 text-[#96B5A6]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <a href={mailto} className="mt-7 inline-flex min-h-11 items-center gap-2 bg-[#4A7F74] px-5 text-sm font-medium text-white hover:bg-[#568D81]">
            Solicitar acceso empresarial <ArrowRight className="h-4 w-4" />
          </a>
          <p className="mt-4 max-w-lg text-xs leading-5 text-[#83908F]">
            El equipo revisa organización, usuarios y volumen antes de habilitar el workspace. No necesitas decidir entre plataforma o API en este paso.
          </p>
        </div>
      </section>
    </main>
  )
}
