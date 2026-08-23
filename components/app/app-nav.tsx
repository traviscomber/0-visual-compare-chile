"use client"

import Link from "next/link"
import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
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
import {
  Bell,
  BellRing,
  BriefcaseBusiness,
  ClipboardCheck,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Waypoints,
  X,
} from "lucide-react"
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
  return (
    <span className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0F766E] text-sm font-semibold text-white shadow-sm">N</span>
      <span className="hidden leading-none sm:block">
        <span className="block text-sm font-semibold tracking-[-0.02em] text-slate-950">N3uralia Intelligence</span>
        <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">Visual Compare</span>
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
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1480px] items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/dashboard" aria-label="N3uralia Intelligence"><BrandMark /></Link>
          <nav className="hidden items-center gap-1.5 lg:flex" aria-label="Navegación principal">
            {primaryItems.map(item => {
              const Icon = item.icon
              const active = activePrimary(item)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                    active ? "bg-teal-50 text-[#0F766E]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <Button asChild variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 hover:text-slate-950" aria-label="Notificaciones">
            <Link href="/notificaciones"><Bell className="h-5 w-5" /></Link>
          </Button>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(open => !open)} aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="ml-1 h-11 gap-2.5 rounded-xl px-2 hover:bg-slate-50">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-950 text-xs font-semibold text-white">{initials || "U"}</span>
                <span className="hidden max-w-44 flex-col items-start leading-tight md:flex">
                  <span className="w-full truncate text-sm font-medium text-slate-900">{fullName ?? userEmail}</span>
                  {companyName ? <span className="mt-0.5 w-full truncate text-xs text-slate-500">{companyName}</span> : null}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 rounded-xl border-slate-200 p-1.5 shadow-xl">
              <DropdownMenuLabel className="px-2 py-2 font-normal">
                <span className="block text-sm font-medium text-slate-950">{fullName ?? "Usuario"}</span>
                <span className="mt-0.5 block truncate text-xs text-slate-500">{userEmail}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Área de trabajo</p>
              {workspaceItems.map(item => {
                const Icon = item.icon
                return <DropdownMenuItem key={item.href} asChild><Link href={item.href} className="cursor-pointer rounded-lg"><Icon className="mr-2 h-4 w-4" />{item.label}</Link></DropdownMenuItem>
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link href="/settings" className="rounded-lg"><Settings className="mr-2 h-4 w-4" />Configuración</Link></DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="rounded-lg"><LogOut className="mr-2 h-4 w-4" />Cerrar sesión</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {mobileOpen ? (
        <nav className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden" aria-label="Navegación móvil">
          <div className="mx-auto grid max-w-[1480px] gap-1">
            {primaryItems.map(item => {
              const Icon = item.icon
              const active = activePrimary(item)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium",
                    active ? "bg-teal-50 text-[#0F766E]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
            <div className="my-2 h-px bg-slate-200" />
            {workspaceItems.map(item => {
              const Icon = item.icon
              return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600 hover:bg-slate-50"><Icon className="h-4 w-4" />{item.label}</Link>
            })}
          </div>
        </nav>
      ) : null}
    </header>
  )
}
