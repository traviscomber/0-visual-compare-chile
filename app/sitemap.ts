import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://videntia.app", changeFrequency: "weekly", priority: 1 },
    { url: "https://videntia.app/demo", changeFrequency: "weekly", priority: 0.8 },
    { url: "https://videntia.app/contacto", changeFrequency: "monthly", priority: 0.7 },
    { url: "https://videntia.app/docs", changeFrequency: "monthly", priority: 0.6 },
  ]
}
