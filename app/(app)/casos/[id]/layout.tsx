import type { ReactNode } from "react"
import { CaseBriefShortcut } from "@/components/cases/case-brief-shortcut"

export default async function CaseLayout({ children, params }: { children: ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params
  return <><CaseBriefShortcut caseId={id} />{children}</>
}
