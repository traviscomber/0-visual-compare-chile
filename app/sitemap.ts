import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return [
    { url: "https://videntia.app", lastModified, changeFrequency: "weekly", priority: 1 },
    { url: "https://videntia.app/demo", lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: "https://videntia.app/contacto", lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: "https://videntia.app/docs", lastModified, changeFrequency: "monthly", priority: 0.6 },
  ]
}
