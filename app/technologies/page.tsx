import type { Metadata } from "next"
import { LocalizedTechnologiesPage } from "@/components/localized-technologies-page"

export const metadata: Metadata = {
  title: "Technology & R&D Intelligence | VIDENTIA",
  description: "Track R&D, patents, research, companies and technology signals with traceable intelligence.",
  alternates: {
    canonical: "/technologies",
    languages: { en: "/technologies", "es-CL": "/es/tecnologias" },
  },
  robots: { index: true, follow: true },
}

export default function TechnologiesPage() {
  return <LocalizedTechnologiesPage locale="en" />
}
