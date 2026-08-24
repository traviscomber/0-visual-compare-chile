import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, Mail, MessageCircle } from "lucide-react"

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

const enterpriseMail = "mailto:info@n3uralia.com?subject=VIDENTIA%20Plataforma%20Enterprise&body=Hola%20N3uralia%2C%20quiero%20evaluar%20VIDENTIA%20Plataforma%20para%20mi%20empresa.%20Empresa%3A%20%20%7C%20Usuarios%20estimados%3A%20%20%7C%20Necesidad%20principal%3A%20"
const apiMail = "mailto:info@n3uralia.com?subject=VIDENTIA%20API&body=Hola%20N3uralia%2C%20quiero%20evaluar%20VIDENTIA%20API.%20Empresa%3A%20%20%7C%20Volumen%20estimado%3A%20%20%7C%20Integraci%C3%B3n%20prevista%3A%20"
const whatsapp = "https://wa.me/56993826127?text=Hola%20N3uralia%2C%20quiero%20conversar%20sobre%20VIDENTIA."

const platformPoints = ["Operación completa dentro de VIDENTIA", "Búsqueda, evaluación, casos y vigilancia", "Onboarding y configuración empresarial"]
const apiPoints = ["Integración con sistemas propios", "Búsqueda e inteligencia marcaria autenticada", "Consumo medido según volumen contratado"]

export default function ContactoPage() {
  return (
    <main className="min-h-screen bg-[#090D12] text-[#F4F7F6]">
      <header className="border-b border-white/10 px-5 py-5 lg:px-10">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#8F9AA8] hover:text-white"><ArrowLeft className="h-4 w-4" />Volver a VIDENTIA</Link>
          <div className="text-right"><p className="text-sm font-semibold tracking-[0.14em] text-white">VIDENTIA</p><p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-[#66727F]">by N3uralia</p></div>
        </div>
      </header>

      <section className="px-5 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[1180px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#64D5C2]">Contratación · Chile</p>
          <h1 className="mt-6 max-w-4xl text-[clamp(2.8rem,6vw,6rem)] font-normal leading-[0.96] tracking-[-0.055em] text-white">Conversemos sobre cómo incorporar VIDENTIA a tu operación.</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#8F9AA8]">Primero definimos cómo trabaja tu organización. Después proponemos la modalidad, alcance e integración adecuados.</p>

          <div className="mt-14 grid gap-px bg-white/10 lg:grid-cols-2">
            <article className="bg-[#0D131A] p-7 sm:p-9 lg:p-11">
              <div className="flex items-center justify-between gap-4"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#66727F]">Plataforma empresarial</p><span className="text-[10px] uppercase tracking-[0.14em] text-[#64D5C2]">Operación completa</span></div>
              <h2 className="mt-7 text-3xl font-normal tracking-[-0.04em] text-white">VIDENTIA Plataforma</h2>
              <p className="mt-4 text-sm leading-7 text-[#8F9AA8]">Para estudios jurídicos, áreas legales y empresas que quieren trabajar directamente en VIDENTIA y centralizar investigación y vigilancia.</p>
              <div className="mt-8 border-t border-white/10">{platformPoints.map(item => <div key={item} className="flex items-center gap-3 border-b border-white/10 py-4 text-sm text-[#A1ABB6]"><Check className="h-4 w-4 text-[#64D5C2]" />{item}</div>)}</div>
              <a href={enterpriseMail} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#7EE3D2]">Solicitar propuesta empresarial <ArrowRight className="h-4 w-4" /></a>
              <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between"><span className="text-[10px] uppercase tracking-[0.14em] text-[#66727F]">Referencia comercial</span><span className="text-sm text-[#A1ABB6]">Desde $5.000.000 CLP</span></div>
            </article>

            <article className="bg-[#0D131A] p-7 sm:p-9 lg:p-11">
              <div className="flex items-center justify-between gap-4"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#66727F]">API empresarial</p><span className="text-[10px] uppercase tracking-[0.14em] text-[#64D5C2]">Integración</span></div>
              <h2 className="mt-7 text-3xl font-normal tracking-[-0.04em] text-white">VIDENTIA API</h2>
              <p className="mt-4 text-sm leading-7 text-[#8F9AA8]">Para organizaciones que necesitan incorporar capacidades de VIDENTIA en sus sistemas, productos o procesos existentes.</p>
              <div className="mt-8 border-t border-white/10">{apiPoints.map(item => <div key={item} className="flex items-center gap-3 border-b border-white/10 py-4 text-sm text-[#A1ABB6]"><Check className="h-4 w-4 text-[#64D5C2]" />{item}</div>)}</div>
              <a href={apiMail} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#7EE3D2]">Conversar sobre la API <ArrowRight className="h-4 w-4" /></a>
              <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between"><span className="text-[10px] uppercase tracking-[0.14em] text-[#66727F]">Referencia comercial</span><span className="text-sm text-[#A1ABB6]">Desde $500.000 CLP/mes + consumo</span></div>
            </article>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <a href="mailto:info@n3uralia.com" className="flex items-center justify-between border border-white/10 bg-[#0D131A] p-5 hover:bg-[#111820]"><span className="flex items-center gap-3"><Mail className="h-4 w-4 text-[#64D5C2]" /><span className="text-sm font-medium text-white">info@n3uralia.com</span></span><ArrowRight className="h-4 w-4 text-[#66727F]" /></a>
            <a href={whatsapp} target="_blank" rel="noreferrer" className="flex items-center justify-between border border-white/10 bg-[#0D131A] p-5 hover:bg-[#111820]"><span className="flex items-center gap-3"><MessageCircle className="h-4 w-4 text-[#64D5C2]" /><span className="text-sm font-medium text-white">WhatsApp · +56 9 9382 6127</span></span><ArrowRight className="h-4 w-4 text-[#66727F]" /></a>
          </div>

          <p className="mt-8 max-w-3xl text-xs leading-6 text-[#66727F]">Los valores son referencias comerciales. Usuarios, volumen, integraciones, SLA, migraciones, soporte y despliegues especiales se definen según alcance.</p>
        </div>
      </section>
    </main>
  )
}
