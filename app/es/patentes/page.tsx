import { LocalizedPatentsPage, patentsMetadata } from "@/components/localized-patents-page"
import { PublicPlatformNav } from "@/components/public-platform-nav"

export const metadata = patentsMetadata("es")

const patentPublicFixes = `
.patents-public-page a:focus-visible,
.patents-public-page button:focus-visible {
  outline: 2px solid #96B5A6;
  outline-offset: 3px;
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

export default function SpanishPatentsPage() {
  return (
    <>
      <PublicPlatformNav active="patents" locale="es" />
      <style>{patentPublicFixes}</style>
      <div id="main-content" tabIndex={-1} className="patents-public-page [&>main>nav]:hidden focus:outline-none">
        <LocalizedPatentsPage locale="es" />
      </div>
    </>
  )
}
