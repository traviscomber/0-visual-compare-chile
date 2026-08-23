'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertTriangle, ArrowLeft, Check, Database, Search, Tags } from 'lucide-react'
import { SearchResult, SearchFilters } from '@/types/marca'
import { useSearch } from '@/hooks/useSearch'
import { buildClassificationKnowledgeDigest, searchClassificationCatalog } from '@/lib/classification-knowledge'
import { buildResultReason, buildResultRiskLevel, buildSearchExecutiveSummary, formatRiskLabel } from '@/lib/trademark-insights'
import { ExportDialog, FilterPanel, MarcaCard, ResultsTable, SearchPanel, StatsBar } from '@/components/api-portal'

const PAGE_SIZE = 8
const DEFAULT_FILTERS: SearchFilters = {}

export default function ConsultaPage() {
  return <Suspense fallback={<ConsultaLoadingState />}><ConsultaPageContent /></Suspense>
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
  const operationalSuggestions = useMemo(() => ({ niza: searchClassificationCatalog('niza', query, 3), viena: searchClassificationCatalog('viena', query, 3) }), [query])
  const { search, resultados, cargando, getStats } = useSearch()

  useEffect(() => { void getStats().then((stats) => { if (stats) setTotalInDatabase(stats.totalMarcas) }) }, [getStats])

  useEffect(() => {
    const load = async () => {
      try {
        const [nizaResponse, vienaResponse] = await Promise.all([fetch('/api/v1/search/niza'), fetch('/api/v1/search/viena')])
        if (nizaResponse.ok) { const payload = await nizaResponse.json(); setAvailableNiza(Array.isArray(payload.results) ? payload.results.map((item: { codigo: string }) => item.codigo) : []) }
        if (vienaResponse.ok) { const payload = await vienaResponse.json(); setAvailableViena(Array.isArray(payload.results) ? payload.results.map((item: { codigo: string }) => item.codigo) : []) }
      } catch (error) { console.error('[consulta] no se pudieron cargar clasificaciones', error) }
    }
    void load()
  }, [])

  useEffect(() => {
    const runInitialSearch = async () => {
      const nextQuery = getInitialQuery(searchParams)
      const nextType = getInitialSearchType(searchParams)
      setQuery(nextQuery); setActiveQuery(nextQuery); setSearchType(nextType); setFilters(DEFAULT_FILTERS)
      if (!nextQuery) { setLastSearchTime(0); return }
      const response = await search({ query: nextQuery, type: nextType, filters: DEFAULT_FILTERS })
      setLastSearchTime(response.tiempo_ms)
    }
    void runInitialSearch()
  }, [search, searchParamsKey])

  useEffect(() => { setPage(1) }, [resultados])

  const filteredResults = useMemo(() => resultados.filter((result) => {
    if (filters.estado && result.marca.estado !== filters.estado) return false
    if (filters.pais && result.marca.pais !== filters.pais.toUpperCase()) return false
    if (filters.fechaDesde && new Date(result.marca.fecha) < new Date(filters.fechaDesde)) return false
    if (filters.fechaHasta && new Date(result.marca.fecha) > new Date(filters.fechaHasta)) return false
    if (filters.niza?.length && !filters.niza.some((item) => result.marca.niza.includes(item))) return false
    if (filters.viena?.length && !filters.viena.some((item) => result.marca.viena.includes(item))) return false
    return true
  }), [filters, resultados])

  const currentPageResults = useMemo(() => filteredResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredResults, page])
  const executiveSummary = useMemo(() => activeQuery ? buildSearchExecutiveSummary(activeQuery, searchType, filteredResults) : null, [activeQuery, filteredResults, searchType])

  const runSearch = async (nextQuery: string, nextType: 'nombre' | 'niza' | 'viena', nextFilters: SearchFilters = filters) => {
    const clean = nextQuery.trim(); setQuery(nextQuery); setSearchType(nextType); setPage(1)
    if (!clean) { setActiveQuery(''); return }
    setActiveQuery(clean)
    const response = await search({ query: clean, type: nextType, filters: nextFilters })
    setLastSearchTime(response.tiempo_ms)
  }

  const runFilters = async (nextFilters: SearchFilters) => {
    setFilters(nextFilters)
    if (!activeQuery) return
    const response = await search({ query: activeQuery, type: searchType, filters: nextFilters })
    setLastSearchTime(response.tiempo_ms); setPage(1)
  }

  return (
    <main className="min-h-screen bg-[#F7F8F6] text-[#111827]">
      <header className="sticky top-0 z-30 border-b border-black/10 bg-[#F7F8F6]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1480px] items-center justify-between px-5 lg:px-10">
          <div className="flex items-center gap-4"><Link href="/panel" className="grid h-9 w-9 place-items-center rounded-lg border border-black/10 text-[#667085] hover:bg-black/5" aria-label="Volver al panel"><ArrowLeft className="h-4 w-4" /></Link><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0F766E]">VIDENTIA / INVESTIGACIÓN</p><h1 className="mt-1 text-lg font-medium tracking-[-0.02em]">Consulta de marcas</h1></div></div>
          <Link href="/" className="text-right"><span className="block text-xs font-semibold tracking-[0.16em]">VIDENTIA</span><span className="mt-1 block text-[9px] uppercase tracking-[0.18em] text-[#98A2B3]">by N3uralia</span></Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1480px] px-5 py-8 lg:px-10 lg:py-10">
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <SearchPanel query={query} searchType={searchType} isLoading={cargando} onQueryChange={setQuery} onSearchTypeChange={(type) => { setSearchType(type); if (query.trim()) void runSearch(query, type, filters) }} onSearch={runSearch} />
          <div className="space-y-6"><StatsBar totalResults={filteredResults.length} searchTime={lastSearchTime} totalInDatabase={totalInDatabase} /><SearchContextCard query={query} searchType={searchType} totalResults={filteredResults.length} availableNiza={availableNiza} availableViena={availableViena} classificationDigest={classificationDigest} suggestions={operationalSuggestions} /></div>
        </div>

        <div className="mt-6"><FilterPanel filters={filters} availableNiza={availableNiza} availableViena={availableViena} onFilterChange={(next) => void runFilters(next)} onClearFilters={() => { setFilters(DEFAULT_FILTERS); void runFilters(DEFAULT_FILTERS) }} /></div>

        {!activeQuery ? <EmptySearchState totalInDatabase={totalInDatabase} /> : executiveSummary ? <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"><ExecutiveSummaryCard query={activeQuery} searchType={searchType} summary={executiveSummary} topResults={filteredResults.slice(0, 3)} /><DecisionGuideCard summary={executiveSummary} /></section> : null}

        {activeQuery && <div className="mt-6"><ResultsTable results={currentPageResults} isLoading={cargando} pagination={{ page, total: filteredResults.length, limit: PAGE_SIZE }} query={activeQuery} searchType={searchType} onPageChange={setPage} onSelectMarca={setSelectedResult} /></div>}
      </div>

      {selectedResult && <MarcaCard result={selectedResult} query={activeQuery} searchType={searchType} onClose={() => setSelectedResult(null)} onCopyId={async (id) => navigator.clipboard.writeText(id)} onExport={() => setExportOpen(true)} />}
      <ExportDialog results={filteredResults} isOpen={exportOpen} onClose={() => setExportOpen(false)} />
    </main>
  )
}

function EmptySearchState({ totalInDatabase }: { totalInDatabase: number }) {
  return <section className="mt-6 border-y border-black/10 bg-white px-6 py-14 text-center"><Search className="mx-auto h-5 w-5 text-[#0F766E]" /><h2 className="mt-4 text-2xl font-normal tracking-[-0.03em]">Empieza con una marca, una clase o un código.</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#667085]">La consulta no carga resultados artificiales al abrirse. Busca sólo cuando tengas un criterio real de investigación{totalInDatabase > 0 ? ` sobre una base indexada de ${totalInDatabase.toLocaleString('es-CL')} registros` : ''}.</p></section>
}

function ExecutiveSummaryCard({ query, searchType, summary, topResults }: { query: string; searchType: 'nombre' | 'niza' | 'viena'; summary: ReturnType<typeof buildSearchExecutiveSummary>; topResults: SearchResult[] }) {
  return <section className="border-y border-black/10 bg-white px-6 py-7"><div className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0F766E]">LECTURA DE LA CONSULTA</p><h2 className="mt-3 text-2xl font-normal tracking-[-0.03em]">{summary.title}</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-[#667085]">{summary.recommendation}</p></div><div className={priorityPanelClassName(summary.risk)}><p className="text-[10px] uppercase tracking-[0.16em]">Prioridad de revisión</p><p className="mt-1 text-lg font-medium">{summary.riskLabel}</p></div></div><div className="mt-6 grid border-y border-black/10 sm:grid-cols-4"><Metric label="Conflictos altos" value={String(summary.criticalCount)} /><Metric label="Registradas" value={String(summary.registeredCount)} /><Metric label="Clases" value={summary.topNiza.join(', ') || 'Sin dato'} /><Metric label="Estados" value={summary.topStates.join(' · ') || 'Sin dato'} /></div><div className="mt-6"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">ANTECEDENTES A REVISAR</p><div className="mt-3 divide-y divide-black/10 border-y border-black/10">{topResults.length === 0 ? <p className="py-5 text-sm text-[#667085]">No hay coincidencias priorizadas en esta consulta.</p> : topResults.map((result) => { const risk = buildResultRiskLevel(result, query, searchType); return <Link key={result.marca.id} href={`/marca/${result.marca.id}`} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{result.marca.nombre}</p><p className="mt-1 text-sm text-[#667085]">{buildResultReason(result, query, searchType)}</p></div><span className={resultPriorityClassName(risk)}>{formatRiskLabel(risk)}</span></Link> })}</div></div><p className="mt-4 text-xs leading-5 text-[#98A2B3]">La prioridad organiza la revisión de antecedentes; no constituye una opinión sobre registrabilidad.</p></section>
}

function DecisionGuideCard({ summary }: { summary: ReturnType<typeof buildSearchExecutiveSummary> }) {
  const first = summary.risk === 'high' ? 'Revisa primero los antecedentes de mayor proximidad antes de avanzar.' : summary.risk === 'medium' ? 'Contrasta coexistencia, clases y alcance antes de presentar.' : 'Documenta la búsqueda y abre los antecedentes que sigan siendo relevantes.'
  return <section className="border-y border-black/10 bg-[#111827] px-6 py-7 text-white"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#63C7B8]">SIGUIENTE PASO</p><h2 className="mt-3 text-2xl font-normal tracking-[-0.03em]">Convierte la búsqueda en una revisión trazable.</h2><div className="mt-6 divide-y divide-white/15 border-y border-white/15"><Guide number="01" title="Revisar" text={first} /><Guide number="02" title="Abrir ficha" text="Confirma solicitud, titular, clases, estado y evidencia de cada antecedente relevante." /><Guide number="03" title="Cruzar imagen" text="Si la marca incluye elementos figurativos, completa la lectura con la comparación visual." /></div><Link href={`/compare?brand=${encodeURIComponent(summary.primaryResult?.marca.nombre ?? '')}`} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#63C7B8]">Abrir comparación visual <Check className="h-4 w-4" /></Link></section>
}

function SearchContextCard({ query, searchType, totalResults, availableNiza, availableViena, classificationDigest, suggestions }: { query: string; searchType: 'nombre' | 'niza' | 'viena'; totalResults: number; availableNiza: string[]; availableViena: string[]; classificationDigest: { niza: { codigo: string; titulo: string; keywords: string[] }[]; viena: { codigo: string; titulo: string; keywords: string[] }[] }; suggestions: { niza: { codigo: string; titulo: string; keywords: string[] }[]; viena: { codigo: string; titulo: string; keywords: string[] }[] } }) {
  return <section className="border-y border-black/10 bg-white px-5 py-5"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[0.18em] text-[#98A2B3]">CONTEXTO</p><p className="mt-2 text-lg font-medium">{query.trim() || 'Sin consulta activa'}</p></div><div className="text-right text-xs text-[#667085]"><p>{searchType.toUpperCase()}</p><p className="mt-1">{totalResults} resultados</p></div></div><div className="mt-5 border-t border-black/10 pt-4"><div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#98A2B3]"><Tags className="h-3.5 w-3.5" />Sugerencias</div><div className="mt-3 space-y-2">{[...suggestions.niza.map((item) => ({ prefix: 'Niza', ...item })), ...suggestions.viena.map((item) => ({ prefix: 'Viena', ...item }))].slice(0, 4).map((item) => <Link key={`${item.prefix}-${item.codigo}`} href={`/consulta?type=${item.prefix === 'Niza' ? 'niza' : 'viena'}&q=${encodeURIComponent(item.codigo)}`} className="block border-l-2 border-black/10 pl-3 text-sm text-[#475467] hover:border-[#0F766E]"><span className="font-medium">{item.prefix} {item.codigo}</span><span className="ml-2 text-[#98A2B3]">{item.titulo}</span></Link>)}</div></div><p className="mt-5 text-xs text-[#98A2B3]">Catálogo operativo: {classificationDigest.niza.length} clases Niza · {classificationDigest.viena.length} códigos Viena. Disponibles en índice: {availableNiza.length} / {availableViena.length}.</p></section>
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="px-4 py-4 first:pl-0 sm:border-l sm:border-black/10 sm:first:border-l-0"><p className="text-[10px] uppercase tracking-[0.15em] text-[#98A2B3]">{label}</p><p className="mt-2 text-sm font-medium">{value}</p></div> }
function Guide({ number, title, text }: { number: string; title: string; text: string }) { return <div className="grid gap-2 py-4 sm:grid-cols-[40px_110px_1fr]"><span className="font-mono text-xs text-[#63C7B8]">{number}</span><span className="text-sm font-medium">{title}</span><span className="text-sm leading-6 text-slate-400">{text}</span></div> }
function priorityPanelClassName(risk: 'high' | 'medium' | 'low') { if (risk === 'high') return 'border-l-2 border-red-400 pl-4 text-red-700'; if (risk === 'medium') return 'border-l-2 border-amber-400 pl-4 text-amber-800'; return 'border-l-2 border-emerald-500 pl-4 text-emerald-700' }
function resultPriorityClassName(risk: 'high' | 'medium' | 'low') { if (risk === 'high') return 'text-xs font-medium text-red-700'; if (risk === 'medium') return 'text-xs font-medium text-amber-800'; return 'text-xs font-medium text-emerald-700' }
function ConsultaLoadingState() { return <div className="min-h-screen bg-[#F7F8F6]" /> }
function getInitialQuery(searchParams: ReturnType<typeof useSearchParams>): string { return searchParams.get('q')?.trim() ?? '' }
function getInitialSearchType(searchParams: ReturnType<typeof useSearchParams>): 'nombre' | 'niza' | 'viena' { const type = searchParams.get('type'); return type === 'niza' || type === 'viena' ? type : 'nombre' }
