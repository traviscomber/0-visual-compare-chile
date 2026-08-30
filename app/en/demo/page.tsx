import type { Metadata } from "next"
import { LocalizedDemoPage } from "@/components/localized-demo-page"

export const metadata: Metadata = {
  title: "Search a trademark",
  description: "Preliminary view of trademark prior rights and evidence in Chile.",
  alternates: { canonical: "/en/demo", languages: { "es-CL": "/es/demo", en: "/en/demo" } },
}

export default function EnglishDemoPage() {
  return <LocalizedDemoPage locale="en" />
}
