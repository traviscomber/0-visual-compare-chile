import type { Metadata } from "next"
import { LocalizedLegalPage } from "@/components/localized-legal-page"

export const metadata: Metadata = { title: "Terms of use", description: "Terms applicable to the VIDENTIA public site and demonstration.", alternates: { canonical: "/en/terminos", languages: { "es-CL": "/es/terminos", en: "/en/terminos" } } }
export default function EnglishTermsPage() { return <LocalizedLegalPage locale="en" kind="terms" /> }
