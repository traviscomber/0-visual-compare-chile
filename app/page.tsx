import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { HomeMotion } from "@/components/home-motion"

const story = [
  ["01", "Busca la marca.", "Ingresa un nombre, signo o imagen y revisa los antecedentes disponibles alrededor de esa marca.", ["INAPI", "Nombre", "Imagen"]],
  ["02", "Detecta qué revisar.", "Compara nombre, fonética, elementos visuales y clases para identificar antecedentes que requieren atención.", ["Denominación", "Visual", "Niza + Viena"]],
  ["03", "Entiende por qué.", "Revisa la fuente y el contexto detrás de cada señal: registro, titular, clases, historial y precedentes cuando están disponibles.", ["Fuente", "Titular", "Historial"]],
  ["04", "Guarda y vigila.", "Convierte la investigación en un caso y sigue nuevos antecedentes sin empezar de cero cada vez.", ["Casos", "Vigilancia", "Trazabilidad"]],
] as const

export default function LandingPage() {
  return (
    <main className="px-home">
      <HomeMotion />

      <nav className="px-nav" aria-label="Navegación principal">
        <div className="px-shell px-nav-inner">
          <Link href="/" className="px-brand" aria-label="VIDENTIA, inicio">
            <span className="px-mark">V</span>
            <span><strong>VIDENTIA</strong><small>by N3uralia</small></span>
          </Link>
          <div className="px-nav-links">
            <Link href="#producto">Producto</Link>
            <Link href="#metodo">Cómo funciona</Link>
            <Link href="#empresas">Empresas y API</Link>
            <Link href="/auth/login" className="px-btn px-btn-ghost">Iniciar sesión</Link>
            <Link href="/demo" className="px-btn px-btn-light">Probar sin cuenta <ArrowRight size={15} /></Link>
          </div>
        </div>
      </nav>

      <section className="px-hero">
        <div className="px-shell px-hero-grid">
          <div className="px-hero-copy" data-px-reveal>
            <p className="px-kicker">Búsqueda marcaria · comparación visual · vigilancia</p>
            <h1>Antes de presentar tu marca, <em>revisa qué puede complicarla.</em></h1>
            <p>Busca por nombre o imagen. VIDENTIA encuentra antecedentes similares, cruza clases y señales, y te muestra por qué merecen revisión.</p>
            <div className="px-actions px-actions-hero">
              <Link href="/demo" className="px-btn px-btn-primary">Revisar mi marca <ArrowRight size={16} /></Link>
              <Link href="/demo" className="px-text-link">Probar sin cuenta <ArrowRight size={14} /></Link>
            </div>
            <div className="px-proof px-proof-hero"><span>INAPI</span><span>Niza + Viena</span><span>TDPI</span><span>Sin veredictos automáticos</span></div>
          </div>

          <div className="px-visual" data-px-visual data-px-reveal aria-label="Visual editorial representativo de investigación marcaria">
            <div className="px-visual-grid" />
            <div className="px-scan" />
            <span className="px-orbit o1" /><span className="px-orbit o2" /><span className="px-orbit o3" />
            <div className="px-visual-head"><small>VIDENTIA / investigación</small><strong>Evidencia antes de presentar</strong></div>
            <div className="px-chip px-chip-a"><small>01 / antecedente</small><strong>Fuente visible</strong></div>
            <div className="px-chip px-chip-b"><small>02 / señal</small><strong>Nombre + imagen</strong></div>
            <span className="px-visual-caption">Visual propio VIDENTIA · no representa un expediente real</span>
          </div>
        </div>
      </section>

      <section className="px-principles">
        <div className="px-shell px-principles-grid">
          <div><p>Menos búsqueda manual. Más claridad sobre qué antecedentes revisar.</p></div>
          <div><span>01 / busca</span><strong>Qué existe</strong></div>
          <div><span>02 / compara</span><strong>Qué se parece</strong></div>
          <div><span>03 / revisa</span><strong>Por qué importa</strong></div>
        </div>
      </section>

      <section id="producto" className="px-section px-story">
        <div className="px-shell px-story-grid">
          <div className="px-story-copy" data-px-reveal>
            <p className="px-eyebrow">Qué hace VIDENTIA</p>
            <h2>Encuentra marcas que <em>merecen revisión.</em></h2>
            <p>Busca antecedentes, compara señales y revisa el contexto en un solo lugar. Sin depender de búsquedas aisladas ni de un porcentaje sin explicación.</p>
          </div>
          <div className="px-story-list">
            {story.map(([n,title,copy,tags]) => (
              <article className="px-step" key={n} data-px-reveal>
                <span>{n}</span><h3>{title}</h3><p>{copy}</p>
                <div className="px-step-tags">{tags.map(tag => <span key={tag}>{tag}</span>)}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-section px-compare">
        <div className="px-shell">
          <div className="px-heading" data-px-reveal>
            <div><p className="px-eyebrow">Comparación visual</p><h2>Entiende <em>por qué se parecen.</em></h2></div>
            <p>VIDENTIA separa contorno, composición y contexto. Ves qué genera la señal en vez de recibir sólo un score.</p>
          </div>
          <div className="px-compare-grid" data-px-reveal>
            <article className="px-compare-art">
              <div className="px-compare-shapes"><span className="px-shape" /><span className="px-vs">VS</span><span className="px-shape b" /></div>
              <footer>Referencias abstractas para explicar el método. No representan marcas reales.</footer>
            </article>
            <article className="px-compare-copy">
              <div className="px-signal"><small>Contorno</small><strong>Qué comparte la forma</strong><p>Identifica el rasgo visible que activa la comparación.</p></div>
              <div className="px-signal"><small>Composición</small><strong>Cómo se relacionan los elementos</strong><p>Explica la señal para que pueda revisarse.</p></div>
              <div className="px-signal"><small>Ámbito</small><strong>Dónde importa la similitud</strong><p>Clases y antecedentes agregan el contexto marcario.</p></div>
            </article>
          </div>
        </div>
      </section>

      <section id="metodo" className="px-section px-story">
        <div className="px-shell px-heading" data-px-reveal>
          <div><p className="px-eyebrow">Cómo funciona</p><h2>Busca. Compara. Revisa. Vigila.</h2></div>
          <p>Empieza con una búsqueda. Guarda lo relevante como caso y activa vigilancia cuando necesites seguir nuevos antecedentes.</p>
        </div>
      </section>

      <section id="empresas" className="px-section px-enterprise">
        <div className="px-shell px-enterprise-grid">
          <div className="px-story-copy" data-px-reveal>
            <p className="px-eyebrow">Para equipos</p>
            <h2>Investigación marcaria <em>en un solo sistema.</em></h2>
            <p>Para equipos legales, propiedad industrial e innovación que necesitan investigar, coordinar casos y vigilar marcas.</p>
          </div>
          <div className="px-offers" data-px-reveal>
            <article className="px-offer"><span>01</span><div><h3>VIDENTIA Enterprise</h3><p>Investigación, casos, colaboración y vigilancia en un mismo espacio.</p></div><Link href="/contacto">Hablar con el equipo</Link></article>
            <article className="px-offer"><span>02</span><div><h3>VIDENTIA API</h3><p>Integra búsqueda y contexto marcario en tus propios procesos.</p></div><Link href="/contacto">Explorar integración</Link></article>
            <article className="px-offer"><span>03</span><div><h3>Demo público</h3><p>Prueba una búsqueda antes de crear una cuenta.</p></div><Link href="/demo">Probar ahora</Link></article>
          </div>
        </div>
      </section>

      <section className="px-final">
        <div className="px-shell" data-px-reveal>
          <p className="px-eyebrow">VIDENTIA · by N3uralia</p>
          <h2>Busca tu marca. <em>Revisa antes de avanzar.</em></h2>
          <p>Empieza con una búsqueda pública. Sin cuenta.</p>
          <div className="px-actions"><Link href="/demo" className="px-btn px-btn-primary">Buscar una marca <ArrowRight size={16} /></Link><Link href="/auth/login" className="px-btn px-btn-ghost">Iniciar sesión</Link></div>
        </div>
      </section>

      <footer className="px-footer"><div className="px-shell px-footer-grid"><strong>VIDENTIA</strong><span>VIDENTIA apoya investigación y revisión de evidencia. No reemplaza la evaluación jurídica profesional ni las fuentes oficiales.</span><span>Un desarrollo de N3uralia</span></div></footer>
    </main>
  )
}
