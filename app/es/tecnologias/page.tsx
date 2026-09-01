import { LocalizedTechnologiesPage, technologiesMetadata } from "@/components/localized-technologies-page"
import { PublicPlatformNav } from "@/components/public-platform-nav"

export const metadata = technologiesMetadata("es")

const technologyFocusStyles = `
.technologies-public-page a:focus-visible,
.technologies-public-page button:focus-visible {
  outline: 2px solid #96B5A6;
  outline-offset: 3px;
}
`

export default function SpanishTechnologiesPage() {
  return (
    <>
      <PublicPlatformNav active="technologies" locale="es" />
      <style>{technologyFocusStyles}</style>
      <div id="main-content" tabIndex={-1} className="technologies-public-page [&>main>nav]:hidden focus:outline-none">
        <LocalizedTechnologiesPage locale="es" />
      </div>
    </>
  )
}
