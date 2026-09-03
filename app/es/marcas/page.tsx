import type { Metadata } from "next"
import { LocalizedLandingPage } from "@/components/locked-trademark-landing"
import { PublicPlatformFooter } from "@/components/public-platform-footer"
import { PublicPlatformNav } from "@/components/public-platform-nav"
import { PublicStructuredData } from "@/components/public-structured-data"
import { PublicSurfaceMotion } from "@/components/public-surface-motion"
import { VerticalPublicHero } from "@/components/vertical-public-hero"

const description = "Busca, compara, protege y monitorea marcas con inteligencia marcaria trazable."

export const metadata: Metadata = {
  title: "Inteligencia de marcas",
  description,
  alternates: { canonical: "/es/marcas", languages: { "es-CL": "/es/marcas", en: "/trademarks", "x-default": "/trademarks" } },
  openGraph: { title: "Inteligencia de marcas | VIDENTIA", description, url: "/es/marcas", siteName: "VIDENTIA", type: "website", locale: "es_CL", alternateLocale: ["en_US"], images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VIDENTIA — Inteligencia de marcas" }] },
  twitter: { card: "summary_large_image", title: "Inteligencia de marcas | VIDENTIA", description, images: ["/opengraph-image"] },
  robots: { index: true, follow: true },
}

export default function SpanishTrademarksPage() {
  return (
    <>
      <PublicStructuredData page="trademarks-es" />
      <PublicPlatformNav active="trademarks" locale="es" />
      <div id="main-content" data-public-surface tabIndex={-1} className="trademarks-public-page focus:outline-none">
        <PublicSurfaceMotion variant="trademarks" />
        <VerticalPublicHero
          eyebrow="INTELIGENCIA DE MARCAS"
          title="Conoce el panorama de marca antes de presentar."
          body="Busca marcas, clases, titulares y señales de conflicto con evidencia trazable antes de presentar, expandir o monitorear una marca."
          cta="ABRIR INTELIGENCIA DE MARCAS"
          href="/es/auth/login?redirectTo=%2Fes%2Fmarcas"
          imageSrc="/images/VidentiaTrademarks.svg"
          imageAlt="Objeto de inteligencia de marcas VIDENTIA"
          imageClassName="max-h-[610px] lg:max-h-[670px]"
        />
        <LocalizedLandingPage locale="es" showChrome={false} />
      </div>
      <PublicPlatformFooter locale="es" />
    </>
  )
}
