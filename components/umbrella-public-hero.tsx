import Image from "next/image"
import Link from "next/link"

export function UmbrellaPublicHero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-white/10 bg-[#071119] px-5 sm:px-7 lg:px-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_79%_37%,rgba(74,127,116,0.15),transparent_27%),radial-gradient(circle_at_92%_76%,rgba(69,110,142,0.09),transparent_29%),linear-gradient(110deg,#071119_0%,#091A20_52%,#071119_100%)]" />
        <div className="absolute inset-y-0 left-0 w-[60%] bg-[linear-gradient(90deg,#071119_0%,rgba(7,17,25,.98)_67%,rgba(7,17,25,0)_100%)]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(183,211,209,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(183,211,209,.10)_1px,transparent_1px)] [background-size:92px_92px] [mask-image:linear-gradient(to_right,transparent_0%,transparent_42%,black_72%,black_100%)]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-72px)] max-w-[1480px] items-center gap-8 py-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(560px,1.12fr)] lg:gap-[clamp(3rem,6vw,7rem)] lg:py-12">
        <div className="max-w-[650px] lg:pb-6">
          <p className="flex items-center gap-3 text-[9px] font-medium uppercase tracking-[0.2em] text-[#96B5A6] sm:text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#96B5A6] shadow-[0_0_12px_rgba(150,181,166,.42)]" aria-hidden="true" />
            N3URALIA INTELLIGENCE PLATFORM
          </p>

          <h1 className="mt-6 max-w-[9.5ch] text-[clamp(3.65rem,5.15vw,6rem)] font-light leading-[0.91] tracking-[-0.06em] text-[#F1EEE7] [text-wrap:balance]">
            Surface <span className="text-[#96B5A6]">truth.</span> Unlock <span className="text-[#96B5A6]">value.</span>
          </h1>

          <p className="mt-7 max-w-[540px] text-[15px] leading-7 text-[#BDBEBD] sm:text-[16px] sm:leading-8">
            Search, connect and continuously monitor trademarks, patents and technology signals with traceable intelligence built for consequential decisions.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#directions" className="inline-flex min-h-12 items-center border border-[#4A7F74] bg-[#4A7F74] px-5 text-[10px] font-medium tracking-[0.1em] text-white transition-colors hover:border-[#5D9388] hover:bg-[#5D9388] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071119]">
              EXPLORE INTELLIGENCE
            </Link>
            <Link href="/en/acceso-empresarial" className="inline-flex min-h-12 items-center border border-[#36515A] px-5 text-[10px] font-medium tracking-[0.1em] text-[#D6D9D5] transition-colors hover:border-[#96B5A6] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071119]">
              REQUEST ACCESS
            </Link>
          </div>
        </div>

        <div className="relative flex min-h-[430px] items-center justify-center overflow-visible sm:min-h-[520px] lg:min-h-[690px] lg:justify-end">
          <div className="pointer-events-none absolute left-[16%] top-[18%] h-[56%] w-[68%] rounded-full bg-[#4A7F74]/10 blur-[78px]" aria-hidden="true" />
          <Image
            src="/images/VidentiaLanding.svg"
            alt="VIDENTIA intelligence platform geometric object"
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
