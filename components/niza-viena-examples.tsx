'use client'

import { useState } from 'react'
import { Eye, Package, Info, Database } from 'lucide-react'

const EXAMPLES = [
  {
    id: 1,
    nombre: 'VISUAL COMPARE',
    tipo: 'niza',
    niza: ['42', '35'],
    viena: ['26.03.01'],
    nizaDesc: ['42 - Servicios IT y desarrollo', '35 - Publicidad y marketing'],
    vienaDes: '26.03.01 - Organos visuales',
    descripcion: 'Plataforma de comparacion visual de marcas',
    color: 'blue'
  },
  {
    id: 2,
    nombre: 'COMPARE PRO',
    tipo: 'niza',
    niza: ['42', '09'],
    viena: ['26.01.01'],
    nizaDesc: ['42 - Servicios informaticos', '09 - Equipos informaticos'],
    vienaDes: '26.01.01 - Figuras geometricas simples',
    descripcion: 'Software de comparacion profesional',
    color: 'purple'
  },
  {
    id: 3,
    nombre: 'LOGO MATCH',
    tipo: 'viena',
    niza: ['41', '42'],
    viena: ['26.03.01', '26.03.15'],
    nizaDesc: ['41 - Educacion y servicios formativos', '42 - Servicios tecnologicos'],
    vienaDes: '26.03.01 Partes del cuerpo, 26.03.15 Expresiones faciales',
    descripcion: 'Sistema de matching de logos',
    color: 'amber'
  },
  {
    id: 4,
    nombre: 'VISUALMARK',
    tipo: 'niza',
    niza: ['35', '36', '42'],
    viena: ['26.03.01', '28.01.01'],
    nizaDesc: ['35 - Publicidad', '36 - Servicios financieros', '42 - Servicios tecnologicos'],
    vienaDes: '26.03 Figuras naturales, 28.01 Patrones abstractos',
    descripcion: 'Marca de identidad visual corporativa',
    color: 'blue'
  }
]

export function NizaVienExamples() {
  const [selectedExample, setSelectedExample] = useState(EXAMPLES[0])
  const [filterType, setFilterType] = useState('all')

  const filtered = filterType === 'all' ? EXAMPLES : EXAMPLES.filter((ex) => ex.tipo === filterType)
  const colors = {
    blue: { border: 'border-blue-500/50', bg: 'from-blue-900/20', text: 'text-blue-300', pill: 'bg-blue-500/20 border-blue-500/50 text-blue-300' },
    purple: { border: 'border-purple-500/50', bg: 'from-purple-900/20', text: 'text-purple-300', pill: 'bg-purple-500/20 border-purple-500/50 text-purple-300' },
    amber: { border: 'border-amber-500/50', bg: 'from-amber-900/20', text: 'text-amber-300', pill: 'bg-amber-500/20 border-amber-500/50 text-amber-300' }
  }
  const color = colors[selectedExample.color as keyof typeof colors] || colors.blue

  return (
    <section className="py-20 border-t border-blue-500/10 relative z-10">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-white mb-4 font-montserrat text-center">Ejemplos de marcas con Niza y Viena</h2>
        <p className="text-xl text-blue-200 text-center mb-12 max-w-3xl mx-auto">
          Ejemplos de referencia para explicar como se usa la clasificacion dentro del MVP.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="space-y-2">
              {filtered.map((example) => (
                <button
                  key={example.id}
                  onClick={() => setSelectedExample(example)}
                  className={`w-full p-4 rounded-lg border transition-all text-left ${
                    selectedExample.id === example.id
                      ? `glass border-${example.color}-500/70 bg-gradient-to-r from-${example.color}-900/40 to-slate-900/50`
                      : 'glass border-blue-500/20 hover:border-blue-500/50 bg-slate-900/30'
                  }`}
                >
                  <p className="font-semibold text-white">{example.nombre}</p>
                  <p className="text-xs text-blue-300 mt-1">{example.descripcion}</p>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-blue-500/20">
              <p className="text-xs text-blue-300 font-semibold mb-3">FILTRAR POR</p>
              <div className="space-y-2">
                <button
                  onClick={() => { setFilterType('all'); setSelectedExample(EXAMPLES[0]) }}
                  className={`w-full p-2 text-sm rounded border transition-all ${filterType === 'all' ? 'border-blue-500/50 bg-blue-500/10 text-blue-300' : 'border-blue-500/20 text-blue-200 hover:border-blue-500/50'}`}
                >
                  Todas las marcas
                </button>
                <button
                  onClick={() => { setFilterType('niza'); const niza = EXAMPLES.find((e) => e.tipo === 'niza'); if (niza) setSelectedExample(niza) }}
                  className={`w-full p-2 text-sm rounded border transition-all flex items-center gap-2 ${filterType === 'niza' ? 'border-blue-500/50 bg-blue-500/10 text-blue-300' : 'border-blue-500/20 text-blue-200 hover:border-blue-500/50'}`}
                >
                  <Package className="h-4 w-4" /> Por Niza
                </button>
                <button
                  onClick={() => { setFilterType('viena'); const viena = EXAMPLES.find((e) => e.tipo === 'viena'); if (viena) setSelectedExample(viena) }}
                  className={`w-full p-2 text-sm rounded border transition-all flex items-center gap-2 ${filterType === 'viena' ? 'border-purple-500/50 bg-purple-500/10 text-purple-300' : 'border-blue-500/20 text-blue-200 hover:border-blue-500/50'}`}
                >
                  <Eye className="h-4 w-4" /> Por Viena
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className={`glass p-8 border ${color.border} bg-gradient-to-br ${color.bg} to-slate-900/50 rounded-2xl`}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-2 font-montserrat">{selectedExample.nombre}</h3>
                  <p className="text-blue-200">{selectedExample.descripcion}</p>
                </div>
              </div>

              <div className="mb-8 p-4 rounded-lg border border-blue-500/30 bg-blue-500/5">
                <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  ORIGEN DE DATOS
                </h4>
                <p className="text-xs text-blue-100">
                  Ejemplos de referencia para explicar clasificacion, no una afirmacion de cobertura completa.
                </p>
              </div>

              <div className="mb-8">
                <h4 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Clasificacion Niza
                </h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedExample.nizaDesc.map((desc, i) => (
                      <div key={i} className={`p-3 rounded-lg border ${color.pill}`}>
                        <p className="text-sm font-semibold">{selectedExample.niza[i]}</p>
                        <p className="text-xs text-blue-100 mt-1">{desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-xs text-blue-400 font-semibold mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      QUE SIGNIFICA
                    </p>
                    <p className="text-sm text-blue-100">
                      {selectedExample.nombre} queda asociada a estas clases para el flujo de consulta y analisis.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-purple-300 mb-4 flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Clasificacion Viena
                </h4>
                <div className="space-y-3">
                  <div className="p-4 rounded-lg border bg-purple-500/20 border-purple-500/50">
                    <p className="text-sm font-semibold text-purple-300">{selectedExample.viena.join(', ')}</p>
                    <p className="text-sm text-purple-100 mt-2">{selectedExample.vienaDes}</p>
                  </div>
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <p className="text-xs text-purple-400 font-semibold mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      BUSQUEDA VISUAL
                    </p>
                    <p className="text-sm text-purple-100">
                      Viena sirve como referencia visual para la busqueda y comparacion de elementos graficos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
