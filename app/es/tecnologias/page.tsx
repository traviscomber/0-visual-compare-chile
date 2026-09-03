import { LocalizedTechnologiesPage, technologiesMetadata } from "@/components/localized-technologies-page"
import { PublicPlatformFooter } from "@/components/public-platform-footer"
import { PublicPlatformNav } from "@/components/public-platform-nav"
import { PublicStructuredData } from "@/components/public-structured-data"
import { PublicSurfaceMotion } from "@/components/public-surface-motion"
import { TechnologyMotion } from "@/components/technology-motion"
import { VerticalPublicHero } from "@/components/vertical-public-hero"

export const metadata = technologiesMetadata("es")

export default function SpanishTechnologiesPage() {
  return (
    <>
      <PublicStructuredData page="technologies-es" />
      <PublicPlatformNav active="technologies" locale="es" />
      <div id="main-content" data-public-surface tabIndex={-1} className="technologies-public-page focus:outline-none">
        <PublicSurfaceMotion variant="technologies" />
        <TechnologyMotion />
        <VerticalPublicHero
          eyebrow="INTELIGENCIA TECNOLÓGICA"
          title="Mira hacia dónde se mueve la tecnología."
          body="Conecta investigación, actividad de patentes, empresas y señales públicas para entender la dirección antes de que el mercado la haga evidente."
          cta="ABRIR INTELIGENCIA TECNOLÓGICA"
          href="/es/auth/login?redirectTo=%2Fes%2Ftecnologias"
          imageSrc="/images/VidentiaTechnologies.svg"
          imageAlt="Objeto de inteligencia tecnológica VIDENTIA"
          imageClassName="max-h-[660px] lg:max-h-[720px]"
        />
        <LocalizedTechnologiesPage locale="es" showChrome={false} />
      </div>
      <PublicPlatformFooter locale="es" />
    </>
  )
}
