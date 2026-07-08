'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, Grid, List, AlertCircle } from 'lucide-react'
import { SearchResult, Marca } from '@/types/marca'
import { MarcaCard } from '../marca-card'

interface VisualizationModuleProps {
  resultados: SearchResult[]
  isLoading?: boolean
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
  favoritos?: Set<string>
  onToggleFavorito?: (id: string) => void
}

/**
 * Módulo de Visualización
 * Responsable de:
 * - Renderizado de tablas de resultados
 * - Visualización de códigos de clasificación (Viena/Niza)
 * - Detalles expandibles de marcas
 * - Vistas grid/list
 */
export function VisualizationModule({
  resultados,
  isLoading = false,
  viewMode = 'grid',
  onViewModeChange,
  favoritos = new Set(),
  onToggleFavorito
}: VisualizationModuleProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Eye className="h-6 w-6 text-blue-400" />
            Resultados
          </h2>
        </div>
        <Card className="border-slate-700 bg-slate-800/50 p-12 text-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-slate-700"></div>
            <p className="text-slate-400">Cargando resultados...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (resultados.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Eye className="h-6 w-6 text-blue-400" />
            Resultados
          </h2>
        </div>
        <Card className="border-slate-700 bg-slate-800/50 p-12 text-center">
          <AlertCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No hay resultados para mostrar</p>
          <p className="text-sm text-slate-500 mt-2">
            Intenta con otros términos de búsqueda
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Eye className="h-6 w-6 text-blue-400" />
            Resultados
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Se encontraron <span className="font-bold text-blue-300">{resultados.length}</span> marcas
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => onViewModeChange?.('grid')}
            className={`p-2 rounded-lg transition ${
              viewMode === 'grid'
                ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50'
                : 'bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700'
            }`}
            title="Vista en grid"
          >
            <Grid className="h-5 w-5" />
          </button>
          <button
            onClick={() => onViewModeChange?.('list')}
            className={`p-2 rounded-lg transition ${
              viewMode === 'list'
                ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50'
                : 'bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700'
            }`}
            title="Vista en lista"
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Results Grid/List */}
      <div className={viewMode === 'grid' ? 'space-y-4' : 'space-y-3'}>
        {resultados.map((resultado) => (
          <div
            key={resultado.marca.id}
            onClick={() => handleToggleExpand(resultado.marca.id)}
            className="cursor-pointer"
          >
            <MarcaCard
              resultado={resultado}
              esFavorito={favoritos.has(resultado.marca.id)}
              onFavorito={onToggleFavorito}
            />

            {/* Expandable Details */}
            {expandedId === resultado.marca.id && (
              <Card className="border-slate-700 bg-slate-800/30 p-6 mt-2 space-y-4">
                {/* Viena Classifications */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">
                    Clasificación Viena (Elementos Figurativos)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {resultado.marca.viena.map((code) => (
                      <Badge
                        key={code}
                        variant="outline"
                        className="bg-blue-500/10 border-blue-500/30 text-blue-300 text-xs"
                      >
                        {code}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Niza Classifications */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">
                    Clasificación Niza (Clases de Productos/Servicios)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {resultado.marca.niza.map((clase) => (
                      <Badge
                        key={clase}
                        className="bg-purple-500/10 border-purple-500/30 text-purple-300 text-xs"
                        variant="outline"
                      >
                        Clase {clase}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Additional Info */}
                {resultado.marca.descripcion && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">
                      Descripción
                    </h4>
                    <p className="text-sm text-slate-400">{resultado.marca.descripcion}</p>
                  </div>
                )}

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Número de Registro</p>
                    <p className="text-sm font-mono text-slate-300 mt-1">{resultado.marca.numeroRegistro}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">País</p>
                    <p className="text-sm text-slate-300 mt-1">{resultado.marca.pais}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
