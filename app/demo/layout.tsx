import type React from "react"
import type { Metadata } from "next"
import { PublicLegalFooter } from "@/components/public-legal-footer"

export const metadata: Metadata = {
  title: "Demo de inteligencia marcaria",
  description: "Analiza una marca real con VIDENTIA usando un nombre, una imagen o ambos y revisa antecedentes con evidencia trazable.",
  alternates: { canonical: "/demo" },
  openGraph: {
    title: "Demo de inteligencia marcaria | VIDENTIA",
    description: "Analiza una marca real con VIDENTIA usando un nombre, una imagen o ambos y revisa antecedentes con evidencia trazable.",
    url: "https://videntia.app/demo",
    siteName: "VIDENTIA",
    locale: "es_CL",
    type: "website",
  },
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<PublicLegalFooter /></>
}
