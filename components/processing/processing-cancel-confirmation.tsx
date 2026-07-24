"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ProcessingCancellationConfirmationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  loading?: boolean
}

export function ProcessingCancellationConfirmation({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: ProcessingCancellationConfirmationProps) {
  return