import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Database, Eye } from "lucide-react"
import Link from "next/link"

export function HeroFase0() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-20 md:py-32">
      {/* Background accent */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-8 flex justify-center">
          <Badge variant="outline" className="border-blue-400/30 bg-blue-500/10 text-blue-300">
            Sistema de Marcas Registradas — Fase 0
          </Badge>
        </div>

        <h1 className="text-balance text-center text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
          Comparación de Logos + Consulta de Marcas
        </h1>

        <p className="text-balance text-center text-lg text-slate-300 max-w-2xl mx-auto mb-8">
          Plataforma de gestión de propiedad intelectual. Comparación visual de logos, consulta de marcas registradas (INAPI), clasificaciones Niza y Viena.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/auth/login">
              Entrar a Demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
            <Link href="#features">Conocer más</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-2xl mx-auto mb-16">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-1">350K+</div>
            <div className="text-sm text-slate-400">Marcas registradas</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-teal-400 mb-1">45</div>
            <div className="text-sm text-slate-400">Clases Niza</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-1">29</div>
            <div className="text-sm text-slate-400">Categorías Viena</div>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm">
            <Shield className="h-8 w-8 text-blue-400 mb-4" />
            <h3 className="font-semibold text-white mb-2">Comparador Visual</h3>
            <p className="text-sm text-slate-400">Sube un logo y compáralo contra la galería. Obtén similitud visual instantánea.</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm">
            <Database className="h-8 w-8 text-teal-400 mb-4" />
            <h3 className="font-semibold text-white mb-2">Base de Marcas</h3>
            <p className="text-sm text-slate-400">Consulta marcas por nombre, registro, solicitante, Niza o Viena.</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm">
            <Eye className="h-8 w-8 text-blue-400 mb-4" />
            <h3 className="font-semibold text-white mb-2">Auditoría Completa</h3>
            <p className="text-sm text-slate-400">Historial de búsquedas, exportación de resultados, trazabilidad.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
