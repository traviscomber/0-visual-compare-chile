"use client"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, Home, Search, Settings, Zap, CheckCircle, Clock } from "lucide-react"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <header className="border-b border-white/10 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50 smooth-transition">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 smooth-transition">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Visual Compare</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              {user.name.split("@")[0]} • <span className="font-medium text-blue-400">Abogado</span>
            </span>
            <Button
              onClick={handleLogout}
              size="sm"
              variant="outline"
              className="border-white/20 text-slate-200 hover:bg-white/10 smooth-transition"
            >
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl font-bold text-white mb-3">
            Bienvenido,<br/><span className="gradient-text">{user.name.split("@")[0]}</span>
          </h1>
          <p className="text-slate-400 text-lg">Continúa registrando marcas en Chile</p>
        </div>

        {/* Main CTA Card */}
        <Link href="/agente">
          <div className="group bg-gradient-to-br from-blue-600 via-blue-600 to-purple-600 rounded-3xl border border-blue-400/40 p-8 md:p-12 cursor-pointer hover-lift smooth-transition mb-12 overflow-hidden relative">
            {/* Background glow effect */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 blur-3xl -z-10 group-hover:blur-2xl smooth-transition" />
            
            <div className="flex items-start justify-between gap-8">
              <div className="flex-1">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Analizar mi marca</h2>
                <p className="text-blue-100 text-lg leading-relaxed max-w-2xl">
                  Sube tu logo, ingresa el nombre y obtén análisis completo en menos de 3 minutos: disponibilidad real en INAPI, conflictos detectados y clasificación automática.
                </p>
              </div>
              <div className="hidden md:flex flex-shrink-0 animate-float">
                <Search className="w-20 h-20 text-blue-200 opacity-80 group-hover:opacity-100 smooth-transition" />
              </div>
            </div>

            {/* Features grid */}
            <div className="grid md:grid-cols-3 gap-4 mt-8 mb-8">
              {[
                { icon: CheckCircle, label: 'Disponible', desc: 'Verifica INAPI real' },
                { icon: Zap, label: 'Clasificaciones', desc: 'Viena + Niza' },
                { icon: Clock, label: 'Instantáneo', desc: '<3 minutos' }
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="bg-blue-500/20 rounded-xl p-4 border border-blue-300/30 backdrop-blur-sm group-hover:bg-blue-500/30 smooth-transition">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-blue-100" />
                      <div className="font-semibold text-blue-100">{item.label}</div>
                    </div>
                    <div className="text-sm text-blue-200">{item.desc}</div>
                  </div>
                )
              })}
            </div>

            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-8 gap-2 group-hover:translate-x-2 smooth-transition shadow-lg">
              Comenzar análisis
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </Link>

        {/* Quick Actions Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {[
            { href: '/settings', icon: Settings, title: 'Configuración', desc: 'Perfil, cuenta y preferencias' },
            { href: '/consulta', icon: Search, title: 'Consulta de marcas', desc: 'Busca marcas registradas en Chile' }
          ].map((item, i) => {
            const Icon = item.icon
            return (
              <Link key={i} href={item.href}>
                <Card className="border-white/10 bg-gradient-to-br from-slate-800/40 to-slate-800/20 hover:from-slate-800/60 hover:to-slate-800/40 p-6 cursor-pointer smooth-transition hover-lift group">
                  <div className="flex items-start justify-between mb-3">
                    <Icon className="w-8 h-8 text-blue-400 group-hover:scale-110 smooth-transition" />
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 smooth-transition" />
                  </div>
                  <h3 className="font-semibold text-white mb-1 text-lg">{item.title}</h3>
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 smooth-transition">{item.desc}</p>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Info stats */}
        <div className="grid grid-cols-3 gap-4 text-center text-sm text-slate-400">
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">0</div>
            <div>Análisis completados</div>
          </div>
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">∞</div>
            <div>Análisis disponibles</div>
          </div>
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="text-2xl font-bold text-green-400">100%</div>
            <div>Confidencialidad</div>
          </div>
        </div>
      </main>
    </div>
  )
}
