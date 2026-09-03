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
  height: 78px !important;
}

@media (min-width: 1024px) {
  nav[aria-label="Primary navigation"] > div > div {
    gap: 1.35rem !important;
    font-size: 10px !important;
  }
}

.trademarks-public-page .px-hero {
  min-height: calc(100svh - 78px) !important;
  display: flex !important;
  align-items: center !important;
  padding-top: 42px !important;
  padding-bottom: 50px !important;
}

.trademarks-public-page .px-hero-grid {
  width: 100% !important;
  grid-template-columns: minmax(0, .96fr) minmax(500px, 1.04fr) !important;
  gap: clamp(2.5rem, 4.5vw, 5.25rem) !important;
  align-items: center !important;
}

.trademarks-public-page .px-hero-copy h1 {
  max-width: 15ch !important;
  font-size: clamp(3.25rem, 4vw, 4.45rem) !important;
  line-height: .96 !important;
  letter-spacing: -.048em !important;
}

.trademarks-public-page .px-lead {
  max-width: 580px !important;
  margin-top: 1.5rem !important;
  font-size: 15px !important;
  line-height: 1.72 !important;
}

.trademarks-public-page .px-search {
  margin-top: 1.75rem !important;
}

.trademarks-public-page .px-hero-visual {
  min-height: 560px !important;
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
  width: min(96%, 650px) !important;
  height: min(68vh, 560px) !important;
  min-height: 480px !important;
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
    padding-top: 42px !important;
    padding-bottom: 48px !important;
  }

  .trademarks-public-page .px-hero-grid {
    grid-template-columns: 1fr !important;
    gap: 28px !important;
  }

  .trademarks-public-page .px-hero-copy h1 {
    max-width: 15ch !important;
    font-size: clamp(2.95rem, 7.5vw, 4.1rem) !important;
  }

  .trademarks-public-page .px-hero-visual {
    min-height: 460px !important;
  }

  .trademarks-public-page .px-hero-art {
    width: min(94%, 520px) !important;
    height: 460px !important;
    min-height: 0 !important;
  }
}

@media (max-width: 640px) {
  .trademarks-public-page .px-hero-copy h1 {
    max-width: 14ch !important;
    font-size: clamp(2.55rem, 11vw, 3.3rem) !important;
  }

  .trademarks-public-page .px-hero-visual {
    min-height: 370px !important;
  }

  .trademarks-public-page .px-hero-art {
    height: 370px !important;
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
