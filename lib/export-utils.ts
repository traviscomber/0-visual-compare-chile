/**
 * Utilidades para exportar datos en múltiples formatos
 * CSV, JSON, y generación de reportes
 */

import { SearchResult, Marca, ExportFormat, ExportOptions } from '@/types/marca'

/**
 * Exportar a CSV
 */
export function exportToCSV(
  resultados: SearchResult[],
  options?: Partial<ExportOptions>
): string {
  const headers = [
    'ID',
    'Nombre',
    'Solicitante',
    'Número Registro',
    'Estado',
    'País',
    'Fecha',
    'Clases Niza',
    'Códigos Viena'
  ]

  if (options?.incluirDetalles) {
    headers.push('Descripción', 'Metadata')
  }

  // Convertir datos a CSV
  const rows = resultados.map(sr => {
    const m = sr.marca
    const row = [
      m.id,
      `"${m.nombre}"`,
      `"${m.solicitante}"`,
      m.numeroRegistro,
      m.estado,
      m.pais,
      m.fecha,
      `"${m.niza.join(',')}"`,
      `"${m.viena.join(',')}"`
    ]

    if (options?.incluirDetalles) {
      row.push(`"${m.descripcion || ''}"`, `"${JSON.stringify(m.metadata || {})}"`)
    }

    return row.join(',')
  })

  // Agregar BOM para Excel en Windows
  const bom = '\uFEFF'
  const csv = [headers.join(','), ...rows].join('\n')

  return bom + csv
}

/**
 * Exportar a JSON
 */
export function exportToJSON(
  resultados: SearchResult[],
  options?: Partial<ExportOptions>
): string {
  const data = resultados.map(sr => {
    const m = sr.marca
    const item: any = {
      id: m.id,
      nombre: m.nombre,
      solicitante: m.solicitante,
      numeroRegistro: m.numeroRegistro,
      estado: m.estado,
      pais: m.pais,
      fecha: m.fecha,
      niza: m.niza,
      viena: m.viena,
      relevancia: sr.relevancia,
      matchType: sr.matchType
    }

    if (options?.incluirDetalles) {
      item.descripcion = m.descripcion
      item.imagenUrl = m.imagenUrl
      item.metadata = m.metadata
    }

    return item
  })

  const metadata = {
    exportDate: new Date().toISOString(),
    totalRecords: resultados.length,
    format: 'JSON v1.0'
  }

  return JSON.stringify({ metadata, records: data }, null, 2)
}

/**
 * Descargar archivo
 */
export function downloadFile(content: string, filename: string, format: 'csv' | 'json'): void {
  const mimeType = format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json'

  const link = document.createElement('a')
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)

  console.log(`[v0] Archivo descargado: ${filename}`)
}

/**
 * Generar nombre de archivo con timestamp
 */
export function generateFilename(format: ExportFormat, timestamp: boolean = true): string {
  const ts = timestamp ? `_${new Date().toISOString().split('T')[0]}` : ''
  const ext = format === 'csv' ? 'csv' : 'json'
  return `marcas_registradas${ts}.${ext}`
}

/**
 * Exportar tabla a Excel (simple)
 * Nota: Para Excel avanzado usar librerías como xlsx
 */
export function exportTableToHTML(resultados: SearchResult[]): string {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Marcas Registradas</title>
      <style>
        body { font-family: Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <h1>Consulta de Marcas Registradas</h1>
      <p>Exportado: ${new Date().toLocaleString('es-CL')}</p>
      <p>Total de registros: ${resultados.length}</p>
      
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Solicitante</th>
            <th>Estado</th>
            <th>País</th>
            <th>Niza</th>
            <th>Viena</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${resultados
            .map(
              sr => `
            <tr>
              <td>${sr.marca.nombre}</td>
              <td>${sr.marca.solicitante}</td>
              <td>${sr.marca.estado}</td>
              <td>${sr.marca.pais}</td>
              <td>${sr.marca.niza.join(', ')}</td>
              <td>${sr.marca.viena.join(', ')}</td>
              <td>${sr.marca.fecha}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `

  return html
}

/**
 * Generar reporte de estadísticas
 */
export function generateStatisticsReport(resultados: SearchResult[]): string {
  const estados = {
    Registrada: 0,
    Pendiente: 0,
    Denegada: 0
  }

  const paises = new Map<string, number>()
  const nizas = new Map<string, number>()

  resultados.forEach(sr => {
    const m = sr.marca

    // Contar estados
    estados[m.estado]++

    // Contar países
    paises.set(m.pais, (paises.get(m.pais) || 0) + 1)

    // Contar clases Niza
    m.niza.forEach(n => {
      nizas.set(n, (nizas.get(n) || 0) + 1)
    })
  })

  const report = {
    generatedAt: new Date().toISOString(),
    totalRecords: resultados.length,
    statistics: {
      byStatus: estados,
      byCountry: Object.fromEntries(paises),
      topNizaClasses: Object.fromEntries(
        Array.from(nizas.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
      )
    }
  }

  return JSON.stringify(report, null, 2)
}

/**
 * Validar datos antes de exportar
 */
export function validateExportData(resultados: SearchResult[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!Array.isArray(resultados)) {
    errors.push('Los datos no son un array')
    return { valid: false, errors }
  }

  if (resultados.length === 0) {
    errors.push('No hay datos para exportar')
  }

  resultados.forEach((item, idx) => {
    if (!item.marca || !item.marca.nombre) {
      errors.push(`Registro ${idx}: falta nombre de marca`)
    }
    if (!item.marca.id) {
      errors.push(`Registro ${idx}: falta ID`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Exportación principal
 */
export function exportData(
  resultados: SearchResult[],
  format: ExportFormat,
  options?: Partial<ExportOptions>
): { content: string; filename: string } | null {
  // Validar datos
  const validation = validateExportData(resultados)
  if (!validation.valid) {
    console.error('[v0] Validación fallida:', validation.errors)
    return null
  }

  let content = ''
  let filename = ''

  switch (format) {
    case 'csv':
      content = exportToCSV(resultados, options)
      filename = generateFilename('csv')
      break

    case 'json':
      content = exportToJSON(resultados, options)
      filename = generateFilename('json')
      break

    case 'pdf':
      // PDF requiere librería adicional
      console.warn('[v0] Exportación a PDF no disponible en esta versión')
      return null

    default:
      console.error('[v0] Formato desconocido:', format)
      return null
  }

  console.log(`[v0] Exportación generada: ${filename} (${content.length} bytes)`)

  return { content, filename }
}
