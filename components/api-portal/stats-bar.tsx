'use client'

import { Card } from '@/components/ui/card'
import { Clock3, Database, Search } from 'lucide-react'

interface StatsBarProps {
  totalResults: number
  searchTime: number
  totalInDatabase: number
}

export function StatsBar({ totalResults, searchTime, totalInDatabase }: StatsBarProps) {
  const cards = [
    { label: 'Resultados', value: totalResults, icon: Search, accent: 'text-blue-300' },
    { label: 'Tiempo', value: `${searchTime} ms`, icon: Clock3, accent: 'text-amber-300' },
    { label: 'Base', value: totalInDatabase, icon: Database, accent: 'text-purple-300' }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label} className="border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">{card.label}</p>
                  <p className="mt-2 text-2xl font-bold text-white">{card.value}</p>
                </div>
                <div className={`rounded-full border border-white/10 bg-white/5 p-3 ${card.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
