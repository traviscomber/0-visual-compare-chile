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
  height: 78px !important;
}

@media (min-width: 1024px) {
  nav[aria-label="Primary navigation"] > div > div {
    gap: 1.35rem !important;
    font-size: 10px !important;
  }
}

.patents-public-page > main > section:first-of-type {
  min-height: calc(100svh - 78px);
  display: flex;
  align-items: center;
  padding-top: 44px !important;
  padding-bottom: 52px !important;
}

.patents-public-page > main > section:first-of-type > div {
  width: 100%;
  grid-template-columns: minmax(0, .96fr) minmax(500px, 1.04fr) !important;
  gap: clamp(2.5rem, 4.5vw, 5.25rem) !important;
  align-items: center !important;
}

.patents-public-page > main > section:first-of-type h1 {
  max-width: 17ch !important;
  font-size: clamp(3.25rem, 4vw, 4.4rem) !important;
  line-height: .96 !important;
  letter-spacing: -.048em !important;
  text-wrap: balance !important;
}

.patents-public-page > main > section:first-of-type > div > div:first-child > p:nth-of-type(2) {
  max-width: 590px !important;
  margin-top: 1.5rem !important;
  font-size: 15px !important;
  line-height: 1.72 !important;
}

.patents-public-page > main > section:first-of-type > div > div:first-child > div:last-child {
  margin-top: 1.75rem !important;
}

.patents-public-page > main > section:first-of-type > div > div:last-child {
  position: relative;
  min-height: 560px !important;
  padding: 0 !important;
  background-color: transparent !important;
  background-image: url('/images/VidentiaPatents.svg') !important;
  background-repeat: no-repeat !important;
  background-position: 50% 38% !important;
  background-size: min(94%, 660px) auto !important;
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
  bottom: 0;
  width: min(100% - 56px, 500px);
  transform: translateX(-50%);
}

.patents-public-page > main > section:first-of-type > div > div:last-child > div:last-child p:first-child {
  font-size: 8px !important;
  letter-spacing: .15em !important;
}

.patents-public-page > main > section:first-of-type > div > div:last-child > div:last-child p:last-child {
  margin-top: .6rem !important;
  max-width: 29rem !important;
  font-size: clamp(1.08rem, 1.25vw, 1.35rem) !important;
  line-height: 1.38 !important;
}

@media (max-width: 1023px) {
  .patents-public-page > main > section:first-of-type {
    min-height: auto;
    padding-top: 42px !important;
    padding-bottom: 48px !important;
  }

  .patents-public-page > main > section:first-of-type > div {
    grid-template-columns: 1fr !important;
    gap: 28px !important;
  }

  .patents-public-page > main > section:first-of-type h1 {
    max-width: 17ch !important;
    font-size: clamp(2.95rem, 7.5vw, 4.15rem) !important;
  }

  .patents-public-page > main > section:first-of-type > div > div:last-child {
    min-height: 460px !important;
    background-position: center 35% !important;
    background-size: min(78vw, 500px) auto !important;
  }
}

@media (max-width: 640px) {
  .patents-public-page > main > section:first-of-type h1 {
    max-width: 15ch !important;
    font-size: clamp(2.55rem, 11vw, 3.35rem) !important;
  }

  .patents-public-page > main > section:first-of-type > div > div:last-child {
    min-height: 380px !important;
    background-size: min(82vw, 350px) auto !important;
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
