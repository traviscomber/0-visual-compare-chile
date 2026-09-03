import type { Metadata } from "next"
import { LocalizedDocsPage } from "@/components/localized-docs-page"

export const metadata: Metadata = {
  title: "Enterprise API",
  description: "VIDENTIA technical documentation for enterprise trademark intelligence integrations.",
  alternates: {
    canonical: "/en/docs",
    languages: { "es-CL": "/es/docs", en: "/en/docs" },
  },
  openGraph: {
    title: "VIDENTIA Enterprise API",
    description: "Connect VIDENTIA trademark intelligence to enterprise systems through documented API routes.",
    url: "https://videntia.app/en/docs",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VIDENTIA Enterprise API",
    description: "Enterprise API documentation for VIDENTIA trademark intelligence integrations.",
  },
}

export default function EnglishDocsPage() {
  return <LocalizedDocsPage locale="en" />
}
