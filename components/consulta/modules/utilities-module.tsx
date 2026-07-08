'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Clock, BarChart3, Trash2 } from 'lucide-react'
import { SearchResult } from '@/types/marca'
import { ExportDialog } from '../export-dialog'

interface UtilitiesModuleProps {
  resultados: SearchResult[]
  searchHistory?: Array<{ query: string; type: string; timestamp: Date; resultCount: number }>
  onClearHistory?: () => void
}

/**
 * Módulo de Utilidades
 * Responsable de:
 * - Gestión de historial de búsquedas
 * - Exportación de datos (CSV, JSON)
 * - Utilidades de fecha/hora
 * - Estadísticas de búsqueda
 */
export function UtilitiesModule({
  resultados,
  searchHistory = [],
  onClearHistory
}: UtilitiesModuleProps) {
  const [exportOpen, setExportOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<'export' | 'history' | 'stats'>('export')

  const stats = React.useMemo(() => {
    if (resultados.length === 0) return null

    return {
      totalMarcas: resultados.length,
      estados: {
        registrada: resultados.filter(r => r.marca.estado === 'Registrada').length,
        pendiente: resultados.filter(r => r.marca.estado === 'Pendiente').length,
        denegada: resultados.filter(r => r.marca.estado === 'Denegada').length
      },
      claseNiza: new Set(resultados.flatMap(r => r.marca.niza)).size,
      codigosViena: new Set(resultados.flatMap(r => r.marca.viena)).size,
      paises: new Set(resultados.map(r => r.marca.pais)).size
    }
  }, [resultados])

  const handleExport = (format: 'csv' | 'json') => {
    console.log('[v0] Exportando en formato:', format)
    setExportOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-amber-400" />
          Utilidades
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Exporta, visualiza historial y estadísticas
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 flex-wrap">
        {[
          { id: 'export', label: '📥 Exportar', icon: '💾' },
          { id: 'history', label: '📜 Historial', icon: '🕐' },
          { id: 'stats', label: '📊 Estadísticas', icon: '📈' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <Card className="border-slate-700 bg-slate-800/50 p-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Exportar Resultados</h3>
              <p className="text-sm text-slate-400">
                Descarga los resultados de búsqueda en tu formato preferido
              </p>
            </div>

            {resultados.length > 0 ? (
              <div className="space-y-4">
                <Button
                  onClick={() => setExportOpen(true)}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-3"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Seleccionar Formato de Exportación
                </Button>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                  <div className="p-3 rounded-lg bg-slate-700/30">
                    <p className="text-xs text-slate-400 mb-1">Formato CSV</p>
                    <p className="text-sm font-semibold text-slate-200">
                      {resultados.length} registros
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-700/30">
                    <p className="text-xs text-slate-400 mb-1">Formato JSON</p>
                    <p className="text-sm font-semibold text-slate-200">
                      Con metadata
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-slate-700/30 text-center">
                <p className="text-slate-400">No hay resultados para exportar</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <Card className="border-slate-700 bg-slate-800/50 p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Historial de Búsquedas</h3>
                <p className="text-sm text-slate-400">
                  Últimas búsquedas realizadas
                </p>
              </div>
              {searchHistory.length > 0 && (
                <Button
                  onClick={onClearHistory}
                  variant="outline"
                  className="border-red-500/30 text-amber-400 hover:bg-blue-500/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpiar
                </Button>
              )}
            </div>

            {searchHistory.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {searchHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-slate-700/30 border border-slate-700 hover:border-slate-600 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono text-slate-300 truncate">
                          {item.query}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Búsqueda por: <span className="capitalize">{item.type}</span>
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-blue-300">
                          {item.resultCount} resultados
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {item.timestamp.toLocaleTimeString('es-CL')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-slate-700/30 text-center">
                <Clock className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400">No hay historial de búsquedas</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <Card className="border-slate-700 bg-slate-800/50 p-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Estadísticas</h3>
              <p className="text-sm text-slate-400">
                Resumen de los resultados actuales
              </p>
            </div>

            {stats ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Total Marcas</p>
                  <p className="text-2xl font-bold text-blue-400 mt-2">{stats.totalMarcas}</p>
                </div>

                <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Registradas</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-2">{stats.estados.registrada}</p>
                </div>

                <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Pendientes</p>
                  <p className="text-2xl font-bold text-amber-400 mt-2">{stats.estados.pendiente}</p>
                </div>

                <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Clases Niza</p>
                  <p className="text-2xl font-bold text-purple-400 mt-2">{stats.claseNiza}</p>
                </div>

                <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Códigos Viena</p>
                  <p className="text-2xl font-bold text-cyan-400 mt-2">{stats.codigosViena}</p>
                </div>

                <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Países</p>
                  <p className="text-2xl font-bold text-pink-400 mt-2">{stats.paises}</p>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-slate-700/30 text-center">
                <p className="text-slate-400">No hay datos para mostrar</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Export Dialog */}
      <ExportDialog
        resultados={resultados}
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={() => {
          console.log('[v0] Exportando resultados')
          setExportOpen(false)
        }}
      />
    </div>
  )
}
