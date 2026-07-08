const steps = [
  {
    n: "01",
    title: "Sube dos imágenes",
    description: "Formatos JPG, PNG, WEBP o TIFF, hasta 50 MB. Las imágenes se guardan cifradas en almacenamiento privado.",
  },
  {
    n: "02",
    title: "Análisis técnico",
    description: "Calculamos hash criptográfico, hash perceptual, dimensiones y metadatos clave de cada imagen.",
  },
  {
    n: "03",
    title: "Score y clasificación",
    description: "Obtienes un score 0–100, una clasificación clara y una recomendación lista para auditar.",
  },
  {
    n: "04",
    title: "Historial trazable",
    description: "Cada comparación queda registrada con su evidencia y resultado JSON para revisión humana.",
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="border-b border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[--color-brand-teal]">Cómo funciona</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Cuatro pasos simples para evidencia visual confiable.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-[--color-brand-teal]/50 hover:shadow-md">
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="font-mono text-base font-bold tracking-wider text-[--color-brand-teal] group-hover:text-[--color-brand-teal-dark]">{s.n}</p>
                <div className="inline-flex h-1 w-8 rounded-full bg-[--color-brand-teal]/30 group-hover:bg-[--color-brand-teal]"></div>
              </div>
              <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
