import Link from "next/link"
import { ArrowRight, Check, Eye, Fingerprint, ImageIcon, Layers3, Search, ShieldCheck, Waves } from "lucide-react"
import { Button } from "@/components/ui/button"

const signals = [
  { index: "01", icon: Search, label: "Denominación", value: "Lectura verbal", detail: "Ortografía, estructura, términos dominantes y variantes relevantes." },
  { index: "02", icon: Waves, label: "Fonética", value: "Proximidad sonora", detail: "Pronunciación y cercanía fonética explicadas por separado." },
  { index: "03", icon: Fingerprint, label: "Visual", value: "Huella figurativa", detail: "Elementos compartidos, composición y señales visuales comparables." },
  { index: "04", icon: Layers3, label: "Ámbito", value: "Contexto comercial", detail: "Clases Niza y relación entre productos o servicios." },
]

const workflow = [
  ["01", "Busca", "Nombre, logo, fotografía o combinación."],
  ["02", "Entiende", "VIDENTIA ordena antecedentes, señales y evidencia oficial."],
  ["03", "Decide", "Revisa por qué importa cada antecedente sin depender de un score opaco."],
  ["04", "Vigila", "Guarda la investigación y detecta cambios posteriores."],
]

const platformIncludes = [
  "Puesta en marcha y configuración inicial",
  "Acceso a búsqueda, evaluación, casos y vigilancia",
  "Contexto del titular, precedentes y evidencia trazable",
  "Usuarios, onboarding y soporte de implementación",
]

const apiIncludes = [
  "Acceso programático a capacidades de VIDENTIA",
  "Autenticación, cuotas y medición de consumo",
  "Integración con flujos y sistemas del cliente",
  "Escalamiento por volumen y requerimientos empresariales",
]

const faqs = [
  ["¿Qué es VIDENTIA?", "Una plataforma de inteligencia para marcas en Chile que ayuda a buscar, evaluar, investigar y vigilar antecedentes marcarios con evidencia trazable."],
  ["¿VIDENTIA reemplaza a INAPI?", "No. INAPI mantiene la fuente oficial. VIDENTIA organiza información y contexto para facilitar la investigación y el seguimiento."],
  ["¿Puedo comenzar con un nombre o una imagen?", "Sí. Puedes iniciar con nombre, logo, fotografía o una combinación y revisar señales denominativas, fonéticas, visuales y de cobertura."],
  ["¿Qué fuentes utiliza?", "VIDENTIA trabaja con antecedentes oficiales de propiedad industrial y puede sumar jurisprudencia TDPI y contexto público verificable del titular cuando existe identidad confirmada."],
  ["¿Cómo se contrata VIDENTIA?", "Las empresas pueden implementar la plataforma completa desde $5.000.000 CLP o integrar VIDENTIA mediante API desde USD 500 al mes más consumo. El alcance final depende de usuarios, volumen, integraciones y nivel de soporte."],
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
      description: "Plataforma de inteligencia para búsqueda, evaluación y vigilancia de marcas en Chile.",
      creator: { "@id": "https://www.n3uralia.com/#organization" },
      publisher: { "@id": "https://www.n3uralia.com/#organization" },
      featureList: ["Búsqueda de antecedentes marcarios", "Análisis denominativo y fonético", "Análisis visual", "Clases Niza", "Clasificación de Viena", "Precedentes TDPI", "Vigilancia de marcas", "Casos y evidencia", "API empresarial"],
      offers: {
        "@type": "OfferCatalog",
        name: "Modalidades comerciales VIDENTIA",
        itemListElement: [
          { "@type": "Offer", name: "VIDENTIA Plataforma Enterprise", priceCurrency: "CLP", price: "5000000", description: "Precio inicial desde $5.000.000 CLP. El alcance final depende de implementación, usuarios, integraciones y soporte." },
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
            <span className="leading-none"><span className="block text-[15px] font-semibold tracking-[0.16em] text-[#111827]">VIDENTIA</span><span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.18em] text-[#64748B]">by N3uralia</span></span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-5">
            <Link href="#producto" className="hidden text-sm text-[#667085] transition-colors hover:text-[#111827] md:block">Producto</Link>
            <Link href="#como-funciona" className="hidden text-sm text-[#667085] transition-colors hover:text-[#111827] md:block">Cómo funciona</Link>
            <Link href="#empresas" className="hidden text-sm text-[#667085] transition-colors hover:text-[#111827] lg:block">Empresas y API</Link>
            <Link href="/auth/login"><Button variant="ghost" className="hidden rounded-lg text-[#475569] hover:bg-black/5 sm:inline-flex">Iniciar sesión</Button></Link>
            <Link href="/demo"><Button className="h-10 gap-2 rounded-lg bg-[#111827] px-5 text-white shadow-none hover:bg-[#273244]">Probar VIDENTIA <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-black/10 px-5 pb-24 pt-36 lg:px-10 lg:pb-32 lg:pt-44">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] border-l border-black/5 bg-[#F1F3F0] lg:block" />
        <div className="relative mx-auto grid max-w-[1480px] gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0F766E]">INTELLIGENCE · TRADEMARKS · CHILE</p>
            <h1 className="mt-7 max-w-3xl text-[clamp(3rem,6.2vw,6.6rem)] font-normal leading-[0.95] tracking-[-0.055em] text-[#111827]">Convierte señales dispersas en decisiones marcarias claras.</h1>
            <p className="mt-8 max-w-2xl text-[17px] leading-8 text-[#667085]">VIDENTIA reúne búsqueda, evidencia, contexto del titular, precedentes y vigilancia en una sola experiencia para marcas en Chile.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link href="/demo"><Button size="lg" className="h-12 gap-2 rounded-lg bg-[#0F766E] px-6 text-white shadow-none hover:bg-[#134E4A]">Analizar una marca <ArrowRight className="h-4 w-4" /></Button></Link><Link href="#empresas"><Button size="lg" variant="outline" className="h-12 rounded-lg border-black/15 bg-transparent px-6 hover:bg-black/5">Soluciones para empresas</Button></Link></div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-black/10 pt-5 text-xs text-[#667085]">{["INAPI como fuente oficial", "Niza + Viena", "Precedentes TDPI", "Evidencia trazable"].map(item => <span key={item} className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#0F766E]" />{item}</span>)}</div>
          </div>
          <SystemPreview />
        </div>
      </section>

      <section id="producto" className="px-5 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-[1480px]">
          <div className="grid gap-10 border-b border-black/10 pb-14 lg:grid-cols-[0.7fr_1.3fr] lg:items-end"><div><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0F766E]">SYS 01 — EVIDENCIA</p><h2 className="mt-5 max-w-xl text-[clamp(2.3rem,4vw,4.5rem)] font-normal leading-[1.02] tracking-[-0.045em]">No escondemos una decisión detrás de un porcentaje.</h2></div><p className="max-w-2xl text-lg leading-8 text-[#667085] lg:justify-self-end">Cada dimensión se presenta por separado para que el profesional pueda entender qué encontró el sistema, de dónde viene y por qué merece atención.</p></div>
          <div className="grid border-b border-black/10 md:grid-cols-2 lg:grid-cols-4">{signals.map(({ index, icon: Icon, label, value, detail }, i) => <article key={label} className={`py-9 md:px-7 ${i > 0 ? "md:border-l md:border-black/10" : ""}`}><div className="flex items-center justify-between"><span className="font-mono text-[10px] text-[#98A2B3]">{index}</span><Icon className="h-4 w-4 text-[#0F766E]" /></div><p className="mt-10 text-xs font-medium uppercase tracking-[0.16em] text-[#667085]">{label}</p><p className="mt-2 text-xl font-medium tracking-[-0.025em]">{value}</p><p className="mt-4 text-sm leading-6 text-[#667085]">{detail}</p></article>)}</div>
        </div>
      </section>

      <section id="como-funciona" className="bg-[#111827] px-5 py-24 text-white lg:px-10 lg:py-32">
        <div className="mx-auto grid max-w-[1480px] gap-16 lg:grid-cols-[0.78fr_1.22fr]">
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#63C7B8]">SYS 02 — WORKFLOW</p><h2 className="mt-5 max-w-xl text-[clamp(2.4rem,4vw,4.7rem)] font-normal leading-[1.02] tracking-[-0.045em]">Una investigación que continúa después de la búsqueda.</h2><p className="mt-7 max-w-lg text-lg leading-8 text-slate-400">Buscar es sólo el inicio. VIDENTIA preserva el contexto, conecta antecedentes y permite vigilar cambios posteriores.</p></div>
          <div className="border-t border-white/15">{workflow.map(([number, title, copy]) => <div key={number} className="grid gap-4 border-b border-white/15 py-7 sm:grid-cols-[72px_180px_1fr]"><span className="font-mono text-xs text-[#63C7B8]">{number}</span><h3 className="font-medium text-white">{title}</h3><p className="text-sm leading-6 text-slate-400">{copy}</p></div>)}</div>
        </div>
      </section>

      <section className="px-5 py-24 lg:px-10 lg:py-32"><div className="mx-auto grid max-w-[1480px] gap-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center"><DecisionPreview /><div className="max-w-xl lg:justify-self-end"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0F766E]">SYS 03 — CONTEXTO</p><h2 className="mt-5 text-[clamp(2.3rem,3.8vw,4.2rem)] font-normal leading-[1.04] tracking-[-0.045em]">Antecedentes, titular y señales en una misma lectura.</h2><p className="mt-6 text-lg leading-8 text-[#667085]">VIDENTIA puede conectar una marca con su titular, familia marcaria, precedentes y eventos verificables sin confundir evidencia con inferencia.</p><div className="mt-8 border-t border-black/10">{["Fuente oficial siempre visible", "Identidad del titular sólo cuando está verificada", "Contexto explicado sin predicción jurídica", "Vigilancia acumulativa desde la última revisión"].map(item => <div key={item} className="flex items-center gap-3 border-b border-black/10 py-4 text-sm text-[#475467]"><Check className="h-4 w-4 text-[#0F766E]" />{item}</div>)}</div></div></div></section>

      <section id="empresas" className="border-y border-black/10 bg-white px-5 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-[1480px]">
          <div className="grid gap-10 border-b border-black/10 pb-14 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0F766E]">SYS 04 — COMMERCIAL</p><h2 className="mt-5 max-w-2xl text-[clamp(2.4rem,4.3vw,4.8rem)] font-normal leading-[1.02] tracking-[-0.045em]">Usa la plataforma completa o integra la inteligencia en tus sistemas.</h2></div>
            <p className="max-w-2xl text-lg leading-8 text-[#667085] lg:justify-self-end">VIDENTIA se implementa para equipos que quieren operar dentro de la plataforma o se conecta mediante API para empresas que necesitan incorporar estas capacidades en su propia tecnología.</p>
          </div>

          <div className="grid border-b border-black/10 lg:grid-cols-2">
            <article className="py-10 lg:pr-12">
              <div className="flex items-center justify-between gap-4"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#98A2B3]">ENTERPRISE / PLATFORM</p><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0F766E]">Implementación empresarial</span></div>
              <h3 className="mt-8 text-3xl font-normal tracking-[-0.035em]">VIDENTIA Plataforma</h3>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[#667085]">Para estudios jurídicos, áreas legales y empresas que quieren centralizar búsqueda, análisis, casos y vigilancia en una sola operación.</p>
              <div className="mt-9 border-t border-black/10 pt-7"><p className="text-xs uppercase tracking-[0.14em] text-[#667085]">Desde</p><p className="mt-2 text-[clamp(2.6rem,5vw,4.8rem)] font-normal leading-none tracking-[-0.05em]">$5.000.000 <span className="text-lg tracking-normal text-[#667085]">CLP</span></p><p className="mt-3 text-xs leading-5 text-[#98A2B3]">Implementación inicial. El valor final depende de usuarios, integraciones, soporte y alcance.</p></div>
              <div className="mt-8 border-t border-black/10">{platformIncludes.map(item => <div key={item} className="flex items-center gap-3 border-b border-black/10 py-4 text-sm text-[#475467]"><Check className="h-4 w-4 text-[#0F766E]" />{item}</div>)}</div>
              <a href="https://www.n3uralia.com" target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#0F766E]">Solicitar propuesta empresarial <ArrowRight className="h-4 w-4" /></a>
            </article>

            <article className="border-t border-black/10 py-10 lg:border-l lg:border-t-0 lg:pl-12">
              <div className="flex items-center justify-between gap-4"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#98A2B3]">ENTERPRISE / API</p><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0F766E]">Suscripción + consumo</span></div>
              <h3 className="mt-8 text-3xl font-normal tracking-[-0.035em]">VIDENTIA API</h3>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[#667085]">Para compañías y plataformas que necesitan integrar búsqueda e inteligencia marcaria directamente dentro de sus propios productos o procesos.</p>
              <div className="mt-9 border-t border-black/10 pt-7"><p className="text-xs uppercase tracking-[0.14em] text-[#667085]">Desde</p><p className="mt-2 text-[clamp(2.6rem,5vw,4.8rem)] font-normal leading-none tracking-[-0.05em]">USD 500 <span className="text-lg tracking-normal text-[#667085]">/ mes</span></p><p className="mt-3 text-xs leading-5 text-[#98A2B3]">Base mensual más consumo. El valor final depende del volumen, capacidades contratadas e integración.</p></div>
              <div className="mt-8 border-t border-black/10">{apiIncludes.map(item => <div key={item} className="flex items-center gap-3 border-b border-black/10 py-4 text-sm text-[#475467]"><Check className="h-4 w-4 text-[#0F766E]" />{item}</div>)}</div>
              <a href="https://www.n3uralia.com" target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#0F766E]">Cotizar integración API <ArrowRight className="h-4 w-4" /></a>
            </article>
          </div>
          <p className="mt-5 max-w-4xl text-xs leading-6 text-[#98A2B3]">Los precios publicados son valores iniciales de referencia y no constituyen una cotización definitiva. Migraciones, integraciones especiales, SLA, despliegues dedicados, soporte ampliado y volúmenes superiores se cotizan según alcance.</p>
        </div>
      </section>

      <section className="border-b border-black/10 bg-[#F7F8F6] px-5 py-16 lg:px-10"><div className="mx-auto grid max-w-[1480px] gap-8 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#667085]">PRODUCT BY N3URALIA</p><h2 className="mt-4 text-3xl font-normal tracking-[-0.035em]">VIDENTIA es un desarrollo de N3uralia.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#667085]">N3uralia diseña sistemas de inteligencia, automatización y software para operaciones complejas. VIDENTIA aplica esa experiencia al trabajo marcario en Chile.</p></div><a href="https://www.n3uralia.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F766E]">Conocer N3uralia <ArrowRight className="h-4 w-4" /></a></div></section>

      <section id="preguntas" className="px-5 py-24 lg:px-10 lg:py-32"><div className="mx-auto max-w-[1180px]"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0F766E]">SYS 05 — FAQ</p><h2 className="mt-5 max-w-3xl text-[clamp(2.2rem,3.8vw,4rem)] font-normal leading-[1.04] tracking-[-0.045em]">Lo esencial, sin complejidad innecesaria.</h2><div className="mt-12 border-t border-black/10">{faqs.map(([question, answer], index) => <div key={question} className="grid gap-4 border-b border-black/10 py-7 md:grid-cols-[64px_0.8fr_1.2fr]"><span className="font-mono text-[10px] text-[#98A2B3]">0{index + 1}</span><h3 className="font-medium">{question}</h3><p className="text-sm leading-7 text-[#667085]">{answer}</p></div>)}</div></div></section>

      <section className="border-t border-black/10 bg-[#111827] px-5 py-24 text-white lg:px-10"><div className="mx-auto max-w-[1480px]"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#63C7B8]">READY TO REVIEW</p><div className="mt-6 flex flex-col gap-9 lg:flex-row lg:items-end lg:justify-between"><div><h2 className="max-w-4xl text-[clamp(2.6rem,5vw,5.6rem)] font-normal leading-[0.98] tracking-[-0.05em]">Prueba la inteligencia. Integra cuando estés listo.</h2><p className="mt-6 max-w-2xl text-base leading-7 text-slate-400">Comienza con una marca real o conversa con N3uralia para implementar VIDENTIA como plataforma o API dentro de tu empresa.</p></div><div className="flex flex-col gap-3 sm:flex-row"><Link href="/demo"><Button size="lg" className="h-12 gap-2 rounded-lg bg-[#F7F8F6] px-6 text-[#111827] hover:bg-white">Probar VIDENTIA <ArrowRight className="h-4 w-4" /></Button></Link><a href="https://www.n3uralia.com" target="_blank" rel="noreferrer"><Button size="lg" variant="outline" className="h-12 rounded-lg border-white/20 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white">Hablar con N3uralia</Button></a></div></div></div></section>

      <footer className="border-t border-white/10 bg-[#111827] px-5 py-10 text-slate-400 lg:px-10"><div className="mx-auto flex max-w-[1480px] flex-col gap-8 md:flex-row md:items-end md:justify-between"><div><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-[10px] border border-white/15 text-sm font-semibold text-white">V</span><div><p className="text-sm font-semibold tracking-[0.14em] text-white">VIDENTIA</p><p className="mt-1 text-[9px] uppercase tracking-[0.18em]">by N3uralia</p></div></div><p className="mt-5 max-w-xl text-xs leading-6">Inteligencia para marcas en Chile. VIDENTIA apoya investigación y gestión de evidencia; no reemplaza evaluación jurídica profesional ni a las fuentes oficiales.</p></div><div className="flex flex-wrap gap-x-6 gap-y-2 text-xs"><Link href="/demo" className="hover:text-white">Demo</Link><Link href="#empresas" className="hover:text-white">Empresas y API</Link><a href="https://www.inapi.cl" target="_blank" rel="noreferrer" className="hover:text-white">INAPI</a><a href="https://www.n3uralia.com" target="_blank" rel="noreferrer" className="hover:text-white">N3uralia</a><span>© {new Date().getFullYear()} VIDENTIA</span></div></div></footer>
    </main>
  )
}

function SystemPreview() {
  return <div className="relative lg:pl-6"><div className="border border-black/10 bg-white p-3"><div className="border border-black/10"><div className="flex items-center justify-between border-b border-black/10 px-5 py-4"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#98A2B3]">SYS 01 / STATUS ACTIVE</p><p className="mt-2 font-medium">PATAGONIA</p></div><span className="h-2 w-2 rounded-full bg-[#0F766E]" /></div><div className="grid sm:grid-cols-[170px_1fr]"><div className="flex min-h-48 items-center justify-center border-b border-black/10 bg-[#F1F3F0] p-6 sm:border-b-0 sm:border-r"><div className="grid h-28 w-28 place-items-center border border-black/10 bg-white"><ImageIcon className="h-8 w-8 text-[#0F766E]" /></div></div><div className="p-6"><p className="text-[10px] uppercase tracking-[0.16em] text-[#98A2B3]">Antecedente priorizado</p><div className="mt-3 flex items-start justify-between gap-4"><div><p className="text-xl font-medium tracking-[-0.025em]">PATAGONIA OUTDOOR</p><p className="mt-2 text-xs text-[#667085]">Registro vigente · clase relacionada</p></div><Eye className="h-4 w-4 text-[#98A2B3]" /></div><div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5"><MiniSignal label="Nombre" value="Muy similar" /><MiniSignal label="Fonética" value="Alta" /><MiniSignal label="Visual" value="Moderada" /><MiniSignal label="Niza" value="Coincidente" /></div></div></div><div className="border-t border-black/10 bg-[#F7F8F6] px-5 py-4"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" /><p className="text-sm leading-6 text-[#475467]"><span className="font-medium text-[#111827]">Por qué importa:</span> la proximidad verbal y el ámbito comercial se acumulan; la señal visual es secundaria.</p></div></div></div></div><div className="mt-4 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-[#98A2B3]"><span>INAPI · NIZA · VIENA</span><span>SYNCED</span></div></div>
}

function DecisionPreview() {
  return <div className="border border-black/10 bg-white p-6 sm:p-8"><div className="flex items-center justify-between border-b border-black/10 pb-5"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#98A2B3]">CASE READING / 01</p><p className="mt-2 text-lg font-medium">Tu marca ↔ antecedente</p></div><span className="border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-800">Revisar</span></div><div className="grid gap-4 py-7 sm:grid-cols-2"><LogoPlaceholder label="Tu marca" /><LogoPlaceholder label="Antecedente oficial" /></div><div className="grid grid-cols-2 border-t border-black/10 sm:grid-cols-4"><Evidence label="Nombre" value="Muy similar" /><Evidence label="Fonética" value="Alta" /><Evidence label="Visual" value="Moderada" /><Evidence label="Ámbito" value="Relacionado" /></div></div>
}

function MiniSignal({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] uppercase tracking-[0.14em] text-[#98A2B3]">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div> }
function LogoPlaceholder({ label }: { label: string }) { return <div className="border border-black/10 bg-[#F7F8F6] p-4"><p className="text-[10px] uppercase tracking-[0.14em] text-[#98A2B3]">{label}</p><div className="mt-4 flex h-28 items-center justify-center bg-white text-[#98A2B3]"><ImageIcon className="h-7 w-7" /></div></div> }
function Evidence({ label, value }: { label: string; value: string }) { return <div className="border-r border-black/10 px-3 py-4 last:border-r-0"><p className="text-[10px] uppercase tracking-[0.12em] text-[#98A2B3]">{label}</p><p className="mt-1 text-xs font-medium">{value}</p></div> }
