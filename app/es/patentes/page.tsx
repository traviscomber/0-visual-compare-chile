import { LocalizedPatentsPage, patentsMetadata } from "@/components/localized-patents-page"
import { PublicPlatformNav } from "@/components/public-platform-nav"

export const metadata = patentsMetadata("es")

export default function SpanishPatentsPage() {
  return (
    <>
      <PublicPlatformNav active="patents" locale="es" />
      <div className="[&>main>nav]:hidden">
        <LocalizedPatentsPage locale="es" />
      </div>
    </>
  )
}
