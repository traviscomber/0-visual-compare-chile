import type { ReactNode } from "react"
import { PortfolioSubnav } from "@/components/app/portfolio-subnav"

export default function PortfolioLayout({ children }: { children: ReactNode }) {
  return <><PortfolioSubnav />{children}</>
}
