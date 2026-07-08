import { CheckCircle2, Lock, Eye, AlertTriangle } from "lucide-react"

const points = [
  "Autenticación con Supabase Auth y sesiones seguras",
  "Almacenamiento privado por usuario en Supabase Storage",
  "Row Level Security activo en todas las tablas",
  "URLs firmadas para acceso temporal a las imágenes",
  "Sin identificación biométrica ni reconocimiento facial",
  "Preparado para requisitos de privacidad chilenos",
]

export function SecuritySection() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[--color-brand-teal]">Seguridad</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Privacidad por diseño. Solo tú accedes a tus imágenes.
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Cada usuario tiene sus propias imágenes y comparaciones, accesibles únicamente con su sesión autenticada.
            Las imágenes se almacenan en un bucket privado, sin URLs públicas.
          </p>

          <ul className="mt-6 space-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[--color-brand-teal]/10 text-[--color-brand-teal]">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="text-sm leading-relaxed text-foreground">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <SecurityCard icon={Lock} title="Bucket privado" description="comparison-images con políticas RLS por usuario." />
          <SecurityCard
            icon={Eye}
            title="Solo lectura propia"
            description="Cada usuario solo puede ver sus propias comparaciones."
          />
          <SecurityCard
            icon={AlertTriangle}
            title="Sin biometría"
            description="No se identifican personas. No es reconocimiento facial."
          />
          <SecurityCard
            icon={CheckCircle2}
            title="Trazabilidad"
            description="Cada acción operacional queda registrada en logs."
          />
        </div>
      </div>
    </section>
  )
}

function SecurityCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Lock
  title: string
  description: string
}) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-[--color-brand-teal]/50 hover:shadow-md hover:bg-[--color-brand-teal]/5">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-brand-teal]/10 text-[--color-brand-teal] group-hover:bg-[--color-brand-teal]/20 transition-colors">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}
