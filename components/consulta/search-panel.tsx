'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Search, Filter, Settings, BarChart3 } from 'lucide-react'

interface SearchPanelProps {
  onSearch: (query: string, type: string) => void
  onFiltersChange?: (filters: any) => void
  isLoading?: boolean
}

export function SearchPanel({ onSearch, onFiltersChange, isLoading }: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'nombre' | 'niza' | 'viena'>('nombre')
  const [showFilters, setShowFilters] = useState(false)
  const [showStats, setShowStats] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearch(searchQuery, searchType)
    }
  }

  const getPlaceholder = () => {
    switch (searchType) {
      case 'nombre':
        return 'Ej: VISUAL COMPARE'
      case 'niza':
        return 'Ej: 42, 35, 09'
      case 'viena':
        return 'Ej: 26.03.01'
      default:
        return 'Ingresa tu búsqueda...'
    }
  }

  const getLabel = () => {
    switch (searchType) {
      case 'nombre':
        return 'Por Nombre de Marca'
      case 'niza':
        return 'Por Clase Niza'
      case 'viena':
        return 'Por Código Viena'
      default:
        return 'Buscar'
    }
  }

  return (
    <Card className="border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-8 shadow-2xl">
      <form onSubmit={handleSearch} className="space-y-6">
        {/* Search Type Selector */}
        <div className="flex flex-wrap gap-3">
          {(['nombre', 'niza', 'viena'] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setSearchType(type)
                setSearchQuery('')
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 ${
                searchType === type
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700/80'
              }`}
            >
              {type === 'nombre' && 'Nombre'}
              {type === 'niza' && 'Niza'}
              {type === 'viena' && 'Viena'}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-200">{getLabel()}</label>
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder={getPlaceholder()}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-slate-700/30 border-slate-600/50 text-white placeholder:text-slate-500 transition-colors focus:border-blue-500 focus:bg-slate-700/50"
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700/50">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs px-3 py-1 rounded-lg bg-slate-700/30 text-slate-300 hover:bg-slate-700/50 transition-colors flex items-center gap-1"
          >
            <Filter className="h-3 w-3" />
            Filtros Avanzados
          </button>

          <button
            type="button"
            onClick={() => setShowStats(!showStats)}
            className="text-xs px-3 py-1 rounded-lg bg-slate-700/30 text-slate-300 hover:bg-slate-700/50 transition-colors flex items-center gap-1"
          >
            <BarChart3 className="h-3 w-3" />
            Estadísticas
          </button>

          <button
            type="button"
            className="text-xs px-3 py-1 rounded-lg bg-slate-700/30 text-slate-300 hover:bg-slate-700/50 transition-colors flex items-center gap-1 ml-auto"
          >
            <Settings className="h-3 w-3" />
            Opciones
          </button>
        </div>
      </form>
    </Card>
  )
}
