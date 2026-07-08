import { Zap, Database, Search } from "lucide-react"

const modules = [
  {
    id: 1,
    icon: Zap,
    title: "Módulo de Comparación",
    subtitle: "Visual Compare Chile",
    features: [
      "Comparación visual con SHA-256, pHash y diff",
      "Score de similitud 0-100",
      "Hash perceptual y criptográfico",
      "Auditoría en tiempo real",
      "Control de roles y usuarios"
    ],
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
    highlight: "text-blue-600"
  },
  {
    id: 2,
    icon: Database,
    title: "Módulo de Consulta",
    subtitle: "Marcas Registradas",
    features: [
      "Búsqueda en históricos 2009-2025",
      "Clasificación Niza (45 clases)",
      "Clasificación Viena (29 categorías)",
      "Exportación a CSV",
      "Historial de consultas"
    ],
    color: "from-purple-500/20 to-pink-500/20",
    borderColor: "border-purple-500/30",
    highlight: "text-purple-600"
  },
  {
    id: 3,
    icon: Search,
    title: "Módulo de Análisis",
    subtitle: "Inteligencia de Datos",
    features: [
      "Búsqueda multicriterio",
      "Filtrado por códigos Viena/Niza",
      "Estadísticas de búsqueda",
      "Información detallada de clasificaciones",
      "Validación automática de BD"
    ],
    color: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-500/30",
    highlight: "text-amber-600"
  }
]

export function ModulesSection() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[--color-brand-teal]">
            Arquitectura
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Tres módulos integrados para control total.
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Desde comparación visual auditada hasta consulta y trazabilidad del flujo principal del MVP.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon
            return (
              <div
                key={module.id}
                className={`group rounded-2xl border ${module.borderColor} bg-gradient-to-br ${module.color} p-6 backdrop-blur-sm transition-all hover:border-opacity-100 hover:shadow-lg`}
              >
                {/* Icon and header */}
                <div className="mb-6">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${module.highlight.replace('text-', 'bg-').replace('-600', '-100')} mb-4`}>
                    <Icon className={`h-6 w-6 ${module.highlight}`} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{module.title}</h3>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">
                    {module.subtitle}
                  </p>
                </div>

                {/* Features list */}
                <ul className="space-y-3">
                  {module.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground">
                      <span className={`mt-1 inline-flex h-1.5 w-1.5 rounded-full ${module.highlight} flex-shrink-0`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Footer badge */}
                <div className="mt-6 pt-4 border-t border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground">
                    ✓ Producción lista
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
