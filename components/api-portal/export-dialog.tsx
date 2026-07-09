'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Download, FileJson, FileSpreadsheet, FileText, X } from 'lucide-react'
import { SearchResult } from '@/types/marca'
import { downloadFile, exportData, exportTableToHTML } from '@/lib/export-utils'

interface ExportDialogProps {
  results: SearchResult[]
  isOpen: boolean
  onClose: () => void
}

type ExportFormat = 'csv' | 'json' | 'pdf'

export function ExportDialog({ results, isOpen, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [busy, setBusy] = useState(false)
  const total = results.length

  const formatDescription = (value: ExportFormat) => {
    if (value === 'csv') return 'Compatible con hojas de calculo'
    if (value === 'json') return 'Incluye metadata estructurada'
    return 'Abre una vista imprimible lista para PDF'
  }

  if (!isOpen) return null

  const handleExport = async () => {
    setBusy(true)

    try {
      if (format === 'pdf') {
        const html = exportTableToHTML(results)
        const windowRef = window.open('', '_blank', 'noopener,noreferrer')
        if (!windowRef) {
          throw new Error('No se pudo abrir la vista de impresion')
        }

        windowRef.document.write(html)
        windowRef.document.close()
        windowRef.focus()
        windowRef.print()
        return
      }

      const exported = exportData(results, format)
      if (!exported) {
        throw new Error('No fue posible generar la exportacion')
      }

      downloadFile(exported.content, exported.filename, format)
    } finally {
      setBusy(false)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
      <Card className="w-full max-w-xl border-white/10 bg-slate-950/95 shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
          <div>
            <h3 className="text-xl font-bold text-white">Exportar resultados</h3>
            <p className="mt-1 text-sm text-slate-300">{total} registros seleccionados</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {([
            ['csv', 'CSV', FileSpreadsheet],
            ['json', 'JSON', FileJson],
            ['pdf', 'PDF', FileText]
          ] as const).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFormat(value)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                format === value
                  ? 'border-blue-400/40 bg-blue-500/15 text-white'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Icon className="h-5 w-5" />
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-slate-400">{formatDescription(value)}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/10 p-6">
          <Button
            type="button"
            variant="outline"
            className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            onClick={onClose}
            disabled={busy}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white hover:from-blue-500 hover:to-indigo-400"
            onClick={handleExport}
            disabled={busy}
          >
            <Download className="mr-2 h-4 w-4" />
            {busy ? 'Exportando...' : 'Exportar'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
