import Link from "next/link"
import { ArrowRight, Building2, Database, FlaskConical, Search, Tags } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const researchPaths = [
  {
    href: "/consulta-inapi",
    eyebrow: "Marca",
    title: "¿Qué marcas existen alrededor de este nombre?",
    description: "Busca antecedentes marcarios, titulares, estados y clases para entender qué debes revisar antes de avanzar.",
    icon: Tags,
  },
  {
    href: "/patentes",
    eyebrow: "Empresa",
    title: "¿Qué está haciendo esta empresa?",
    description: "Construye un perfil desde su cartera observada: actividad anual, tecnologías dominantes, inventores y últimos movimientos.",
    icon: Building2,
  },
  {
    href: "/patentes",
    eyebrow: "Tecnología",
    title: "¿Quién está activo en esta tecnología?",
    description: "Explora conceptos e IPC para encontrar solicitantes, expedientes y señales de actividad tecnológica.",
    icon: FlaskConical,
  },
  {
    href: "/patentes",
    eyebrow: "Patente / IPC",
    title: "¿Qué documentos y clasificaciones son relevantes?",
    description: "Busca expedientes por título, solicitante o IPC y profundiza en la evidencia disponible en el corpus INAPI.",
    icon: Search,
  },
]

export default function InvestigarPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="max-w-4xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <Database className="h-3.5 w-3.5" /> Investigación
        </div>
        <h1 className="text-4xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl lg:text-6xl">
          Empieza por la pregunta, no por la base de datos.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
          Visual Compare reúne marcas, patentes, empresas y tecnologías. Elige qué quieres entender y te llevamos a la vista adecuada sin pedirte que conozcas la arquitectura interna.
        </p>
      </header>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        {researchPaths.map((path) => {
          const Icon = path.icon
          return (
            <Link key={`${path.eyebrow}-${path.title}`} href={path.href} className="group">
              <Card className="h-full border-border transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg">
                <CardContent className="flex h-full flex-col p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary/50">
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="mt-8 text-sm font-medium text-muted-foreground">{path.eyebrow}</p>
                  <h2 className="mt-2 max-w-xl text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{path.title}</h2>
                  <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{path.description}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </section>

      <section className="mt-10 grid gap-4 border-t border-border pt-8 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h2 className="text-lg font-semibold text-foreground">¿Necesitas una búsqueda marcaria más técnica?</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">La base indexada y las herramientas avanzadas siguen disponibles; simplemente dejaron de competir con el recorrido principal.</p>
        </div>
        <Link href="/consulta" className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:underline">
          Abrir búsqueda avanzada <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  )
}
