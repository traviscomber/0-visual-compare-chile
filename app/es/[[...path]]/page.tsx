import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { LocalizedLandingPage } from "@/components/localized-landing-page"
import { PublicPlatformFooter } from "@/components/public-platform-footer"
import { PublicStructuredData } from "@/components/public-structured-data"

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
      <a href="#main-content" className="fixed left-3 top-3 z-[70] -translate-y-24 bg-[#E7DFCE] px-4 py-3 text-[10px] font-medium tracking-[0.08em] text-[#091A20] transition-transform focus:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#091A20]">SALTAR AL CONTENIDO</a>
      <div id="main-content" tabIndex={-1} className="focus:outline-none">
        <LocalizedLandingPage locale="es" />
      </div>
      <PublicPlatformFooter locale="es" />
    </>
  )
}
