import type { Metadata } from "next"
import { LocalizedTechnologiesPage } from "@/components/localized-technologies-page"
import { PublicPlatformNav } from "@/components/public-platform-nav"
import { PublicStructuredData } from "@/components/public-structured-data"

const description = "Track R&D, patents, research, companies and technology signals with traceable intelligence."

export const metadata: Metadata = {
  title: "Technology & R&D Intelligence",
  description,
  alternates: {
    canonical: "/technologies",
    languages: { en: "/technologies", "es-CL": "/es/tecnologias", "x-default": "/technologies" },
  },
  openGraph: {
    title: "Technology & R&D Intelligence | VIDENTIA",
    description,
    url: "/technologies",
    siteName: "VIDENTIA",
    type: "website",
    locale: "en_US",
    alternateLocale: ["es_CL"],
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VIDENTIA Technology Intelligence" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Technology & R&D Intelligence | VIDENTIA",
    description,
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
}

export default function TechnologiesPage() {
  return (
    <>
      <PublicStructuredData page="technologies" />
      <PublicPlatformNav active="technologies" />
      <div className="[&>main>nav]:hidden">
        <LocalizedTechnologiesPage locale="en" />
      </div>
    </>
  )
}
