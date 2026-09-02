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
  height: 88px !important;
}

nav[aria-label="Primary navigation"] > div > a:first-child > span:first-child {
  transform: scale(1.08);
  transform-origin: left center;
}

@media (min-width: 1024px) {
  nav[aria-label="Primary navigation"] > div > div {
    gap: 1.65rem !important;
    font-size: 11px !important;
  }
}

.trademarks-public-page .px-hero {
  min-height: calc(100svh - 88px) !important;
  display: flex !important;
  align-items: center !important;
  padding-top: 56px !important;
  padding-bottom: 64px !important;
}

.trademarks-public-page .px-hero-grid {
  width: 100% !important;
  grid-template-columns: minmax(0, .92fr) minmax(460px, 1.08fr) !important;
  gap: clamp(3rem, 6vw, 7rem) !important;
  align-items: center !important;
}

.trademarks-public-page .px-hero-copy h1 {
  max-width: 9ch !important;
  font-size: clamp(4.15rem, 5.45vw, 5.75rem) !important;
  line-height: .92 !important;
  letter-spacing: -.058em !important;
}

.trademarks-public-page .px-lead {
  max-width: 620px !important;
  font-size: 15px !important;
  line-height: 1.85 !important;
}

.trademarks-public-page .px-hero-visual {
  min-height: 620px !important;
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
  width: min(94%, 680px) !important;
  height: min(72vh, 610px) !important;
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
  nav[aria-label="Primary navigation"] > div {
    height: 80px !important;
  }

  .trademarks-public-page .px-hero {
    min-height: auto !important;
    padding-top: 52px !important;
    padding-bottom: 56px !important;
  }

  .trademarks-public-page .px-hero-grid {
    grid-template-columns: 1fr !important;
    gap: 48px !important;
  }

  .trademarks-public-page .px-hero-copy h1 {
    max-width: 10ch !important;
    font-size: clamp(3.5rem, 10vw, 5.2rem) !important;
  }

  .trademarks-public-page .px-hero-visual {
    min-height: 470px !important;
  }

  .trademarks-public-page .px-hero-art {
    width: min(100%, 620px) !important;
    height: 470px !important;
    min-height: 0 !important;
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
