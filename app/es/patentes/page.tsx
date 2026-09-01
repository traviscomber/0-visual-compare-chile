import { LocalizedPatentsPage, patentsMetadata } from "@/components/localized-patents-page"
import { PublicPlatformNav } from "@/components/public-platform-nav"

export const metadata = patentsMetadata("es")

const patentReportLayoutFix = `
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
      <style>{patentReportLayoutFix}</style>
      <div className="patents-public-page [&>main>nav]:hidden">
        <LocalizedPatentsPage locale="es" />
      </div>
    </>
  )
}
