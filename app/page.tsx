import { ClasificacionesNizaViena } from "@/components/landing/clasificaciones"
import { HeroMarcas } from "@/components/landing/hero-marcas"
import { ModulosIntegrales } from "@/components/landing/modulos-integrales"
import { SiteFooter } from "@/components/landing/site-footer"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <HeroMarcas />
      <ModulosIntegrales />
      <ClasificacionesNizaViena />
      <section className="border-t border-border bg-secondary/20 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-border bg-card p-8 md:p-10">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Roadmap real</p>
            <h2 className="mt-3 text-3xl font-bold text-foreground">
              Consulta, comparacion y trazabilidad como nucleo del MVP.
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
              La plataforma ya esta centrada en el flujo operativo: buscar marcas, comparar imagenes,
              conservar historial y usar Niza/Viena como contexto de decision.
            </p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
