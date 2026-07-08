const cases = [
  {
    sector: "Seguros",
    description: "Fotos de siniestros, antes/después, evidencia duplicada en peritajes.",
  },
  {
    sector: "Minería",
    description: "Control visual de terreno, maquinaria y EPP — sin biometría.",
  },
  {
    sector: "Construcción",
    description: "Avance de obra, inspecciones técnicas y registros fotográficos auditables.",
  },
  {
    sector: "Municipalidades",
    description: "Fiscalización en terreno, trazabilidad DOM/SECPLA y registros territoriales.",
  },
  {
    sector: "Retail",
    description: "Control de catálogo, productos duplicados y verificación visual de SKU.",
  },
  {
    sector: "Inspecciones",
    description: "Validación visual de informes técnicos y evidencia de campo.",
  },
]

export function UseCases() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[--color-brand-teal]">Casos en Chile</p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Pensado para empresas chilenas con flujos visuales operativos.
            </h2>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            Aplicable en procesos donde la imagen es evidencia y donde una validación visual rápida agrega valor real.
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <div key={c.sector} className="group bg-card p-7 transition-all hover:bg-[--color-brand-teal]/5">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-[--color-brand-teal] group-hover:text-[--color-brand-teal-dark]">
                {c.sector}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-foreground">{c.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
