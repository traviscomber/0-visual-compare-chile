"use client"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, Home, Search, Settings } from "lucide-react"
import Link from "next/link"



export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()

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

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Welcome */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Bienvenido, {user.name.split("@")[0]}
          </h1>
          <p className="text-slate-400 text-lg">Comienza a registrar marcas en Chile</p>
        </div>

        {/* SINGLE PROMINENT CARD */}
        <Link href="/agente">
          <div className="group bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 rounded-2xl border border-blue-500/50 p-12 cursor-pointer hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20 transition-all mb-12">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-4xl font-bold text-white mb-3">Analizar mi marca</h2>
                <p className="text-blue-100 text-lg max-w-2xl">
                  Sube tu logo, ingresa el nombre y obtén análisis completo: disponibilidad en Chile, conflictos con marcas existentes, y clasificación automática.
                </p>
              </div>
              <Search className="w-12 h-12 text-blue-200 shrink-0 group-hover:scale-110 transition-transform" />
            </div>

            {/* What you get */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
                <div className="font-semibold text-blue-100 mb-1">✓ Disponible</div>
                <div className="text-sm text-blue-200">Verifica INAPI en tiempo real</div>
              </div>
              <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
                <div className="font-semibold text-blue-100 mb-1">Clasificaciones</div>
                <div className="text-sm text-blue-200">Viena + Niza automáticamente</div>
              </div>
              <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
                <div className="font-semibold text-blue-100 mb-1">Conflictos</div>
                <div className="text-sm text-blue-200">Marcas similares detectadas</div>
              </div>
            </div>

            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 gap-2 group-hover:translate-x-1 transition-transform">
              Comenzar análisis
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </Link>

        {/* Quick links */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/settings">
            <Card className="border-slate-700 bg-slate-900/40 hover:bg-slate-900/60 p-6 cursor-pointer transition-all">
              <Settings className="w-6 h-6 text-slate-400 mb-3" />
              <h3 className="font-semibold text-white mb-1">Configuración</h3>
              <p className="text-sm text-slate-400">Gestiona tu perfil y cuenta</p>
            </Card>
          </Link>
          <Link href="/consulta">
            <Card className="border-slate-700 bg-slate-900/40 hover:bg-slate-900/60 p-6 cursor-pointer transition-all">
              <Search className="w-6 h-6 text-slate-400 mb-3" />
              <h3 className="font-semibold text-white mb-1">Consulta de marcas</h3>
              <p className="text-sm text-slate-400">Busca marcas registradas</p>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}
