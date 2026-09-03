import type { Metadata } from "next"
import { LocalizedDocsPage } from "@/components/localized-docs-page"
import { PublicPlatformFooter } from "@/components/public-platform-footer"

export const metadata: Metadata = {
  title: "API empresarial",
  description: "Documentación técnica de VIDENTIA para integraciones empresariales de inteligencia marcaria.",
  alternates: {
    canonical: "/es/docs",
    languages: { "es-CL": "/es/docs", en: "/en/docs" },
  },
  openGraph: {
    title: "VIDENTIA API empresarial",
    description: "Conecta la inteligencia marcaria de VIDENTIA con sistemas empresariales mediante rutas API documentadas.",
    url: "https://videntia.app/es/docs",
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VIDENTIA API empresarial",
    description: "Documentación API empresarial para integraciones de inteligencia marcaria VIDENTIA.",
  },
}

export default function SpanishDocsPage() {
  return <><LocalizedDocsPage locale="es" /><PublicPlatformFooter locale="es" /></>
}
