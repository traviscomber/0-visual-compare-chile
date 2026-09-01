import type { PublicLocale } from "@/lib/marketing-locale"

const coverage = {
  es: {
    eyebrow: "SOURCE COVERAGE",
    title: "Qué está observado. Qué sigue fuera de cobertura.",
    body: "VIDENTIA separa señal observada, fuente oficial, contexto y cobertura extendida. Una fuente disponible no se presenta como evidencia si todavía no produjo una señal, y una fuente ausente nunca se interpreta como cero actividad.",
    rows: [
      ["INVESTIGACIÓN", "OpenAlex + Crossref", "EVIDENCIA OPERACIONAL", "Publicaciones, DOI, autores e instituciones para observar recurrencia temática y dirección temporal. VIDENTIA ya registra señales provenientes de ambas fuentes."],
      ["PATENTES · CHILE", "INAPI Datos Abiertos", "MIRROR OFICIAL · DIARIO", "Solicitudes, fechas, estados, IPC, solicitantes y procedencia oficial de Chile. La evidencia se conserva separada del análisis."],
      ["CONTEXTO PÚBLICO", "Google News RSS", "CONTEXTO OPERACIONAL", "Noticias públicas recientes contextualizan un movimiento con fuente y fecha. Se mantienen como contexto de baja relevancia y nunca se usan por sí solas para declarar una tendencia."],
      ["FAMILIAS GLOBALES", "EPO OPS", "CLIENTE LISTO · REQUIERE CREDENCIALES", "El cliente OAuth, búsqueda bibliográfica y familias simples ya están integrados. La cobertura se activa sólo cuando las credenciales EPO OPS están configuradas; hasta entonces el sistema declara el límite."],
    ],
    note: "Cobertura de fuente ≠ exhaustividad. Evidencia ≠ análisis. Análisis ≠ conclusión legal.",
  },
  en: {
    eyebrow: "SOURCE COVERAGE",
    title: "What is observed. What remains outside coverage.",
    body: "VIDENTIA separates observed signals, official evidence, context and extended coverage. An available source is not presented as evidence until it produces a signal, and a missing source is never converted into zero activity.",
    rows: [
      ["RESEARCH", "OpenAlex + Crossref", "OPERATIONAL EVIDENCE", "Publications, DOI metadata, authors and institutions for observing recurring topics and temporal direction. VIDENTIA already records signals from both sources."],
      ["PATENTS · CHILE", "INAPI Open Data", "OFFICIAL MIRROR · DAILY", "Applications, dates, status, IPC, applicants and official Chilean provenance. Evidence remains separate from analysis."],
      ["PUBLIC CONTEXT", "Google News RSS", "OPERATIONAL CONTEXT", "Recent public news contextualizes movement with source and date. It remains low-relevance context and is never used on its own to declare a trend."],
      ["GLOBAL FAMILIES", "EPO OPS", "CLIENT READY · CREDENTIAL-GATED", "OAuth, bibliographic search and simple-family retrieval are integrated. Coverage activates only when EPO OPS credentials are configured; until then VIDENTIA declares the limitation."],
    ],
    note: "Source coverage ≠ completeness. Evidence ≠ analysis. Analysis ≠ legal conclusion.",
  },
} as const

export function TechnologySourceCoverage({ locale }: { locale: PublicLocale }) {
  const c = coverage[locale]

  return (
    <section aria-labelledby="technology-source-coverage-title" className="border-y border-[#294047] bg-[#091A20] px-5 py-24 lg:px-10 lg:py-32">
      <div className="mx-auto max-w-[1480px]">
        <div className="max-w-4xl">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">{c.eyebrow}</p>
          <h2 id="technology-source-coverage-title" className="mt-5 text-[clamp(3rem,5vw,5.4rem)] font-light leading-[0.95] tracking-[-0.055em] text-[#E7DFCE]">{c.title}</h2>
          <p className="mt-7 max-w-3xl text-base leading-8 text-[#BDBEBD]">{c.body}</p>
        </div>

        <div className="mt-14 border-y border-[#294047]">
          {c.rows.map(([axis, source, status, detail], index) => (
            <article key={axis} className="border-b border-[#294047] py-8 last:border-b-0">
              <div className="flex flex-col gap-5 md:flex-row md:items-start">
                <span className="w-10 shrink-0 text-[10px] text-[#456E8E]">0{index + 1}</span>
                <div className="min-w-0 flex-1 md:grid md:grid-cols-[180px_220px_minmax(0,1fr)] md:gap-8">
                  <div>
                    <p className="text-[10px] font-medium tracking-[0.12em] text-[#E7DFCE]">{axis}</p>
                    <p className="mt-2 text-sm text-[#96B5A6]">{source}</p>
                  </div>
                  <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.14em] text-[#7F918F] md:mt-0">{status}</p>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-[#BDBEBD] md:mt-0">{detail}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 max-w-4xl text-[10px] uppercase leading-5 tracking-[0.12em] text-[#738180]">{c.note}</p>
      </div>
    </section>
  )
}
