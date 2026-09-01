import type { Metadata } from "next"
import { LocalizedLandingPage } from "@/components/locked-trademark-landing"
import { PublicPlatformNav } from "@/components/public-platform-nav"

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
      <PublicPlatformNav active="trademarks" locale="es" />
      <div className="[&_.px-nav]:hidden">
        <LocalizedLandingPage locale="es" />
      </div>
    </>
  )
}
