'use client'

import { useState, useCallback } from 'react'
import type { Marca, SearchResult, SearchFilters } from '@/types/marca'

export type InapiSearchType = 'nombre' | 'solicitante' | 'clase' | 'solicitud' | 'registro'
export type InapiMatchMode = '1' | '2' | '3' | '4' // exacta | contenga | empieza | termina

export interface InapiSearchParams {
  query: string
  type?: InapiSearchType
  match?: InapiMatchMode
  filters?: SearchFilters
}

export interface InapiSearchResponse {
  results: SearchResult[]
  total: number
  tiempo_ms: number
  source: 'inapi' | 'local'
}

function marcaToSearchResult(marca: Marca): SearchResult {
  return {
    marca,
    relevancia: 1,
    matchType: 'partial',
  }
}

/**
 * Searches INAPI live via the /api/inapi/search proxy.
 * Applies client-side filter for estado after receiving results.
 */
export function useInapiSearch() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResponse, setLastResponse] = useState<InapiSearchResponse | null>(null)

  const search = useCallback(async (params: InapiSearchParams): Promise<InapiSearchResponse> => {
    if (!params.query.trim()) {
      setResults([])
      return { results: [], total: 0, tiempo_ms: 0, source: 'inapi' }
    }

    setLoading(true)
    setError(null)
    const t0 = performance.now()

    try {
      const url = new URL('/api/inapi/search', window.location.origin)
      url.searchParams.set('q', params.query.trim())
      if (params.type) url.searchParams.set('type', params.type)
      if (params.match) url.searchParams.set('match', params.match)

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      const tiempo_ms = Math.round(performance.now() - t0)

      if (data.error) throw new Error(data.error)

      let marcas: Marca[] = data.results ?? []

      // Client-side filter by estado
      if (params.filters?.estado) {
        marcas = marcas.filter((m) => m.estado === params.filters!.estado)
      }

      // Client-side filter by niza class
      if (params.filters?.niza?.length) {
        marcas = marcas.filter((m) =>
          params.filters!.niza!.some((n) => m.niza.includes(n))
        )
      }

      const searchResults = marcas.map(marcaToSearchResult)
      setResults(searchResults)

      const response: InapiSearchResponse = {
        results: searchResults,
        total: searchResults.length,
        tiempo_ms,
        source: 'inapi',
      }
      setLastResponse(response)
      return response
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(msg)
      console.error('[useInapiSearch] error:', err)
      const response: InapiSearchResponse = {
        results: [],
        total: 0,
        tiempo_ms: Math.round(performance.now() - t0),
        source: 'inapi',
      }
      setLastResponse(response)
      return response
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setResults([])
    setError(null)
    setLastResponse(null)
  }, [])

  return { results, loading, error, lastResponse, search, clear }
}
