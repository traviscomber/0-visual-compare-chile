import type { Metadata } from "next"
import { LocalizedDocsPage } from "@/components/localized-docs-page"

export const metadata: Metadata = { title: "API empresarial", description: "Documentación técnica de VIDENTIA para integraciones empresariales.", alternates: { canonical: "/es/docs", languages: { "es-CL": "/es/docs", en: "/en/docs" } } }
export default function SpanishDocsPage() { return <LocalizedDocsPage locale="es" /> }
