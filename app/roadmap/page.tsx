import { SiteHeader } from '@/components/landing/site-header'
import { SiteFooter } from '@/components/landing/site-footer'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Check, Clock, Rocket } from 'lucide-react'

export const metadata = {
  title: 'Roadmap del MVP | Visual Compare Chile',
  description: 'Plan corto y objetivo para terminar el MVP con auth, upload, comparacion, historial y despliegue listo para piloto.',
}

const phases = [
  {
    title: 'Semana 1',
    badge: 'Base operativa',
    items: ['Auth Supabase estable', 'Rutas privadas protegidas', 'Variables de entorno validadas']
  },
  {
    title: 'Semanas 2-3',
    badge: 'Comparacion',
    items: ['Upload consistente', 'Validacion de formatos y tamanos', 'Respuesta clara de comparacion']
  },
  {
    title: 'Semanas 4-5',
    badge: 'Historial y consulta',
    items: ['Historial navegable', 'Filtro por nombre y clasificacion', 'Detalle de resultados']
  },
  {
    title: 'Semana 6',
    badge: 'Piloto',
    items: ['Checklist de despliegue', 'Documentacion breve', 'Smoke tests y ajustes finales']
  }
]

export default function RoadmapPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-gradient-to-b from-blue-900/10 to-background py-12 md:py-20">
          <div className="mx-auto max-w-4xl px-4 md:px-6 text-center">
            <Badge className="mb-4 inline-flex gap-2 rounded-full border-border bg-secondary px-3 py-1">
              <Rocket className="h-4 w-4" />
              Roadmap MVP
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Visual Compare Chile
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
              Objetivo autonomo: cerrar un MVP funcional, demostrable y listo para piloto sin promesas fuera de alcance.
            </p>
          </div>
        </section>

        <section className="border-b border-border py-12 md:py-20">
          <div className="mx-auto max-w-5xl px-4 md:px-6">
            <h2 className="mb-8 text-center text-3xl font-bold">Plan de trabajo</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {phases.map((phase) => (
                <Card key={phase.title} className="border-border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{phase.title}</p>
                      <h3 className="text-xl font-bold">{phase.badge}</h3>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {phase.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border py-12 md:py-20">
          <div className="mx-auto max-w-3xl px-4 md:px-6 text-center">
            <h2 className="mb-4 text-3xl font-bold">Criterio de salida</h2>
            <p className="text-muted-foreground">
              El MVP se considera listo cuando auth, upload, comparacion, historial y despliegue pasen build y smoke tests.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
