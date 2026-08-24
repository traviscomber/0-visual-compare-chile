"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, Gauge, MessageSquareText, Scale, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  { segment: "", label: "Caso", icon: Scale },
  { segment: "revision", label: "Revisión", icon: ShieldCheck },
  { segment: "equipo", label: "Equipo", icon: MessageSquareText },
  { segment: "brief", label: "Brief", icon: FileText },
  { segment: "control", label: "Control", icon: Gauge },
] as const

export function CaseSubnav({ caseId }: { caseId: string }) {
  const pathname = usePathname()
  const base = `/casos/${caseId}`

  return (
    <div className="border-b border-border print:hidden">
      <nav className="mx-auto flex w-full max-w-[1480px] gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8" aria-label="Secciones del caso">
        {items.map(item => {
          const href = item.segment ? `${base}/${item.segment}` : base
          const active = item.segment ? pathname.startsWith(href) : pathname === base
          const Icon = item.icon
          return (
            <Link
              key={item.segment || "case"}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-12 shrink-0 items-center gap-2 px-3 text-xs font-medium outline-none transition-colors focus-visible:text-foreground",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", active ? "text-primary" : "text-muted-foreground")} />
              {item.label}
              {active ? <span className="absolute inset-x-3 bottom-0 h-px bg-primary" /> : null}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
