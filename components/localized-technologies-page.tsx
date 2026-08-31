import type { Metadata } from "next"
import Link from "next/link"
import type { PublicLocale } from "@/lib/marketing-locale"

const copy = {
  es: {
    title: "Inteligencia tecnológica",
    description: "Sigue investigación, patentes y actores para entender hacia dónde se mueve una tecnología con evidencia trazable.",
    platform: "Plataforma",
    brands: "Marcas",
    patents: "Patentes",
    technologies: "Tecnologías",
    resources: "Recursos",
    login: "Iniciar sesión",
    cta: "Abrir Technology Intelligence",
    hero: "Ve hacia dónde se mueve una tecnología antes de que la señal sea obvia.",
    lead: "VIDENTIA cruza investigación global, patentes INAPI y actividad pública para distinguir movimiento observado de ruido y convertir una búsqueda útil en vigilancia recurrente.",
    example: "Nanoburbujas · Acuicultura",
    axes: [["INVESTIGACIÓN", "Publicaciones recientes, dirección temporal y evidencia científica."], ["PATENTES", "Nuevos filings, antecedentes relevantes, IPC y solicitantes observados."], ["EMPRESAS", "Actores que aparecen de forma consistente en la evidencia disponible."], ["CONTEXTO", "Noticias y señales públicas contextualizan; no dictan por sí solas la conclusión."]],
    report: ["QUÉ CAMBIÓ", "POR QUÉ IMPORTA", "QUIÉN SE MUEVE", "QUÉ VIGILAR DESPUÉS"],
    watchTitle: "Una búsqueda puede convertirse en vigilancia.",
    watchBody: "Cuando una tecnología importa, el valor no está en repetir la misma búsqueda: está en detectar qué cambió desde la última revisión y elevar sólo lo que merece atención.",
    method: "VIDENTIA mantiene investigación, patentes y contexto como ejes separados. Una fuente caída no se interpreta como cero actividad y una noticia aislada no se presenta como tendencia.",
  },
  en: {
    title: "Technology intelligence",
    description: "Track research, patents and actors to understand where a technology is moving with traceable evidence.",
    platform: "Platform",
    brands: "Brands",
    patents: "Patents",
    technologies: "Technologies",
    resources: "Resources",
    login: "Log in",
    cta: "Open Technology Intelligence",
    hero: "See where a technology is moving before the signal becomes obvious.",
    lead: "VIDENTIA combines global research, INAPI patents and public activity to separate observed movement from noise and turn a useful search into recurring monitoring.",
    example: "Nanobubbles · Aquaculture",
    axes: [["RESEARCH", "Recent publications, temporal direction and scientific evidence."], ["PATENTS", "New filings, relevant prior art, IPC and observed applicants."], ["COMPANIES", "Actors appearing consistently in the available evidence."], ["CONTEXT", "News and public signals provide context; they do not dictate the conclusion on their own."]],
    report: ["WHAT CHANGED", "WHY IT MATTERS", "WHO IS MOVING", "WHAT TO WATCH NEXT"],
    watchTitle: "A search can become a watch.",
    watchBody: "When a technology matters, the value is not repeating the same search: it is detecting what changed since the last review and surfacing only what deserves attention.",
    method: "VIDENTIA keeps research, patents and context as separate axes. A source outage is not interpreted as zero activity, and an isolated news item is not presented as a trend.",
  },
} as const

export function technologiesMetadata(locale: PublicLocale): Metadata {
  const c = copy[locale]
  const path = locale === "es" ? "/es/tecnologias" : "/en/technologies"
  return {
    title: `${c.title} | VIDENTIA`,
    description: c.description,
    alternates: { canonical: path, languages: { "es-CL": "/es/tecnologias", en: "/en/technologies" } },
    robots: { index: true, follow: true },
  }
}

function TechnologySymbol() {
  return (
    <div className="relative h-48 w-64" aria-hidden="true">
      <span className="absolute left-0 top-7 h-4 w-4 rounded-full bg-[#456E8E]" />
      <span className="absolute left-0 top-[88px] h-4 w-4 rounded-full bg-[#4A7F74]" />
      <span className="absolute left-0 top-[148px] h-4 w-4 rounded-full bg-[#96B5A6]" />
      <span className="absolute left-6 top-[37px] h-px w-36 rotate-[18deg] bg-[#456E8E]" />
      <span className="absolute left-6 top-[95px] h-px w-36 bg-[#4A7F74]" />
      <span className="absolute left-6 top-[153px] h-px w-36 -rotate-[18deg] bg-[#96B5A6]" />
      <span className="absolute right-0 top-[55px] h-24 w-24 rounded-full border-[18px] border-[#96B5A6]" />
      <span className="absolute right-8 top-[87px] h-8 w-8 bg-[#20393A]" />
    </div>
  )
}

export function LocalizedTechnologiesPage({ locale }: { locale: PublicLocale }) {
  const c = copy[locale]
  const base = `/${locale}`
  const patentsPath = locale === "es" ? "/es/patentes" : "/en/patents"
  const technologyPath = locale === "es" ? "/es/tecnologias" : "/en/technologies"
  const otherPath = locale === "es" ? "/en/technologies" : "/es/tecnologias"

  return (
    <main className="min-h-screen bg-[#0F2A33] text-white">
      <nav className="border-b border-[#20363E] bg-[#091A20]">
        <div className="mx-auto flex h-20 max-w-[1480px] items-center justify-between gap-5 px-5 lg:px-10">
          <Link href={base}><span className="block text-[15px] tracking-[0.22em] text-[#E7DFCE]">ViDENTiA</span><span className="mt-1 block text-[7px] uppercase tracking-[0.16em] text-[#7F918F]">IP & TECHNOLOGY INTELLIGENCE</span></Link>
          <div className="flex items-center gap-4 text-[10px] font-medium tracking-[0.07em] text-[#BDBEBD] sm:gap-5">
            <Link href={base} className="hidden hover:text-white md:inline">{c.platform}</Link>
            <Link href={`${base}#brands`} className="hidden hover:text-white lg:inline">{c.brands}</Link>
            <Link href={patentsPath} className="hidden hover:text-white sm:inline">{c.patents}</Link>
            <Link href={technologyPath} aria-current="page" className="text-white">{c.technologies}</Link>
            <Link href={`${base}/docs`} className="hidden hover:text-white xl:inline">{c.resources}</Link>
            <Link href={otherPath} className="text-[#96B5A6]">{locale === "es" ? "EN" : "ES"}</Link>
            <Link href={`${base}/auth/login?redirectTo=${encodeURIComponent("/tecnologias")}`} className="bg-[#4A7F74] px-4 py-2.5 text-white">{c.login}</Link>
          </div>
        </div>
      </nav>

      <section className="border-b border-[#294047] px-5 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-[1480px] gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">04 / TECHNOLOGY INTELLIGENCE</p>
            <h1 className="mt-6 max-w-4xl text-[clamp(3.7rem,7vw,7.3rem)] font-light leading-[0.9] tracking-[-0.06em] text-[#E7DFCE]">{c.hero}</h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-[#BDBEBD]">{c.lead}</p>
            <Link href={`${base}/auth/login?redirectTo=${encodeURIComponent("/tecnologias")}`} className="mt-9 inline-block bg-[#4A7F74] px-5 py-3.5 text-xs font-medium tracking-[0.06em] text-white">{c.cta}</Link>
          </div>
          <div className="flex min-h-[480px] flex-col justify-between bg-[#091A20] p-8 sm:p-12">
            <TechnologySymbol />
            <div><p className="text-[10px] font-medium tracking-[0.16em] text-[#96B5A6]">EXAMPLE WATCH</p><p className="mt-3 text-3xl font-light tracking-[-0.04em] text-[#E7DFCE] sm:text-4xl">{c.example}</p></div>
          </div>
        </div>
      </section>

      <section className="px-5 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-[1480px]">
          <div className="border-y border-[#294047]">{c.axes.map(([title, body], index) => <article key={title} className="grid gap-4 border-b border-[#294047] py-8 last:border-b-0 md:grid-cols-[80px_260px_1fr]"><span className="text-[10px] text-[#456E8E]">0{index + 1}</span><h2 className="text-sm font-medium tracking-[0.1em] text-[#E7DFCE]">{title}</h2><p className="max-w-3xl text-sm leading-7 text-[#BDBEBD]">{body}</p></article>)}</div>
        </div>
      </section>

      <section className="border-y border-[#294047] bg-[#091A20] px-5 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto grid max-w-[1480px] gap-12 lg:grid-cols-[0.78fr_1.22fr]">
          <div><p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">SIGNATURE READOUT</p><h2 className="mt-5 max-w-2xl text-[clamp(3rem,5vw,5.3rem)] font-light leading-[0.95] tracking-[-0.055em] text-[#E7DFCE]">{c.example}</h2></div>
          <div className="border-y border-[#294047]">{c.report.map((item, index) => <div key={item} className="grid grid-cols-[60px_1fr] border-b border-[#294047] py-6 last:border-b-0"><span className="text-[10px] text-[#456E8E]">0{index + 1}</span><span className="text-sm font-medium tracking-[0.1em] text-white">{item}</span></div>)}</div>
        </div>
      </section>

      <section className="px-5 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto grid max-w-[1480px] gap-12 lg:grid-cols-2">
          <div><p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">WATCH</p><h2 className="mt-5 text-[clamp(3rem,5vw,5.1rem)] font-light leading-[0.95] tracking-[-0.055em] text-[#E7DFCE]">{c.watchTitle}</h2><p className="mt-7 max-w-2xl text-base leading-8 text-[#BDBEBD]">{c.watchBody}</p></div>
          <div className="flex flex-col justify-between bg-[#13272D] p-8 sm:p-10"><p className="text-sm leading-7 text-[#BDBEBD]">{c.method}</p><div className="mt-10 flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-[#96B5A6]" /><span className="h-px flex-1 bg-[#456E8E]" /><span className="h-8 w-8 border-[8px] border-[#4A7F74]" /></div></div>
        </div>
      </section>
    </main>
  )
}
