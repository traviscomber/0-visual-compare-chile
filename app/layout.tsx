import type { Metadata, Viewport } from "next"
import { Montserrat, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/lib/auth-context"
import "./globals.css"

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700", "800"],
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-code",
})

export const metadata: Metadata = {
  title: "Sistema de Marcas Registradas — Comparación de Logos y Consulta",
  description:
    "Plataforma para comparación visual de logos, consulta de marcas registradas (INAPI), clasificaciones Niza y Viena. Demo Fase 0.",
  generator: "v0.app",
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
    <html lang="es" className={`${montserrat.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 font-sans text-foreground antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster richColors position="top-right" />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}

