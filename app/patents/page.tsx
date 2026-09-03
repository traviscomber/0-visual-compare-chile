import type { Metadata } from "next"
import { LocalizedPatentsPage } from "@/components/localized-patents-page"
import { PublicPlatformNav } from "@/components/public-platform-nav"
import { PublicStructuredData } from "@/components/public-structured-data"
import { VerticalPublicHero } from "@/components/vertical-public-hero"

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
      <PublicStructuredData page="patents" />
      <PublicPlatformNav active="patents" />
      <div id="main-content" tabIndex={-1} className="patents-public-page focus:outline-none [&>main>nav]:hidden [&>main>section:first-of-type]:hidden">
        <VerticalPublicHero
          eyebrow="PATENT INTELLIGENCE"
          title="Know what exists before you invest."
          body="Search prior art, applicants, inventors and technical signals with traceable evidence before committing capital or legal strategy."
          cta="OPEN PATENT INTELLIGENCE"
          href="/en/auth/login?redirectTo=%2Fpatents"
          imageSrc="/images/VidentiaPatents.svg"
          imageAlt="VIDENTIA patent intelligence object"
          imageClassName="max-h-[610px] lg:max-h-[650px]"
        />
        <LocalizedPatentsPage locale="en" />
      </div>
    </>
  )
}
