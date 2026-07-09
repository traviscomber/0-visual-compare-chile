'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Sparkles } from 'lucide-react'

export type ApiPortalSearchType = 'nombre' | 'niza' | 'viena'

interface SearchPanelProps {
  query: string
  searchType: ApiPortalSearchType
  isLoading?: boolean
  onQueryChange: (query: string) => void
  onSearchTypeChange: (type: ApiPortalSearchType) => void
  onSearch: (query: string, type: ApiPortalSearchType) => void
}

export function SearchPanel({
  query,
  searchType,
  isLoading = false,
  onQueryChange,
  onSearchTypeChange,
  onSearch
}: SearchPanelProps) {
  const placeholder =
    searchType === 'nombre'
      ? 'Ej: VISUAL COMPARE'
      : searchType === 'niza'
        ? 'Ej: 42, 35, 09'
        : 'Ej: 26.03.01'

  const label =
    searchType === 'nombre'
      ? 'Nombre de la marca'
      : searchType === 'niza'
        ? 'Clase Niza'
        : 'Codigo Viena'

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-blue-950/20">
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-medium text-blue-200">
              <Sparkles className="h-3.5 w-3.5" />
              API Portal
            </div>
            <h2 className="mt-3 text-2xl font-bold text-white">Buscar registros</h2>
            <p className="mt-1 text-sm text-slate-300">
              Filtra por nombre, clase Niza o codigo Viena.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {([
            ['nombre', 'Nombre'],
            ['niza', 'Niza'],
            ['viena', 'Viena']
          ] as const).map(([type, labelText]) => (
            <button
              key={type}
              type="button"
              onClick={() => onSearchTypeChange(type)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                searchType === type
                  ? 'border-blue-400/50 bg-blue-500/20 text-blue-100'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {labelText}
            </button>
          ))}
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            onSearch(query, searchType)
          }}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">{label}</label>
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={placeholder}
              className="border-white/10 bg-slate-950/50 text-white placeholder:text-slate-500 focus-visible:ring-blue-400/30"
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-950/30 hover:from-blue-500 hover:to-indigo-400"
            >
              <Search className="mr-2 h-4 w-4" />
              {isLoading ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}
