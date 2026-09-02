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

const technologyFocusStyles = `
.technologies-public-page a:focus-visible,
.technologies-public-page button:focus-visible {
  outline: 2px solid #96B5A6;
  outline-offset: 3px;
}

.technologies-public-page > main > section:first-of-type > div > div:last-child {
  background-color: #091A20;
  background-image: url('/images/VidentiaTechnologies.svg');
  background-repeat: no-repeat;
  background-position: center 44%;
  background-size: auto min(68%, 390px);
}

.technologies-public-page > main > section:first-of-type > div > div:last-child > div:first-child {
  opacity: 0;
}

@media (max-width: 1023px) {
  .technologies-public-page > main > section:first-of-type > div > div:last-child {
    background-position: center 42%;
    background-size: auto min(66%, 350px);
  }
}
`

export default function TechnologiesPage() {
  return (
    <>
      <PublicStructuredData page="technologies" />
      <PublicPlatformNav active="technologies" />
      <style>{technologyFocusStyles}</style>
      <div id="main-content" tabIndex={-1} className="technologies-public-page [&>main>nav]:hidden focus:outline-none">
        <LocalizedTechnologiesPage locale="en" />
      </div>
    </>
  )
}
