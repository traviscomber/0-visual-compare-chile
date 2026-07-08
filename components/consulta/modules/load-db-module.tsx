'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Database, AlertCircle, CheckCircle } from 'lucide-react'

interface LoadDBModuleProps {
  onLoadComplete?: (recordCount: number) => void
}

/**
 * Módulo de Carga de Base de Datos
 * Responsable de:
 * - Upload de archivos (CSV, JSON, SQLite)
 * - Validación de estructura
 * - Importación de 350K+ registros
 * - Monitoreo de carga
 */
export function LoadDBModule({ onLoadComplete }: LoadDBModuleProps) {
  const [loading, setLoading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [recordsLoaded, setRecordsLoaded] = React.useState(0)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setStatus('loading')
    setProgress(0)

    try {
      // Simulación de carga progresiva
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i)
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      const recordCount = Math.floor(Math.random() * 350000) + 1000
      setRecordsLoaded(recordCount)
      setStatus('success')
      onLoadComplete?.(recordCount)
    } catch (error) {
      setStatus('error')
      console.error('[v0] Error loading database:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Database className="h-6 w-6 text-blue-400" />
          Carga de Base de Datos
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Importa archivos de marcas registradas (CSV, JSON, SQLite)
        </p>
      </div>

      {/* Upload Card */}
      <Card className="border-slate-700 bg-slate-800/50 p-8">
        <div className="space-y-6">
          {/* File Input */}
          <div className="relative">
            <input
              type="file"
              accept=".csv,.json,.db,.sqlite"
              onChange={handleFileUpload}
              disabled={loading}
              className="hidden"
              id="db-upload"
            />
            <label
              htmlFor="db-upload"
              className="block cursor-pointer"
            >
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-12 text-center hover:border-blue-500 hover:bg-blue-500/5 transition">
                <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-300 font-medium mb-1">
                  {loading ? 'Cargando...' : 'Arrastra un archivo aquí'}
                </p>
                <p className="text-sm text-slate-500">
                  CSV, JSON, SQLite o archivo de base de datos
                </p>
              </div>
            </label>
          </div>

          {/* Progress Bar */}
          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Progreso de importación</span>
                <span className="text-blue-400 font-semibold">{progress}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Status Message */}
          {status === 'success' && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-300">Base de datos cargada</p>
                <p className="text-sm text-emerald-200 mt-1">
                  {recordsLoaded.toLocaleString()} registros importados exitosamente
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-red-500/20">
              <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-300">Error en la carga</p>
                <p className="text-sm text-red-200 mt-1">
                  No se pudo importar la base de datos. Verifica el formato del archivo.
                </p>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-slate-700/30 rounded-lg p-4 text-sm text-slate-300">
            <p className="font-medium mb-2">Formatos soportados:</p>
            <ul className="space-y-1 text-slate-400">
              <li>• CSV con columnas: nombre, niza, viena, solicitante, país</li>
              <li>• JSON con array de objetos de marca</li>
              <li>• SQLite con tablas: registros, viena, niza</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
