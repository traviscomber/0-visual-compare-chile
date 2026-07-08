import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, Database as DatabaseIcon } from "lucide-react"
import Link from "next/link"

export function ModulosIntegrales() {
  return (
    <section className="border-t border-border bg-secondary/30 py-20 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold text-foreground">Dos Módulos Integrados</h2>
          <p className="mt-3 text-lg text-muted-foreground">Solución completa para comparación, auditoría y consulta de marcas</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Visual Compare Chile */}
          <Card className="border-border bg-card p-8 hover:shadow-lg transition-shadow">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Zap className="h-6 w-6" />
            </div>
            
            <h3 className="text-2xl font-semibold text-foreground mb-3">Visual Compare Chile</h3>
            <p className="text-muted-foreground mb-6">
              Plataforma de similitud y auditoría de marcas registradas
            </p>

            <div className="space-y-3 mb-6 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span className="text-muted-foreground">Comparación visual con SHA-256, pHash y diff visual</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span className="text-muted-foreground">Score de similitud y recomendación auditada</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span className="text-muted-foreground">Auditoría completa (usuario, timestamp, decisión)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span className="text-muted-foreground">Gestión de usuarios con roles diferenciados</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span className="text-muted-foreground">Ciclo DEV → QA → Producción automático</span>
              </div>
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link href="#tecnologia">
                Conocer arquitectura
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </Card>

          {/* Sistema de Consulta */}
          <Card className="border-border bg-card p-8 hover:shadow-lg transition-shadow">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <DatabaseIcon className="h-6 w-6" />
            </div>
            
            <h3 className="text-2xl font-semibold text-foreground mb-3">Sistema de Consulta</h3>
            <p className="text-muted-foreground mb-6">
              Base de datos integral de marcas registradas Chile
            </p>

            <div className="space-y-3 mb-6 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span className="text-muted-foreground">Historial de comparaciones y resultados</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span className="text-muted-foreground">Consulta por nombre, Niza y Viena</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span className="text-muted-foreground">Rutas protegidas por sesión Supabase</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span className="text-muted-foreground">Carga de JPG, PNG, WebP y TIFF hasta 50 MB</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span className="text-muted-foreground">Supabase Postgres + Storage privado</span>
              </div>
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link href="#clasificaciones">
                Ver clasificaciones
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </Card>
        </div>
      </div>
    </section>
  )
}
