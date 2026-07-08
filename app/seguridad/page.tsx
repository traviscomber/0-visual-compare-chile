import { SiteHeader } from "@/components/landing/site-header"
import { SiteFooter } from "@/components/landing/site-footer"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Shield, Lock, Eye, Zap, Check, Database, Code2, BarChart3 } from "lucide-react"

export const metadata = {
  title: "Seguridad & Arquitectura | Comparación Visual Trazable",
  description: "Arquitectura segura con cifrado, auditoría completa, RLS y cumplimiento legal",
}

export default function SeguridadPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border bg-gradient-to-b from-blue-900/10 to-background py-12 md:py-20">
          <div className="mx-auto max-w-4xl px-4 md:px-6">
            <div className="text-center">
              <Badge className="mb-4 inline-flex gap-2 rounded-full border-border bg-secondary px-3 py-1">
                <Shield className="h-4 w-4" />
                Enterprise Security
              </Badge>
              <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                Seguridad by Design
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
                Arquitectura de seguridad de nivel empresarial con cifrado, auditoría completa, Row Level Security y cumplimiento legal automatizado.
              </p>
            </div>
          </div>
        </section>

        {/* Architecture Pillars */}
        <section className="border-b border-border py-12 md:py-20">
          <div className="mx-auto max-w-5xl px-4 md:px-6">
            <h2 className="mb-12 text-center text-3xl font-bold">Cuatro Pilares de Seguridad</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Pillar 1 */}
              <Card className="border-border p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Cifrado End-to-End</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span>TLS 1.3 para transmisión</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span>AES-256 para almacenamiento</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span>SHA256 para integridad</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span>Keys rotadas cada 90 días</span>
                  </li>
                </ul>
              </Card>

              {/* Pillar 2 */}
              <Card className="border-border p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Auditoría Completa</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span>Cada análisis registrado</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span>Usuario, hora, acción, resultado</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span>Firma digital en cada decisión</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span>Logs inmutables 7 años</span>
                  </li>
                </ul>
              </Card>

              {/* Pillar 3 */}
              <Card className="border-border p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Row Level Security (RLS)</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span>Cada usuario ve solo sus datos</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span>Aislamiento a nivel BD</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span>Políticas por rol y permiso</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span>Zero acceso cross-tenant</span>
                  </li>
                </ul>
              </Card>

              {/* Pillar 4 */}
              <Card className="border-border p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Cumplimiento Legal</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span>LPDP Chile 2024</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span>LGPD Brasil</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span>GDPR Europa</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span>Derecho al olvido automatizado</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </section>

        {/* Database Schema */}
        <section className="border-b border-border py-12 md:py-20">
          <div className="mx-auto max-w-5xl px-4 md:px-6">
            <h2 className="mb-8 text-3xl font-bold">Esquema de Base de Datos</h2>
            <div className="space-y-6">
              {/* Comparisons Table */}
              <Card className="border-border p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Code2 className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Tabla: comparisons</h3>
                </div>
                <div className="space-y-2 font-mono text-xs text-muted-foreground">
                  <div><span className="text-primary">id</span>: uuid (PK)</div>
                  <div><span className="text-primary">user_id</span>: uuid (FK, RLS)</div>
                  <div><span className="text-primary">image_a_id</span>: uuid (FK)</div>
                  <div><span className="text-primary">image_b_id</span>: uuid (FK)</div>
                  <div><span className="text-primary">similarity_score</span>: numeric (0-100)</div>
                  <div><span className="text-primary">phash_distance</span>: int</div>
                  <div><span className="text-primary">classification</span>: text (duplicate/fraud/compliant)</div>
                  <div><span className="text-primary">recommendation</span>: text</div>
                  <div><span className="text-primary">result_json</span>: jsonb (firma SHA256, metadata)</div>
                  <div><span className="text-primary">created_at</span>: timestamp (UTC)</div>
                  <div className="pt-2 text-xs text-amber-600">RLS: Users can only view/insert their own comparisons</div>
                </div>
              </Card>

              {/* Images Table */}
              <Card className="border-border p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Code2 className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Tabla: images</h3>
                </div>
                <div className="space-y-2 font-mono text-xs text-muted-foreground">
                  <div><span className="text-primary">id</span>: uuid (PK)</div>
                  <div><span className="text-primary">user_id</span>: uuid (FK, RLS)</div>
                  <div><span className="text-primary">filename</span>: text (original name)</div>
                  <div><span className="text-primary">sha256</span>: text (integridad)</div>
                  <div><span className="text-primary">phash</span>: text (perceptual hash)</div>
                  <div><span className="text-primary">width, height</span>: int</div>
                  <div><span className="text-primary">size_bytes</span>: bigint</div>
                  <div><span className="text-primary">metadata</span>: jsonb (EXIF, cámara, fecha)</div>
                  <div><span className="text-primary">storage_path</span>: text (Vercel Blob)</div>
                  <div><span className="text-primary">deleted_at</span>: timestamp (soft delete)</div>
                  <div className="pt-2 text-xs text-amber-600">RLS: Users can only access own images</div>
                </div>
              </Card>

              {/* Usage Logs Table */}
              <Card className="border-border p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Code2 className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Tabla: usage_logs (Auditoría)</h3>
                </div>
                <div className="space-y-2 font-mono text-xs text-muted-foreground">
                  <div><span className="text-primary">id</span>: uuid (PK)</div>
                  <div><span className="text-primary">user_id</span>: uuid (FK, RLS)</div>
                  <div><span className="text-primary">action</span>: text (compare/view/export/delete)</div>
                  <div><span className="text-primary">metadata</span>: jsonb (IP, user-agent, dispositivo)</div>
                  <div><span className="text-primary">created_at</span>: timestamp (UTC con timezone)</div>
                  <div className="pt-2 text-xs text-amber-600">RLS: Users can only view own logs. Logs inmutables por 7 años.</div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Infrastructure */}
        <section className="border-b border-border py-12 md:py-20">
          <div className="mx-auto max-w-5xl px-4 md:px-6">
            <h2 className="mb-8 text-3xl font-bold">Infraestructura</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-border p-6">
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <Zap className="h-5 w-5 text-primary" />
                  Database
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Supabase (PostgreSQL 15+)</li>
                  <li>• Región: Latinoamérica (Santiago)</li>
                  <li>• Backups: Daily + Point-in-time recovery</li>
                  <li>• High availability: 99.9% SLA</li>
                  <li>• Connection pooling PgBouncer</li>
                </ul>
              </Card>
              <Card className="border-border p-6">
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <Zap className="h-5 w-5 text-primary" />
                  Storage
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Vercel Blob Storage (S3 backend)</li>
                  <li>• Auto-encryption at rest</li>
                  <li>• CDN global para acceso rápido</li>
                  <li>• Soft delete: 30 días retención</li>
                  <li>• Auditoría acceso via Blob API</li>
                </ul>
              </Card>
              <Card className="border-border p-6">
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <Zap className="h-5 w-5 text-primary" />
                  Edge Functions
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Vercel Edge Runtime</li>
                  <li>• Procesamiento distribuido global</li>
                  <li>• Rate limiting: 100 req/min per user</li>
                  <li>• CORS: Whitelist solo dominios autorizados</li>
                  <li>• Timeout: 60s máximo</li>
                </ul>
              </Card>
              <Card className="border-border p-6">
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <Zap className="h-5 w-5 text-primary" />
                  Monitoring
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Real-time alertas para fallos</li>
                  <li>• Sentry para error tracking</li>
                  <li>• PostHog para analytics</li>
                  <li>• Datadog para infraestructura</li>
                  <li>• Logs retenidos 1 año mínimo</li>
                </ul>
              </Card>
            </div>
          </div>
        </section>

        {/* Compliance Matrix */}
        <section className="border-b border-border py-12 md:py-20">
          <div className="mx-auto max-w-5xl px-4 md:px-6">
            <h2 className="mb-8 text-3xl font-bold">Matriz de Cumplimiento</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left font-semibold">Regulación</th>
                    <th className="pb-3 text-left font-semibold">Requisito</th>
                    <th className="pb-3 text-center font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-3 font-mono text-xs">LPDP Chile 2024</td>
                    <td className="py-3 text-muted-foreground">Consentimiento informado y derecho al olvido</td>
                    <td className="py-3 text-center"><span className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">Compliant</span></td>
                  </tr>
                  <tr>
                    <td className="py-3 font-mono text-xs">LGPD Brasil</td>
                    <td className="py-3 text-muted-foreground">Transferencia internacional de datos</td>
                    <td className="py-3 text-center"><span className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">Compliant</span></td>
                  </tr>
                  <tr>
                    <td className="py-3 font-mono text-xs">GDPR UE</td>
                    <td className="py-3 text-muted-foreground">DPA firmado, Privacy by Design</td>
                    <td className="py-3 text-center"><span className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">Compliant</span></td>
                  </tr>
                  <tr>
                    <td className="py-3 font-mono text-xs">ISO 27001</td>
                    <td className="py-3 text-muted-foreground">Information Security Management</td>
                    <td className="py-3 text-center"><span className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">In Progress</span></td>
                  </tr>
                  <tr>
                    <td className="py-3 font-mono text-xs">SOC 2 Type II</td>
                    <td className="py-3 text-muted-foreground">Seguridad, disponibilidad, integridad</td>
                    <td className="py-3 text-center"><span className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">Q3 2026</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-b border-border py-12 md:py-20">
          <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
            <h2 className="mb-4 text-3xl font-bold">¿Necesitas detalles técnicos?</h2>
            <p className="mb-6 text-muted-foreground">Descarga nuestro documento de Arquitectura Segura completo (en preparación)</p>
            <button className="rounded-lg bg-primary px-6 py-2.5 font-semibold text-white hover:bg-primary/90">
              Descargar Documento (PDF)
            </button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
