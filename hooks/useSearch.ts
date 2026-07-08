/**
 * Hook para manejo de búsquedas con caching y estado
 * Integra el motor de búsqueda con React
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { Marca, SearchParams, SearchResult, SearchResponse } from '@/types/marca'
import { SearchEngine, getSearchEngine } from '@/lib/search-engine'
import { useAuditLog } from './useAuditLog'

export function useSearch(marcas: Marca[]) {
  const [searchEngine, setSearchEngine] = useState<SearchEngine | null>(null)
  const [resultados, setResultados] = useState<SearchResult[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ultimaBusqueda, setUltimaBusqueda] = useState<SearchParams | null>(null)
  const { registrarBusqueda } = useAuditLog()

  // Inicializar motor de búsqueda
  useEffect(() => {
    if (marcas.length > 0) {
      const engine = getSearchEngine(marcas)
      setSearchEngine(engine)
      console.log(`[v0] Motor de búsqueda inicializado con ${marcas.length} marcas`)
    }
  }, [marcas.length])

  /**
   * Ejecutar búsqueda
   */
  const search = useCallback(
    async (params: SearchParams): Promise<SearchResponse> => {
      if (!searchEngine) {
        setError('Motor de búsqueda no inicializado')
        return { resultados: [], total: 0, pagina: 1, totalPaginas: 0, tiempo_ms: 0 }
      }

      try {
        setCargando(true)
        setError(null)

        const inicio = performance.now()

        // Ejecutar búsqueda
        const results = searchEngine.search(params)

        // Implementar paginación
        const page = params.page || 1
        const limit = params.limit || 10
        const startIdx = (page - 1) * limit
        const endIdx = startIdx + limit

        const paginados = results.slice(startIdx, endIdx)
        const totalPaginas = Math.ceil(results.length / limit)

        const tiempo_ms = Math.round(performance.now() - inicio)

        // Registrar en auditoría
        registrarBusqueda({
          query: params.query,
          tipo: params.type,
          resultados: results.length
        })

        // Guardar estado
        setResultados(results)
        setUltimaBusqueda(params)

        const response: SearchResponse = {
          resultados: paginados,
          total: results.length,
          pagina: page,
          totalPaginas,
          tiempo_ms
        }

        console.log(`[v0] Búsqueda completada: ${results.length} resultados en ${tiempo_ms}ms`)

        return response
      } catch (err) {
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
