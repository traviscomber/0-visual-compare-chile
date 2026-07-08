'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Loader } from 'lucide-react'
import { SearchResult, Marca } from '@/types/marca'

interface SearchModuleProps {
  isLoading?: boolean
  onSearch: (query: string, type: 'nombre' | 'niza' | 'viena') => void
  resultCount?: number
}

/**
 * Módulo de Búsqueda
 * Responsable de:
 * - Búsqueda por nombre de marca
 * - Búsqueda por clasificación Viena
 * - Búsqueda por clasificación Niza
 * - Interfaz de búsqueda avanzada
 */
export function SearchModule({ isLoading = false, onSearch, resultCount = 0 }: SearchModuleProps) {
  const [query, setQuery] = React.useState('')
  const [searchType, setSearchType] = React.useState<'nombre' | 'niza' | 'viena'>('nombre')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query, searchType)
    }
  }

  const handleClear = () => {
    setQuery('')
    setSearchType('nombre')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Search className="h-6 w-6 text-purple-400" />
          Búsqueda de Marcas
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Busca por nombre, clasificación Viena o Niza
        </p>
      </div>

      {/* Search Card */}
      <Card className="border-slate-700 bg-slate-800/50 p-8">
        <form onSubmit={handleSearch} className="space-y-6">
          {/* Search Type Tabs */}
          <div className="flex gap-3 flex-wrap">
            {[
              { id: 'nombre', label: '📝 Por Nombre', desc: 'Buscar por nombre de marca' },
              { id: 'viena', label: '🎨 Por Viena', desc: 'Buscar por código Viena' },
              { id: 'niza', label: '📂 Por Niza', desc: 'Buscar por clase Niza' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSearchType(tab.id as any)}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${
                  searchType === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600'
                }`}
                title={tab.desc}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              {searchType === 'nombre' && 'Nombre de la marca'}
              {searchType === 'viena' && 'Código Viena (ej: 26.03.01)'}
              {searchType === 'niza' && 'Clase Niza (ej: 42, 35, 09)'}
            </label>
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder={
                  searchType === 'nombre'
                    ? 'ej: VISUAL COMPARE'
                    : searchType === 'viena'
                    ? 'ej: 26.03.01'
                    : 'ej: 42'
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500/20"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6"
              >
                {isLoading ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
              {query && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  disabled={isLoading}
                >
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          {/* Results Counter */}
          {resultCount > 0 && (
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-sm text-purple-200">
              Se encontraron <span className="font-bold text-purple-300">{resultCount}</span> resultados
            </div>
          )}

          {/* Search Tips */}
          <div className="p-4 rounded-lg bg-slate-700/30 text-sm text-slate-300 space-y-2">
            <p className="font-medium text-slate-200">💡 Consejos de búsqueda:</p>
            <ul className="space-y-1 text-slate-400 list-disc list-inside">
              <li>La búsqueda es insensible a mayúsculas/minúsculas</li>
              <li>Soporta búsqueda parcial y difusa (fuzzy matching)</li>
              <li>Puedes buscar múltiples términos separados por espacios</li>
            </ul>
          </div>
        </form>
      </Card>
    </div>
  )
}
