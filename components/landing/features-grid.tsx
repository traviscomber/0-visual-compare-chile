import { CheckCircle2, BarChart3, Shield, Zap, FileText, Users } from "lucide-react"

const features = [
  {
    icon: CheckCircle2,
    title: "Auditoría Completa",
    description: "Cada acción registrada con timestamp, usuario y resultado para cumplimiento normativo."
  },
  {
    icon: BarChart3,
    title: "Análisis Visual",
    description: "pHash, similitud de coseno y clasificación automática con scores verificables."
  },
  {
    icon: Shield,
    title: "Privacidad Garantizada",
    description: "Almacenamiento cifrado, acceso por rol y datos nunca compartidos con terceros."
  },
  {
    icon: Zap,
    title: "Rendimiento",
    description: "Procesamiento estable para el flujo de comparación y consulta del MVP."
  },
  {
    icon: FileText,
    title: "Exportación de Datos",
    description: "Descarga resultados en CSV con metadatos técnicos listos para abogados e inspectores."
  },
  {
    icon: Users,
    title: "Gestión de Roles",
    description: "Administrador, auditor y operador con permisos diferenciados y auditoría de acceso."
  }
]

export function FeaturesGrid() {
  return (
    <section className="border-b border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[--color-brand-teal]">
            Características
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Pensado para cumplimiento e integridad.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-[--color-brand-teal]/50 hover:shadow-md hover:bg-[--color-brand-teal]/5"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[--color-brand-teal]/10 text-[--color-brand-teal] transition-colors group-hover:bg-[--color-brand-teal]/20">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
