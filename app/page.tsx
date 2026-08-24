import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { HomeMotion } from "@/components/home-motion"

const story = [
  ["01", "Llega antes.", "Antes de presentar una marca, abre el terreno: antecedentes, clases, titulares y señales que ya existen alrededor de tu nombre o signo.", ["INAPI", "Solicitud / registro", "Estado"]],
  ["02", "Entiende qué se parece — y por qué.", "VIDENTIA separa nombre, fonética, estructura visual y ámbito para que la revisión no dependa de un porcentaje sin explicación.", ["Denominación", "Visual", "Niza + Viena"]],
  ["03", "Ve la red, no el registro aislado.", "Cuando existe evidencia verificable, conecta titular, historial, clases y precedentes para revelar el contexto que una búsqueda plana deja fuera.", ["Titular", "Historial", "Precedentes"]],
  ["04", "No dejes de mirar después.", "Convierte una investigación en caso y vigilancia para volver a detectar cambios sin reconstruir todo desde cero.", ["Casos", "Vigilancia", "Trazabilidad"]],
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
            <p className="px-kicker">Inteligencia marcaria para Chile</p>
            <h1>No esperes a que el problema <em>aparezca.</em></h1>
            <p>VIDENTIA te ayuda a descubrir antes qué existe alrededor de una marca, qué merece atención y qué cambia después. Todo con evidencia visible y contexto verificable.</p>
            <div className="px-actions">
              <Link href="/demo" className="px-btn px-btn-primary">Explorar una marca <ArrowRight size={16} /></Link>
              <Link href="#producto" className="px-btn px-btn-ghost">Ver qué descubre VIDENTIA</Link>
            </div>
            <span className="px-note">Puedes probarlo antes de iniciar sesión</span>
            <div className="px-proof"><span>INAPI</span><span>Niza + Viena</span><span>TDPI</span><span>Evidencia trazable</span></div>
          </div>

          <div className="px-visual" data-px-visual data-px-reveal aria-label="Visual editorial representativo de investigación marcaria">
            <div className="px-visual-grid" />
            <div className="px-scan" />
            <span className="px-orbit o1" /><span className="px-orbit o2" /><span className="px-orbit o3" />
            <div className="px-chip px-chip-a"><small>Antes</small><strong>Detecta el terreno</strong></div>
            <div className="px-chip px-chip-b"><small>Durante</small><strong>Entiende las señales</strong></div>
            <div className="px-chip px-chip-c"><small>Después</small><strong>Vigila lo que cambia</strong></div>
            <span className="px-visual-caption">Visual propio VIDENTIA · no representa un expediente real</span>
          </div>
        </div>
      </section>

      <section className="px-principles">
        <div className="px-shell px-principles-grid">
          <div><p>Las mejores decisiones no parten de más datos. Parten de ver antes lo que importa.</p></div>
          <div><span>01 / descubre</span><strong>Qué ya existe</strong></div>
          <div><span>02 / entiende</span><strong>Qué merece atención</strong></div>
          <div><span>03 / vigila</span><strong>Qué cambia después</strong></div>
        </div>
      </section>

      <section id="producto" className="px-section px-story">
        <div className="px-shell px-story-grid">
          <div className="px-story-copy" data-px-reveal>
            <p className="px-eyebrow">La diferencia / llegar antes</p>
            <h2>Una marca puede parecer libre hasta que <em>dejas de mirar sólo el nombre.</em></h2>
            <p>La oportunidad está en conectar señales que normalmente viven separadas: registros, titulares, clases, visuales, precedentes y cambios posteriores. Ahí aparece el contexto.</p>
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
            <div><p className="px-eyebrow">Más allá del nombre</p><h2>Lo parecido no siempre es obvio. <em>Por eso hay que explicarlo.</em></h2></div>
            <p>VIDENTIA separa estructura, composición y contexto para mostrar qué está generando una señal. Sin esconder la lectura detrás de un score global.</p>
          </div>
          <div className="px-compare-grid" data-px-reveal>
            <article className="px-compare-art">
              <div className="px-compare-shapes"><span className="px-shape" /><span className="px-vs">VS</span><span className="px-shape b" /></div>
              <footer>Referencias abstractas para explicar el método. No representan marcas reales.</footer>
            </article>
            <article className="px-compare-copy">
              <div className="px-signal"><small>Contorno</small><strong>Qué comparte la forma</strong><p>La lectura identifica el rasgo visible que activa la comparación.</p></div>
              <div className="px-signal"><small>Composición</small><strong>Cómo se relacionan los elementos</strong><p>La señal deja de ser una cifra y pasa a tener una explicación revisable.</p></div>
              <div className="px-signal"><small>Ámbito</small><strong>Dónde importa esa similitud</strong><p>Clases y antecedentes ayudan a entender el contexto en que la señal merece atención.</p></div>
            </article>
          </div>
        </div>
      </section>

      <section id="metodo" className="px-section px-story">
        <div className="px-shell px-heading" data-px-reveal>
          <div><p className="px-eyebrow">El flujo VIDENTIA</p><h2>Descubre antes. Decide mejor. Sigue mirando.</h2></div>
          <p>Una búsqueda puede convertirse en investigación, una investigación en caso y un caso en vigilancia. El contexto permanece conectado durante todo el recorrido.</p>
        </div>
      </section>

      <section id="empresas" className="px-section px-enterprise">
        <div className="px-shell px-enterprise-grid">
          <div className="px-story-copy" data-px-reveal>
            <p className="px-eyebrow">Para equipos que no pueden llegar tarde</p>
            <h2>Haz de la inteligencia marcaria una <em>capacidad continua.</em></h2>
            <p>VIDENTIA puede vivir como espacio de trabajo para equipos legales y de innovación, o integrarse vía API dentro de procesos propios.</p>
          </div>
          <div className="px-offers" data-px-reveal>
            <article className="px-offer"><span>01</span><div><h3>VIDENTIA Enterprise</h3><p>Investiga, coordina casos y vigila cambios desde un mismo lugar.</p></div><Link href="/contacto">Hablar con el equipo</Link></article>
            <article className="px-offer"><span>02</span><div><h3>VIDENTIA API</h3><p>Lleva señales y contexto marcario a tus propios sistemas y procesos.</p></div><Link href="/contacto">Explorar integración</Link></article>
            <article className="px-offer"><span>03</span><div><h3>Prueba pública</h3><p>Comprueba la experiencia con una primera investigación antes de crear una cuenta.</p></div><Link href="/demo">Probar ahora</Link></article>
          </div>
        </div>
      </section>

      <section className="px-final">
        <div className="px-shell" data-px-reveal>
          <p className="px-eyebrow">VIDENTIA · by N3uralia</p>
          <h2>Una marca no se protege el día que la presentas. <em>Empieza antes.</em></h2>
          <p>Explora el terreno, entiende las señales y conserva la vigilancia en un mismo sistema.</p>
          <div className="px-actions"><Link href="/demo" className="px-btn px-btn-primary">Explorar una marca <ArrowRight size={16} /></Link><Link href="/auth/login" className="px-btn px-btn-ghost">Iniciar sesión</Link></div>
        </div>
      </section>

      <footer className="px-footer"><div className="px-shell px-footer-grid"><strong>VIDENTIA</strong><span>VIDENTIA apoya investigación y revisión de evidencia. No reemplaza la evaluación jurídica profesional ni las fuentes oficiales.</span><span>Un desarrollo de N3uralia</span></div></footer>
    </main>
  )
}
