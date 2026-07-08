import { FileCheck, Image as ImageIcon, Search, ShieldCheck } from "lucide-react"

const features = [
  {
    icon: ImageIcon,
    title: "Comparación visual de imágenes",
    description: "Sube dos imágenes y obtén un score de similitud claro, con clasificación y recomendación.",
  },
  {
    icon: Search,
    title: "Detección de duplicados",
    description: "Identifica copias exactas y casi idénticas para validar evidencia y evitar fraudes.",
  },
  {
    icon: FileCheck,
    title: "Trazabilidad operacional",
    description: "Cada comparación queda registrada con su evidencia, score y firma técnica.",
  },
  {
    icon: ShieldCheck,
    title: "Almacenamiento privado",
    description: "Las imágenes se guardan en un bucket privado, accesible solo para tu cuenta.",
  },
]

export function WhatItDoes() {
  return (
    <section className="border-b border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[--color-brand-teal]">Qué hace</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Una herramienta enfocada y operativa, no un juguete de IA.
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Visual Compare Chile entrega comparaciones técnicas auditables con un foco claro: similitud visual,
            duplicados y trazabilidad de evidencia.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-[--color-brand-teal]/50 hover:shadow-md hover:bg-[--color-brand-teal]/5">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[--color-brand-teal]/10 text-[--color-brand-teal] transition-colors group-hover:bg-[--color-brand-teal]/20">
                <f.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
