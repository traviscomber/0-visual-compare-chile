"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ProcessingStatusLabel, type ProcessingStatus } from "@/components/processing/processing-status-label"

interface ProcessingJobDetailsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job: {
    id: string
    image_id: string
    status: ProcessingStatus
    attempts: number
    max_attempts: number
    created_at: string
    updated_at: string
    completed_at: string | null
    last_error: string | null
  } | null
}

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value))
}

export function ProcessingJobDetails({ open, onOpenChange, job }: ProcessingJobDetailsProps) {
  if (!job) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalle del trabajo de procesamiento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Estado</span>
            <ProcessingStatusLabel status={job.status} />
          </div>

          <div>
            <p className="text-muted-foreground">Identificador del trabajo</p>
            <p className="break-all font-mono text-xs">{job.id}</p>
          </div>

          <div>
            <p className="text-muted-foreground">Imagen asociada</p>
            <p className="break-all font-mono text-xs">{job.image_id}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground">Intentos</p>
              <p>{job.attempts} / {job.max_attempts}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Actualizado</p>
              <p>{formatDate(job.updated_at)}</p>
            </div>
          </div>

          <div>
            <p className="text-muted-foreground">Creado</p>
            <p>{formatDate(job.created_at)}</p>
          </div>

          <div>
            <p className="text-muted-foreground">Completado</p>
            <p>{formatDate(job.completed_at)}</p>
          </div>

          {job.last_error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-300">
              {job.last_error}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
