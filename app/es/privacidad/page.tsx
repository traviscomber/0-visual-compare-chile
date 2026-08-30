import type { Metadata } from "next"
import { LocalizedLegalPage } from "@/components/localized-legal-page"

export const metadata: Metadata = { title: "Privacidad", description: "Información sobre el tratamiento de datos en VIDENTIA.", alternates: { canonical: "/es/privacidad", languages: { "es-CL": "/es/privacidad", en: "/en/privacidad" } } }
export default function SpanishPrivacyPage() { return <LocalizedLegalPage locale="es" kind="privacy" /> }
