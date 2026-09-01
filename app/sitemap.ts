import type { MetadataRoute } from "next"

const origin = "https://videntia.app"
const sharedRoutes = ["/demo", "/docs", "/privacidad", "/terminos"] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const canonical: MetadataRoute.Sitemap = [
    {
      url: origin,
      changeFrequency: "weekly",
      priority: 1,
      alternates: { languages: { en: origin, "es-CL": `${origin}/es`, "x-default": origin } },
    },
    {
      url: `${origin}/trademarks`,
      changeFrequency: "weekly",
      priority: 0.95,
      alternates: { languages: { en: `${origin}/trademarks`, "es-CL": `${origin}/es/marcas`, "x-default": `${origin}/trademarks` } },
    },
    {
      url: `${origin}/patents`,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: { languages: { en: `${origin}/patents`, "es-CL": `${origin}/es/patentes`, "x-default": `${origin}/patents` } },
    },
    {
      url: `${origin}/technologies`,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: { languages: { en: `${origin}/technologies`, "es-CL": `${origin}/es/tecnologias`, "x-default": `${origin}/technologies` } },
    },
    {
      url: `${origin}/es`,
      changeFrequency: "weekly",
      priority: 0.85,
      alternates: { languages: { "es-CL": `${origin}/es`, en: origin, "x-default": origin } },
    },
    {
      url: `${origin}/es/marcas`,
      changeFrequency: "weekly",
      priority: 0.85,
      alternates: { languages: { "es-CL": `${origin}/es/marcas`, en: `${origin}/trademarks`, "x-default": `${origin}/trademarks` } },
    },
    {
      url: `${origin}/es/patentes`,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: { languages: { "es-CL": `${origin}/es/patentes`, en: `${origin}/patents`, "x-default": `${origin}/patents` } },
    },
    {
      url: `${origin}/es/tecnologias`,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: { languages: { "es-CL": `${origin}/es/tecnologias`, en: `${origin}/technologies`, "x-default": `${origin}/technologies` } },
    },
  ]

  const localizedShared: MetadataRoute.Sitemap = sharedRoutes.flatMap((path) => [
    {
      url: `${origin}/es${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "/demo" ? 0.8 : 0.55,
      alternates: { languages: { "es-CL": `${origin}/es${path}`, en: `${origin}/en${path}` } },
    },
    {
      url: `${origin}/en${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "/demo" ? 0.7 : 0.45,
      alternates: { languages: { "es-CL": `${origin}/es${path}`, en: `${origin}/en${path}` } },
    },
  ])

  return [...canonical, ...localizedShared]
}
