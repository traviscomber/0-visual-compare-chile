import Link from "next/link"

type PublicSection = "home" | "trademarks" | "patents" | "technologies"
type PublicNavLocale = "en" | "es"

type PublicPlatformNavProps = {
  active?: PublicSection
  locale?: PublicNavLocale
  sticky?: boolean
}

const sectionPaths = {
  en: {
    home: "/",
    trademarks: "/trademarks",
    patents: "/patents",
    technologies: "/technologies",
    pricing: "/en/acceso-empresarial",
    resources: "/en/docs",
    login: "/en/auth/login",
  },
  es: {
    home: "/es",
    trademarks: "/es/marcas",
    patents: "/es/patentes",
    technologies: "/es/tecnologias",
    pricing: "/es/acceso-empresarial",
    resources: "/es/docs",
    login: "/es/auth/login",
  },
} as const

const labels = {
  en: {
    trademarks: "TRADEMARKS",
    patents: "PATENTS",
    technologies: "TECHNOLOGIES",
    pricing: "PRICING",
    resources: "RESOURCES",
    login: "LOG IN",
    start: "START A SEARCH",
    menu: "MENU",
  },
  es: {
    trademarks: "MARCAS",
    patents: "PATENTES",
    technologies: "TECNOLOGÍAS",
    pricing: "PLANES",
    resources: "RECURSOS",
    login: "INGRESAR",
    start: "INICIAR BÚSQUEDA",
    menu: "MENÚ",
  },
} as const

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#091A20]"

function languageSwitch(active: PublicSection, locale: PublicNavLocale) {
  if (locale === "en") {
    if (active === "trademarks") return { href: "/es/marcas", label: "ES" }
    if (active === "patents") return { href: "/es/patentes", label: "ES" }
    if (active === "technologies") return { href: "/es/tecnologias", label: "ES" }
    return { href: "/es", label: "ES" }
  }

  if (active === "trademarks") return { href: "/trademarks", label: "EN" }
  if (active === "patents") return { href: "/patents", label: "EN" }
  if (active === "technologies") return { href: "/technologies", label: "EN" }
  return { href: "/", label: "EN" }
}

function searchHref(active: PublicSection, locale: PublicNavLocale) {
  if (locale === "en") {
    if (active === "trademarks") return "/en/demo"
    if (active === "patents") return "/patents#patent-preview-search"
    if (active === "technologies") return "/en/auth/login?redirectTo=%2Ftechnologies"
    return "/#directions"
  }

  if (active === "trademarks") return "/es/demo"
  if (active === "patents") return "/es/patentes#patent-preview-search"
  if (active === "technologies") return "/es/auth/login?redirectTo=%2Fes%2Ftecnologias"
  return "/es#brands"
}

export function PublicPlatformNav({ active = "home", locale = "en", sticky = true }: PublicPlatformNavProps) {
  const paths = sectionPaths[locale]
  const text = labels[locale]
  const switcher = languageSwitch(active, locale)
  const startHref = searchHref(active, locale)
  const navItems = [
    ["trademarks", text.trademarks, paths.trademarks],
    ["patents", text.patents, paths.patents],
    ["technologies", text.technologies, paths.technologies],
  ] as const

  return (
    <nav className={`${sticky ? "sticky top-0" : "relative"} z-50 border-b border-[#20363E] bg-[#091A20]/95 backdrop-blur`} aria-label={locale === "es" ? "Navegación principal" : "Primary navigation"}>
      <div className="mx-auto flex h-20 max-w-[1480px] items-center justify-between gap-5 px-5 lg:px-10">
        <Link href={paths.home} className={`shrink-0 ${focusRing}`} aria-label={locale === "es" ? "Inicio VIDENTIA" : "VIDENTIA home"}>
          <span className="block text-[15px] tracking-[0.22em] text-[#E7DFCE]">ViDENTiA</span>
          <span className="mt-1 hidden text-[7px] uppercase tracking-[0.16em] text-[#7F918F] sm:block">IP & TECHNOLOGY INTELLIGENCE</span>
        </Link>

        <div className="hidden items-center gap-5 text-[10px] font-medium tracking-[0.07em] text-[#BDBEBD] md:flex">
          {navItems.map(([section, label, href]) => (
            <Link key={section} href={href} aria-current={active === section ? "page" : undefined} className={`${focusRing} ${active === section ? "text-white" : "hover:text-white"}`}>{label}</Link>
          ))}
          <Link href={paths.pricing} className={`hidden hover:text-white xl:inline ${focusRing}`}>{text.pricing}</Link>
          <Link href={paths.resources} className={`hidden hover:text-white xl:inline ${focusRing}`}>{text.resources}</Link>
          <Link href={switcher.href} className={`text-[#96B5A6] ${focusRing}`}>{switcher.label}</Link>
          <Link href={paths.login} className={`hidden hover:text-white lg:inline ${focusRing}`} prefetch={false}>{text.login}</Link>
          <Link href={startHref} className={`bg-[#4A7F74] px-4 py-2.5 text-white ${focusRing}`}>{text.start}</Link>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <Link href={startHref} className={`bg-[#4A7F74] px-3 py-2.5 text-[9px] font-medium tracking-[0.06em] text-white ${focusRing}`}>{text.start}</Link>
          <details className="group relative">
            <summary className={`cursor-pointer list-none border border-[#36515A] px-3 py-2.5 text-[9px] font-medium tracking-[0.1em] text-[#E7DFCE] [&::-webkit-details-marker]:hidden ${focusRing}`}>{text.menu}</summary>
            <div className="absolute right-0 top-[calc(100%+12px)] w-[min(82vw,320px)] border border-[#294047] bg-[#091A20] p-2 shadow-2xl">
              {navItems.map(([section, label, href]) => (
                <Link key={section} href={href} aria-current={active === section ? "page" : undefined} className={`block border-b border-[#20363E] px-4 py-4 text-[11px] tracking-[0.08em] ${focusRing} ${active === section ? "text-white" : "text-[#BDBEBD]"}`}>{label}</Link>
              ))}
              <Link href={paths.pricing} className={`block border-b border-[#20363E] px-4 py-4 text-[11px] tracking-[0.08em] text-[#BDBEBD] ${focusRing}`}>{text.pricing}</Link>
              <Link href={paths.resources} className={`block border-b border-[#20363E] px-4 py-4 text-[11px] tracking-[0.08em] text-[#BDBEBD] ${focusRing}`}>{text.resources}</Link>
              <Link href={paths.login} className={`block border-b border-[#20363E] px-4 py-4 text-[11px] tracking-[0.08em] text-[#BDBEBD] ${focusRing}`} prefetch={false}>{text.login}</Link>
              <Link href={switcher.href} className={`block px-4 py-4 text-[11px] tracking-[0.08em] text-[#96B5A6] ${focusRing}`}>{switcher.label}</Link>
            </div>
          </details>
        </div>
      </div>
    </nav>
  )
}
