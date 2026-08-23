'use client'

interface StatsBarProps { totalResults: number; searchTime: number; totalInDatabase: number }

export function StatsBar({ totalResults, searchTime, totalInDatabase }: StatsBarProps) {
  const items = [
    ['Resultados', totalResults.toLocaleString('es-CL')],
    ['Tiempo', `${searchTime} ms`],
    ['Base indexada', totalInDatabase.toLocaleString('es-CL')],
  ]

  return (
    <div className="grid border-y border-black/10 bg-[#F7F8F6] sm:grid-cols-3">
      {items.map(([label, value], index) => (
        <div key={label} className={`px-5 py-5 ${index > 0 ? 'border-t border-black/10 sm:border-l sm:border-t-0' : ''}`}>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#98A2B3]">{label}</p>
          <p className="mt-2 text-xl font-medium tracking-[-0.025em] text-[#111827]">{value}</p>
        </div>
      ))}
    </div>
  )
}
