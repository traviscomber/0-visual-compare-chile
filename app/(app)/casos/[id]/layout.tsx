import type { ReactNode } from "react"
import { CaseSubnav } from "@/components/cases/case-subnav"

export default async function CaseLayout({ children, params }: { children: ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params
  return <><CaseSubnav caseId={id}/>{children}</>
}
