import type { Metadata } from "next"
import { LocalizedLegalPage } from "@/components/localized-legal-page"

export const metadata: Metadata = { title: "Privacy", description: "Information about data processing in VIDENTIA.", alternates: { canonical: "/en/privacidad", languages: { "es-CL": "/es/privacidad", en: "/en/privacidad" } } }
export default function EnglishPrivacyPage() { return <LocalizedLegalPage locale="en" kind="privacy" /> }
