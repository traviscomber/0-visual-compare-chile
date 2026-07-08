/**
 * Tipos e interfaces para el sistema de consulta de marcas registradas
 * Incluye modelos para registros, clasificaciones Niza/Viena y auditoría
 */

// ============ TIPOS PRINCIPALES ============

export interface Marca {
  id: string
  nombre: string
  solicitante: string
  numeroRegistro: string
  estado: 'Registrada' | 'Pendiente' | 'Denegada'
  fecha: string
  pais: string
  niza: string[]
  viena: string[]
  descripcion?: string
  imagenUrl?: string
  metadata?: Record<string, any>
}

export interface ClaseNiza {
  codigo: string
  clase: number
  titulo: string
  descripcion: string
  seccion: string
}

export interface CodigoViena {
  codigo: string
  categoria: number
  division: number
  seccion: string
  descripcion: string
  division_name: string
}

// ============ BÚSQUEDA ============

export interface SearchParams {
  query: string
  type: 'nombre' | 'niza' | 'viena' | 'solicitante' | 'pais'
  filters?: SearchFilters
  page?: number
  limit?: number
}

export interface SearchFilters {
  estado?: 'Registrada' | 'Pendiente' | 'Denegada'
  pais?: string
  fechaDesde?: string
  fechaHasta?: string
  niza?: string[]
  viena?: string[]
}

export interface SearchResult {
  marca: Marca
  relevancia: number
  matchType: 'exact' | 'partial' | 'fuzzy'
}

export interface SearchResponse {
  resultados: SearchResult[]
  total: number
  pagina: number
  totalPaginas: number
  tiempo_ms: number
}

// ============ AUDITORÍA ============

export interface AuditLog {
  id: string
  timestamp: string
  usuario?: string
  accion: 'busqueda' | 'exportacion' | 'visualizacion' | 'descarga'
  detalles: {
    tipo_busqueda?: string
    query?: string
    resultados?: number
    formato_exportacion?: string
  }
  ip?: string
  userAgent?: string
}

// ============ HISTORIAL ============

export interface SearchHistory {
  id: string
  query: string
  tipo: 'nombre' | 'niza' | 'viena' | 'solicitante' | 'pais'
  resultados: number
  timestamp: string
  favorito?: boolean
}

export interface Favorito {
  id: string
  marca_id: string
  timestamp: string
  notas?: string
}

// ============ BD Y CONFIGURACIÓN ============

export interface DBSchema {
  registros: Marca[]
  niza: ClaseNiza[]
  viena: CodigoViena[]
  audit_logs: AuditLog[]
  search_history: SearchHistory[]
  favoritos: Favorito[]
}

export interface DBStats {
  totalMarcas: number
  totalNiza: number
  totalViena: number
  ultimaActualizacion: string
  tamanoDB: number
}

export interface DBLoadResult {
  success: boolean
  stats: DBStats
  mensaje: string
  tiempo_ms: number
}

// ============ EXPORTACIÓN ============

export type ExportFormat = 'csv' | 'json' | 'pdf'

export interface ExportOptions {
  format: ExportFormat
  incluirDetalles: boolean
  incluirAuditoria: boolean
  filtros?: SearchFilters
}

export interface ExportResult {
  success: boolean
  archivo: string
  tamanio: number
  registros: number
}

// ============ PAGINACIÓN ============

export interface PaginationParams {
  pagina: number
  porPagina: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  pagina: number
  porPagina: number
  totalPaginas: number
}
