import type { Metadata } from "next"
import { LocalizedLandingPage } from "@/components/locked-trademark-landing"
import { PublicPlatformNav } from "@/components/public-platform-nav"
import { PublicStructuredData } from "@/components/public-structured-data"
import { VerticalPublicHero } from "@/components/vertical-public-hero"

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

export default function TrademarksPage() {
  return (
    <>
      <PublicStructuredData page="trademarks" />
      <PublicPlatformNav active="trademarks" />
      <div id="main-content" tabIndex={-1} className="trademarks-public-page focus:outline-none [&_.px-nav]:hidden [&_.px-hero]:hidden">
        <VerticalPublicHero
          eyebrow="TRADEMARK INTELLIGENCE"
          title="Know the brand landscape before you file."
          body="Search marks, classes, owners and conflicting signals with traceable evidence before filing, expanding or monitoring a brand."
          cta="OPEN TRADEMARK INTELLIGENCE"
          href="/en/auth/login?redirectTo=%2Ftrademarks"
          imageSrc="/images/VidentiaTrademarks.svg"
          imageAlt="VIDENTIA trademark intelligence object"
          imageClassName="max-h-[610px] lg:max-h-[670px]"
        />
        <LocalizedLandingPage locale="en" />
      </div>
    </>
  )
}
