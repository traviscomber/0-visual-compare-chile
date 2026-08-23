import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/lib/auth-context"
import "./globals.css"

function resolveMetadataBase() {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const fallbackOrigin = "http://127.0.0.1:3000"
  try { return new URL(configuredOrigin || fallbackOrigin) } catch { return new URL(fallbackOrigin) }
}

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: {
    default: "Visual Compare | Inteligencia de marcas en Chile",
    template: "%s | Visual Compare",
  },
  description: "Busca una marca por nombre, logo o fotografía y revisa antecedentes oficiales INAPI, clases Niza, señales figurativas Viena y evidencia priorizada en una experiencia simple y trazable.",
  applicationName: "Visual Compare",
  keywords: ["marcas Chile", "INAPI", "búsqueda de marcas", "propiedad industrial", "Niza", "Viena", "trademark intelligence"],
  openGraph: {
    title: "Visual Compare | Buscar una marca debería ser fácil",
    description: "De un logo o nombre a antecedentes INAPI priorizados, con evidencia visible y análisis asistido.",
    type: "website",
    locale: "es_CL",
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body className="bg-slate-950 font-sans text-foreground antialiased"><AuthProvider>{children}</AuthProvider><Toaster richColors position="top-right" />{process.env.NODE_ENV === "production" && <Analytics />}</body></html>
}
