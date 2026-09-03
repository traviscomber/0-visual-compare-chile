import Link from "next/link"
import { UmbrellaDemo } from "@/components/umbrella-demo"
import type { PublicLocale } from "@/lib/marketing-locale"

const content = {
  en: {
    start: "01. START HERE",
    startTitle: "Choose the question you need to answer.",
    startBody: "VIDENTIA routes each investigation by evidence type. Start with the question, then move into the right search, analysis and monitoring workflow.",
    verticals: [
      { index: "01", label: "TRADEMARKS", question: "Can I use and protect this brand?", body: "Search names, logos and official records before filing, then monitor relevant conflicts and changes.", cta: "CHECK A TRADEMARK", href: "/trademarks" },
      { index: "02", label: "PATENTS", question: "Does this invention already exist?", body: "Search prior art, review technical relationships and monitor applicants, inventors or technologies.", cta: "CHECK AN INVENTION", href: "/patents" },
      { index: "03", label: "TECHNOLOGIES", question: "Where is this technology moving?", body: "Track research, patent activity, companies and public signals to identify meaningful movement early.", cta: "TRACK A TECHNOLOGY", href: "/technologies" },
    ],
    engineEyebrow: "02. ONE INTELLIGENCE ENGINE",
    engineTitle: "Search once—or keep watching.",
    engineBody: "The same evidence logic moves from discovery to comparison, evaluation, monitoring and reporting—without turning observed records into automatic conclusions.",
    engine: [
      ["01", "SEARCH", "What exists?", "OBSERVED EVIDENCE"],
      ["02", "COMPARE", "How related is it?", "RELATIONSHIPS"],
      ["03", "EVALUATE", "Why does it matter?", "RELEVANCE"],
      ["04", "WATCH", "What changed?", "CHANGE SIGNALS"],
      ["05", "REPORT", "What requires attention?", "DECISION RECORD"],
    ],
    engineFootA: "ONE QUERY · SHARED EVIDENCE MODEL",
    engineFootB: "SEARCH → CONTINUOUS INTELLIGENCE",
    logicEyebrow: "03. SEE THE LOGIC",
    logicTitle: "Different questions. The same intelligence logic.",
    logicBody: "Switch verticals to see the evidence dimensions VIDENTIA organizes before you enter the corresponding product workflow.",
    watchEyebrow: "04. CONTINUOUS INTELLIGENCE",
    watchTitle: "One search can become a watch.",
    watchBody: "Run a single investigation or ask VIDENTIA to repeat the research and surface meaningful changes for review.",
    watchAccent: "From a point-in-time answer to an evidence trail that keeps moving.",
    watchLabel: "ILLUSTRATIVE WORKFLOW",
    watchCycle: "WATCH CYCLE",
    watchStages: [
      ["01", "ONE-TIME SEARCH", "Establish a documented evidence baseline.", "BASELINE"],
      ["02", "CREATE A WATCH", "Define what should be checked again.", "REPEAT"],
      ["03", "AUTOMATIC RESEARCH", "Repeat the same evidence workflow over time.", "REPEAT"],
      ["04", "PERIODIC REPORTS", "Surface meaningful changes for review.", "REPEAT"],
      ["05", "TEAM WORKSPACE", "Keep findings, context and decisions together.", "CONTEXT"],
    ],
    final: "What do you need to understand next?",
  },
  es: {
    start: "01. EMPIEZA AQUÍ",
    startTitle: "Elige la pregunta que necesitas responder.",
    startBody: "VIDENTIA dirige cada investigación según el tipo de evidencia. Empieza por la pregunta y entra al flujo correcto de búsqueda, análisis y monitoreo.",
    verticals: [
      { index: "01", label: "MARCAS", question: "¿Puedo usar y proteger esta marca?", body: "Busca nombres, logos y antecedentes oficiales antes de presentar, y luego monitorea conflictos y cambios relevantes.", cta: "REVISAR UNA MARCA", href: "/es/marcas" },
      { index: "02", label: "PATENTES", question: "¿Esta invención ya existe?", body: "Busca estado del arte, revisa relaciones técnicas y monitorea solicitantes, inventores o tecnologías.", cta: "REVISAR UNA INVENCIÓN", href: "/es/patentes" },
      { index: "03", label: "TECNOLOGÍAS", question: "¿Hacia dónde se mueve esta tecnología?", body: "Sigue investigación, actividad de patentes, empresas y señales públicas para detectar movimiento significativo temprano.", cta: "SEGUIR UNA TECNOLOGÍA", href: "/es/tecnologias" },
    ],
    engineEyebrow: "02. UN SOLO MOTOR DE INTELIGENCIA",
    engineTitle: "Busca una vez—o sigue vigilando.",
    engineBody: "La misma lógica de evidencia pasa de descubrir a comparar, evaluar, monitorear y reportar—sin convertir registros observados en conclusiones automáticas.",
    engine: [
      ["01", "BUSCAR", "¿Qué existe?", "EVIDENCIA OBSERVADA"],
      ["02", "COMPARAR", "¿Qué tan relacionado está?", "RELACIONES"],
      ["03", "EVALUAR", "¿Por qué importa?", "RELEVANCIA"],
      ["04", "VIGILAR", "¿Qué cambió?", "SEÑALES DE CAMBIO"],
      ["05", "REPORTAR", "¿Qué requiere atención?", "REGISTRO DE DECISIÓN"],
    ],
    engineFootA: "UNA CONSULTA · MODELO DE EVIDENCIA COMPARTIDO",
    engineFootB: "BÚSQUEDA → INTELIGENCIA CONTINUA",
    logicEyebrow: "03. VE LA LÓGICA",
    logicTitle: "Preguntas distintas. La misma lógica de inteligencia.",
    logicBody: "Cambia de vertical para ver las dimensiones de evidencia que VIDENTIA organiza antes de entrar al flujo correspondiente.",
    watchEyebrow: "04. INTELIGENCIA CONTINUA",
    watchTitle: "Una búsqueda puede convertirse en vigilancia.",
    watchBody: "Haz una investigación puntual o pide a VIDENTIA repetirla y mostrar cambios significativos para revisión.",
    watchAccent: "De una respuesta puntual a una trazabilidad de evidencia que sigue avanzando.",
    watchLabel: "FLUJO ILUSTRATIVO",
    watchCycle: "CICLO DE VIGILANCIA",
    watchStages: [
      ["01", "BÚSQUEDA PUNTUAL", "Establece una línea base documentada de evidencia.", "BASE"],
      ["02", "CREAR VIGILANCIA", "Define qué debe volver a revisarse.", "REPETIR"],
      ["03", "INVESTIGACIÓN AUTOMÁTICA", "Repite el mismo flujo de evidencia en el tiempo.", "REPETIR"],
      ["04", "REPORTES PERIÓDICOS", "Muestra cambios significativos para revisión.", "REPETIR"],
      ["05", "ESPACIO DE EQUIPO", "Mantén hallazgos, contexto y decisiones juntos.", "CONTEXTO"],
    ],
    final: "¿Qué necesitas entender ahora?",
  },
} as const

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071119]"

function IntelligenceEngineRail({ locale }: { locale: PublicLocale }) {
  const t = content[locale]
  return (
    <div className="relative mt-12 border-y border-[#294047]">
      <div className="pointer-events-none absolute bottom-0 left-[27px] top-0 w-px bg-[#36515A] lg:bottom-auto lg:left-[10%] lg:right-[10%] lg:top-[62px] lg:h-px lg:w-auto" aria-hidden="true" />
      <div className="grid lg:grid-cols-5">
        {t.engine.map(([index, title, body, evidence]) => (
          <article key={index} className="group relative min-h-[158px] border-b border-[#294047] py-7 pl-16 pr-6 last:border-b-0 lg:min-h-[232px] lg:border-b-0 lg:border-r lg:px-7 lg:py-7 lg:last:border-r-0">
            <span className="absolute left-[20px] top-[29px] z-10 h-[15px] w-[15px] border border-[#729A90] bg-[#091A20] transition-colors duration-200 group-hover:border-[#96B5A6] group-hover:bg-[#96B5A6] lg:left-1/2 lg:top-[55px] lg:-translate-x-1/2 lg:rotate-45" aria-hidden="true" />
            <span className="text-[11px] tracking-[0.1em] text-[#5D7893]">{index}</span>
            <div className="lg:mt-[68px]">
              <p className="mt-4 text-[10px] font-medium tracking-[0.13em] text-[#7F918F] lg:mt-0">{evidence}</p>
              <h3 className="mt-3 text-[13px] font-medium tracking-[0.1em] text-[#F1EEE7]">{title}</h3>
              <p className="mt-3 max-w-[220px] text-[15px] leading-6 text-[#BDBEBD]">{body}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="flex flex-col gap-2 border-t border-[#294047] px-6 py-4 text-[10px] tracking-[0.1em] text-[#82908E] sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <span>{t.engineFootA}</span>
        <span className="font-medium text-[#96B5A6]">{t.engineFootB}</span>
      </div>
    </div>
  )
}

function WatchTimeline({ locale }: { locale: PublicLocale }) {
  const t = content[locale]
  return (
    <div className="border-y border-[#294047]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#294047] px-6 py-4">
        <span className="text-[10px] font-medium tracking-[0.13em] text-[#96B5A6]">{t.watchLabel}</span>
        <span className="flex items-center gap-2 text-[10px] tracking-[0.1em] text-[#82908E]"><span className="h-1.5 w-1.5 rounded-full bg-[#96B5A6]" aria-hidden="true" /> {t.watchCycle}</span>
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute bottom-7 left-[39px] top-7 w-px bg-[#36515A]" aria-hidden="true" />
        {t.watchStages.map(([index, title, body, state]) => (
          <div key={index} className="group relative grid grid-cols-[80px_1fr] border-b border-[#294047] last:border-b-0 sm:grid-cols-[92px_1fr_auto]">
            <div className="relative flex min-h-[92px] items-center justify-center border-r border-[#294047]">
              <span className="relative z-10 flex h-7 w-7 items-center justify-center border border-[#456E8E] bg-[#091A20] text-[10px] text-[#82908E] transition-colors duration-200 group-hover:border-[#96B5A6] group-hover:text-[#E7DFCE]">{index}</span>
            </div>
            <div className="flex min-h-[92px] flex-col justify-center px-5 py-5 sm:px-7">
              <h3 className="text-[12px] font-medium tracking-[0.1em] text-[#F1EEE7]">{title}</h3>
              <p className="mt-2 max-w-xl text-[15px] leading-6 text-[#AEB7B5]">{body}</p>
            </div>
            <div className="hidden min-h-[92px] items-center border-l border-[#294047] px-6 text-[10px] tracking-[0.1em] text-[#5D7893] sm:flex">{state}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function UmbrellaHomePage({ locale = "en" }: { locale?: PublicLocale }) {
  const t = content[locale]

  return (
    <main className="min-h-screen bg-[#0F2A33] text-white">
      <section id="directions" className="scroll-mt-24 px-5 py-20 sm:px-7 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[1480px]">
          <div className="grid gap-7 lg:grid-cols-[1fr_0.62fr] lg:items-end">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.17em] text-[#96B5A6]">{t.start}</p>
              <h2 className="mt-5 max-w-[12ch] text-[clamp(2.7rem,4.5vw,4.65rem)] font-light leading-[0.96] tracking-[-0.05em] text-[#E7DFCE]">{t.startTitle}</h2>
            </div>
            <p className="max-w-xl text-[15px] leading-7 text-[#AEB7B5] lg:pb-1">{t.startBody}</p>
          </div>

          <div className="mt-12 border-y border-[#294047]">
            {t.verticals.map((item) => (
              <article key={item.index} className="group grid gap-6 border-b border-[#294047] py-8 last:border-b-0 md:grid-cols-[70px_1fr_auto] md:items-center lg:py-9">
                <span className="self-start text-[11px] tracking-[0.1em] text-[#5D7893] md:self-center">{item.index}</span>
                <div>
                  <p className="text-[11px] font-medium tracking-[0.13em] text-[#96B5A6]">{item.label}</p>
                  <h3 className="mt-3 max-w-3xl text-[clamp(1.85rem,2.8vw,2.8rem)] font-light leading-[1.03] tracking-[-0.032em] text-[#E7DFCE]">{item.question}</h3>
                  <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#AEB7B5]">{item.body}</p>
                </div>
                <Link href={item.href} className={`inline-flex min-h-11 items-center border-b border-[#4A7F74] text-[11px] font-medium tracking-[0.08em] text-white transition-colors duration-200 hover:border-[#96B5A6] hover:text-[#96B5A6] ${focusRing}`}>{item.cta}</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="engine" className="scroll-mt-24 border-y border-[#294047] bg-[#091A20] px-5 py-20 sm:px-7 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-[1480px]">
          <div className="grid gap-7 lg:grid-cols-[1fr_0.62fr] lg:items-end">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.17em] text-[#96B5A6]">{t.engineEyebrow}</p>
              <h2 className="mt-5 max-w-[12ch] text-[clamp(2.7rem,4.5vw,4.6rem)] font-light leading-[0.96] tracking-[-0.05em] text-[#E7DFCE]">{t.engineTitle}</h2>
            </div>
            <p className="max-w-xl text-[15px] leading-7 text-[#AEB7B5] lg:pb-1">{t.engineBody}</p>
          </div>
          <IntelligenceEngineRail locale={locale} />
        </div>
      </section>

      <section className="px-5 py-20 sm:px-7 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-[1480px] gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="text-[11px] font-medium uppercase tracking-[0.17em] text-[#96B5A6]">{t.logicEyebrow}</p>
            <h2 className="mt-5 max-w-[10.5ch] text-[clamp(2.7rem,4.35vw,4.45rem)] font-light leading-[0.96] tracking-[-0.05em] text-[#E7DFCE]">{t.logicTitle}</h2>
            <p className="mt-6 max-w-xl text-[15px] leading-7 text-[#AEB7B5]">{t.logicBody}</p>
          </div>
          <UmbrellaDemo locale={locale} />
        </div>
      </section>

      <section className="border-y border-[#294047] bg-[#091A20] px-5 py-20 sm:px-7 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-[1480px] gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-start lg:gap-20">
          <div className="lg:sticky lg:top-28">
            <p className="text-[11px] font-medium uppercase tracking-[0.17em] text-[#96B5A6]">{t.watchEyebrow}</p>
            <h2 className="mt-5 max-w-[10ch] text-[clamp(2.7rem,4.45vw,4.6rem)] font-light leading-[0.96] tracking-[-0.05em] text-[#E7DFCE]">{t.watchTitle}</h2>
            <p className="mt-6 max-w-xl text-[15px] leading-7 text-[#BDBEBD]">{t.watchBody}</p>
            <p className="mt-7 max-w-lg text-[16px] font-normal leading-7 text-[#96B5A6]">{t.watchAccent}</p>
          </div>
          <WatchTimeline locale={locale} />
        </div>
      </section>

      <section className="px-5 py-24 sm:px-7 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[1480px]">
          <h2 className="max-w-[12ch] text-[clamp(2.9rem,5vw,5.1rem)] font-light leading-[0.94] tracking-[-0.052em] text-[#E7DFCE]">{t.final}</h2>
          <div className="mt-10 border-y border-[#294047] md:grid md:grid-cols-3">
            {t.verticals.map((item) => (
              <Link key={item.index} href={item.href} className={`group flex min-h-[88px] items-center justify-between border-b border-[#294047] py-6 text-[11px] font-medium tracking-[0.08em] text-white transition-colors duration-200 last:border-b-0 hover:text-[#96B5A6] md:border-b-0 md:border-r md:px-7 md:last:border-r-0 ${focusRing}`}>
                <span>{item.cta}</span><span aria-hidden="true" className="text-[#5D7893] transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
