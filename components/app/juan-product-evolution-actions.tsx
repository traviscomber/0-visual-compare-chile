"use client"

import { useState } from "react"
import { Check, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function JuanProductEvolutionActions({
  recommendationId,
  organizationId,
}: {
  recommendationId: string
  organizationId: string
}) {
  const [saving, setSaving] = useState<"accepted" | "rejected" | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function decide(decision: "accepted" | "rejected") {
    if (saving) return
    setSaving(decision)
    setError(null)
    try {
      const response = await fetch("/api/intelligence/product-evolution-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId, organizationId, decision }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos guardar la decisión.")
      window.location.reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar la decisión.")
      setSaving(null)
    }
  }

  return <div>
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" onClick={() => void decide("accepted")} disabled={Boolean(saving)}>
        {saving === "accepted" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        Aprobar
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => void decide("rejected")} disabled={Boolean(saving)}>
        {saving === "rejected" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
        Rechazar
      </Button>
    </div>
    {error ? <p className="mt-2 text-xs text-[#E0B987]">{error}</p> : null}
  </div>
}
