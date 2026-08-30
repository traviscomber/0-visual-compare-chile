import type { ReactNode } from "react"
import { DashboardPresentationBoundary } from "./presentation-boundary"
import "./dashboard-pro.css"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardPresentationBoundary>{children}</DashboardPresentationBoundary>
}
