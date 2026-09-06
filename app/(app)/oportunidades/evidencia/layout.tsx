import type { ReactNode } from "react"
import { ProjectHandoffDecisionBanner } from "@/components/app/project-handoff-decision-banner"

export default function OpportunityEvidenceLayout({ children }: { children: ReactNode }) {
  return <>
    <ProjectHandoffDecisionBanner />
    {children}
  </>
}
