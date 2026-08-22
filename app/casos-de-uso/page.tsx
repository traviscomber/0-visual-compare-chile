import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Pickaxe, Building2 } from "lucide-react"

export default function UseCasesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-secondary/40"><div className="mx-auto max-w-6xl px-6 py-16"><div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Casos de uso históricos</p><h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">Evidencia visual trazable aplicada a distintas industrias.</h1><p className="mt-4 text-pretty text-muted-foreground md:text-lg">Ejemplos de aplicaciones verticales del motor visual original de Visual Compare.</p></div></div></div>
      <div className="mx-auto max-w-6xl px-6 py-20"><div className="grid gap-8 md:grid-cols-3">
        {[
          { icon: Shield, title: "Seguros", copy: "Comparación de evidencia visual para apoyar revisión de reclamaciones y antecedentes." },
          { icon: Pickaxe, title: "Minería", copy: "Trazabilidad visual de equipos e inventario para detectar reutilización o duplicidad de evidencia." },
          { icon: Building2, title: "Construcción", copy: "Registro visual auditable de condiciones de obra y cumplimiento operativo." },
        ].map(({icon:Icon,title,copy})=><div key={title} className="rounded-2xl border border-border bg-card p-8"><div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-foreground"><Icon className="h-6 w-6"/></div><h2 className="text-2xl font-semibold text-foreground">{title}</h2><p className="mt-3 text-muted-foreground">{copy}</p><Button asChild variant="outline" className="mt-6 w-full"><Link href="/">Volver a Visual Compare<ArrowRight className="ml-2 h-4 w-4"/></Link></Button></div>)}
      </div></div>
    </div>
  )
}
