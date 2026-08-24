"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, Gauge, ShieldAlert, Waypoints } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  { href: "/portfolio", label: "Portafolio", icon: Waypoints },
  { href: "/portfolio/analytics", label: "Rendimiento", icon: Activity },
  { href: "/portfolio/risk", label: "Riesgo operativo", icon: ShieldAlert },
  { href: "/portfolio/control", label: "Control", icon: Gauge },
] as const

export function PortfolioSubnav() {
  const pathname = usePathname()
  return (
    <div className="border-b border-border">
      <nav className="mx-auto flex w-full max-w-[1480px] gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8" aria-label="Secciones de portafolio">
        {items.map(item => {
          const active = item.href === "/portfolio" ? pathname === item.href : pathname.startsWith(item.href)
          const Icon = item.icon
          return <Link key={item.href} href={item.href} aria-current={active?"page":undefined} className={cn("relative flex h-12 shrink-0 items-center gap-2 px-3 text-xs font-medium outline-none transition-colors focus-visible:text-foreground",active?"text-foreground":"text-muted-foreground hover:text-foreground")}><Icon className={cn("h-3.5 w-3.5",active?"text-primary":"text-muted-foreground")}/>{item.label}{active?<span className="absolute inset-x-3 bottom-0 h-px bg-primary"/>:null}</Link>
        })}
      </nav>
    </div>
  )
}
