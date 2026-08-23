'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export type ApiPortalSearchType = 'nombre' | 'niza' | 'viena'

interface SearchPanelProps {
  query: string
  searchType: ApiPortalSearchType
  isLoading?: boolean
  onQueryChange: (query: string) => void
  onSearchTypeChange: (type: ApiPortalSearchType) => void
  onSearch: (query: string, type: ApiPortalSearchType) => void
}

export function SearchPanel({ query, searchType, isLoading = false, onQueryChange, onSearchTypeChange, onSearch }: SearchPanelProps) {
  const placeholder = searchType === 'nombre' ? 'Escribe una marca' : searchType === 'niza' ? 'Ej. 42' : 'Ej. 26.03.01'
  const label = searchType === 'nombre' ? 'Nombre de la marca' : searchType === 'niza' ? 'Clase Niza' : 'Código Viena'

  return (
    <section className="border-y border-black/10 bg-white px-5 py-7 sm:px-7">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0F766E]">BÚSQUEDA MARCARIA</p>
          <h2 className="mt-3 text-3xl font-normal tracking-[-0.035em] text-[#111827]">Encuentra antecedentes sin ruido.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">Busca por denominación, clase Niza o código de Viena. Los resultados provienen de la base indexada disponible.</p>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-black/10">
          {([['nombre', 'Nombre'], ['niza', 'Niza'], ['viena', 'Viena']] as const).map(([type, text]) => (
            <button
              key={type}
              type="button"
              onClick={() => onSearchTypeChange(type)}
              className={`border-b-2 px-4 py-3 text-sm transition ${searchType === type ? 'border-[#0F766E] text-[#111827]' : 'border-transparent text-[#667085] hover:text-[#111827]'}`}
            >
              {text}
            </button>
          ))}
        </div>

        <form
          className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
          onSubmit={(event) => {
            event.preventDefault()
            if (query.trim()) onSearch(query.trim(), searchType)
          }}
        >
          <label className="space-y-2">
            <span className="text-sm font-medium text-[#475467]">{label}</span>
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={placeholder}
              className="h-12 rounded-lg border-black/15 bg-[#F7F8F6] text-[#111827] shadow-none placeholder:text-[#98A2B3] focus-visible:ring-[#0F766E]/25"
              disabled={isLoading}
            />
          </label>
          <Button type="submit" disabled={isLoading || !query.trim()} className="h-12 rounded-lg bg-[#111827] px-6 text-white shadow-none hover:bg-[#273244]">
            <Search className="mr-2 h-4 w-4" />
            {isLoading ? 'Buscando…' : 'Buscar'}
          </Button>
        </form>
      </div>
    </section>
  )
}
