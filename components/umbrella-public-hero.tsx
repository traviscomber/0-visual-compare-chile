import Image from "next/image"
import Link from "next/link"
import type { PublicLocale } from "@/lib/marketing-locale"

const copy = {
  en: {
    eyebrow: "N3URALIA INTELLIGENCE PLATFORM",
    titleA: "Surface",
    titleB: "truth.",
    titleC: "Unlock",
    titleD: "value.",
    body: "Search, connect and continuously monitor trademarks, patents and technology signals with traceable intelligence built for consequential decisions.",
    explore: "EXPLORE INTELLIGENCE",
    access: "REQUEST ACCESS",
    accessHref: "/en/acceso-empresarial",
    alt: "VIDENTIA intelligence platform geometric object",
  },
  es: {
    eyebrow: "PLATAFORMA DE INTELIGENCIA N3URALIA",
    titleA: "Revela",
    titleB: "verdad.",
    titleC: "Desbloquea",
    titleD: "valor.",
    body: "Busca, conecta y monitorea continuamente marcas, patentes y señales tecnológicas con inteligencia trazable para decisiones importantes.",
    explore: "EXPLORAR INTELIGENCIA",
    access: "SOLICITAR ACCESO",
    accessHref: "/es/acceso-empresarial",
    alt: "Objeto geométrico de la plataforma de inteligencia VIDENTIA",
  },
} as const

export function UmbrellaPublicHero({ locale = "en" }: { locale?: PublicLocale }) {
  const t = copy[locale]

  return (
    <section className="relative isolate overflow-hidden border-b border-white/10 bg-[#071119] px-5 sm:px-7 lg:px-10">
      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-72px)] max-w-[1480px] items-center gap-6 py-10 sm:gap-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(560px,1.12fr)] lg:gap-[clamp(3rem,6vw,7rem)] lg:py-12">
        <div className="max-w-[650px] lg:pb-6">
          <p className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.17em] text-[#96B5A6] sm:text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#96B5A6]" aria-hidden="true" />
            {t.eyebrow}
          </p>

          <h1 className="mt-6 max-w-[10ch] text-[clamp(3rem,12.8vw,5.2rem)] font-light leading-[0.94] tracking-[-0.054em] text-[#E7DFCE] [text-wrap:balance] sm:max-w-[9.8ch] lg:text-[clamp(3.6rem,5vw,5.2rem)]">
            {t.titleA} <span className="text-[#96B5A6]">{t.titleB}</span> {t.titleC} <span className="text-[#96B5A6]">{t.titleD}</span>
          </h1>

          <p className="mt-6 max-w-[540px] text-[15px] leading-7 text-[#C4C8C5] sm:mt-7 sm:text-[16px] sm:leading-8">
            {t.body}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="#directions" className="inline-flex min-h-12 items-center justify-center bg-[#4A7F74] px-5 text-[11px] font-medium tracking-[0.075em] text-white transition-colors duration-150 hover:bg-[#5D9388] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071119] sm:justify-start">
              {t.explore}
            </Link>
            <Link href={t.accessHref} className="inline-flex min-h-12 items-center justify-center border border-[#36515A] px-5 text-[11px] font-medium tracking-[0.075em] text-[#D6D9D5] transition-colors duration-150 hover:border-[#96B5A6] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071119] sm:justify-start">
              {t.access}
            </Link>
          </div>
        </div>

        <div className="relative flex min-h-[350px] items-center justify-center overflow-visible sm:min-h-[500px] lg:min-h-[690px] lg:justify-end">
          <Image
            src="/images/VidentiaLanding.svg"
            alt={t.alt}
            width={1100}
            height={760}
            priority
            sizes="(max-width: 767px) 92vw, (max-width: 1023px) 80vw, 56vw"
            className="relative z-10 h-auto w-auto max-h-[720px] max-w-full object-contain lg:max-h-[780px]"
          />
        </div>
      </div>
    </section>
  )
}
