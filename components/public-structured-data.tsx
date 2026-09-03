type PublicStructuredPage =
  | "home"
  | "home-es"
  | "trademarks"
  | "trademarks-es"
  | "patents"
  | "patents-es"
  | "technologies"
  | "technologies-es"
  | "resources"
  | "resources-es"

const origin = "https://videntia.app"
const organizationId = "https://www.n3uralia.com/#organization"
const softwareId = `${origin}/#software`
const websiteId = `${origin}/#website`

const pages = {
  home: {
    url: `${origin}/`,
    name: "VIDENTIA — IP & Technology Intelligence",
    description: "Search, analyze and continuously monitor trademarks, patents and technologies with traceable IP and technology intelligence.",
    language: "en",
    serviceType: "IP and technology intelligence",
  },
  "home-es": {
    url: `${origin}/es`,
    name: "VIDENTIA — Inteligencia de propiedad intelectual y tecnología",
    description: "Investiga y monitorea marcas, patentes y tecnologías con evidencia trazable e inteligencia continua.",
    language: "es-CL",
    serviceType: "Inteligencia de propiedad intelectual y tecnología",
  },
  trademarks: {
    url: `${origin}/trademarks`,
    name: "Trademark Intelligence | VIDENTIA",
    description: "Search, compare, protect and monitor brands with traceable trademark intelligence.",
    language: "en",
    serviceType: "Trademark intelligence and monitoring",
  },
  "trademarks-es": {
    url: `${origin}/es/marcas`,
    name: "Inteligencia de marcas | VIDENTIA",
    description: "Busca, compara, protege y monitorea marcas con inteligencia marcaria trazable.",
    language: "es-CL",
    serviceType: "Inteligencia y vigilancia de marcas",
  },
  patents: {
    url: `${origin}/patents`,
    name: "Patent Intelligence & Prior Art Research | VIDENTIA",
    description: "Research inventions, prior art and patent activity with traceable evidence and structured review.",
    language: "en",
    serviceType: "Patent intelligence and prior-art research",
  },
  "patents-es": {
    url: `${origin}/es/patentes`,
    name: "Inteligencia de patentes | VIDENTIA",
    description: "Investiga antecedentes técnicos, arte previo y actividad de patentes con evidencia trazable y revisión estructurada.",
    language: "es-CL",
    serviceType: "Inteligencia de patentes e investigación de arte previo",
  },
  technologies: {
    url: `${origin}/technologies`,
    name: "Technology & R&D Intelligence | VIDENTIA",
    description: "Track R&D, patents, research, companies and technology signals with traceable intelligence.",
    language: "en",
    serviceType: "Technology and R&D intelligence",
  },
  "technologies-es": {
    url: `${origin}/es/tecnologias`,
    name: "Inteligencia tecnológica y de I+D | VIDENTIA",
    description: "Sigue investigación, patentes, empresas y señales tecnológicas con inteligencia trazable.",
    language: "es-CL",
    serviceType: "Inteligencia tecnológica y de I+D",
  },
  resources: {
    url: `${origin}/en/docs`,
    name: "VIDENTIA Enterprise API",
    description: "Technical documentation for enterprise integrations with VIDENTIA trademark intelligence routes.",
    language: "en",
    serviceType: "Enterprise IP intelligence API",
  },
  "resources-es": {
    url: `${origin}/es/docs`,
    name: "VIDENTIA API empresarial",
    description: "Documentación técnica para integraciones empresariales con rutas de inteligencia marcaria VIDENTIA.",
    language: "es-CL",
    serviceType: "API empresarial de inteligencia de propiedad intelectual",
  },
} as const

export function PublicStructuredData({ page }: { page: PublicStructuredPage }) {
  const current = pages[page]
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: "N3uralia",
      url: "https://www.n3uralia.com",
      description: "Software developer and technology provider behind VIDENTIA.",
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: origin,
      name: "VIDENTIA",
      publisher: { "@id": organizationId },
      inLanguage: ["en", "es-CL"],
    },
    {
      "@type": "SoftwareApplication",
      "@id": softwareId,
      name: "VIDENTIA",
      alternateName: "VIDENTIA IP & Technology Intelligence",
      url: origin,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      provider: { "@id": organizationId },
      areaServed: { "@type": "Country", name: "Chile" },
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
      "@type": "Service",
      "@id": `${current.url}#service`,
      name: current.name,
      serviceType: current.serviceType,
      url: current.url,
      provider: { "@id": organizationId },
      areaServed: { "@type": "Country", name: "Chile" },
      description: current.description,
    },
    {
      "@type": "WebPage",
      "@id": `${current.url}#webpage`,
      url: current.url,
      name: current.name,
      description: current.description,
      isPartOf: { "@id": websiteId },
      about: { "@id": softwareId },
      mainEntity: { "@id": `${current.url}#service` },
      inLanguage: current.language,
    },
  ]

  if (page === "home" || page === "home-es") {
    const spanish = page === "home-es"
    graph.push({
      "@type": "ItemList",
      "@id": `${current.url}#verticals`,
      name: spanish ? "Verticales de inteligencia VIDENTIA" : "VIDENTIA intelligence verticals",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: spanish ? "Inteligencia de marcas" : "Trademark Intelligence",
          url: spanish ? `${origin}/es/marcas` : `${origin}/trademarks`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: spanish ? "Inteligencia de patentes" : "Patent Intelligence",
          url: spanish ? `${origin}/es/patentes` : `${origin}/patents`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: spanish ? "Inteligencia tecnológica" : "Technology Intelligence",
          url: spanish ? `${origin}/es/tecnologias` : `${origin}/technologies`,
        },
      ],
    })
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c") }} />
}
