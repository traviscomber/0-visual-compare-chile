import { useEffect, useState } from 'react'
import {
  initializeDatabase,
  getDatabase,
  loadSampleData,
  searchByName,
  searchByNiza,
  getNizaClasses,
  getVienaCodes,
  getTotalRecords,
  logSearch,
} from '@/lib/db-loader'
import { RegistroMarca, ClaseNiza, CodigoViena, SearchResult } from '@/lib/db-types'

interface UseDatabaseReturn {
  isLoaded: boolean
  isLoading: boolean
  error: Error | null
  totalRecords: number
  search: (query: string, tipo: 'nombre' | 'niza' | 'viena', limit?: number) => Promise<SearchResult[]>
  getNiza: () => Promise<ClaseNiza[]>
  getViena: () => Promise<CodigoViena[]>
  logSearch: (query: string, tipo: string, resultados: number) => Promise<void>
}

export function useDatabase(): UseDatabaseReturn {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [totalRecords, setTotalRecords] = useState(0)

  useEffect(() => {
    let isMounted = true

    async function setupDatabase() {
      try {
        setIsLoading(true)
        
        // Initialize database
        await initializeDatabase()
        
        // Load sample data
        await loadSampleData()
        
        // Get total records
        const total = await getTotalRecords()
        
        if (isMounted) {
          setTotalRecords(total)
          setIsLoaded(true)
          setError(null)
          console.log('[Hook] Database setup complete')
        }
      } catch (err) {
        if (isMounted) {
          const error = err instanceof Error ? err : new Error('Unknown error')
          setError(error)
          console.error('[Hook] Database setup failed:', error)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    setupDatabase()

    return () => {
      isMounted = false
    }
  }, [])

  async function search(
    query: string,
    tipo: 'nombre' | 'niza' | 'viena',
    limit = 20
  ): Promise<SearchResult[]> {
    try {
      let results: SearchResult[] = []

      if (tipo === 'nombre') {
        results = await searchByName(query, limit)
      } else if (tipo === 'niza') {
        results = await searchByNiza(query, limit)
      }

      await logSearch(query, tipo, results.length)
      return results
    } catch (err) {
      console.error('[Hook] Search failed:', err)
      return []
    }
  }

  async function getNiza(): Promise<ClaseNiza[]> {
    try {
      return await getNizaClasses()
    } catch (err) {
      console.error('[Hook] Get Niza failed:', err)
      return []
    }
  }

  async function getViena(): Promise<CodigoViena[]> {
    try {
      return await getVienaCodes()
    } catch (err) {
      console.error('[Hook] Get Viena failed:', err)
      return []
    }
  }

  async function handleLogSearch(
    query: string,
    tipo: string,
    resultados: number
  ): Promise<void> {
    try {
      await logSearch(query, tipo, resultados)
    } catch (err) {
      console.error('[Hook] Log search failed:', err)
    }
  }

  return {
    isLoaded,
    isLoading,
    error,
    totalRecords,
    search,
    getNiza,
    getViena,
    logSearch: handleLogSearch,
  }
}
