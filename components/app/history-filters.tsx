"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Search, X } from "lucide-react"

export function HistoryFilters({
  defaultClassification,
  defaultMinScore,
  defaultMaxScore,
  defaultQuery,
}: {
  defaultClassification: string
  defaultMinScore: string
  defaultMaxScore: string
  defaultQuery: string
}) {
  const router = useRouter()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value && value !== "all") next.set(key, value)
    else next.delete(key)
    startTransition(() => {
      router.replace(`/history${next.toString() ? `?${next}` : ""}`)
    })
  }

  const reset = () => {
    startTransition(() => router.replace("/history"))
  }

  const hasFilters = Boolean(
    defaultClassification !== "all" || defaultMinScore || defaultMaxScore || defaultQuery,
  )

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
      <div className="flex-1 min-w-[200px]">
        <label className="text-xs font-medium text-muted-foreground">Buscar recomendación</label>
        <div className="relative mt-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            defaultValue={defaultQuery}
            placeholder="ej: idéntica, modificada"
            className="pl-8"
            onChange={(e) => update("q", e.target.value)}
          />
        </div>
      </div>

      <div className="w-full sm:w-48">
        <label className="text-xs font-medium text-muted-foreground">Clasificación</label>
        <Select value={defaultClassification} onValueChange={(v) => update("classification", v)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="exact_match">Coincidencia exacta</SelectItem>
            <SelectItem value="near_duplicate">Casi idéntica</SelectItem>
            <SelectItem value="visually_similar">Visualmente similar</SelectItem>
            <SelectItem value="partially_similar">Parcialmente similar</SelectItem>
            <SelectItem value="different">Diferente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 sm:w-56">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground">Mín %</label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            defaultValue={defaultMinScore}
            placeholder="0"
            className="mt-1"
            onChange={(e) => update("min", e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground">Máx %</label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            defaultValue={defaultMaxScore}
            placeholder="100"
            className="mt-1"
            onChange={(e) => update("max", e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        )}
        {pending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
    </div>
  )
}
