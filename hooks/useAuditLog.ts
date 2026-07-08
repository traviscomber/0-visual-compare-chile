/**
 * Hook para registrar auditoría de búsquedas y acciones
 * Almacena en LocalStorage + opcional en Supabase
 */

'use client'

import { useCallback } from 'react'
import { AuditLog } from '@/types/marca'

interface BusquedaRegistrada {
  query: string
  tipo: 'nombre' | 'niza' | 'viena' | 'solicitante' | 'pais'
  resultados: number
}

export function useAuditLog() {
  const STORAGE_KEY = 'marca_audit_logs'
  const MAX_LOGS = 1000

  /**
   * Registrar búsqueda
   */
  const registrarBusqueda = useCallback((datos: BusquedaRegistrada) => {
    try {
      const log: AuditLog = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        accion: 'busqueda',
        detalles: {
          tipo_busqueda: datos.tipo,
          query: datos.query,
          resultados: datos.resultados
        },
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
      }

      // Obtener logs existentes
      const logs = obtenerLogs()
      logs.push(log)

      // Mantener límite de logs (FIFO)
      if (logs.length > MAX_LOGS) {
        logs.shift()
      }

      // Guardar en LocalStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
      }

      console.log(`[v0] Auditoría: Búsqueda registrada (${datos.tipo}: ${datos.query})`)
    } catch (error) {
      console.error('[v0] Error registrando auditoría:', error)
    }
  }, [])

  /**
   * Registrar exportación
   */
  const registrarExportacion = useCallback((formato: string, registros: number) => {
    try {
      const log: AuditLog = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        accion: 'exportacion',
        detalles: {
          formato_exportacion: formato,
          resultados: registros
        },
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
      }

      const logs = obtenerLogs()
      logs.push(log)

      if (logs.length > MAX_LOGS) {
        logs.shift()
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
      }

      console.log(`[v0] Auditoría: Exportación registrada (${formato}, ${registros} registros)`)
    } catch (error) {
      console.error('[v0] Error registrando exportación:', error)
    }
  }, [])

  /**
   * Obtener todos los logs
   */
  const obtenerLogs = useCallback((): AuditLog[] => {
    try {
      if (typeof window === 'undefined') return []

      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('[v0] Error obteniendo logs:', error)
      return []
    }
  }, [])

  /**
   * Obtener logs de búsqueda
   */
  const obtenerLogsBusqueda = useCallback((): AuditLog[] => {
    const logs = obtenerLogs()
    return logs.filter(log => log.accion === 'busqueda')
  }, [obtenerLogs])

  /**
   * Obtener logs de exportación
   */
  const obtenerLogsExportacion = useCallback((): AuditLog[] => {
    const logs = obtenerLogs()
    return logs.filter(log => log.accion === 'exportacion')
  }, [obtenerLogs])

  /**
   * Filtrar logs por fecha
   */
  const filtrarPorFecha = useCallback(
    (desde: Date, hasta: Date): AuditLog[] => {
      const logs = obtenerLogs()
      return logs.filter(log => {
        const fecha = new Date(log.timestamp)
        return fecha >= desde && fecha <= hasta
      })
    },
    [obtenerLogs]
  )

  /**
   * Obtener estadísticas
   */
  const obtenerEstadisticas = useCallback(() => {
    const logs = obtenerLogs()

    const porAccion = logs.reduce(
      (acc, log) => {
        acc[log.accion] = (acc[log.accion] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const porTipoBusqueda = logs
      .filter(log => log.accion === 'busqueda')
      .reduce(
        (acc, log) => {
          const tipo = log.detalles.tipo_busqueda || 'unknown'
          acc[tipo] = (acc[tipo] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

    const totalResultados = logs
      .filter(log => log.accion === 'busqueda')
      .reduce((sum, log) => sum + (log.detalles.resultados || 0), 0)

    return {
      totalLogs: logs.length,
      porAccion,
      porTipoBusqueda,
      totalResultados,
      primerLog: logs[0]?.timestamp,
      ultimoLog: logs[logs.length - 1]?.timestamp
    }
  }, [obtenerLogs])

  /**
   * Exportar logs como CSV
   */
  const exportarLogsCSV = useCallback((): string => {
    const logs = obtenerLogs()

    const headers = ['ID', 'Timestamp', 'Acción', 'Tipo', 'Query', 'Resultados', 'UserAgent']
    const rows = logs.map(log => [
      log.id,
      log.timestamp,
      log.accion,
      log.detalles.tipo_busqueda || '',
      log.detalles.query || '',
      log.detalles.resultados || '',
      log.userAgent || ''
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    return csv
  }, [obtenerLogs])

  /**
   * Limpiar todos los logs
   */
  const limpiarLogs = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
      }
      console.log('[v0] Auditoría: Logs limpiados')
    } catch (error) {
      console.error('[v0] Error limpiando logs:', error)
    }
  }, [])

  return {
    registrarBusqueda,
    registrarExportacion,
    obtenerLogs,
    obtenerLogsBusqueda,
    obtenerLogsExportacion,
    filtrarPorFecha,
    obtenerEstadisticas,
    exportarLogsCSV,
    limpiarLogs
  }
}
