import Link from "next/link"

type PublicSection = "home" | "trademarks" | "patents" | "technologies" | "resources"
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
    resources: "RESOURCES",
    login: "LOG IN",
    access: "REQUEST ACCESS",
    menu: "MENU",
    skip: "SKIP TO CONTENT",
  },
  es: {
    trademarks: "MARCAS",
    patents: "PATENTES",
    technologies: "TECNOLOGÍAS",
    resources: "RECURSOS",
    login: "INGRESAR",
    access: "SOLICITAR ACCESO",
    menu: "MENÚ",
    skip: "SALTAR AL CONTENIDO",
  },
} as const

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#091A20]"

function languageSwitch(active: PublicSection, locale: PublicNavLocale) {
  if (locale === "en") {
    if (active === "trademarks") return { href: "/es/marcas", label: "ES" }
    if (active === "patents") return { href: "/es/patentes", label: "ES" }
    if (active === "technologies") return { href: "/es/tecnologias", label: "ES" }
    if (active === "resources") return { href: "/es/docs", label: "ES" }
    return { href: "/es", label: "ES" }
  }

  if (active === "trademarks") return { href: "/trademarks", label: "EN" }
  if (active === "patents") return { href: "/patents", label: "EN" }
  if (active === "technologies") return { href: "/technologies", label: "EN" }
  if (active === "resources") return { href: "/en/docs", label: "EN" }
  return { href: "/", label: "EN" }
}

function BrandMark() {
  return (
    <span className="flex items-center gap-3.5">
      <span className="relative block h-9 w-8 shrink-0" aria-hidden="true">
        <span className="absolute left-0 top-1 h-5 w-5 bg-[#315D58] [clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)]" />
        <span className="absolute bottom-0 left-[13px] h-7 w-[7px] skew-y-[-30deg] bg-[#E7DFCE]" />
      </span>
      <span className="block text-[16px] font-medium tracking-[0.24em] text-[#F1EEE7] sm:text-[17px]">VIDENTIA</span>
    </span>
  )
}

export function PublicPlatformNav({ active = "home", locale = "en", sticky = true }: PublicPlatformNavProps) {
  const paths = sectionPaths[locale]
  const text = labels[locale]
  const switcher = languageSwitch(active, locale)
  const primary = [
    ["trademarks", text.trademarks, paths.trademarks],
    ["patents", text.patents, paths.patents],
    ["technologies", text.technologies, paths.technologies],
    ["resources", text.resources, paths.resources],
  ] as const

  return (
    <>
      <a href="#main-content" className={`fixed left-3 top-3 z-[80] -translate-y-24 bg-[#E7DFCE] px-4 py-3 text-[10px] font-medium tracking-[0.08em] text-[#091A20] transition-transform focus:translate-y-0 ${focusRing}`}>
        {text.skip}
      </a>

      <nav className={`${sticky ? "sticky top-0" : "relative"} z-50 border-b border-white/10 bg-[#071119]/96 backdrop-blur-md`} aria-label={locale === "es" ? "Navegación principal" : "Primary navigation"}>
        <div className="mx-auto flex h-[72px] max-w-[1480px] items-center justify-between gap-6 px-5 sm:px-7 lg:px-10">
          <Link href={paths.home} className={`shrink-0 ${focusRing}`} aria-label={locale === "es" ? "Inicio VIDENTIA" : "VIDENTIA home"}>
            <BrandMark />
          </Link>

          <div className="hidden items-center gap-7 lg:flex xl:gap-9">
            {primary.map(([section, label, href]) => (
              <Link
                key={section}
                href={href}
                aria-current={active === section ? "page" : undefined}
                className={`relative py-2 text-[10px] font-medium tracking-[0.1em] transition-colors ${focusRing} ${active === section ? "text-[#F2F0EA] after:absolute after:inset-x-0 after:-bottom-[19px] after:h-px after:bg-[#96B5A6]" : "text-[#AEB7B5] hover:text-white"}`}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-5 md:flex">
            <Link href={switcher.href} className={`text-[10px] font-medium tracking-[0.11em] text-[#96B5A6] ${focusRing}`}>{switcher.label}</Link>
            <Link href={paths.login} className={`hidden text-[10px] font-medium tracking-[0.1em] text-[#C7CCCA] hover:text-white xl:inline ${focusRing}`} prefetch={false}>{text.login}</Link>
            <Link href={paths.pricing} className={`inline-flex min-h-10 items-center border border-[#4A7F74] px-4 text-[10px] font-medium tracking-[0.09em] text-[#CDE4DE] transition-colors hover:border-[#96B5A6] hover:bg-[#0D2028] ${focusRing}`}>{text.access}</Link>
          </div>

          <details className="group relative md:hidden">
            <summary className={`cursor-pointer list-none border border-[#36515A] px-3.5 py-2.5 text-[9px] font-medium tracking-[0.12em] text-[#E7DFCE] [&::-webkit-details-marker]:hidden ${focusRing}`}>{text.menu}</summary>
            <div className="absolute right-0 top-[calc(100%+12px)] w-[min(84vw,320px)] border border-[#294047] bg-[#071119] p-2 shadow-2xl">
              {primary.map(([section, label, href]) => (
                <Link key={section} href={href} aria-current={active === section ? "page" : undefined} className={`block border-b border-white/10 px-4 py-4 text-[11px] tracking-[0.08em] ${focusRing} ${active === section ? "text-white" : "text-[#BDBEBD]"}`}>{label}</Link>
              ))}
              <Link href={paths.login} className={`block border-b border-white/10 px-4 py-4 text-[11px] tracking-[0.08em] text-[#BDBEBD] ${focusRing}`} prefetch={false}>{text.login}</Link>
              <Link href={paths.pricing} className={`block border-b border-white/10 px-4 py-4 text-[11px] tracking-[0.08em] text-[#96B5A6] ${focusRing}`}>{text.access}</Link>
              <Link href={switcher.href} className={`block px-4 py-4 text-[11px] tracking-[0.08em] text-[#96B5A6] ${focusRing}`}>{switcher.label}</Link>
            </div>
          </details>
        </div>
      </nav>
    </>
  )
}
