/**
 * Motor de búsqueda avanzado para marcas registradas
 * Soporta: búsqueda textual, Niza, Viena, fuzzy matching
 * Optimizado para 350K+ registros
 */

import Fuse from 'fuse.js'
import { Marca, SearchParams, SearchResult, SearchFilters } from '@/types/marca'

export class SearchEngine {
  private marcas: Marca[] = []
  private fuse: Fuse<Marca> | null = null
  private niza_map: Map<string, string> = new Map()
  private viena_map: Map<string, string> = new Map()

  constructor(marcas: Marca[]) {
    this.marcas = marcas
    this.initializeFuse()
  }

  /**
   * Inicializa búsqueda difusa (fuzzy matching)
   */
  private initializeFuse() {
    this.fuse = new Fuse(this.marcas, {
      keys: ['nombre', 'solicitante', 'numeroRegistro', 'descripcion'],
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: 2,
      shouldSort: true
    } as any)
  }

  /**
   * Búsqueda principal con múltiples tipos
   */
  public search(params: SearchParams): SearchResult[] {
    const { query, type, filters } = params
    let resultados: Marca[] = []

    const startTime = performance.now()

    switch (type) {
      case 'nombre':
        resultados = this.searchByName(query)
        break
      case 'niza':
        resultados = this.searchByNiza(query)
        break
      case 'viena':
        resultados = this.searchByViena(query)
        break
      case 'solicitante':
        resultados = this.searchBySolicitante(query)
        break
      case 'pais':
        resultados = this.searchByPais(query)
        break
      default:
        resultados = []
    }

    // Aplicar filtros adicionales
    if (filters) {
      resultados = this.applyFilters(resultados, filters)
    }

    // Calcular relevancia
    const searchResults: SearchResult[] = resultados.map(marca => ({
      marca,
      relevancia: this.calculateRelevance(marca, query, type),
      matchType: this.determineMatchType(marca, query, type)
    }))

    // Ordenar por relevancia
    searchResults.sort((a, b) => b.relevancia - a.relevancia)

    const tiempo_ms = Math.round(performance.now() - startTime)
    console.log(`[v0] Búsqueda '${type}' completada en ${tiempo_ms}ms. Resultados: ${searchResults.length}`)

    return searchResults
  }

  /**
   * Búsqueda por nombre (fuzzy matching)
   */
  private searchByName(query: string): Marca[] {
    if (!this.fuse || !query.trim()) return []

    const results = this.fuse.search(query)
    return results.map(result => result.item)
  }

  /**
   * Búsqueda exacta por clase Niza
   */
  private searchByNiza(query: string): Marca[] {
    const cleanQuery = query.trim()
    return this.marcas.filter(marca =>
      marca.niza.some(n => n === cleanQuery || n.includes(cleanQuery))
    )
  }

  /**
   * Búsqueda exacta por código Viena
   */
  private searchByViena(query: string): Marca[] {
    const cleanQuery = query.trim()
    return this.marcas.filter(marca =>
      marca.viena.some(v => v === cleanQuery || v.includes(cleanQuery))
    )
  }

  /**
   * Búsqueda por solicitante
   */
  private searchBySolicitante(query: string): Marca[] {
    if (!this.fuse) return []

    const fuzzySearch = this.fuse.search(query)
    return fuzzySearch.map(result => result.item)
  }

  /**
   * Búsqueda por país
   */
  private searchByPais(query: string): Marca[] {
    const cleanQuery = query.toUpperCase().trim()
    return this.marcas.filter(marca =>
      marca.pais === cleanQuery || marca.pais.includes(cleanQuery)
    )
  }

  /**
   * Aplicar filtros adicionales
   */
  private applyFilters(marcas: Marca[], filters: SearchFilters): Marca[] {
    return marcas.filter(marca => {
      if (filters.estado && marca.estado !== filters.estado) return false

      if (filters.pais && marca.pais !== filters.pais) return false

      if (filters.fechaDesde && new Date(marca.fecha) < new Date(filters.fechaDesde)) {
        return false
      }

      if (filters.fechaHasta && new Date(marca.fecha) > new Date(filters.fechaHasta)) {
        return false
      }

      if (filters.niza && filters.niza.length > 0) {
        const hasNiza = filters.niza.some(n => marca.niza.includes(n))
        if (!hasNiza) return false
      }

      if (filters.viena && filters.viena.length > 0) {
        const hasViena = filters.viena.some(v => marca.viena.includes(v))
        if (!hasViena) return false
      }

      return true
    })
  }

  /**
   * Calcular relevancia (0-100)
   */
  private calculateRelevance(marca: Marca, query: string, type: string): number {
    const query_lower = query.toLowerCase()
    let score = 0

    switch (type) {
      case 'nombre':
        if (marca.nombre.toLowerCase() === query_lower) score = 100
        else if (marca.nombre.toLowerCase().includes(query_lower)) score = 80
        else score = 60
        break

      case 'niza':
        score = marca.niza.includes(query) ? 100 : 80
        break

      case 'viena':
        score = marca.viena.includes(query) ? 100 : 80
        break

      case 'solicitante':
        if (marca.solicitante.toLowerCase() === query_lower) score = 100
        else if (marca.solicitante.toLowerCase().includes(query_lower)) score = 80
        else score = 60
        break

      case 'pais':
        score = marca.pais === query.toUpperCase() ? 100 : 80
        break
    }

    // Bonus: marcas registradas tienen más relevancia
    if (marca.estado === 'Registrada') score += 10
    score = Math.min(score, 100)

    return score
  }

  /**
   * Determinar tipo de coincidencia
   */
  private determineMatchType(
    marca: Marca,
    query: string,
    type: string
  ): 'exact' | 'partial' | 'fuzzy' {
    const query_lower = query.toLowerCase()

    if (type === 'nombre') {
      if (marca.nombre.toLowerCase() === query_lower) return 'exact'
      if (marca.nombre.toLowerCase().includes(query_lower)) return 'partial'
      return 'fuzzy'
    }

    if (type === 'niza' || type === 'viena') {
      return 'exact'
    }

    return 'partial'
  }

  /**
   * Autocompletar nombres de marcas
   */
  public autocomplete(query: string, limit: number = 10): string[] {
    if (!this.fuse || !query.trim()) return []

    const results = this.fuse.search(query, { limit })
    return results.map(r => r.item.nombre)
  }

  /**
   * Obtener estadísticas de búsqueda
   */
  public getStats() {
    return {
      totalMarcas: this.marcas.length,
      estados: {
        registrada: this.marcas.filter(m => m.estado === 'Registrada').length,
        pendiente: this.marcas.filter(m => m.estado === 'Pendiente').length,
        denegada: this.marcas.filter(m => m.estado === 'Denegada').length
      },
      paises: [...new Set(this.marcas.map(m => m.pais))].length,
      claseNiza: [...new Set(this.marcas.flatMap(m => m.niza))].length,
      codigosViena: [...new Set(this.marcas.flatMap(m => m.viena))].length
    }
  }

  /**
   * Búsqueda avanzada combinada
   */
  public advancedSearch(query: string, filters?: SearchFilters): SearchResult[] {
    const params: SearchParams = {
      query,
      type: 'nombre', // tipo por defecto
      filters
    }

    return this.search(params)
  }
}

/**
 * Instancia compartida del motor de búsqueda
 */
let searchEngineInstance: SearchEngine | null = null

export function getSearchEngine(marcas: Marca[]): SearchEngine {
  if (!searchEngineInstance) {
    searchEngineInstance = new SearchEngine(marcas)
  }
  return searchEngineInstance
}

export function resetSearchEngine(marcas: Marca[]): SearchEngine {
  searchEngineInstance = new SearchEngine(marcas)
  return searchEngineInstance
}
