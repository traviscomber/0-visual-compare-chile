import type { MetadataRoute } from "next"

const origin = "https://videntia.app"
const routes = ["", "/demo", "/docs", "/privacidad", "/terminos"] as const

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.flatMap((path) => [
    {
      url: `${origin}/es${path}`,
      changeFrequency: path === "" ? "weekly" as const : "monthly" as const,
      priority: path === "" ? 1 : path === "/demo" ? 0.9 : 0.6,
      alternates: { languages: { "es-CL": `${origin}/es${path}`, en: `${origin}/en${path}` } },
    },
    {
      url: `${origin}/en${path}`,
      changeFrequency: path === "" ? "weekly" as const : "monthly" as const,
      priority: path === "" ? 0.9 : path === "/demo" ? 0.8 : 0.5,
      alternates: { languages: { "es-CL": `${origin}/es${path}`, en: `${origin}/en${path}` } },
    },
  ])
}
