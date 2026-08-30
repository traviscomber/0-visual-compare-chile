import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BellRing, Building2, Database, Search, ShieldCheck } from "lucide-react"
import type { PublicLocale } from "@/lib/marketing-locale"
import { PatentPreviewSearch } from "@/components/patent-preview-search"

const copy = {
  es: {
    title: "Inteligencia de patentes",
    description: "Explora tecnología, empresas e inventores con información oficial de INAPI y capacidades de vigilancia para equipos.",
    home: "Marcas",
    patents: "Patentes",
    resources: "Recursos",
    login: "Iniciar sesión",
    access: "Acceso empresarial",
    hero: "Entiende quién está innovando y dónde.",
    lead: "Busca solicitudes y patentes por tecnología, título, solicitante o IPC. Construye perfiles competitivos de empresas y sigue actividad nueva desde un solo workspace.",
    primary: "Abrir Patent Intelligence",
    secondary: "Solicitar acceso empresarial",
    source: "Datos oficiales INAPI",
    cards: [
      ["Buscar patentes", "Tecnología, título, solicitante e IPC sobre el corpus oficial sincronizado."],
      ["Analizar empresas", "Cartera observada, tecnologías dominantes, inventores y actividad reciente."],
      ["Histórico tecnológico", "Cobertura histórica para entender actividad por empresa y familias IPC."],
      ["Vigilancia competitiva", "Alertas sobre nueva actividad observada en empresas o tecnologías seguidas."],
    ],
    methodTitle: "Evidencia antes que predicción.",
    methodBody: "VIDENTIA organiza expedientes observados y señales verificables. Los perfiles competitivos describen el corpus disponible; no sustituyen una conclusión jurídica ni una evaluación profesional.",
    finalTitle: "Patentes forma parte del workspace empresarial.",
    finalBody: "La superficie pública explica cobertura y capacidades. La búsqueda completa, los perfiles de empresa y las alertas requieren acceso autenticado de organización.",
  },
  en: {
    title: "Patent intelligence",
    description: "Explore technology, companies and inventors using official INAPI information and monitoring capabilities built for teams.",
    home: "Trademarks",
    patents: "Patents",
    resources: "Resources",
    login: "Sign in",
    access: "Enterprise access",
    hero: "Understand who is innovating and where.",
    lead: "Search applications and patents by technology, title, applicant or IPC. Build competitive company profiles and follow new activity from one workspace.",
    primary: "Open Patent Intelligence",
    secondary: "Request enterprise access",
    source: "Official INAPI data",
    cards: [
      ["Search patents", "Technology, title, applicant and IPC across the synchronized official corpus."],
      ["Analyze companies", "Observed portfolio, dominant technologies, inventors and recent activity."],
      ["Technology history", "Historical coverage to understand activity by company and IPC families."],
      ["Competitive monitoring", "Alerts for newly observed activity across followed companies or technologies."],
    ],
    methodTitle: "Evidence before prediction.",
    methodBody: "VIDENTIA organizes observed records and verifiable signals. Competitive profiles describe the available corpus; they do not replace a legal conclusion or professional review.",
    finalTitle: "Patents is part of the enterprise workspace.",
    finalBody: "The public surface explains coverage and capabilities. Full search, company profiles and alerts require authenticated organizational access.",
  },
} as const

export function patentsMetadata(locale: PublicLocale): Metadata {
  const c = copy[locale]
  const path = locale === "es" ? "/es/patentes" : "/en/patents"
  return {
    title: `${c.title} | VIDENTIA`,
    description: c.description,
    alternates: {
      canonical: path,
      languages: { "es-CL": "/es/patentes", "en": "/en/patents" },
    },
    robots: { index: true, follow: true },
  }
}

export function LocalizedPatentsPage({ locale }: { locale: PublicLocale }) {
  const c = copy[locale]
  const base = `/${locale}`
  const patentsPath = locale === "es" ? `${base}/patentes` : `${base}/patents`
  const otherPath = locale === "es" ? "/en/patents" : "/es/patentes"
  const cardIcons = [Search, Building2, Database, BellRing] as const

  return (
    <main className="min-h-screen bg-[#0F2A33] text-[#E7DFCE]">
      <nav className="border-b border-[#263D44] bg-[#091A20]">
        <div className="mx-auto flex h-20 max-w-[1480px] items-center justify-between gap-6 px-5 lg:px-10">
          <Link href={base} className="min-w-0">
            <span className="block text-[15px] font-normal tracking-[0.22em]">ViDENTiA</span>
            <span className="mt-1 block text-[7px] uppercase tracking-[0.16em] text-[#8F9998]">{locale === "es" ? "Inteligencia de propiedad intelectual" : "Intellectual property intelligence"}</span>
          </Link>
          <div className="flex items-center gap-5 text-xs text-[#BDBEBD]">
            <Link href={`${base}/demo`} className="hidden hover:text-white sm:inline">{c.home}</Link>
            <Link href={patentsPath} aria-current="page" className="text-white">{c.patents}</Link>
            <Link href={`${base}/docs`} className="hidden hover:text-white md:inline">{c.resources}</Link>
            <Link href={otherPath} className="hover:text-white">{locale === "es" ? "EN" : "ES"}</Link>
            <Link href={`${base}/auth/login?redirectTo=${encodeURIComponent("/patentes")}`} className="hidden hover:text-white lg:inline">{c.login}</Link>
            <Link href={`${base}/acceso-empresarial`} className="border border-[#4A7F74] px-4 py-2 text-white hover:bg-[#173B37]">{c.access}</Link>
          </div>
        </div>
      </nav>

      <section className="border-b border-[#263D44] px-5 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-[1480px] gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <h1 className="max-w-3xl text-[clamp(3.5rem,7vw,7.2rem)] font-light leading-[0.92] tracking-[-0.055em]">{c.hero}</h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-[#BDBEBD]">{c.lead}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={`${base}/auth/login?redirectTo=${encodeURIComponent("/patentes")}`} className="inline-flex items-center gap-2 bg-[#4A7F74] px-5 py-3 text-sm font-medium text-white hover:bg-[#568D81]">{c.primary}<ArrowRight className="h-4 w-4" /></Link>
              <Link href={`${base}/acceso-empresarial`} className="inline-flex items-center border border-[#36515A] px-5 py-3 text-sm text-[#E7DFCE] hover:bg-[#13272D]">{c.secondary}</Link>
            </div>
          </div>

          <div className="relative min-h-[420px] overflow-hidden border border-[#294047] bg-[#13272D] p-8 sm:p-10">
            <div aria-hidden="true" className="absolute -right-24 -top-24 size-80 rounded-full border-[44px] border-[#20393A]" />
            <div aria-hidden="true" className="absolute bottom-0 left-0 h-40 w-40 border-r border-t border-[#4A7F74]/60" />
            <div className="relative flex h-full min-h-[340px] flex-col justify-between">
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[#96B5A6]"><ShieldCheck className="h-4 w-4" />{c.source}</div>
              <div>
                <p className="max-w-md text-3xl font-light leading-tight tracking-[-0.035em]">{locale === "es" ? "Tecnología · empresas · inventores · IPC · actividad" : "Technology · companies · inventors · IPC · activity"}</p>
                <div className="mt-8 grid grid-cols-2 gap-px border border-[#294047] bg-[#294047] text-xs">
                  {["A61", "C25C", "G06", "H01M"].map((code) => <div key={code} className="bg-[#0F2A33] px-5 py-4 font-mono text-[#96B5A6]">IPC {code}</div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PatentPreviewSearch locale={locale} />

      <section className="px-5 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-[1480px]">
          <div className="grid border-y border-[#263D44] md:grid-cols-2 lg:grid-cols-4">
            {c.cards.map(([title, body], index) => {
              const Icon = cardIcons[index]
              return <article key={title} className="border-b border-[#263D44] px-0 py-8 md:px-7 lg:border-b-0 lg:border-l first:lg:border-l-0"><Icon className="h-5 w-5 text-[#96B5A6]" strokeWidth={1.4} /><h2 className="mt-6 text-xl font-normal">{title}</h2><p className="mt-3 text-sm leading-6 text-[#9EAAA8]">{body}</p></article>
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[#263D44] bg-[#091A20] px-5 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto grid max-w-[1480px] gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <h2 className="max-w-2xl text-[clamp(2.6rem,5vw,5rem)] font-light leading-[0.96] tracking-[-0.045em]">{c.methodTitle}</h2>
          <p className="max-w-2xl text-base leading-8 text-[#9EAAA8] lg:justify-self-end">{c.methodBody}</p>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto flex max-w-[1480px] flex-col justify-between gap-8 border-b border-[#263D44] pb-16 lg:flex-row lg:items-end">
          <div><h2 className="max-w-3xl text-4xl font-light tracking-[-0.04em] sm:text-5xl">{c.finalTitle}</h2><p className="mt-5 max-w-2xl text-sm leading-7 text-[#9EAAA8]">{c.finalBody}</p></div>
          <Link href={`${base}/acceso-empresarial`} className="inline-flex shrink-0 items-center gap-2 bg-[#4A7F74] px-5 py-3 text-sm font-medium text-white hover:bg-[#568D81]">{c.secondary}<ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </main>
  )
}
