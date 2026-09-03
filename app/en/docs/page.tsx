import type { Metadata } from "next"
import { LocalizedDocsPage } from "@/components/localized-docs-page"
import { PublicPlatformFooter } from "@/components/public-platform-footer"
import { PublicStructuredData } from "@/components/public-structured-data"

export const metadata: Metadata = {
  title: "Enterprise API",
  description: "VIDENTIA technical documentation for enterprise trademark intelligence integrations.",
  alternates: {
    canonical: "/en/docs",
    languages: { "es-CL": "/es/docs", en: "/en/docs", "x-default": "/en/docs" },
  },
  openGraph: {
    title: "VIDENTIA Enterprise API",
    description: "Connect VIDENTIA trademark intelligence to enterprise systems through documented API routes.",
    url: "https://videntia.app/en/docs",
    locale: "en_US",
    alternateLocale: ["es_CL"],
    siteName: "VIDENTIA",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VIDENTIA Enterprise API" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VIDENTIA Enterprise API",
    description: "Enterprise API documentation for VIDENTIA trademark intelligence integrations.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
}

export default function EnglishDocsPage() {
  return <><PublicStructuredData page="resources" /><LocalizedDocsPage locale="en" /><PublicPlatformFooter locale="en" /></>
}
