'use client'

import { useCallback, useState } from 'react'
import { SearchParams, SearchResponse, SearchResult } from '@/types/marca'
import { useAuditLog } from './useAuditLog'

interface SearchStats {
  totalMarcas: number
  source?: string
}

export function useSearch() {
  const [resultados, setResultados] = useState<SearchResult[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ultimaBusqueda, setUltimaBusqueda] = useState<SearchParams | null>(null)
  const { registrarBusqueda } = useAuditLog()

  const search = useCallback(
    async (params: SearchParams): Promise<SearchResponse> => {
      try {
        setCargando(true)
        setError(null)

        const startedAt = performance.now()
        const url = new URL('/api/v1/search', window.location.origin)
        url.searchParams.set('q', params.query)
        url.searchParams.set('type', params.type)

        if (params.page) {
          url.searchParams.set('page', String(params.page))
        }

        if (params.limit) {
          url.searchParams.set('limit', String(params.limit))
        }

        if (params.filters?.estado) {
          url.searchParams.set('estado', params.filters.estado)
        }

        if (params.filters?.pais) {
          url.searchParams.set('pais', params.filters.pais)
        }

        if (params.filters?.fechaDesde) {
          url.searchParams.set('fechaDesde', params.filters.fechaDesde)
        }

        if (params.filters?.fechaHasta) {
          url.searchParams.set('fechaHasta', params.filters.fechaHasta)
        }

        if (params.filters?.niza?.length) {
          url.searchParams.set('niza', params.filters.niza.join(','))
        }

        if (params.filters?.viena?.length) {
          url.searchParams.set('viena', params.filters.viena.join(','))
        }

        const apiResponse = await fetch(url.toString())
        const payload = apiResponse.ok ? await apiResponse.json() : null

        if (!apiResponse.ok || !payload) {
          throw new Error('Error consultando el API de busqueda')
        }

        const results = Array.isArray(payload.results) ? payload.results : []
        const total = typeof payload.total === 'number' ? payload.total : results.length
        const page = typeof payload.page === 'number' ? payload.page : params.page || 1
        const totalPaginas = typeof payload.totalPages === 'number' ? payload.totalPages : 1
        const tiempo_ms =
          typeof payload.tiempo_ms === 'number'
            ? payload.tiempo_ms
            : Math.round(performance.now() - startedAt)

        registrarBusqueda({
          query: params.query,
          tipo: params.type,
          resultados: total,
        })

        setResultados(results)
        setUltimaBusqueda(params)

        return {
          resultados: results,
          total,
          pagina: page,
          totalPaginas,
          tiempo_ms,
        }
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : 'Error desconocido'
        setError(mensaje)
        console.error('[v0] Error en busqueda:', err)
        return { resultados: [], total: 0, pagina: 1, totalPaginas: 0, tiempo_ms: 0 }
      } finally {
        setCargando(false)
      }
    },
    [registrarBusqueda],
  )

  const searchByName = useCallback((nombre: string) => search({ query: nombre, type: 'nombre' }), [search])
  const searchByNiza = useCallback((niza: string) => search({ query: niza, type: 'niza' }), [search])
  const searchByViena = useCallback((viena: string) => search({ query: viena, type: 'viena' }), [search])

  const autocomplete = useCallback((): string[] => [], [])

  const getStats = useCallback(async (): Promise<SearchStats | null> => {
    try {
      const url = new URL('/api/v1/search/stats', window.location.origin)

      const response = await fetch(url.toString())
      const payload = response.ok ? await response.json() : null

      if (!response.ok || !payload || typeof payload.totalRecords !== 'number') {
        return null
      }

      return {
        totalMarcas: payload.totalRecords,
        source: typeof payload.source === 'string' ? payload.source : undefined,
      }
    } catch (err) {
      console.error('[v0] Error obteniendo estadisticas de busqueda:', err)
      return null
    }
  }, [])

  const limpiar = useCallback(() => {
    setResultados([])
    setUltimaBusqueda(null)
    setError(null)
  }, [])

  return {
    resultados,
    cargando,
    error,
    ultimaBusqueda,
    search,
    searchByName,
    searchByNiza,
    searchByViena,
    autocomplete,
    getStats,
    limpiar,
    totalResultados: resultados.length,
    engine: null,
  }
}
