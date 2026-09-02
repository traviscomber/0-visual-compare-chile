import Link from "next/link"
import { UmbrellaDemo } from "@/components/umbrella-demo"

const verticals = [
  {
    index: "01",
    label: "TRADEMARKS",
    question: "Can I use and protect this brand?",
    body: "Search names, logos and official records before registration—or continuously monitor registered trademarks for new conflicts and unauthorized use.",
    cta: "CHECK A TRADEMARK",
    href: "/trademarks",
    visual: "trademark",
  },
  {
    index: "02",
    label: "PATENTS",
    question: "Does this invention already exist?",
    body: "Search prior art, compare patent families, review technical relevance and monitor competitors, inventors or specific technologies.",
    cta: "CHECK AN INVENTION",
    href: "/patents",
    visual: "patent",
  },
  {
    index: "03",
    label: "TECHNOLOGIES",
    question: "Where is this technology moving?",
    body: "Track R&D, patents, research, companies and industry developments to identify meaningful signals before they become obvious.",
    cta: "TRACK A TECHNOLOGY",
    href: "/technologies",
    visual: "technology",
  },
] as const

const engine = [
  ["01", "SEARCH", "What exists?"],
  ["02", "COMPARE", "How related is it?"],
  ["03", "EVALUATE", "Why does it matter?"],
  ["04", "WATCH", "What changed?"],
  ["05", "REPORT", "What requires attention?"],
] as const

const heroCapabilities = [
  ["graph", "Knowledge Graph", "Connect complex data and expose relationships that drive insight.", "/technologies"],
  ["agents", "AI Agents", "Autonomous agents that analyze, reason, and accelerate decisions.", "/technologies"],
  ["secure", "Secure by Design", "Enterprise-grade security and governance at every layer of the platform.", "/en/docs"],
  ["impact", "Real Impact", "From insight to action. Deliver measurable results across your organization.", "#directions"],
] as const

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#72D4C5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071119]"

function CapabilityIcon({ type }: { type: (typeof heroCapabilities)[number][0] }) {
  if (type === "graph") {
    return (
      <span className="relative block h-8 w-8 shrink-0" aria-hidden="true">
        <i className="absolute left-1 top-4 h-px w-7 -rotate-[28deg] bg-[#63D0BF]" />
        <i className="absolute left-1 top-4 h-px w-7 rotate-[28deg] bg-[#63D0BF]" />
        <i className="absolute left-0 top-3 h-2.5 w-2.5 rounded-full border border-[#63D0BF] bg-[#08131A]" />
        <i className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border border-[#63D0BF] bg-[#08131A]" />
        <i className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-[#63D0BF] bg-[#08131A]" />
      </span>
    )
  }

  if (type === "agents") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-end gap-1" aria-hidden="true">
        <i className="h-2 w-1 border border-[#63D0BF]" />
        <i className="h-4 w-1 border border-[#63D0BF]" />
        <i className="h-7 w-1 border border-[#63D0BF]" />
        <i className="h-5 w-1 border border-[#63D0BF]" />
      </span>
    )
  }

  if (type === "secure") {
    return (
      <span className="relative block h-8 w-8 shrink-0 border border-[#63D0BF] [clip-path:polygon(50%_0,100%_18%,100%_62%,50%_100%,0_62%,0_18%)]" aria-hidden="true" />
    )
  }

  return (
    <span className="relative block h-8 w-8 shrink-0 rounded-full border border-[#63D0BF]" aria-hidden="true">
      <i className="absolute inset-[7px] rounded-full border border-[#63D0BF]" />
      <i className="absolute -right-1 top-0 h-2.5 w-2.5 rounded-full bg-[#63D0BF]" />
    </span>
  )
}

function TrademarkGeometry() {
  return (
    <div className="relative h-44 w-full max-w-[260px]" aria-hidden="true">
      <span className="absolute left-3 top-5 h-28 w-28 rounded-full border-[18px] border-[#4A7F74]" />
      <span className="absolute left-[86px] top-5 h-28 w-28 rounded-full border-[18px] border-[#96B5A6]" />
      <span className="absolute left-[66px] top-[54px] h-12 w-12 rounded-full bg-[#456E8E]" />
    </div>
  )
}

function PatentGeometry() {
  return (
    <div className="relative h-44 w-full max-w-[260px]" aria-hidden="true">
      <span className="absolute left-3 top-4 h-[3px] w-48 bg-[#456E8E]" />
      <span className="absolute left-3 top-14 h-[3px] w-48 bg-[#4A7F74]" />
      <span className="absolute left-3 top-24 h-[3px] w-48 bg-[#96B5A6]" />
      <span className="absolute left-14 top-0 h-36 w-[3px] bg-[#456E8E]" />
      <span className="absolute left-32 top-0 h-36 w-[3px] bg-[#4A7F74]" />
      <span className="absolute left-[110px] top-[64px] h-14 w-14 border-[14px] border-[#96B5A6]" />
    </div>
  )
}

function TechnologyGeometry() {
  return (
    <div className="relative h-44 w-full max-w-[260px]" aria-hidden="true">
      <span className="absolute left-3 top-4 h-5 w-5 rounded-full bg-[#456E8E]" />
      <span className="absolute left-3 top-[72px] h-5 w-5 rounded-full bg-[#4A7F74]" />
      <span className="absolute left-3 top-[132px] h-5 w-5 rounded-full bg-[#96B5A6]" />
      <span className="absolute left-8 top-[26px] h-px w-32 rotate-[18deg] bg-[#456E8E]" />
      <span className="absolute left-8 top-[82px] h-px w-32 bg-[#4A7F74]" />
      <span className="absolute left-8 top-[137px] h-px w-32 -rotate-[18deg] bg-[#96B5A6]" />
      <span className="absolute right-3 top-[50px] h-20 w-20 rounded-full border-[16px] border-[#96B5A6]" />
    </div>
  )
}

function VerticalGeometry({ type }: { type: (typeof verticals)[number]["visual"] }) {
  if (type === "trademark") return <TrademarkGeometry />
  if (type === "patent") return <PatentGeometry />
  return <TechnologyGeometry />
}

function HeroIntelligenceField() {
  const nodes = [
    [540, 236, 3], [608, 205, 2], [672, 254, 4], [728, 214, 2], [784, 278, 3], [842, 238, 5],
    [900, 290, 2], [957, 246, 3], [1018, 304, 4], [1072, 266, 2], [1130, 322, 5], [1190, 278, 3],
    [1244, 340, 2], [1294, 302, 4], [570, 336, 2], [635, 310, 4], [695, 365, 3], [758, 326, 2],
    [820, 384, 4], [880, 344, 2], [940, 402, 5], [1004, 360, 3], [1062, 418, 2], [1124, 374, 4],
    [1186, 430, 3], [1252, 392, 2], [1310, 448, 4], [610, 450, 3], [674, 424, 2], [738, 474, 5],
    [804, 440, 2], [866, 496, 3], [928, 458, 4], [990, 510, 2], [1050, 470, 5], [1118, 526, 2],
    [1180, 486, 4], [1244, 544, 3], [1308, 506, 2], [696, 560, 2], [758, 532, 4], [822, 584, 3],
    [886, 552, 2], [950, 602, 4], [1016, 568, 3], [1080, 620, 2], [1148, 586, 4], [1214, 632, 3],
  ] as const

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[#061019]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_31%,rgba(49,151,143,0.22),transparent_24%),radial-gradient(circle_at_66%_58%,rgba(50,118,126,0.18),transparent_31%),radial-gradient(circle_at_18%_22%,rgba(20,64,73,0.25),transparent_28%),linear-gradient(100deg,#061019_0%,#07131d_44%,#081923_100%)]" />
      <div className="absolute inset-y-0 left-0 w-[58%] bg-[linear-gradient(90deg,rgba(6,16,25,1)_0%,rgba(6,16,25,.98)_52%,rgba(6,16,25,.82)_76%,rgba(6,16,25,0)_100%)]" />
      <div className="absolute -right-[10%] top-[11%] h-[58%] w-[72%] rounded-[50%] bg-[#1c6c6a]/10 blur-[80px]" />
      <svg viewBox="0 0 1360 760" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full opacity-95">
        <defs>
          <linearGradient id="hero-line" x1="0" x2="1">
            <stop offset="0%" stopColor="#1f6d70" stopOpacity="0" />
            <stop offset="30%" stopColor="#3fa69e" stopOpacity=".28" />
            <stop offset="78%" stopColor="#77d4c7" stopOpacity=".48" />
            <stop offset="100%" stopColor="#d7d0b8" stopOpacity=".18" />
          </linearGradient>
          <linearGradient id="hero-surface" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0f5c5e" stopOpacity=".06" />
            <stop offset="62%" stopColor="#2b918a" stopOpacity=".16" />
            <stop offset="100%" stopColor="#5cc7b8" stopOpacity=".03" />
          </linearGradient>
          <radialGradient id="hero-node">
            <stop offset="0%" stopColor="#dff8ef" stopOpacity=".95" />
            <stop offset="45%" stopColor="#75d7c8" stopOpacity=".8" />
            <stop offset="100%" stopColor="#75d7c8" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d="M440 378 C520 330 570 368 642 330 S760 286 836 334 S954 420 1030 374 S1162 312 1366 356 L1366 760 L440 760 Z" fill="url(#hero-surface)" />
        <g fill="none" stroke="url(#hero-line)" strokeWidth="1">
          <path d="M500 250 L610 205 L672 254 L728 214 L842 238 L900 290 L957 246 L1018 304 L1072 266 L1130 322 L1190 278 L1294 302" />
          <path d="M520 340 L635 310 L695 365 L758 326 L820 384 L880 344 L940 402 L1004 360 L1062 418 L1124 374 L1186 430 L1252 392 L1360 448" />
          <path d="M560 454 L674 424 L738 474 L804 440 L866 496 L928 458 L990 510 L1050 470 L1118 526 L1180 486 L1244 544 L1308 506" />
          <path d="M650 566 L758 532 L822 584 L886 552 L950 602 L1016 568 L1080 620 L1148 586 L1214 632 L1360 590" />
          <path d="M540 236 L570 336 L610 450 L696 560" />
          <path d="M608 205 L635 310 L674 424 L758 532" />
          <path d="M672 254 L695 365 L738 474 L822 584" />
          <path d="M728 214 L758 326 L804 440 L886 552" />
          <path d="M784 278 L820 384 L866 496 L950 602" />
          <path d="M842 238 L880 344 L928 458 L1016 568" />
          <path d="M900 290 L940 402 L990 510 L1080 620" />
          <path d="M957 246 L1004 360 L1050 470 L1148 586" />
          <path d="M1018 304 L1062 418 L1118 526 L1214 632" />
          <path d="M1072 266 L1124 374 L1180 486 L1244 544" />
          <path d="M1130 322 L1186 430 L1244 544 L1308 506" />
          <path d="M1190 278 L1252 392 L1308 506" />
        </g>
        <g>
          {nodes.map(([cx, cy, r], index) => (
            <g key={`${cx}-${cy}`}>
              <circle cx={cx} cy={cy} r={r * 3.8} fill="url(#hero-node)" opacity={index % 5 === 0 ? .75 : .38} />
              <circle cx={cx} cy={cy} r={r} fill={index % 7 === 0 ? "#e7dfce" : "#74d5c7"} opacity={index % 4 === 0 ? .95 : .68} />
            </g>
          ))}
        </g>
      </svg>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,11,18,.02)_0%,rgba(4,11,18,0)_45%,rgba(4,11,18,.68)_100%)]" />
      <div className="absolute inset-0 opacity-[.12] [background-image:linear-gradient(rgba(128,218,204,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(128,218,204,.08)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_right,transparent_0%,transparent_38%,black_64%,black_100%)]" />
    </div>
  )
}

export function UmbrellaHomePage() {
  return (
    <main className="min-h-screen bg-[#0F2A33] text-white">
      <section className="relative isolate min-h-[calc(100svh-5rem)] overflow-hidden border-b border-white/10 bg-[#061019] lg:min-h-[860px]">
        <HeroIntelligenceField />

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] max-w-[1480px] flex-col px-5 pb-7 pt-[clamp(4.5rem,9vh,7.2rem)] sm:px-7 lg:min-h-[860px] lg:px-10 lg:pb-8 lg:pt-[clamp(6rem,10vh,8rem)]">
          <div className="max-w-[610px] xl:max-w-[650px]">
            <p className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.19em] text-[#64D2C1] sm:text-[11px]">
              <span className="h-2 w-2 rounded-full bg-[#64D2C1] shadow-[0_0_14px_rgba(100,210,193,0.6)]" />
              N3URALIA INTELLIGENCE PLATFORM
            </p>

            <h1 className="mt-7 text-[clamp(3.55rem,6.1vw,6.55rem)] font-light leading-[0.91] tracking-[-0.058em] text-[#F2F2EF] sm:mt-8">
              Surface <span className="text-[#63C8B9]">truth.</span><br />
              Unlock <span className="text-[#63C8B9]">value.</span>
            </h1>

            <p className="mt-7 max-w-[470px] text-[14px] leading-7 text-[#C9CDCC] sm:text-[15px] sm:leading-7">
              VIDENTIA connects data, people and AI<br className="hidden sm:block" /> to reveal what matters and act with confidence.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-9">
              <Link
                href="#directions"
                className={`group inline-flex min-h-14 items-center justify-center gap-6 rounded-[6px] bg-[#62BEB2] px-7 text-sm font-medium text-[#071119] shadow-[0_10px_34px_rgba(52,184,166,0.13)] transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-[#79D4C8] hover:shadow-[0_14px_40px_rgba(52,184,166,0.2)] ${focusRing}`}
              >
                Explore Platform
                <span aria-hidden="true" className="text-[22px] font-light transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="#engine"
                className={`group inline-flex min-h-14 items-center justify-center gap-6 rounded-[6px] border border-[#4A6670]/75 bg-[#09151D]/35 px-7 text-sm text-[#D5D9D8] backdrop-blur-sm transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-[#7EB7B0]/70 hover:bg-[#09151D]/58 ${focusRing}`}
              >
                Watch Overview
                <span aria-hidden="true" className="translate-y-px text-[11px] text-[#DCE3E1]">▷</span>
              </Link>
            </div>
          </div>

          <div className="mt-auto pt-14 sm:pt-16 lg:pt-20">
            <div className="grid overflow-hidden rounded-[10px] border border-[#31535A]/70 bg-[#06141D]/70 shadow-[0_26px_80px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:grid-cols-2 xl:grid-cols-4">
              {heroCapabilities.map(([type, title, body, href], index) => (
                <Link
                  key={title}
                  href={href}
                  className={`group relative min-h-[176px] border-[#31535A]/55 p-6 transition-[background-color,transform] duration-200 hover:bg-[#0B2028]/80 sm:p-7 ${index % 2 === 0 ? "sm:border-r" : ""} ${index < 2 ? "border-b xl:border-b-0" : ""} ${index < 3 ? "xl:border-r" : ""} ${focusRing}`}
                >
                  <div className="flex items-center gap-5">
                    <CapabilityIcon type={type} />
                    <h2 className="text-[15px] font-normal tracking-[-0.01em] text-[#7DDED1] sm:text-base">{title}</h2>
                  </div>
                  <p className="mt-5 max-w-[250px] text-[13px] leading-6 text-[#C0C5C4] sm:text-sm">{body}</p>
                  <span className="absolute bottom-6 left-6 text-[26px] font-light leading-none text-[#63D0BF] transition-transform duration-200 group-hover:translate-x-1 sm:left-7" aria-hidden="true">→</span>
                </Link>
              ))}
            </div>

            <a href="#directions" className={`mx-auto mt-7 flex w-fit flex-col items-center gap-2 text-[9px] font-medium tracking-[0.32em] text-[#D3D6D5] sm:text-[10px] ${focusRing}`}>
              SCROLL TO EXPLORE
              <span className="h-3 w-3 rotate-45 border-b border-r border-[#63D0BF]" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section id="directions" className="scroll-mt-24 px-5 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-[1480px]">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">01. START HERE</p>
          <h2 className="mt-5 max-w-4xl text-[clamp(3rem,5.4vw,5.8rem)] font-light leading-[0.94] tracking-[-0.055em] text-[#E7DFCE]">Choose the question you need to answer.</h2>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-[#9EAAA8]">VIDENTIA routes the investigation by evidence type first. Select a vertical to move into the appropriate search, analysis and monitoring workflow.</p>
          <div className="mt-16 border-y border-[#294047]">
            {verticals.map((item) => (
              <article key={item.label} className="grid gap-8 border-b border-[#294047] py-10 last:border-b-0 md:grid-cols-[70px_1fr_280px] md:items-center lg:grid-cols-[80px_1fr_330px]">
                <span className="self-start text-[10px] tracking-[0.12em] text-[#456E8E]">{item.index}</span>
                <div>
                  <p className="text-[10px] font-medium tracking-[0.16em] text-[#96B5A6]">{item.label}</p>
                  <h3 className="mt-4 max-w-3xl text-3xl font-light leading-tight tracking-[-0.035em] text-[#E7DFCE] sm:text-4xl">{item.question}</h3>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-[#BDBEBD]">{item.body}</p>
                  <Link href={item.href} className={`mt-7 inline-block text-xs font-medium tracking-[0.08em] text-white underline decoration-[#4A7F74] underline-offset-8 ${focusRing}`}>{item.cta}</Link>
                </div>
                <VerticalGeometry type={item.visual} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="engine" className="scroll-mt-24 border-y border-[#294047] bg-[#091A20] px-5 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-[1480px]">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">02. ONE INTELLIGENCE ENGINE</p>
          <h2 className="mt-5 max-w-4xl text-[clamp(3rem,5.4vw,5.8rem)] font-light leading-[0.94] tracking-[-0.055em] text-[#E7DFCE]">Search once—or keep watching.</h2>
          <div className="mt-14 grid border-y border-[#294047] sm:grid-cols-2 lg:grid-cols-5">
            {engine.map(([index, title, body]) => (
              <div key={title} className="border-b border-[#294047] py-7 pr-6 sm:border-r lg:border-b-0 lg:px-6 lg:first:pl-0 lg:last:border-r-0">
                <span className="text-[10px] text-[#456E8E]">{index}</span>
                <h3 className="mt-7 text-xs font-medium tracking-[0.13em] text-[#E7DFCE]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#9EAAA8]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto grid max-w-[1480px] gap-14 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">03. SEE THE LOGIC</p>
            <h2 className="mt-5 max-w-3xl text-[clamp(3rem,5vw,5.4rem)] font-light leading-[0.94] tracking-[-0.055em] text-[#E7DFCE]">Different questions. The same intelligence logic.</h2>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-[#9EAAA8]">Switch between verticals to see which evidence dimensions VIDENTIA organizes before you open the corresponding product experience.</p>
          </div>
          <UmbrellaDemo />
        </div>
      </section>

      <section className="border-y border-[#294047] bg-[#091A20] px-5 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto grid max-w-[1480px] gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">04. CONTINUOUS INTELLIGENCE</p>
            <h2 className="mt-5 text-[clamp(3rem,5.2vw,5.6rem)] font-light leading-[0.94] tracking-[-0.055em] text-[#E7DFCE]">One search can become a watch.</h2>
            <p className="mt-7 max-w-2xl text-base leading-8 text-[#BDBEBD]">Run a single investigation or ask VIDENTIA to repeat the research automatically and notify you when meaningful changes appear.</p>
          </div>
          <div>
            <div className="space-y-0 border-y border-[#294047] text-xs tracking-[0.08em] text-[#E7DFCE]">{["ONE-TIME SEARCH", "CREATE A WATCH", "AUTOMATIC RESEARCH", "PERIODIC REPORTS", "TEAM WORKSPACE"].map((item, index) => <div key={item} className="grid grid-cols-[52px_1fr] border-b border-[#294047] py-5 last:border-b-0"><span className="text-[#456E8E]">0{index + 1}</span><span>{item}</span></div>)}</div>
            <p className="mt-8 text-xl font-light leading-8 text-[#96B5A6]">Would you like VIDENTIA to keep watching this for you?</p>
          </div>
        </div>
      </section>

      <section className="px-5 py-28 lg:px-10 lg:py-36">
        <div className="mx-auto max-w-[1480px]">
          <h2 className="max-w-5xl text-[clamp(3.4rem,6.2vw,6.5rem)] font-light leading-[0.9] tracking-[-0.06em] text-[#E7DFCE]">What do you need to understand next?</h2>
          <div className="mt-14 grid gap-px bg-[#294047] md:grid-cols-3">
            {verticals.map((item) => <Link key={item.label} href={item.href} className={`bg-[#0F2A33] p-7 text-xs font-medium tracking-[0.08em] text-white transition-colors hover:bg-[#132F35] sm:p-9 ${focusRing}`}>{item.cta}</Link>)}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#294047] bg-[#091A20] px-5 py-10 lg:px-10">
        <div className="mx-auto flex max-w-[1480px] flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div><strong className="text-[15px] font-normal tracking-[0.22em] text-[#E7DFCE]">ViDENTiA</strong><p className="mt-3 max-w-lg text-xs leading-6 text-[#7F918F]">Intelligence for intellectual property and technology. Research and evidence are not automatic legal conclusions.</p></div>
          <div className="flex flex-wrap gap-5 text-[10px] tracking-[0.08em] text-[#BDBEBD]"><Link href="/trademarks" className={focusRing}>TRADEMARKS</Link><Link href="/patents" className={focusRing}>PATENTS</Link><Link href="/technologies" className={focusRing}>TECHNOLOGIES</Link></div>
        </div>
      </footer>
    </main>
  )
}
