import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, BarChart3, GitCompareArrows, History, Home, Settings, Search, Upload } from "lucide-react"

const modules = [
  {
    title: "Comparar imágenes",
    description: "Sube dos imágenes y obtén score, clasificación y señales forenses.",
    icon: GitCompareArrows,
    href: "/compare",
  },
  {
    title: "Historial",
    description: "Revisa comparaciones previas y abre el detalle de cada resultado.",
    icon: History,
    href: "/history",
  },
  {
    title: "Consulta",
    description: "Explora búsquedas y referencias de marcas.",
    icon: Search,
    href: "/consulta",
  },
]

export default function PanelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Home className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold text-white">Visual Compare Chile</span>
          </Link>
          <Button asChild>
            <Link href="/auth/login">
              Entrar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 md:p-10 mb-10">
          <p className="text-sm font-medium text-blue-400 mb-3">MVP listo para piloto</p>
          <h1 className="text-3xl md:text-5xl font-bold text-white max-w-3xl">
            Panel operativo de comparación visual, historial y consulta de marcas.
          </h1>
          <p className="text-slate-300 mt-4 max-w-2xl">
            Esta vista resume el recorrido que ya quedó alineado con auth Supabase, uploads consistentes y
            navegación protegida.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard">Ir al dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800">
              <Link href="/compare">Abrir comparador</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modules.map((module) => {
            const Icon = module.icon
            return (
              <Link key={module.href} href={module.href}>
                <Card className="h-full border-slate-800 bg-slate-900/60 p-6 hover:border-blue-500/50 transition-colors">
                  <Icon className="h-8 w-8 text-blue-400 mb-4" />
                  <h2 className="text-lg font-semibold text-white mb-2">{module.title}</h2>
                  <p className="text-sm text-slate-400">{module.description}</p>
                </Card>
              </Link>
            )
          })}
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-800 bg-slate-900/60 p-6">
            <BarChart3 className="h-8 w-8 text-teal-400 mb-4" />
            <h3 className="text-white font-semibold mb-2">Seguimiento</h3>
            <p className="text-sm text-slate-400">Historial y detalle listos para seguimiento operativo.</p>
          </Card>
          <Card className="border-slate-800 bg-slate-900/60 p-6">
            <Upload className="h-8 w-8 text-teal-400 mb-4" />
            <h3 className="text-white font-semibold mb-2">Carga</h3>
            <p className="text-sm text-slate-400">Formatos JPG, PNG, WebP y TIFF hasta 50 MB.</p>
          </Card>
          <Card className="border-slate-800 bg-slate-900/60 p-6">
            <Settings className="h-8 w-8 text-teal-400 mb-4" />
            <h3 className="text-white font-semibold mb-2">Deploy</h3>
            <p className="text-sm text-slate-400">Variables de entorno documentadas para Vercel y Supabase.</p>
          </Card>
        </div>
      </main>
    </div>
  )
}
