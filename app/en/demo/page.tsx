import type { Metadata } from "next"
import { LocalizedDemoPage } from "@/components/localized-demo-page"

const description = "Run a preliminary trademark search in Chile and review traceable prior-right and evidence signals before deeper analysis."

export const metadata: Metadata = {
  title: "Trademark Search Chile",
  description,
  alternates: { canonical: "/en/demo", languages: { "es-CL": "/es/demo", en: "/en/demo", "x-default": "/en/demo" } },
  openGraph: {
    title: "Trademark Search Chile | VIDENTIA",
    description,
    url: "/en/demo",
    siteName: "VIDENTIA",
    type: "website",
    locale: "en_US",
    alternateLocale: ["es_CL"],
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VIDENTIA Trademark Search Chile" }],
  },
  twitter: { card: "summary_large_image", title: "Trademark Search Chile | VIDENTIA", description, images: ["/opengraph-image"] },
  robots: { index: true, follow: true },
}

export default function EnglishDemoPage() {
  return <LocalizedDemoPage locale="en" />
}
