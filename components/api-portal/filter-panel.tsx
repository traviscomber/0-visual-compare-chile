'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SearchFilters } from '@/types/marca'

interface FilterPanelProps {
  filters: SearchFilters
  availableNiza: string[]
  availableViena: string[]
  onFilterChange: (filters: SearchFilters) => void
  onClearFilters: () => void
}

export function FilterPanel({
  filters,
  availableNiza,
  availableViena,
  onFilterChange,
  onClearFilters
}: FilterPanelProps) {
  const activeCount = [
    filters.estado,
    filters.pais,
    filters.fechaDesde,
    filters.fechaHasta,
    filters.niza?.length,
    filters.viena?.length
  ].filter(Boolean).length

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Filtros</h3>
            <p className="text-sm text-slate-300">Reduce el conjunto de resultados visibles.</p>
          </div>
          {activeCount > 0 && (
            <Badge className="bg-blue-500/20 text-blue-100 border border-blue-400/30">
              {activeCount} activos
            </Badge>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-sm text-slate-200">Estado</span>
            <select
              className="w-full rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              value={filters.estado ?? ''}
              onChange={(event) =>
                onFilterChange({
                  ...filters,
                  estado: event.target.value ? (event.target.value as SearchFilters['estado']) : undefined
                })
              }
            >
              <option value="">Todos</option>
              <option value="Registrada">Registrada</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Denegada">Denegada</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm text-slate-200">País</span>
            <input
              className="w-full rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500"
              value={filters.pais ?? ''}
              onChange={(event) =>
                onFilterChange({
                  ...filters,
                  pais: event.target.value.toUpperCase() || undefined
                })
              }
              placeholder="CL"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-slate-200">Desde</span>
            <input
              type="date"
              className="w-full rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              value={filters.fechaDesde ?? ''}
              onChange={(event) =>
                onFilterChange({
                  ...filters,
                  fechaDesde: event.target.value || undefined
                })
              }
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-slate-200">Hasta</span>
            <input
              type="date"
              className="w-full rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              value={filters.fechaHasta ?? ''}
              onChange={(event) =>
                onFilterChange({
                  ...filters,
                  fechaHasta: event.target.value || undefined
                })
              }
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm text-slate-200">Clase Niza</span>
            <select
              className="w-full rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              value={filters.niza?.[0] ?? ''}
              onChange={(event) =>
                onFilterChange({
                  ...filters,
                  niza: event.target.value ? [event.target.value] : undefined
                })
              }
            >
              <option value="">Todas</option>
              {availableNiza.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm text-slate-200">Codigo Viena</span>
            <select
              className="w-full rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              value={filters.viena?.[0] ?? ''}
              onChange={(event) =>
                onFilterChange({
                  ...filters,
                  viena: event.target.value ? [event.target.value] : undefined
                })
              }
            >
              <option value="">Todos</option>
              {availableViena.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            onClick={onClearFilters}
          >
            Limpiar filtros
          </Button>
        </div>
      </div>
    </Card>
  )
}
