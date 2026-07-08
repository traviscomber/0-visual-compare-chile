'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Shield, Settings } from 'lucide-react'
import Link from 'next/link'
import { Marca } from '@/types/marca'
import {
  LoadDBModule,
  SearchModule,
  VisualizationModule,
  UtilitiesModule
} from '@/components/consulta/modules'
import { useSearch } from '@/hooks/useSearch'

// Demo data
const MARCAS_DEMO: Marca[] = [
  {
    id: '1',
    nombre: 'VISUAL COMPARE',
    solicitante: 'Visual Compare Ltd',
    numeroRegistro: '4020230615001',
    niza: ['42', '35'],
    viena: ['26.03.01'],
    estado: 'Registrada',
    fecha: '2023-06-15',
    pais: 'CL',
    descripcion: 'Plataforma de comparación visual de logos y marcas'
  },
  {
    id: '2',
    nombre: 'COMPARE PRO',
    solicitante: 'Software Innovations Inc',
    numeroRegistro: '4020230322002',
    niza: ['42', '09'],
    viena: ['26.01.01'],
    estado: 'Registrada',
    fecha: '2023-03-22',
    pais: 'US',
    descripcion: 'Software profesional de comparación'
  },
  {
    id: '3',
    nombre: 'LOGO MATCH',
    solicitante: 'Design Studio Chile',
    numeroRegistro: '4020240110003',
    niza: ['41', '42'],
    viena: ['26.03.01', '26.03.15'],
    estado: 'Pendiente',
    fecha: '2024-01-10',
    pais: 'CL',
    descripcion: 'Sistema de emparejamiento de logos'
  },
  {
    id: '4',
    nombre: 'MARCA SHIELD',
    solicitante: 'IP Protection Services',
    numeroRegistro: '4020221105004',
    niza: ['45'],
    viena: ['26.04.01'],
    estado: 'Registrada',
    fecha: '2022-11-05',
    pais: 'MX',
    descripcion: 'Protección de marcas registradas'
  },
  {
    id: '5',
    nombre: 'VISUAL TECH',
    solicitante: 'Technology Innovations',
    numeroRegistro: '4020230820005',
    niza: ['42', '35', '09'],
    viena: ['26.03.01'],
    estado: 'Registrada',
    fecha: '2023-08-20',
    pais: 'AR',
    descripcion: 'Tecnología visual avanzada'
  }
]

export default function ConsultaPage() {
  const [showLoadDB, setShowLoadDB] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set())
  const [searchHistory, setSearchHistory] = useState<Array<{
    query: string
    type: string
    timestamp: Date
    resultCount: number
  }>>([])

  const { search, resultados, cargando } = useSearch(MARCAS_DEMO)

  // Load favoritos from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('favoritos_marcas')
      if (saved) {
        setFavoritos(new Set(JSON.parse(saved)))
      }
    }
  }, [])

  const handleSearch = async (query: string, type: 'nombre' | 'niza' | 'viena') => {
    await search({ query, type })

    // Add to search history
    setSearchHistory(prev => [
      {
        query,
        type,
        timestamp: new Date(),
        resultCount: resultados.length
      },
      ...prev.slice(0, 9)
    ])
  }

  const handleToggleFavorito = (marcaId: string) => {
    const nuevos = new Set(favoritos)
    if (nuevos.has(marcaId)) {
      nuevos.delete(marcaId)
    } else {
      nuevos.add(marcaId)
    }
    setFavoritos(nuevos)
    if (typeof window !== 'undefined') {
      localStorage.setItem('favoritos_marcas', JSON.stringify(Array.from(nuevos)))
    }
  }

  const handleClearHistory = () => {
    setSearchHistory([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/demo" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="p-2 rounded-lg bg-blue-600/20">
              <Shield className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <span className="text-lg font-bold text-white block">Consulta de Marcas</span>
              <span className="text-xs text-slate-400">Portal de búsqueda avanzado</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowLoadDB(!showLoadDB)}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Settings className="h-4 w-4 mr-2" />
              {showLoadDB ? 'Ocultar' : 'Mostrar'} Carga
            </Button>
            <Link href="/demo" className="text-sm text-slate-400 hover:text-white transition">
              ← Volver
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Sistema de Consulta de Marcas Registradas
          </h1>
          <p className="text-slate-400 text-lg">
            Búsqueda avanzada con <span className="font-semibold text-blue-400">4 módulos funcionales</span>
          </p>
        </div>

        {/* 4 Pilares de Módulos */}
        <div className="space-y-16">
          {/* Módulo 1: Carga de BD */}
          {showLoadDB && (
            <section className="rounded-xl border border-slate-700/30 p-8 bg-slate-800/20 backdrop-blur-sm">
              <LoadDBModule />
            </section>
          )}

          {/* Módulo 2: Búsqueda */}
          <section className="rounded-xl border border-slate-700/30 p-8 bg-slate-800/20 backdrop-blur-sm">
            <SearchModule
              isLoading={cargando}
              onSearch={handleSearch}
              resultCount={resultados.length}
            />
          </section>

          {/* Módulo 3: Visualización */}
          {resultados.length > 0 && (
            <section className="rounded-xl border border-slate-700/30 p-8 bg-slate-800/20 backdrop-blur-sm">
              <VisualizationModule
                resultados={resultados}
                isLoading={cargando}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                favoritos={favoritos}
                onToggleFavorito={handleToggleFavorito}
              />
            </section>
          )}

          {/* Módulo 4: Utilidades */}
          <section className="rounded-xl border border-slate-700/30 p-8 bg-slate-800/20 backdrop-blur-sm">
            <UtilitiesModule
              resultados={resultados}
              searchHistory={searchHistory}
              onClearHistory={handleClearHistory}
            />
          </section>
        </div>
      </main>
    </div>
  )
}
