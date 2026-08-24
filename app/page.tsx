import Link from "next/link"
import { ArrowRight, Check, Fingerprint, ImageIcon, Layers3, Search, ShieldCheck, Waves } from "lucide-react"
import { Button } from "@/components/ui/button"

const signals = [
  { icon: Search, label: "Denominación", value: "Lectura verbal", detail: "Ortografía, estructura, términos dominantes y variantes relevantes." },
  { icon: Waves, label: "Fonética", value: "Proximidad sonora", detail: "Pronunciación y cercanía fonética explicadas por separado." },
  { icon: Fingerprint, label: "Visual", value: "Huella figurativa", detail: "Elementos compartidos, composición y señales visuales comparables." },
  { icon: Layers3, label: "Ámbito", value: "Contexto comercial", detail: "Clases Niza y relación entre productos o servicios." },
]

const workflow = [
  ["Busca", "Parte desde un nombre, logo, fotografía o una combinación."],
  ["Entiende", "VIDENTIA ordena antecedentes, señales y evidencia verificable."],
  ["Revisa", "Identifica por qué un antecedente merece atención sin depender de un score opaco."],
  ["Vigila", "Conserva la investigación y detecta cambios posteriores."],
]

const platformIncludes = [
  "Puesta en marcha y configuración inicial",
  "Búsqueda, evaluación, casos y vigilancia",
  "Contexto del titular, precedentes y evidencia trazable",
  "Usuarios, onboarding y soporte de implementación",
]

const apiIncludes = [
  "Búsqueda marcaria autenticada y medida",
  "Ingesta y comparación de imágenes",
  "Autenticación, cuotas y registro de consumo",
  "Integración con sistemas del cliente",
]

const faqs = [
  ["¿Qué es VIDENTIA?", "Una plataforma de inteligencia marcaria para Chile que reúne búsqueda, evaluación, contexto y vigilancia con evidencia trazable."],
  ["¿VIDENTIA reemplaza a INAPI?", "No. INAPI mantiene la fuente oficial. VIDENTIA organiza antecedentes y contexto para facilitar investigación y seguimiento."],
  ["¿Cómo se contrata?", "VIDENTIA se contrata como plataforma empresarial o como API. Como referencia comercial, la implementación de plataforma parte desde $5.000.000 CLP y la API desde $500.000 CLP al mes más consumo. La propuesta final depende del alcance."],
  ["¿Entrega una opinión legal?", "No. VIDENTIA apoya investigación y priorización. La evaluación jurídica final corresponde al profesional responsable."],
]

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.n3uralia.com/#organization",
      name: "N3uralia",
      url: "https://www.n3uralia.com",
      description: "Empresa de desarrollo de software, automatización e inteligencia aplicada.",
    },
    {
      "@type": "WebApplication",
      "@id": "https://videntia.app/#software",
      name: "VIDENTIA",
      url: "https://videntia.app",
      inLanguage: "es-CL",
      countriesSupported: "CL",
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Legal technology",
      operatingSystem: "Web",
      description: "Plataforma de inteligencia marcaria para búsqueda, evaluación y vigilancia de marcas en Chile.",
      creator: { "@id": "https://www.n3uralia.com/#organization" },
      publisher: { "@id": "https://www.n3uralia.com/#organization" },
      featureList: ["Búsqueda de antecedentes marcarios", "Análisis denominativo y fonético", "Análisis visual", "Clases Niza", "Clasificación de Viena", "Precedentes TDPI", "Vigilancia de marcas", "Casos y evidencia", "API empresarial"],
      offers: {
        "@type": "OfferCatalog",
        name: "Modalidades comerciales VIDENTIA",
        itemListElement: [
          { "@type": "Offer", name: "VIDENTIA Plataforma", priceCurrency: "CLP", price: "5000000", description: "Referencia comercial de implementación desde $5.000.000 CLP. El alcance final depende de usuarios, integraciones y soporte." },
          { "@type": "Offer", name: "VIDENTIA API", priceCurrency: "CLP", price: "500000", description: "Referencia comercial de suscripción desde $500.000 CLP al mes más consumo. El valor final depende del volumen y alcance de integración." },
        ],
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
    },
  ],
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#090D12] text-[#F4F7F6]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#090D12]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1480px] items-center justify-between px-5 lg:px-10">
          <Link href="/" aria-label="VIDENTIA" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-[9px] border border-white/15 bg-white/[0.04] text-sm font-semibold text-white">V</span>
            <span className="leading-none">
              <span className="block text-[15px] font-semibold tracking-[0.16em] text-white">VIDENTIA</span>
              <span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.18em] text-[#76818F]">by N3uralia</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-5">
            <Link href="#producto" className="hidden text-sm text-[#8F9AA8] transition-colors hover:text-white md:block">Producto</Link>
            <Link href="#empresas" className="hidden text-sm text-[#8F9AA8] transition-colors hover:text-white lg:block">Empresas y API</Link>
            <Link href="/auth/login"><Button variant="ghost" className="hidden rounded-lg text-[#A8B0BA] hover:bg-white/[0.06] hover:text-white sm:inline-flex">Iniciar sesión</Button></Link>
            <Link href="/demo"><Button className="h-10 gap-2 rounded-lg bg-white px-5 text-[#0A0E13] shadow-none hover:bg-[#E7ECEA]">Probar VIDENTIA <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-white/10 px-5 pb-24 pt-36 lg:px-10 lg:pb-32 lg:pt-44">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_74%_32%,rgba(24,132,118,0.16),transparent_36%),radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.035),transparent_30%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-[44%] hidden border-l border-white/[0.06] lg:block" />
        <div className="relative mx-auto grid max-w-[1480px] gap-16 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#7EE3D2]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#64D5C2]" /> Inteligencia marcaria para Chile
            </div>
            <h1 className="mt-7 max-w-3xl text-[clamp(3.1rem,6vw,6.5rem)] font-normal leading-[0.94] tracking-[-0.06em] text-white">Investiga una marca con evidencia y contexto.</h1>
            <p className="mt-7 max-w-2xl text-[18px] leading-8 text-[#9AA5B2]">VIDENTIA reúne antecedentes marcarios, señales denominativas y visuales, contexto del titular y vigilancia en una revisión clara y trazable.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/demo"><Button size="lg" className="h-12 gap-2 rounded-lg bg-[#1B8F80] px-6 text-white shadow-none hover:bg-[#16796C]">Analizar una marca <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link href="/contacto"><Button size="lg" variant="outline" className="h-12 rounded-lg border-white/15 bg-white/[0.02] px-6 text-white hover:bg-white/[0.07] hover:text-white">Contacto comercial</Button></Link>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-4">
              {["INAPI", "Niza + Viena", "TDPI", "Evidencia trazable"].map(item => (
                <div key={item} className="bg-[#0D1218] px-4 py-4 text-[11px] text-[#9AA5B2]"><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#64D5C2]" />{item}</div>
              ))}
            </div>
          </div>
          <SystemPreview />
        </div>
      </section>

      <section id="producto" className="px-5 py-24 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[1480px]">
          <div className="grid gap-8 border-b border-white/10 pb-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6F7A87]">Evidencia</p>
              <h2 className="mt-4 max-w-xl text-[clamp(2.4rem,4vw,4.4rem)] font-normal leading-[1.01] tracking-[-0.05em] text-white">Una investigación no cabe en un solo porcentaje.</h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-[#8F9AA8] lg:justify-self-end">VIDENTIA separa las señales para mostrar qué encontró, de dónde viene y por qué merece revisión.</p>
          </div>
          <div className="grid gap-px border-b border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-4">
            {signals.map(({ icon: Icon, label, value, detail }) => (
              <article key={label} className="bg-[#0C1117] px-6 py-8 transition-colors hover:bg-[#10171F] lg:px-7">
                <Icon className="h-4 w-4 text-[#64D5C2]" />
                <p className="mt-8 text-[10px] font-medium uppercase tracking-[0.16em] text-[#697582]">{label}</p>
                <p className="mt-2 text-xl font-medium tracking-[-0.025em] text-white">{value}</p>
                <p className="mt-3 text-sm leading-6 text-[#8994A1]">{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0B1016] px-5 py-24 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-[1480px] gap-14 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#64D5C2]">Cómo funciona</p>
            <h2 className="mt-4 max-w-xl text-[clamp(2.5rem,4vw,4.6rem)] font-normal leading-[1] tracking-[-0.05em] text-white">De una búsqueda puntual a una investigación continua.</h2>
          </div>
          <div className="border-t border-white/10">
            {workflow.map(([title, copy], index) => (
              <div key={title} className="grid gap-4 border-b border-white/10 py-7 sm:grid-cols-[54px_150px_1fr]">
                <span className="font-mono text-xs text-[#64D5C2]">0{index + 1}</span>
                <h3 className="font-medium text-white">{title}</h3>
                <p className="text-sm leading-6 text-[#8994A1]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-24 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-[1480px] gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <DecisionPreview />
          <div className="max-w-xl lg:justify-self-end">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6F7A87]">Contexto verificable</p>
            <h2 className="mt-4 text-[clamp(2.4rem,3.8vw,4.2rem)] font-normal leading-[1.03] tracking-[-0.05em] text-white">La marca no se revisa aislada de quien está detrás.</h2>
            <p className="mt-5 text-lg leading-8 text-[#8F9AA8]">Cuando existe evidencia verificable, VIDENTIA conecta antecedentes con titular, familia marcaria y precedentes sin confundir evidencia con inferencia.</p>
            <div className="mt-8 border-t border-white/10">
              {["Fuente oficial siempre visible", "Titular sólo cuando está verificado", "Contexto sin predicción jurídica"].map(item => <div key={item} className="flex items-center gap-3 border-b border-white/10 py-4 text-sm text-[#A1ABB6]"><Check className="h-4 w-4 text-[#64D5C2]" />{item}</div>)}
            </div>
          </div>
        </div>
      </section>

      <section id="empresas" className="border-y border-white/10 bg-[#0B1016] px-5 py-24 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[1480px]">
          <div className="grid gap-8 border-b border-white/10 pb-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#64D5C2]">Para organizaciones</p>
              <h2 className="mt-4 max-w-2xl text-[clamp(2.5rem,4.3vw,4.7rem)] font-normal leading-[1] tracking-[-0.05em] text-white">Dos formas de incorporar VIDENTIA.</h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-[#8F9AA8] lg:justify-self-end">Trabaja directamente en la plataforma o integra sus capacidades en tus propios sistemas.</p>
          </div>

          <div className="grid gap-px bg-white/10 lg:grid-cols-2">
            <CommercialCard label="Plataforma" status="Operación completa" title="VIDENTIA Plataforma" copy="Para estudios jurídicos, áreas legales y empresas que quieren centralizar investigación, casos y vigilancia en un solo entorno." reference="Desde $5.000.000 CLP" items={platformIncludes} cta="Solicitar propuesta" />
            <CommercialCard label="API" status="Integración empresarial" title="VIDENTIA API" copy="Para organizaciones que necesitan incorporar búsqueda y comparación marcaria dentro de sus sistemas, productos o flujos internos." reference="Desde $500.000 CLP/mes + consumo" items={apiIncludes} cta="Conversar sobre la API" />
          </div>
          <p className="mt-4 max-w-4xl text-xs leading-6 text-[#697582]">Valores de referencia comercial. Usuarios, volumen, integraciones, SLA, soporte y alcance técnico se definen en la propuesta.</p>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[0.66fr_1.34fr]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6F7A87]">Preguntas frecuentes</p>
            <h2 className="mt-4 text-[clamp(2.1rem,3.4vw,3.6rem)] font-normal leading-[1.03] tracking-[-0.05em] text-white">Lo esencial antes de comenzar.</h2>
          </div>
          <div className="border-t border-white/10">{faqs.map(([question, answer]) => <div key={question} className="grid gap-3 border-b border-white/10 py-6 md:grid-cols-[0.82fr_1.18fr]"><h3 className="font-medium text-white">{question}</h3><p className="text-sm leading-7 text-[#8994A1]">{answer}</p></div>)}</div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0B1016] px-5 py-24 lg:px-10">
        <div className="mx-auto max-w-[1480px]">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#64D5C2]">VIDENTIA · by N3uralia</p>
              <h2 className="mt-4 max-w-4xl text-[clamp(2.8rem,5vw,5.4rem)] font-normal leading-[0.97] tracking-[-0.055em] text-white">Prueba una marca real o conversa con nosotros.</h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#8F9AA8]">Usa la demostración o solicita una propuesta para implementar VIDENTIA como plataforma o API.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/demo"><Button size="lg" className="h-12 gap-2 rounded-lg bg-white px-6 text-[#0A0E13] hover:bg-[#E7ECEA]">Probar VIDENTIA <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link href="/contacto"><Button size="lg" variant="outline" className="h-12 rounded-lg border-white/15 bg-transparent px-6 text-white hover:bg-white/[0.07] hover:text-white">Contacto comercial</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#090D12] px-5 py-9 text-[#73808D] lg:px-10">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-7 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-[9px] border border-white/15 text-sm font-semibold text-white">V</span><div><p className="text-sm font-semibold tracking-[0.14em] text-white">VIDENTIA</p><p className="mt-1 text-[9px] uppercase tracking-[0.18em]">by N3uralia</p></div></div>
            <p className="mt-4 max-w-xl text-xs leading-6">Inteligencia marcaria para Chile. VIDENTIA apoya investigación y gestión de evidencia; no reemplaza evaluación jurídica profesional ni a las fuentes oficiales.</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs"><Link href="/demo" className="hover:text-white">Demo</Link><Link href="/contacto" className="hover:text-white">Contacto</Link><Link href="/docs" className="hover:text-white">API</Link><a href="https://www.inapi.cl" target="_blank" rel="noreferrer" className="hover:text-white">INAPI</a><a href="https://www.n3uralia.com" target="_blank" rel="noreferrer" className="hover:text-white">N3uralia</a><span>© {new Date().getFullYear()} VIDENTIA</span></div>
        </div>
      </footer>
    </main>
  )
}

function CommercialCard({ label, status, title, copy, reference, items, cta }: { label: string; status: string; title: string; copy: string; reference: string; items: string[]; cta: string }) {
  return (
    <article className="bg-[#0D131A] p-7 sm:p-9 lg:p-11">
      <div className="flex flex-wrap items-center justify-between gap-4"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6F7A87]">{label}</p><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64D5C2]">{status}</span></div>
      <h3 className="mt-7 text-3xl font-normal tracking-[-0.04em] text-white">{title}</h3>
      <p className="mt-3 max-w-xl text-sm leading-7 text-[#8F9AA8]">{copy}</p>
      <div className="mt-8 border-t border-white/10">{items.map(item => <div key={item} className="flex items-center gap-3 border-b border-white/10 py-4 text-sm text-[#A1ABB6]"><Check className="h-4 w-4 text-[#64D5C2]" />{item}</div>)}</div>
      <Link href="/contacto" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#7EE3D2]">{cta} <ArrowRight className="h-4 w-4" /></Link>
      <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[10px] uppercase tracking-[0.14em] text-[#66727F]">Referencia comercial</span>
        <span className="text-sm font-medium text-[#A1ABB6]">{reference}</span>
      </div>
    </article>
  )
}

function SystemPreview() {
  return (
    <div className="relative lg:pl-8">
      <div className="absolute -inset-8 -z-10 bg-[radial-gradient(circle,rgba(20,133,118,0.12),transparent_68%)]" />
      <div className="border border-white/10 bg-[#0B1016] p-3 shadow-2xl shadow-black/30">
        <div className="border border-white/10 bg-[#0D131A]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6F7A87]">Investigación en curso</p><p className="mt-2 font-medium text-white">Marca a evaluar</p></div>
            <span className="h-2 w-2 rounded-full bg-[#64D5C2] shadow-[0_0_18px_rgba(100,213,194,0.8)]" />
          </div>
          <div className="grid sm:grid-cols-[170px_1fr]">
            <div className="flex min-h-48 items-center justify-center border-b border-white/10 bg-[#0A0F15] p-6 sm:border-b-0 sm:border-r"><div className="grid h-28 w-28 place-items-center border border-white/10 bg-[#111820]"><ImageIcon className="h-8 w-8 text-[#64D5C2]" /></div></div>
            <div className="p-6">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#6F7A87]">Señales a revisar</p>
              <p className="mt-3 text-xl font-medium tracking-[-0.025em] text-white">Antecedentes ordenados por relevancia</p>
              <p className="mt-2 text-xs leading-5 text-[#8994A1]">Cada resultado conserva su fuente, cobertura y explicación.</p>
              <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5"><MiniSignal label="Nombre" value="Comparado" /><MiniSignal label="Fonética" value="Comparada" /><MiniSignal label="Visual" value="Cuando aplica" /><MiniSignal label="Niza" value="Contextualizada" /></div>
            </div>
          </div>
          <div className="border-t border-white/10 bg-[#0A0F15] px-5 py-4"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#64D5C2]" /><p className="text-sm leading-6 text-[#A1ABB6]"><span className="font-medium text-white">La diferencia:</span> VIDENTIA explica las señales y mantiene visible la evidencia que las sostiene.</p></div></div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-[#66727F]"><span>INAPI · NIZA · VIENA · TDPI</span><span>Evidencia trazable</span></div>
    </div>
  )
}

function DecisionPreview() {
  return (
    <div className="border border-white/10 bg-[#0D131A] p-6 shadow-2xl shadow-black/20 sm:p-8">
      <div className="flex items-center justify-between border-b border-white/10 pb-5"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6F7A87]">Lectura de evidencia</p><p className="mt-2 text-lg font-medium text-white">Tu marca ↔ antecedente oficial</p></div><span className="border border-[#8D6E3F]/40 bg-[#8D6E3F]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#D6B77A]">Revisar</span></div>
      <div className="grid gap-4 py-7 sm:grid-cols-2"><LogoPlaceholder label="Marca analizada" /><LogoPlaceholder label="Antecedente oficial" /></div>
      <div className="grid grid-cols-2 border-t border-white/10 sm:grid-cols-4"><Evidence label="Nombre" value="Señal explicada" /><Evidence label="Fonética" value="Señal explicada" /><Evidence label="Visual" value="Si existe evidencia" /><Evidence label="Ámbito" value="Cobertura relacionada" /></div>
    </div>
  )
}

function MiniSignal({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] uppercase tracking-[0.14em] text-[#687481]">{label}</p><p className="mt-1 text-sm font-medium text-[#E7ECEA]">{value}</p></div> }
function LogoPlaceholder({ label }: { label: string }) { return <div className="border border-white/10 bg-[#0A0F15] p-4"><p className="text-[10px] uppercase tracking-[0.14em] text-[#687481]">{label}</p><div className="mt-4 flex h-28 items-center justify-center border border-white/[0.05] bg-[#111820] text-[#687481]"><ImageIcon className="h-7 w-7" /></div></div> }
function Evidence({ label, value }: { label: string; value: string }) { return <div className="border-r border-white/10 px-3 py-4 last:border-r-0"><p className="text-[10px] uppercase tracking-[0.12em] text-[#687481]">{label}</p><p className="mt-1 text-xs font-medium text-[#E7ECEA]">{value}</p></div> }
