'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LogOut, Search, Upload, BarChart3, Users, Settings, Home } from 'lucide-react'
import Link from 'next/link'

const ROLE_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  admin: { bg: 'bg-purple-500/10', text: 'text-purple-400', badge: 'bg-purple-500' },
  analista: { bg: 'bg-blue-500/10', text: 'text-blue-400', badge: 'bg-blue-500' },
  auditor: { bg: 'bg-amber-500/10', text: 'text-amber-400', badge: 'bg-amber-500' }
}

export default function DemoDashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const roleColors = ROLE_COLORS[user?.role || 'analista']

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  // Estadísticas según el rol
  const stats = [
    { label: 'Comparaciones realizadas', value: '42', icon: Search },
    { label: 'Marcas consultadas', value: '128', icon: Users },
    { label: 'Reportes generados', value: '15', icon: BarChart3 }
  ]

  // Módulos disponibles según el rol
  const modules = [
    {
      title: 'Comparador de Logos',
      description: 'Sube un logo y compáralo contra la base de datos',
      icon: Upload,
      href: '/comparador',
      available: ['admin', 'analista']
    },
    {
      title: 'Consulta de Marcas',
      description: 'Busca marcas registradas por nombre, Niza o Viena',
      icon: Search,
      href: '/consulta',
      available: ['admin', 'analista', 'auditor']
    },
    {
      title: 'Reportes y Auditoría',
      description: 'Accede al historial completo de búsquedas y comparaciones',
      icon: BarChart3,
      href: '/reportes',
      available: ['admin', 'auditor']
    },
    {
      title: 'Administración',
      description: 'Gestión de usuarios y configuración del sistema',
      icon: Settings,
      href: '/admin',
      available: ['admin']
    }
  ]

  const availableModules = modules.filter(m => m.available.includes(user?.role || 'analista'))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Home className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold text-white">Visual Compare</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              {user?.name || 'Demo User'} • <span className={`font-medium ${roleColors.text}`}>{user?.role || 'analista'}</span>
            </span>
            <Button
              onClick={handleLogout}
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <div className={`rounded-lg border border-slate-700 ${roleColors.bg} p-8 mb-8`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`h-3 w-3 rounded-full ${roleColors.badge}`} />
              <span className={`text-sm font-medium ${roleColors.text}`}>ROL: {(user?.role || 'analista').toUpperCase()}</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Bienvenido
            </h1>
            <p className="text-slate-300">
              Sistema de Comparación y Consulta de Marcas Registradas — Demo Fase 0
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <Card key={i} className="border-slate-700 bg-slate-800/50 p-6">
                <div className="flex items-center justify-between mb-3">
                  <Icon className="h-5 w-5 text-blue-400" />
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                </div>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </Card>
            )
          })}
        </div>

        {/* Modules Section */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Módulos disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableModules.map((module) => {
              const Icon = module.icon
              return (
                <Link
                  key={module.href}
                  href={module.href}
                  className="group"
                >
                  <Card className="border-slate-700 bg-slate-800/50 hover:border-blue-500/50 hover:bg-slate-800 p-6 h-full transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <Icon className="h-8 w-8 text-blue-400 group-hover:text-teal-400 transition-colors" />
                      <span className="text-xs font-medium text-slate-500 bg-slate-700 px-2 py-1 rounded">
                        {module.available.length > 1 ? `${module.available.length} roles` : 'Tu rol'}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{module.title}</h3>
                    <p className="text-sm text-slate-400 mb-4">{module.description}</p>
                    <div className="text-sm text-blue-400 group-hover:text-teal-400 transition-colors">
                      Acceder →
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>

          {availableModules.length === 0 && (
            <Card className="border-slate-700 bg-slate-800/50 p-8 text-center">
              <p className="text-slate-400">No hay módulos disponibles para tu rol.</p>
            </Card>
          )}
        </div>

        {/* Demo Info */}
        <div className="mt-12 p-6 rounded-lg border border-slate-700 bg-slate-800/30">
          <p className="text-xs text-slate-500 text-center">
            Demo Fase 0 — Los módulos enlazados son placeholders. Intenta cambiar de rol en login para ver cómo cambia la interfaz.
          </p>
        </div>
      </main>
    </div>
  )
}
