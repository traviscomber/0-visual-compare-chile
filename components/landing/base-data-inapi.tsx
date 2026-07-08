import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, TrendingUp, FileText } from "lucide-react"
import Link from "next/link"

export function BaseDataINAPI() {
  return (
    <section className="border-t border-border bg-secondary/30 py-20 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-foreground">Base de Datos Histórica INAPI</h2>
          <p className="mt-3 text-lg text-muted-foreground">Datos registrados desde 2009 a la fecha</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <Card className="border-border bg-card p-6">
            <Calendar className="h-8 w-8 text-primary mb-4" />
            <p className="font-semibold text-foreground">Histórico Completo</p>
            <p className="text-sm text-muted-foreground mt-2">
              Registros desde 2009 a 2025 extraídos de archivos INAPI
            </p>
          </Card>

          <Card className="border-border bg-card p-6">
            <TrendingUp className="h-8 w-8 text-primary mb-4" />
            <p className="font-semibold text-foreground">Actualización Mensual</p>
            <p className="text-sm text-muted-foreground mt-2">
              5,000 nuevas imágenes y registros mensuales desde INAPI
            </p>
          </Card>

          <Card className="border-border bg-card p-6">
            <FileText className="h-8 w-8 text-primary mb-4" />
            <p className="font-semibold text-foreground">350,000+ Marcas</p>
            <p className="text-sm text-muted-foreground mt-2">
              Cobertura completa de marcas registradas en Chile
            </p>
          </Card>
        </div>

        <div className="rounded-xl border border-border bg-card p-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Información Disponible</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span className="text-muted-foreground">Nombre de marca y solicitante</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span className="text-muted-foreground">Número de solicitud y fecha</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span className="text-muted-foreground">Estado del trámite (en proceso, concedida, denegada)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span className="text-muted-foreground">Clasificaciones Niza asignadas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span className="text-muted-foreground">Elementos Viena identificados</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span className="text-muted-foreground">Imagen del logo/marca registrada</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Marco Legal</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Toda la información se maneja bajo regulación chilena:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span className="text-muted-foreground">Ley N° 19.039 (Propiedad Industrial)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span className="text-muted-foreground">Regulación INAPI para protección de derechos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span className="text-muted-foreground">Conformidad con OMPI (Niza y Viena)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span className="text-muted-foreground">Auditabilidad completa de accesos</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 rounded-xl border border-blue-500/30 bg-primary/5 p-8">
          <h3 className="text-lg font-semibold text-foreground mb-2">Acceso a INAPI</h3>
          <p className="text-muted-foreground mb-6">
            Consulta directa a base de datos oficial en https://www.inapi.cl/ para validación y actualización de registros
          </p>
          <Button asChild>
            <Link href="https://www.inapi.cl/" target="_blank">
              Ir a plataforma INAPI
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
