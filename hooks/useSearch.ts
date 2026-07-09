/**
 * Hook para manejo de búsquedas con caching y estado
 * Integra el motor de búsqueda con React
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { Marca, SearchParams, SearchResult, SearchResponse } from '@/types/marca'
import { SearchEngine, resetSearchEngine } from '@/lib/search-engine'
import { useAuditLog } from './useAuditLog'

export function useSearch(marcas: Marca[]) {
  const searchEngine = useMemo<SearchEngine | null>(() => {
    if (marcas.length === 0) return null
    return resetSearchEngine(marcas)
  }, [marcas])

  const [resultados, setResultados] = useState<SearchResult[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ultimaBusqueda, setUltimaBusqueda] = useState<SearchParams | null>(null)
  const { registrarBusqueda } = useAuditLog()

  /**
   * Ejecutar búsqueda
   */
  const search = useCallback(
    async (params: SearchParams): Promise<SearchResponse> => {
      try {
        setCargando(true)
        setError(null)

        const inicio = performance.now()
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
          throw new Error('Error consultando el API de búsqueda')
        }

        const results = Array.isArray(payload.results) ? payload.results : []
        const total = typeof payload.total === 'number' ? payload.total : results.length
        const page = typeof payload.page === 'number' ? payload.page : params.page || 1
        const totalPaginas = typeof payload.totalPages === 'number' ? payload.totalPages : 1
        const tiempo_ms = typeof payload.tiempo_ms === 'number' ? payload.tiempo_ms : Math.round(performance.now() - inicio)

        // Registrar en auditoría
        registrarBusqueda({
          query: params.query,
          tipo: params.type,
          resultados: total
        })

        // Guardar estado
        setResultados(results)
        setUltimaBusqueda(params)

        const searchResponse: SearchResponse = {
          resultados: results,
          total,
          pagina: page,
          totalPaginas,
          tiempo_ms
        }

        console.log(`[v0] Búsqueda completada: ${results.length} resultados en ${tiempo_ms}ms`)

        return searchResponse
      } catch (err) {
        if (searchEngine) {
          const results = searchEngine.search(params)
          setResultados(results)
          setUltimaBusqueda(params)
          registrarBusqueda({
            query: params.query,
            tipo: params.type,
            resultados: results.length
          })
          return {
            resultados: results,
            total: results.length,
            pagina: 1,
            totalPaginas: 1,
            tiempo_ms: 0
          }
        }

        const mensaje = err instanceof Error ? err.message : 'Error desconocido'
        setError(mensaje)
        console.error('[v0] Error en búsqueda:', err)
        return { resultados: [], total: 0, pagina: 1, totalPaginas: 0, tiempo_ms: 0 }
      } finally {
        setCargando(false)
      }
    },
    [searchEngine, registrarBusqueda]
  )

  /**
   * Búsqueda rápida por nombre
   */
  const searchByName = useCallback(
    (nombre: string) => {
      return search({ query: nombre, type: 'nombre' })
    },
    [search]
  )

  /**
   * Búsqueda por clase Niza
   */
  const searchByNiza = useCallback(
    (niza: string) => {
      return search({ query: niza, type: 'niza' })
    },
    [search]
  )

  /**
   * Búsqueda por código Viena
   */
  const searchByViena = useCallback(
    (viena: string) => {
      return search({ query: viena, type: 'viena' })
    },
    [search]
  )

  /**
   * Autocompletar
   */
  const autocomplete = useCallback(
    (query: string, limit: number = 10): string[] => {
      if (!searchEngine) return []
      return searchEngine.autocomplete(query, limit)
    },
    [searchEngine]
  )

  /**
   * Obtener estadísticas
   */
  const getStats = useCallback(() => {
    if (!searchEngine) return null
    return searchEngine.getStats()
  }, [searchEngine])

  /**
   * Limpiar búsqueda
   */
  const limpiar = useCallback(() => {
    setResultados([])
    setUltimaBusqueda(null)
    setError(null)
  }, [])

  return {
    // Estado
    resultados,
    cargando,
    error,
    ultimaBusqueda,

    // Métodos
    search,
    searchByName,
    searchByNiza,
    searchByViena,
    autocomplete,
    getStats,
    limpiar,

    // Información
    totalResultados: resultados.length,
    engine: searchEngine
  }
}
