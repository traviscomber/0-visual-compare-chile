import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Shield, Database } from 'lucide-react'
import Link from 'next/link'

export function HeroMarcas() {
  return (
    <section className="relative min-h-[100vh] flex items-center pt-20 pb-12 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-6xl w-full">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div>
            <Badge
              variant="outline"
              className="mb-6 gap-2 rounded-full border-border bg-card px-3 py-1 text-xs font-medium text-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Plataforma MVP para marcas registradas en Chile
            </Badge>

            <h1 className="text-balance text-5xl font-bold leading-[1.1] tracking-tight text-foreground md:text-6xl">
              Protege tus marcas.
              <span className="block text-primary">Nosotros las analizamos.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Herramienta enfocada en el flujo real del MVP: carga, comparacion visual, historial y consulta de marcas.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="bg-primary hover:bg-primary/90 font-semibold" asChild>
                <Link href="/auth/sign-up">
                  Comenzar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#modulos">Ver modulos</Link>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {['Supabase Auth', 'Upload seguro', 'Historial', 'Consulta'].map((item) => (
                <span key={item} className="rounded-full border border-border bg-background/60 px-3 py-1 text-sm text-muted-foreground">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-slate-900/30 rounded-2xl blur-3xl" />
            <div className="relative rounded-2xl border border-blue-500/30 bg-primary/5 p-8 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-foreground">Visual Compare Chile</p>
                    <p className="text-sm text-muted-foreground">Comparacion visual y trazabilidad para uso operativo</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Database className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-foreground">Sistema de Consulta</p>
                    <p className="text-sm text-muted-foreground">Busqueda por clasificacion Niza y Viena con historial</p>
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
