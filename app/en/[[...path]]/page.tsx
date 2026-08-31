import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { LocalizedLandingPage } from "@/components/localized-landing-page"

export const metadata: Metadata = {
  title: "VIDENTIA | Intellectual property and technology intelligence",
  description: "Search, compare and monitor brands, patents and technologies from one intelligence platform with traceable evidence.",
  alternates: {
    canonical: "/en",
    languages: { "es-CL": "/es", "en": "/en" },
  },
  openGraph: {
    title: "VIDENTIA | Intellectual property and technology intelligence",
    description: "Brands. Patents. Technologies. Search once—or keep watching with traceable evidence.",
    locale: "en_US",
    url: "/en",
  },
}

export default async function EnglishPublicPage({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params
  if (path?.length) redirect(`/${path.join("/")}`)
  return <LocalizedLandingPage locale="en" />
}
