import type { Metadata } from "next"
import { LocalizedDemoPage } from "@/components/localized-demo-page"

const description = "Ejecuta una búsqueda preliminar de marcas en Chile y revisa antecedentes y señales de evidencia trazable antes de un análisis más profundo."

export const metadata: Metadata = {
  title: "Búsqueda de marcas en Chile",
  description,
  alternates: { canonical: "/es/demo", languages: { "es-CL": "/es/demo", en: "/en/demo", "x-default": "/en/demo" } },
  openGraph: {
    title: "Búsqueda de marcas en Chile | VIDENTIA",
    description,
    url: "/es/demo",
    siteName: "VIDENTIA",
    type: "website",
    locale: "es_CL",
    alternateLocale: ["en_US"],
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VIDENTIA — Búsqueda de marcas en Chile" }],
  },
  twitter: { card: "summary_large_image", title: "Búsqueda de marcas en Chile | VIDENTIA", description, images: ["/opengraph-image"] },
  robots: { index: true, follow: true },
}

export default function SpanishDemoPage() {
  return <LocalizedDemoPage locale="es" />
}
