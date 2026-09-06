"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function JuanResearchFrontierRefresh({ auto = false }: { auto?: boolean }) {
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const autoStarted = useRef(false)

  async function refresh() {
    if (running) return
    setRunning(true)
    setError(null)
    try {
      const response = await fetch("/api/intelligence/product-evolution-refresh", { method: "POST" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos actualizar la investigación.")
      window.location.reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos actualizar la investigación.")
      setRunning(false)
    }
  }

  useEffect(() => {
    if (!auto || autoStarted.current) return
    autoStarted.current = true
    void refresh()
  }, [auto])

  return <div className="flex flex-col items-end gap-1.5">
    <Button type="button" size="sm" variant="outline" onClick={() => void refresh()} disabled={running}>
      {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
      {running ? "Investigando…" : "Investigar ahora"}
    </Button>
    {auto && running ? <p className="max-w-64 text-right text-[10px] leading-4 text-[#96B5A6]">Actualizando evidencia al modelo v3.1…</p> : null}
    {error ? <p className="max-w-64 text-right text-[10px] leading-4 text-[#E0B987]">{error}</p> : null}
  </div>
}
