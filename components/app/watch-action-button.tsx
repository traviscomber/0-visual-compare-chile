"use client"

import { useState } from "react"
import { BellRing, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SaveToCaseAction } from "@/components/app/save-to-case-action"

type WatchType = "company" | "ipc"

export function WatchActionButton({
  type,
  query,
  label,
  size = "sm",
  variant = "outline",
}: {
  type: WatchType
  query: string
  label?: string
  size?: "sm" | "default"
  variant?: "outline" | "secondary" | "default"
}) {
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle")

  const createWatch = async () => {
    if (state === "saving" || !query.trim()) return
    setState("saving")
    try {
      const response = await fetch("/api/patents/alerts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, query }),
      })
      if (!response.ok) throw new Error("watch_failed")
      setState("done")
    } catch {
      setState("error")
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-2">
      <Button type="button" size={size} variant={state === "done" ? "secondary" : variant} onClick={() => void createWatch()} disabled={state === "saving" || state === "done"}>
        {state === "saving" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : state === "done" ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <BellRing className="mr-2 h-4 w-4" />}
        {state === "done" ? "En vigilancia" : state === "error" ? "Reintentar vigilancia" : label ?? (type === "company" ? "Vigilar empresa" : "Vigilar IPC")}
      </Button>
      <SaveToCaseAction
        itemType="research"
        sourceId={`research:${type}:${query.trim().toUpperCase()}`}
        title={type === "company" ? `Investigación de ${query}` : `Investigación IPC ${query}`}
        contextType={type === "company" ? "company" : "technology"}
        contextQuery={query}
        suggestedCaseTitle={type === "company" ? `Competidor ${query}` : `Tecnología ${query}`}
        metadata={{ href: `/investigar?q=${encodeURIComponent(query)}&mode=${type === "company" ? "company" : "technology"}&autorun=1`, subtitle: type === "company" ? "Perfil empresarial" : "Contexto tecnológico / IPC" }}
        size={size}
      />
    </div>
  )
}
