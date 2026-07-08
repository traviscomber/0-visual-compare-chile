'use client'

import { FileText, CheckCircle, Clock, User, Lock } from "lucide-react"

export function AuditableReportSection() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Reporte Auditable</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Cada análisis genera un registro verificable.
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            No es una caja negra. Todos los datos están documentados, asignables y revisables para cumplimiento legal y auditoría interna.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {/* Timestamp */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Fecha exacta</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Cada análisis registra timestamp UTC exacto de creación y resultado.
            </p>
          </div>

          {/* User */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Usuario asignado</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Quién realizó el análisis, su rol y permisos quedan documentados.
            </p>
          </div>

          {/* Result */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CheckCircle className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Resultado técnico</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Score, pHash, metadata y conclusión quedan guardados permanentemente.
            </p>
          </div>

          {/* Decision */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Decisión registrada</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Aprobado, rechazado o pendiente de revisión queda auditado.
            </p>
          </div>

          {/* Compliance */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Cumplimiento legal</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              LPDP Chile, LGPD Brasil y GDPR listo. Borrado seguro bajo demanda.
            </p>
          </div>
        </div>

        {/* Sample Report Box */}
        <div className="mt-12 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-900/10 to-slate-900/30 p-8">
          <div className="max-w-3xl">
            <h3 className="text-lg font-semibold text-foreground mb-4">Ejemplo de Reporte</h3>
            <div className="space-y-3 text-sm font-mono bg-background/50 p-4 rounded-lg">
              <div className="text-muted-foreground">
                <span className="text-primary">Análisis ID:</span> {' '}
                <span className="text-foreground">comp_2024_001_abc123</span>
              </div>
              <div className="text-muted-foreground">
                <span className="text-primary">Fecha:</span> {' '}
                <span className="text-foreground">2024-01-15 14:32:45 UTC</span>
              </div>
              <div className="text-muted-foreground">
                <span className="text-primary">Usuario:</span> {' '}
                <span className="text-foreground">analyst@seguros-chile.com (Admin)</span>
              </div>
              <div className="text-muted-foreground">
                <span className="text-primary">Similitud Visual:</span> {' '}
                <span className="text-foreground">96.8%</span>
              </div>
              <div className="text-muted-foreground">
                <span className="text-primary">pHash:</span> {' '}
                <span className="text-foreground">97.3</span>
              </div>
              <div className="text-muted-foreground">
                <span className="text-primary">Conclusión:</span> {' '}
                <span className="text-foreground">Duplicado detectado - Requiere revisión</span>
              </div>
              <div className="text-muted-foreground">
                <span className="text-primary">Decisión:</span> {' '}
                <span className="text-foreground">Rechazado - 2024-01-15 15:10:20 UTC</span>
              </div>
              <div className="text-muted-foreground">
                <span className="text-primary">Firma SHA256:</span> {' '}
                <span className="text-foreground">a3f2c8e1b4d9c6f5e2a1b8c3d4e5f6a7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
