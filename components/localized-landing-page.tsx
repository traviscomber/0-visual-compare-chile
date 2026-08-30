import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  BellRing,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ChevronDown,
  CircleDot,
  Database,
  FileSearch,
  FileText,
  Radar,
  Scale,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react"
import { HomeMotion } from "@/components/home-motion"
import { landingCopy, localePath, type PublicLocale } from "@/lib/marketing-locale"

const trustIcons = [ShieldCheck, Database, CircleDot, BellRing] as const
const flowIcons = [Search, Database, CircleDot, ShieldCheck] as const
const capabilityIcons = [Search, Radar, BriefcaseBusiness, FileText] as const
const audienceIcons = [Users, Scale, Building2, FileSearch, BriefcaseBusiness] as const
const protectionIcons = [BriefcaseBusiness, Radar, CalendarClock] as const

export function LocalizedLandingPage({ locale }: { locale: PublicLocale }) {
  const copy = landingCopy[locale]
  const otherLocale = copy.language.switchLocale
  const localized = (path: string) => localePath(locale, path)

  return (
    <main className="px-home">
      <HomeMotion />

      <nav className="px-nav" aria-label={copy.navAria}>
        <div className="px-shell px-nav-inner">
          <Link href={localized("/")} className="px-brand" aria-label={copy.brandAria}>
            <span className="px-brand-word">ViDENTiA</span>
            <small>{copy.brandTagline}</small>
          </Link>

          <div className="px-nav-links">
            <Link href={localized("/demo")}>{copy.nav.search}</Link>
            <Link href="#proceso">{copy.nav.register}</Link>
            <Link href="#proteccion">{copy.nav.watch}</Link>
            <Link href="#capacidades">{copy.nav.manage}</Link>
            <Link href={localized("/acceso-empresarial")}>{copy.nav.pricing}</Link>
            <Link href={localized("/docs")} className="px-nav-resources">
              {copy.nav.resources} <ChevronDown aria-hidden="true" size={12} strokeWidth={1.5} />
            </Link>
            <Link href={localePath(otherLocale, "/")} className="px-nav-login" aria-label={copy.language.switchLabel}>
              {copy.language.current}
            </Link>
            <Link href={localized("/auth/login")} className="px-nav-login" prefetch={false}>{copy.nav.login}</Link>
            <Link href={localized("/demo")} className="px-btn px-nav-cta">{copy.nav.cta}</Link>
          </div>
        </div>
      </nav>

      <section className="px-hero">
        <div className="px-hero-atmosphere" aria-hidden="true">
          <span className="px-orbit px-orbit-a" />
          <span className="px-orbit px-orbit-b" />
          <span className="px-geometry px-geometry-a" />
          <span className="px-geometry px-geometry-b" />
        </div>

        <div className="px-shell px-hero-grid">
          <div className="px-hero-copy" data-px-reveal>
            <p className="px-kicker">{copy.hero.kicker}</p>
            <h1>
              {copy.hero.line1}<br />
              {copy.hero.line2}<br />
              <span>{copy.hero.line3}</span>
            </h1>
            <p className="px-lead">{copy.hero.lead}</p>

            <form action={localized("/demo")} method="get" className="px-search" role="search">
              <Search aria-hidden="true" size={21} strokeWidth={1.6} />
              <label htmlFor={`hero-marca-${locale}`} className="sr-only">{copy.hero.searchLabel}</label>
              <input id={`hero-marca-${locale}`} name="marca" type="search" placeholder={copy.hero.searchPlaceholder} autoComplete="off" />
              <button type="submit">{copy.hero.searchButton} <ArrowRight aria-hidden="true" size={17} /></button>
            </form>
          </div>

          <div className="px-hero-visual" data-px-reveal>
            <div className="px-hero-light px-hero-light-green" aria-hidden="true" />
            <div className="px-hero-light px-hero-light-blue" aria-hidden="true" />
            <div className="px-hero-art">
              <Image
                src="/images/videntia-hero-comparison-hd.webp"
                alt={copy.hero.imageAlt}
                fill
                priority
                sizes="(max-width: 1120px) 100vw, 56vw"
                className="px-hero-image"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-trust" aria-label={locale === "es" ? "Principios de producto" : "Product principles"}>
        <div className="px-shell px-trust-grid">
          {copy.trust.map(([title, description], index) => {
            const Icon = trustIcons[index]
            return (
              <article key={title} data-px-reveal>
                <div className="px-icon-beacon" aria-hidden="true"><Icon size={31} strokeWidth={1.25} /></div>
                <div><h2>{title}</h2><p>{description}</p></div>
              </article>
            )
          })}
        </div>
      </section>

      <section id="proceso" className="px-section px-process">
        <div className="px-section-glow px-section-glow-left" aria-hidden="true" />
        <div className="px-shell px-process-layout">
          <div className="px-section-heading px-section-heading-compact" data-px-reveal>
            <p className="px-eyebrow">{copy.process.eyebrow}</p>
            <h2>{copy.process.title1}<br /><span>{copy.process.title2}</span></h2>
            <p>{copy.process.body}</p>
          </div>
          <div className="px-flow" data-px-reveal>
            {copy.process.steps.map(([title, description], index) => {
              const Icon = flowIcons[index]
              const number = String(index + 1).padStart(2, "0")
              return (
                <article key={number}>
                  <div className="px-step-symbol" aria-hidden="true"><Icon size={34} strokeWidth={1.2} /></div>
                  <span className="px-step-number">{number}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="capacidades" className="px-section px-capabilities">
        <div className="px-bauhaus-field" aria-hidden="true">
          <span className="px-bauhaus-ring" /><span className="px-bauhaus-square" /><span className="px-bauhaus-arc" /><span className="px-bauhaus-dots" />
        </div>
        <div className="px-shell">
          <div className="px-section-heading" data-px-reveal>
            <p className="px-eyebrow">{copy.capabilities.eyebrow}</p>
            <h2>{copy.capabilities.title1}<br />{copy.capabilities.title2}</h2>
          </div>
          <div className="px-capability-layout">
            <div className="px-capability-grid">
              {copy.capabilities.items.map(([title, description], index) => {
                const Icon = capabilityIcons[index]
                return (
                  <article key={title} data-px-reveal>
                    <div className="px-capability-icon" aria-hidden="true"><Icon size={30} strokeWidth={1.25} /></div>
                    <div><h3>{title}</h3><p>{description}</p></div>
                  </article>
                )
              })}
            </div>
            <div className="px-capability-cta" data-px-reveal>
              <p>{copy.capabilities.ctaBody}</p>
              <Link href={localized("/acceso-empresarial")} className="px-btn px-btn-line">{copy.capabilities.cta} <ArrowRight aria-hidden="true" size={16} /></Link>
            </div>
          </div>
        </div>
      </section>

      <section id="audiencias" className="px-section px-audience">
        <div className="px-shell px-audience-grid">
          <div className="px-section-heading" data-px-reveal>
            <p className="px-eyebrow">{copy.audience.eyebrow}</p>
            <h2>{copy.audience.title1}<br /><span>{copy.audience.title2}</span></h2>
            <p>{copy.audience.body}</p>
          </div>
          <div className="px-audience-stage" data-px-reveal>
            <div className="px-audience-list">
              {copy.audience.items.map((title, index) => {
                const Icon = audienceIcons[index]
                return <article key={title}><Icon aria-hidden="true" size={28} strokeWidth={1.2} /><span>{title}</span></article>
              })}
            </div>
            <div className="px-audience-art" aria-hidden="true">
              <span className="px-audience-arc px-audience-arc-a" /><span className="px-audience-arc px-audience-arc-b" /><span className="px-audience-dot-grid" />
            </div>
          </div>
        </div>
      </section>

      <section id="proteccion" className="px-section px-platform">
        <div className="px-shell px-platform-grid">
          <div className="px-platform-copy" data-px-reveal>
            <p className="px-eyebrow">{copy.protection.eyebrow}</p>
            <h2>{copy.protection.title}</h2>
            <p>{copy.protection.body}</p>
          </div>
          <div className="px-platform-signals">
            {copy.protection.items.map(([title, description], index) => {
              const Icon = protectionIcons[index]
              return (
                <article key={title} data-px-reveal>
                  <div className="px-signal-line" aria-hidden="true" />
                  <Icon aria-hidden="true" size={27} strokeWidth={1.2} />
                  <strong>{title}</strong>
                  <span>{description}</span>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="px-final">
        <div className="px-final-atmosphere" aria-hidden="true">
          <span className="px-final-ring px-final-ring-a" /><span className="px-final-ring px-final-ring-b" /><span className="px-final-disc" /><span className="px-final-dots" />
        </div>
        <div className="px-shell px-final-grid" data-px-reveal>
          <div>
            <p className="px-eyebrow">{copy.final.eyebrow}</p>
            <h2>{copy.final.title1}<br /><span>{copy.final.title2}</span></h2>
            <p>{copy.final.body}</p>
          </div>
          <div className="px-final-actions">
            <Link href={localized("/demo")} className="px-btn px-btn-primary">{copy.final.primary} <ArrowRight aria-hidden="true" size={16} /></Link>
            <Link href={localized("/acceso-empresarial")} className="px-btn px-btn-secondary">{copy.final.secondary}</Link>
          </div>
        </div>
      </section>

      <footer className="px-footer">
        <div className="px-shell px-footer-grid">
          <div className="px-footer-brand">
            <strong>ViDENTiA</strong>
            <small>{copy.brandTagline}</small>
            <p>{copy.footer.body}</p>
          </div>
          <div className="px-footer-nav">
            <div><span>{copy.footer.platform}</span><Link href={localized("/demo")}>{copy.footer.search}</Link><Link href="#proceso">{copy.footer.process}</Link><Link href="#proteccion">{copy.footer.watch}</Link><Link href="#capacidades">{copy.footer.manage}</Link></div>
            <div><span>{copy.footer.resources}</span><Link href={localized("/docs")}>{copy.footer.docs}</Link><Link href={localized("/contacto")}>{copy.footer.contact}</Link><Link href={localized("/auth/login")} prefetch={false}>{copy.footer.login}</Link></div>
            <div><span>{copy.footer.legal}</span><Link href={localized("/privacidad")}>{copy.footer.privacy}</Link><Link href={localized("/terminos")}>{copy.footer.terms}</Link></div>
          </div>
        </div>
        <div className="px-shell px-footer-bottom"><p>{copy.footer.disclaimer}</p><p>{copy.footer.credit}</p></div>
      </footer>
    </main>
  )
}
