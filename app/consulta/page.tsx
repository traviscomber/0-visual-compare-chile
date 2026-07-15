'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertTriangle, Shield, ArrowLeft, Database, Search, Tags } from 'lucide-react'
import { SearchResult, SearchFilters } from '@/types/marca'
import { useSearch } from '@/hooks/useSearch'
import { buildClassificationKnowledgeDigest, searchClassificationCatalog } from '@/lib/classification-knowledge'
import { buildResultReason, buildResultRiskLevel, buildSearchExecutiveSummary, formatRiskLabel } from '@/lib/trademark-insights'
import {
  ExportDialog,
  FilterPanel,
  MarcaCard,
  ResultsTable,
  SearchPanel,
  StatsBar
} from '@/components/api-portal'

const PAGE_SIZE = 8

const DEFAULT_FILTERS: SearchFilters = {}

export default function ConsultaPage() {
  return (
    <Suspense fallback={<ConsultaLoadingState />}>
      <ConsultaPageContent />
    </Suspense>
  )
}

function ConsultaPageContent() {
  const searchParams = useSearchParams()
  const initialQuery = getInitialQuery(searchParams)
  const initialType = getInitialSearchType(searchParams)
  const searchParamsKey = searchParams.toString()

  const [query, setQuery] = useState(initialQuery)
  const [activeQuery, setActiveQuery] = useState(initialQuery)
  const [searchType, setSearchType] = useState<'nombre' | 'niza' | 'viena'>(initialType)
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [lastSearchTime, setLastSearchTime] = useState(0)
  const [totalInDatabase, setTotalInDatabase] = useState(0)
  const [availableNiza, setAvailableNiza] = useState<string[]>([])
  const [availableViena, setAvailableViena] = useState<string[]>([])
  const classificationDigest = useMemo(() => buildClassificationKnowledgeDigest(), [])
  const operationalSuggestions = useMemo(() => {
    return {
      niza: searchClassificationCatalog('niza', query, 3),
      viena: searchClassificationCatalog('viena', query, 3),
    }
  }, [query])

  const {
    search,
    resultados,
    cargando,
    getStats
  } = useSearch()

  useEffect(() => {
    const loadStats = async () => {
      const stats = await getStats()
      if (stats) {
        setTotalInDatabase(stats.totalMarcas)
      }
    }

    void loadStats()
  }, [getStats])

  useEffect(() => {
    const loadClassifications = async () => {
      try {
        const [nizaResponse, vienaResponse] = await Promise.all([
          fetch('/api/v1/search/niza'),
          fetch('/api/v1/search/viena'),
        ])

        if (nizaResponse.ok) {
          const payload = await nizaResponse.json()
          setAvailableNiza(
            Array.isArray(payload.results)
              ? payload.results.map((item: { codigo: string }) => item.codigo)
              : []
          )
        }

        if (vienaResponse.ok) {
          const payload = await vienaResponse.json()
          setAvailableViena(
            Array.isArray(payload.results)
              ? payload.results.map((item: { codigo: string }) => item.codigo)
              : []
          )
        }
      } catch (error) {
        console.error('[v0] Failed to load portal classifications:', error)
      }
    }

    void loadClassifications()
  }, [])

  useEffect(() => {
    const runInitialSearch = async () => {
      const nextQuery = getInitialQuery(searchParams)
      const nextType = getInitialSearchType(searchParams)

      setQuery(nextQuery)
      setActiveQuery(nextQuery)
      setSearchType(nextType)
      setFilters(DEFAULT_FILTERS)

      const response = await search({
        query: nextQuery,
        type: nextType,
        filters: DEFAULT_FILTERS
      })
      setLastSearchTime(response.tiempo_ms)
    }

    void runInitialSearch()
  }, [search, searchParamsKey])

  useEffect(() => {
    setPage(1)
  }, [resultados])

  const filteredResults = useMemo(() => {
    return resultados.filter((result) => {
      if (filters.estado && result.marca.estado !== filters.estado) return false
      if (filters.pais && result.marca.pais !== filters.pais.toUpperCase()) return false
      if (filters.fechaDesde && new Date(result.marca.fecha) < new Date(filters.fechaDesde)) return false
      if (filters.fechaHasta && new Date(result.marca.fecha) > new Date(filters.fechaHasta)) return false
      if (filters.niza?.length && !filters.niza.some((item) => result.marca.niza.includes(item))) return false
      if (filters.viena?.length && !filters.viena.some((item) => result.marca.viena.includes(item))) return false
      return true
    })
  }, [filters, resultados])

  const currentPageResults = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredResults.slice(start, start + PAGE_SIZE)
  }, [filteredResults, page])

  const runSearch = async (
    nextQuery: string,
    nextType: 'nombre' | 'niza' | 'viena',
    nextFilters: SearchFilters = filters
  ) => {
    setQuery(nextQuery)
    setActiveQuery(nextQuery)
    setSearchType(nextType)
    const response = await search({
      query: nextQuery,
      type: nextType,
      filters: nextFilters
    })
    setLastSearchTime(response.tiempo_ms)
    setPage(1)
  }

  const runFilters = async (nextFilters: SearchFilters) => {
    setFilters(nextFilters)

    const response = await search({
      query: activeQuery.trim(),
      type: searchType,
      filters: nextFilters
    })
    setLastSearchTime(response.tiempo_ms)
    setPage(1)
  }

  const activeResultCount = filteredResults.length
  const executiveSummary = useMemo(
    () => buildSearchExecutiveSummary(activeQuery, searchType, filteredResults),
    [activeQuery, filteredResults, searchType],
  )

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
              void runSearch(query, type, filters)
            }}
            onSearch={runSearch}
          />

          <div className="space-y-6">
            <StatsBar
              totalResults={activeResultCount}
              searchTime={lastSearchTime}
              totalInDatabase={totalInDatabase}
            />

            <SearchContextCard
              query={query}
              searchType={searchType}
              totalResults={activeResultCount}
              availableNiza={availableNiza}
              availableViena={availableViena}
              classificationDigest={classificationDigest}
              suggestions={operationalSuggestions}
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

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <ExecutiveSummaryCard
            query={activeQuery}
            searchType={searchType}
            summary={executiveSummary}
            topResults={filteredResults.slice(0, 3)}
          />
          <DecisionGuideCard summary={executiveSummary} />
        </section>

        <ResultsTable
          results={currentPageResults}
          isLoading={cargando}
          pagination={{
            page,
            total: filteredResults.length,
            limit: PAGE_SIZE
          }}
          query={activeQuery}
          searchType={searchType}
          onPageChange={setPage}
          onSelectMarca={setSelectedResult}
        />
      </main>

      {selectedResult && (
        <MarcaCard
          result={selectedResult}
          query={activeQuery}
          searchType={searchType}
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

function ExecutiveSummaryCard({
  query,
  searchType,
  summary,
  topResults,
}: {
  query: string
  searchType: 'nombre' | 'niza' | 'viena'
  summary: ReturnType<typeof buildSearchExecutiveSummary>
  topResults: SearchResult[]
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Resumen ejecutivo</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{summary.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">{summary.recommendation}</p>
        </div>
        <div className={riskPanelClassName(summary.risk)}>
          <p className="text-xs uppercase tracking-[0.2em]">Riesgo</p>
          <p className="mt-2 text-2xl font-semibold">{summary.riskLabel}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <SummaryMetric label="Conflictos altos" value={String(summary.criticalCount)} />
        <SummaryMetric label="Registradas" value={String(summary.registeredCount)} />
        <SummaryMetric label="Clases expuestas" value={summary.topNiza.join(', ') || 'Sin dato'} />
        <SummaryMetric label="Estados" value={summary.topStates.join(' · ') || 'Sin dato'} />
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          Prioridad de revision
        </div>
        {topResults.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
            No hay coincidencias directas para esta consulta. El paso siguiente es validar clases y, si aplica, comparar el logo.
          </div>
        ) : (
          topResults.map((result) => {
            const risk = buildResultRiskLevel(result, query, searchType)
            const reason = buildResultReason(result, query, searchType)
            return (
              <Link
                key={result.marca.id}
                href={`/marca/${result.marca.id}`}
                className="block rounded-2xl border border-white/10 bg-slate-950/45 p-4 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{result.marca.nombre}</p>
                    <p className="mt-1 text-sm text-slate-300">{reason}</p>
                  </div>
                  <span className={resultRiskClassName(risk)}>{formatRiskLabel(risk)}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span>{result.marca.estado}</span>
                  <span>Relevancia {result.relevancia}%</span>
                  <span>Niza {result.marca.niza.slice(0, 2).join(', ') || 'sin dato'}</span>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}

function DecisionGuideCard({ summary }: { summary: ReturnType<typeof buildSearchExecutiveSummary> }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Que hacer ahora</p>
      <div className="mt-4 space-y-4">
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <p className="text-sm font-medium text-white">1. Resolver la parte legal</p>
          <p className="mt-2 text-sm text-slate-300">
            {summary.risk === 'high'
              ? 'Hay señales suficientes para frenar el registro hasta revisar el caso principal.'
              : summary.risk === 'medium'
                ? 'Conviene revisar coexistencia y clases antes de presentar.'
                : 'No hay bloqueo directo visible, pero igual hay que dejar evidencia de la revision.'}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <p className="text-sm font-medium text-white">2. Abrir la ficha correcta</p>
          <p className="mt-2 text-sm text-slate-300">
            Desde cada resultado puedes abrir la ficha con numero de solicitud, clases, metadata y conflictos relacionados.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <p className="text-sm font-medium text-white">3. Cruzar el logo si aplica</p>
          <p className="mt-2 text-sm text-slate-300">
            La parte visual vive en Compare. El nombre y el logo deben coincidir en la misma decision.
          </p>
          <div className="mt-3">
            <Link
              href={`/compare?brand=${encodeURIComponent(summary.primaryResult?.marca.nombre ?? '')}`}
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100 transition hover:bg-white/10"
            >
              Abrir Compare
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  )
}

function riskPanelClassName(risk: 'high' | 'medium' | 'low') {
  if (risk === 'high') return 'rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-red-100'
  if (risk === 'medium') return 'rounded-2xl border border-amber-400/30 bg-amber-500/15 px-4 py-3 text-amber-100'
  return 'rounded-2xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-3 text-emerald-100'
}

function resultRiskClassName(risk: 'high' | 'medium' | 'low') {
  if (risk === 'high') return 'rounded-full border border-red-400/30 bg-red-500/15 px-3 py-1 text-xs text-red-100'
  if (risk === 'medium') return 'rounded-full border border-amber-400/30 bg-amber-500/15 px-3 py-1 text-xs text-amber-100'
  return 'rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs text-emerald-100'
}

function ConsultaLoadingState() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#0f172a_40%,_#111827_100%)]" />
  )
}

function SearchContextCard({
  query,
  searchType,
  totalResults,
  availableNiza,
  availableViena,
  classificationDigest,
  suggestions,
}: {
  query: string
  searchType: 'nombre' | 'niza' | 'viena'
  totalResults: number
  availableNiza: string[]
  availableViena: string[]
  classificationDigest: { niza: { codigo: string; titulo: string; keywords: string[] }[]; viena: { codigo: string; titulo: string; keywords: string[] }[] }
  suggestions: { niza: { codigo: string; titulo: string; keywords: string[] }[]; viena: { codigo: string; titulo: string; keywords: string[] }[] }
}) {
  const quickNiza = availableNiza.slice(0, 3)
  const quickViena = availableViena.slice(0, 3)
  const suggestedNiza = suggestions.niza
  const suggestedViena = suggestions.viena

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="rounded-full border border-white/10 bg-white/5 p-3 text-blue-200">
          <Search className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm text-slate-300">Contexto operativo</p>
          <p className="text-lg font-semibold text-white">{query.trim() || 'Sin consulta activa'}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <BadgePill label="Tipo" value={searchType} />
        <BadgePill label="Resultados" value={`${totalResults}`} />
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
          <Tags className="h-3.5 w-3.5" />
          Atajos rápidos
        </div>
        <div className="flex flex-wrap gap-2">
          {quickNiza.map((code) => (
            <Link
              key={`quick-niza-${code}`}
              href={`/consulta?type=niza&q=${encodeURIComponent(code)}`}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100 transition hover:bg-white/10"
            >
              Niza {code}
            </Link>
          ))}
          {quickViena.map((code) => (
            <Link
              key={`quick-viena-${code}`}
              href={`/consulta?type=viena&q=${encodeURIComponent(code)}`}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100 transition hover:bg-white/10"
            >
              Viena {code}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
          <Database className="h-3.5 w-3.5" />
          Sugerencias operativas
        </div>
        <div className="space-y-2">
          {suggestedNiza.map((item) => (
            <Link
              key={`suggested-niza-${item.codigo}`}
              href={`/consulta?type=niza&q=${encodeURIComponent(item.codigo)}`}
              className="block rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
            >
              <p className="text-sm font-medium text-white">Niza {item.codigo}</p>
              <p className="text-xs text-slate-400">{item.titulo}</p>
            </Link>
          ))}
          {suggestedViena.map((item) => (
            <Link
              key={`suggested-viena-${item.codigo}`}
              href={`/consulta?type=viena&q=${encodeURIComponent(item.codigo)}`}
              className="block rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
            >
              <p className="text-sm font-medium text-white">Viena {item.codigo}</p>
              <p className="text-xs text-slate-400">{item.titulo}</p>
            </Link>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          {classificationDigest.niza.length} clases Niza y {classificationDigest.viena.length} códigos Viena en el
          catálogo operativo.
        </p>
      </div>
    </div>
  )
}

function BadgePill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1 text-slate-200">
      <span className="text-slate-400">{label}:</span> {value}
    </div>
  )
}

function getInitialQuery(searchParams: ReturnType<typeof useSearchParams>): string {
  const q = searchParams.get('q')?.trim()
  return q && q.length > 0 ? q : 'VISUAL'
}

function getInitialSearchType(searchParams: ReturnType<typeof useSearchParams>): 'nombre' | 'niza' | 'viena' {
  const type = searchParams.get('type')
  if (type === 'niza' || type === 'viena') return type
  return 'nombre'
}


