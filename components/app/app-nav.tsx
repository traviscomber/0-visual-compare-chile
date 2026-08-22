"use client"

import Link from "next/link"
import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Logo } from "@/components/brand/logo"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Activity, Bell, BellRing, BriefcaseBusiness, ClipboardCheck, Cpu, History, LayoutDashboard, LogOut, Menu, Search, Settings, Terminal } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, aliases: [] },
  { href: "/casos", label: "Casos", icon: BriefcaseBusiness, aliases: [] },
  { href: "/evaluar", label: "Evaluar", icon: Cpu, aliases: ["/agente", "/compare", "/comparisons"] },
  { href: "/investigar", label: "Investigar", icon: Search, aliases: ["/consulta-inapi", "/consulta", "/patentes"] },
  { href: "/monitorear", label: "Monitorear", icon: BellRing, aliases: ["/patentes/alertas"] },
]

const secondaryNavItems = [
  { href: "/notificaciones", label: "Notificaciones", icon: Bell },
  { href: "/casos/pendientes", label: "Lo que espera de mí", icon: ClipboardCheck },
  { href: "/history", label: "Actividad e historial", icon: History },
  { href: "/dashboard/playground", label: "API e integraciones", icon: Terminal },
  { href: "/dashboard/processing", label: "Operación del sistema", icon: Activity },
]

function matchesPath(pathname: string, href: string) { return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`)) }

export function AppNav({ userEmail, fullName, companyName }: { userEmail: string; fullName: string | null; companyName: string | null }) {
  const pathname = usePathname(); const router = useRouter(); const [mobileOpen,setMobileOpen]=useState(false)
  const isPrimaryActive=(item:(typeof navItems)[number])=>matchesPath(pathname,item.href)||item.aliases.some(alias=>matchesPath(pathname,alias))
  const handleLogout=async()=>{const supabase=createClient();if(!supabase){router.push("/");router.refresh();return}await supabase.auth.signOut();router.push("/");router.refresh()}
  const initials=(fullName??userEmail).split(/\s+/).map(part=>part[0]).filter(Boolean).slice(0,2).join("").toUpperCase()
  return <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
    <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-6"><Link href="/dashboard" aria-label="Visual Compare" className="shrink-0"><Logo/></Link><nav className="hidden items-center gap-1 xl:flex" aria-label="Navegación principal">{navItems.map(item=>{const active=isPrimaryActive(item);const Icon=item.icon;return <Link key={item.href} href={item.href} className={cn("flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",active?"bg-foreground text-background":"text-muted-foreground hover:bg-secondary hover:text-foreground")}><Icon className="h-4 w-4"/>{item.label}</Link>})}</nav></div>
      <div className="flex items-center gap-2"><Button asChild variant="ghost" size="icon" aria-label="Notificaciones"><Link href="/notificaciones"><Bell className="h-5 w-5"/></Link></Button><Button variant="ghost" size="icon" className="xl:hidden" onClick={()=>setMobileOpen(open=>!open)} aria-label="Abrir menú"><Menu className="h-5 w-5"/></Button><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="gap-2 px-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">{initials||"U"}</span><span className="hidden flex-col items-start leading-tight sm:flex"><span className="max-w-40 truncate text-sm text-foreground">{fullName??userEmail}</span>{companyName&&<span className="max-w-40 truncate text-xs text-muted-foreground">{companyName}</span>}</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-72"><DropdownMenuLabel className="font-normal"><div className="flex flex-col"><span className="text-sm font-medium text-foreground">{fullName??"Usuario"}</span><span className="truncate text-xs text-muted-foreground">{userEmail}</span></div></DropdownMenuLabel><DropdownMenuSeparator/><div className="px-1 py-1"><p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Cuenta y operación</p>{secondaryNavItems.map(item=>{const Icon=item.icon;return <DropdownMenuItem key={item.href} asChild><Link href={item.href} className="cursor-pointer"><Icon className="mr-2 h-4 w-4"/>{item.label}</Link></DropdownMenuItem>})}</div><DropdownMenuSeparator/><DropdownMenuItem asChild><Link href="/settings"><Settings className="mr-2 h-4 w-4"/>Configuración</Link></DropdownMenuItem><DropdownMenuItem onClick={handleLogout}><LogOut className="mr-2 h-4 w-4"/>Cerrar sesión</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
    </div>
    {mobileOpen&&<nav className="border-t border-border bg-background xl:hidden" aria-label="Navegación móvil"><div className="mx-auto flex max-w-[1440px] flex-col px-2 py-3"><p className="px-3 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Tu flujo de trabajo</p>{navItems.map(item=>{const active=isPrimaryActive(item);const Icon=item.icon;return <Link key={item.href} href={item.href} onClick={()=>setMobileOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",active?"bg-foreground text-background":"text-muted-foreground hover:bg-secondary hover:text-foreground")}><Icon className="h-4 w-4"/>{item.label}</Link>})}<div className="my-3 border-t border-border"/><p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Cuenta y operación</p>{secondaryNavItems.map(item=>{const active=matchesPath(pathname,item.href);const Icon=item.icon;return <Link key={item.href} href={item.href} onClick={()=>setMobileOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground",active&&"bg-secondary text-foreground")}><Icon className="h-4 w-4"/>{item.label}</Link>})}</div></nav>}
  </header>
}
