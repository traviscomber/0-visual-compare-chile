"use client"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, GitCompareArrows, History, Home, Search, Settings, Upload } from "lucide-react"
import Link from "next/link"

const ROLE_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  admin: { bg: "bg-purple-500/10", text: "text-purple-400", badge: "bg-purple-500" },
  analista: { bg: "bg-blue-500/10", text: "text-blue-400", badge: "bg-blue-500" },
  auditor: { bg: "bg-amber-500/10", text: "text-amber-400", badge: "bg-amber-500" },
}

const modules = [
  {
    title: "Comparar imagenes",
    description: "Sube dos archivos y obten score, clasificacion y señales forenses.",
    icon: GitCompareArrows,
    href: "/compare",
    available: ["admin", "analista"],
  },
  {
    title: "Historial",
    description: "Revisa comparaciones previas con filtros y detalle por resultado.",
    icon: History,
    href: "/history",
    available: ["admin", "analista", "auditor"],
  },
  {
    title: "Consulta",
    description: "Explora la base de referencias y busquedas relacionadas.",
    icon: Search,
    href: "/consulta",
    available: ["admin", "analista", "auditor"],
  },
  {
    title: "Configuracion",
    description: "Gestiona perfil, sesion y datos de cuenta.",
    icon: Settings,
    href: "/settings",
    available: ["admin", "analista", "auditor"],
  },
]

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const role = user?.role || "analista"
  const roleColors = ROLE_COLORS[role]

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const availableModules = modules.filter((module) => module.available.includes(role))
  const summaryCards = [
    { label: "Comparaciones listas", value: "42", icon: GitCompareArrows },
    { label: "Historial consultable", value: "Si", icon: History },
    { label: "Carga soportada", value: "JPG, PNG, WebP, TIFF", icon: Upload },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Home className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold text-white">Visual Compare Chile</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              {user.name} • <span className={`font-medium ${roleColors.text}`}>{role}</span>
            </span>
            <Button
              onClick={handleLogout}
              size="sm"
              variant="outline"
              className="border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <div className={`rounded-2xl border border-slate-800 ${roleColors.bg} p-8`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`h-3 w-3 rounded-full ${roleColors.badge}`} />
              <span className={`text-sm font-medium ${roleColors.text}`}>MVP operativo</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Bienvenido, {user.name.split("@")[0]}
            </h1>
            <p className="text-slate-300 max-w-2xl">
              Desde aqui accedes al flujo principal del MVP: comparar imagenes, revisar historial y ajustar tu cuenta.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/compare">
                  Nueva comparacion
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800">
                <Link href="/history">Ver historial</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {summaryCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="border-slate-800 bg-slate-900/60 p-6">
                <div className="flex items-center justify-between mb-3">
                  <Icon className="h-5 w-5 text-blue-400" />
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                </div>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </Card>
            )
          })}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Modulos disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableModules.map((module) => {
              const Icon = module.icon
              return (
                <Link key={module.href} href={module.href} className="group">
                  <Card className="border-slate-800 bg-slate-900/60 hover:border-blue-500/50 hover:bg-slate-900 p-6 h-full transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <Icon className="h-8 w-8 text-blue-400 group-hover:text-cyan-400 transition-colors" />
                      <span className="text-xs font-medium text-slate-500 bg-slate-800 px-2 py-1 rounded">
                        {module.available.length > 1 ? `${module.available.length} roles` : "Tu rol"}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{module.title}</h3>
                    <p className="text-sm text-slate-400 mb-4">{module.description}</p>
                    <div className="text-sm text-blue-400 group-hover:text-cyan-400 transition-colors">
                      Acceder &rarr;
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
