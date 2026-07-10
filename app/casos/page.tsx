import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Pickaxe, Building2 } from "lucide-react"

export default function CasesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Casos verticales</p>
            <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Como industrias usan evidencia visual trazable.
            </h1>
            <p className="mt-4 text-pretty text-muted-foreground md:text-lg">
              Soluciones auditables para seguros, mineria, construccion y mas. Cada caso muestra impacto real.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="group rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary/50 hover:shadow-lg hover:bg-primary/5">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">Seguros</h3>
            <p className="text-muted-foreground mb-6">
              Detecta fraude visual en reclamaciones. Ajustadores pueden comparar fotos de siniestros contra
              documentacion previa en segundos y generar evidencia trazable.
            </p>

            <div className="space-y-4 mb-6 text-sm">
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="font-semibold text-foreground">Problema:</p>
                <p className="text-xs text-muted-foreground">
                  Reclamaciones con fotos similares a anteriores, dificil de detectar manualmente.
                </p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="font-semibold text-foreground">Solucion:</p>
                <p className="text-xs text-muted-foreground">
                  Comparacion automatica con score de similitud + registro auditable de cada analisis.
                </p>
              </div>
              <div className="rounded-lg bg-primary/5 border border-blue-500/30 p-3">
                <p className="font-semibold text-foreground">Resultado:</p>
                <p className="text-xs text-muted-foreground">
                  Decision respaldada por evidencia visual con timestamp, usuario y firma SHA256.
                </p>
              </div>
            </div>

            <Button asChild className="w-full">
              <Link href="/panel">
                Ver caso
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="group rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary/50 hover:shadow-lg hover:bg-primary/5">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Pickaxe className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">Mineria</h3>
            <p className="text-muted-foreground mb-6">
              Control de inventario de equipos criticos. Verifica que equipos reportados como disponibles no sean
              duplicados o reciclados multiples veces.
            </p>

            <div className="space-y-4 mb-6 text-sm">
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="font-semibold text-foreground">Problema:</p>
                <p className="text-xs text-muted-foreground">
                  Equipos "vendidos" reaparecen en inventario, dificil rastrear identidad visual de maquinas.
                </p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="font-semibold text-foreground">Solucion:</p>
                <p className="text-xs text-muted-foreground">
                  Crea registro visual de cada equipo, detecta similitudes con historico usando pHash perceptual.
                </p>
              </div>
              <div className="rounded-lg bg-primary/5 border border-blue-500/30 p-3">
                <p className="font-semibold text-foreground">Resultado:</p>
                <p className="text-xs text-muted-foreground">
                  Auditoria completa de cada comparacion para cumplimiento ISO y trazabilidad legal.
                </p>
              </div>
            </div>

            <Button asChild className="w-full">
              <Link href="/panel">
                Ver caso
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="group rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary/50 hover:shadow-lg hover:bg-primary/5">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">Construccion</h3>
            <p className="text-muted-foreground mb-6">
              Verifica cumplimiento de seguridad en obra. Inspecciones visuales automatizadas para EPP y normativa,
              todo documentado y auditable.
            </p>

            <div className="space-y-4 mb-6 text-sm">
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="font-semibold text-foreground">Problema:</p>
                <p className="text-xs text-muted-foreground">
                  Inspecciones manuales inconsistentes, dificil probar cumplimiento ante reguladores.
                </p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="font-semibold text-foreground">Solucion:</p>
                <p className="text-xs text-muted-foreground">
                  Analisis visual de fotos de obra para detectar incumplimiento (trabajadores sin EPP, riesgos
                  visibles).
                </p>
              </div>
              <div className="rounded-lg bg-primary/5 border border-blue-500/30 p-3">
                <p className="font-semibold text-foreground">Resultado:</p>
                <p className="text-xs text-muted-foreground">
                  Reporte auditable con evidencia visual que cumple regulacion en Chile, Peru y Colombia.
                </p>
              </div>
            </div>

            <Button asChild className="w-full">
              <Link href="/panel">
                Ver caso
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl font-semibold text-foreground">Como funciona</h2>
            <p className="text-muted-foreground mt-2">El flujo de un analisis trazable en cada industria.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="text-2xl font-bold text-primary mb-2">1</div>
              <p className="font-semibold text-foreground">Sube dos imagenes</p>
              <p className="text-sm text-muted-foreground mt-2">Foto actual vs documento historico o referencia.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="text-2xl font-bold text-primary mb-2">2</div>
              <p className="font-semibold text-foreground">Analisis instantaneo</p>
              <p className="text-sm text-muted-foreground mt-2">Comparacion visual, pHash perceptual y metadata EXIF.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="text-2xl font-bold text-primary mb-2">3</div>
              <p className="font-semibold text-foreground">Decision auditada</p>
              <p className="text-sm text-muted-foreground mt-2">Score + timestamp + usuario + firma SHA256 = evidencia legal.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-primary to-slate-900 p-12 text-center">
          <h2 className="text-3xl font-semibold text-white mb-4">Tu caso es el proximo.</h2>
          <p className="text-white/85 mb-8 max-w-2xl mx-auto">
            Comienza con una comparacion gratuita. Sin tarjeta de credito, sin compromiso. Descubre como evidencia
            visual trazable transformara tu operacion.
          </p>
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
            <Link href="/panel">
              Ir al panel
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
