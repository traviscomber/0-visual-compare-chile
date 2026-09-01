import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { LocalizedLandingPage } from "@/components/localized-landing-page"

export const metadata: Metadata = {
  title: "VIDENTIA | Intellectual property and technology intelligence",
  description: "Search, compare and monitor brands, patents and technologies from one intelligence platform with traceable evidence.",
  alternates: {
    canonical: "/en",
    languages: { "es-CL": "/es", "en": "/en" },
  },
  openGraph: {
    title: "VIDENTIA | Intellectual property and technology intelligence",
    description: "Brands. Patents. Technologies. Search once—or keep watching with traceable evidence.",
    locale: "en_US",
    url: "/en",
  },
}

export default async function EnglishPublicPage({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params
  if (path?.length) redirect(`/${path.join("/")}`)
  return (
    <>
      <a href="#main-content" className="fixed left-3 top-3 z-[70] -translate-y-24 bg-[#E7DFCE] px-4 py-3 text-[10px] font-medium tracking-[0.08em] text-[#091A20] transition-transform focus:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#091A20]">SKIP TO CONTENT</a>
      <div id="main-content" tabIndex={-1} className="focus:outline-none">
        <LocalizedLandingPage locale="en" />
      </div>
    </>
  )
}
