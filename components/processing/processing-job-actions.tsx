"use client"

import { useState } from "react"
import { Loader2, RotateCcw, Square, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProcessingJobActionsProps {
  jobId: string
  status: "queued" | "processing" | "completed" | "failed" | "cancelled"
  onChanged?: () => void
}

export function ProcessingJobActions({ jobId, status, onChanged }: ProcessingJobActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  const execute = async (action: "cancel" | "retry") => {
    setLoading(action)
    setMessage("")

    try {
      const response = await fetch("/api/account/processing-metrics", {
        method: action === "cancel" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "No fue posible completar la acción.")
      }

      setMessage(action === "cancel" ? "Cancelado" : "Reenviado")
      onChanged?.()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="ghost" title="Ver detalles">
        <Eye className="h-4 w-4" />
      </Button>

      {(status === "queued" || status === "processing") && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => execute("cancel")}
          disabled={Boolean(loading)}
        >
          {loading === "cancel" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Square className="h-4 w-4" />
          )}
          <span className="ml-1">Cancelar</span>
        </Button>
      )}

      {(status === "failed" || status === "cancelled") && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => execute("retry")}
          disabled={Boolean(loading)}
        >
          {loading === "retry" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
          <span className="ml-1">Reintentar</span>
        </Button>
      )}

      {message && <span className="text-xs text-muted-foreground">{message}</span>}
    </div>
  )
}
