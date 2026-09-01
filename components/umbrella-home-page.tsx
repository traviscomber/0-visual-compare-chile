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

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F2A33]"

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

export function UmbrellaHomePage() {
  return (
    <main className="min-h-screen bg-[#0F2A33] text-white">
      <section className="border-b border-[#294047] px-5 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-[1480px] gap-14 lg:grid-cols-[0.98fr_1.02fr] lg:items-center">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">IP & TECHNOLOGY INTELLIGENCE</p>
            <h1 className="mt-6 max-w-4xl text-[clamp(3.8rem,7.2vw,7.6rem)] font-light leading-[0.88] tracking-[-0.06em] text-[#E7DFCE]">Intelligence for what you build, protect and follow.</h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-[#BDBEBD]">Search, analyze and continuously monitor trademarks, patents and technologies from one intelligence platform.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="#directions" className={`bg-[#4A7F74] px-5 py-3.5 text-xs font-medium tracking-[0.06em] text-white ${focusRing}`}>START A SEARCH</Link>
              <Link href="#engine" className={`border border-[#456E8E] px-5 py-3.5 text-xs font-medium tracking-[0.06em] text-[#E7DFCE] ${focusRing}`}>EXPLORE THE PLATFORM</Link>
            </div>
          </div>
          <div className="relative min-h-[430px] overflow-hidden bg-[#091A20] sm:min-h-[520px]" aria-hidden="true">
            <span className="absolute left-[8%] top-[13%] h-40 w-40 rounded-full border-[26px] border-[#4A7F74] sm:h-52 sm:w-52" />
            <span className="absolute left-[31%] top-[13%] h-40 w-40 rounded-full border-[26px] border-[#96B5A6] sm:h-52 sm:w-52" />
            <span className="absolute bottom-[23%] left-[11%] h-[3px] w-[58%] bg-[#456E8E]" />
            <span className="absolute bottom-[13%] left-[11%] h-[3px] w-[70%] bg-[#4A7F74]" />
            <span className="absolute bottom-[8%] right-[13%] h-5 w-5 rounded-full bg-[#96B5A6]" />
            <span className="absolute bottom-[18%] right-[23%] h-5 w-5 rounded-full bg-[#456E8E]" />
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
