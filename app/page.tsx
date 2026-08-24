import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { HomeMotion } from "@/components/home-motion"

const story = [
  ["01", "Abre la fuente.", "La investigación parte desde antecedentes y campos verificables. Fuente, disponibilidad y fecha permanecen visibles.", ["INAPI", "Solicitud / registro", "Estado"]],
  ["02", "Separa las señales.", "Denominación, fonética, elementos visuales y ámbito se leen por separado para explicar por qué un antecedente merece revisión.", ["Denominación", "Visual", "Niza + Viena"]],
  ["03", "Conecta el contexto.", "Cuando existe evidencia verificable, VIDENTIA relaciona titular, historial y precedentes sin confundir fuente con inferencia.", ["Titular", "Historial", "Precedentes"]],
  ["04", "Conserva lo que cambia.", "La investigación puede convertirse en caso y vigilancia para volver a revisar nueva evidencia sin reconstruir el contexto desde cero.", ["Casos", "Vigilancia", "Trazabilidad"]],
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
            <h1>Antes de decidir, <em>mira la evidencia.</em></h1>
            <p>VIDENTIA organiza antecedentes, señales visuales y denominativas, contexto verificable y vigilancia en una investigación clara y trazable.</p>
            <div className="px-actions">
              <Link href="/demo" className="px-btn px-btn-primary">Investigar una marca <ArrowRight size={16} /></Link>
              <Link href="#producto" className="px-btn px-btn-ghost">Ver el producto</Link>
            </div>
            <span className="px-note">El demo se puede usar antes de iniciar sesión</span>
            <div className="px-proof"><span>INAPI</span><span>Niza + Viena</span><span>TDPI</span><span>Evidencia trazable</span></div>
          </div>

          <div className="px-visual" data-px-visual data-px-reveal aria-label="Visual editorial representativo de investigación marcaria">
            <div className="px-visual-grid" />
            <div className="px-scan" />
            <span className="px-orbit o1" /><span className="px-orbit o2" /><span className="px-orbit o3" />
            <div className="px-chip px-chip-a"><small>Fuente</small><strong>Origen visible</strong></div>
            <div className="px-chip px-chip-b"><small>Señales</small><strong>Separadas y explicables</strong></div>
            <div className="px-chip px-chip-c"><small>Decisión</small><strong>Revisión profesional</strong></div>
            <span className="px-visual-caption">Visual propio VIDENTIA · no representa un expediente real</span>
          </div>
        </div>
      </section>

      <section className="px-principles">
        <div className="px-shell px-principles-grid">
          <div><p>VIDENTIA no reemplaza la fuente oficial ni convierte una señal técnica en una respuesta jurídica automática.</p></div>
          <div><span>01 / fuente</span><strong>Origen visible</strong></div>
          <div><span>02 / análisis</span><strong>Señales separadas</strong></div>
          <div><span>03 / decisión</span><strong>Juicio humano</strong></div>
        </div>
      </section>

      <section id="producto" className="px-section px-story">
        <div className="px-shell px-story-grid">
          <div className="px-story-copy" data-px-reveal>
            <p className="px-eyebrow">Producto / evidencia conectada</p>
            <h2>Una investigación no es una lista de <em>resultados.</em></h2>
            <p>Es una secuencia de fuentes, señales, relaciones y cambios que debe poder volver a revisarse. VIDENTIA conserva esa estructura para que el contexto no se pierda entre búsquedas aisladas.</p>
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
            <div><p className="px-eyebrow">Comparación visual</p><h2>Compara estructura, no un <em>porcentaje.</em></h2></div>
            <p>La comparación visual útil explica qué rasgos se observan y mantiene el contexto marcario alrededor de ellos. No convierte una similitud en un veredicto.</p>
          </div>
          <div className="px-compare-grid" data-px-reveal>
            <article className="px-compare-art">
              <div className="px-compare-shapes"><span className="px-shape" /><span className="px-vs">VS</span><span className="px-shape b" /></div>
              <footer>Referencias abstractas para explicar el método. No representan marcas reales.</footer>
            </article>
            <article className="px-compare-copy">
              <div className="px-signal"><small>Contorno</small><strong>Estructura observable</strong><p>Se describe el rasgo compartido o diferenciador sin fundirlo en un score global.</p></div>
              <div className="px-signal"><small>Composición</small><strong>Relación entre elementos</strong><p>La lectura conserva qué parte de la imagen motiva la comparación.</p></div>
              <div className="px-signal"><small>Ámbito</small><strong>Contexto marcario</strong><p>Las señales visuales se entienden junto a clases y antecedentes, no de forma aislada.</p></div>
            </article>
          </div>
        </div>
      </section>

      <section id="metodo" className="px-section px-story">
        <div className="px-shell px-heading" data-px-reveal>
          <div><p className="px-eyebrow">Cómo funciona</p><h2>Busca. Entiende. Decide. Vigila.</h2></div>
          <p>Una misma investigación puede avanzar desde la búsqueda pública hasta un caso privado y vigilancia posterior, sin perder la procedencia de la evidencia.</p>
        </div>
      </section>

      <section id="empresas" className="px-section px-enterprise">
        <div className="px-shell px-enterprise-grid">
          <div className="px-story-copy" data-px-reveal>
            <p className="px-eyebrow">Para organizaciones</p>
            <h2>La misma trazabilidad, en plataforma o API.</h2>
            <p>Equipos legales, de innovación o propiedad industrial pueden trabajar desde VIDENTIA o integrar capacidades marcarias en sus propios procesos.</p>
          </div>
          <div className="px-offers" data-px-reveal>
            <article className="px-offer"><span>01</span><div><h3>VIDENTIA Enterprise</h3><p>Investigación, casos, colaboración y vigilancia en un solo espacio de trabajo.</p></div><Link href="/contacto">Hablar con el equipo</Link></article>
            <article className="px-offer"><span>02</span><div><h3>VIDENTIA API</h3><p>Capacidades marcarias integrables con el mismo criterio de trazabilidad.</p></div><Link href="/contacto">Explorar integración</Link></article>
            <article className="px-offer"><span>03</span><div><h3>Demo público</h3><p>Prueba una primera investigación antes de iniciar sesión.</p></div><Link href="/demo">Probar sin cuenta</Link></article>
          </div>
        </div>
      </section>

      <section className="px-final">
        <div className="px-shell" data-px-reveal>
          <p className="px-eyebrow">VIDENTIA · by N3uralia</p>
          <h2>Investiga antes de decidir. <em>Conserva la evidencia después.</em></h2>
          <p>El acceso público permite conocer y probar VIDENTIA. El acceso privado queda para guardar casos, colaborar y activar vigilancia.</p>
          <div className="px-actions"><Link href="/demo" className="px-btn px-btn-primary">Probar VIDENTIA sin cuenta <ArrowRight size={16} /></Link><Link href="/auth/login" className="px-btn px-btn-ghost">Iniciar sesión</Link></div>
        </div>
      </section>

      <footer className="px-footer"><div className="px-shell px-footer-grid"><strong>VIDENTIA</strong><span>VIDENTIA apoya investigación y revisión de evidencia. No reemplaza la evaluación jurídica profesional ni las fuentes oficiales.</span><span>Un desarrollo de N3uralia</span></div></footer>
    </main>
  )
}
