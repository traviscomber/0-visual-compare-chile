import { LocalizedTechnologiesPage, technologiesMetadata } from "@/components/localized-technologies-page"
import { PublicPlatformNav } from "@/components/public-platform-nav"

export const metadata = technologiesMetadata("es")

export default function SpanishTechnologiesPage() {
  return (
    <>
      <PublicPlatformNav active="technologies" locale="es" />
      <div className="[&>main>nav]:hidden">
        <LocalizedTechnologiesPage locale="es" />
      </div>
    </>
  )
}
