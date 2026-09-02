import type { Metadata } from "next"
import { LocalizedLandingPage } from "@/components/locked-trademark-landing"
import { PublicPlatformNav } from "@/components/public-platform-nav"
import { PublicStructuredData } from "@/components/public-structured-data"

const description = "Search, compare, protect and monitor brands with traceable trademark intelligence."

export const metadata: Metadata = {
  title: "Trademark Intelligence",
  description,
  alternates: {
    canonical: "/trademarks",
    languages: { en: "/trademarks", "es-CL": "/es/marcas", "x-default": "/trademarks" },
  },
  openGraph: {
    title: "Trademark Intelligence | VIDENTIA",
    description,
    url: "/trademarks",
    siteName: "VIDENTIA",
    type: "website",
    locale: "en_US",
    alternateLocale: ["es_CL"],
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VIDENTIA Trademark Intelligence" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trademark Intelligence | VIDENTIA",
    description,
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
}

const trademarkHeroStyles = `
.trademarks-public-page .px-hero-visual,
.trademarks-public-page .px-hero-art {
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background-color: transparent !important;
}

.trademarks-public-page .px-hero-art {
  background-image: url('/images/VidentiaTrademarks.svg') !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
  background-size: contain !important;
}

.trademarks-public-page .px-hero-art > img {
  opacity: 0 !important;
}
`

export default function TrademarksPage() {
  return (
    <>
      <PublicStructuredData page="trademarks" />
      <PublicPlatformNav active="trademarks" />
      <style>{trademarkHeroStyles}</style>
      <div id="main-content" tabIndex={-1} className="trademarks-public-page [&_.px-nav]:hidden focus:outline-none">
        <LocalizedLandingPage locale="en" />
      </div>
    </>
  )
}
