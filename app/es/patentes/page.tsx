import { LocalizedPatentsPage, patentsMetadata } from "@/components/localized-patents-page"
import { PublicPlatformNav } from "@/components/public-platform-nav"
import { PublicSurfaceMotion } from "@/components/public-surface-motion"
import { VerticalPublicHero } from "@/components/vertical-public-hero"

export const metadata = patentsMetadata("es")

export default function SpanishPatentsPage() {
  return (
    <>
      <PublicPlatformNav active="patents" locale="es" />
      <div id="main-content" data-public-surface tabIndex={-1} className="patents-public-page focus:outline-none">
        <PublicSurfaceMotion variant="patents" />
        <VerticalPublicHero
          eyebrow="INTELIGENCIA DE PATENTES"
          title="Conoce lo que existe antes de invertir."
          body="Busca arte previo, solicitantes, inventores y señales técnicas con evidencia trazable antes de comprometer capital o estrategia legal."
          cta="ABRIR INTELIGENCIA DE PATENTES"
          href="/es/auth/login?redirectTo=%2Fes%2Fpatentes"
          imageSrc="/images/VidentiaPatents.svg"
          imageAlt="Objeto de inteligencia de patentes VIDENTIA"
          imageClassName="max-h-[610px] lg:max-h-[650px]"
        />
        <LocalizedPatentsPage locale="es" showChrome={false} />
      </div>
    </>
  )
}
