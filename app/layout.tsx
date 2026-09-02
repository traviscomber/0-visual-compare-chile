import type React from "react"
import type { Metadata, Viewport } from "next"
import { headers } from "next/headers"
import { Inter, Montserrat } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { VidentiaAnalytics } from "@/components/videntia-analytics"
import { AuthProvider } from "@/lib/auth-context"
import "./globals.css"
import "./home-premium.css"
import "./landing-progressive-reveal.css"
import "./videntia-foundation.css"
import "./landing-hero-polish.css"
import "./landing-principles-polish.css"
import "./landing-process-polish.css"
import "./landing-capabilities-polish.css"
import "./landing-audience-polish.css"
import "./landing-protection-polish.css"
import "./landing-final-cta-polish.css"
import "./landing-footer-polish.css"
import "./landing-nav-polish.css"
import "./demo-premium.css"
import "./demo-results-polish.css"

const montserrat = Montserrat({ subsets: ["latin"], display: "swap", variable: "--font-montserrat" })
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter", weight: ["300", "400", "500"] })
const CANONICAL_ORIGIN = "https://videntia.app"
const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim()

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_ORIGIN),
  title: {
    default: "VIDENTIA | Inteligencia de propiedad intelectual y tecnología",
    template: "%s | VIDENTIA",
  },
  description: "Vigila marcas, patentes, empresas y tecnologías en Chile con fuentes oficiales, evidencia trazable e inteligencia competitiva para detectar riesgos y oportunidades.",
  applicationName: "VIDENTIA",
  keywords: ["VIDENTIA", "propiedad intelectual Chile", "inteligencia tecnológica", "inteligencia competitiva", "marcas Chile", "patentes Chile", "INAPI marcas", "INAPI patentes", "vigilancia de marcas", "vigilancia tecnológica", "clases Niza", "clasificación de Viena", "IPC patentes", "TDPI"],
  authors: [{ name: "N3uralia", url: "https://www.n3uralia.com" }],
  creator: "N3uralia",
  publisher: "N3uralia",
  alternates: { canonical: "/es", languages: { "es-CL": "/es", "en": "/en" } },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], shortcut: "/icon.svg" },
  manifest: "/manifest.webmanifest",
  verification: GOOGLE_SITE_VERIFICATION ? { google: GOOGLE_SITE_VERIFICATION } : undefined,
  openGraph: {
    title: "VIDENTIA | Inteligencia de propiedad intelectual y tecnología",
    description: "Vigila marcas, patentes, empresas y tecnologías con evidencia trazable para detectar cambios, riesgos y oportunidades.",
    url: `${CANONICAL_ORIGIN}/es`,
    siteName: "VIDENTIA",
    type: "website",
    locale: "es_CL",
    alternateLocale: ["en_US"],
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VIDENTIA — Inteligencia de propiedad intelectual y tecnología" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VIDENTIA | Inteligencia de propiedad intelectual y tecnología",
    description: "Vigila marcas, patentes, empresas y tecnologías con evidencia trazable para detectar cambios, riesgos y oportunidades.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  category: "legal technology",
}

export const viewport: Viewport = {
  themeColor: "#0F2A33",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers()
  const locale = requestHeaders.get("x-videntia-locale") === "en" ? "en" : "es-CL"

  return <html lang={locale}><body className={`${montserrat.className} ${montserrat.variable} ${inter.variable} bg-[#0F2A33] text-foreground antialiased`}><AuthProvider>{children}</AuthProvider><VidentiaAnalytics /><Toaster richColors position="top-right" /></body></html>
}
