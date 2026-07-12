import { SiteHeader } from '@/components/landing/site-header'
import { SiteFooter } from '@/components/landing/site-footer'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Check, Clock, Rocket, Zap, Database, Shield, Globe, BarChart3 } from 'lucide-react'

export const metadata = {
  title: 'Roadmap | Visual Compare Chile',
  description: 'Estado actual y hoja de ruta del producto: Fase 0 completada, Fase 1 en marcha — API portal, auth, datos INAPI y expansión comercial.',
}

const completed: { label: string; detail: string }[] = [
  { label: 'Landing page profesional',            detail: 'Hero, pilares, testimonios, CTA' },
  { label: 'Dashboard de inteligencia de mercado', detail: 'KPIs, 3 tabs, datos reales desde BD' },
  { label: 'Agente IA de análisis de marcas',      detail: 'GPT-4o Vision · clasificación Viena + Niza' },
  { label: 'Informe PDF descargable',              detail: '5 páginas · imágenes embebidas · react-pdf' },
  { label: 'Motor de comparación visual',          detail: 'Score ponderado · detección de conflictos' },
  { label: 'Schema de BD en producción',           detail: '13 tablas · RLS · 24 índices · seed Niza/Viena' },
  { label: 'API v1 pública documentada',           detail: '/search, /compare, /registros, /vision, /agent' },
  { label: 'Auth Supabase + roles',               detail: 'Login, signup, rutas protegidas, 3 roles' },
  { label: 'Historial y comparaciones',           detail: 'CRUD completo · filtros · exportación' },
  { label: 'KMZ Vitacura (12 sectores)',          detail: 'GeoJSON público y descargable' },
]

const phases: {
  id: string
  title: string
  subtitle: string
  badge: string
  status: 'done' | 'active' | 'next' | 'future'
  icon: React.ReactNode
  items: { label: string; detail: string; done?: boolean }[]
}[] = [
  {
    id: 'fase-0',
    title: 'Fase 0',
    subtitle: 'Completada — Julio 2026',
    badge: 'MVP + Agente IA',
    status: 'done',
    icon: <Check className="h-5 w-5" />,
    items: [
      { label: 'Landing page + branding',              detail: 'Identidad visual definida',              done: true },
      { label: 'Dashboard con KPIs reales',            detail: 'Datos desde Supabase',                   done: true },
      { label: 'Agente IA (GPT-4o Vision)',            detail: 'Análisis completo de marcas',            done: true },
      { label: 'PDF report descargable',               detail: 'Imágenes embebidas, 5 páginas',          done: true },
      { label: 'Schema BD producción',                 detail: '13 tablas, RLS, Niza + Viena seed',      done: true },
      { label: 'API v1 pública',                       detail: '12 endpoints documentados',              done: true },
    ],
  },
  {
    id: 'fase-1',
    title: 'Fase 1',
    subtitle: 'En curso — Q3 2026',
    badge: 'Datos reales + Auth robusta',
    status: 'active',
    icon: <Zap className="h-5 w-5" />,
    items: [
      { label: 'Integración INAPI (web scraping)',     detail: 'Sync periódico de ~350K marcas chilenas',    done: false },
      { label: 'API key management self-service',      detail: 'Portal de claves, quotas, revocación',       done: false },
      { label: 'Auth con organizaciones y roles',      detail: 'Multi-tenant: admin / editor / member',      done: false },
      { label: 'Audit log completo',                   detail: 'Trazabilidad de acciones por usuario',       done: false },
      { label: 'Rate limiting por API key',            detail: 'Upstash Redis · límites por plan',          done: false },
      { label: 'Exportación masiva (CSV + Excel)',     detail: 'Resultados de búsqueda y comparaciones',     done: false },
    ],
  },
  {
    id: 'fase-2',
    title: 'Fase 2',
    subtitle: 'Planificada — Q4 2026',
    badge: 'Escala + Inteligencia',
    status: 'next',
    icon: <BarChart3 className="h-5 w-5" />,
    items: [
      { label: 'Motor de registrabilidad IA',          detail: 'Score de aceptación INAPI antes de registrar' },
      { label: 'Vigilancia de marca (alertas)',         detail: 'Notificaciones cuando aparece marca similar'  },
      { label: 'Comparación en lote',                  detail: 'CSV de marcas → análisis masivo paralelo'     },
      { label: 'Webhooks y eventos',                   detail: 'Integraciones con sistemas externos vía HTTP' },
      { label: 'Dashboard analítico avanzado',         detail: 'Uso por cliente, cohortes, ROI estimado'      },
      { label: 'SDK cliente (Node / Python)',           detail: 'Librería oficial para API v1'                 },
    ],
  },
  {
    id: 'fase-3',
    title: 'Fase 3',
    subtitle: 'Planificada — 2027',
    badge: 'Expansión regional',
    status: 'future',
    icon: <Globe className="h-5 w-5" />,
    items: [
      { label: 'Cobertura LATAM',                     detail: 'Argentina INPI, Colombia SIC, México IMPI'   },
      { label: 'Motor multimodal mejorado',            detail: 'Análisis fonético + visual combinado'        },
      { label: 'White-label para estudios legales',    detail: 'Marca propia, dominio propio, API privada'   },
      { label: 'Marketplace de agentes jurídicos',     detail: 'Reportes especializados por sector'         },
    ],
  },
]

const statusConfig = {
  done:   { bg: 'bg-green-500/10',  border: 'border-green-500/20',  text: 'text-green-600',  badge: 'Completada' },
  active: { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   text: 'text-blue-600',   badge: 'En curso'   },
  next:   { bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  text: 'text-amber-600',  badge: 'Próxima'    },
  future: { bg: 'bg-slate-500/10',  border: 'border-slate-500/20',  text: 'text-slate-500',  badge: 'Planificada'},
}

export default function RoadmapPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">

        {/* Hero */}
        <section className="border-b border-border bg-gradient-to-b from-blue-900/10 to-background py-14 md:py-20">
          <div className="mx-auto max-w-4xl px-4 md:px-6 text-center">
            <Badge className="mb-4 inline-flex gap-2 rounded-full border-border bg-secondary px-3 py-1">
              <Rocket className="h-4 w-4" />
              Roadmap del producto
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Visual Compare Chile
            </h1>
            <p className="mt-5 max-w-2xl mx-auto text-lg text-muted-foreground">
              Estado actual y hoja de ruta. Fase 0 completada en julio 2026 — plataforma en producción con agente IA,
              PDF reports y API pública. Fase 1 en marcha con datos reales INAPI.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
              <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-green-600 font-medium">
                <Check className="h-3.5 w-3.5" /> Fase 0 completada
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-blue-600 font-medium">
                <Zap className="h-3.5 w-3.5" /> Fase 1 en curso
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-muted-foreground font-medium">
                <Database className="h-3.5 w-3.5" /> 13 tablas en producción
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-muted-foreground font-medium">
                <Shield className="h-3.5 w-3.5" /> API v1 pública
              </span>
            </div>
          </div>
        </section>

        {/* Completado en Fase 0 */}
        <section className="border-b border-border py-12 md:py-16">
          <div className="mx-auto max-w-5xl px-4 md:px-6">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-foreground">Entregado en Fase 0</h2>
              <p className="mt-2 text-muted-foreground">Todo lo que está live en producción hoy</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-2">
              {completed.map((item) => (
                <div key={item.label} className="flex items-start gap-3 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Fases */}
        <section className="border-b border-border py-12 md:py-16">
          <div className="mx-auto max-w-5xl px-4 md:px-6">
            <h2 className="mb-10 text-center text-2xl font-bold text-foreground">Hoja de ruta</h2>
            <div className="space-y-6">
              {phases.map((phase) => {
                const cfg = statusConfig[phase.status]
                return (
                  <Card key={phase.id} className={`border ${cfg.border} ${cfg.bg} p-6`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background border ${cfg.border} ${cfg.text}`}>
                          {phase.icon}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-foreground">{phase.title}</h3>
                            <Badge variant="outline" className={`text-xs ${cfg.text} border-current`}>
                              {cfg.badge}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-foreground/80">{phase.badge}</p>
                          <p className="text-xs text-muted-foreground">{phase.subtitle}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {phase.items.map((item) => (
                        <div key={item.label} className="flex items-start gap-2.5">
                          {phase.status === 'done' || item.done ? (
                            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.text}`} />
                          ) : (
                            <Clock className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.text}`} />
                          )}
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Criterio de salida */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-3xl px-4 md:px-6 text-center">
            <h2 className="mb-4 text-2xl font-bold text-foreground">Criterio de salida — Fase 1</h2>
            <p className="text-muted-foreground">
              La Fase 1 se considera lista cuando: (1) el sync de INAPI carga al menos 10K marcas reales,
              (2) el portal de API keys emite, revoca y mide uso en tiempo real, y (3) el rate limiting
              bloquea requests sobre el límite configurado.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Endpoint de salud en producción:{' '}
              <code className="rounded bg-secondary px-1.5 py-0.5">/api/v1/health</code>
            </p>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  )
}
