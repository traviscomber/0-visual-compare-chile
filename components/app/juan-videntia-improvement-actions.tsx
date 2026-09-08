"use client"

import { useState } from "react"
import { CheckCircle2, FlaskConical, Loader2, Play, Send, TestTube2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { VidentiaImprovementStatus } from "@/lib/intelligence/videntia-improvement-lifecycle"

export function JuanVidentiaImprovementActions({
  improvementId,
  organizationId,
  status,
}: {
  improvementId: string
  organizationId: string
  status: VidentiaImprovementStatus
}) {
  const [saving, setSaving] = useState(false)
  const [implementationRef, setImplementationRef] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function transition(action: "begin_research" | "propose" | "approve" | "mark_implemented" | "measure") {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      const response = await fetch("/api/intelligence/videntia-improvement-transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          improvementId,
          organizationId,
          action,
          implementationRef: action === "mark_implemented" ? implementationRef.trim() : undefined,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos registrar la transición.")
      window.location.reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos registrar la transición.")
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 border-t border-[#294047] pt-3">
      {status === "detected" ? <LifecycleButton icon={FlaskConical} label="Investigar" saving={saving} onClick={() => void transition("begin_research")} /> : null}
      {status === "researching" ? <LifecycleButton icon={Send} label="Preparar propuesta" saving={saving} onClick={() => void transition("propose")} /> : null}
      {status === "proposed" ? <LifecycleButton icon={CheckCircle2} label="Aprobar + fijar baseline" saving={saving} onClick={() => void transition("approve")} /> : null}
      {status === "approved" ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={implementationRef}
            onChange={(event) => setImplementationRef(event.target.value)}
            placeholder="PR, SHA o deployment verificable"
            className="h-8 border-[#294047] bg-[#091D22] text-[10px] text-[#D6DDDA] placeholder:text-[#667572]"
            maxLength={500}
          />
          <LifecycleButton icon={Play} label="Marcar implementada" saving={saving} disabled={implementationRef.trim().length < 3} onClick={() => void transition("mark_implemented")} />
        </div>
      ) : null}
      {status === "implemented" ? <LifecycleButton icon={TestTube2} label="Medir resultado" saving={saving} onClick={() => void transition("measure")} /> : null}
      {status === "measured" ? <p className="text-[9px] uppercase tracking-[0.1em] text-[#719B8D]">Medición registrada · interpretación humana pendiente o completada fuera del score</p> : null}
      {error ? <p className="mt-2 text-[10px] leading-4 text-[#D8C99D]">{error}</p> : null}
    </div>
  )
}

function LifecycleButton({
  icon: Icon,
  label,
  saving,
  disabled = false,
  onClick,
}: {
  icon: typeof FlaskConical
  label: string
  saving: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <Button type="button" size="sm" variant="outline" className="h-8 border-[#31534D] bg-[#102A2E] text-[10px] text-[#DCE8E2] hover:bg-[#173B37]" disabled={saving || disabled} onClick={onClick}>
      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
      {label}
    </Button>
  )
}
