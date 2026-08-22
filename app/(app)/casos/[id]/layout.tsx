import type { ReactNode } from "react"
import { CaseBriefShortcut } from "@/components/cases/case-brief-shortcut"
import { CaseCollaborationShortcut } from "@/components/cases/case-collaboration-shortcut"
import { CaseReviewShortcut } from "@/components/cases/case-review-shortcut"

export default async function CaseLayout({ children, params }: { children: ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params
  return <><CaseReviewShortcut caseId={id}/><CaseCollaborationShortcut caseId={id}/><CaseBriefShortcut caseId={id}/>{children}</>
}
