'use client'

import Link from "next/link"
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
import { buildResultReason, buildResultRiskLevel, formatRiskLabel } from '@/lib/trademark-insights'

interface ResultsTableProps {
  results: SearchResult[]
  isLoading?: boolean
  pagination: { page: number; total: number; limit: number }
  query: string
  searchType: 'nombre' | 'niza' | 'viena'
  onPageChange: (page: number) => void
  onSelectMarca: (result: SearchResult) => void
}

export function ResultsTable({
  results,
  isLoading = false,
  pagination,
  query,
  searchType,
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
                <TableHead className="text-slate-200">Motivo</TableHead>
                <TableHead className="text-slate-200">Clases</TableHead>
                <TableHead className="text-slate-200">Estado</TableHead>
                <TableHead className="text-slate-200 text-right">Riesgo</TableHead>
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
                results.map((result) => {
                  const risk = buildResultRiskLevel(result, query, searchType)
                  const reason = buildResultReason(result, query, searchType)

                  return (
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
                        <div className="max-w-xs space-y-1">
                          <div className="text-sm text-slate-100">{reason}</div>
                          <div className="text-xs text-slate-500">Relevancia {result.relevancia}%</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <div className="flex flex-wrap gap-1">
                          {result.marca.niza.slice(0, 2).map((item) => (
                            <Badge key={item} variant="outline" className="border-blue-400/30 text-blue-200">
                              Niza {item}
                            </Badge>
                          ))}
                          {result.marca.viena.slice(0, 1).map((item) => (
                            <Badge key={item} variant="outline" className="border-cyan-400/30 text-cyan-200">
                              Viena {item}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <Badge className="border border-white/10 bg-white/5 text-slate-100">{result.marca.estado}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-slate-200">
                        <Badge className={riskBadgeClassName(risk)}>{formatRiskLabel(risk)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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
                            Preview
                          </Button>
                          <Button asChild size="sm" variant="outline" className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10">
                            <Link
                              href={`/api/report/pdf?id=${result.marca.id}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(event) => {
                                event.stopPropagation()
                              }}
                            >
                              PDF
                            </Link>
                          </Button>
                          <Button asChild size="sm" className="bg-blue-600 text-white hover:bg-blue-500">
                            <Link
                              href={`/marca/${result.marca.id}`}
                              onClick={(event) => {
                                event.stopPropagation()
                              }}
                            >
                              Ficha
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
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

function riskBadgeClassName(risk: 'high' | 'medium' | 'low') {
  if (risk === 'high') return 'border border-red-400/30 bg-red-500/15 text-red-100'
  if (risk === 'medium') return 'border border-amber-400/30 bg-amber-500/15 text-amber-100'
  return 'border border-emerald-400/30 bg-emerald-500/15 text-emerald-100'
}
