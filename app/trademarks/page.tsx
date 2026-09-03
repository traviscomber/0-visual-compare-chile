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
nav[aria-label="Primary navigation"] > div {
  height: 80px !important;
}

@media (min-width: 1024px) {
  nav[aria-label="Primary navigation"] > div > div {
    gap: 1.5rem !important;
    font-size: 10px !important;
  }
}

.trademarks-public-page .px-hero {
  min-height: calc(100svh - 80px) !important;
  display: flex !important;
  align-items: center !important;
  padding-top: 52px !important;
  padding-bottom: 60px !important;
}

.trademarks-public-page .px-hero-grid {
  width: 100% !important;
  grid-template-columns: minmax(0, .9fr) minmax(520px, 1.1fr) !important;
  gap: clamp(3rem, 5vw, 6rem) !important;
  align-items: center !important;
}

.trademarks-public-page .px-hero-copy h1 {
  max-width: 14ch !important;
  font-size: clamp(3.35rem, 4.35vw, 4.8rem) !important;
  line-height: .94 !important;
  letter-spacing: -.052em !important;
  text-wrap: balance !important;
}

.trademarks-public-page .px-lead {
  max-width: 600px !important;
  margin-top: 1.65rem !important;
  font-size: 15px !important;
  line-height: 1.75 !important;
}

.trademarks-public-page .px-hero-visual {
  min-height: 580px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background: transparent !important;
}

.trademarks-public-page .px-hero-light {
  display: none !important;
}

.trademarks-public-page .px-hero-art {
  position: relative !important;
  inset: auto !important;
  width: min(100%, 620px) !important;
  height: min(70vh, 580px) !important;
  min-height: 500px !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background-color: transparent !important;
  background-image: url('/images/VidentiaTrademarks.svg') !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
  background-size: contain !important;
}

.trademarks-public-page .px-hero-art > img {
  opacity: 0 !important;
}

@media (max-width: 1023px) {
  .trademarks-public-page .px-hero {
    min-height: auto !important;
    padding-top: 48px !important;
    padding-bottom: 56px !important;
  }

  .trademarks-public-page .px-hero-grid {
    grid-template-columns: 1fr !important;
    gap: 36px !important;
  }

  .trademarks-public-page .px-hero-copy h1 {
    max-width: 14ch !important;
    font-size: clamp(3rem, 8vw, 4.35rem) !important;
  }

  .trademarks-public-page .px-hero-visual {
    min-height: 500px !important;
  }

  .trademarks-public-page .px-hero-art {
    width: min(100%, 540px) !important;
    height: 500px !important;
    min-height: 0 !important;
  }
}

@media (max-width: 640px) {
  .trademarks-public-page .px-hero-copy h1 {
    max-width: 13ch !important;
    font-size: clamp(2.65rem, 12.5vw, 3.65rem) !important;
  }

  .trademarks-public-page .px-hero-visual {
    min-height: 400px !important;
  }

  .trademarks-public-page .px-hero-art {
    height: 400px !important;
  }
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
