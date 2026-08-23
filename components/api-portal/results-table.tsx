'use client'

import Link from "next/link"
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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

export function ResultsTable({ results, isLoading = false, pagination, query, searchType, onPageChange, onSelectMarca }: ResultsTableProps) {
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit))

  return (
    <section className="border-y border-black/10 bg-white">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/10 px-5 py-5 sm:px-7">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0F766E]">ANTECEDENTES</p><h3 className="mt-2 text-2xl font-normal tracking-[-0.03em] text-[#111827]">Resultados de la consulta</h3></div>
        <p className="text-sm text-[#667085]">{pagination.total.toLocaleString('es-CL')} registro{pagination.total === 1 ? '' : 's'}</p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-[#F7F8F6]"><TableRow className="border-black/10 hover:bg-transparent"><TableHead className="text-[#667085]">Nombre</TableHead><TableHead className="text-[#667085]">Por qué aparece</TableHead><TableHead className="text-[#667085]">Clases</TableHead><TableHead className="text-[#667085]">Estado</TableHead><TableHead className="text-right text-[#667085]">Prioridad</TableHead><TableHead className="text-right text-[#667085]">Acción</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow className="border-black/10"><TableCell colSpan={6} className="py-14 text-center text-[#667085]">Buscando antecedentes…</TableCell></TableRow> : results.length === 0 ? <TableRow className="border-black/10"><TableCell colSpan={6} className="py-14 text-center text-[#667085]">No hay resultados para mostrar.</TableCell></TableRow> : results.map((result) => {
              const risk = buildResultRiskLevel(result, query, searchType)
              const reason = buildResultReason(result, query, searchType)
              return <TableRow key={result.marca.id} className="cursor-pointer border-black/10 hover:bg-[#F7F8F6]" onClick={() => onSelectMarca(result)}>
                <TableCell className="font-medium text-[#111827]"><div>{result.marca.nombre}</div><div className="mt-1 text-xs font-normal text-[#98A2B3]">{result.marca.solicitante || 'Titular no informado'}</div></TableCell>
                <TableCell><div className="max-w-sm text-sm text-[#475467]">{reason}</div><div className="mt-1 text-xs text-[#98A2B3]">Relevancia {result.relevancia}%</div></TableCell>
                <TableCell><div className="flex flex-wrap gap-1">{result.marca.niza.slice(0, 2).map((item) => <Badge key={item} variant="outline" className="border-black/10 bg-[#F7F8F6] text-[#475467]">Niza {item}</Badge>)}{result.marca.viena.slice(0, 1).map((item) => <Badge key={item} variant="outline" className="border-[#99F6E4] bg-[#F0FDFA] text-[#134E4A]">Viena {item}</Badge>)}</div></TableCell>
                <TableCell><Badge variant="outline" className="border-black/10 bg-white text-[#475467]">{result.marca.estado}</Badge></TableCell>
                <TableCell className="text-right"><Badge className={priorityBadgeClassName(risk)}>{formatRiskLabel(risk)}</Badge></TableCell>
                <TableCell className="text-right"><div className="flex justify-end gap-2"><Button type="button" variant="ghost" size="sm" className="text-[#475467] hover:bg-black/5" onClick={(event) => { event.stopPropagation(); onSelectMarca(result) }}>Ver</Button><Button asChild size="sm" className="bg-[#111827] text-white shadow-none hover:bg-[#273244]"><Link href={`/marca/${result.marca.id}`} onClick={(event) => event.stopPropagation()}>Ficha</Link></Button></div></TableCell>
              </TableRow>
            })}
          </TableBody>
        </Table>
      </div>

      <div className="border-t border-black/10 px-5 py-4 sm:px-7"><Pagination><PaginationContent><PaginationItem><Button type="button" variant="outline" size="sm" className={`border-black/10 bg-white text-[#475467] ${pagination.page <= 1 ? 'pointer-events-none opacity-40' : ''}`} onClick={() => onPageChange(Math.max(1, pagination.page - 1))}>Anterior</Button></PaginationItem><PaginationItem><span className="px-3 text-sm text-[#667085]">Página {pagination.page} de {totalPages}</span></PaginationItem><PaginationItem><Button type="button" variant="outline" size="sm" className={`border-black/10 bg-white text-[#475467] ${pagination.page >= totalPages ? 'pointer-events-none opacity-40' : ''}`} onClick={() => onPageChange(Math.min(totalPages, pagination.page + 1))}>Siguiente</Button></PaginationItem></PaginationContent></Pagination></div>
    </section>
  )
}

function priorityBadgeClassName(risk: 'high' | 'medium' | 'low') {
  if (risk === 'high') return 'border border-red-200 bg-red-50 text-red-700'
  if (risk === 'medium') return 'border border-amber-200 bg-amber-50 text-amber-800'
  return 'border border-emerald-200 bg-emerald-50 text-emerald-700'
}
