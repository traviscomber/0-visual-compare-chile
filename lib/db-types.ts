// Database schema types for Visual Compare Chile

export interface RegistroMarca {
  id: string
  nombre: string
  solicitante: string
  numero_registro: string
  estado: 'Registrada' | 'Pendiente' | 'Denegada' | 'Vencida'
  fecha_registro: string
  fecha_vencimiento?: string
  pais: string
  niza_codes: string[] // Array of Niza codes
  viena_codes: string[] // Array of Viena codes
  metadata: Record<string, any>
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
  division: string
  seccion: string
  descripcion: string
}

export interface Usuario {
  id: string
  email: string
  nombre: string
  rol: 'admin' | 'user'
  fecha_creacion: string
}

export interface AuditLog {
  id: string
  usuario_id?: string
  accion: string
  detalles: Record<string, any>
  timestamp: string
}

export interface SearchHistory {
  id: string
  usuario_id?: string
  query: string
  tipo: 'nombre' | 'niza' | 'viena'
  resultados: number
  timestamp: string
}

export interface ConfiguracionDB {
  clave: string
  valor: string
}

export interface SearchResult {
  marca: RegistroMarca
  relevancia: number
  matchType: 'exact' | 'fuzzy' | 'partial'
}

export interface SearchResponse {
  resultados: SearchResult[]
  total: number
  pagina: number
  totalPaginas: number
  tiempo_ms: number
}
