import Link from "next/link"
import { PublicPlatformNav } from "@/components/public-platform-nav"
import { PublicSurfaceMotion } from "@/components/public-surface-motion"
import { localePath, type PublicLocale } from "@/lib/marketing-locale"

const endpoints = [
  ["GET", "/api/v1/health", "Public", "curl \"$BASE_URL/api/v1/health\""],
  ["GET", "/api/v1/trademarks/search", "Bearer API key", "curl \"$BASE_URL/api/v1/trademarks/search?q=$QUERY&type=nombre\" -H \"Authorization: Bearer $API_KEY\""],
  ["POST", "/api/v1/images", "Bearer API key", "curl -X POST \"$BASE_URL/api/v1/images\" -H \"Authorization: Bearer $API_KEY\" -F \"image=@$IMAGE_PATH\""],
  ["POST", "/api/v1/compare", "Bearer API key", "curl -X POST \"$BASE_URL/api/v1/compare\" -H \"Authorization: Bearer $API_KEY\" -H \"Content-Type: application/json\""],
] as const

const copy = {
  es: {
    tagline: "ENTERPRISE API · CHILE",
    title: "Conecta VIDENTIA con tus sistemas.",
    body: "Integra búsqueda marcaria, imágenes y comparación con rutas empresariales verificables. El acceso API se habilita después de revisar el caso de uso.",
    enterprise: "SOLICITAR ACCESO",
    demo: "PROBAR VIDENTIA",
    capabilities: "01. CAPACIDADES VERIFICADAS",
    contract: "02. CONTRATO API",
    contractTitle: "Rutas claras. Evidencia trazable.",
    contractBody: "Las operaciones protegidas usan API key, cuota y medición. La búsqueda web interna no forma parte de este contrato público.",
    capabilityItems: [
      ["BÚSQUEDA MARCARIA", "Nombre, Niza y Viena con filtros verificables."],
      ["INGESTA DE IMÁGENES", "Procesamiento técnico y deduplicación por hash."],
      ["COMPARACIÓN", "Similitud, OCR, EXIF, ELA y señales forenses disponibles."],
      ["CONTROL COMERCIAL", "API key, cuotas y registro de consumo en operaciones protegidas."],
    ],
    descriptions: [
      "Estado del servicio y frescura de sincronizaciones INAPI.",
      "Búsqueda comercial de marcas por nombre, Niza o Viena, con filtros, cuota y medición de uso.",
      "Ingesta de una imagen real con SHA-256, pHash, metadatos y deduplicación.",
      "Compara dos imágenes previamente incorporadas y devuelve señales técnicas y contexto disponible.",
    ],
  },
  en: {
    tagline: "ENTERPRISE API · CHILE",
    title: "Connect VIDENTIA to your systems.",
    body: "Integrate trademark search, image ingestion and comparison through verifiable enterprise routes. API access is enabled after the use case is reviewed.",
    enterprise: "REQUEST ACCESS",
    demo: "TRY VIDENTIA",
    capabilities: "01. VERIFIED CAPABILITIES",
    contract: "02. API CONTRACT",
    contractTitle: "Clear routes. Traceable evidence.",
    contractBody: "Protected operations use API keys, quotas and usage metering. VIDENTIA's internal web search is not part of this public contract.",
    capabilityItems: [
      ["TRADEMARK SEARCH", "Name, Nice and Vienna with verifiable filters."],
      ["IMAGE INGESTION", "Technical processing and hash-based deduplication."],
      ["COMPARISON", "Similarity, OCR, EXIF, ELA and available forensic signals."],
      ["COMMERCIAL CONTROL", "API keys, quotas and consumption records for protected operations."],
    ],
    descriptions: [
      "Service status and INAPI synchronization freshness.",
      "Commercial trademark search by name, Nice or Vienna with filters, quota and usage metering.",
      "Ingest a real image with SHA-256, pHash, metadata and deduplication.",
      "Compare two previously ingested images and return technical signals and available context.",
    ],
  },
} as const

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071119]"

export function LocalizedDocsPage({ locale }: { locale: PublicLocale }) {
  const t = copy[locale]

  return (
    <div data-public-surface className="min-h-screen bg-[#071119] text-[#E7DFCE]">
      <PublicSurfaceMotion variant="resources" />
      <PublicPlatformNav active="resources" locale={locale} />

      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <section className="relative overflow-hidden border-b border-[#294047] bg-[#071119] px-5 py-20 sm:px-7 lg:px-10 lg:py-24">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_32%,rgba(74,127,116,0.10),transparent_30%),linear-gradient(115deg,#071119_0%,#091A20_58%,#071119_100%)]" />
            <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(183,211,209,.15)_1px,transparent_1px),linear-gradient(90deg,rgba(183,211,209,.08)_1px,transparent_1px)] [background-size:96px_96px] [mask-image:linear-gradient(to_right,transparent_0%,transparent_42%,black_74%,black_100%)]" />
          </div>

          <div className="relative mx-auto grid max-w-[1480px] gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.17em] text-[#96B5A6]">{t.tagline}</p>
              <h1 className="mt-6 max-w-[12ch] text-[clamp(3rem,5vw,4.55rem)] font-light leading-[0.95] tracking-[-0.052em] text-[#E7DFCE] [text-wrap:balance]">{t.title}</h1>
            </div>

            <div className="max-w-[620px] lg:justify-self-end lg:pb-1">
              <p className="text-[16px] leading-8 text-[#C4C8C6]">{t.body}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={localePath(locale, "/acceso-empresarial")} className={`inline-flex min-h-12 items-center border border-[#4A7F74] bg-[#4A7F74] px-5 text-[11px] font-medium tracking-[0.08em] text-white transition-colors duration-200 hover:border-[#5D9388] hover:bg-[#5D9388] ${focusRing}`}>{t.enterprise}</Link>
                <Link href={localePath(locale, "/demo")} className={`inline-flex min-h-12 items-center border border-[#36515A] px-5 text-[11px] font-medium tracking-[0.08em] text-[#D6D9D5] transition-colors duration-200 hover:border-[#96B5A6] hover:text-white ${focusRing}`}>{t.demo}</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#294047] bg-[#0F2A33] px-5 py-20 sm:px-7 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-[1480px]">
            <p className="text-[11px] font-medium uppercase tracking-[0.17em] text-[#96B5A6]">{t.capabilities}</p>
            <div className="mt-10 border-y border-[#36515A]">
              {t.capabilityItems.map(([title, text], index) => (
                <article key={title} className="grid gap-5 border-b border-[#36515A] py-7 last:border-b-0 md:grid-cols-[72px_0.8fr_1.2fr] md:items-start lg:py-8">
                  <span className="font-mono text-[11px] tracking-[0.1em] text-[#5D7893]">0{index + 1}</span>
                  <h2 className="text-[13px] font-medium tracking-[0.1em] text-[#F1EEE7]">{title}</h2>
                  <p className="max-w-2xl text-[15px] leading-7 text-[#B6BEBC]">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#091A20] px-5 py-20 sm:px-7 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1480px]">
            <div className="grid gap-8 border-b border-[#294047] pb-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.17em] text-[#96B5A6]">{t.contract}</p>
                <h2 className="mt-5 max-w-[12ch] text-[clamp(2.6rem,4.4vw,4.25rem)] font-light leading-[0.97] tracking-[-0.048em] text-[#E7DFCE]">{t.contractTitle}</h2>
              </div>
              <p className="max-w-2xl text-[16px] leading-8 text-[#B6BEBC] lg:justify-self-end">{t.contractBody}</p>
            </div>

            <div className="divide-y divide-[#294047] border-b border-[#294047]">
              {endpoints.map((item, index) => (
                <article key={item[1]} className="grid gap-7 py-8 lg:grid-cols-[70px_0.9fr_1.25fr] lg:items-start lg:py-9">
                  <span className="font-mono text-[11px] tracking-[0.1em] text-[#5D7893]">0{index + 1}</span>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="border border-[#4A7F74] bg-[#13272D] px-2.5 py-1 font-mono text-[11px] font-semibold tracking-[0.06em] text-[#C9DDDA]">{item[0]}</span>
                      <span className="text-[12px] text-[#92A19F]">{item[2]}</span>
                    </div>
                    <h3 className="mt-5 break-all font-mono text-[16px] font-medium text-[#F1EEE7]">{item[1]}</h3>
                    <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#AEB7B5]">{t.descriptions[index]}</p>
                  </div>
                  <pre tabIndex={0} className={`overflow-x-auto border border-[#36515A] bg-[#071119] p-5 font-mono text-[13px] leading-6 text-[#C3D8D4] ${focusRing}`}><code>{item[3]}</code></pre>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}