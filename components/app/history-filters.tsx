"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function HistoryFilters({
  defaultClassification,
  defaultQuery,
  basePath = "/history",
}: {
  defaultClassification: string
  defaultQuery: string
  basePath?: "/history" | "/reportes"
}) {
  const router = useRouter()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [query, setQuery] = useState(defaultQuery)

  useEffect(() => setQuery(defaultQuery), [defaultQuery])

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    next.delete("min")
    next.delete("max")
    if (value && value !== "all") next.set(key, value)
    else next.delete(key)
    startTransition(() => router.replace(`${basePath}${next.toString() ? `?${next}` : ""}`))
  }

  useEffect(() => {
    const timer = setTimeout(() => update("q", query.trim()), 250)
    return () => clearTimeout(timer)
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    setQuery("")
    startTransition(() => router.replace(basePath))
  }

  const hasFilters = Boolean(defaultClassification !== "all" || defaultQuery)

  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
      <div className="min-w-[220px] flex-1">
        <label className="text-xs font-medium text-muted-foreground">Buscar en recomendaciones</label>
        <div className="relative mt-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            placeholder="Ej: revisar forma, coincidencia denominativa…"
            className="pl-8"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="w-full sm:w-56">
        <label className="text-xs font-medium text-muted-foreground">Clasificación registrada</label>
        <Select value={defaultClassification} onValueChange={(value) => update("classification", value)}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="exact_match">Coincidencia exacta</SelectItem>
            <SelectItem value="near_duplicate">Muy cercana</SelectItem>
            <SelectItem value="visually_similar">Visualmente similar</SelectItem>
            <SelectItem value="partially_similar">Parcialmente similar</SelectItem>
            <SelectItem value="different">Diferente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        {hasFilters ? <Button variant="ghost" size="sm" onClick={reset}><X className="mr-1 h-4 w-4" />Limpiar</Button> : null}
        {pending ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground motion-reduce:animate-none" /> : null}
      </div>
    </div>
  )
}
