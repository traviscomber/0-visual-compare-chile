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
  height: 80px !important;
}

@media (min-width: 1024px) {
  nav[aria-label="Primary navigation"] > div > div {
    gap: 1.5rem !important;
    font-size: 10px !important;
  }
}

.technologies-public-page > main > section:first-of-type {
  min-height: calc(100svh - 80px);
  display: flex;
  align-items: center;
  padding-top: 56px !important;
  padding-bottom: 64px !important;
}

.technologies-public-page > main > section:first-of-type > div {
  width: 100%;
  grid-template-columns: minmax(0, .9fr) minmax(500px, 1.1fr) !important;
  gap: clamp(3rem, 5vw, 6rem) !important;
  align-items: center !important;
}

.technologies-public-page > main > section:first-of-type h1 {
  max-width: 15ch !important;
  font-size: clamp(3.35rem, 4.25vw, 4.7rem) !important;
  line-height: .94 !important;
  letter-spacing: -.052em !important;
  text-wrap: balance !important;
}

.technologies-public-page > main > section:first-of-type > div > div:first-child > p:nth-of-type(2) {
  max-width: 610px !important;
  margin-top: 1.65rem !important;
  font-size: 15px !important;
  line-height: 1.75 !important;
}

.technologies-public-page > main > section:first-of-type > div > div:last-child {
  position: relative;
  min-height: 650px !important;
  padding: 0 !important;
  background-color: transparent !important;
  background-image: url('/images/VidentiaTechnologies.svg') !important;
  background-repeat: no-repeat !important;
  background-position: 50% 42% !important;
  background-size: auto min(94%, 700px) !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

.technologies-public-page > main > section:first-of-type > div > div:last-child > div:first-child {
  display: none !important;
}

.technologies-public-page > main > section:first-of-type > div > div:last-child > div:last-child {
  position: absolute;
  left: 50%;
  bottom: 8px;
  width: min(100% - 48px, 540px);
  transform: translateX(-50%);
}

.technologies-public-page > main > section:first-of-type > div > div:last-child > div:last-child p:nth-child(2) {
  font-size: clamp(1.35rem, 1.65vw, 1.9rem) !important;
  line-height: 1.35 !important;
}

@media (max-width: 1023px) {
  .technologies-public-page > main > section:first-of-type {
    min-height: auto;
    padding-top: 48px !important;
    padding-bottom: 56px !important;
  }

  .technologies-public-page > main > section:first-of-type > div {
    grid-template-columns: 1fr !important;
    gap: 36px !important;
  }

  .technologies-public-page > main > section:first-of-type h1 {
    max-width: 15ch !important;
    font-size: clamp(3rem, 8vw, 4.35rem) !important;
  }

  .technologies-public-page > main > section:first-of-type > div > div:last-child {
    min-height: 600px !important;
    background-position: center 42% !important;
    background-size: auto min(92%, 620px) !important;
  }
}

@media (max-width: 640px) {
  .technologies-public-page > main > section:first-of-type h1 {
    max-width: 13ch !important;
    font-size: clamp(2.65rem, 12.5vw, 3.65rem) !important;
  }

  .technologies-public-page > main > section:first-of-type > div > div:last-child {
    min-height: 520px !important;
    background-size: auto min(90%, 520px) !important;
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
