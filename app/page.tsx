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
  ["¿Cómo se contrata?", "La plataforma empresarial parte desde $5.000.000 CLP y la API desde USD 500 al mes más consumo. El alcance final depende de usuarios, volumen e integración."],
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
          { "@type": "Offer", name: "VIDENTIA Plataforma", priceCurrency: "CLP", price: "5000000", description: "Implementación inicial desde $5.000.000 CLP. El alcance final depende de usuarios, integraciones y soporte." },
          { "@type": "Offer", name: "VIDENTIA API", priceCurrency: "USD", price: "500", description: "Suscripción desde USD 500 al mes más consumo. El valor final depende del volumen y alcance de integración." },
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
    <main className="min-h-screen bg-[#F7F8F6] text-[#111827]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <nav className="fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-[#F7F8F6]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1480px] items-center justify-between px-5 lg:px-10">
          <Link href="/" aria-label="VIDENTIA" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#111827] text-sm font-semibold text-white">V</span>
            <span className="leading-none">
              <span className="block text-[15px] font-semibold tracking-[0.16em] text-[#111827]">VIDENTIA</span>
              <span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.18em] text-[#64748B]">by N3uralia</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-5">
            <Link href="#producto" className="hidden text-sm text-[#667085] transition-colors hover:text-[#111827] md:block">Producto</Link>
            <Link href="#empresas" className="hidden text-sm text-[#667085] transition-colors hover:text-[#111827] lg:block">Empresas y API</Link>
            <Link href="/auth/login"><Button variant="ghost" className="hidden rounded-lg text-[#475569] hover:bg-black/5 sm:inline-flex">Iniciar sesión</Button></Link>
            <Link href="/demo"><Button className="h-10 gap-2 rounded-lg bg-[#111827] px-5 text-white shadow-none hover:bg-[#273244]">Probar VIDENTIA <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-black/10 px-5 pb-20 pt-32 lg:px-10 lg:pb-28 lg:pt-40">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] border-l border-black/5 bg-[#F1F3F0] lg:block" />
        <div className="relative mx-auto grid max-w-[1480px] gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0F766E]">Inteligencia marcaria para Chile</p>
            <h1 className="mt-6 max-w-3xl text-[clamp(3rem,6.2vw,6.6rem)] font-normal leading-[0.95] tracking-[-0.055em] text-[#111827]">Investiga una marca con evidencia y contexto.</h1>
            <p className="mt-7 max-w-2xl text-[17px] leading-8 text-[#667085]">VIDENTIA reúne antecedentes marcarios, señales denominativas y visuales, contexto del titular y vigilancia en una revisión clara y trazable.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/demo"><Button size="lg" className="h-12 gap-2 rounded-lg bg-[#0F766E] px-6 text-white shadow-none hover:bg-[#134E4A]">Analizar una marca <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link href="/contacto"><Button size="lg" variant="outline" className="h-12 rounded-lg border-black/15 bg-transparent px-6 hover:bg-black/5">Contacto comercial</Button></Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 border-t border-black/10 pt-5 text-xs text-[#667085]">
              {["INAPI", "Niza + Viena", "TDPI", "Evidencia trazable"].map(item => <span key={item} className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#0F766E]" />{item}</span>)}
            </div>
          </div>
          <SystemPreview />
        </div>
      </section>

      <section id="producto" className="px-5 py-20 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-[1480px]">
          <div className="grid gap-8 border-b border-black/10 pb-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Evidencia</p>
              <h2 className="mt-4 max-w-xl text-[clamp(2.3rem,4vw,4.3rem)] font-normal leading-[1.02] tracking-[-0.045em]">Una investigación no cabe en un solo porcentaje.</h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-[#667085] lg:justify-self-end">VIDENTIA separa las señales para mostrar qué encontró, de dónde viene y por qué merece revisión.</p>
          </div>
          <div className="grid border-b border-black/10 md:grid-cols-2 lg:grid-cols-4">
            {signals.map(({ icon: Icon, label, value, detail }, i) => (
              <article key={label} className={`py-8 md:px-7 ${i > 0 ? "md:border-l md:border-black/10" : ""}`}>
                <Icon className="h-4 w-4 text-[#0F766E]" />
                <p className="mt-7 text-xs font-medium uppercase tracking-[0.14em] text-[#667085]">{label}</p>
                <p className="mt-2 text-xl font-medium tracking-[-0.025em]">{value}</p>
                <p className="mt-3 text-sm leading-6 text-[#667085]">{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#111827] px-5 py-20 text-white lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-[1480px] gap-12 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Cómo funciona</p>
            <h2 className="mt-4 max-w-xl text-[clamp(2.4rem,4vw,4.5rem)] font-normal leading-[1.02] tracking-[-0.045em]">De una búsqueda puntual a una investigación continua.</h2>
          </div>
          <div className="border-t border-white/15">
            {workflow.map(([title, copy], index) => (
              <div key={title} className="grid gap-4 border-b border-white/15 py-6 sm:grid-cols-[48px_160px_1fr]">
                <span className="font-mono text-xs text-[#63C7B8]">0{index + 1}</span><h3 className="font-medium text-white">{title}</h3><p className="text-sm leading-6 text-slate-400">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-[1480px] gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <DecisionPreview />
          <div className="max-w-xl lg:justify-self-end">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Contexto verificable</p>
            <h2 className="mt-4 text-[clamp(2.3rem,3.8vw,4.1rem)] font-normal leading-[1.04] tracking-[-0.045em]">La marca no se revisa aislada de quien está detrás.</h2>
            <p className="mt-5 text-lg leading-8 text-[#667085]">Cuando existe evidencia verificable, VIDENTIA conecta antecedentes con titular, familia marcaria y precedentes sin confundir evidencia con inferencia.</p>
            <div className="mt-7 border-t border-black/10">
              {["Fuente oficial siempre visible", "Titular sólo cuando está verificado", "Contexto sin predicción jurídica"].map(item => <div key={item} className="flex items-center gap-3 border-b border-black/10 py-4 text-sm text-[#475467]"><Check className="h-4 w-4 text-[#0F766E]" />{item}</div>)}
            </div>
          </div>
        </div>
      </section>

      <section id="empresas" className="border-y border-black/10 bg-white px-5 py-20 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-[1480px]">
          <div className="grid gap-8 border-b border-black/10 pb-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Contratación</p>
              <h2 className="mt-4 max-w-2xl text-[clamp(2.4rem,4.3vw,4.6rem)] font-normal leading-[1.02] tracking-[-0.045em]">Usa VIDENTIA como plataforma o intégralo por API.</h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-[#667085] lg:justify-self-end">Dos formas de contratar la misma inteligencia, según cómo trabaja tu organización.</p>
          </div>

          <div className="grid border-b border-black/10 lg:grid-cols-2">
            <article className="py-9 lg:pr-12">
              <div className="flex items-center justify-between gap-4"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#98A2B3]">Plataforma</p><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0F766E]">Implementación empresarial</span></div>
              <h3 className="mt-6 text-3xl font-normal tracking-[-0.035em]">VIDENTIA Plataforma</h3>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[#667085]">Para estudios jurídicos, áreas legales y empresas que quieren centralizar investigación y vigilancia.</p>
              <div className="mt-7 border-t border-black/10 pt-6"><p className="text-xs uppercase tracking-[0.14em] text-[#667085]">Implementación desde</p><p className="mt-2 text-[clamp(2.6rem,5vw,4.6rem)] font-normal leading-none tracking-[-0.05em]">$5.000.000 <span className="text-lg tracking-normal text-[#667085]">CLP</span></p></div>
              <div className="mt-7 border-t border-black/10">{platformIncludes.map(item => <div key={item} className="flex items-center gap-3 border-b border-black/10 py-3.5 text-sm text-[#475467]"><Check className="h-4 w-4 text-[#0F766E]" />{item}</div>)}</div>
              <Link href="/contacto" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#0F766E]">Solicitar propuesta <ArrowRight className="h-4 w-4" /></Link>
            </article>

            <article className="border-t border-black/10 py-9 lg:border-l lg:border-t-0 lg:pl-12">
              <div className="flex items-center justify-between gap-4"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#98A2B3]">API</p><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0F766E]">Suscripción + consumo</span></div>
              <h3 className="mt-6 text-3xl font-normal tracking-[-0.035em]">VIDENTIA API</h3>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[#667085]">Para compañías y plataformas que necesitan integrar búsqueda y comparación marcaria en sus propios procesos.</p>
              <div className="mt-7 border-t border-black/10 pt-6"><p className="text-xs uppercase tracking-[0.14em] text-[#667085]">Suscripción desde</p><p className="mt-2 text-[clamp(2.6rem,5vw,4.6rem)] font-normal leading-none tracking-[-0.05em]">USD 500 <span className="text-lg tracking-normal text-[#667085]">/ mes</span></p></div>
              <div className="mt-7 border-t border-black/10">{apiIncludes.map(item => <div key={item} className="flex items-center gap-3 border-b border-black/10 py-3.5 text-sm text-[#475467]"><Check className="h-4 w-4 text-[#0F766E]" />{item}</div>)}</div>
              <Link href="/contacto" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#0F766E]">Cotizar API <ArrowRight className="h-4 w-4" /></Link>
            </article>
          </div>
          <p className="mt-4 max-w-4xl text-xs leading-6 text-[#98A2B3]">Valores iniciales de referencia. Integraciones especiales, SLA, despliegues dedicados y volúmenes superiores se cotizan según alcance.</p>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Preguntas frecuentes</p>
            <h2 className="mt-4 text-[clamp(2rem,3.4vw,3.5rem)] font-normal leading-[1.04] tracking-[-0.045em]">Lo esencial antes de comenzar.</h2>
          </div>
          <div className="border-t border-black/10">{faqs.map(([question, answer]) => <div key={question} className="grid gap-3 border-b border-black/10 py-5 md:grid-cols-[0.8fr_1.2fr]"><h3 className="font-medium">{question}</h3><p className="text-sm leading-7 text-[#667085]">{answer}</p></div>)}</div>
        </div>
      </section>

      <section className="border-t border-black/10 bg-[#111827] px-5 py-20 text-white lg:px-10">
        <div className="mx-auto max-w-[1480px]">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#63C7B8]">VIDENTIA · by N3uralia</p><h2 className="mt-4 max-w-4xl text-[clamp(2.6rem,5vw,5.2rem)] font-normal leading-[0.98] tracking-[-0.05em]">Prueba una marca real o conversa con nosotros.</h2><p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">Usa la demostración o solicita una propuesta para implementar VIDENTIA como plataforma o API.</p></div>
            <div className="flex flex-col gap-3 sm:flex-row"><Link href="/demo"><Button size="lg" className="h-12 gap-2 rounded-lg bg-[#F7F8F6] px-6 text-[#111827] hover:bg-white">Probar VIDENTIA <ArrowRight className="h-4 w-4" /></Button></Link><Link href="/contacto"><Button size="lg" variant="outline" className="h-12 rounded-lg border-white/20 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white">Contacto comercial</Button></Link></div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#111827] px-5 py-8 text-slate-400 lg:px-10">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-[10px] border border-white/15 text-sm font-semibold text-white">V</span><div><p className="text-sm font-semibold tracking-[0.14em] text-white">VIDENTIA</p><p className="mt-1 text-[9px] uppercase tracking-[0.18em]">by N3uralia</p></div></div><p className="mt-4 max-w-xl text-xs leading-6">Inteligencia marcaria para Chile. VIDENTIA apoya investigación y gestión de evidencia; no reemplaza evaluación jurídica profesional ni a las fuentes oficiales.</p></div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs"><Link href="/demo" className="hover:text-white">Demo</Link><Link href="/contacto" className="hover:text-white">Contacto</Link><Link href="/docs" className="hover:text-white">API</Link><a href="https://www.inapi.cl" target="_blank" rel="noreferrer" className="hover:text-white">INAPI</a><a href="https://www.n3uralia.com" target="_blank" rel="noreferrer" className="hover:text-white">N3uralia</a><span>© {new Date().getFullYear()} VIDENTIA</span></div>
        </div>
      </footer>
    </main>
  )
}

function SystemPreview() {
  return (
    <div className="relative lg:pl-6">
      <div className="border border-black/10 bg-white p-3">
        <div className="border border-black/10">
          <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
            <div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#98A2B3]">Investigación en curso</p><p className="mt-2 font-medium">Marca a evaluar</p></div>
            <span className="h-2 w-2 rounded-full bg-[#0F766E]" />
          </div>
          <div className="grid sm:grid-cols-[170px_1fr]">
            <div className="flex min-h-48 items-center justify-center border-b border-black/10 bg-[#F1F3F0] p-6 sm:border-b-0 sm:border-r"><div className="grid h-28 w-28 place-items-center border border-black/10 bg-white"><ImageIcon className="h-8 w-8 text-[#0F766E]" /></div></div>
            <div className="p-6">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#98A2B3]">Señales a revisar</p>
              <p className="mt-3 text-xl font-medium tracking-[-0.025em]">Antecedentes ordenados por relevancia</p>
              <p className="mt-2 text-xs leading-5 text-[#667085]">Cada resultado conserva su fuente, cobertura y explicación.</p>
              <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5"><MiniSignal label="Nombre" value="Comparado" /><MiniSignal label="Fonética" value="Comparada" /><MiniSignal label="Visual" value="Cuando aplica" /><MiniSignal label="Niza" value="Contextualizada" /></div>
            </div>
          </div>
          <div className="border-t border-black/10 bg-[#F7F8F6] px-5 py-4"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" /><p className="text-sm leading-6 text-[#475467]"><span className="font-medium text-[#111827]">La diferencia:</span> VIDENTIA explica las señales y mantiene visible la evidencia que las sostiene.</p></div></div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-[#98A2B3]"><span>INAPI · NIZA · VIENA · TDPI</span><span>Evidencia trazable</span></div>
    </div>
  )
}

function DecisionPreview() {
  return (
    <div className="border border-black/10 bg-white p-6 sm:p-8">
      <div className="flex items-center justify-between border-b border-black/10 pb-5"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#98A2B3]">Lectura de evidencia</p><p className="mt-2 text-lg font-medium">Tu marca ↔ antecedente oficial</p></div><span className="border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-800">Revisar</span></div>
      <div className="grid gap-4 py-7 sm:grid-cols-2"><LogoPlaceholder label="Marca analizada" /><LogoPlaceholder label="Antecedente oficial" /></div>
      <div className="grid grid-cols-2 border-t border-black/10 sm:grid-cols-4"><Evidence label="Nombre" value="Señal explicada" /><Evidence label="Fonética" value="Señal explicada" /><Evidence label="Visual" value="Si existe evidencia" /><Evidence label="Ámbito" value="Cobertura relacionada" /></div>
    </div>
  )
}

function MiniSignal({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] uppercase tracking-[0.14em] text-[#98A2B3]">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div> }
function LogoPlaceholder({ label }: { label: string }) { return <div className="border border-black/10 bg-[#F7F8F6] p-4"><p className="text-[10px] uppercase tracking-[0.14em] text-[#98A2B3]">{label}</p><div className="mt-4 flex h-28 items-center justify-center bg-white text-[#98A2B3]"><ImageIcon className="h-7 w-7" /></div></div> }
function Evidence({ label, value }: { label: string; value: string }) { return <div className="border-r border-black/10 px-3 py-4 last:border-r-0"><p className="text-[10px] uppercase tracking-[0.12em] text-[#98A2B3]">{label}</p><p className="mt-1 text-xs font-medium">{value}</p></div> }
