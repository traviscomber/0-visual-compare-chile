"use client"

import { useCallback, useEffect, useState } from "react"
import type { Phase1StatusPayload, Phase1StatusSummary } from "@/lib/phase1-status"

export function usePhase1Status(initialPayload?: Phase1StatusPayload | null) {
  const [summary, setSummary] = useState<Phase1StatusSummary | null>(initialPayload?.summary ?? null)
  const [fetchedAt, setFetchedAt] = useState<string | null>(initialPayload?.fetchedAt ?? null)
  const [actions, setActions] = useState<Phase1StatusPayload["actions"] | null>(initialPayload?.actions ?? null)
  const [loading, setLoading] = useState(!initialPayload)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSummary = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "refresh") {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError(null)

    try {
      const response = await fetch("/api/account/phase1-status", { cache: "no-store" })
      if (!response.ok) {
        throw new Error("No fue posible cargar el estado operativo de Fase 1")
      }

      const payload = (await response.json()) as Partial<Phase1StatusPayload>
      setSummary(payload.summary ?? null)
      setFetchedAt(typeof payload.fetchedAt === "string" ? payload.fetchedAt : null)
      setActions(payload.actions ?? null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Error cargando Fase 1")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (initialPayload) {
      return
    }

    void loadSummary("initial")
  }, [initialPayload, loadSummary])

  return {
    summary,
    fetchedAt,
    actions,
    loading,
    refreshing,
    error,
    loadSummary,
  }
}
