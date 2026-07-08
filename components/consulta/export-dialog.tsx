'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Download, X, CheckCircle, AlertCircle } from 'lucide-react'
import { SearchResult } from '@/types/marca'
import { exportData, downloadFile } from '@/lib/export-utils'

interface ExportDialogProps {
  resultados: SearchResult[]
  isOpen: boolean
  onClose: () => void
  onExport?: () => void
}

export function ExportDialog({ resultados, isOpen, onClose, onExport }: ExportDialogProps) {
  const [format, setFormat] = useState<'csv' | 'json'>('csv')
  const [incluirDetalles, setIncluirDetalles] = useState(false)
  const [incluirAuditoria, setIncluirAuditoria] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [estado, setEstado] = useState<'idle' | 'success' | 'error'>('idle')
  const [mensaje, setMensaje] = useState('')

  const handleExport = async () => {
    try {
      setCargando(true)
      setEstado('idle')
      setMensaje('')

      const resultado = exportData(resultados, format, {
        format,
        incluirDetalles,
        incluirAuditoria
      })

      if (!resultado) {
        setEstado('error')
        setMensaje('Error al exportar datos. Verifica que haya registros válidos.')
        return
      }

      // Descargar archivo
      downloadFile(resultado.content, resultado.filename, format)

      setEstado('success')
      setMensaje(`Exportación exitosa: ${resultados.length} registros descargados`)

      onExport?.()

      // Cerrar automáticamente después de 3 segundos
      setTimeout(() => {
        onClose()
        setEstado('idle')
      }, 3000)
    } catch (error) {
      setEstado('error')
      setMensaje(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setCargando(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Exportar Resultados</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <p className="text-sm font-semibold text-slate-200 mb-3">Formato de Exportación</p>
            <div className="space-y-2">
              {['csv', 'json'].map(fmt => (
                <label
                  key={fmt}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors border border-slate-700/50"
                >
                  <input
                    type="radio"
                    name="format"
                    value={fmt}
                    checked={format === fmt}
                    onChange={e => setFormat(e.target.value as 'csv' | 'json')}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {fmt === 'csv' ? 'CSV' : 'JSON'}{' '}
                      {fmt === 'csv' && '(Excel)'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {fmt === 'csv'
                        ? 'Compatible con Excel y hojas de cálculo'
                        : 'Formato JSON con estructura completa'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/30 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={incluirDetalles}
                onChange={e => setIncluirDetalles(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-slate-200">Incluir detalles adicionales</span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/30 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={incluirAuditoria}
                onChange={e => setIncluirAuditoria(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-slate-200">Incluir información de auditoría</span>
            </label>
          </div>

          {/* Stats */}
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-700/50">
            <p className="text-sm text-slate-300">
              <span className="font-semibold text-white">{resultados.length}</span> registros serán
              exportados
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Formato: {format.toUpperCase()} • Tamaño estimado:{' '}
              {Math.round((resultados.length * 0.5) / 1024)} KB
            </p>
          </div>

          {/* Status Messages */}
          {estado === 'success' && (
            <div className="flex items-center gap-2 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <p className="text-sm text-emerald-300">{mensaje}</p>
            </div>
          )}

          {estado === 'error' && (
            <div className="flex items-center gap-2 p-4 bg-blue-500/20 border border-red-500/30 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
              <p className="text-sm text-blue-300">{mensaje}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={cargando}
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={cargando}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            {cargando ? 'Exportando...' : 'Descargar'}
            {!cargando && <Download className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </Card>
    </div>
  )
}
