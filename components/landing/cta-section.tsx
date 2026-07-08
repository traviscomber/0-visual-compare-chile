import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CtaSection() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-primary to-slate-900 p-10 md:p-14 shadow-lg">
          <div className="grid gap-8 md:grid-cols-[2fr_1fr] md:items-end">
            <div>
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Empieza tu primera comparación.
              </h2>
              <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-white/85 md:text-base">
                Crea una cuenta, sube dos imágenes y obtén un análisis técnico trazable. Protección de datos, cumplimiento legal,
                y auditoría completa para seguros, minería, construcción, municipios y retail.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col md:items-end">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold shadow-md">
                <Link href="/auth/sign-up">
                  Crear cuenta
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:text-white hover:border-white/40"
              >
                <Link href="#como-funciona">Ver cómo funciona</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
