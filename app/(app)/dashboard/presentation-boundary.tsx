"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"

export function DashboardPresentationBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (pathname !== "/dashboard") return children
  return <div className="dashboard-command-center">{children}</div>
}
