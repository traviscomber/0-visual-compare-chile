"use client"

import { useState } from "react"
import { ProcessingJobActions } from "@/components/processing/processing-job-actions"
import { ProcessingCancellationConfirmation } from "@/components/processing/processing-cancellation-confirmation"
import { ProcessingJobDetails } from "@/components/processing/processing-job-details"

interface Job {
  id: string
  image_id: string
  status: "queued" | "processing" | "completed" | "failed" | "cancelled"
  attempts: number
  max_attempts: number
  created_at: string
  updated_at: string
  completed_at: string | null
  last_error: string | null
}

export function ProcessingJobActionsCell({ job, onChanged }: { job: Job; onChanged?: () => void }) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  return (
    <>
      <ProcessingJobActions
        jobId={job.id}
        status={job.status}
        onChanged={onChanged}
      />

      <ProcessingJobDetails
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        job={job}
      />

      <ProcessingCancellationConfirmation
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        jobId={job.id}
        onConfirmed={onChanged}
      />
    </>
  )
}
