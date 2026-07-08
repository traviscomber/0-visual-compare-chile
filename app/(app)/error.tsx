"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RotateCcw } from "lucide-react"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] app segment error", error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-serif text-2xl text-foreground">Algo salió mal</h1>
          <p className="text-muted-foreground mt-1 leading-relaxed">
            No pudimos cargar esta vista. El equipo fue notificado, vuelve a intentarlo en unos
            segundos.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/70 mt-3 font-mono">ref: {error.digest}</p>
          )}
        </div>
        <Button onClick={reset} variant="outline" className="gap-1.5 bg-transparent">
          <RotateCcw className="h-4 w-4" />
          Reintentar
        </Button>
      </div>
    </div>
  )
}
