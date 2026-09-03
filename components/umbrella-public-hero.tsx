import Link from "next/link"

const evidenceRows = [
  ["01", "SEARCH", "What exists?"],
  ["02", "COMPARE", "How related is it?"],
  ["03", "WATCH", "What changed?"],
] as const

export function UmbrellaPublicHero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-white/10 bg-[#071119] px-5 sm:px-7 lg:px-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_77%_36%,rgba(74,127,116,0.13),transparent_27%),radial-gradient(circle_at_92%_76%,rgba(69,110,142,0.08),transparent_29%),linear-gradient(110deg,#071119_0%,#091A20_52%,#071119_100%)]" />
        <div className="absolute inset-y-0 left-0 w-[58%] bg-[linear-gradient(90deg,#071119_0%,rgba(7,17,25,.98)_67%,rgba(7,17,25,0)_100%)]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(183,211,209,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(183,211,209,.10)_1px,transparent_1px)] [background-size:92px_92px] [mask-image:linear-gradient(to_right,transparent_0%,transparent_38%,black_70%,black_100%)]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-72px)] max-w-[1480px] items-center gap-12 py-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(560px,1.1fr)] lg:gap-[clamp(3rem,6vw,7rem)] lg:py-14">
        <div className="max-w-[650px] lg:pb-6">
          <p className="flex items-center gap-3 text-[9px] font-medium uppercase tracking-[0.2em] text-[#96B5A6] sm:text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#96B5A6]" aria-hidden="true" />
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

        <div className="relative min-h-[500px] overflow-hidden border-y border-[#294047] sm:min-h-[560px] lg:min-h-[640px]" aria-label="VIDENTIA intelligence workflow visualization">
          <div className="absolute inset-0 bg-[#091A20]/35" />

          <div className="absolute left-[8%] top-[11%] text-[9px] font-medium tracking-[0.18em] text-[#7F918F]">OBSERVED EVIDENCE</div>
          <div className="absolute right-[7%] top-[11%] text-[9px] font-medium tracking-[0.18em] text-[#456E8E]">TRACEABLE LOGIC</div>

          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 620" role="img" aria-label="Connected evidence paths showing search, comparison and monitoring relationships">
            <g fill="none" stroke="#36515A" strokeWidth="1">
              <path d="M72 160 C210 160 238 228 344 228 S500 158 688 158" />
              <path d="M72 310 C206 310 230 310 344 310 S516 310 688 310" />
              <path d="M72 456 C208 456 242 390 344 390 S512 464 688 464" />
            </g>
            <g fill="none" stroke="#4A7F74" strokeWidth="1.2">
              <path d="M150 160 C236 182 252 242 344 242" />
              <path d="M150 456 C234 432 250 374 344 374" />
            </g>
            <g fill="#96B5A6">
              <circle cx="72" cy="160" r="6" />
              <circle cx="72" cy="310" r="6" />
              <circle cx="72" cy="456" r="6" />
              <circle cx="344" cy="228" r="7" />
              <circle cx="344" cy="310" r="7" />
              <circle cx="344" cy="390" r="7" />
            </g>
            <g fill="#456E8E">
              <circle cx="688" cy="158" r="5" />
              <circle cx="688" cy="310" r="5" />
              <circle cx="688" cy="464" r="5" />
            </g>
          </svg>

          <div className="absolute inset-x-[8%] bottom-[10%] border-t border-[#294047]">
            {evidenceRows.map(([index, label, question]) => (
              <div key={label} className="grid grid-cols-[44px_100px_1fr] items-center border-b border-[#294047] py-4 text-[10px] tracking-[0.1em] last:border-b-0">
                <span className="text-[#456E8E]">{index}</span>
                <span className="text-[#E7DFCE]">{label}</span>
                <span className="text-right text-[#7F918F]">{question}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
