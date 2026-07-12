'use client'

import Link from "next/link"
import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Logo } from "@/components/brand/logo"

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  const navLinks = [
    { href: "#modulos", label: "Modulos" },
    { href: "#como-funciona", label: "Como funciona" },
    { href: "/casos", label: "Casos" },
    { href: "/seguridad", label: "Seguridad" },
  ]

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" aria-label="Visual Compare Chile" className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-foreground md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-[--color-brand-teal]">
              {link.label}
            </Link>
          ))}
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-foreground">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <nav className="mt-8 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="py-2 font-medium text-foreground transition-colors hover:text-[--color-brand-teal]"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-4 border-t border-border pt-4">
                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-start text-foreground hover:text-[--color-brand-teal]"
                  onClick={() => setOpen(false)}
                >
                  <Link href="/auth/login">Iniciar sesion</Link>
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm" className="text-foreground hover:text-[--color-brand-teal]">
            <Link href="/auth/login">Iniciar sesion</Link>
          </Button>
          <Button asChild size="sm" className="bg-[--color-brand-teal] font-semibold hover:bg-[--color-brand-teal-dark]">
            <Link href="/auth/sign-up">Crear cuenta</Link>
          </Button>
        </div>

        <div className="md:hidden">
          <Button asChild size="sm" className="bg-[--color-brand-teal] font-semibold hover:bg-[--color-brand-teal-dark]">
            <Link href="/auth/sign-up">Crear</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
