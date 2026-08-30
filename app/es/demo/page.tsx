import type { Metadata } from "next"
import { LocalizedDemoPage } from "@/components/localized-demo-page"

export const metadata: Metadata = {
  title: "Buscar una marca",
  description: "Vista preliminar de antecedentes y evidencia marcaria en Chile.",
  alternates: { canonical: "/es/demo", languages: { "es-CL": "/es/demo", en: "/en/demo" } },
}

export default function SpanishDemoPage() {
  return <LocalizedDemoPage locale="es" />
}
