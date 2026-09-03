import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { PublicPlatformFooter } from "@/components/public-platform-footer"
import { PublicPlatformNav } from "@/components/public-platform-nav"
import { PublicStructuredData } from "@/components/public-structured-data"
import { UmbrellaHomePage } from "@/components/umbrella-home-page"
import { UmbrellaMotion } from "@/components/umbrella-motion"
import { UmbrellaPublicHero } from "@/components/umbrella-public-hero"

export const metadata: Metadata = {
  title: "VIDENTIA | Inteligencia de propiedad intelectual y tecnología",
  description: "Busca, compara y monitorea marcas, patentes y tecnologías desde una sola plataforma con evidencia trazable.",
  alternates: {
    canonical: "/es",
    languages: { "es-CL": "/es", en: "/", "x-default": "/" },
  },
  openGraph: {
    title: "VIDENTIA | Inteligencia de propiedad intelectual y tecnología",
    description: "Marcas. Patentes. Tecnologías. Investiga una vez o mantén vigilancia continua con evidencia trazable.",
    locale: "es_CL",
    alternateLocale: ["en_US"],
    url: "/es",
    siteName: "VIDENTIA",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VIDENTIA — Inteligencia de propiedad intelectual y tecnología" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VIDENTIA | Inteligencia de propiedad intelectual y tecnología",
    description: "Investiga y monitorea marcas, patentes y tecnologías con evidencia trazable.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
}

export default async function SpanishPublicPage({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params
  if (path?.length) redirect(`/${path.join("/")}`)

  return (
    <>
      <PublicStructuredData page="home-es" />
      <PublicPlatformNav active="home" locale="es" />
      <div id="main-content" tabIndex={-1} className="focus:outline-none">
        <UmbrellaPublicHero locale="es" />
        <UmbrellaHomePage locale="es" />
      </div>
      <PublicPlatformFooter locale="es" />
      <UmbrellaMotion />
    </>
  )
}
