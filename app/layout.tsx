import type React from "react"
import type { Metadata, Viewport } from "next"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/lib/auth-context"
import "./globals.css"

const CANONICAL_ORIGIN = "https://videntia.app"

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_ORIGIN),
  title: {
    default: "VIDENTIA | Inteligencia marcaria para Chile",
    template: "%s | VIDENTIA",
  },
  description: "VIDENTIA ayuda a investigar, evaluar y vigilar marcas en Chile con antecedentes INAPI, clases Niza, señales figurativas Viena, jurisprudencia TDPI y contexto verificable del titular.",
  applicationName: "VIDENTIA",
  keywords: ["VIDENTIA", "marcas Chile", "búsqueda de marcas Chile", "INAPI marcas", "registro de marca Chile", "vigilancia de marcas", "propiedad industrial Chile", "clases Niza", "clasificación de Viena", "TDPI", "jurisprudencia de marcas", "inteligencia marcaria"],
  authors: [{ name: "N3uralia", url: "https://www.n3uralia.com" }],
  creator: "N3uralia",
  publisher: "N3uralia",
  alternates: { canonical: "/", languages: { "es-CL": "/" } },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], shortcut: "/icon.svg" },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "VIDENTIA | Inteligencia marcaria para Chile",
    description: "Investiga, entiende y vigila marcas en Chile con evidencia oficial, señales explicables y contexto verificable.",
    url: CANONICAL_ORIGIN,
    siteName: "VIDENTIA",
    type: "website",
    locale: "es_CL",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VIDENTIA — Inteligencia marcaria para Chile" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VIDENTIA | Inteligencia marcaria para Chile",
    description: "Investiga, entiende y vigila marcas en Chile con evidencia oficial y contexto verificable.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  category: "legal technology",
}

export const viewport: Viewport = {
  themeColor: "#F7F8F6",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-CL"><body className="bg-background font-sans text-foreground antialiased"><AuthProvider>{children}</AuthProvider><Toaster richColors position="top-right" /></body></html>
}
