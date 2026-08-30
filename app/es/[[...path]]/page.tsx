import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { LocalizedLandingPage } from "@/components/localized-landing-page"

export const metadata: Metadata = {
  title: "VIDENTIA | Inteligencia y protección de marcas",
  description: "Investiga antecedentes, registra, vigila y administra tus marcas con evidencia trazable.",
  alternates: {
    canonical: "/es",
    languages: { "es-CL": "/es", "en": "/en" },
  },
  openGraph: { locale: "es_CL", url: "/es" },
}

export default async function SpanishPublicPage({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params
  if (path?.length) redirect(`/${path.join("/")}`)
  return <LocalizedLandingPage locale="es" />
}
