import Link from "next/link"
import { ArrowRight, Database as DatabaseIcon, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function ModulosIntegrales() {
  return (
    <section id="modulos" className="border-t border-border bg-secondary/30 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold text-foreground">Dos modulos integrados</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Solucion completa para comparacion, auditoria y consulta de marcas.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card className="border-border bg-card p-8 transition-shadow hover:shadow-lg">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Zap className="h-6 w-6" />
            </div>

            <h3 className="mb-3 text-2xl font-semibold text-foreground">Visual Compare Chile</h3>
            <p className="mb-6 text-muted-foreground">Plataforma de similitud y auditoria de marcas registradas.</p>

            <div className="mb-6 space-y-3 text-sm">
              <Bullet>Comparacion visual con SHA-256, pHash y diff visual</Bullet>
              <Bullet>Score de similitud y recomendacion auditada</Bullet>
              <Bullet>Auditoria completa por usuario, timestamp y decision</Bullet>
              <Bullet>Gestion de usuarios con roles diferenciados</Bullet>
              <Bullet>Ciclo DEV -&gt; QA -&gt; Produccion automatico</Bullet>
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link href="#tecnologia">
                Conocer arquitectura
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </Card>

          <Card className="border-border bg-card p-8 transition-shadow hover:shadow-lg">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <DatabaseIcon className="h-6 w-6" />
            </div>

            <h3 className="mb-3 text-2xl font-semibold text-foreground">Sistema de consulta</h3>
            <p className="mb-6 text-muted-foreground">Base de datos operativa de marcas registradas en Chile.</p>

            <div className="mb-6 space-y-3 text-sm">
              <Bullet>Historial de comparaciones y resultados</Bullet>
              <Bullet>Consulta por nombre, Niza y Viena</Bullet>
              <Bullet>Rutas protegidas por sesion Supabase</Bullet>
              <Bullet>Carga de JPG, PNG, WebP y TIFF hasta 50 MB</Bullet>
              <Bullet>Supabase Postgres + Storage privado</Bullet>
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

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="font-bold text-primary">-</span>
      <span className="text-muted-foreground">{children}</span>
    </div>
  )
}
