'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Shield, ArrowLeft, Database, Globe } from 'lucide-react'
import { SearchResult, SearchFilters } from '@/types/marca'
import { useSearch } from '@/hooks/useSearch'
import { useInapiSearch } from '@/hooks/useInapiSearch'
import { API_PORTAL_MARCAS } from '@/lib/api-portal-data'
import {
  ExportDialog,
  FilterPanel,
  MarcaCard,
  ResultsTable,
  SearchPanel,
  StatsBar
} from '@/components/api-portal'

const PAGE_SIZE = 20

const DEFAULT_FILTERS: SearchFilters = {}

export default function ConsultaPage() {
  const [query, setQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [searchType, setSearchType] = useState<'nombre' | 'niza' | 'viena'>('nombre')
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [lastSearchTime, setLastSearchTime] = useState(0)
  const [dataSource, setDataSource] = useState<'inapi' | 'local'>('inapi')

  // Fixed set of 45 Niza classes for filter panel
  const availableNiza = useMemo(() =>
    Array.from({ length: 45 }, (_, i) => String(i + 1)), [])
  const availableViena = useMemo(() =>
    Array.from(new Set(API_PORTAL_MARCAS.flatMap((m) => m.viena))).sort(), [])

  // INAPI live search (primary)
  const inapi = useInapiSearch()

  // Local search (fallback / offline)
  const local = useSearch(API_PORTAL_MARCAS)

  // Active results come from whichever source last ran
  const activeResults = dataSource === 'inapi' ? inapi.results : local.resultados
  const cargando = inapi.loading || local.cargando

  const runInapiSearch = async (
    nextQuery: string,
    nextType: 'nombre' | 'niza' | 'viena',
    nextFilters: SearchFilters = filters
  ) => {
    setQuery(nextQuery)
    setActiveQuery(nextQuery)
    setSearchType(nextType)

    // Map viena/niza type to INAPI type
    const inapiType = nextType === 'niza' ? 'clase' : 'nombre'
    const response = await inapi.search({
      query: nextQuery,
      type: inapiType,
      filters: nextFilters,
    })

    if (response.total > 0 || !inapi.error) {
      setDataSource('inapi')
      setLastSearchTime(response.tiempo_ms)
    } else {
      // INAPI unreachable — fall back to local
      const localResp = await local.search({ query: nextQuery, type: nextType, filters: nextFilters })
      setDataSource('local')
      setLastSearchTime(localResp.tiempo_ms)
    }
    setPage(1)
  }

  const runFilters = async (nextFilters: SearchFilters) => {
    setFilters(nextFilters)
    if (activeQuery) {
      await runInapiSearch(activeQuery, searchType, nextFilters)
    }
  }

  // No initial search — wait for user input
  useEffect(() => {
    setPage(1)
  }, [inapi.results, local.resultados])

  const filteredResults = useMemo(() => {
    return activeResults.filter((result) => {
      if (filters.estado && result.marca.estado !== filters.estado) return false
      if (filters.pais && result.marca.pais !== filters.pais.toUpperCase()) return false
      if (filters.niza?.length && !filters.niza.some((item) => result.marca.niza.includes(item))) return false
      if (filters.viena?.length && !filters.viena.some((item) => result.marca.viena.includes(item))) return false
      return true
    })
  }, [filters, activeResults])

  const currentPageResults = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredResults.slice(start, start + PAGE_SIZE)
  }, [filteredResults, page])

  const totalInDatabase = 350000 // INAPI registry size (approximate)
  const activeResultCount = filteredResults.length

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#0f172a_40%,_#111827_100%)] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3">
              <Shield className="h-5 w-5 text-blue-200" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-400">API Portal</p>
              <h1 className="text-xl font-semibold">Consulta de Marcas</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
              dataSource === 'inapi'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
            }`}>
              <Globe className="h-3 w-3" />
              {dataSource === 'inapi' ? 'INAPI en vivo' : 'Base local'}
            </div>
            <Link
              href="/panel"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al panel
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8 md:py-10">
        <section className="grid gap-6 xl:grid-cols-[1.6fr_0.8fr]">
          <SearchPanel
            query={query}
            searchType={searchType}
            isLoading={cargando}
            onQueryChange={setQuery}
            onSearchTypeChange={(type) => {
              setSearchType(type)
              void runInapiSearch(query, type, filters)
            }}
            onSearch={runInapiSearch}
          />

          <div className="space-y-6">
            <StatsBar
              totalResults={activeResultCount}
              searchTime={lastSearchTime}
              totalInDatabase={totalInDatabase}
            />

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="rounded-full border border-white/10 bg-white/5 p-3 text-blue-200">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm text-slate-300">Base indexada</p>
                  <p className="text-lg font-semibold text-white">{totalInDatabase} registros</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <FilterPanel
          filters={filters}
          availableNiza={availableNiza}
          availableViena={availableViena}
          onFilterChange={(next) => {
            void runFilters(next)
          }}
          onClearFilters={() => {
            setFilters(DEFAULT_FILTERS)
            void runFilters(DEFAULT_FILTERS)
          }}
        />

        <ResultsTable
          results={currentPageResults}
          isLoading={cargando}
          pagination={{
            page,
            total: filteredResults.length,
            limit: PAGE_SIZE
          }}
          onPageChange={setPage}
          onSelectMarca={setSelectedResult}
        />
      </main>

      {selectedResult && (
        <MarcaCard
          result={selectedResult}
          onClose={() => setSelectedResult(null)}
          onCopyId={async (id) => {
            await navigator.clipboard.writeText(id)
          }}
          onExport={() => setExportOpen(true)}
        />
      )}

      <ExportDialog
        results={filteredResults}
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
      />
    </div>
  )
}
