import type { MetadataRoute } from "next"

const PRIVATE_OR_LEGACY_PATHS = [
  "/api/",
  "/auth/",
  "/admin",
  "/agente",
  "/casos",
  "/compare",
  "/comparisons",
  "/consulta-inapi",
  "/dashboard",
  "/evaluar",
  "/history",
  "/investigar",
  "/monitorear",
  "/notificaciones",
  "/portfolio",
  "/reportes",
  "/settings",
  "/panel",
  "/consulta",
  "/comparador",
  "/brandbook",
  "/casos-de-uso",
  "/en",
  "/es",
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: PRIVATE_OR_LEGACY_PATHS }],
    sitemap: "https://videntia.app/sitemap.xml",
    host: "https://videntia.app",
  }
}
