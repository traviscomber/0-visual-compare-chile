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
  height: 80px !important;
}

@media (min-width: 1024px) {
  nav[aria-label="Primary navigation"] > div > div {
    gap: 1.5rem !important;
    font-size: 10px !important;
  }
}

.patents-public-page > main > section:first-of-type {
  min-height: calc(100svh - 80px);
  display: flex;
  align-items: center;
  padding-top: 56px !important;
  padding-bottom: 64px !important;
}

.patents-public-page > main > section:first-of-type > div {
  width: 100%;
  grid-template-columns: minmax(0, .88fr) minmax(520px, 1.12fr) !important;
  gap: clamp(3rem, 5vw, 6rem) !important;
  align-items: center !important;
}

/* Cap headline height. On laptop/desktop this should read as 3–4 lines, never 6–7. */
.patents-public-page > main > section:first-of-type h1 {
  max-width: 15ch !important;
  font-size: clamp(3.35rem, 4.35vw, 4.75rem) !important;
  line-height: .94 !important;
  letter-spacing: -.052em !important;
  text-wrap: balance !important;
}

.patents-public-page > main > section:first-of-type > div > div:first-child > p:nth-of-type(2) {
  max-width: 610px !important;
  margin-top: 1.65rem !important;
  font-size: 15px !important;
  line-height: 1.75 !important;
}

.patents-public-page > main > section:first-of-type > div > div:last-child {
  position: relative;
  min-height: 590px !important;
  padding: 0 !important;
  background-color: transparent !important;
  background-image: url('/images/VidentiaPatents.svg') !important;
  background-repeat: no-repeat !important;
  background-position: 50% 38% !important;
  background-size: min(92%, 620px) auto !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

.patents-public-page > main > section:first-of-type > div > div:last-child > div:first-child {
  display: none !important;
}

.patents-public-page > main > section:first-of-type > div > div:last-child > div:last-child {
  position: absolute;
  left: 50%;
  bottom: 8px;
  width: min(100% - 48px, 540px);
  transform: translateX(-50%);
}

.patents-public-page > main > section:first-of-type > div > div:last-child > div:last-child p:first-child {
  font-size: 9px !important;
  letter-spacing: .14em !important;
}

.patents-public-page > main > section:first-of-type > div > div:last-child > div:last-child p:last-child {
  margin-top: .7rem !important;
  max-width: 30rem !important;
  font-size: clamp(1.2rem, 1.45vw, 1.55rem) !important;
  line-height: 1.35 !important;
}

@media (max-width: 1023px) {
  .patents-public-page > main > section:first-of-type {
    min-height: auto;
    padding-top: 48px !important;
    padding-bottom: 56px !important;
  }

  .patents-public-page > main > section:first-of-type > div {
    grid-template-columns: 1fr !important;
    gap: 36px !important;
  }

  .patents-public-page > main > section:first-of-type h1 {
    max-width: 15ch !important;
    font-size: clamp(3rem, 8vw, 4.4rem) !important;
  }

  .patents-public-page > main > section:first-of-type > div > div:last-child {
    min-height: 500px !important;
    background-position: center 38% !important;
    background-size: min(82vw, 520px) auto !important;
  }
}

@media (max-width: 640px) {
  .patents-public-page > main > section:first-of-type h1 {
    max-width: 13ch !important;
    font-size: clamp(2.65rem, 12.5vw, 3.65rem) !important;
  }

  .patents-public-page > main > section:first-of-type > div > div:last-child {
    min-height: 420px !important;
    background-size: min(84vw, 390px) auto !important;
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
