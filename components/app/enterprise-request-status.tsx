"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

const statuses = [
  ["new", "Nueva"],
  ["contacted", "Contactado"],
  ["qualified", "Calificado"],
  ["approved", "Aprobado"],
  ["rejected", "Descartado"],
  ["closed", "Cerrado"],
] as const

export function EnterpriseRequestStatus({ id, initialStatus }: { id: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  async function updateStatus(nextStatus: string) {
    if (nextStatus === status || loading) return
    const previous = status
    setStatus(nextStatus)
    setError(false)
    setLoading(true)

    try {
      const response = await fetch(`/api/enterprise-access/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!response.ok) throw new Error("status_update_failed")
    } catch {
      setStatus(previous)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`enterprise-status-${id}`}>Estado de solicitud</label>
      <select
        id={`enterprise-status-${id}`}
        value={status}
        disabled={loading}
        onChange={(event) => void updateStatus(event.target.value)}
        className="h-8 border border-border bg-background px-2 text-xs text-[#D8DDDB] outline-none focus:border-[#4A7F74] disabled:opacity-60"
      >
        {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#96B5A6] motion-reduce:animate-none" /> : null}
      {error ? <span className="text-[11px] text-red-200">No se pudo actualizar</span> : null}
    </div>
  )
}
