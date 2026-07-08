'use client'

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Logo } from "@/components/brand/logo"

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  const navLinks = [
    { href: "#modulos", label: "Módulos" },
    { href: "#como-funciona", label: "Cómo funciona" },
    { href: "/casos", label: "Casos" },
    { href: "/seguridad", label: "Seguridad" },
  ]

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" aria-label="Visual Compare Chile" className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 text-sm text-foreground font-medium md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-[--color-brand-teal] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Navigation */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-foreground">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <nav className="flex flex-col gap-4 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-foreground hover:text-[--color-brand-teal] transition-colors font-medium py-2"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-border pt-4 mt-4">
                <Button
                  asChild
                  variant="ghost"
                  className="w-full text-foreground hover:text-[--color-brand-teal] justify-start"
                  onClick={() => setOpen(false)}
                >
                  <Link href="/auth/login">Iniciar sesión</Link>
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Desktop CTA Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="text-foreground hover:text-[--color-brand-teal]">
            <Link href="/auth/login">Iniciar sesión</Link>
          </Button>
          <Button asChild size="sm" className="bg-[--color-brand-teal] hover:bg-[--color-brand-teal-dark] font-semibold">
            <Link href="/auth/sign-up">Crear cuenta</Link>
          </Button>
        </div>

        {/* Mobile CTA - Show only in mobile */}
        <div className="md:hidden">
          <Button asChild size="sm" className="bg-[--color-brand-teal] hover:bg-[--color-brand-teal-dark] font-semibold">
            <Link href="/auth/sign-up">Crear</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
