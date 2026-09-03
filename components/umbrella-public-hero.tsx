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
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_79%_37%,rgba(74,127,116,0.12),transparent_27%),linear-gradient(110deg,#071119_0%,#091A20_56%,#071119_100%)]" />
        <div className="absolute inset-y-0 left-0 w-[62%] bg-[linear-gradient(90deg,#071119_0%,rgba(7,17,25,.98)_68%,rgba(7,17,25,0)_100%)]" />
        <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(183,211,209,.14)_1px,transparent_1px),linear-gradient(90deg,rgba(183,211,209,.08)_1px,transparent_1px)] [background-size:96px_96px] [mask-image:linear-gradient(to_right,transparent_0%,transparent_48%,black_76%,black_100%)]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-72px)] max-w-[1480px] items-center gap-8 py-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(560px,1.12fr)] lg:gap-[clamp(3rem,6vw,7rem)] lg:py-12">
        <div className="max-w-[650px] lg:pb-6">
          <p className="flex items-center gap-3 text-[9px] font-medium uppercase tracking-[0.2em] text-[#96B5A6] sm:text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#96B5A6]" aria-hidden="true" />
            {t.eyebrow}
          </p>

          <h1 className="mt-6 max-w-[9.8ch] text-[clamp(3.45rem,5vw,5.8rem)] font-light leading-[0.92] tracking-[-0.058em] text-[#F1EEE7] [text-wrap:balance]">
            {t.titleA} <span className="text-[#96B5A6]">{t.titleB}</span> {t.titleC} <span className="text-[#96B5A6]">{t.titleD}</span>
          </h1>

          <p className="mt-7 max-w-[540px] text-[15px] leading-7 text-[#BDBEBD] sm:text-[16px] sm:leading-8">
            {t.body}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#directions" className="inline-flex min-h-12 items-center border border-[#4A7F74] bg-[#4A7F74] px-5 text-[10px] font-medium tracking-[0.1em] text-white transition-colors duration-200 hover:border-[#5D9388] hover:bg-[#5D9388] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071119]">
              {t.explore}
            </Link>
            <Link href={t.accessHref} className="inline-flex min-h-12 items-center border border-[#36515A] px-5 text-[10px] font-medium tracking-[0.1em] text-[#D6D9D5] transition-colors duration-200 hover:border-[#96B5A6] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071119]">
              {t.access}
            </Link>
          </div>
        </div>

        <div className="relative flex min-h-[430px] items-center justify-center overflow-visible sm:min-h-[520px] lg:min-h-[690px] lg:justify-end">
          <div className="pointer-events-none absolute left-[18%] top-[20%] h-[52%] w-[64%] rounded-full bg-[#4A7F74]/8 blur-[78px]" aria-hidden="true" />
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
