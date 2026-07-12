import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/lib/auth-context"
import "./globals.css"

function resolveMetadataBase() {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const fallbackOrigin = "http://127.0.0.1:3000"

  try {
    return new URL(configuredOrigin || fallbackOrigin)
  } catch {
    return new URL(fallbackOrigin)
  }
}

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: "Visual Compare Chile | Comparacion visual de marcas",
  description:
    "MVP operativo para comparacion visual de marcas con upload, historial, consulta y trazabilidad sobre Supabase y Vercel.",
  applicationName: "Visual Compare Chile",
  generator: "Codex",
}

export const viewport: Viewport = {
  themeColor: "#0F766E",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className="bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 font-sans text-foreground antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Toaster richColors position="top-right" />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
