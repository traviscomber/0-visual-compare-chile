import Image from "next/image"
import Link from "next/link"
import { PublicIntelligenceDemo } from "@/components/public-intelligence-demo"
import { localePath, type PublicLocale } from "@/lib/marketing-locale"

const copy = {
  es: {
    nav: { platform: "PLATAFORMA", brands: "MARCAS", patents: "PATENTES", technologies: "TECNOLOGÍAS", pricing: "PLANES", resources: "RECURSOS", login: "INICIAR SESIÓN", cta: "INICIAR BÚSQUEDA" },
    hero: {
      eyebrow: "INTELIGENCIA DE PROPIEDAD INTELECTUAL Y TECNOLOGÍA",
      title: "Inteligencia para lo que construyes, proteges y sigues.",
      body: "Busca, compara y monitorea marcas, patentes y tecnologías desde una sola plataforma de inteligencia.",
      primary: "INICIAR BÚSQUEDA",
      secondary: "EXPLORAR VIDENTIA",
      imageAlt: "Personas investigando y comparando señales dentro del sistema de inteligencia VIDENTIA",
    },
    questions: {
      eyebrow: "01. TRES PREGUNTAS. UN SISTEMA DE INTELIGENCIA.",
      title: "¿Qué necesitas entender?",
      items: [
        { type: "brand" as const, label: "MARCAS", question: "¿Puedo usar y proteger esta marca?", body: "Busca nombres, logos, clases y antecedentes oficiales antes de registrar; después, mantén vigilancia sobre nuevos conflictos y cambios relevantes.", cta: "REVISAR UNA MARCA" },
        { type: "patent" as const, label: "PATENTES", question: "¿Esta invención ya existe?", body: "Explora antecedentes técnicos, solicitantes, inventores, IPC, prioridades y estado observado antes de invertir más en una dirección.", cta: "REVISAR UNA INVENCIÓN" },
        { type: "technology" as const, label: "TECNOLOGÍAS", question: "¿Hacia dónde se mueve esta tecnología?", body: "Sigue investigación, patentes, empresas y señales públicas para detectar movimiento antes de que sea evidente.", cta: "SEGUIR UNA TECNOLOGÍA" },
      ],
    },
    brand: {
      eyebrow: "02. BRAND INTELLIGENCE",
      title: "Protege tu marca antes y después del registro.",
      before: "ANTES DEL REGISTRO",
      after: "DESPUÉS DEL REGISTRO",
      beforeBody: "VIDENTIA organiza nombres similares, señales fonéticas y visuales, clases Niza/Viena, titulares, estado y evidencia oficial para que sepas qué merece revisión.",
      afterBody: "Convierte una investigación útil en vigilancia recurrente: nuevas solicitudes similares, cambios de estado, propiedad y señales que requieren atención.",
      beforeItems: ["nombre o logo", "goods / services", "Niza y Viena", "evidencia priorizada"],
      afterItems: ["variantes y clases", "competidores", "frecuencia", "reporte recurrente"],
      primary: "REVISAR UNA MARCA",
      watch: "VIGILAR ESTA MARCA",
    },
    patent: {
      eyebrow: "03. PATENT INTELLIGENCE",
      title: "Conoce lo que ya existe antes de invertir en lo que viene.",
      body: "Describe una invención o busca por tecnología, solicitante o IPC. VIDENTIA recupera antecedentes observados y destaca cuáles merecen una revisión más cercana.",
      inputLabel: "EJEMPLO DE BÚSQUEDA",
      input: "Sistema de nanoburbujas de bajo consumo para oxigenar estanques de acuicultura.",
      result: "ANTECEDENTES POTENCIALES",
      note: "VIDENTIA no declara PATENTABLE / NO PATENTABLE. Separa fuente, análisis y conclusión legal.",
      modes: ["PRIOR ART", "PATENTABILITY · REVIEW", "FREEDOM TO OPERATE · REVIEW", "COMPETITOR WATCH"],
      cta: "EXPLORAR PATENTES",
    },
    technology: {
      eyebrow: "04. TECHNOLOGY INTELLIGENCE",
      title: "Ve hacia dónde se mueve tu industria antes de que la señal sea obvia.",
      body: "VIDENTIA cruza investigación, patentes y actores para sintetizar movimiento. Las noticias sirven como contexto; no convierten ruido en conclusión.",
      example: "NANOBURBUJAS · ACUICULTURA",
      changed: "QUÉ CAMBIÓ",
      matters: "POR QUÉ IMPORTA",
      moving: "QUIÉN SE MUEVE",
      next: "QUÉ VIGILAR DESPUÉS",
      cta: "SEGUIR UNA TECNOLOGÍA",
    },
    engine: {
      eyebrow: "05. UN SOLO MOTOR DE INTELIGENCIA",
      title: "Busca una vez—or sigue vigilando.",
      steps: [
        ["01", "SEARCH", "¿Qué existe?"],
        ["02", "COMPARE", "¿Qué tan relacionado está?"],
        ["03", "EVALUATE", "¿Por qué importa?"],
        ["04", "WATCH", "¿Qué cambió?"],
        ["05", "REPORT", "¿Qué requiere atención?"],
      ],
    },
    reporting: {
      eyebrow: "06. INTELIGENCIA, NO RUIDO",
      title: "Cada reporte responde las mismas preguntas.",
      body: "La estructura se mantiene entre marcas, patentes y tecnologías para que un equipo pueda leer señales distintas con el mismo criterio.",
      rows: ["QUÉ CAMBIÓ", "QUÉ IMPORTA", "EVIDENCIA", "REVISIÓN RECOMENDADA", "VIGILAR DESPUÉS"],
    },
    progression: {
      eyebrow: "07. DE UNA BÚSQUEDA A INTELIGENCIA CONTINUA",
      title: "Un resultado útil no debería terminar en una pestaña cerrada.",
      steps: ["ONE-TIME CHECK", "CREATE A WATCH", "INTELLIGENCE SUBSCRIPTION", "TEAM WORKSPACE"],
      prompt: "¿Quieres que VIDENTIA siga vigilando esto por ti?",
    },
    audiences: {
      eyebrow: "08. PARA EQUIPOS QUE NECESITAN SABER ANTES",
      items: [
        ["ESTUDIOS JURÍDICOS", "Investigación más rápida y reportes trazables."],
        ["LEGAL IN-HOUSE", "Portfolio, lanzamientos, vigilancia y colaboración."],
        ["I+D", "Prior art, actividad competitiva y vigilancia tecnológica."],
        ["INNOVACIÓN / BRANDING", "Filtra nombres y direcciones débiles antes de invertir."],
        ["ESTRATEGIA CORPORATIVA", "Sigue tecnologías, competidores y señales emergentes."],
      ],
    },
    commercial: {
      eyebrow: "09. UNA ENTRADA PARA CADA NIVEL DE USO",
      tiers: [
        ["ONE-TIME CHECK", "Para investigación ocasional y una pregunta concreta."],
        ["VIDENTIA PRO", "Para profesionales y equipos pequeños que investigan y vigilan de forma recurrente."],
        ["VIDENTIA ENTERPRISE", "Para organizaciones que necesitan workspace, portfolio, equipos, integraciones y reporting avanzado."],
      ],
    },
    final: { eyebrow: "10. ¿QUÉ NECESITAS ENTENDER AHORA?", title: "Brands. Patents. Technologies.", body: "Una sola infraestructura de evidencia, inteligencia, vigilancia y trabajo.", brand: "REVISAR UNA MARCA", patent: "REVISAR UNA INVENCIÓN", technology: "SEGUIR UNA TECNOLOGÍA" },
    footer: { statement: "Intelligence for intellectual property and technology.", disclaimer: "VIDENTIA apoya investigación, inteligencia y revisión de evidencia. No reemplaza fuentes oficiales ni asesoría jurídica profesional." },
  },
  en: {
    nav: { platform: "PLATFORM", brands: "BRANDS", patents: "PATENTS", technologies: "TECHNOLOGIES", pricing: "PRICING", resources: "RESOURCES", login: "LOG IN", cta: "START A SEARCH" },
    hero: {
      eyebrow: "INTELLECTUAL PROPERTY & TECHNOLOGY INTELLIGENCE",
      title: "Intelligence for what you build, protect and follow.",
      body: "Search, compare and continuously monitor brands, patents and technologies from one intelligence platform.",
      primary: "START A SEARCH",
      secondary: "EXPLORE VIDENTIA",
      imageAlt: "People researching and comparing signals inside the VIDENTIA intelligence system",
    },
    questions: {
      eyebrow: "01. THREE QUESTIONS. ONE INTELLIGENCE SYSTEM.",
      title: "What do you need to understand?",
      items: [
        { type: "brand" as const, label: "BRANDS", question: "Can I use and protect this brand?", body: "Search names, logos, classes and official records before filing; then monitor new conflicts and relevant changes.", cta: "CHECK A BRAND" },
        { type: "patent" as const, label: "PATENTS", question: "Does this invention already exist?", body: "Explore technical prior art, applicants, inventors, IPC, priorities and observed status before investing further.", cta: "CHECK AN INVENTION" },
        { type: "technology" as const, label: "TECHNOLOGIES", question: "Where is this technology moving?", body: "Track research, patents, companies and public signals to detect movement before it becomes obvious.", cta: "TRACK A TECHNOLOGY" },
      ],
    },
    brand: {
      eyebrow: "02. BRAND INTELLIGENCE",
      title: "Protect your brand before and after registration.",
      before: "BEFORE REGISTRATION",
      after: "AFTER REGISTRATION",
      beforeBody: "VIDENTIA organizes similar names, phonetic and visual signals, Nice/Vienna classes, owners, status and official evidence so you know what deserves review.",
      afterBody: "Turn a useful investigation into recurring monitoring: new similar applications, status changes, ownership changes and signals that require attention.",
      beforeItems: ["name or logo", "goods / services", "Nice and Vienna", "prioritized evidence"],
      afterItems: ["variants and classes", "competitors", "frequency", "recurring report"],
      primary: "CHECK A BRAND",
      watch: "MONITOR THIS BRAND",
    },
    patent: {
      eyebrow: "03. PATENT INTELLIGENCE",
      title: "Know what already exists before you invest in what comes next.",
      body: "Describe an invention or search by technology, applicant or IPC. VIDENTIA retrieves observed prior art and highlights what deserves closer review.",
      inputLabel: "SEARCH EXAMPLE",
      input: "Low-energy nanobubble system for oxygenating aquaculture tanks.",
      result: "POTENTIAL PRIOR ART",
      note: "VIDENTIA does not output PATENTABLE / NOT PATENTABLE. Source, analysis and legal conclusion remain separate.",
      modes: ["PRIOR ART", "PATENTABILITY · REVIEW", "FREEDOM TO OPERATE · REVIEW", "COMPETITOR WATCH"],
      cta: "EXPLORE PATENTS",
    },
    technology: {
      eyebrow: "04. TECHNOLOGY INTELLIGENCE",
      title: "See where your industry is moving before the signal becomes obvious.",
      body: "VIDENTIA combines research, patents and actors to synthesize movement. News is context; it does not turn noise into a conclusion.",
      example: "NANOBUBBLES · AQUACULTURE",
      changed: "WHAT CHANGED",
      matters: "WHY IT MATTERS",
      moving: "WHO IS MOVING",
      next: "WHAT TO WATCH NEXT",
      cta: "TRACK A TECHNOLOGY",
    },
    engine: {
      eyebrow: "05. ONE INTELLIGENCE ENGINE",
      title: "Search once—or keep watching.",
      steps: [
        ["01", "SEARCH", "What exists?"],
        ["02", "COMPARE", "How related is it?"],
        ["03", "EVALUATE", "Why does it matter?"],
        ["04", "WATCH", "What changed?"],
        ["05", "REPORT", "What requires attention?"],
      ],
    },
    reporting: {
      eyebrow: "06. INTELLIGENCE, NOT NOISE",
      title: "Every report answers the same questions.",
      body: "The structure remains consistent across brands, patents and technologies so a team can read different signals with the same decision framework.",
      rows: ["WHAT CHANGED", "WHAT MATTERS", "EVIDENCE", "RECOMMENDED REVIEW", "WATCH NEXT"],
    },
    progression: {
      eyebrow: "07. FROM ONE SEARCH TO CONTINUOUS INTELLIGENCE",
      title: "A useful result should not end with a closed tab.",
      steps: ["ONE-TIME CHECK", "CREATE A WATCH", "INTELLIGENCE SUBSCRIPTION", "TEAM WORKSPACE"],
      prompt: "Would you like VIDENTIA to keep watching this for you?",
    },
    audiences: {
      eyebrow: "08. BUILT FOR TEAMS THAT NEED TO KNOW EARLY",
      items: [
        ["LAW FIRMS", "Faster research and traceable client reports."],
        ["IN-HOUSE LEGAL", "Portfolio, launches, monitoring and collaboration."],
        ["R&D TEAMS", "Prior art, competitor activity and technology watch."],
        ["INNOVATION / BRANDING", "Filter weak names and directions before investing."],
        ["CORPORATE STRATEGY", "Follow technologies, competitors and emerging signals."],
      ],
    },
    commercial: {
      eyebrow: "09. AN ENTRY POINT FOR EACH LEVEL OF USE",
      tiers: [
        ["ONE-TIME CHECK", "For occasional research and one concrete question."],
        ["VIDENTIA PRO", "For professionals and small teams researching and monitoring repeatedly."],
        ["VIDENTIA ENTERPRISE", "For organizations needing workspace, portfolio, teams, integrations and advanced reporting."],
      ],
    },
    final: { eyebrow: "10. WHAT DO YOU NEED TO UNDERSTAND NEXT?", title: "Brands. Patents. Technologies.", body: "One infrastructure for evidence, intelligence, monitoring and work.", brand: "CHECK A BRAND", patent: "CHECK AN INVENTION", technology: "TRACK A TECHNOLOGY" },
    footer: { statement: "Intelligence for intellectual property and technology.", disclaimer: "VIDENTIA supports research, intelligence and evidence review. It does not replace official sources or professional legal advice." },
  },
} as const

type VerticalType = "brand" | "patent" | "technology"

function VerticalSymbol({ type, compact = false }: { type: VerticalType; compact?: boolean }) {
  const size = compact ? "h-20 w-28" : "h-32 w-44"
  if (type === "brand") return (
    <div className={`relative ${size}`} aria-hidden="true">
      <span className="absolute left-0 top-4 h-16 w-20 bg-[#20393A] sm:h-20 sm:w-24" />
      <span className="absolute left-7 top-2 h-16 w-16 bg-[#4A7F74] sm:left-10 sm:h-20 sm:w-20" />
      <span className="absolute left-12 top-2 h-16 w-16 rounded-full border-[12px] border-[#96B5A6] sm:left-16 sm:h-20 sm:w-20 sm:border-[14px]" />
    </div>
  )
  if (type === "patent") return (
    <div className={`relative ${size}`} aria-hidden="true">
      <span className="absolute left-0 top-2 h-24 w-36 border-[14px] border-[#20393A]" />
      <span className="absolute left-7 top-8 h-20 w-28 border-[12px] border-[#4A7F74]" />
      <span className="absolute left-[72px] top-[52px] h-12 w-12 bg-[#96B5A6]" />
    </div>
  )
  return (
    <div className={`relative ${size}`} aria-hidden="true">
      <span className="absolute left-0 top-4 h-3 w-3 rounded-full bg-[#456E8E]" />
      <span className="absolute left-0 top-14 h-3 w-3 rounded-full bg-[#4A7F74]" />
      <span className="absolute left-0 top-24 h-3 w-3 rounded-full bg-[#96B5A6]" />
      <span className="absolute left-5 top-[22px] h-px w-24 rotate-[20deg] bg-[#456E8E]" />
      <span className="absolute left-5 top-[62px] h-px w-24 bg-[#4A7F74]" />
      <span className="absolute left-5 top-[102px] h-px w-24 -rotate-[20deg] bg-[#96B5A6]" />
      <span className="absolute right-0 top-[39px] h-16 w-16 rounded-full border-[13px] border-[#96B5A6]" />
    </div>
  )
}

function hrefFor(locale: PublicLocale, type: VerticalType) {
  if (type === "brand") return localePath(locale, "/demo")
  if (type === "patent") return locale === "es" ? "/es/patentes" : "/en/patents"
  return locale === "es" ? "/es/tecnologias" : "/en/technologies"
}

export function LocalizedLandingPage({ locale }: { locale: PublicLocale }) {
  const c = copy[locale]
  const otherLocale = locale === "es" ? "en" : "es"
  const home = localePath(locale, "/")
  const patents = hrefFor(locale, "patent")
  const technologies = hrefFor(locale, "technology")

  return (
    <main className="min-h-screen bg-[#0F2A33] font-sans text-white">
      <nav className="sticky top-0 z-50 border-b border-[#20363E] bg-[#091A20]/95">
        <div className="mx-auto flex h-20 max-w-[1480px] items-center justify-between gap-5 px-5 lg:px-10">
          <Link href={home} className="shrink-0" aria-label="VIDENTIA">
            <span className="block text-[15px] font-normal tracking-[0.22em] text-[#E7DFCE]">ViDENTiA</span>
            <span className="mt-1 block text-[7px] uppercase tracking-[0.16em] text-[#7F918F]">IP & TECHNOLOGY INTELLIGENCE</span>
          </Link>
          <div className="hidden items-center gap-5 text-[10px] font-medium tracking-[0.08em] text-[#BDBEBD] xl:flex">
            <Link href="#platform" className="hover:text-white">{c.nav.platform}</Link>
            <Link href="#brands" className="hover:text-white">{c.nav.brands}</Link>
            <Link href={patents} className="hover:text-white">{c.nav.patents}</Link>
            <Link href={technologies} className="hover:text-white">{c.nav.technologies}</Link>
            <Link href="#pricing" className="hover:text-white">{c.nav.pricing}</Link>
            <Link href={localePath(locale, "/docs")} className="hover:text-white">{c.nav.resources}</Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href={localePath(otherLocale, "/")} className="hidden px-2 py-2 text-[10px] font-medium text-[#96B5A6] sm:inline">{otherLocale.toUpperCase()}</Link>
            <Link href={localePath(locale, "/auth/login")} className="hidden bg-[#172F34] px-3 py-2.5 text-[10px] font-medium text-white md:inline">{c.nav.login}</Link>
            <Link href={localePath(locale, "/demo")} className="bg-[#4A7F74] px-3 py-2.5 text-[10px] font-medium text-white sm:px-4">{c.nav.cta}</Link>
          </div>
        </div>
      </nav>

      <section id="platform" className="border-b border-[#20363E] px-5 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-[1480px] gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#96B5A6]">{c.hero.eyebrow}</p>
            <h1 className="mt-6 text-[clamp(3.7rem,7.1vw,7.7rem)] font-light leading-[0.9] tracking-[-0.06em] text-[#E7DFCE]">{c.hero.title}</h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-[#BDBEBD] sm:text-lg">{c.hero.body}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={localePath(locale, "/demo")} className="bg-[#4A7F74] px-5 py-3.5 text-xs font-medium tracking-[0.06em] text-white">{c.hero.primary}</Link>
              <Link href="#questions" className="bg-[#20393A] px-5 py-3.5 text-xs font-medium tracking-[0.06em] text-[#E7DFCE]">{c.hero.secondary}</Link>
            </div>
          </div>

          <div className="relative min-h-[520px] overflow-hidden bg-[#091A20] sm:min-h-[620px]">
            <div className="absolute left-0 top-0 h-full w-[27%] bg-[#13272D]" aria-hidden="true" />
            <div className="absolute bottom-0 right-0 h-[27%] w-[42%] bg-[#20393A]" aria-hidden="true" />
            <div className="absolute left-[10%] top-[9%] h-[68%] w-[77%] overflow-hidden">
              <Image src="/images/videntia-hero-comparison-hd.webp" alt={c.hero.imageAlt} fill priority sizes="(max-width: 1024px) 100vw, 56vw" className="object-cover object-center opacity-90" />
            </div>
            <div className="absolute bottom-[7%] left-[7%] bg-[#091A20] p-5 sm:p-7">
              <div className="grid grid-cols-3 gap-5 sm:gap-8">
                <VerticalSymbol type="brand" compact />
                <VerticalSymbol type="patent" compact />
                <VerticalSymbol type="technology" compact />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="questions" className="px-5 py-24 lg:px-10 lg:py-36">
        <div className="mx-auto max-w-[1480px]">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">{c.questions.eyebrow}</p>
          <h2 className="mt-5 max-w-4xl text-[clamp(3rem,6vw,6.3rem)] font-light leading-[0.94] tracking-[-0.055em] text-[#E7DFCE]">{c.questions.title}</h2>
          <div className="mt-16 border-y border-[#294047]">
            {c.questions.items.map((item, index) => (
              <article key={item.type} className="grid gap-8 border-b border-[#294047] py-10 last:border-b-0 lg:grid-cols-[180px_minmax(0,1fr)_minmax(280px,0.62fr)_auto] lg:items-center lg:gap-10">
                <div><VerticalSymbol type={item.type} compact /></div>
                <div>
                  <p className="text-[10px] font-medium tracking-[0.16em] text-[#96B5A6]">0{index + 1} / {item.label}</p>
                  <h3 className="mt-3 text-3xl font-light tracking-[-0.035em] text-[#E7DFCE] sm:text-4xl">{item.question}</h3>
                </div>
                <p className="text-sm leading-7 text-[#BDBEBD]">{item.body}</p>
                <Link href={hrefFor(locale, item.type)} className="w-fit bg-[#172F34] px-4 py-3 text-[10px] font-medium tracking-[0.08em] text-white">{item.cta} →</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="brands" className="border-y border-[#294047] bg-[#091A20] px-5 py-24 lg:px-10 lg:py-36">
        <div className="mx-auto max-w-[1480px]">
          <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">{c.brand.eyebrow}</p>
              <h2 className="mt-5 text-[clamp(3rem,5.4vw,5.7rem)] font-light leading-[0.95] tracking-[-0.055em] text-[#E7DFCE]">{c.brand.title}</h2>
              <div className="mt-10"><VerticalSymbol type="brand" /></div>
            </div>
            <div className="border-y border-[#294047]">
              <div className="grid gap-8 border-b border-[#294047] py-10 md:grid-cols-[190px_1fr]">
                <p className="text-[10px] font-medium tracking-[0.16em] text-[#96B5A6]">{c.brand.before}</p>
                <div><p className="max-w-2xl text-base leading-8 text-white">{c.brand.beforeBody}</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{c.brand.beforeItems.map((item) => <span key={item} className="border-l-2 border-[#4A7F74] pl-4 text-sm text-[#BDBEBD]">{item}</span>)}</div><Link href={localePath(locale, "/demo")} className="mt-8 inline-block bg-[#4A7F74] px-5 py-3 text-xs font-medium text-white">{c.brand.primary}</Link></div>
              </div>
              <div className="grid gap-8 py-10 md:grid-cols-[190px_1fr]">
                <p className="text-[10px] font-medium tracking-[0.16em] text-[#96B5A6]">{c.brand.after}</p>
                <div><p className="max-w-2xl text-base leading-8 text-white">{c.brand.afterBody}</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{c.brand.afterItems.map((item) => <span key={item} className="border-l-2 border-[#456E8E] pl-4 text-sm text-[#BDBEBD]">{item}</span>)}</div><Link href={localePath(locale, "/auth/login?redirectTo=/monitorear")} className="mt-8 inline-block bg-[#20393A] px-5 py-3 text-xs font-medium text-white">{c.brand.watch}</Link></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-24 lg:px-10 lg:py-36">
        <div className="mx-auto grid max-w-[1480px] gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">{c.patent.eyebrow}</p>
            <h2 className="mt-5 text-[clamp(3rem,5.2vw,5.5rem)] font-light leading-[0.95] tracking-[-0.055em] text-[#E7DFCE]">{c.patent.title}</h2>
            <p className="mt-7 max-w-2xl text-base leading-8 text-[#BDBEBD]">{c.patent.body}</p>
            <p className="mt-7 max-w-2xl border-l-2 border-[#456E8E] pl-4 text-xs leading-6 text-[#9EAAA8]">{c.patent.note}</p>
            <Link href={patents} className="mt-8 inline-block bg-[#4A7F74] px-5 py-3 text-xs font-medium text-white">{c.patent.cta}</Link>
          </div>
          <div className="bg-[#091A20] p-6 sm:p-9">
            <VerticalSymbol type="patent" />
            <p className="mt-8 text-[10px] font-medium tracking-[0.16em] text-[#96B5A6]">{c.patent.inputLabel}</p>
            <p className="mt-3 border-y border-[#294047] py-5 text-lg font-light leading-8 text-[#E7DFCE]">“{c.patent.input}”</p>
            <p className="mt-7 text-[10px] font-medium tracking-[0.16em] text-[#96B5A6]">{c.patent.result}</p>
            <div className="mt-4 divide-y divide-[#20363E] border-y border-[#20363E]">{c.patent.modes.map((mode, index) => <div key={mode} className="flex items-center gap-4 py-4"><span className="text-[10px] text-[#456E8E]">0{index + 1}</span><span className="text-xs font-medium tracking-[0.08em] text-white">{mode}</span></div>)}</div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#294047] bg-[#091A20] px-5 py-24 lg:px-10 lg:py-36">
        <div className="mx-auto grid max-w-[1480px] gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <VerticalSymbol type="technology" />
            <p className="mt-8 text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">{c.technology.eyebrow}</p>
            <h2 className="mt-5 text-[clamp(3rem,5.2vw,5.5rem)] font-light leading-[0.95] tracking-[-0.055em] text-[#E7DFCE]">{c.technology.title}</h2>
            <p className="mt-7 max-w-2xl text-base leading-8 text-[#BDBEBD]">{c.technology.body}</p>
            <Link href={technologies} className="mt-8 inline-block bg-[#4A7F74] px-5 py-3 text-xs font-medium text-white">{c.technology.cta}</Link>
          </div>
          <div className="border-y border-[#294047]">
            <div className="py-7"><p className="text-xs font-medium tracking-[0.12em] text-[#96B5A6]">{c.technology.example}</p></div>
            {[c.technology.changed, c.technology.matters, c.technology.moving, c.technology.next].map((item, index) => <div key={item} className="grid grid-cols-[52px_1fr] items-center border-t border-[#294047] py-5"><span className="text-[10px] text-[#456E8E]">0{index + 1}</span><span className="text-sm font-medium tracking-[0.08em] text-[#E7DFCE]">{item}</span></div>)}
          </div>
        </div>
      </section>

      <section className="px-5 py-24 lg:px-10 lg:py-36">
        <div className="mx-auto max-w-[1480px]">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">{c.engine.eyebrow}</p>
          <h2 className="mt-5 max-w-4xl text-[clamp(3rem,6vw,6rem)] font-light leading-[0.94] tracking-[-0.055em] text-[#E7DFCE]">{c.engine.title}</h2>
          <div className="mt-14 grid border-y border-[#294047] md:grid-cols-5">
            {c.engine.steps.map(([number, title, body], index) => (
              <div key={number} className="border-b border-[#294047] py-7 md:border-b-0 md:border-r md:px-5 md:last:border-r-0">
                <div className="relative h-14 w-14" aria-hidden="true"><span className={`absolute inset-0 ${index === 0 ? "rounded-full border-[10px] border-[#4A7F74]" : index === 1 ? "bg-[#20393A]" : index === 2 ? "rotate-45 border-[10px] border-[#456E8E]" : index === 3 ? "rounded-full bg-[#96B5A6]" : "border-[10px] border-[#4A7F74]"}`} /></div>
                <p className="mt-7 text-[10px] text-[#456E8E]">{number}</p><h3 className="mt-2 text-sm font-medium tracking-[0.08em] text-white">{title}</h3><p className="mt-3 text-xs leading-6 text-[#9EAAA8]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicIntelligenceDemo locale={locale} />

      <section className="px-5 py-24 lg:px-10 lg:py-36">
        <div className="mx-auto grid max-w-[1480px] gap-12 lg:grid-cols-[0.72fr_1.28fr]">
          <div><p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">{c.reporting.eyebrow}</p><h2 className="mt-5 text-[clamp(3rem,5.2vw,5.4rem)] font-light leading-[0.95] tracking-[-0.055em] text-[#E7DFCE]">{c.reporting.title}</h2><p className="mt-7 max-w-xl text-sm leading-7 text-[#BDBEBD]">{c.reporting.body}</p></div>
          <div className="bg-[#091A20] p-7 sm:p-10"><div className="flex items-center justify-between border-b border-[#294047] pb-5"><span className="text-xs font-medium tracking-[0.12em] text-[#E7DFCE]">VIDENTIA / INTELLIGENCE REPORT</span><span className="h-4 w-4 rounded-full bg-[#4A7F74]" /></div><div className="mt-5 divide-y divide-[#294047]">{c.reporting.rows.map((row, index) => <div key={row} className="grid grid-cols-[44px_1fr] py-5"><span className="text-[10px] text-[#456E8E]">0{index + 1}</span><span className="text-sm font-medium tracking-[0.08em] text-white">{row}</span></div>)}</div></div>
        </div>
      </section>

      <section className="border-y border-[#294047] bg-[#091A20] px-5 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-[1480px]"><p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">{c.progression.eyebrow}</p><h2 className="mt-5 max-w-4xl text-[clamp(3rem,5.5vw,5.7rem)] font-light leading-[0.95] tracking-[-0.055em] text-[#E7DFCE]">{c.progression.title}</h2><div className="mt-14 grid md:grid-cols-4">{c.progression.steps.map((step, index) => <div key={step} className="relative border-t border-[#294047] py-7 md:border-r md:px-6 md:last:border-r-0"><span className="text-[10px] text-[#456E8E]">0{index + 1}</span><p className="mt-4 text-sm font-medium tracking-[0.08em] text-white">{step}</p>{index < c.progression.steps.length - 1 ? <span className="absolute -right-2 top-[23px] hidden bg-[#091A20] px-1 text-[#96B5A6] md:block">→</span> : null}</div>)}</div><p className="mt-12 max-w-3xl text-2xl font-light leading-9 text-[#E7DFCE]">{c.progression.prompt}</p></div>
      </section>

      <section className="px-5 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-[1480px]"><p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">{c.audiences.eyebrow}</p><div className="mt-12 border-y border-[#294047]">{c.audiences.items.map(([title, body], index) => <div key={title} className="grid gap-4 border-b border-[#294047] py-7 last:border-b-0 md:grid-cols-[70px_280px_1fr]"><span className="text-[10px] text-[#456E8E]">0{index + 1}</span><h3 className="text-sm font-medium tracking-[0.08em] text-[#E7DFCE]">{title}</h3><p className="text-sm leading-7 text-[#BDBEBD]">{body}</p></div>)}</div></div>
      </section>

      <section id="pricing" className="border-y border-[#294047] bg-[#091A20] px-5 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-[1480px]"><p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">{c.commercial.eyebrow}</p><div className="mt-12 grid border-y border-[#294047] lg:grid-cols-3">{c.commercial.tiers.map(([title, body], index) => <div key={title} className="border-b border-[#294047] py-9 lg:border-b-0 lg:border-r lg:px-8 lg:last:border-r-0"><span className="text-[10px] text-[#456E8E]">0{index + 1}</span><h3 className="mt-4 text-2xl font-light text-[#E7DFCE]">{title}</h3><p className="mt-4 text-sm leading-7 text-[#BDBEBD]">{body}</p></div>)}</div></div>
      </section>

      <section className="px-5 py-28 lg:px-10 lg:py-40">
        <div className="mx-auto max-w-[1480px]"><p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">{c.final.eyebrow}</p><h2 className="mt-5 max-w-5xl text-[clamp(4rem,8vw,8.5rem)] font-light leading-[0.88] tracking-[-0.065em] text-[#E7DFCE]">{c.final.title}</h2><p className="mt-8 max-w-2xl text-base leading-8 text-[#BDBEBD]">{c.final.body}</p><div className="mt-12 flex flex-wrap gap-3"><Link href={hrefFor(locale, "brand")} className="bg-[#4A7F74] px-5 py-3.5 text-xs font-medium text-white">{c.final.brand}</Link><Link href={hrefFor(locale, "patent")} className="bg-[#20393A] px-5 py-3.5 text-xs font-medium text-white">{c.final.patent}</Link><Link href={hrefFor(locale, "technology")} className="bg-[#456E8E] px-5 py-3.5 text-xs font-medium text-white">{c.final.technology}</Link></div></div>
      </section>

      <footer className="border-t border-[#294047] bg-[#091A20] px-5 py-10 lg:px-10"><div className="mx-auto flex max-w-[1480px] flex-col justify-between gap-7 md:flex-row md:items-end"><div><span className="text-sm tracking-[0.22em] text-[#E7DFCE]">ViDENTiA</span><p className="mt-3 text-sm text-[#96B5A6]">{c.footer.statement}</p></div><p className="max-w-2xl text-xs leading-6 text-[#7F918F]">{c.footer.disclaimer}</p></div></footer>
    </main>
  )
}
