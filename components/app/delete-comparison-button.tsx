"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function DeleteComparisonButton({
  id,
  redirectTo,
  variant = "ghost",
  size = "sm",
  iconOnly = false,
}: {
  id: string
  redirectTo?: string
  variant?: "ghost" | "outline" | "destructive"
  size?: "sm" | "icon"
  iconOnly?: boolean
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const handleDelete = async (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (pending) return
    if (!confirm("¿Eliminar esta comparación? Esta acción no se puede deshacer.")) return

    setPending(true)
    try {
      const res = await fetch(`/api/comparisons/${id}`, { method: "DELETE" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? "No pudimos eliminar la comparación.")
      toast.success("Comparación eliminada")
      if (redirectTo) {
        router.push(redirectTo)
      } else {
        router.refresh()
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar.")
      setPending(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      variant={variant}
      size={size}
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
      aria-label="Eliminar comparación"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      {!iconOnly && <span className="ml-1.5">Eliminar</span>}
    </Button>
  )
}
