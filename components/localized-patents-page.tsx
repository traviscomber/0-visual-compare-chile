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
    howEyebrow: "CÓMO ANALIZA VIDENTIA UNA INVENCIÓN",
    howTitle: "De una idea técnica a evidencia revisable.",
    howRows: [
      ["BÚSQUEDA DE ANTECEDENTES", "Recupera documentos y registros relacionados con el concepto técnico descrito."],
      ["SIMILITUD Y RELEVANCIA", "Organiza coincidencias por relación técnica observada; no convierte similitud en conclusión jurídica."],
      ["SOLICITANTES E INVENTORES", "Identifica actores recurrentes y actividad observable alrededor del área técnica."],
      ["PAISAJE TECNOLÓGICO", "Agrupa IPC, temas y señales para entender dónde se concentra la actividad disponible."],
    ],
    modesEyebrow: "PRIOR ART / REVISIÓN ESTRUCTURADA",
    modes: [["PRIOR ART", "¿Qué antecedentes técnicos ya existen?"], ["PATENTABILITY · REVIEW", "¿Qué puede afectar novedad o actividad inventiva?"], ["FTO · REVIEW", "¿Qué derechos activos podrían importar en un mercado?"], ["COMPETITOR WATCH", "¿Qué están presentando competidores o inventores?"]],
    watchEyebrow: "MONITOREO DE PATENTES",
    watchTitle: "La búsqueda no termina cuando encuentras un antecedente.",
    watchBody: "Convierte una investigación importante en vigilancia recurrente para detectar nuevas solicitudes, cambios observables y actividad de actores definidos sin repetir el trabajo manualmente.",
    watchRows: ["Nueva actividad relevante", "Solicitantes e inventores definidos", "Tecnologías e IPC vigilados", "Evidencia fechada y trazable"],
    reportEyebrow: "PATENT REPORT",
    reportTitle: "Un reporte debe separar lo observado de lo interpretado.",
    reportRows: [["01", "QUÉ ENCONTRAMOS"], ["02", "POR QUÉ PUEDE SER RELEVANTE"], ["03", "QUIÉNES ESTÁN ACTIVOS"], ["04", "QUÉ REQUIERE REVISIÓN"], ["05", "QUÉ VIGILAR DESPUÉS"]],
    methodTitle: "Evidencia antes que conclusión.",
    methodBody: "VIDENTIA organiza expedientes observados, prioridades, IPC, titulares, inventores y estado disponible. No afirma patentabilidad ni freedom to operate sin la cobertura y revisión jurídica necesarias.",
    roadmap: "Family resolution, jurisdictions, citations y cobertura internacional son el siguiente tramo antes de elevar Patentability/FTO a modos maduros.",
    finalTitle: "Investiga primero. Decide con evidencia después.",
    finalBody: "Ejecuta una vista preliminar o entra al workspace para continuar con investigación, vigilancia y reportes.",
    finalPrimary: "Probar búsqueda de patentes",
    finalSecondary: "Abrir workspace",
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
    howEyebrow: "HOW VIDENTIA ANALYZES AN INVENTION",
    howTitle: "From a technical idea to reviewable evidence.",
    howRows: [
      ["PRIOR-ART SEARCH", "Retrieve documents and records related to the technical concept you describe."],
      ["SIMILARITY & RELEVANCE", "Organize matches by observed technical relationship without turning similarity into a legal conclusion."],
      ["APPLICANTS & INVENTORS", "Identify recurring actors and observable activity around the technical area."],
      ["TECHNOLOGY LANDSCAPE", "Group IPC, topics and signals to show where available activity is concentrated."],
    ],
    modesEyebrow: "PRIOR ART / STRUCTURED REVIEW",
    modes: [["PRIOR ART", "What technical prior art already exists?"], ["PATENTABILITY · REVIEW", "What may affect novelty or inventive step?"], ["FTO · REVIEW", "What active rights may matter in a market?"], ["COMPETITOR WATCH", "What are competitors or inventors filing?"]],
    watchEyebrow: "PATENT MONITORING",
    watchTitle: "The search does not end when you find prior art.",
    watchBody: "Turn an important investigation into a recurring watch for new filings, observable changes and activity from defined actors without repeating the research manually.",
    watchRows: ["New relevant activity", "Defined applicants and inventors", "Watched technologies and IPC", "Dated, traceable evidence"],
    reportEyebrow: "PATENT REPORT",
    reportTitle: "A report should separate what was observed from what was interpreted.",
    reportRows: [["01", "WHAT WE FOUND"], ["02", "WHY IT MAY MATTER"], ["03", "WHO IS ACTIVE"], ["04", "WHAT REQUIRES REVIEW"], ["05", "WHAT TO WATCH NEXT"]],
    methodTitle: "Evidence before conclusion.",
    methodBody: "VIDENTIA organizes observed records, priorities, IPC, owners, inventors and available status. It does not claim patentability or freedom to operate without the coverage and legal review required.",
    roadmap: "Family resolution, jurisdictions, citations and international coverage are the next layer before Patentability/FTO become mature product modes.",
    finalTitle: "Investigate first. Decide with evidence next.",
    finalBody: "Run a preliminary view or enter the workspace to continue with research, monitoring and reports.",
    finalPrimary: "Try patent search",
    finalSecondary: "Open workspace",
  },
} as const

export function patentsMetadata(locale: PublicLocale): Metadata {
  const c = copy[locale]
  const path = locale === "es" ? "/es/patentes" : "/patents"
  const alternatePath = locale === "es" ? "/patents" : "/es/patentes"
  const localeTag = locale === "es" ? "es_CL" : "en_US"
  const alternateLocale = locale === "es" ? "en_US" : "es_CL"
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: path, languages: { "es-CL": "/es/patentes", en: "/patents", "x-default": "/patents" } },
    openGraph: {
      title: `${c.title} | VIDENTIA`,
      description: c.description,
      url: path,
      siteName: "VIDENTIA",
      type: "website",
      locale: localeTag,
      alternateLocale: [alternateLocale],
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${c.title} | VIDENTIA` }],
    },
    twitter: { card: "summary_large_image", title: `${c.title} | VIDENTIA`, description: c.description, images: ["/opengraph-image"] },
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
  const patentsPath = locale === "es" ? "/es/patentes" : "/patents"
  const technologiesPath = locale === "es" ? "/es/tecnologias" : "/technologies"
  const trademarksPath = locale === "es" ? "/es/marcas" : "/trademarks"
  const otherPath = locale === "es" ? "/patents" : "/es/patentes"
  const loginHref = `${base}/auth/login?redirectTo=${encodeURIComponent("/patentes")}`

  return (
    <main className="min-h-screen bg-[#0F2A33] text-white">
      <nav className="border-b border-[#20363E] bg-[#091A20]">
        <div className="mx-auto flex h-20 max-w-[1480px] items-center justify-between gap-5 px-5 lg:px-10">
          <Link href={locale === "es" ? "/es" : "/"}><span className="block text-[15px] tracking-[0.22em] text-[#E7DFCE]">ViDENTiA</span><span className="mt-1 block text-[7px] uppercase tracking-[0.16em] text-[#7F918F]">IP & TECHNOLOGY INTELLIGENCE</span></Link>
          <div className="flex items-center gap-4 text-[10px] font-medium tracking-[0.07em] text-[#BDBEBD] sm:gap-5">
            <Link href={trademarksPath} className="hidden hover:text-white md:inline">{c.brands}</Link>
            <Link href={patentsPath} aria-current="page" className="text-white">{c.patents}</Link>
            <Link href={technologiesPath} className="hidden hover:text-white sm:inline">{c.technologies}</Link>
            <Link href={`${base}/docs`} className="hidden hover:text-white xl:inline">{c.resources}</Link>
            <Link href={otherPath} className="text-[#96B5A6]">{locale === "es" ? "EN" : "ES"}</Link>
            <Link href={loginHref} className="bg-[#4A7F74] px-4 py-2.5 text-white">{c.login}</Link>
          </div>
        </div>
      </nav>

      <section className="border-b border-[#294047] px-5 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-[1480px] gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">PATENT INTELLIGENCE</p>
            <h1 className="mt-6 max-w-4xl text-[clamp(3.7rem,7vw,7.3rem)] font-light leading-[0.9] tracking-[-0.06em] text-[#E7DFCE]">{c.hero}</h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-[#BDBEBD]">{c.lead}</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link href={loginHref} className="bg-[#4A7F74] px-5 py-3.5 text-xs font-medium tracking-[0.06em] text-white">{c.primary}</Link><span className="bg-[#172F34] px-5 py-3.5 text-xs text-[#96B5A6]">{c.source}</span></div>
          </div>
          <div className="flex min-h-[480px] flex-col justify-between bg-[#091A20] p-8 sm:p-12"><PatentSymbol /><div><p className="text-[10px] font-medium tracking-[0.16em] text-[#96B5A6]">SOURCE ≠ ANALYSIS ≠ LEGAL CONCLUSION</p><p className="mt-4 max-w-lg text-2xl font-light leading-9 text-[#E7DFCE]">Potential prior art → Requires review → Relevant evidence.</p></div></div>
        </div>
      </section>

      <PatentPreviewSearch locale={locale} />

      <section className="px-5 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-[1480px]">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">{c.howEyebrow}</p>
          <h2 className="mt-5 max-w-4xl text-[clamp(3rem,5vw,5.4rem)] font-light leading-[0.95] tracking-[-0.055em] text-[#E7DFCE]">{c.howTitle}</h2>
          <div className="mt-14 border-y border-[#294047]">
            {c.howRows.map(([title, body], index) => (
              <article key={title} className="grid gap-4 border-b border-[#294047] py-8 last:border-b-0 md:grid-cols-[70px_300px_1fr]">
                <span className="text-[10px] text-[#456E8E]">0{index + 1}</span>
                <h3 className="text-sm font-medium tracking-[0.1em] text-[#E7DFCE]">{title}</h3>
                <p className="max-w-3xl text-sm leading-7 text-[#BDBEBD]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#294047] bg-[#091A20] px-5 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-[1480px]">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">{c.modesEyebrow}</p>
          <div className="mt-10 border-y border-[#294047]">{c.modes.map(([title, body], index) => <article key={title} className="grid gap-4 border-b border-[#294047] py-8 last:border-b-0 md:grid-cols-[70px_300px_1fr]"><span className="text-[10px] text-[#456E8E]">0{index + 1}</span><h2 className="text-sm font-medium tracking-[0.1em] text-[#E7DFCE]">{title}</h2><p className="max-w-3xl text-sm leading-7 text-[#BDBEBD]">{body}</p></article>)}</div>
        </div>
      </section>

      <section className="px-5 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto grid max-w-[1480px] gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div><p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">{c.watchEyebrow}</p><h2 className="mt-5 text-[clamp(3rem,5vw,5.2rem)] font-light leading-[0.95] tracking-[-0.055em] text-[#E7DFCE]">{c.watchTitle}</h2><p className="mt-7 max-w-2xl text-base leading-8 text-[#BDBEBD]">{c.watchBody}</p></div>
          <div className="border-y border-[#294047]">{c.watchRows.map((item, index) => <div key={item} className="grid grid-cols-[60px_1fr] border-b border-[#294047] py-6 last:border-b-0"><span className="text-[10px] text-[#456E8E]">0{index + 1}</span><span className="text-sm font-medium tracking-[0.08em] text-[#E7DFCE]">{item}</span></div>)}</div>
        </div>
      </section>

      <section className="border-y border-[#294047] bg-[#091A20] px-5 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto grid max-w-[1480px] gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div><p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">{c.reportEyebrow}</p><h2 className="mt-5 text-[clamp(3rem,5vw,5.2rem)] font-light leading-[0.95] tracking-[-0.055em] text-[#E7DFCE]">{c.reportTitle}</h2></div>
          <div className="border-y border-[#294047]">{c.reportRows.map(([index, item]) => <div key={item} className="grid grid-cols-[60px_1fr] border-b border-[#294047] py-6 last:border-b-0"><span className="text-[10px] text-[#456E8E]">{index}</span><span className="text-sm font-medium tracking-[0.1em] text-white">{item}</span></div>)}</div>
        </div>
      </section>

      <section className="px-5 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto grid max-w-[1480px] gap-10 lg:grid-cols-[0.8fr_1.2fr]"><h2 className="text-[clamp(3rem,5vw,5.3rem)] font-light leading-[0.95] tracking-[-0.055em] text-[#E7DFCE]">{c.methodTitle}</h2><div><p className="max-w-2xl text-base leading-8 text-[#BDBEBD]">{c.methodBody}</p><p className="mt-7 max-w-2xl border-l-2 border-[#456E8E] pl-4 text-xs leading-6 text-[#9EAAA8]">{c.roadmap}</p></div></div>
      </section>

      <section className="border-t border-[#294047] bg-[#091A20] px-5 py-24 lg:px-10 lg:py-28">
        <div className="mx-auto flex max-w-[1480px] flex-col justify-between gap-10 lg:flex-row lg:items-end">
          <div><h2 className="max-w-4xl text-[clamp(3.2rem,5.4vw,5.8rem)] font-light leading-[0.94] tracking-[-0.055em] text-[#E7DFCE]">{c.finalTitle}</h2><p className="mt-6 max-w-2xl text-base leading-8 text-[#BDBEBD]">{c.finalBody}</p></div>
          <div className="flex flex-wrap gap-3"><a href="#patent-preview-search" className="border border-[#456E8E] px-5 py-3.5 text-xs font-medium tracking-[0.06em] text-[#E7DFCE]">{c.finalPrimary}</a><Link href={loginHref} className="bg-[#4A7F74] px-5 py-3.5 text-xs font-medium tracking-[0.06em] text-white">{c.finalSecondary}</Link></div>
        </div>
      </section>
    </main>
  )
}
