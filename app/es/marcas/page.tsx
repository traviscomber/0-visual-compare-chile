import type { Metadata } from "next"
import { LocalizedLandingPage } from "@/components/locked-trademark-landing"
import { PublicPlatformNav } from "@/components/public-platform-nav"
import { PublicStructuredData } from "@/components/public-structured-data"

const description = "Busca, compara, protege y monitorea marcas con inteligencia marcaria trazable."

export const metadata: Metadata = {
  title: "Inteligencia de marcas",
  description,
  alternates: {
    canonical: "/es/marcas",
    languages: { "es-CL": "/es/marcas", en: "/trademarks", "x-default": "/trademarks" },
  },
  openGraph: {
    title: "Inteligencia de marcas | VIDENTIA",
    description,
    url: "/es/marcas",
    siteName: "VIDENTIA",
    type: "website",
    locale: "es_CL",
    alternateLocale: ["en_US"],
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VIDENTIA — Inteligencia de marcas" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Inteligencia de marcas | VIDENTIA",
    description,
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
}

export default function SpanishTrademarksPage() {
  return (
    <>
      <PublicStructuredData page="trademarks-es" />
      <PublicPlatformNav active="trademarks" locale="es" />
      <div id="main-content" tabIndex={-1} className="[&_.px-nav]:hidden focus:outline-none">
        <LocalizedLandingPage locale="es" />
      </div>
    </>
  )
}
