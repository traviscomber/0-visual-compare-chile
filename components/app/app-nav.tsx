"use client"

import Link from "next/link"
import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  BellRing,
  BriefcaseBusiness,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Waypoints,
  X,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const navigationItems = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard, aliases: [] },
  { href: "/investigar", label: "Investigar", icon: Search, aliases: ["/evaluar", "/agente", "/compare", "/comparisons", "/consulta-inapi", "/consulta", "/patentes"] },
  { href: "/portfolio", label: "Portafolio", icon: Waypoints, aliases: [] },
  { href: "/casos", label: "Casos", icon: BriefcaseBusiness, aliases: [] },
  { href: "/monitorear", label: "Vigilancia", icon: BellRing, aliases: ["/patentes/alertas"] },
  { href: "/notificaciones", label: "Notificaciones", icon: Bell, aliases: [] },
  { href: "/history", label: "Actividad", icon: History, aliases: [] },
] as const

function matchesPath(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`))
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={cn("flex items-center", compact ? "gap-2.5" : "gap-3")}> 
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-[10px] border border-primary/25 bg-primary/[0.07] text-xs font-semibold text-primary shadow-[inset_0_1px_rgba(255,255,255,0.06)]">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,199,184,0.18),transparent_56%)]" />
        <span className="relative">V</span>
      </span>
      <span className={cn("leading-none", compact ? "block" : "hidden lg:block")}>
        <span className="block text-[15px] font-medium tracking-[0.18em] text-foreground">ViDENTiA</span>
        <span className="mt-1.5 block text-[8px] font-medium uppercase tracking-[0.15em] text-muted-foreground">Inteligencia y protección de marcas</span>
      </span>
    </span>
  )
}

function AccountMenu({
  userEmail,
  fullName,
  companyName,
  handleLogout,
  compact = false,
}: {
  userEmail: string
  fullName: string | null
  companyName: string | null
  handleLogout: () => Promise<void>
  compact?: boolean
}) {
  const initials = (fullName ?? userEmail)
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-auto rounded-xl border border-transparent text-foreground hover:border-border hover:bg-secondary/45",
            compact ? "px-2 py-1.5" : "w-full justify-start gap-3 px-2 py-2.5",
          )}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-card text-[10px] font-semibold text-foreground">
            {initials || "U"}
          </span>
          {!compact ? (
            <span className="min-w-0 flex-1 text-left leading-tight">
              <span className="block truncate text-xs font-medium text-foreground">{fullName ?? userEmail}</span>
              <span className="mt-1 block truncate text-[10px] text-muted-foreground">{companyName ?? userEmail}</span>
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-xl border-border bg-card p-1.5 text-foreground shadow-2xl shadow-black/30">
        <DropdownMenuLabel className="px-2 py-2 font-normal">
          <span className="block text-sm font-medium text-foreground">{fullName ?? "Usuario"}</span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{userEmail}</span>
          {companyName ? <span className="mt-1 block truncate text-[11px] text-muted-foreground">{companyName}</span> : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="rounded-lg">
            <Settings className="mr-2 h-3.5 w-3.5" />Configuración
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void handleLogout()} className="rounded-lg">
          <LogOut className="mr-2 h-3.5 w-3.5" />Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppNav({ userEmail, fullName, companyName }: { userEmail: string; fullName: string | null; companyName: string | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (item: (typeof navigationItems)[number]) =>
    matchesPath(pathname, item.href) || item.aliases.some((alias) => matchesPath(pathname, alias))

  const handleLogout = async () => {
    const supabase = createClient()
    if (!supabase) {
      router.push("/")
      router.refresh()
      return
    }
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[244px] border-r border-border bg-[#081219]/96 px-3 py-4 shadow-[24px_0_80px_rgba(0,0,0,0.16)] backdrop-blur-xl lg:flex lg:flex-col">
        <Link href="/dashboard" aria-label="VIDENTIA" className="rounded-xl px-2 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
          <BrandMark compact />
        </Link>

        <div className="mt-7 px-2 text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">Workspace</div>
        <nav className="mt-2 grid gap-1" aria-label="Navegación de VIDENTIA">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40",
                  active
                    ? "bg-primary/[0.13] text-foreground"
                    : "text-muted-foreground hover:bg-secondary/35 hover:text-foreground",
                )}
              >
                {active ? <span className="absolute inset-y-2 left-0 w-px bg-primary" /> : null}
                <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} strokeWidth={1.8} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto border-t border-border pt-3">
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-border/70 bg-card/35 px-3 py-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_16px_rgba(99,199,184,0.72)]" />
            <span className="text-[10px] font-medium text-muted-foreground">Fuentes oficiales · Evidencia trazable</span>
          </div>
          <AccountMenu userEmail={userEmail} fullName={fullName} companyName={companyName} handleLogout={handleLogout} />
        </div>
      </aside>

      <header className="fixed left-[244px] right-0 top-0 z-40 hidden h-[68px] items-center justify-between border-b border-border bg-[#071018]/90 px-7 backdrop-blur-xl lg:flex">
        <div className="flex min-w-0 items-center gap-3 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="truncate">Inteligencia marcaria operativa</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="h-9 rounded-lg border-border bg-card/30 px-3 text-xs hover:bg-card/60">
            <Link href="/investigar"><Search className="mr-2 h-3.5 w-3.5" />Buscar una marca</Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-secondary/45 hover:text-foreground" aria-label="Notificaciones">
            <Link href="/notificaciones"><Bell className="h-4 w-4" /></Link>
          </Button>
          <Button asChild className="h-9 rounded-lg px-3 text-xs">
            <Link href="/investigar">Nueva investigación</Link>
          </Button>
        </div>
      </header>

      <header className="sticky top-0 z-50 flex h-[64px] items-center justify-between border-b border-border bg-[#071018]/95 px-4 backdrop-blur-xl lg:hidden">
        <Link href="/dashboard" aria-label="VIDENTIA" className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><BrandMark compact /></Link>
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-secondary/40 hover:text-foreground" aria-label="Notificaciones"><Link href="/notificaciones"><Bell className="h-4 w-4" /></Link></Button>
          <AccountMenu userEmail={userEmail} fullName={fullName} companyName={companyName} handleLogout={handleLogout} compact />
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-secondary/40 hover:text-foreground" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}>
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {mobileOpen ? (
        <nav className="fixed inset-x-0 top-[64px] z-50 border-b border-border bg-[#081219]/98 px-4 py-4 shadow-2xl backdrop-blur-xl lg:hidden" aria-label="Navegación móvil">
          <div className="grid gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item)
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/40", active ? "bg-primary/[0.13] text-foreground" : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground")}>
                  <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />{item.label}
                </Link>
              )
            })}
            <div className="my-2 h-px bg-border" />
            <Link href="/settings" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground hover:bg-secondary/30 hover:text-foreground"><Settings className="h-4 w-4" />Configuración</Link>
          </div>
        </nav>
      ) : null}
    </>
  )
}
