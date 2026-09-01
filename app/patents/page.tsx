import type { Metadata } from "next"
import { LocalizedPatentsPage } from "@/components/localized-patents-page"

export const metadata: Metadata = {
  title: "Patent Intelligence & Prior Art Research | VIDENTIA",
  description: "Research inventions, prior art and patent activity with traceable evidence and structured review.",
  alternates: {
    canonical: "/patents",
    languages: { en: "/patents", "es-CL": "/es/patentes" },
  },
  robots: { index: true, follow: true },
}

export default function PatentsPage() {
  return <LocalizedPatentsPage locale="en" />
}
