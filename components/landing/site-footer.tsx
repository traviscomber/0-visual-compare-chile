import { Logo } from "@/components/brand/logo"
import { BuildStamp } from "@/components/build/build-stamp"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <Logo />
        <div className="flex flex-col gap-2 text-xs text-muted-foreground md:items-end">
          <p>&copy; {new Date().getFullYear()} Visual Compare Chile. Todos los derechos reservados.</p>
          <p className="font-medium">Powered by N3uralia</p>
          <BuildStamp />
        </div>
      </div>
    </footer>
  )
}
