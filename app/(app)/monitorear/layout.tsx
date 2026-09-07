"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const ITEMS = [
  { href: "/monitorear", label: "Tareas", exact: true },
  { href: "/monitorear/atencion", label: "Atención" },
  { href: "/monitorear/situaciones", label: "Situaciones" },
  { href: "/monitorear/estrategico", label: "Estratégico" },
  { href: "/monitorear/hipotesis", label: "Hipótesis" },
] as const

export default function MonitoringLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return <>
    <nav aria-label="Navegación de monitoreo" className="border-b border-border/70 bg-[#0D242C] px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1480px] gap-5 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ITEMS.map(item => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
          return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`relative shrink-0 py-1 text-[11px] font-medium tracking-[0.02em] transition-colors ${active ? "text-[#E7DFCE]" : "text-[#879391] hover:text-white"}`}>
            {item.label}
            {active ? <span aria-hidden="true" className="absolute inset-x-0 -bottom-3 h-px bg-[#96B5A6]"/> : null}
          </Link>
        })}
      </div>
    </nav>
    {children}
  </>
}
