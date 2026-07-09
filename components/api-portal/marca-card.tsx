'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Copy, X } from 'lucide-react'
import { SearchResult } from '@/types/marca'

interface MarcaCardProps {
  result: SearchResult
  onClose: () => void
  onCopyId?: (id: string) => void
  onExport?: () => void
}

export function MarcaCard({ result, onClose, onCopyId, onExport }: MarcaCardProps) {
  const { marca } = result

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
      <Card className="w-full max-w-3xl border-white/10 bg-slate-950/95 shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
          <div>
            <Badge className="border border-blue-400/30 bg-blue-500/20 text-blue-100">Detalle</Badge>
            <h3 className="mt-3 text-2xl font-bold text-white">{marca.nombre}</h3>
            <p className="mt-1 text-sm text-slate-300">{marca.solicitante}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Numero de registro</p>
              <p className="mt-2 font-mono text-sm text-white">{marca.numeroRegistro}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pais</p>
              <p className="mt-2 text-sm text-white">{marca.pais}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Estado</p>
              <p className="mt-2 text-sm text-white">{marca.estado}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Clases Niza</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {marca.niza.map((item) => (
                  <Badge key={item} variant="outline" className="border-blue-400/30 text-blue-100">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Codigos Viena</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {marca.viena.map((item) => (
                  <Badge key={item} variant="outline" className="border-purple-400/30 text-purple-100">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Relevancia</p>
              <p className="mt-2 text-sm text-white">{result.relevancia}%</p>
            </div>
          </div>
        </div>

        {marca.descripcion && (
          <div className="border-t border-white/10 px-6 py-5">
            <p className="text-sm text-slate-300">{marca.descripcion}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 p-6">
          <Button
            type="button"
            variant="outline"
            className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            onClick={() => onCopyId?.(marca.id)}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copiar ID
          </Button>
          <Button
            type="button"
            className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white hover:from-blue-500 hover:to-indigo-400"
            onClick={onExport}
          >
            Exportar
          </Button>
        </div>
      </Card>
    </div>
  )
}
