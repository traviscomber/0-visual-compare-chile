"use client"

import { useState } from "react"
import { BellPlus, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function WatchBrandAction({ mark, niza = [] }: { mark: string; niza?: number[] }) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function watch() {
    if (!mark.trim() || saving || saved) return
    setSaving(true)
    setError(null)
    try {
      const response = await fetch("/api/intelligence/watchlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "brand", query: mark.trim(), niza }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok && response.status !== 409) throw new Error(payload.error || "No pudimos activar la vigilancia.")
      setSaved(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos activar la vigilancia.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button type="button" variant="outline" onClick={() => void watch()} disabled={saving || saved}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : saved ? <Check className="mr-2 h-4 w-4 text-emerald-600"/> : <BellPlus className="mr-2 h-4 w-4"/>}
        {saved ? "Vigilancia activa" : "Vigilar esta marca"}
      </Button>
      {error ? <p className="max-w-xs text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
