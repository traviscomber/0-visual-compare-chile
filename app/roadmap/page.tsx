import { SiteHeader } from "@/components/landing/site-header"
import { SiteFooter } from "@/components/landing/site-footer"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Check, Clock, Zap, Lightbulb, BarChart3, Users, Shield, Rocket } from "lucide-react"

export const metadata = {
  title: "Roadmap del Producto | Comparación Visual Trazable",
  description: "Descubre las próximas características y la visión de desarrollo de nuestra plataforma",
}

export default function RoadmapPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border bg-gradient-to-b from-blue-900/10 to-background py-12 md:py-20">
          <div className="mx-auto max-w-4xl px-4 md:px-6">
            <div className="text-center">
              <Badge className="mb-4 inline-flex gap-2 rounded-full border-border bg-secondary px-3 py-1">
                <Rocket className="h-4 w-4" />
                Roadmap Público
              </Badge>
              <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                Futuro de Comparación Visual
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
                Una plataforma que evoluciona con tus necesidades. Conoce nuestro plan de desarrollo y envía feedback para priorizar features.
              </p>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="border-b border-border py-12 md:py-20">
          <div className="mx-auto max-w-5xl px-4 md:px-6">
            <h2 className="mb-12 text-center text-3xl font-bold">Línea de Desarrollo</h2>

            {/* Q2 2026 - Now */}
            <div className="mb-12">
              <div className="mb-6 flex items-center gap-3">
                <Badge className="inline-flex gap-2 rounded-full bg-green-100 px-3 py-1 text-green-800">
                  <Check className="h-4 w-4" />
                  Ahora
                </Badge>
                <h3 className="text-2xl font-bold">Q2 2026 - Launch MVP</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold">Detección Visual</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Comparación de imágenes con perceptual hash y similarity scoring
                  </p>
                </Card>
                <Card className="border-border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold">Auditoría Completa</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Logs inmutables de cada análisis con firma digital
                  </p>
                </Card>
                <Card className="border-border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold">RLS & Seguridad</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Row Level Security y cifrado AES-256 de datos
                  </p>
                </Card>
              </div>
            </div>

            {/* Q3 2026 */}
            <div className="mb-12">
              <div className="mb-6 flex items-center gap-3">
                <Badge className="inline-flex gap-2 rounded-full border-border bg-blue-100 px-3 py-1 text-blue-800">
                  <Clock className="h-4 w-4" />
                  Q3 2026
                </Badge>
                <h3 className="text-2xl font-bold">Análisis Avanzado</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold">Metadata Intelligence</h4>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Extracción EXIF automática</li>
                    <li>• Geolocalización y timestamp</li>
                    <li>• Detección de manipulación</li>
                  </ul>
                </Card>
                <Card className="border-border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold">Reportes Avanzados</h4>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Dashboard analítico</li>
                    <li>• Exportar a PDF/CSV</li>
                    <li>• Comparativas históricas</li>
                  </ul>
                </Card>
                <Card className="border-border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold">Gestión de Equipos</h4>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Roles y permisos (admin, auditor, viewer)</li>
                    <li>• Workspaces por organización</li>
                    <li>• Auditoría de acceso</li>
                  </ul>
                </Card>
                <Card className="border-border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold">API Pública Beta</h4>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• REST API con rate limiting</li>
                    <li>• Webhook para eventos</li>
                    <li>• SDK para Python/Node</li>
                  </ul>
                </Card>
              </div>
            </div>

            {/* Q4 2026 */}
            <div className="mb-12">
              <div className="mb-6 flex items-center gap-3">
                <Badge className="inline-flex gap-2 rounded-full border-border bg-purple-100 px-3 py-1 text-purple-800">
                  <Clock className="h-4 w-4" />
                  Q4 2026
                </Badge>
                <h3 className="text-2xl font-bold">IA & Automatización</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-purple-600" />
                    <h4 className="font-semibold">ML Fraud Detection</h4>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Modelo entrenado con 10k+ casos</li>
                    <li>• Predicción automática de fraude</li>
                    <li>• Confidence scoring</li>
                  </ul>
                </Card>
                <Card className="border-border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-purple-600" />
                    <h4 className="font-semibold">Batch Processing</h4>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Procesar 10k imágenes en paralelo</li>
                    <li>• Programación de tareas</li>
                    <li>• Notificaciones por email</li>
                  </ul>
                </Card>
                <Card className="border-border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    <h4 className="font-semibold">Compliance Automation</h4>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Cumplimiento ISO 27001</li>
                    <li>• SOC 2 Type II audit ready</li>
                    <li>• DPA templating</li>
                  </ul>
                </Card>
                <Card className="border-border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <h4 className="font-semibold">Enterprise SSO</h4>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• SAML 2.0 integration</li>
                    <li>• Active Directory sync</li>
                    <li>• MFA enforcement</li>
                  </ul>
                </Card>
              </div>
            </div>

            {/* 2027 - Vision */}
            <div>
              <div className="mb-6 flex items-center gap-3">
                <Badge className="inline-flex gap-2 rounded-full border-border bg-slate-100 px-3 py-1 text-slate-800">
                  <Lightbulb className="h-4 w-4" />
                  2027 - Visión
                </Badge>
                <h3 className="text-2xl font-bold">Plataforma Integral</h3>
              </div>
              <p className="mb-4 text-muted-foreground">
                Evolucionar desde herramienta de comparación hacia plataforma integral de verificación visual para empresas.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-border p-4 opacity-75">
                  <h4 className="mb-2 font-semibold">Vídeo Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    Análisis de fotogramas en vídeo para detección de fraude
                  </p>
                </Card>
                <Card className="border-border p-4 opacity-75">
                  <h4 className="mb-2 font-semibold">3D Mesh Recognition</h4>
                  <p className="text-sm text-muted-foreground">
                    Comparación de objetos 3D para industria de manufactura
                  </p>
                </Card>
                <Card className="border-border p-4 opacity-75">
                  <h4 className="mb-2 font-semibold">Blockchain Notarization</h4>
                  <p className="text-sm text-muted-foreground">
                    Certificación en blockchain para máxima credibilidad
                  </p>
                </Card>
                <Card className="border-border p-4 opacity-75">
                  <h4 className="mb-2 font-semibold">Mobile Apps</h4>
                  <p className="text-sm text-muted-foreground">
                    Apps nativas iOS y Android con captura + análisis
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Feedback Section */}
        <section className="border-b border-border py-12 md:py-20">
          <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
            <h2 className="mb-4 text-3xl font-bold">¿Tienes una feature en mente?</h2>
            <p className="mb-6 text-muted-foreground">
              Nuestro roadmap es público y basado en feedback de usuarios. Envía tus ideas y vota por las features que más te importan.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button className="rounded-lg bg-primary px-6 py-2.5 font-semibold text-white hover:bg-primary/90">
                Enviar Feedback
              </button>
              <button className="rounded-lg border border-border px-6 py-2.5 font-semibold hover:bg-secondary">
                Ver Votaciones
              </button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-border py-12 md:py-20">
          <div className="mx-auto max-w-5xl px-4 md:px-6">
            <h2 className="mb-8 text-center text-3xl font-bold">Velocidad de Desarrollo</h2>
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="border-border p-6 text-center">
                <div className="mb-2 text-3xl font-bold text-primary">2 semanas</div>
                <p className="text-sm text-muted-foreground">Ciclo de release</p>
              </Card>
              <Card className="border-border p-6 text-center">
                <div className="mb-2 text-3xl font-bold text-primary">99.9%</div>
                <p className="text-sm text-muted-foreground">Uptime SLA</p>
              </Card>
              <Card className="border-border p-6 text-center">
                <div className="mb-2 text-3xl font-bold text-primary">100%</div>
                <p className="text-sm text-muted-foreground">Backward compatible</p>
              </Card>
              <Card className="border-border p-6 text-center">
                <div className="mb-2 text-3xl font-bold text-primary">0 downtime</div>
                <p className="text-sm text-muted-foreground">Deployments</p>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
