import type { Metadata } from "next"
import Link from "next/link"
import type { PublicLocale } from "@/lib/marketing-locale"
import { PatentPreviewSearch } from "@/components/patent-preview-search"

const copy = {
  es: {
    title: "Inteligencia de patentes",
    description: "Explora antecedentes técnicos, empresas e inventores con información oficial de INAPI y vigilancia competitiva.",
    platform: "Plataforma",
    brands: "Marcas",
    patents: "Patentes",
    technologies: "Tecnologías",
    resources: "Recursos",
    login: "Iniciar sesión",
    hero: "Conoce lo que ya existe antes de invertir en lo que viene.",
    lead: "Describe una invención o busca por tecnología, título, solicitante o IPC. VIDENTIA recupera antecedentes observados, identifica actores y separa evidencia, análisis y conclusión legal.",
    primary: "Abrir Patent Intelligence",
    source: "Datos oficiales INAPI",
    modes: [["PRIOR ART", "¿Qué antecedentes técnicos ya existen?"], ["PATENTABILITY · REVIEW", "¿Qué puede afectar novedad o actividad inventiva?"], ["FTO · REVIEW", "¿Qué derechos activos podrían importar en un mercado?"], ["COMPETITOR WATCH", "¿Qué están presentando competidores o inventores?"]],
    methodTitle: "Evidencia antes que conclusión.",
    methodBody: "VIDENTIA organiza expedientes observados, prioridades, IPC, titulares, inventores y estado disponible. No afirma patentabilidad ni freedom to operate sin la cobertura y revisión jurídica necesarias.",
    roadmap: "Family resolution, jurisdictions, citations y cobertura internacional son el siguiente tramo antes de elevar Patentability/FTO a modos maduros.",
  },
  en: {
    title: "Patent intelligence",
    description: "Explore technical prior art, companies and inventors using official INAPI information and competitive monitoring.",
    platform: "Platform",
    brands: "Brands",
    patents: "Patents",
    technologies: "Technologies",
    resources: "Resources",
    login: "Log in",
    hero: "Know what already exists before you invest in what comes next.",
    lead: "Describe an invention or search by technology, title, applicant or IPC. VIDENTIA retrieves observed prior art, identifies actors and keeps evidence, analysis and legal conclusion separate.",
    primary: "Open Patent Intelligence",
    source: "Official INAPI data",
    modes: [["PRIOR ART", "What technical prior art already exists?"], ["PATENTABILITY · REVIEW", "What may affect novelty or inventive step?"], ["FTO · REVIEW", "What active rights may matter in a market?"], ["COMPETITOR WATCH", "What are competitors or inventors filing?"]],
    methodTitle: "Evidence before conclusion.",
    methodBody: "VIDENTIA organizes observed records, priorities, IPC, owners, inventors and available status. It does not claim patentability or freedom to operate without the coverage and legal review required.",
    roadmap: "Family resolution, jurisdictions, citations and international coverage are the next layer before Patentability/FTO become mature product modes.",
  },
} as const

export function patentsMetadata(locale: PublicLocale): Metadata {
  const c = copy[locale]
  const path = locale === "es" ? "/es/patentes" : "/en/patents"
  return {
    title: `${c.title} | VIDENTIA`,
    description: c.description,
    alternates: { canonical: path, languages: { "es-CL": "/es/patentes", en: "/en/patents" } },
    robots: { index: true, follow: true },
  }
}

function PatentSymbol() {
  return (
    <div className="relative h-48 w-64" aria-hidden="true">
      <span className="absolute left-0 top-0 h-40 w-52 border-[20px] border-[#20393A]" />
      <span className="absolute left-10 top-9 h-32 w-44 border-[18px] border-[#4A7F74]" />
      <span className="absolute left-[100px] top-[76px] h-20 w-20 bg-[#96B5A6]" />
    </div>
  )
}

export function LocalizedPatentsPage({ locale }: { locale: PublicLocale }) {
  const c = copy[locale]
  const base = `/${locale}`
  const patentsPath = locale === "es" ? "/es/patentes" : "/en/patents"
  const technologiesPath = locale === "es" ? "/es/tecnologias" : "/en/technologies"
  const otherPath = locale === "es" ? "/en/patents" : "/es/patentes"

  return (
    <main className="min-h-screen bg-[#0F2A33] text-white">
      <nav className="border-b border-[#20363E] bg-[#091A20]">
        <div className="mx-auto flex h-20 max-w-[1480px] items-center justify-between gap-5 px-5 lg:px-10">
          <Link href={base}><span className="block text-[15px] tracking-[0.22em] text-[#E7DFCE]">ViDENTiA</span><span className="mt-1 block text-[7px] uppercase tracking-[0.16em] text-[#7F918F]">IP & TECHNOLOGY INTELLIGENCE</span></Link>
          <div className="flex items-center gap-4 text-[10px] font-medium tracking-[0.07em] text-[#BDBEBD] sm:gap-5">
            <Link href={base} className="hidden hover:text-white md:inline">{c.platform}</Link>
            <Link href={`${base}#brands`} className="hidden hover:text-white lg:inline">{c.brands}</Link>
            <Link href={patentsPath} aria-current="page" className="text-white">{c.patents}</Link>
            <Link href={technologiesPath} className="hidden hover:text-white sm:inline">{c.technologies}</Link>
            <Link href={`${base}/docs`} className="hidden hover:text-white xl:inline">{c.resources}</Link>
            <Link href={otherPath} className="text-[#96B5A6]">{locale === "es" ? "EN" : "ES"}</Link>
            <Link href={`${base}/auth/login?redirectTo=${encodeURIComponent("/patentes")}`} className="bg-[#4A7F74] px-4 py-2.5 text-white">{c.login}</Link>
          </div>
        </div>
      </nav>

      <section className="border-b border-[#294047] px-5 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-[1480px] gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">03 / PATENT INTELLIGENCE</p>
            <h1 className="mt-6 max-w-4xl text-[clamp(3.7rem,7vw,7.3rem)] font-light leading-[0.9] tracking-[-0.06em] text-[#E7DFCE]">{c.hero}</h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-[#BDBEBD]">{c.lead}</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link href={`${base}/auth/login?redirectTo=${encodeURIComponent("/patentes")}`} className="bg-[#4A7F74] px-5 py-3.5 text-xs font-medium tracking-[0.06em] text-white">{c.primary}</Link><span className="bg-[#172F34] px-5 py-3.5 text-xs text-[#96B5A6]">{c.source}</span></div>
          </div>
          <div className="flex min-h-[480px] flex-col justify-between bg-[#091A20] p-8 sm:p-12"><PatentSymbol /><div><p className="text-[10px] font-medium tracking-[0.16em] text-[#96B5A6]">SOURCE ≠ ANALYSIS ≠ LEGAL CONCLUSION</p><p className="mt-4 max-w-lg text-2xl font-light leading-9 text-[#E7DFCE]">Potential prior art → Requires review → Relevant evidence.</p></div></div>
        </div>
      </section>

      <PatentPreviewSearch locale={locale} />

      <section className="px-5 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-[1480px]"><p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">FOUR MODES / ONE EVIDENCE LAYER</p><div className="mt-10 border-y border-[#294047]">{c.modes.map(([title, body], index) => <article key={title} className="grid gap-4 border-b border-[#294047] py-8 last:border-b-0 md:grid-cols-[70px_300px_1fr]"><span className="text-[10px] text-[#456E8E]">0{index + 1}</span><h2 className="text-sm font-medium tracking-[0.1em] text-[#E7DFCE]">{title}</h2><p className="max-w-3xl text-sm leading-7 text-[#BDBEBD]">{body}</p></article>)}</div></div>
      </section>

      <section className="border-y border-[#294047] bg-[#091A20] px-5 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto grid max-w-[1480px] gap-10 lg:grid-cols-[0.8fr_1.2fr]"><h2 className="text-[clamp(3rem,5vw,5.3rem)] font-light leading-[0.95] tracking-[-0.055em] text-[#E7DFCE]">{c.methodTitle}</h2><div><p className="max-w-2xl text-base leading-8 text-[#BDBEBD]">{c.methodBody}</p><p className="mt-7 max-w-2xl border-l-2 border-[#456E8E] pl-4 text-xs leading-6 text-[#9EAAA8]">{c.roadmap}</p></div></div>
      </section>
    </main>
  )
}
