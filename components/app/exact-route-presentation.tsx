"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"

export function ExactRoutePresentation({
  path,
  className,
  children,
}: {
  path: string
  className: string
  children: ReactNode
}) {
  const pathname = usePathname()
  if (pathname !== path) return children
  return <div className={className}>{children}</div>
}
