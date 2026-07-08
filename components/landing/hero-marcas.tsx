import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Database } from "lucide-react"
import Link from "next/link"

export function HeroMarcas() {
  return (
    <section className="relative min-h-[100vh] flex items-center pt-20 pb-12 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-transparent" />
      
      <div className="relative mx-auto max-w-6xl w-full">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div>
            <Badge
              variant="outline"
              className="mb-6 gap-2 rounded-full border-border bg-secondary px-3 py-1 text-xs font-medium text-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Plataforma integral para marcas registradas Chile
            </Badge>
            
            <h1 className="text-balance text-5xl font-bold leading-[1.1] tracking-tight text-foreground md:text-6xl">
              Sistema de <span className="text-primary">Comparación, Auditoría y Consulta</span> de Marcas Registradas
            </h1>
            
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Herramienta integral para protección de propiedad intelectual en Chile. Comparación visual de logos, gestión de clasificaciones Niza y Viena, consulta del histórico de INAPI y auditoría completa de decisiones.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="bg-primary hover:bg-primary/90 font-semibold" asChild>
                <Link href="/auth/sign-up">
                  Comenzar Ahora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#modulos">
                  Conocer más
                </Link>
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold text-primary">350k+</p>
                <p className="text-xs text-muted-foreground">Marcas registradas Chile</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">45</p>
                <p className="text-xs text-muted-foreground">Clases Niza</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">29</p>
                <p className="text-xs text-muted-foreground">Categorías Viena</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-slate-900/30 rounded-2xl blur-3xl" />
            <div className="relative rounded-2xl border border-blue-500/30 bg-primary/5 p-8 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-foreground">LogoCompare</p>
                    <p className="text-sm text-muted-foreground">Comparación visual con IA para detectar similitud de logos</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Database className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-foreground">Sistema de Consulta</p>
                    <p className="text-sm text-muted-foreground">Base de datos histórica INAPI + clasificaciones Niza/Viena</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
