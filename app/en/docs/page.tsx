import type { Metadata } from "next"
import { LocalizedDocsPage } from "@/components/localized-docs-page"

export const metadata: Metadata = { title: "Enterprise API", description: "VIDENTIA technical documentation for enterprise integrations.", alternates: { canonical: "/en/docs", languages: { "es-CL": "/es/docs", en: "/en/docs" } } }
export default function EnglishDocsPage() { return <LocalizedDocsPage locale="en" /> }
