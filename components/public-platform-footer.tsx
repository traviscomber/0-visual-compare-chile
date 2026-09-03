import Link from "next/link"
import type { PublicLocale } from "@/lib/marketing-locale"

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071119]"

const copy = {
  en: {
    descriptor: "IP & TECHNOLOGY INTELLIGENCE",
    body: "Traceable intelligence for trademarks, patents and emerging technologies. Evidence supports human review; it does not replace legal judgment.",
    intelligence: "INTELLIGENCE",
    platform: "PLATFORM",
    legal: "LEGAL",
    trademarks: "TRADEMARKS",
    patents: "PATENTS",
    technologies: "TECHNOLOGIES",
    resources: "RESOURCES",
    access: "REQUEST ACCESS",
    login: "LOG IN",
    contact: "CONTACT",
    privacy: "PRIVACY",
    terms: "TERMS",
    evidence: "TRACEABLE EVIDENCE",
    review: "HUMAN REVIEW",
    powered: "POWERED BY N3URALIA",
  },
  es: {
    descriptor: "INTELIGENCIA DE PI & TECNOLOGÍA",
    body: "Inteligencia trazable para marcas, patentes y tecnologías emergentes. La evidencia apoya la revisión humana; no reemplaza el criterio jurídico.",
    intelligence: "INTELIGENCIA",
    platform: "PLATAFORMA",
    legal: "LEGAL",
    trademarks: "MARCAS",
    patents: "PATENTES",
    technologies: "TECNOLOGÍAS",
    resources: "RECURSOS",
    access: "SOLICITAR ACCESO",
    login: "INGRESAR",
    contact: "CONTACTO",
    privacy: "PRIVACIDAD",
    terms: "TÉRMINOS",
    evidence: "EVIDENCIA TRAZABLE",
    review: "REVISIÓN HUMANA",
    powered: "POWERED BY N3URALIA",
  },
} as const

export function PublicPlatformFooter({ locale = "en" }: { locale?: PublicLocale }) {
  const t = copy[locale]
  const paths = locale === "es"
    ? { home: "/es", trademarks: "/es/marcas", patents: "/es/patentes", technologies: "/es/tecnologias", resources: "/es/docs", access: "/es/acceso-empresarial", login: "/es/auth/login", contact: "/es/contacto", privacy: "/es/privacidad", terms: "/es/terminos" }
    : { home: "/", trademarks: "/trademarks", patents: "/patents", technologies: "/technologies", resources: "/en/docs", access: "/en/acceso-empresarial", login: "/en/auth/login", contact: "/en/contacto", privacy: "/en/privacidad", terms: "/en/terminos" }

  return (
    <footer className="public-platform-footer relative overflow-hidden border-t border-[#294047] bg-[#071119] px-5 pb-8 pt-14 text-[#E7DFCE] sm:px-7 lg:px-10 lg:pb-10 lg:pt-20">
      <style>{`
        body:has(.public-platform-footer) footer:not(.public-platform-footer){display:none!important}
        .public-platform-footer::before{content:"";position:absolute;left:-18%;right:-18%;top:0;height:1px;background:linear-gradient(90deg,transparent,#456E8E 20%,#96B5A6 50%,#4A7F74 72%,transparent);opacity:.72;animation:vpf-signal 9s linear infinite}
        .vpf-orbit{position:absolute;right:-140px;top:-190px;width:520px;height:520px;border:1px solid rgba(150,181,166,.08);border-radius:999px;pointer-events:none}
        .vpf-orbit::before,.vpf-orbit::after{content:"";position:absolute;border:1px solid rgba(69,110,142,.08);border-radius:999px;inset:58px}
        .vpf-orbit::after{inset:126px;border-color:rgba(74,127,116,.1)}
        .vpf-link{position:relative;transition:color 280ms ease,transform 380ms cubic-bezier(.16,1,.3,1)}
        .vpf-link::after{content:"";position:absolute;left:0;bottom:-5px;width:0;height:1px;background:#96B5A6;transition:width 420ms cubic-bezier(.16,1,.3,1)}
        .vpf-link:hover{color:#fff;transform:translateX(4px)}
        .vpf-link:hover::after{width:100%}
        .vpf-beacon{animation:vpf-breathe 3.8s ease-in-out infinite}
        @keyframes vpf-signal{from{transform:translateX(-16%)}to{transform:translateX(16%)}}
        @keyframes vpf-breathe{0%,100%{opacity:.38;transform:scale(.82)}50%{opacity:1;transform:scale(1.08)}}
        @media(prefers-reduced-motion:reduce){.public-platform-footer::before,.vpf-beacon{animation:none!important}.vpf-link{transition:none!important}}
      `}</style>
      <div className="vpf-orbit" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1480px]">
        <div className="grid gap-14 border-b border-[#294047] pb-14 lg:grid-cols-[1.45fr_0.7fr_0.7fr_0.7fr] lg:gap-16 lg:pb-16">
          <div className="max-w-xl">
            <Link href={paths.home} className={`inline-flex items-center gap-4 ${focusRing}`} aria-label="VIDENTIA home">
              <span className="relative block h-10 w-9 shrink-0" aria-hidden="true">
                <span className="absolute left-0 top-1 h-6 w-6 bg-[#315D58] [clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)]" />
                <span className="absolute bottom-0 left-[15px] h-8 w-[8px] skew-y-[-30deg] bg-[#E7DFCE]" />
              </span>
              <span>
                <strong className="block text-[17px] font-medium tracking-[0.24em] text-[#F1EEE7]">VIDENTIA</strong>
                <span className="mt-1 block text-[8px] tracking-[0.15em] text-[#729A90]">{t.descriptor}</span>
              </span>
            </Link>
            <p className="mt-7 max-w-lg text-[13px] leading-7 text-[#8E9B99]">{t.body}</p>
            <div className="mt-8 flex items-center gap-3 text-[9px] font-medium tracking-[0.16em] text-[#96B5A6]">
              <span className="vpf-beacon h-1.5 w-1.5 rounded-full bg-[#96B5A6]" aria-hidden="true" />
              {t.powered}
            </div>
          </div>

          <FooterColumn title={t.intelligence} links={[[t.trademarks, paths.trademarks], [t.patents, paths.patents], [t.technologies, paths.technologies]]} />
          <FooterColumn title={t.platform} links={[[t.resources, paths.resources], [t.access, paths.access], [t.login, paths.login]]} />
          <FooterColumn title={t.legal} links={[[t.contact, paths.contact], [t.privacy, paths.privacy], [t.terms, paths.terms]]} />
        </div>

        <div className="flex flex-col gap-5 pt-7 text-[9px] tracking-[0.13em] text-[#536563] sm:flex-row sm:items-center sm:justify-between">
          <span>© VIDENTIA · N3URALIA</span>
          <span className="flex flex-wrap items-center gap-3 sm:justify-end"><span>{t.evidence}</span><span className="h-px w-5 bg-[#36515A]" aria-hidden="true" /><span>{t.review}</span></span>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }: { title: string; links: readonly (readonly [string, string])[] }) {
  return (
    <div>
      <p className="text-[9px] font-medium tracking-[0.17em] text-[#729A90]">{title}</p>
      <nav className="mt-6 flex flex-col items-start gap-4" aria-label={`${title} links`}>
        {links.map(([label, href]) => <Link key={href} href={href} prefetch={href.includes("/auth/") ? false : undefined} className={`vpf-link text-[10px] font-medium tracking-[0.1em] text-[#AEB7B5] ${focusRing}`}>{label}</Link>)}
      </nav>
    </div>
  )
}
