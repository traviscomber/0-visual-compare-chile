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

.technologies-public-page > main > section:first-of-type {
  min-height: calc(100svh - 88px);
  display: flex;
  align-items: center;
  padding-top: 64px !important;
  padding-bottom: 72px !important;
}

.technologies-public-page > main > section:first-of-type > div {
  width: 100%;
  grid-template-columns: minmax(0, .92fr) minmax(460px, 1.08fr) !important;
  gap: clamp(3rem, 6vw, 7rem) !important;
  align-items: center !important;
}

.technologies-public-page > main > section:first-of-type h1 {
  max-width: 8.9ch !important;
  font-size: clamp(4.15rem, 5.45vw, 5.75rem) !important;
  line-height: .92 !important;
  letter-spacing: -.058em !important;
}

.technologies-public-page > main > section:first-of-type > div > div:first-child > p:nth-of-type(2) {
  max-width: 620px !important;
  font-size: 15px !important;
  line-height: 1.85 !important;
}

.technologies-public-page > main > section:first-of-type > div > div:last-child {
  position: relative;
  min-height: 620px !important;
  padding: 0 !important;
  background-color: transparent !important;
  background-image: url('/images/VidentiaTechnologies.svg') !important;
  background-repeat: no-repeat !important;
  background-position: 50% 42% !important;
  background-size: auto min(86%, 590px) !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

.technologies-public-page > main > section:first-of-type > div > div:last-child > div:first-child {
  display: none !important;
}

.technologies-public-page > main > section:first-of-type > div > div:last-child > div:last-child {
  position: absolute;
  left: 7%;
  bottom: 10px;
  max-width: 520px;
}

.technologies-public-page > main > section:first-of-type > div > div:last-child > div:last-child p:nth-child(2) {
  font-size: clamp(1.7rem, 2vw, 2.35rem) !important;
}

@media (max-width: 1023px) {
  nav[aria-label="Primary navigation"] > div {
    height: 80px !important;
  }

  .technologies-public-page > main > section:first-of-type {
    min-height: auto;
    padding-top: 56px !important;
    padding-bottom: 64px !important;
  }

  .technologies-public-page > main > section:first-of-type > div {
    grid-template-columns: 1fr !important;
    gap: 48px !important;
  }

  .technologies-public-page > main > section:first-of-type h1 {
    max-width: 10ch !important;
    font-size: clamp(3.5rem, 10vw, 5.2rem) !important;
  }

  .technologies-public-page > main > section:first-of-type > div > div:last-child {
    min-height: 470px !important;
    background-position: center 38% !important;
    background-size: auto min(84%, 510px) !important;
  }

  .technologies-public-page > main > section:first-of-type > div > div:last-child > div:last-child {
    left: 0;
    bottom: 0;
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
