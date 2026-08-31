import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { LocalizedLandingPage } from "@/components/localized-landing-page"

export const metadata: Metadata = {
  title: "VIDENTIA | Inteligencia de propiedad intelectual y tecnología",
  description: "Busca, compara y monitorea marcas, patentes y tecnologías desde una sola plataforma con evidencia trazable.",
  alternates: {
    canonical: "/es",
    languages: { "es-CL": "/es", "en": "/en" },
  },
  openGraph: {
    title: "VIDENTIA | Inteligencia de propiedad intelectual y tecnología",
    description: "Marcas. Patentes. Tecnologías. Busca una vez o mantén vigilancia continua con evidencia trazable.",
    locale: "es_CL",
    url: "/es",
  },
}

export default async function SpanishPublicPage({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params
  if (path?.length) redirect(`/${path.join("/")}`)
  return <LocalizedLandingPage locale="es" />
}
