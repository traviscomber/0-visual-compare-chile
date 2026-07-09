'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination'
import { SearchResult } from '@/types/marca'

interface ResultsTableProps {
  results: SearchResult[]
  isLoading?: boolean
  pagination: { page: number; total: number; limit: number }
  onPageChange: (page: number) => void
  onSelectMarca: (result: SearchResult) => void
}

export function ResultsTable({
  results,
  isLoading = false,
  pagination,
  onPageChange,
  onSelectMarca
}: ResultsTableProps) {
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit))

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Resultados</h3>
            <p className="text-sm text-slate-300">
              {pagination.total} registros en {totalPages} pagina{totalPages === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10">
          <Table>
            <TableHeader className="bg-slate-950/50">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-slate-200">Nombre</TableHead>
                <TableHead className="text-slate-200">Niza</TableHead>
                <TableHead className="text-slate-200">Viena</TableHead>
                <TableHead className="text-slate-200">Estado</TableHead>
                <TableHead className="text-slate-200 text-right">Relevancia</TableHead>
                <TableHead className="text-slate-200 text-right">Accion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="border-white/10">
                  <TableCell colSpan={6} className="py-12 text-center text-slate-300">
                    Cargando resultados...
                  </TableCell>
                </TableRow>
              ) : results.length === 0 ? (
                <TableRow className="border-white/10">
                  <TableCell colSpan={6} className="py-12 text-center text-slate-300">
                    No hay resultados para mostrar.
                  </TableCell>
                </TableRow>
              ) : (
                results.map((result) => (
                  <TableRow
                    key={result.marca.id}
                    className="cursor-pointer border-white/10 hover:bg-white/5"
                    onClick={() => onSelectMarca(result)}
                  >
                    <TableCell className="font-medium text-white">
                      <div className="space-y-1">
                        <div>{result.marca.nombre}</div>
                        <div className="text-xs text-slate-400">{result.marca.solicitante}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      <div className="flex flex-wrap gap-1">
                        {result.marca.niza.slice(0, 2).map((item) => (
                          <Badge key={item} variant="outline" className="border-blue-400/30 text-blue-200">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      <div className="flex flex-wrap gap-1">
                        {result.marca.viena.slice(0, 2).map((item) => (
                          <Badge key={item} variant="outline" className="border-purple-400/30 text-purple-200">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      <Badge className="border border-white/10 bg-white/5 text-slate-100">{result.marca.estado}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-slate-200">{result.relevancia}%</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                        onClick={(event) => {
                          event.stopPropagation()
                          onSelectMarca(result)
                        }}
                      >
                        Ver detalle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={`border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 ${
                  pagination.page <= 1 ? 'pointer-events-none opacity-50' : ''
                }`}
                onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
              >
                Anterior
              </Button>
            </PaginationItem>
            <PaginationItem>
              <span className="px-3 text-sm text-slate-300">
                Pagina {pagination.page} de {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={`border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 ${
                  pagination.page >= totalPages ? 'pointer-events-none opacity-50' : ''
                }`}
                onClick={() => onPageChange(Math.min(totalPages, pagination.page + 1))}
              >
                Siguiente
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </Card>
  )
}
