import type { Metadata } from "next"
import { UmbrellaHomePage } from "@/components/umbrella-home-page"
import { UmbrellaMotion } from "@/components/umbrella-motion"
import { UmbrellaPublicHero } from "@/components/umbrella-public-hero"
import { PublicPlatformNav } from "@/components/public-platform-nav"
import { PublicStructuredData } from "@/components/public-structured-data"

const description = "Search, analyze and continuously monitor trademarks, patents and technologies with traceable IP and technology intelligence."

export const metadata: Metadata = {
  title: { absolute: "VIDENTIA — IP & Technology Intelligence" },
  description,
  alternates: {
    canonical: "/",
    languages: { en: "/", "es-CL": "/es", "x-default": "/" },
  },
  openGraph: {
    title: "VIDENTIA — IP & Technology Intelligence",
    description,
    url: "/",
    siteName: "VIDENTIA",
    type: "website",
    locale: "en_US",
    alternateLocale: ["es_CL"],
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VIDENTIA — IP & Technology Intelligence" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VIDENTIA — IP & Technology Intelligence",
    description,
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
}

export default function RootPage() {
  return (
    <>
      <PublicStructuredData page="home" />
      <PublicPlatformNav active="home" />
      <div id="main-content" tabIndex={-1} className="focus:outline-none">
        <UmbrellaPublicHero />
        <UmbrellaHomePage />
      </div>
      <UmbrellaMotion />
    </>
  )
}
