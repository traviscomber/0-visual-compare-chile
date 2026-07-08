import Link from "next/link"
import { ArrowRight, GitCompareArrows, History, ShieldCheck, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SiteHeader } from "@/components/landing/site-header"
import { HeroFase0 } from "@/components/landing/hero-fase0"
import { WhatItDoes } from "@/components/landing/what-it-does"
import { SiteFooter } from "@/components/landing/site-footer"

const steps = [
  {
    icon: Upload,
    title: "1. Carga",
    description: "Sube JPG, PNG, WebP o TIFF hasta 50 MB desde el flujo de comparación.",
  },
  {
    icon: GitCompareArrows,
    title: "2. Compara",
    description: "Revisa score, clasificación, diff visual y señales forenses.",
  },
  {
    icon: History,
    title: "3. Audita",
    description: "Consulta historial y detalle por comparación para seguimiento operativo.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <HeroFase0 />
      <WhatItDoes />

      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[--color-brand-teal]">Flujo MVP</p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Un recorrido corto para pilotear sin fricción.
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground">
              La experiencia está enfocada en la comparación técnica y la trazabilidad. Nada más.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <Card key={step.title} className="border-border bg-card p-6">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[--color-brand-teal]/10 text-[--color-brand-teal]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </Card>
              )
            })}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild className="bg-[--color-brand-teal] hover:bg-[--color-brand-teal-dark]">
              <Link href="/auth/sign-up">
                Crear cuenta
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/demo">Ver demo comercial</Link>
            </Button>
          </div>

          <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-[--color-brand-teal]" />
            <span>Auth Supabase, upload consistente y historial protegido.</span>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
