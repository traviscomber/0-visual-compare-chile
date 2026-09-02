import type { Metadata } from "next"
import { LocalizedPatentsPage } from "@/components/localized-patents-page"
import { PublicPlatformNav } from "@/components/public-platform-nav"
import { PublicStructuredData } from "@/components/public-structured-data"

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

const patentPublicFixes = `
.patents-public-page a:focus-visible,
.patents-public-page button:focus-visible {
  outline: 2px solid #96B5A6;
  outline-offset: 3px;
}

.patents-public-page > main > section:first-of-type > div > div:last-child {
  background-color: #091A20;
  background-image: url('/images/VidentiaPatents.svg');
  background-repeat: no-repeat;
  background-position: center 34%;
  background-size: min(42%, 360px) auto;
}

.patents-public-page > main > section:first-of-type > div > div:last-child > div:first-child {
  opacity: 0;
}

@media (max-width: 1023px) {
  .patents-public-page > main > section:first-of-type > div > div:last-child {
    background-position: center 30%;
    background-size: min(48%, 300px) auto;
  }
}

@media (min-width: 1024px) {
  .patents-public-page > main > section:nth-of-type(6) > div {
    grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  }

  .patents-public-page > main > section:nth-of-type(6) > div > div:first-child {
    min-width: 0;
    padding-right: 1rem;
  }

  .patents-public-page > main > section:nth-of-type(6) > div > div:first-child > h2 {
    max-width: 12ch;
    font-size: clamp(2.75rem, 4.15vw, 4.45rem);
    line-height: 0.98;
  }
}
`

export default function PatentsPage() {
  return (
    <>
      <PublicStructuredData page="patents" />
      <PublicPlatformNav active="patents" />
      <style>{patentPublicFixes}</style>
      <div id="main-content" tabIndex={-1} className="patents-public-page [&>main>nav]:hidden focus:outline-none">
        <LocalizedPatentsPage locale="en" />
      </div>
    </>
  )
}
