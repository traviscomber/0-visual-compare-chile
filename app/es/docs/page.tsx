import type { Metadata } from "next"
import { LocalizedDocsPage } from "@/components/localized-docs-page"
import { PublicPlatformFooter } from "@/components/public-platform-footer"
import { PublicStructuredData } from "@/components/public-structured-data"

export const metadata: Metadata = {
  title: "API empresarial",
  description: "Documentación técnica de VIDENTIA para integraciones empresariales de inteligencia marcaria.",
  alternates: {
    canonical: "/es/docs",
    languages: { "es-CL": "/es/docs", en: "/en/docs", "x-default": "/en/docs" },
  },
  openGraph: {
    title: "VIDENTIA API empresarial",
    description: "Conecta la inteligencia marcaria de VIDENTIA con sistemas empresariales mediante rutas API documentadas.",
    url: "https://videntia.app/es/docs",
    locale: "es_CL",
    alternateLocale: ["en_US"],
    siteName: "VIDENTIA",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VIDENTIA API empresarial" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VIDENTIA API empresarial",
    description: "Documentación API empresarial para integraciones de inteligencia marcaria VIDENTIA.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
}

export default function SpanishDocsPage() {
  return <><PublicStructuredData page="resources-es" /><LocalizedDocsPage locale="es" /><PublicPlatformFooter locale="es" /></>
}
