import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Mail, MessageCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Contacto comercial",
  description: "Solicita una propuesta para VIDENTIA Plataforma o cotiza una integración mediante VIDENTIA API en Chile.",
  alternates: { canonical: "/contacto" },
  openGraph: {
    title: "Contacto comercial | VIDENTIA",
    description: "Solicita una propuesta para VIDENTIA Plataforma o cotiza una integración mediante VIDENTIA API en Chile.",
    url: "https://videntia.app/contacto",
    siteName: "VIDENTIA",
    locale: "es_CL",
    type: "website",
  },
}

const enterpriseMail = "mailto:info@n3uralia.com?subject=VIDENTIA%20Plataforma%20Enterprise&body=Hola%20N3uralia%2C%20quiero%20evaluar%20VIDENTIA%20Plataforma%20para%20mi%20empresa.%20Empresa%3A%20%20%7C%20Usuarios%20estimados%3A%20%20%7C%20Necesidad%20principal%3A%20"
const apiMail = "mailto:info@n3uralia.com?subject=VIDENTIA%20API&body=Hola%20N3uralia%2C%20quiero%20evaluar%20VIDENTIA%20API.%20Empresa%3A%20%20%7C%20Volumen%20estimado%3A%20%20%7C%20Integraci%C3%B3n%20prevista%3A%20"
const whatsapp = "https://wa.me/56993826127?text=Hola%20N3uralia%2C%20quiero%20conversar%20sobre%20VIDENTIA."

export default function ContactoPage() {
  return (
    <main className="min-h-screen bg-[#F7F8F6] text-[#111827]">
      <header className="border-b border-black/10 px-5 py-5 lg:px-10">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#667085] hover:text-[#111827]"><ArrowLeft className="h-4 w-4" />Volver a VIDENTIA</Link>
          <div className="text-right"><p className="text-sm font-semibold tracking-[0.14em]">VIDENTIA</p><p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-[#667085]">by N3uralia</p></div>
        </div>
      </header>

      <section className="px-5 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[1180px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0F766E]">CONTRATACIÓN · CHILE</p>
          <h1 className="mt-6 max-w-4xl text-[clamp(2.8rem,6vw,6rem)] font-normal leading-[0.96] tracking-[-0.055em]">Conversemos sobre cómo usar VIDENTIA en tu operación.</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#667085]">Dos caminos: implementar la plataforma completa o integrar la inteligencia marcaria mediante API. La propuesta final depende del alcance real.</p>

          <div className="mt-14 grid border-y border-black/10 lg:grid-cols-2">
            <article className="py-10 lg:pr-12">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#98A2B3]">PLATAFORMA EMPRESARIAL</p>
              <h2 className="mt-6 text-3xl font-normal tracking-[-0.035em]">VIDENTIA Plataforma</h2>
              <p className="mt-4 text-sm leading-7 text-[#667085]">Implementación para estudios jurídicos, áreas legales y empresas que necesitan búsqueda, evaluación, casos y vigilancia en una sola operación.</p>
              <p className="mt-8 text-xs uppercase tracking-[0.14em] text-[#667085]">Implementación desde</p>
              <p className="mt-2 text-4xl font-normal tracking-[-0.04em]">$5.000.000 CLP</p>
              <a href={enterpriseMail} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#0F766E]">Solicitar propuesta empresarial <ArrowRight className="h-4 w-4" /></a>
            </article>

            <article className="border-t border-black/10 py-10 lg:border-l lg:border-t-0 lg:pl-12">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#98A2B3]">API EMPRESARIAL</p>
              <h2 className="mt-6 text-3xl font-normal tracking-[-0.035em]">VIDENTIA API</h2>
              <p className="mt-4 text-sm leading-7 text-[#667085]">Para integrar capacidades de búsqueda e inteligencia marcaria en sistemas, flujos y productos del cliente.</p>
              <p className="mt-8 text-xs uppercase tracking-[0.14em] text-[#667085]">Suscripción desde</p>
              <p className="mt-2 text-4xl font-normal tracking-[-0.04em]">USD 500 / mes</p>
              <a href={apiMail} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#0F766E]">Cotizar integración API <ArrowRight className="h-4 w-4" /></a>
            </article>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <a href="mailto:info@n3uralia.com" className="flex items-center justify-between border border-black/10 bg-white p-5 hover:border-black/20"><span className="flex items-center gap-3"><Mail className="h-4 w-4 text-[#0F766E]" /><span className="text-sm font-medium">info@n3uralia.com</span></span><ArrowRight className="h-4 w-4 text-[#98A2B3]" /></a>
            <a href={whatsapp} target="_blank" rel="noreferrer" className="flex items-center justify-between border border-black/10 bg-white p-5 hover:border-black/20"><span className="flex items-center gap-3"><MessageCircle className="h-4 w-4 text-[#0F766E]" /><span className="text-sm font-medium">WhatsApp · +56 9 9382 6127</span></span><ArrowRight className="h-4 w-4 text-[#98A2B3]" /></a>
          </div>

          <p className="mt-8 max-w-3xl text-xs leading-6 text-[#98A2B3]">Los precios indicados son valores iniciales de referencia. Usuarios, volumen, integraciones, SLA, migraciones, soporte ampliado y despliegues especiales se cotizan según alcance.</p>
        </div>
      </section>
    </main>
  )
}
