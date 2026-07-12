import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Shield, Zap, Search, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export function HeroMarcas() {
  return (
    <section className="relative min-h-[100vh] flex items-center pt-20 pb-12 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-6xl w-full">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div>
            <Badge
              variant="outline"
              className="mb-6 gap-2 rounded-full border-border bg-card px-4 py-1.5 text-xs font-medium text-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              MVP operativo &middot; Chile &middot; 350K+ marcas
            </Badge>

            <h1 className="text-balance text-5xl font-bold leading-[1.08] tracking-tight text-foreground md:text-6xl lg:text-7xl">
              Protege tus marcas.
              <span className="block text-primary mt-1">Nosotros las analizamos.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Plataforma de comparaci&oacute;n visual para abogados de PI, examinadores y titulares de marcas en Chile. Detectamos similitudes en milisegundos con precisi&oacute;n legal.
            </p>

            {/* Value props */}
            <ul className="mt-6 space-y-2">
              {[
                'An\u00e1lisis h\u00edbrido: SHA-256 + pHash + embeddings visuales',
                'Consulta de 350K+ registros de marcas chilenas',
                'Historial trazable y exportable para expedientes legales',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="bg-primary hover:bg-primary/90 font-semibold shadow-lg shadow-primary/20" asChild>
                <Link href="/auth/sign-up">
                  Comenzar gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/consulta">Consultar marcas</Link>
              </Button>
            </div>

            {/* Stats row */}
            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-8">
              {[
                { value: '<100ms', label: 'Latencia P95' },
                { value: '350K+', label: 'Marcas en base' },
                { value: '99.9%', label: 'Uptime SLA' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Product mockup */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-slate-900/20 rounded-3xl blur-3xl" />
            <div className="relative rounded-2xl border border-border bg-card/30 p-2 backdrop-blur-sm shadow-2xl shadow-primary/5">
              <Image
                src="/images/brand-comparison-hero.png"
                alt="Panel de comparaci&oacute;n visual de marcas mostrando similitud del 94% entre dos logos"
                width={640}
                height={480}
                className="w-full rounded-xl"
                priority
              />
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 glass rounded-xl px-4 py-3 border border-border shadow-xl">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Protecci&oacute;n activa</p>
                    <p className="text-xs text-muted-foreground">Clasificaciones Niza &amp; Viena</p>
                  </div>
                </div>
              </div>
              {/* Floating speed badge */}
              <div className="absolute -top-4 -right-4 glass rounded-xl px-4 py-3 border border-border shadow-xl">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-400" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Resultado en</p>
                    <p className="text-lg font-bold text-primary">&lt;100ms</p>
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
