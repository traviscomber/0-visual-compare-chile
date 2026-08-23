import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VIDENTIA",
    short_name: "VIDENTIA",
    description: "Inteligencia para búsqueda, evaluación y vigilancia de marcas en Chile.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F8F6",
    theme_color: "#111827",
    lang: "es-CL",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  }
}
