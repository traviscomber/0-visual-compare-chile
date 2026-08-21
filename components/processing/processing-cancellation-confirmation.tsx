"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ProcessingCancellationConfirmationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: string
  onConfirmed?: () => void
  loading?: boolean
}

export function ProcessingCancellationConfirmation({
  open,
  onOpenChange,
  jobId,
  onConfirmed,
  loading = false,
}: ProcessingCancellationConfirmationProps) {
  const handleConfirm = async () => {
    const response = await fetch("/api/account/processing-metrics", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job_id: jobId }) })
    if (response.ok) { onOpenChange(false); onConfirmed?.() }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            Cancelar procesamiento
          </DialogTitle>
          <DialogDescription>
            Se detendrá el procesamiento actual. Los datos ya guardados permanecerán disponibles para auditoría.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Continuar procesamiento
          </Button>
          <Button type="button" variant="destructive" onClick={() => void handleConfirm()} disabled={loading}>
            {loading ? "Cancelando..." : "Cancelar procesamiento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
