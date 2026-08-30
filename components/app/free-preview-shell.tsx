"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ArrowRight, LogOut, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

const ALLOWED_FREE_PATHS = ["/investigar"] as const

function isAllowedPath(pathname: string) {
  return ALLOWED_FREE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export function FreePreviewShell({ userEmail, children }: { userEmail: string; children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const allowed = isAllowedPath(pathname)

  const handleLogout = async () => {
    const supabase = createClient()
    if (supabase) await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <div className="dark min-h-svh bg-[#0F2A33] text-foreground">
      <header className="sticky top-0 z-30 border-b border-[#263D44] bg-[#091A20]">
        <div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/investigar" className="min-w-0">
            <span className="block text-[15px] font-normal tracking-[0.22em] text-[#E7DFCE]">ViDENTiA</span>
            <span className="mt-1 hidden text-[7px] font-medium uppercase tracking-[0.16em] text-[#8F9998] sm:block">Vista preliminar</span>
          </Link>

          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="h-9 text-[#D8DDDB] hover:bg-[#13272D] hover:text-white">
              <Link href="/investigar"><Search className="mr-2 h-4 w-4" />Investigar</Link>
            </Button>
            <Button asChild size="sm" className="h-9 bg-[#4A7F74] text-white hover:bg-[#568D81]">
              <Link href="/acceso-empresarial">Acceso empresarial <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button type="button" variant="ghost" size="icon" aria-label={`Cerrar sesión de ${userEmail}`} onClick={() => void handleLogout()} className="size-9 text-[#AAB3B1] hover:bg-[#13272D] hover:text-white">
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </header>

      {allowed ? (
        <div className="min-h-[calc(100svh-4rem)]">{children}</div>
      ) : (
        <main className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-[1480px] items-center px-5 py-16 lg:px-10">
          <div className="max-w-2xl border-y border-[#263D44] py-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#96B5A6]">Acceso empresarial</p>
            <h1 className="mt-4 text-4xl font-light tracking-[-0.04em] text-[#E7DFCE]">Esta función forma parte del workspace profesional.</h1>
            <p className="mt-5 text-sm leading-7 text-[#BDBEBD]">
              El acceso preliminar sólo incluye vistas de búsqueda. Evaluación, configuración, casos, expedientes, vigilancia, reportes y colaboración requieren acceso empresarial.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild><Link href="/acceso-empresarial">Solicitar acceso empresarial</Link></Button>
              <Button asChild variant="secondary"><Link href="/investigar">Volver a investigar</Link></Button>
            </div>
          </div>
        </main>
      )}
    </div>
  )
}
