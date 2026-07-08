'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Shield,
  Tag,
  Globe,
  Calendar,
  Heart,
  Share2,
  ChevronDown,
  ChevronUp,
  Copy
} from 'lucide-react'
import { SearchResult } from '@/types/marca'

interface MarcaCardProps {
  resultado: SearchResult
  onFavorito?: (marcaId: string) => void
  esFavorito?: boolean
  onCompartir?: (marcaId: string) => void
}

export function MarcaCard({
  resultado,
  onFavorito,
  esFavorito = false,
  onCompartir
}: MarcaCardProps) {
  const [expanded, setExpanded] = useState(false)
  const { marca, relevancia, matchType } = resultado

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Registrada':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30'
      case 'Pendiente':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      case 'Denegada':
        return 'bg-blue-500/15 text-amber-400 border-red-500/30'
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30'
    }
  }

  const getMatchTypeLabel = () => {
    switch (matchType) {
      case 'exact':
        return '100% Coincidencia'
      case 'partial':
        return 'Coincidencia Parcial'
      case 'fuzzy':
        return 'Búsqueda Aproximada'
      default:
        return ''
    }
  }

  const copyToClipboard = () => {
    const text = `${marca.nombre} - ${marca.solicitante} (${marca.numeroRegistro})`
    navigator.clipboard.writeText(text)
  }

  return (
    <Card className="border-slate-700/50 bg-gradient-to-br from-slate-800/30 to-slate-900/50 hover:from-slate-800/50 hover:to-slate-900/60 hover:border-blue-500/40 transition-all duration-300 overflow-hidden shadow-xl hover:shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-slate-700/30">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <h3 className="text-xl font-bold text-white">{marca.nombre}</h3>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${getStatusColor(marca.estado)}`}
              >
                {marca.estado}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
              <span className="text-xs px-2 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {getMatchTypeLabel()}
              </span>
              <span className="text-xs px-2 py-1 rounded-lg bg-slate-700/50 text-slate-300">
                Relevancia: {relevancia}%
              </span>
            </div>

            <p className="text-sm text-slate-300">{marca.solicitante}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => onFavorito?.(marca.id)}
              className={`p-2 rounded-lg transition-all ${
                esFavorito
                  ? 'bg-blue-500/20 text-amber-400 hover:bg-blue-500/30'
                  : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700/50'
              }`}
            >
              <Heart className="h-4 w-4" fill={esFavorito ? 'currentColor' : 'none'} />
            </button>

            <button
              onClick={copyToClipboard}
              className="p-2 rounded-lg bg-slate-700/30 text-slate-400 hover:bg-slate-700/50 transition-all"
            >
              <Copy className="h-4 w-4" />
            </button>

            <button
              onClick={() => onCompartir?.(marca.id)}
              className="p-2 rounded-lg bg-slate-700/30 text-slate-400 hover:bg-slate-700/50 transition-all"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Info Column 1 */}
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wider">
                Número de Registro
              </p>
              <p className="text-sm text-slate-200 font-mono">{marca.numeroRegistro}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wider">
                País
              </p>
              <p className="text-sm text-slate-200">{marca.pais}</p>
            </div>
          </div>

          {/* Info Column 2 */}
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wider">
                Fecha de Registro
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-200">
                <Calendar className="h-4 w-4 text-slate-400" />
                {new Date(marca.fecha).toLocaleDateString('es-CL')}
              </div>
            </div>
          </div>
        </div>

        {/* Classifications */}
        <div className="space-y-3">
          <div>
            <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Clases Niza
            </p>
            <div className="flex flex-wrap gap-2">
              {marca.niza.map(niza => (
                <span
                  key={niza}
                  className="bg-gradient-to-r from-blue-600/20 to-slate-9000/10 text-blue-300 text-xs px-3 py-1 rounded-lg border border-blue-500/30 hover:border-blue-500/50 transition-colors cursor-pointer"
                >
                  {niza}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Códigos Viena
            </p>
            <div className="flex flex-wrap gap-2">
              {marca.viena.map(viena => (
                <span
                  key={viena}
                  className="bg-gradient-to-r from-purple-600/20 to-purple-500/10 text-purple-300 text-xs px-3 py-1 rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition-colors cursor-pointer"
                >
                  {viena}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Description */}
      {marca.descripcion && (
        <div className="border-t border-slate-700/30">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-6 py-3 flex items-center justify-between text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Detalles
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {expanded && (
            <div className="px-6 pb-6 border-t border-slate-700/30 pt-4">
              <p className="text-sm text-slate-300">{marca.descripcion}</p>
              {marca.metadata && (
                <div className="mt-4 pt-4 border-t border-slate-700/30">
                  <p className="text-xs text-slate-400 mb-2 font-semibold">Metadata:</p>
                  <pre className="text-xs bg-slate-900/50 p-2 rounded overflow-auto max-h-48 text-slate-300">
                    {JSON.stringify(marca.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
