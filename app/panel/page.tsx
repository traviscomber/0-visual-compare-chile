import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  GitCompareArrows,
  History,
  Home,
  Search,
  Settings,
  Upload,
} from "lucide-react"
import { BuildStamp } from "@/components/build/build-stamp"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const modules = [
  {
    title: "Comparar imagenes",
    description: "Sube dos imagenes y obten score, clasificacion y senales forenses.",
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
    description: "Explora busquedas y referencias de marcas.",
    icon: Search,
    href: "/consulta",
  },
]

export default function PanelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
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

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 md:p-10">
          <p className="mb-3 text-sm font-medium text-blue-400">MVP listo para piloto</p>
          <h1 className="max-w-3xl text-3xl font-bold text-white md:text-5xl">
            Panel operativo de comparacion visual, historial y consulta de marcas.
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            Esta vista resume el recorrido que ya quedo alineado con auth Supabase, uploads consistentes y navegacion
            protegida.
          </p>
          <div className="mt-4">
            <BuildStamp />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard">Ir al dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800">
              <Link href="/compare">Abrir comparador</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon
            return (
              <Link key={module.href} href={module.href}>
                <Card className="h-full border-slate-800 bg-slate-900/60 p-6 transition-colors hover:border-blue-500/50">
                  <Icon className="mb-4 h-8 w-8 text-blue-400" />
                  <h2 className="mb-2 text-lg font-semibold text-white">{module.title}</h2>
                  <p className="text-sm text-slate-400">{module.description}</p>
                </Card>
              </Link>
            )
          })}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="border-slate-800 bg-slate-900/60 p-6">
            <BarChart3 className="mb-4 h-8 w-8 text-teal-400" />
            <h3 className="mb-2 font-semibold text-white">Seguimiento</h3>
            <p className="text-sm text-slate-400">Historial y detalle listos para seguimiento operativo.</p>
          </Card>
          <Card className="border-slate-800 bg-slate-900/60 p-6">
            <Upload className="mb-4 h-8 w-8 text-teal-400" />
            <h3 className="mb-2 font-semibold text-white">Carga</h3>
            <p className="text-sm text-slate-400">Formatos JPG, PNG, WebP y TIFF hasta 50 MB.</p>
          </Card>
          <Card className="border-slate-800 bg-slate-900/60 p-6">
            <Settings className="mb-4 h-8 w-8 text-teal-400" />
            <h3 className="mb-2 font-semibold text-white">Deploy</h3>
            <p className="text-sm text-slate-400">Variables de entorno documentadas para Vercel y Supabase.</p>
          </Card>
        </div>
      </main>
    </div>
  )
}
