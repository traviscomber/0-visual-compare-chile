'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronDown, Upload, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function FrontendShowcase() {
  const [expandedCompare, setExpandedCompare] = useState(false)
  const [expandedSearch, setExpandedSearch] = useState(false)

  return (
    <section id="trabajos" className="py-24 relative z-10 border-t border-blue-500/20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-16">
          <div className="inline-block mb-6">
            <span className="text-xs font-bold text-purple-300 bg-purple-900/50 px-4 py-2 rounded-lg">TRABAJOS IMPLEMENTADOS</span>
          </div>
          <h2 className="text-5xl font-bold text-white mb-4">Frontend del MVP</h2>
          <p className="text-xl text-blue-200 max-w-2xl leading-relaxed">
            Dos superficies funcionales para comparar y consultar marcas con un flujo simple y consistente.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-900/30 via-transparent to-transparent rounded-2xl blur-xl -z-10" />
            <div className="glass p-8 rounded-2xl border border-blue-500/50 bg-gradient-to-br from-blue-900/20 to-slate-900/50 backdrop-blur-xl">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Compare Workbench</h3>
                  <p className="text-sm text-blue-300">Motor de comparacion visual</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-blue-400" />
                </div>
              </div>

              <p className="text-blue-100 mb-6">
                Interfaz para cargar dos imagenes, revisar similitud y dejar trazabilidad del resultado.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-blue-400 font-bold">▸</span>
                  <span className="text-sm text-blue-100"><strong>Upload Manager:</strong> Carga por arrastrar y soltar</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-400 font-bold">▸</span>
                  <span className="text-sm text-blue-100"><strong>Dual Panel:</strong> Vista lado a lado</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-400 font-bold">▸</span>
                  <span className="text-sm text-blue-100"><strong>Comparison Result:</strong> Analisis visual de similitud</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-400 font-bold">▸</span>
                  <span className="text-sm text-blue-100"><strong>Processing:</strong> Respuesta rapida con validacion consistente</span>
                </div>
              </div>

              <button
                onClick={() => setExpandedCompare(!expandedCompare)}
                className="w-full flex items-center justify-between p-4 mb-6 rounded-lg bg-blue-900/20 border border-blue-500/30 hover:border-blue-600/50 transition-all"
              >
                <span className="text-sm font-semibold text-blue-300">Leer mas</span>
                <ChevronDown className={`h-4 w-4 text-blue-300 transition-transform ${expandedCompare ? 'rotate-180' : ''}`} />
              </button>

              {expandedCompare && (
                <div className="space-y-4 mb-6 p-4 rounded-lg bg-blue-900/10 border border-blue-500/20">
                  <div>
                    <h4 className="text-sm font-bold text-blue-300 mb-2">Funcionalidades</h4>
                    <ul className="space-y-1 text-sm text-blue-100">
                      <li>Carga de imagenes JPG, PNG y WebP</li>
                      <li>Validacion de formato y tamano</li>
                      <li>Almacenamiento en Vercel Blob</li>
                      <li>Endpoint /api/compare con metodos consistentes</li>
                      <li>Scoring hibrido alineado al MVP</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-300 mb-2">Stack Tecnico</h4>
                    <ul className="space-y-1 text-sm text-blue-100">
                      <li>React + TypeScript</li>
                      <li>Next.js App Router</li>
                      <li>Tailwind CSS</li>
                      <li>SHA-256 + pHash</li>
                      <li>Vercel Blob Storage</li>
                    </ul>
                  </div>
                </div>
              )}

              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0">
                <Link href="/compare" className="flex items-center justify-center gap-2">
                  Abrir comparador
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-900/30 via-transparent to-transparent rounded-2xl blur-xl -z-10" />
            <div className="glass p-8 rounded-2xl border border-purple-500/50 bg-gradient-to-br from-purple-900/20 to-slate-900/50 backdrop-blur-xl">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Search Portal</h3>
                  <p className="text-sm text-purple-300">Portal de consulta de marcas</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-purple-500/20 border border-purple-500/50 flex items-center justify-center">
                  <Search className="h-5 w-5 text-purple-400" />
                </div>
              </div>

              <p className="text-blue-100 mb-6">
                Buscador con filtros por nombre, clasificacion Niza, clasificacion Viena e historial de consultas.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold">▸</span>
                  <span className="text-sm text-blue-100"><strong>Search:</strong> Busqueda por nombre y clasificacion</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold">▸</span>
                  <span className="text-sm text-blue-100"><strong>Filters:</strong> Niza y Viena</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold">▸</span>
                  <span className="text-sm text-blue-100"><strong>Export:</strong> CSV y JSON</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold">▸</span>
                  <span className="text-sm text-blue-100"><strong>Audit Trail:</strong> Historial de consultas y resultados</span>
                </div>
              </div>

              <button
                onClick={() => setExpandedSearch(!expandedSearch)}
                className="w-full flex items-center justify-between p-4 mb-6 rounded-lg bg-blue-900/20 border border-purple-500/30 hover:border-blue-600/50 transition-all"
              >
                <span className="text-sm font-semibold text-purple-300">Leer mas</span>
                <ChevronDown className={`h-4 w-4 text-purple-300 transition-transform ${expandedSearch ? 'rotate-180' : ''}`} />
              </button>

              {expandedSearch && (
                <div className="space-y-4 mb-6 p-4 rounded-lg bg-blue-900/10 border border-purple-500/20">
                  <div>
                    <h4 className="text-sm font-bold text-purple-300 mb-2">Funcionalidades</h4>
                    <ul className="space-y-1 text-sm text-blue-100">
                      <li>Modulos de consulta y auditoria</li>
                      <li>Busqueda por nombre</li>
                      <li>Filtros Niza y Viena</li>
                      <li>Export CSV y JSON</li>
                      <li>Favoritos e historial</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-purple-300 mb-2">Stack Tecnico</h4>
                    <ul className="space-y-1 text-sm text-blue-100">
                      <li>React + TypeScript</li>
                      <li>Next.js App Router</li>
                      <li>Fuse.js</li>
                      <li>Base de datos indexada para consultas</li>
                      <li>Tailwind CSS</li>
                    </ul>
                  </div>
                </div>
              )}

              <Button asChild className="w-full bg-blue-500 hover:bg-blue-600 text-white border-0">
                <Link href="/consulta" className="flex items-center justify-center gap-2">
                  Abrir portal
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass p-6 rounded-xl border border-gray-700/50 bg-gradient-to-br from-blue-900/10 to-transparent text-center">
            <p className="text-blue-200 text-sm mb-1">Comparaciones procesadas</p>
            <p className="text-3xl font-bold text-blue-300">MVP</p>
          </div>
          <div className="glass p-6 rounded-xl border border-gray-700/50 bg-gradient-to-br from-purple-900/10 to-transparent text-center">
            <p className="text-blue-200 text-sm mb-1">Marcas consultables</p>
            <p className="text-3xl font-bold text-purple-300">Indexadas</p>
          </div>
          <div className="glass p-6 rounded-xl border border-gray-700/50 bg-gradient-to-br from-purple-900/10 to-transparent text-center">
            <p className="text-blue-200 text-sm mb-1">Latencia objetivo</p>
            <p className="text-3xl font-bold text-purple-300">Consistente</p>
          </div>
        </div>
      </div>
    </section>
  )
}
