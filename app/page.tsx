import Link from "next/link"
import {
  ArrowRight,
  BellRing,
  Building2,
  CircleDot,
  Clock3,
  Database,
  FileSearch,
  FolderKanban,
  Search,
} from "lucide-react"
import { HomeMotion } from "@/components/home-motion"

const trustPoints = [
  [FileSearch, "Revisión inicial gratuita", "Valida antecedentes antes de invertir más tiempo."],
  [Database, "Fuentes oficiales", "Evidencia identificable y contexto verificable."],
  [CircleDot, "Evidencia trazable", "Cada señal conserva fuente, fecha y explicación."],
  [BellRing, "Alertas inteligentes", "Prioriza cambios que realmente requieren revisión."],
] as const

const flow = [
  ["01", Search, "Buscar", "Encuentra antecedentes por nombre o logo."],
  ["02", FileSearch, "Evaluar", "Compara denominación, fonética, visual y clases."],
  ["03", FolderKanban, "Registrar", "Convierte la investigación en una marca persistente."],
  ["04", BellRing, "Vigilar", "Sigue nuevas solicitudes y cambios relevantes."],
  ["05", Clock3, "Gestionar", "Controla portafolio, hitos, documentos y plazos."],
] as const

const capabilities = [
  [Search, "Búsqueda profunda", "Reduce ruido y prioriza antecedentes que merecen revisión."],
  [Database, "Fuentes oficiales", "Mantén identificables los registros oficiales usados en cada análisis."],
  [FileSearch, "Evidencia trazable", "Entiende por qué aparece cada señal y qué evidencia la respalda."],
  [BellRing, "Vigilancia continua", "Recibe cambios priorizados sin repetir manualmente la investigación."],
] as const

const audiences = [
  ["Emprendedores", "Una ruta clara desde la búsqueda inicial hasta la protección continua."],
  ["Estudios jurídicos", "Investigaciones, evidencia, portafolios y revisiones en un mismo sistema."],
  ["Empresas", "Control de marcas, responsables, alertas y próximos hitos."],
  ["Agencias", "Comparación de candidatos, reportes y colaboración con clientes."],
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
            <Link href="#proceso">Vigilar</Link>
            <Link href="#producto">Gestionar</Link>
            <Link href="/contacto">Precios</Link>
            <Link href="/docs">Recursos</Link>
            <Link href="/auth/login" prefetch={false}>Iniciar sesión</Link>
            <Link href="/demo" className="px-btn px-btn-primary">Buscar una marca</Link>
          </div>
        </div>
      </nav>

      <section className="px-hero">
        <div className="px-shell px-hero-grid">
          <div className="px-hero-copy" data-px-reveal>
            <p className="px-kicker">FUENTES OFICIALES · EVIDENCIA TRAZABLE</p>
            <h1>Protege tu marca<br />desde antes de<br /><span>registrarla.</span></h1>
            <p className="px-lead">Investiga antecedentes, registra, vigila y administra tus marcas desde un solo lugar.</p>

            <form action="/demo" method="get" className="px-search" role="search">
              <Search aria-hidden="true" size={20} />
              <label htmlFor="hero-marca" className="sr-only">Buscar una marca, nombre o logo</label>
              <input id="hero-marca" name="marca" type="search" placeholder="Buscar una marca, nombre o logo" autoComplete="off" />
              <button type="submit">Buscar <ArrowRight aria-hidden="true" size={16} /></button>
            </form>

            <div className="px-proof px-proof-hero" aria-label="Atributos de confianza">
              <span>Chile primero</span>
              <span>INAPI identificable</span>
              <span>Niza + Viena</span>
              <span>Sin veredictos automáticos</span>
            </div>
          </div>

          <div className="px-hero-art" data-px-reveal role="img" aria-label="Dos personas comparan marcas con lupas sobre geometría Bauhaus de VIDENTIA" />
        </div>
      </section>

      <section className="px-trust" aria-label="Principios de producto">
        <div className="px-shell px-trust-grid">
          {trustPoints.map(([Icon, title, description]) => (
            <article key={title}>
              <Icon aria-hidden="true" size={28} strokeWidth={1.35} />
              <div><h2>{title}</h2><p>{description}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section id="producto" className="px-section px-intelligence">
        <div className="px-shell">
          <div className="px-section-heading" data-px-reveal>
            <p className="px-eyebrow">01. INTELIGENCIA ANTICIPADA</p>
            <h2>Decisiones informadas,<br /><span>riesgos evitados.</span></h2>
            <p>VIDENTIA organiza señales, fuentes y contexto para que puedas concentrarte en lo que merece atención, sin convertir un ranking técnico en una promesa legal.</p>
          </div>
          <div className="px-capability-grid">
            {capabilities.map(([Icon, title, description]) => (
              <article key={title} data-px-reveal>
                <Icon aria-hidden="true" size={30} strokeWidth={1.25} />
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="proceso" className="px-section px-process">
        <div className="px-shell">
          <div className="px-section-heading px-section-heading-wide" data-px-reveal>
            <p className="px-eyebrow">02. PROCESO SIMPLE, TODO EN UNO</p>
            <h2>Un flujo claro para<br /><span>proteger tu marca.</span></h2>
          </div>
          <div className="px-flow" data-px-reveal>
            {flow.map(([number, Icon, title, description]) => (
              <article key={number}>
                <span className="px-step-number">{number}</span>
                <Icon aria-hidden="true" size={34} strokeWidth={1.2} />
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-section px-audience">
        <div className="px-shell px-audience-grid">
          <div className="px-section-heading" data-px-reveal>
            <p className="px-eyebrow">03. PARA QUIÉN ES</p>
            <h2>Diseñado para equipos<br />que <span>construyen marcas.</span></h2>
            <p>Una misma infraestructura para investigar, decidir, gestionar y vigilar a lo largo del ciclo de vida de cada marca.</p>
          </div>
          <div className="px-audience-list">
            {audiences.map(([title, description], index) => (
              <article key={title} data-px-reveal>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{title}</h3><p>{description}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-section px-platform">
        <div className="px-shell px-platform-grid">
          <div data-px-reveal>
            <p className="px-eyebrow">04. VALOR RECURRENTE</p>
            <h2>Portfolio + Watch + Deadlines.</h2>
            <p>El valor durable aparece cuando cada marca persiste: qué posees, qué cambió, qué requiere atención y cuál es el próximo plazo.</p>
          </div>
          <div className="px-platform-signals" data-px-reveal>
            <article><Building2 aria-hidden="true" size={26} strokeWidth={1.2} /><strong>Portfolio</strong><span>Una marca, un historial, un lugar.</span></article>
            <article><BellRing aria-hidden="true" size={26} strokeWidth={1.2} /><strong>Watch</strong><span>Señales priorizadas, no ruido.</span></article>
            <article><Clock3 aria-hidden="true" size={26} strokeWidth={1.2} /><strong>Deadlines</strong><span>Plazos visibles y accionables.</span></article>
          </div>
        </div>
      </section>

      <section className="px-final">
        <div className="px-shell px-final-grid" data-px-reveal>
          <div>
            <p className="px-eyebrow">05. EMPIEZA HOY</p>
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
          <div><strong>ViDENTiA</strong><small>INTELIGENCIA Y PROTECCIÓN DE MARCAS</small></div>
          <p>VIDENTIA apoya investigación y revisión de evidencia. No reemplaza la evaluación jurídica profesional ni las fuentes oficiales.</p>
          <p>Un desarrollo de N3uralia · <Link href="/privacidad">Privacidad</Link> · <Link href="/terminos">Términos</Link></p>
        </div>
      </footer>
    </main>
  )
}
