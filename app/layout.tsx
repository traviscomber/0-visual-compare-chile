import type React from "react"
import type { Metadata, Viewport } from "next"
import { headers } from "next/headers"
import { Montserrat } from "next/font/google"
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
const CANONICAL_ORIGIN = "https://videntia.app"
const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim()

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_ORIGIN),
  title: {
    default: "VIDENTIA — IP & Technology Intelligence",
    template: "%s | VIDENTIA",
  },
  description: "Research and continuously monitor trademarks, patents and technologies with traceable evidence, official-source context and explicit separation between evidence, analysis and professional conclusions.",
  applicationName: "VIDENTIA",
  keywords: [
    "VIDENTIA",
    "IP intelligence",
    "technology intelligence",
    "trademark intelligence",
    "patent intelligence",
    "prior art research",
    "technology monitoring",
    "competitive intelligence",
    "propiedad intelectual Chile",
    "inteligencia tecnológica",
    "inteligencia competitiva",
    "marcas Chile",
    "patentes Chile",
    "INAPI marcas",
    "INAPI patentes",
    "vigilancia de marcas",
    "vigilancia tecnológica",
    "clases Niza",
    "clasificación de Viena",
    "IPC patentes",
    "TDPI",
  ],
  authors: [{ name: "N3uralia", url: "https://www.n3uralia.com" }],
  creator: "N3uralia",
  publisher: "N3uralia",
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], shortcut: "/icon.svg" },
  manifest: "/manifest.webmanifest",
  verification: GOOGLE_SITE_VERIFICATION ? { google: GOOGLE_SITE_VERIFICATION } : undefined,
  openGraph: {
    title: "VIDENTIA — IP & Technology Intelligence",
    description: "Research and monitor trademarks, patents and technologies with traceable evidence.",
    url: CANONICAL_ORIGIN,
    siteName: "VIDENTIA",
    type: "website",
    locale: "en_US",
    alternateLocale: ["es_CL"],
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VIDENTIA — IP & Technology Intelligence" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VIDENTIA — IP & Technology Intelligence",
    description: "Research and monitor trademarks, patents and technologies with traceable evidence.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
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

  return <html lang={locale}><body className={`${montserrat.className} ${montserrat.variable} bg-[#0F2A33] text-foreground antialiased`}><AuthProvider>{children}</AuthProvider><VidentiaAnalytics /><Toaster richColors position="top-right" /></body></html>
}
