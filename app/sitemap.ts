import type { MetadataRoute } from "next"

const origin = "https://videntia.app"

type Pair = {
  en: string
  es: string
  priority: number
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly"
}

const pairs: Pair[] = [
  { en: "/", es: "/es", priority: 1, changeFrequency: "weekly" },
  { en: "/trademarks", es: "/es/marcas", priority: 0.95, changeFrequency: "weekly" },
  { en: "/patents", es: "/es/patentes", priority: 0.92, changeFrequency: "weekly" },
  { en: "/technologies", es: "/es/tecnologias", priority: 0.92, changeFrequency: "weekly" },
  { en: "/en/docs", es: "/es/docs", priority: 0.82, changeFrequency: "monthly" },
  { en: "/en/demo", es: "/es/demo", priority: 0.8, changeFrequency: "weekly" },
  { en: "/en/privacidad", es: "/es/privacidad", priority: 0.35, changeFrequency: "yearly" },
  { en: "/en/terminos", es: "/es/terminos", priority: 0.35, changeFrequency: "yearly" },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return pairs.flatMap(({ en, es, priority, changeFrequency }) => {
    const enUrl = `${origin}${en}`
    const esUrl = `${origin}${es}`
    const alternates = { languages: { en: enUrl, "es-CL": esUrl, "x-default": enUrl } }
    return [
      { url: enUrl, changeFrequency, priority, alternates },
      { url: esUrl, changeFrequency, priority: Math.max(priority - 0.02, 0.3), alternates },
    ]
  })
}
