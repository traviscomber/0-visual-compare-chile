import Link from "next/link"
import { PublicPlatformFooter } from "@/components/public-platform-footer"
import { PublicPlatformNav } from "@/components/public-platform-nav"

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071119]"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#071119] text-[#E7DFCE]">
      <PublicPlatformNav locale="en" />
      <main id="main-content" className="relative isolate overflow-hidden border-b border-[#294047] px-5 py-20 sm:px-7 lg:px-10">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_32%,rgba(74,127,116,0.10),transparent_28%),linear-gradient(115deg,#071119_0%,#091A20_58%,#071119_100%)]" />
          <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(183,211,209,.14)_1px,transparent_1px),linear-gradient(90deg,rgba(183,211,209,.08)_1px,transparent_1px)] [background-size:96px_96px]" />
        </div>

        <div className="relative mx-auto flex min-h-[calc(100svh-232px)] max-w-[1480px] items-center">
          <div className="max-w-3xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.17em] text-[#96B5A6]">404 · SIGNAL NOT FOUND</p>
            <h1 className="mt-6 max-w-[11ch] text-[clamp(3.2rem,7vw,6.4rem)] font-light leading-[0.93] tracking-[-0.055em] text-[#E7DFCE] [text-wrap:balance]">This path is outside the evidence map.</h1>
            <p className="mt-7 max-w-2xl text-[16px] leading-8 text-[#BDBEBD]">The requested page does not exist or has moved. Return to VIDENTIA or continue directly into an intelligence vertical.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/" className={`inline-flex min-h-12 items-center border border-[#4A7F74] bg-[#4A7F74] px-5 text-[11px] font-medium tracking-[0.08em] text-white transition-colors duration-200 hover:border-[#5D9388] hover:bg-[#5D9388] ${focusRing}`}>RETURN HOME</Link>
              <Link href="/trademarks" className={`inline-flex min-h-12 items-center border border-[#36515A] px-5 text-[11px] font-medium tracking-[0.08em] text-[#D6D9D5] transition-colors duration-200 hover:border-[#96B5A6] hover:text-white ${focusRing}`}>OPEN TRADEMARKS</Link>
            </div>
          </div>
        </div>
      </main>
      <PublicPlatformFooter locale="en" />
    </div>
  )
}