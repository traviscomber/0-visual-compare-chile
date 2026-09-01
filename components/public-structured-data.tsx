type PublicStructuredPage = "home" | "trademarks" | "patents" | "technologies" | "trademarks-es"

const origin = "https://videntia.app"

const pages = {
  home: {
    url: `${origin}/`,
    name: "VIDENTIA — IP & Technology Intelligence",
    description: "Search, analyze and continuously monitor trademarks, patents and technologies with traceable IP and technology intelligence.",
    language: "en",
  },
  trademarks: {
    url: `${origin}/trademarks`,
    name: "Trademark Intelligence | VIDENTIA",
    description: "Search, compare, protect and monitor brands with traceable trademark intelligence.",
    language: "en",
  },
  patents: {
    url: `${origin}/patents`,
    name: "Patent Intelligence & Prior Art Research | VIDENTIA",
    description: "Research inventions, prior art and patent activity with traceable evidence and structured review.",
    language: "en",
  },
  technologies: {
    url: `${origin}/technologies`,
    name: "Technology & R&D Intelligence | VIDENTIA",
    description: "Track R&D, patents, research, companies and technology signals with traceable intelligence.",
    language: "en",
  },
  "trademarks-es": {
    url: `${origin}/es/marcas`,
    name: "Inteligencia de marcas | VIDENTIA",
    description: "Busca, compara, protege y monitorea marcas con inteligencia marcaria trazable.",
    language: "es-CL",
  },
} as const

export function PublicStructuredData({ page }: { page: PublicStructuredPage }) {
  const current = pages[page]
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.n3uralia.com/#organization",
        name: "N3uralia",
        url: "https://www.n3uralia.com",
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        url: origin,
        name: "VIDENTIA",
        publisher: { "@id": "https://www.n3uralia.com/#organization" },
        inLanguage: ["en", "es-CL"],
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${origin}/#software`,
        name: "VIDENTIA",
        url: origin,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        provider: { "@id": "https://www.n3uralia.com/#organization" },
        description: "IP & Technology Intelligence platform for researching and monitoring trademarks, patents and technologies with traceable evidence.",
        featureList: [
          "Trademark intelligence and monitoring",
          "Patent prior-art research and structured review",
          "Technology and R&D intelligence monitoring",
          "Traceable evidence workflows",
          "Recurring watches and reports",
        ],
      },
      {
        "@type": "WebPage",
        "@id": `${current.url}#webpage`,
        url: current.url,
        name: current.name,
        description: current.description,
        isPartOf: { "@id": `${origin}/#website` },
        about: { "@id": `${origin}/#software` },
        inLanguage: current.language,
      },
    ],
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }} />
}
