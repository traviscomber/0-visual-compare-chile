import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ["/", "/demo"], disallow: ["/api/", "/auth/", "/dashboard", "/evaluar", "/portfolio", "/casos", "/monitorear", "/settings", "/history", "/notificaciones"] },
    ],
    sitemap: "https://videntia.app/sitemap.xml",
    host: "https://videntia.app",
  }
}
