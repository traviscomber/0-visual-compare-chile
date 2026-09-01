import type { MetadataRoute } from "next"

const origin = "https://videntia.app"
const sharedRoutes = ["", "/demo", "/docs", "/privacidad", "/terminos"] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const canonical: MetadataRoute.Sitemap = [
    {
      url: origin,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${origin}/trademarks`,
      changeFrequency: "weekly",
      priority: 0.95,
      alternates: { languages: { en: `${origin}/trademarks`, "es-CL": `${origin}/es` } },
    },
    {
      url: `${origin}/patents`,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: { languages: { en: `${origin}/patents`, "es-CL": `${origin}/es/patentes` } },
    },
    {
      url: `${origin}/technologies`,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: { languages: { en: `${origin}/technologies`, "es-CL": `${origin}/es/tecnologias` } },
    },
  ]

  const localized = sharedRoutes.flatMap((path) => [
    {
      url: `${origin}/es${path}`,
      changeFrequency: path === "" ? "weekly" as const : "monthly" as const,
      priority: path === "" ? 0.85 : path === "/demo" ? 0.8 : 0.55,
      alternates: { languages: { "es-CL": `${origin}/es${path}`, en: `${origin}/en${path}` } },
    },
    {
      url: `${origin}/en${path}`,
      changeFrequency: path === "" ? "weekly" as const : "monthly" as const,
      priority: path === "" ? 0.75 : path === "/demo" ? 0.7 : 0.45,
      alternates: { languages: { "es-CL": `${origin}/es${path}`, en: `${origin}/en${path}` } },
    },
  ])

  const localizedVerticals: MetadataRoute.Sitemap = [
    {
      url: `${origin}/es/patentes`,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: { languages: { "es-CL": `${origin}/es/patentes`, en: `${origin}/patents` } },
    },
    {
      url: `${origin}/en/patents`,
      changeFrequency: "weekly",
      priority: 0.65,
      alternates: { languages: { "es-CL": `${origin}/es/patentes`, en: `${origin}/patents` } },
    },
    {
      url: `${origin}/es/tecnologias`,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: { languages: { "es-CL": `${origin}/es/tecnologias`, en: `${origin}/technologies` } },
    },
    {
      url: `${origin}/en/technologies`,
      changeFrequency: "weekly",
      priority: 0.65,
      alternates: { languages: { "es-CL": `${origin}/es/tecnologias`, en: `${origin}/technologies` } },
    },
  ]

  return [...canonical, ...localized, ...localizedVerticals]
}
