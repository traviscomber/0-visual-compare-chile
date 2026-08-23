'use client'

import { Button } from '@/components/ui/button'
import { SearchFilters } from '@/types/marca'

interface FilterPanelProps {
  filters: SearchFilters
  availableNiza: string[]
  availableViena: string[]
  onFilterChange: (filters: SearchFilters) => void
  onClearFilters: () => void
}

const fieldClass = 'w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#0F766E]/50'

export function FilterPanel({ filters, availableNiza, availableViena, onFilterChange, onClearFilters }: FilterPanelProps) {
  const activeCount = [filters.estado, filters.pais, filters.fechaDesde, filters.fechaHasta, filters.niza?.length, filters.viena?.length].filter(Boolean).length

  return (
    <section className="border-y border-black/10 bg-[#F7F8F6] px-5 py-6 sm:px-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">FILTROS</p>
          <p className="mt-2 text-sm text-[#667085]">Refina la consulta con campos verificables del registro.</p>
        </div>
        {activeCount > 0 && <Button type="button" variant="ghost" className="text-[#0F766E] hover:bg-black/5" onClick={onClearFilters}>Limpiar {activeCount} filtro{activeCount === 1 ? '' : 's'}</Button>}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <label className="space-y-2"><span className="text-xs text-[#667085]">Estado</span><select className={fieldClass} value={filters.estado ?? ''} onChange={(e) => onFilterChange({ ...filters, estado: e.target.value ? e.target.value as SearchFilters['estado'] : undefined })}><option value="">Todos</option><option value="Registrada">Registrada</option><option value="Pendiente">Pendiente</option><option value="Denegada">Denegada</option></select></label>
        <label className="space-y-2"><span className="text-xs text-[#667085]">País</span><input className={fieldClass} value={filters.pais ?? ''} onChange={(e) => onFilterChange({ ...filters, pais: e.target.value.toUpperCase() || undefined })} placeholder="CL" /></label>
        <label className="space-y-2"><span className="text-xs text-[#667085]">Desde</span><input type="date" className={fieldClass} value={filters.fechaDesde ?? ''} onChange={(e) => onFilterChange({ ...filters, fechaDesde: e.target.value || undefined })} /></label>
        <label className="space-y-2"><span className="text-xs text-[#667085]">Hasta</span><input type="date" className={fieldClass} value={filters.fechaHasta ?? ''} onChange={(e) => onFilterChange({ ...filters, fechaHasta: e.target.value || undefined })} /></label>
        <label className="space-y-2"><span className="text-xs text-[#667085]">Niza</span><select className={fieldClass} value={filters.niza?.[0] ?? ''} onChange={(e) => onFilterChange({ ...filters, niza: e.target.value ? [e.target.value] : undefined })}><option value="">Todas</option>{availableNiza.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="space-y-2"><span className="text-xs text-[#667085]">Viena</span><select className={fieldClass} value={filters.viena?.[0] ?? ''} onChange={(e) => onFilterChange({ ...filters, viena: e.target.value ? [e.target.value] : undefined })}><option value="">Todos</option>{availableViena.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      </div>
    </section>
  )
}
