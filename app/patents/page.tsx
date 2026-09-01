import type { Metadata } from "next"
import { LocalizedPatentsPage } from "@/components/localized-patents-page"
import { PublicPlatformNav } from "@/components/public-platform-nav"

const description = "Research inventions, prior art and patent activity with traceable evidence and structured review."

export const metadata: Metadata = {
  title: "Patent Intelligence & Prior Art Research",
  description,
  alternates: {
    canonical: "/patents",
    languages: { en: "/patents", "es-CL": "/es/patentes", "x-default": "/patents" },
  },
  openGraph: {
    title: "Patent Intelligence & Prior Art Research | VIDENTIA",
    description,
    url: "/patents",
    siteName: "VIDENTIA",
    type: "website",
    locale: "en_US",
    alternateLocale: ["es_CL"],
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VIDENTIA Patent Intelligence" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Patent Intelligence & Prior Art Research | VIDENTIA",
    description,
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
}

export default function PatentsPage() {
  return (
    <>
      <PublicPlatformNav active="patents" />
      <div className="[&>main>nav]:hidden">
        <LocalizedPatentsPage locale="en" />
      </div>
    </>
  )
}
