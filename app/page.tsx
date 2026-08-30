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

const trustPoints = [
  [ShieldCheck, "Revisión inicial gratuita", "Valida antecedentes antes de invertir más tiempo."],
  [Database, "Fuentes oficiales", "Trabaja con evidencia identificable y contexto verificable."],
  [CircleDot, "Evidencia trazable", "Cada señal conserva fuente, fecha y explicación."],
  [BellRing, "Alertas inteligentes", "Prioriza cambios que realmente requieren revisión."],
] as const

const flow = [
  ["01", Search, "Busca", "Encuentra la marca o nombre que quieres investigar."],
  ["02", Database, "Analiza", "Recopila antecedentes desde fuentes identificables."],
  ["03", CircleDot, "Evalúa", "Organiza similitud, señales y evidencia para revisión."],
  ["04", ShieldCheck, "Protege", "Conecta registro, vigilancia y administración continua."],
] as const

const capabilities = [
  [Search, "Búsqueda profunda", "Reduce ruido y prioriza antecedentes denominativos, fonéticos y visuales que merecen revisión."],
  [Radar, "Vigilancia continua", "Sigue nuevas solicitudes y cambios relevantes sin repetir manualmente la investigación."],
  [BriefcaseBusiness, "Gestión centralizada", "Administra marcas, solicitudes, documentos y responsables desde un mismo sistema."],
  [FileText, "Reportes con evidencia", "Convierte señales y fuentes identificables en reportes claros, trazables y revisables."],
] as const

const audiences = [
  [Users, "Emprendedores"],
  [Scale, "Estudios jurídicos"],
  [Building2, "Empresas"],
  [FileSearch, "Agencias"],
  [BriefcaseBusiness, "Equipos legales"],
] as const

const protectionSignals = [
  [BriefcaseBusiness, "Portfolio", "Una marca persistente, un historial y un lugar para entender qué posees."],
  [Radar, "Watch", "Señales priorizadas para saber qué cambió y qué requiere revisión."],
  [CalendarClock, "Deadlines", "Plazos visibles y accionables conectados con cada solicitud y evento."],
] as const

export default function LandingPage() {
  return (
    <main className="px-home">
      <HomeMotion />

      <nav className="px-nav" aria-label="Navegación principal">
        <div className="px-shell px-nav-inner">
          <Link href="/" className="px-brand" aria-label="VIDENTIA, inicio">
            <span className="px-brand-word">ViDENTiA</span>
            <small>INTELIGENCIA Y PROTECCIÓN DE MARCAS</small>
          </Link>

          <div className="px-nav-links">
            <Link href="/demo">Buscar</Link>
            <Link href="#proceso">Registrar</Link>
            <Link href="#proteccion">Vigilar</Link>
            <Link href="#capacidades">Gestionar</Link>
            <Link href="/contacto">Precios</Link>
            <Link href="/docs" className="px-nav-resources">
              Recursos <ChevronDown aria-hidden="true" size={12} strokeWidth={1.5} />
            </Link>
            <Link href="/auth/login" className="px-nav-login" prefetch={false}>Iniciar sesión</Link>
            <Link href="/demo" className="px-btn px-nav-cta">Buscar una marca</Link>
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
            <p className="px-kicker">FUENTES OFICIALES · EVIDENCIA TRAZABLE</p>
            <h1>
              Protege tu marca<br />
              desde antes de<br />
              <span>registrarla.</span>
            </h1>
            <p className="px-lead">Investiga antecedentes, registra, vigila y administra tus marcas desde un solo lugar.</p>

            <form action="/demo" method="get" className="px-search" role="search">
              <Search aria-hidden="true" size={21} strokeWidth={1.6} />
              <label htmlFor="hero-marca" className="sr-only">Buscar una marca, nombre o logo</label>
              <input id="hero-marca" name="marca" type="search" placeholder="Buscar una marca, nombre o logo" autoComplete="off" />
              <button type="submit">Buscar <ArrowRight aria-hidden="true" size={17} /></button>
            </form>
          </div>

          <div className="px-hero-visual" data-px-reveal>
            <div className="px-hero-light px-hero-light-green" aria-hidden="true" />
            <div className="px-hero-light px-hero-light-blue" aria-hidden="true" />
            <div className="px-hero-art">
              <Image
                src="/images/videntia-hero-comparison-hd.webp"
                alt="Dos personas comparan marcas con grandes lupas sobre geometría Bauhaus de VIDENTIA"
                fill
                priority
                sizes="(max-width: 1120px) 100vw, 56vw"
                className="px-hero-image"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-trust" aria-label="Principios de producto">
        <div className="px-shell px-trust-grid">
          {trustPoints.map(([Icon, title, description]) => (
            <article key={title} data-px-reveal>
              <div className="px-icon-beacon" aria-hidden="true"><Icon size={31} strokeWidth={1.25} /></div>
              <div>
                <h2>{title}</h2>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="proceso" className="px-section px-process">
        <div className="px-section-glow px-section-glow-left" aria-hidden="true" />
        <div className="px-shell px-process-layout">
          <div className="px-section-heading px-section-heading-compact" data-px-reveal>
            <p className="px-eyebrow">02. CÓMO FUNCIONA</p>
            <h2>Un proceso simple,<br /><span>inteligente y trazable.</span></h2>
            <p>Desde una búsqueda inicial hasta la protección continua, cada etapa conserva contexto y evidencia.</p>
          </div>

          <div className="px-flow" data-px-reveal>
            {flow.map(([number, Icon, title, description]) => (
              <article key={number}>
                <div className="px-step-symbol" aria-hidden="true"><Icon size={34} strokeWidth={1.2} /></div>
                <span className="px-step-number">{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="capacidades" className="px-section px-capabilities">
        <div className="px-bauhaus-field" aria-hidden="true">
          <span className="px-bauhaus-ring" />
          <span className="px-bauhaus-square" />
          <span className="px-bauhaus-arc" />
          <span className="px-bauhaus-dots" />
        </div>

        <div className="px-shell">
          <div className="px-section-heading" data-px-reveal>
            <p className="px-eyebrow">03. CAPACIDADES PRINCIPALES</p>
            <h2>Todo lo que necesitas<br />para <span>proteger tu marca.</span></h2>
          </div>

          <div className="px-capability-layout">
            <div className="px-capability-grid">
              {capabilities.map(([Icon, title, description]) => (
                <article key={title} data-px-reveal>
                  <div className="px-capability-icon" aria-hidden="true"><Icon size={30} strokeWidth={1.25} /></div>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="px-capability-cta" data-px-reveal>
              <p>Investiga hoy. Mantén el control después.</p>
              <Link href="/contacto" className="px-btn px-btn-line">Conocer planes <ArrowRight aria-hidden="true" size={16} /></Link>
            </div>
          </div>
        </div>
      </section>

      <section id="audiencias" className="px-section px-audience">
        <div className="px-shell px-audience-grid">
          <div className="px-section-heading" data-px-reveal>
            <p className="px-eyebrow">04. PARA QUIÉN ES</p>
            <h2>Diseñado para equipos<br />que <span>construyen marcas.</span></h2>
            <p>Una misma infraestructura para investigar, decidir, gestionar y vigilar durante todo el ciclo de vida de una marca.</p>
          </div>

          <div className="px-audience-stage" data-px-reveal>
            <div className="px-audience-list">
              {audiences.map(([Icon, title]) => (
                <article key={title}>
                  <Icon aria-hidden="true" size={28} strokeWidth={1.2} />
                  <span>{title}</span>
                </article>
              ))}
            </div>
            <div className="px-audience-art" aria-hidden="true">
              <span className="px-audience-arc px-audience-arc-a" />
              <span className="px-audience-arc px-audience-arc-b" />
              <span className="px-audience-dot-grid" />
            </div>
          </div>
        </div>
      </section>

      <section id="proteccion" className="px-section px-platform">
        <div className="px-shell px-platform-grid">
          <div className="px-platform-copy" data-px-reveal>
            <p className="px-eyebrow">05. PROTECCIÓN CONTINUA</p>
            <h2>Portfolio + Watch + Deadlines.</h2>
            <p>El valor durable aparece después de la búsqueda: qué posees, qué cambió, qué requiere atención y cuál es el próximo plazo.</p>
          </div>

          <div className="px-platform-signals">
            {protectionSignals.map(([Icon, title, description]) => (
              <article key={title} data-px-reveal>
                <div className="px-signal-line" aria-hidden="true" />
                <Icon aria-hidden="true" size={27} strokeWidth={1.2} />
                <strong>{title}</strong>
                <span>{description}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-final">
        <div className="px-final-atmosphere" aria-hidden="true">
          <span className="px-final-ring px-final-ring-a" />
          <span className="px-final-ring px-final-ring-b" />
          <span className="px-final-disc" />
          <span className="px-final-dots" />
        </div>

        <div className="px-shell px-final-grid" data-px-reveal>
          <div>
            <p className="px-eyebrow">06. EMPIEZA HOY</p>
            <h2>Empieza a proteger<br />tu marca <span>hoy.</span></h2>
            <p>Revisión inicial gratuita. Sin tarjeta de crédito.</p>
          </div>
          <div className="px-final-actions">
            <Link href="/demo" className="px-btn px-btn-primary">Buscar una marca <ArrowRight aria-hidden="true" size={16} /></Link>
            <Link href="/contacto" className="px-btn px-btn-secondary">Conocer planes</Link>
          </div>
        </div>
      </section>

      <footer className="px-footer">
        <div className="px-shell px-footer-grid">
          <div className="px-footer-brand">
            <strong>ViDENTiA</strong>
            <small>INTELIGENCIA Y PROTECCIÓN DE MARCAS</small>
            <p>Investigación, evidencia, seguimiento y administración de marcas desde un mismo sistema.</p>
          </div>

          <div className="px-footer-nav">
            <div>
              <span>Plataforma</span>
              <Link href="/demo">Buscar</Link>
              <Link href="#proceso">Proceso</Link>
              <Link href="#proteccion">Vigilar</Link>
              <Link href="#capacidades">Gestionar</Link>
            </div>
            <div>
              <span>Recursos</span>
              <Link href="/docs">Documentación</Link>
              <Link href="/contacto">Contacto</Link>
              <Link href="/auth/login" prefetch={false}>Iniciar sesión</Link>
            </div>
            <div>
              <span>Legal</span>
              <Link href="/privacidad">Privacidad</Link>
              <Link href="/terminos">Términos</Link>
            </div>
          </div>
        </div>

        <div className="px-shell px-footer-bottom">
          <p>VIDENTIA apoya investigación y revisión de evidencia. No reemplaza la evaluación jurídica profesional ni las fuentes oficiales.</p>
          <p>Un desarrollo de N3uralia</p>
        </div>
      </footer>
    </main>
  )
}
