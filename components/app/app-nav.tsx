"use client"

import Link from "next/link"
import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bell, BellRing, BriefcaseBusiness, History, LayoutDashboard, LogOut, Menu, Search, Settings, Waypoints, X } from "lucide-react"
import { cn } from "@/lib/utils"

const primaryItems = [
  { href: "/investigar", label: "Investigar", icon: Search, aliases: ["/evaluar", "/agente", "/compare", "/comparisons", "/consulta-inapi", "/consulta", "/patentes"] },
  { href: "/portfolio", label: "Portafolio", icon: Waypoints, aliases: [] },
  { href: "/casos", label: "Casos", icon: BriefcaseBusiness, aliases: [] },
  { href: "/monitorear", label: "Vigilancia", icon: BellRing, aliases: ["/patentes/alertas"] },
]

const workspaceItems = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/history", label: "Actividad", icon: History },
]

function matchesPath(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`))
}

function BrandMark() {
  return (
    <span className="flex items-center gap-3">
      <span className="grid h-8 w-8 place-items-center rounded-[8px] border border-primary/25 bg-primary/[0.06] text-xs font-semibold text-primary">V</span>
      <span className="hidden leading-none sm:block">
        <span className="block text-[13px] font-semibold tracking-[0.14em] text-foreground">VIDENTIA</span>
        <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">by N3uralia</span>
      </span>
    </span>
  )
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
    <header className="sticky top-0 z-40 border-b border-border bg-background/94 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1480px] items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-10">
          <Link href="/dashboard" aria-label="VIDENTIA" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><BrandMark /></Link>
          <nav className="hidden h-[68px] items-stretch gap-7 lg:flex" aria-label="Navegación principal">
            {primaryItems.map(item => {
              const Icon = item.icon
              const active = activePrimary(item)
              return (
                <Link key={item.href} href={item.href} className={cn("relative flex items-center gap-2 text-[13px] font-medium outline-none transition-colors focus-visible:text-foreground", active ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <Icon className={cn("h-3.5 w-3.5", active ? "text-primary" : "text-muted-foreground")} />
                  {item.label}
                  {active ? <span className="absolute inset-x-0 bottom-0 h-px bg-primary" /> : null}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-md text-muted-foreground hover:bg-secondary/40 hover:text-foreground" aria-label="Notificaciones"><Link href="/notificaciones"><Bell className="h-4 w-4" /></Link></Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md text-muted-foreground hover:bg-secondary/40 hover:text-foreground lg:hidden" onClick={() => setMobileOpen(open => !open)} aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}>{mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="ml-1 h-10 gap-2.5 rounded-md px-2 text-foreground hover:bg-secondary/40">
                <span className="grid h-7 w-7 place-items-center rounded-full border border-border bg-card text-[10px] font-semibold text-foreground">{initials || "U"}</span>
                <span className="hidden max-w-40 flex-col items-start leading-tight md:flex">
                  <span className="w-full truncate text-xs font-medium text-foreground">{fullName ?? userEmail}</span>
                  {companyName ? <span className="mt-0.5 w-full truncate text-[10px] text-muted-foreground">{companyName}</span> : null}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 rounded-lg border-border bg-card p-1.5 text-foreground shadow-xl">
              <DropdownMenuLabel className="px-2 py-2 font-normal"><span className="block text-sm font-medium text-foreground">{fullName ?? "Usuario"}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{userEmail}</span></DropdownMenuLabel>
              <DropdownMenuSeparator />
              {workspaceItems.map(item => { const Icon = item.icon; return <DropdownMenuItem key={item.href} asChild><Link href={item.href} className="cursor-pointer rounded-md"><Icon className="mr-2 h-3.5 w-3.5" />{item.label}</Link></DropdownMenuItem> })}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link href="/settings" className="rounded-md"><Settings className="mr-2 h-3.5 w-3.5" />Configuración</Link></DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="rounded-md"><LogOut className="mr-2 h-3.5 w-3.5" />Cerrar sesión</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {mobileOpen ? (
        <nav className="border-t border-border bg-background px-4 py-4 lg:hidden" aria-label="Navegación móvil">
          <div className="mx-auto grid max-w-[1480px] gap-1">
            {primaryItems.map(item => { const Icon = item.icon; const active = activePrimary(item); return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={cn("flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/40", active ? "bg-primary/[0.08] text-primary" : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground")}><Icon className="h-4 w-4" />{item.label}</Link> })}
            <div className="my-2 h-px bg-border" />
            {workspaceItems.map(item => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-muted-foreground hover:bg-secondary/30 hover:text-foreground"><Icon className="h-4 w-4" />{item.label}</Link> })}
            <Link href="/settings" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-muted-foreground hover:bg-secondary/30 hover:text-foreground"><Settings className="h-4 w-4" />Configuración</Link>
          </div>
        </nav>
      ) : null}
    </header>
  )
}
