import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function CTAMarcas() {
  return (
    <section className="border-t border-border bg-gradient-to-r from-blue-900/20 to-slate-900/20 py-20 px-6">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-4xl font-bold text-foreground">
          Protege tus marcas registradas con tecnología avanzada
        </h2>
        
        <p className="mt-6 text-lg text-muted-foreground">
          Comparación visual inteligente + auditoría completa + base de datos histórica del INAPI
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-primary hover:bg-primary/90 font-semibold" asChild>
            <Link href="/auth/sign-up">
              Comenzar Prueba Gratuita
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="mailto:contacto@logomcompare.cl">
              Contactar Ventas
            </Link>
          </Button>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Acceso inmediato a plataforma. Cero configuración requerida.
        </p>
      </div>
    </section>
  )
}
