import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return [
    { url: "https://videntia.app", lastModified, changeFrequency: "weekly", priority: 1 },
    { url: "https://videntia.app/demo", lastModified, changeFrequency: "weekly", priority: 0.8 },
  ]
}
