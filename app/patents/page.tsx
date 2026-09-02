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

nav[aria-label="Primary navigation"] > div {
  height: 88px !important;
}

nav[aria-label="Primary navigation"] > div > a:first-child > span:first-child {
  transform: scale(1.08);
  transform-origin: left center;
}

@media (min-width: 1024px) {
  nav[aria-label="Primary navigation"] > div > div {
    gap: 1.65rem !important;
    font-size: 11px !important;
  }
}

.patents-public-page > main > section:first-of-type {
  min-height: calc(100svh - 88px);
  display: flex;
  align-items: center;
  padding-top: 64px !important;
  padding-bottom: 72px !important;
}

.patents-public-page > main > section:first-of-type > div {
  width: 100%;
  grid-template-columns: minmax(0, .92fr) minmax(460px, 1.08fr) !important;
  gap: clamp(3rem, 6vw, 7rem) !important;
  align-items: center !important;
}

.patents-public-page > main > section:first-of-type h1 {
  max-width: 8.8ch !important;
  font-size: clamp(4.15rem, 5.55vw, 5.8rem) !important;
  line-height: .92 !important;
  letter-spacing: -.058em !important;
}

.patents-public-page > main > section:first-of-type > div > div:first-child > p:nth-of-type(2) {
  max-width: 620px !important;
  font-size: 15px !important;
  line-height: 1.85 !important;
}

.patents-public-page > main > section:first-of-type > div > div:last-child {
  position: relative;
  min-height: 620px !important;
  padding: 0 !important;
  background-color: transparent !important;
  background-image: url('/images/VidentiaPatents.svg') !important;
  background-repeat: no-repeat !important;
  background-position: 50% 42% !important;
  background-size: min(88%, 650px) auto !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

.patents-public-page > main > section:first-of-type > div > div:last-child > div:first-child {
  display: none !important;
}

.patents-public-page > main > section:first-of-type > div > div:last-child > div:last-child {
  position: absolute;
  left: 7%;
  bottom: 10px;
  max-width: 520px;
}

.patents-public-page > main > section:first-of-type > div > div:last-child > div:last-child p:last-child {
  font-size: clamp(1.35rem, 1.65vw, 1.8rem) !important;
  line-height: 1.35 !important;
}

@media (max-width: 1023px) {
  nav[aria-label="Primary navigation"] > div {
    height: 80px !important;
  }

  .patents-public-page > main > section:first-of-type {
    min-height: auto;
    padding-top: 56px !important;
    padding-bottom: 64px !important;
  }

  .patents-public-page > main > section:first-of-type > div {
    grid-template-columns: 1fr !important;
    gap: 48px !important;
  }

  .patents-public-page > main > section:first-of-type h1 {
    max-width: 10ch !important;
    font-size: clamp(3.5rem, 10vw, 5.2rem) !important;
  }

  .patents-public-page > main > section:first-of-type > div > div:last-child {
    min-height: 470px !important;
    background-position: center 38% !important;
    background-size: min(92%, 560px) auto !important;
  }

  .patents-public-page > main > section:first-of-type > div > div:last-child > div:last-child {
    left: 0;
    bottom: 0;
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
