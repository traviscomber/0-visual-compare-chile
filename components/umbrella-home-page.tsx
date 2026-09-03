import Link from "next/link"
import { UmbrellaDemo } from "@/components/umbrella-demo"

const verticals = [
  { index: "01", label: "TRADEMARKS", question: "Can I use and protect this brand?", body: "Search names, logos and official records before registration—or continuously monitor registered trademarks for new conflicts and unauthorized use.", cta: "CHECK A TRADEMARK", href: "/trademarks", visual: "trademark" },
  { index: "02", label: "PATENTS", question: "Does this invention already exist?", body: "Search prior art, compare patent families, review technical relevance and monitor competitors, inventors or specific technologies.", cta: "CHECK AN INVENTION", href: "/patents", visual: "patent" },
  { index: "03", label: "TECHNOLOGIES", question: "Where is this technology moving?", body: "Track R&D, patents, research, companies and industry developments to identify meaningful signals before they become obvious.", cta: "TRACK A TECHNOLOGY", href: "/technologies", visual: "technology" },
] as const

const engine = [
  { index: "01", title: "SEARCH", body: "What exists?", evidence: "OBSERVED EVIDENCE" },
  { index: "02", title: "COMPARE", body: "How related is it?", evidence: "RELATIONSHIPS" },
  { index: "03", title: "EVALUATE", body: "Why does it matter?", evidence: "RELEVANCE" },
  { index: "04", title: "WATCH", body: "What changed?", evidence: "CHANGE SIGNALS" },
  { index: "05", title: "REPORT", body: "What requires attention?", evidence: "DECISION RECORD" },
] as const

const watchStages = [
  { index: "01", title: "ONE-TIME SEARCH", body: "Establish a documented evidence baseline." },
  { index: "02", title: "CREATE A WATCH", body: "Define what should be checked again." },
  { index: "03", title: "AUTOMATIC RESEARCH", body: "Repeat the same evidence workflow over time." },
  { index: "04", title: "PERIODIC REPORTS", body: "Surface meaningful changes for review." },
  { index: "05", title: "TEAM WORKSPACE", body: "Keep findings, context and decisions together." },
] as const

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#72D4C5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071119]"

const verticalArtworkPosition = {
  trademark: "left center",
  patent: "center center",
  technology: "right center",
} as const

function VerticalGeometry({ type }: { type: (typeof verticals)[number]["visual"] }) {
  return (
    <div className="flex h-52 w-full items-center justify-center md:justify-end" aria-hidden="true">
      <div
        className="h-44 w-44 shrink-0 lg:h-48 lg:w-48"
        style={{
          backgroundImage: "url('/VidentiaVerticalsIcons.svg')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "auto 100%",
          backgroundPosition: verticalArtworkPosition[type],
        }}
      />
    </div>
  )
}

function IntelligenceEngineRail() {
  return (
    <div className="relative mt-16 border-y border-[#294047] bg-[#071119]/30">
      <div className="pointer-events-none absolute bottom-0 left-[27px] top-0 w-px bg-[#36515A] lg:bottom-auto lg:left-[10%] lg:right-[10%] lg:top-[72px] lg:h-px lg:w-auto" aria-hidden="true" />
      <div className="grid lg:grid-cols-5">
        {engine.map((step, stepIndex) => (
          <article key={step.title} className="group relative min-h-[190px] border-b border-[#294047] py-7 pl-16 pr-6 last:border-b-0 lg:min-h-[300px] lg:border-b-0 lg:border-r lg:px-7 lg:py-8 lg:last:border-r-0">
            <div className="absolute left-[20px] top-[31px] z-10 h-[15px] w-[15px] border border-[#729A90] bg-[#091A20] transition-colors group-hover:bg-[#96B5A6] lg:left-1/2 lg:top-[65px] lg:-translate-x-1/2 lg:rotate-45" aria-hidden="true" />
            {stepIndex < engine.length - 1 ? <span className="absolute left-[27px] top-[46px] hidden h-[40px] w-px bg-gradient-to-b from-[#729A90] to-[#36515A] lg:hidden" aria-hidden="true" /> : null}
            <span className="text-[10px] tracking-[0.14em] text-[#456E8E]">{step.index}</span>
            <div className="lg:mt-[94px]">
              <p className="mt-5 text-[9px] font-medium tracking-[0.18em] text-[#729A90] lg:mt-0">{step.evidence}</p>
              <h3 className="mt-4 text-sm font-medium tracking-[0.13em] text-[#F1EEE7]">{step.title}</h3>
              <p className="mt-3 max-w-[220px] text-base font-light leading-7 text-[#BDBEBD]">{step.body}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="flex flex-col gap-3 border-t border-[#294047] px-6 py-5 text-[9px] tracking-[0.14em] text-[#738180] sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <span>ONE QUERY · SHARED EVIDENCE MODEL</span>
        <span className="text-[#96B5A6]">SEARCH → CONTINUOUS INTELLIGENCE</span>
      </div>
    </div>
  )
}

function WatchTimeline() {
  return (
    <div className="border-y border-[#294047] bg-[#071119]/35">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#294047] px-6 py-4">
        <span className="text-[9px] font-medium tracking-[0.16em] text-[#96B5A6]">ILLUSTRATIVE WORKFLOW</span>
        <span className="flex items-center gap-2 text-[9px] tracking-[0.13em] text-[#738180]"><span className="h-1.5 w-1.5 rounded-full bg-[#96B5A6]" aria-hidden="true" /> WATCH CYCLE</span>
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute bottom-7 left-[39px] top-7 w-px bg-[#36515A]" aria-hidden="true" />
        {watchStages.map((stage, index) => (
          <div key={stage.title} className="group relative grid grid-cols-[80px_1fr] border-b border-[#294047] px-0 py-0 last:border-b-0 sm:grid-cols-[92px_1fr_auto]">
            <div className="relative flex min-h-[104px] items-center justify-center border-r border-[#294047]">
              <span className="relative z-10 flex h-7 w-7 items-center justify-center border border-[#456E8E] bg-[#091A20] text-[9px] text-[#729A90] transition-colors group-hover:border-[#96B5A6] group-hover:text-[#E7DFCE]">{stage.index}</span>
            </div>
            <div className="flex min-h-[104px] flex-col justify-center px-5 py-5 sm:px-7">
              <h3 className="text-[11px] font-medium tracking-[0.12em] text-[#E7DFCE]">{stage.title}</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#9EAAA8]">{stage.body}</p>
            </div>
            <div className="hidden min-h-[104px] items-center border-l border-[#294047] px-6 text-[9px] tracking-[0.12em] text-[#456E8E] sm:flex">{index === 0 ? "BASELINE" : index === watchStages.length - 1 ? "CONTEXT" : "REPEAT"}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function UmbrellaHomePage() {
  return (
    <main className="min-h-screen bg-[#0F2A33] text-white">
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
          <div className="grid gap-8 lg:grid-cols-[1fr_0.62fr] lg:items-end">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">02. ONE INTELLIGENCE ENGINE</p>
              <h2 className="mt-5 max-w-4xl text-[clamp(3rem,5.4vw,5.8rem)] font-light leading-[0.94] tracking-[-0.055em] text-[#E7DFCE]">Search once—or keep watching.</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[#9EAAA8] lg:pb-2">The same evidence logic carries a question from discovery to comparison, evaluation, monitoring and reporting—without turning observed records into automatic conclusions.</p>
          </div>
          <IntelligenceEngineRail />
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
        <div className="mx-auto grid max-w-[1480px] gap-14 lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:gap-20">
          <div className="lg:sticky lg:top-28">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">04. CONTINUOUS INTELLIGENCE</p>
            <h2 className="mt-5 max-w-[10ch] text-[clamp(3rem,5.2vw,5.6rem)] font-light leading-[0.94] tracking-[-0.055em] text-[#E7DFCE]">One search can become a watch.</h2>
            <p className="mt-7 max-w-xl text-base leading-8 text-[#BDBEBD]">Run a single investigation or ask VIDENTIA to repeat the research automatically and notify you when meaningful changes appear.</p>
            <p className="mt-9 max-w-lg text-xl font-light leading-8 text-[#96B5A6]">From a point-in-time answer to an evidence trail that keeps moving.</p>
          </div>
          <WatchTimeline />
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

      <footer className="border-t border-[#294047] bg-[#071119] px-5 py-12 lg:px-10 lg:py-16">
        <div className="mx-auto grid max-w-[1480px] gap-12 lg:grid-cols-[1.5fr_0.75fr_0.75fr] lg:gap-20">
          <div>
            <strong className="text-[16px] font-normal tracking-[0.24em] text-[#E7DFCE]">ViDENTiA</strong>
            <p className="mt-4 max-w-lg text-xs leading-6 text-[#7F918F]">Intelligence for intellectual property and technology. Research and evidence are not automatic legal conclusions.</p>
            <p className="mt-8 text-[9px] font-medium tracking-[0.16em] text-[#456E8E]">POWERED BY N3URALIA</p>
          </div>
          <div>
            <p className="text-[9px] font-medium tracking-[0.16em] text-[#729A90]">INTELLIGENCE</p>
            <nav className="mt-5 flex flex-col items-start gap-4 text-[10px] tracking-[0.09em] text-[#BDBEBD]" aria-label="Intelligence links">
              <Link href="/trademarks" className={focusRing}>TRADEMARKS</Link>
              <Link href="/patents" className={focusRing}>PATENTS</Link>
              <Link href="/technologies" className={focusRing}>TECHNOLOGIES</Link>
            </nav>
          </div>
          <div>
            <p className="text-[9px] font-medium tracking-[0.16em] text-[#729A90]">PLATFORM</p>
            <nav className="mt-5 flex flex-col items-start gap-4 text-[10px] tracking-[0.09em] text-[#BDBEBD]" aria-label="Platform links">
              <Link href="/en/docs" className={focusRing}>RESOURCES</Link>
              <Link href="/en/acceso-empresarial" className={focusRing}>REQUEST ACCESS</Link>
              <Link href="/en/auth/login" prefetch={false} className={focusRing}>LOG IN</Link>
            </nav>
          </div>
        </div>
        <div className="mx-auto mt-12 flex max-w-[1480px] flex-col gap-3 border-t border-[#294047] pt-6 text-[9px] tracking-[0.12em] text-[#536563] sm:flex-row sm:items-center sm:justify-between">
          <span>VIDENTIA · IP & TECHNOLOGY INTELLIGENCE</span>
          <span>TRACEABLE EVIDENCE · HUMAN REVIEW</span>
        </div>
      </footer>
    </main>
  )
}
