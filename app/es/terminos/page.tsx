import type { Metadata } from "next"
import { LocalizedLegalPage } from "@/components/localized-legal-page"

export const metadata: Metadata = { title: "Términos de uso", description: "Términos aplicables al sitio y a la demostración pública de VIDENTIA.", alternates: { canonical: "/es/terminos", languages: { "es-CL": "/es/terminos", en: "/en/terminos" } } }
export default function SpanishTermsPage() { return <LocalizedLegalPage locale="es" kind="terms" /> }
