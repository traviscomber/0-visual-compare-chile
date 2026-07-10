// Database loader using SQL.js for in-memory SQLite

import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import { RegistroMarca, ClaseNiza, CodigoViena, SearchResult } from './db-types'

let dbInstance: SqlJsDatabase | null = null
let sqlJsReady: Promise<any> | null = null

// Initialize SQL.js library
async function initSqlJsLibrary() {
  if (sqlJsReady) return sqlJsReady
  
  sqlJsReady = initSqlJs()
  return sqlJsReady
}

// Create database schema
async function createSchema(db: SqlJsDatabase) {
  const statements = [
    // Registros de marcas
    `CREATE TABLE IF NOT EXISTS registros (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      solicitante TEXT,
      numero_registro TEXT UNIQUE,
      estado TEXT DEFAULT 'Registrada',
      fecha_registro TEXT,
      fecha_vencimiento TEXT,
      pais TEXT DEFAULT 'CL',
      metadata TEXT
    )`,

    // Índices por búsqueda rápida
    `CREATE INDEX IF NOT EXISTS idx_registros_nombre ON registros(nombre)`,
    `CREATE INDEX IF NOT EXISTS idx_registros_solicitante ON registros(solicitante)`,
    `CREATE INDEX IF NOT EXISTS idx_registros_estado ON registros(estado)`,
    `CREATE INDEX IF NOT EXISTS idx_registros_pais ON registros(pais)`,

    // Clasificaciones Niza
    `CREATE TABLE IF NOT EXISTS niza (
      codigo TEXT PRIMARY KEY,
      clase INTEGER,
      titulo TEXT,
      descripcion TEXT,
      seccion TEXT
    )`,

    // Clasificaciones Viena
    `CREATE TABLE IF NOT EXISTS viena (
      codigo TEXT PRIMARY KEY,
      categoria INTEGER,
      division TEXT,
      seccion TEXT,
      descripcion TEXT
    )`,

    // Relaciones marca-Niza (many-to-many)
    `CREATE TABLE IF NOT EXISTS marcas_niza (
      marca_id TEXT,
      niza_codigo TEXT,
      PRIMARY KEY (marca_id, niza_codigo),
      FOREIGN KEY (marca_id) REFERENCES registros(id),
      FOREIGN KEY (niza_codigo) REFERENCES niza(codigo)
    )`,

    // Índices para búsquedas rápidas
    `CREATE INDEX IF NOT EXISTS idx_marcas_niza_codigo ON marcas_niza(niza_codigo)`,

    // Relaciones marca-Viena (many-to-many)
    `CREATE TABLE IF NOT EXISTS marcas_viena (
      marca_id TEXT,
      viena_codigo TEXT,
      PRIMARY KEY (marca_id, viena_codigo),
      FOREIGN KEY (marca_id) REFERENCES registros(id),
      FOREIGN KEY (viena_codigo) REFERENCES viena(codigo)
    )`,

    // Índices para búsquedas rápidas
    `CREATE INDEX IF NOT EXISTS idx_marcas_viena_codigo ON marcas_viena(viena_codigo)`,

    // Auditoría
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      usuario_id TEXT,
      accion TEXT,
      detalles TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    // Historial de búsquedas
    `CREATE TABLE IF NOT EXISTS search_history (
      id TEXT PRIMARY KEY,
      usuario_id TEXT,
      query TEXT,
      tipo TEXT,
      resultados INTEGER,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    // Configuración
    `CREATE TABLE IF NOT EXISTS configuracion (
      clave TEXT PRIMARY KEY,
      valor TEXT
    )`
  ]

  for (const stmt of statements) {
    try {
      db.run(stmt)
    } catch (error) {
      console.warn(`[DB] Schema creation notice: ${error}`)
    }
  }
}

// Initialize or load database
export async function initializeDatabase(): Promise<SqlJsDatabase> {
  if (dbInstance) return dbInstance

  try {
    const SQL = await initSqlJsLibrary()

    // Create new empty database and keep a non-null local reference for TS.
    const db = new SQL.Database()
    dbInstance = db

    // Create schema
    await createSchema(db)

    console.log('[DB] Database initialized successfully')
    return db
  } catch (error) {
    console.error('[DB] Failed to initialize database:', error)
    throw error
  }
}

// Get database instance
export async function getDatabase(): Promise<SqlJsDatabase> {
  if (!dbInstance) {
    await initializeDatabase()
  }
  return dbInstance!
}

// Load sample data (demo data for testing)
export async function loadSampleData() {
  const db = await getDatabase()

  try {
    // Sample Niza classes
    const nizaSample = [
      ['42', 42, 'Servicios de tecnología de la información', 'Servicios de TI', 'Servicios'],
      ['35', 35, 'Publicidad y marketing', 'Servicios de publicidad', 'Servicios'],
      ['41', 41, 'Educación', 'Servicios de educación', 'Servicios'],
      ['45', 45, 'Servicios legales', 'Servicios de abogacía', 'Servicios'],
    ]

    for (const [codigo, clase, titulo, desc, seccion] of nizaSample) {
      db.run(
        `INSERT OR IGNORE INTO niza (codigo, clase, titulo, descripcion, seccion) 
         VALUES (?, ?, ?, ?, ?)`,
        [codigo, clase, titulo, desc, seccion]
      )
    }

    // Sample Viena categories
    const vienaSample = [
      ['26.03.01', 26, '03', 'Figuras', 'Eyes and visual elements'],
      ['26.04.01', 26, '04', 'Figuras', 'Geometric shapes'],
      ['27.05.01', 27, '05', 'Figuras', 'Text and letters'],
    ]

    for (const [codigo, cat, div, seccion, desc] of vienaSample) {
      db.run(
        `INSERT OR IGNORE INTO viena (codigo, categoria, division, seccion, descripcion) 
         VALUES (?, ?, ?, ?, ?)`,
        [codigo, cat, div, seccion, desc]
      )
    }

    // Sample marcas
    const marcasSample = [
      ['1', 'VISUAL COMPARE', 'Travis Technologies', 'VIS-001', 'Registrada', '2024-01-15', '2034-01-15', 'CL'],
      ['2', 'BRAND ANALYZER', 'Digital Solutions', 'BRA-002', 'Registrada', '2023-06-20', '2033-06-20', 'CL'],
      ['3', 'COMPARE PRO', 'Tech Innovations', 'COM-003', 'Pendiente', '2024-03-10', null, 'CL'],
    ]

    for (const [id, nombre, solicitante, numero, estado, fecha, vencimiento, pais] of marcasSample) {
      db.run(
        `INSERT OR IGNORE INTO registros 
         (id, nombre, solicitante, numero_registro, estado, fecha_registro, fecha_vencimiento, pais, metadata) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, nombre, solicitante, numero, estado, fecha, vencimiento, pais, JSON.stringify({})]
      )
    }

    // Link marcas to classifications
    db.run(`INSERT OR IGNORE INTO marcas_niza (marca_id, niza_codigo) VALUES (?, ?)`, ['1', '42'])
    db.run(`INSERT OR IGNORE INTO marcas_niza (marca_id, niza_codigo) VALUES (?, ?)`, ['2', '42'])
    db.run(`INSERT OR IGNORE INTO marcas_viena (marca_id, viena_codigo) VALUES (?, ?)`, ['1', '26.03.01'])

    console.log('[DB] Sample data loaded successfully')
  } catch (error) {
    console.error('[DB] Failed to load sample data:', error)
  }
}

// Search by name (fuzzy)
export async function searchByName(query: string, limit = 20): Promise<SearchResult[]> {
  const db = await getDatabase()
  const start = performance.now()

  try {
    const sql = `
      SELECT id, nombre, solicitante, numero_registro, estado, fecha_registro, 
             fecha_vencimiento, pais, metadata
      FROM registros
      WHERE nombre LIKE ? OR solicitante LIKE ?
      LIMIT ?
    `

    const pattern = `%${query}%`
    const results = db.exec(sql, [pattern, pattern, limit])

    const marcas: SearchResult[] = []
    if (results[0]) {
      for (const row of results[0].values) {
        marcas.push({
          marca: parseRegistro(row as any),
          relevancia: query.toLowerCase() === (row[1] as string).toLowerCase() ? 1.0 : 0.8,
          matchType: 'fuzzy'
        })
      }
    }

    const tiempo_ms = Math.round(performance.now() - start)
    console.log(`[DB] Search by name: "${query}" - ${marcas.length} results in ${tiempo_ms}ms`)

    return marcas
  } catch (error) {
    console.error('[DB] Search by name failed:', error)
    return []
  }
}

// Search by Niza code
export async function searchByNiza(codigo: string, limit = 100): Promise<SearchResult[]> {
  const db = await getDatabase()

  try {
    const sql = `
      SELECT r.id, r.nombre, r.solicitante, r.numero_registro, r.estado, 
             r.fecha_registro, r.fecha_vencimiento, r.pais, r.metadata
      FROM registros r
      INNER JOIN marcas_niza mn ON r.id = mn.marca_id
      WHERE mn.niza_codigo = ?
      LIMIT ?
    `

    const results = db.exec(sql, [codigo, limit])
    const marcas: SearchResult[] = []

    if (results[0]) {
      for (const row of results[0].values) {
        marcas.push({
          marca: parseRegistro(row as any),
          relevancia: 0.95,
          matchType: 'exact'
        })
      }
    }

    return marcas
  } catch (error) {
    console.error('[DB] Search by Niza failed:', error)
    return []
  }
}

// Get all Niza classes
export async function getNizaClasses(): Promise<ClaseNiza[]> {
  const db = await getDatabase()

  try {
    const results = db.exec(`SELECT codigo, clase, titulo, descripcion, seccion FROM niza ORDER BY clase`)
    const classes: ClaseNiza[] = []

    if (results[0]) {
      for (const row of results[0].values) {
        classes.push({
          codigo: row[0] as string,
          clase: row[1] as number,
          titulo: row[2] as string,
          descripcion: row[3] as string,
          seccion: row[4] as string,
        })
      }
    }

    return classes
  } catch (error) {
    console.error('[DB] Get Niza classes failed:', error)
    return []
  }
}

// Get all Viena codes
export async function getVienaCodes(): Promise<CodigoViena[]> {
  const db = await getDatabase()

  try {
    const results = db.exec(`SELECT codigo, categoria, division, seccion, descripcion FROM viena ORDER BY codigo`)
    const codes: CodigoViena[] = []

    if (results[0]) {
      for (const row of results[0].values) {
        codes.push({
          codigo: row[0] as string,
          categoria: row[1] as number,
          division: row[2] as string,
          seccion: row[3] as string,
          descripcion: row[4] as string,
        })
      }
    }

    return codes
  } catch (error) {
    console.error('[DB] Get Viena codes failed:', error)
    return []
  }
}

// Get total record count
export async function getTotalRecords(): Promise<number> {
  const db = await getDatabase()

  try {
    const results = db.exec(`SELECT COUNT(*) FROM registros`)
    return results[0]?.values[0][0] as number || 0
  } catch (error) {
    console.error('[DB] Get total records failed:', error)
    return 0
  }
}

// Helper: parse registro from DB row
function parseRegistro(row: any): RegistroMarca {
  return {
    id: row[0] as string,
    nombre: row[1] as string,
    solicitante: row[2] as string,
    numero_registro: row[3] as string,
    estado: row[4] as any,
    fecha_registro: row[5] as string,
    fecha_vencimiento: row[6] as string,
    pais: row[7] as string,
    niza_codes: [],
    viena_codes: [],
    metadata: row[8] ? JSON.parse(row[8] as string) : {},
  }
}

// Log search
export async function logSearch(query: string, tipo: string, resultados: number) {
  const db = await getDatabase()

  try {
    const id = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    db.run(
      `INSERT INTO search_history (id, query, tipo, resultados, timestamp) VALUES (?, ?, ?, ?, ?)`,
      [id, query, tipo, resultados, new Date().toISOString()]
    )
  } catch (error) {
    console.error('[DB] Log search failed:', error)
  }
}
