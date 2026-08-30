import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { LocalizedLandingPage } from "@/components/localized-landing-page"

export const metadata: Metadata = {
  title: "VIDENTIA | Trademark intelligence and protection",
  description: "Research prior rights, monitor changes and manage trademarks with traceable evidence.",
  alternates: {
    canonical: "/en",
    languages: { "es-CL": "/es", "en": "/en" },
  },
  openGraph: { locale: "en_US", url: "/en" },
}

export default async function EnglishPublicPage({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params
  if (path?.length) redirect(`/${path.join("/")}`)
  return <LocalizedLandingPage locale="en" />
}
