"use client"

import Link from "next/link"
import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bell, BellRing, BriefcaseBusiness, ClipboardCheck, History, LayoutDashboard, LogOut, Menu, Search, Settings, Waypoints, X } from "lucide-react"
import { cn } from "@/lib/utils"

const primaryItems = [
  { href: "/evaluar", label: "Buscar", icon: Search, aliases: ["/agente", "/compare", "/comparisons", "/investigar", "/consulta-inapi", "/consulta", "/patentes"] },
  { href: "/portfolio", label: "Portafolio", icon: Waypoints, aliases: [] },
  { href: "/casos", label: "Casos", icon: BriefcaseBusiness, aliases: [] },
  { href: "/monitorear", label: "Vigilancia", icon: BellRing, aliases: ["/patentes/alertas"] },
]

const workspaceItems = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/casos/pendientes", label: "Pendientes", icon: ClipboardCheck },
  { href: "/notificaciones", label: "Notificaciones", icon: Bell },
  { href: "/history", label: "Actividad", icon: History },
]

function matchesPath(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`))
}

function BrandMark() {
  return <span className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-[8px] bg-[#111827] text-xs font-semibold text-white">V</span><span className="hidden leading-none sm:block"><span className="block text-[13px] font-semibold tracking-[0.14em] text-[#111827]">VIDENTIA</span><span className="mt-1 block text-[8px] font-medium uppercase tracking-[0.18em] text-[#98A2B3]">by N3uralia</span></span></span>
}

export function AppNav({ userEmail, fullName, companyName }: { userEmail: string; fullName: string | null; companyName: string | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const initials = (fullName ?? userEmail).split(/\s+/).map(part => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
  const activePrimary = (item: (typeof primaryItems)[number]) => matchesPath(pathname, item.href) || item.aliases.some(alias => matchesPath(pathname, alias))

  const handleLogout = async () => {
    const supabase = createClient()
    if (!supabase) { router.push("/"); router.refresh(); return }
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[#F7F8F6]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1480px] items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-10">
          <Link href="/dashboard" aria-label="VIDENTIA"><BrandMark /></Link>
          <nav className="hidden h-[68px] items-stretch gap-7 lg:flex" aria-label="Navegación principal">
            {primaryItems.map(item => {
              const Icon = item.icon
              const active = activePrimary(item)
              return <Link key={item.href} href={item.href} className={cn("relative flex items-center gap-2 text-[13px] font-medium transition-colors", active ? "text-[#111827]" : "text-[#667085] hover:text-[#111827]")}><Icon className={cn("h-3.5 w-3.5", active ? "text-[#0F766E]" : "text-[#98A2B3]")} />{item.label}{active ? <span className="absolute inset-x-0 bottom-0 h-px bg-[#0F766E]" /> : null}</Link>
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-md text-[#667085] hover:bg-black/5 hover:text-[#111827]" aria-label="Notificaciones"><Link href="/notificaciones"><Bell className="h-4 w-4" /></Link></Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md lg:hidden" onClick={() => setMobileOpen(open => !open)} aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}>{mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" className="ml-1 h-10 gap-2.5 rounded-md px-2 hover:bg-black/5"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#111827] text-[10px] font-semibold text-white">{initials || "U"}</span><span className="hidden max-w-40 flex-col items-start leading-tight md:flex"><span className="w-full truncate text-xs font-medium text-[#111827]">{fullName ?? userEmail}</span>{companyName ? <span className="mt-0.5 w-full truncate text-[10px] text-[#98A2B3]">{companyName}</span> : null}</span></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 rounded-lg border-[#DFE3DF] p-1.5 shadow-lg">
              <DropdownMenuLabel className="px-2 py-2 font-normal"><span className="block text-sm font-medium text-[#111827]">{fullName ?? "Usuario"}</span><span className="mt-0.5 block truncate text-xs text-[#667085]">{userEmail}</span></DropdownMenuLabel>
              <DropdownMenuSeparator />
              <p className="px-2 pb-1 pt-2 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-[#98A2B3]">Área de trabajo</p>
              {workspaceItems.map(item => { const Icon = item.icon; return <DropdownMenuItem key={item.href} asChild><Link href={item.href} className="cursor-pointer rounded-md"><Icon className="mr-2 h-3.5 w-3.5" />{item.label}</Link></DropdownMenuItem> })}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link href="/settings" className="rounded-md"><Settings className="mr-2 h-3.5 w-3.5" />Configuración</Link></DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="rounded-md"><LogOut className="mr-2 h-3.5 w-3.5" />Cerrar sesión</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {mobileOpen ? <nav className="border-t border-black/10 bg-[#F7F8F6] px-4 py-4 lg:hidden" aria-label="Navegación móvil"><div className="mx-auto grid max-w-[1480px] gap-1">{primaryItems.map(item => { const Icon = item.icon; const active = activePrimary(item); return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={cn("flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium", active ? "bg-[#E8EFEC] text-[#134E4A]" : "text-[#667085] hover:bg-black/5")}><Icon className="h-4 w-4" />{item.label}</Link> })}<div className="my-2 h-px bg-black/10" />{workspaceItems.map(item => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-[#667085] hover:bg-black/5"><Icon className="h-4 w-4" />{item.label}</Link> })}</div></nav> : null}
    </header>
  )
}
