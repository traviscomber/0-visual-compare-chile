import { Badge } from "@/components/ui/badge"

export type ProcessingStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"

const labels: Record<ProcessingStatus, string> = {
  queued: "En cola",
  processing: "Procesando",
  completed: "Completado",
  failed: "Fallido",
  cancelled: "Cancelado",
}

const styles: Record<ProcessingStatus, string> = {
  queued: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  processing: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  failed: "border-red-500/30 bg-red-500/10 text-red-400",
  cancelled: "border-slate-500/30 bg-slate-500/10 text-slate-400",
}

export function ProcessingStatusLabel({ status }: { status: ProcessingStatus }) {
  return (
    <Badge variant="outline" className={styles[status]}>
      {labels[status]}
    </Badge>
  )
}
