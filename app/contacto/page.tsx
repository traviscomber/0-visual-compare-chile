import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, Mail, MessageCircle, Search } from "lucide-react"

export const metadata: Metadata = {
  title: "Contacto comercial",
  description: "Conversemos sobre VIDENTIA Plataforma o una integración mediante VIDENTIA API en Chile.",
  alternates: { canonical: "/contacto" },
  openGraph: {
    title: "Contacto comercial | VIDENTIA",
    description: "Conversemos sobre VIDENTIA Plataforma o una integración mediante VIDENTIA API en Chile.",
    url: "https://videntia.app/contacto",
    siteName: "VIDENTIA",
    locale: "es_CL",
    type: "website",
  },
}

const apiMail = "mailto:info@n3uralia.com?subject=VIDENTIA%20API&body=Hola%20N3uralia%2C%20quiero%20evaluar%20VIDENTIA%20API.%20Empresa%3A%20%20%7C%20Volumen%20estimado%3A%20%20%7C%20Integraci%C3%B3n%20prevista%3A%20"

const platformPoints = ["Operación completa dentro de VIDENTIA", "Búsqueda, evaluación, casos y vigilancia", "Onboarding y configuración empresarial"]
const apiPoints = ["Integración con sistemas propios", "Búsqueda e inteligencia marcaria autenticada", "Consumo medido según volumen contratado"]

type ContactSearchParams = Record<string, string | string[] | undefined>

export default async function ContactoPage({ searchParams }: { searchParams: Promise<ContactSearchParams> }) {
  const params = await searchParams
  const marca = cleanText(firstValue(params.marca), 120)
  const resultados = cleanResultCount(firstValue(params.resultados))
  const fromDemo = firstValue(params.origen) === "demo" && Boolean(marca)

  const enterpriseMail = buildEnterpriseMail({ marca, resultados, fromDemo })
  const generalMail = buildGeneralMail({ marca, resultados, fromDemo })
  const whatsapp = buildWhatsApp({ marca, resultados, fromDemo })

  return (
    <main className="min-h-screen bg-[#090D12] text-[#F4F7F6]">
      <header className="border-b border-white/10 px-5 py-5 lg:px-10">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between">
          <Link href={fromDemo ? "/demo" : "/"} className="inline-flex items-center gap-2 text-sm text-[#8F9AA8] hover:text-white"><ArrowLeft className="h-4 w-4" />{fromDemo ? "Volver a la demo" : "Volver a VIDENTIA"}</Link>
          <div className="text-right"><p className="text-sm font-semibold tracking-[0.14em] text-white">VIDENTIA</p><p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-[#8994A1]">by N3uralia</p></div>
        </div>
      </header>

      <section className="px-5 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[1180px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#64D5C2]">Contratación · Chile</p>
          <h1 className="mt-6 max-w-4xl text-[clamp(2.8rem,6vw,6rem)] font-normal leading-[0.96] tracking-[-0.055em] text-white">{fromDemo ? "Continúa la investigación con el contexto que ya levantaste." : "Conversemos sobre cómo incorporar VIDENTIA a tu operación."}</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#8F9AA8]">{fromDemo ? "La marca y el volumen observado en la demo viajan en esta solicitud para que no tengas que volver a explicarlos. Luego definimos alcance, usuarios, vigilancia y modalidad de acceso." : "Primero definimos cómo trabaja tu organización. Después proponemos la modalidad, alcance e integración adecuados."}</p>

          {fromDemo && (
            <div className="mt-10 grid gap-4 border border-[#64D5C2]/20 bg-[#64D5C2]/[0.045] p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
              <div className="flex items-start gap-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-[#64D5C2]/20 bg-[#0B1518] text-[#64D5C2]"><Search className="h-4 w-4" /></span>
                <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#64D5C2]">Investigación iniciada en la demo</p><p className="mt-2 text-xl font-medium text-white">{marca}</p><p className="mt-1 text-sm text-[#8EA09D]">{resultados != null ? `${resultados} resultados observados en la cobertura de la consulta.` : "Contexto de la consulta conservado para continuar."}</p></div>
              </div>
              <Link href="/demo" className="text-sm font-medium text-[#9CCFC6] hover:text-white">Cambiar investigación</Link>
            </div>
          )}

          <div className="mt-14 grid gap-px bg-white/10 lg:grid-cols-2">
            <article className="bg-[#0D131A] p-7 sm:p-9 lg:p-11">
              <div className="flex items-center justify-between gap-4"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8994A1]">Plataforma empresarial</p><span className="text-[10px] uppercase tracking-[0.14em] text-[#64D5C2]">Operación completa</span></div>
              <h2 className="mt-7 text-3xl font-normal tracking-[-0.04em] text-white">VIDENTIA Plataforma</h2>
              <p className="mt-4 text-sm leading-7 text-[#8F9AA8]">Para estudios jurídicos, áreas legales y empresas que quieren trabajar directamente en VIDENTIA y centralizar investigación y vigilancia.</p>
              <div className="mt-8 border-t border-white/10">{platformPoints.map(item => <div key={item} className="flex items-center gap-3 border-b border-white/10 py-4 text-sm text-[#A1ABB6]"><Check className="h-4 w-4 text-[#64D5C2]" />{item}</div>)}</div>
              <a href={enterpriseMail} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#7EE3D2]">{fromDemo ? "Continuar esta investigación" : "Solicitar propuesta empresarial"} <ArrowRight className="h-4 w-4" /></a>
              <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between"><span className="text-[10px] uppercase tracking-[0.14em] text-[#8994A1]">Referencia comercial</span><span className="text-sm text-[#A1ABB6]">Desde $5.000.000 CLP</span></div>
            </article>

            <article className="bg-[#0D131A] p-7 sm:p-9 lg:p-11">
              <div className="flex items-center justify-between gap-4"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8994A1]">API empresarial</p><span className="text-[10px] uppercase tracking-[0.14em] text-[#64D5C2]">Integración</span></div>
              <h2 className="mt-7 text-3xl font-normal tracking-[-0.04em] text-white">VIDENTIA API</h2>
              <p className="mt-4 text-sm leading-7 text-[#8F9AA8]">Para organizaciones que necesitan incorporar capacidades de VIDENTIA en sus sistemas, productos o procesos existentes.</p>
              <div className="mt-8 border-t border-white/10">{apiPoints.map(item => <div key={item} className="flex items-center gap-3 border-b border-white/10 py-4 text-sm text-[#A1ABB6]"><Check className="h-4 w-4 text-[#64D5C2]" />{item}</div>)}</div>
              <a href={apiMail} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#7EE3D2]">Conversar sobre la API <ArrowRight className="h-4 w-4" /></a>
              <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between"><span className="text-[10px] uppercase tracking-[0.14em] text-[#8994A1]">Referencia comercial</span><span className="text-sm text-[#A1ABB6]">Desde $500.000 CLP/mes + consumo</span></div>
            </article>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <a href={generalMail} className="flex items-center justify-between border border-white/10 bg-[#0D131A] p-5 hover:bg-[#111820]"><span className="flex items-center gap-3"><Mail className="h-4 w-4 text-[#64D5C2]" /><span className="text-sm font-medium text-white">info@n3uralia.com</span></span><ArrowRight className="h-4 w-4 text-[#8994A1]" /></a>
            <a href={whatsapp} target="_blank" rel="noreferrer" className="flex items-center justify-between border border-white/10 bg-[#0D131A] p-5 hover:bg-[#111820]"><span className="flex items-center gap-3"><MessageCircle className="h-4 w-4 text-[#64D5C2]" /><span className="text-sm font-medium text-white">WhatsApp · +56 9 9382 6127</span></span><ArrowRight className="h-4 w-4 text-[#8994A1]" /></a>
          </div>

          <p className="mt-8 max-w-3xl text-xs leading-6 text-[#8994A1]">Los valores son referencias comerciales. Usuarios, volumen, integraciones, SLA, migraciones, soporte y despliegues especiales se definen según alcance.</p>
        </div>
      </section>
    </main>
  )
}

function buildEnterpriseMail({ marca, resultados, fromDemo }: { marca: string; resultados: number | null; fromDemo: boolean }) {
  const subject = fromDemo ? `VIDENTIA — continuar investigación ${marca}` : "VIDENTIA Plataforma Enterprise"
  const body = fromDemo
    ? [`Hola N3uralia, hice una investigación en la demo de VIDENTIA.`, `Marca: ${marca}`, resultados != null ? `Resultados observados: ${resultados}` : null, `Quiero evaluar acceso completo para conservar el caso, revisar evidencia y activar vigilancia.`, `Empresa:`, `Necesidad principal:`].filter(Boolean).join("\n")
    : "Hola N3uralia, quiero evaluar VIDENTIA Plataforma para mi empresa.\nEmpresa:\nUsuarios estimados:\nNecesidad principal:"
  return `mailto:info@n3uralia.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function buildGeneralMail({ marca, resultados, fromDemo }: { marca: string; resultados: number | null; fromDemo: boolean }) {
  if (!fromDemo) return "mailto:info@n3uralia.com"
  const subject = `VIDENTIA — consulta sobre ${marca}`
  const body = [`Hola N3uralia, vengo desde la demo de VIDENTIA.`, `Marca: ${marca}`, resultados != null ? `Resultados observados: ${resultados}` : null, `Quiero continuar esta investigación.`].filter(Boolean).join("\n")
  return `mailto:info@n3uralia.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function buildWhatsApp({ marca, resultados, fromDemo }: { marca: string; resultados: number | null; fromDemo: boolean }) {
  const text = fromDemo
    ? [`Hola N3uralia, vengo desde la demo de VIDENTIA.`, `Marca: ${marca}.`, resultados != null ? `La consulta observó ${resultados} resultados.` : null, `Quiero continuar la investigación.`].filter(Boolean).join(" ")
    : "Hola N3uralia, quiero conversar sobre VIDENTIA."
  return `https://wa.me/56993826127?text=${encodeURIComponent(text)}`
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? ""
}

function cleanText(value: string, maxLength: number) {
  return value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength)
}

function cleanResultCount(value: string) {
  if (!/^\d{1,4}$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null
}
