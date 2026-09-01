import type { Metadata } from "next"
import { LocalizedLandingPage } from "@/components/locked-trademark-landing"

export const metadata: Metadata = {
  title: "Trademark Intelligence | VIDENTIA",
  description: "Search, compare, protect and monitor brands with traceable trademark intelligence.",
  alternates: {
    canonical: "/trademarks",
    languages: { en: "/trademarks", "es-CL": "/es" },
  },
  robots: { index: true, follow: true },
}

export default function TrademarksPage() {
  return <LocalizedLandingPage locale="en" />
}
