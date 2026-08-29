"use client"

import type { CSSProperties, ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  BellRing,
  BriefcaseBusiness,
  CircleDot,
  History,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Waypoints,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const navigationItems = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard, aliases: [] },
  {
    href: "/investigar",
    label: "Investigar",
    icon: Search,
    aliases: ["/evaluar", "/agente", "/compare", "/comparisons", "/consulta-inapi", "/consulta", "/patentes"],
  },
  { href: "/portfolio", label: "Portafolio", icon: Waypoints, aliases: [] },
  { href: "/casos", label: "Casos", icon: BriefcaseBusiness, aliases: [] },
  { href: "/monitorear", label: "Vigilancia", icon: BellRing, aliases: ["/patentes/alertas"] },
  { href: "/notificaciones", label: "Notificaciones", icon: Bell, aliases: [] },
  { href: "/history", label: "Actividad", icon: History, aliases: [] },
] as const

const shellTokens = {
  "--sidebar-width": "15.25rem",
  "--sidebar-width-icon": "3.5rem",
  "--background": "#0F2A33",
  "--foreground": "#E7DFCE",
  "--card": "#13272D",
  "--card-foreground": "#FFFFFF",
  "--popover": "#13272D",
  "--popover-foreground": "#FFFFFF",
  "--primary": "#4A7F74",
  "--primary-foreground": "#FFFFFF",
  "--secondary": "#172F34",
  "--secondary-foreground": "#FFFFFF",
  "--muted": "#172F34",
  "--muted-foreground": "#BDBEBD",
  "--accent": "#20393A",
  "--accent-foreground": "#FFFFFF",
  "--destructive": "#C46A61",
  "--destructive-foreground": "#FFFFFF",
  "--border": "#294047",
  "--input": "#294047",
  "--ring": "#96B5A6",
  "--chart-1": "#4A7F74",
  "--chart-2": "#96B5A6",
  "--chart-3": "#456E8E",
  "--chart-4": "#B7D3D1",
  "--chart-5": "#BDBEBD",
  "--sidebar": "#091A20",
  "--sidebar-foreground": "#E7DFCE",
  "--sidebar-primary": "#4A7F74",
  "--sidebar-primary-foreground": "#FFFFFF",
  "--sidebar-accent": "#172F34",
  "--sidebar-accent-foreground": "#FFFFFF",
  "--sidebar-border": "#233941",
  "--sidebar-ring": "#96B5A6",
} as CSSProperties

function matchesPath(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`))
}

function BrandMark() {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-sidebar-border bg-sidebar-accent text-xs font-semibold text-sidebar-primary">
        V
      </span>
      <span className="min-w-0 leading-none group-data-[collapsible=icon]:hidden">
        <span className="block truncate text-[15px] font-medium tracking-[0.18em] text-sidebar-foreground">ViDENTiA</span>
        <span className="mt-1.5 block truncate text-[8px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Inteligencia y protección de marcas
        </span>
      </span>
    </span>
  )
}

function NavigationMenu() {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
        Workspace
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {navigationItems.map((item) => {
            const Icon = item.icon
            const active = matchesPath(pathname, item.href) || item.aliases.some((alias) => matchesPath(pathname, alias))
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.label}
                  className="h-10 rounded-[10px] px-3 text-[13px] font-medium data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                >
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => {
                      if (isMobile) setOpenMobile(false)
                    }}
                  >
                    <Icon strokeWidth={1.7} />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function AccountMenu({
  userEmail,
  fullName,
  companyName,
}: {
  userEmail: string
  fullName: string | null
  companyName: string | null
}) {
  const router = useRouter()
  const initials = (fullName ?? userEmail)
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size="lg" className="rounded-[10px] data-[state=open]:bg-sidebar-accent">
          <Avatar className="size-8 rounded-full border border-sidebar-border">
            <AvatarFallback className="bg-sidebar-accent text-[10px] font-semibold text-sidebar-foreground">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
            <span className="block truncate text-xs font-medium text-sidebar-foreground">{fullName ?? userEmail}</span>
            <span className="mt-1 block truncate text-[10px] text-muted-foreground">{companyName ?? userEmail}</span>
          </span>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" className="w-72">
        <DropdownMenuLabel className="font-normal">
          <span className="block text-sm font-medium text-popover-foreground">{fullName ?? "Usuario"}</span>
          <span className="mt-1 block truncate text-xs text-muted-foreground">{userEmail}</span>
          {companyName ? <span className="mt-1 block truncate text-xs text-muted-foreground">{companyName}</span> : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings />
              Configuración
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void handleLogout()}>
            <LogOut />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppNav({
  userEmail,
  fullName,
  companyName,
  children,
}: {
  userEmail: string
  fullName: string | null
  companyName: string | null
  children: ReactNode
}) {
  return (
    <SidebarProvider className="dark min-h-svh overflow-x-hidden bg-background text-foreground" style={shellTokens}>
      <Sidebar collapsible="icon" className="border-sidebar-border">
        <SidebarHeader className="px-3 pb-2 pt-4">
          <Link href="/dashboard" aria-label="VIDENTIA, resumen" className="rounded-[10px] px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
            <BrandMark />
          </Link>
        </SidebarHeader>

        <SidebarSeparator />
        <SidebarContent className="py-2">
          <NavigationMenu />
        </SidebarContent>

        <SidebarFooter className="gap-2 px-3 pb-4">
          <div className="flex items-start gap-2 border-y border-sidebar-border py-3 text-[10px] leading-4 text-muted-foreground group-data-[collapsible=icon]:hidden">
            <CircleDot className="mt-0.5 size-3.5 shrink-0 text-sidebar-primary" strokeWidth={1.7} aria-hidden="true" />
            <span>Fuentes oficiales · evidencia trazable</span>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <AccountMenu userEmail={userEmail} fullName={fullName} companyName={companyName} />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0 bg-background text-foreground">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className="size-9 rounded-[9px] border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground" />
            <Link href="/dashboard" className="truncate text-[13px] font-medium tracking-[0.12em] text-foreground md:hidden">
              ViDENTiA
            </Link>
            <span className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
              <CircleDot className="size-3.5 text-primary" strokeWidth={1.7} aria-hidden="true" />
              Inteligencia marcaria operativa
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href="/investigar">
                <Search data-icon="inline-start" />
                Buscar una marca
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" aria-label="Notificaciones">
              <Link href="/notificaciones">
                <Bell />
              </Link>
            </Button>
            <Button asChild size="sm" className="hidden lg:inline-flex">
              <Link href="/investigar">Nueva investigación</Link>
            </Button>
          </div>
        </header>

        <div className="min-h-[calc(100svh-4rem)] min-w-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
