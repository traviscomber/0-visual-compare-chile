import Link from "next/link"
import { ArrowRight, Check, Fingerprint, Layers3, Search, Waves } from "lucide-react"
import { HomeMotion } from "@/components/home-motion"

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "VIDENTIA",
  url: "https://videntia.app",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  inLanguage: "es-CL",
  creator: { "@type": "Organization", name: "N3uralia", url: "https://www.n3uralia.com" },
  description: "Plataforma de inteligencia marcaria para búsqueda, evaluación y vigilancia de marcas en Chile.",
}

const story = [
  {
    index: "01",
    title: "Abre la fuente.",
    copy: "La investigación parte desde antecedentes y campos verificables. Fuente, disponibilidad y fecha permanecen visibles.",
    meta: ["INAPI", "Solicitud / registro", "Estado"],
  },
  {
    index: "02",
    title: "Separa las señales.",
    copy: "Denominación, fonética, elementos visuales y ámbito se leen por separado para entender por qué un antecedente merece revisión.",
    meta: ["Denominación", "Visual", "Niza + Viena"],
  },
  {
    index: "03",
    title: "Conecta el contexto.",
    copy: "Cuando existe evidencia verificable, VIDENTIA relaciona titular, historial, clases y precedentes sin confundir fuente con inferencia.",
    meta: ["Titular", "Historial", "Precedentes"],
  },
  {
    index: "04",
    title: "Conserva lo que cambia.",
    copy: "La investigación puede convertirse en caso y vigilancia para volver a revisar nueva evidencia sin reconstruir el contexto desde cero.",
    meta: ["Casos", "Vigilancia", "Trazabilidad"],
  },
]

const flow = [
  ["Busca", "Parte desde un nombre, un signo o una imagen.", "Entrada simple"],
  ["Entiende", "Ordena antecedentes, señales y contexto verificable.", "Evidencia separada"],
  ["Decide", "Prioriza qué requiere revisión profesional.", "Juicio humano"],
  ["Vigila", "Conserva el contexto y revisa cambios posteriores.", "Seguimiento"],
]

function Mark({ variant = "a" }: { variant?: "a" | "b" | "c" }) {
  return <span className={`vx-mark ${variant === "b" ? "vx-mark-b" : variant === "c" ? "vx-mark-c" : ""}`} aria-hidden="true" />
}

function EvidenceItem({ letter, label, title, copy, status }: { letter: string; label: string; title: string; copy: string; status: string }) {
  return (
    <div className="vx-evidence-item">
      <span className="vx-evidence-letter">{letter}</span>
      <div>
        <small>{label}</small>
        <strong>{title}</strong>
        <p>{copy}</p>
      </div>
      <em>{status}</em>
    </div>
  )
}

export default function LandingPage() {
  return (
    <main className="vx-home">
      <HomeMotion />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <nav className="vx-nav" aria-label="Navegación principal">
        <div className="vx-shell vx-nav-inner">
          <Link href="/" className="vx-brand" aria-label="VIDENTIA, inicio">
            <span className="vx-brand-mark">V</span>
            <span className="vx-brand-copy"><strong>VIDENTIA</strong><small>by N3uralia</small></span>
          </Link>
          <div className="vx-nav-links">
            <Link href="#producto">Producto</Link>
            <Link href="#metodo">Cómo funciona</Link>
            <Link href="#empresas">Empresas y API</Link>
            <Link href="/auth/login" className="vx-button vx-button-soft">Iniciar sesión</Link>
            <Link href="/demo" className="vx-button vx-button-light vx-nav-demo">Probar sin cuenta <ArrowRight size={15} /></Link>
          </div>
        </div>
      </nav>

      <section className="vx-hero" aria-labelledby="vx-hero-title">
        <div className="vx-shell vx-hero-grid">
          <div className="vx-hero-copy" data-vx-reveal>
            <p className="vx-kicker">Inteligencia marcaria para Chile</p>
            <h1 id="vx-hero-title">Antes de decidir, <em>mira la evidencia.</em></h1>
            <p>VIDENTIA reúne antecedentes marcarios, señales denominativas y visuales, contexto verificable y vigilancia en una investigación clara y trazable.</p>
            <div className="vx-actions">
              <Link href="/demo" className="vx-button vx-button-primary">Investigar una marca <ArrowRight size={16} /></Link>
              <Link href="#producto" className="vx-button vx-button-soft">Ver cómo funciona</Link>
            </div>
            <span className="vx-public-note">El demo se puede usar antes de iniciar sesión</span>
            <div className="vx-proof" aria-label="Fuentes y capacidades"><span>INAPI</span><span>Niza + Viena</span><span>TDPI</span><span>Evidencia trazable</span></div>
          </div>

          <div className="vx-stage" data-vx-stage data-vx-reveal aria-label="Visual representativo de un espacio de investigación VIDENTIA">
            <div className="vx-stage-glow" />
            <div className="vx-stage-graph" aria-hidden="true" />
            <div className="vx-product-window">
              <header className="vx-window-bar"><span>VIDENTIA / espacio de investigación</span><span className="vx-window-live"><i /> Evidencia conectada</span></header>
              <div className="vx-workspace">
                <section className="vx-pane vx-query-pane">
                  <header className="vx-pane-head"><span>01 / consulta</span><b>Visual representativo</b></header>
                  <div className="vx-query-core">
                    <Mark />
                    <small>Marca consultada</small>
                    <strong>Consulta marcaria</strong>
                    <p>Nombre, signo o imagen como punto de partida para abrir antecedentes verificables.</p>
                  </div>
                  <div className="vx-query-tags"><span>Denominación</span><span>Visual</span><span>Ámbito</span></div>
                </section>

                <section className="vx-pane vx-evidence-pane">
                  <header className="vx-pane-head"><span>02 / evidencia</span><b>Fuente antes que conclusión</b></header>
                  <div className="vx-evidence-list">
                    <EvidenceItem letter="A" label="Fuente oficial" title="Antecedente verificable" copy="Solicitud, registro, estado y campos públicos cuando están disponibles." status="Fuente visible" />
                    <EvidenceItem letter="B" label="Señales comparables" title="Nombre y fonética" copy="La cercanía denominativa se explica sin convertirla en un veredicto." status="Señal separada" />
                    <EvidenceItem letter="C" label="Contexto visual" title="Elementos y Viena" copy="La lectura figurativa aparece sólo cuando existe evidencia comparable." status="Explicable" />
                    <EvidenceItem letter="D" label="Ámbito" title="Clases y relación" copy="Niza ayuda a entender el campo de productos o servicios observado." status="Contextualizado" />
                  </div>
                </section>

                <aside className="vx-pane vx-context-pane">
                  <header className="vx-pane-head"><span>03 / contexto</span><b>Qué se conecta</b></header>
                  <div className="vx-context-item"><small>Titular</small><strong>Sólo si está verificado</strong></div>
                  <div className="vx-context-item"><small>Precedentes</small><strong>Comparables y revisables</strong></div>
                  <div className="vx-context-item"><small>Historial</small><strong>Con fuente visible</strong></div>
                  <div className="vx-context-item"><small>Vigilancia</small><strong>Cambios posteriores</strong></div>
                </aside>
              </div>
              <div className="vx-decision">
                <div><span>Qué significa esto</span><strong>La evidencia queda organizada para decidir qué requiere revisión profesional.</strong></div>
                <span className="vx-decision-rule">Fuente ≠ análisis ≠ decisión jurídica</span>
              </div>
              <footer className="vx-stage-caption"><span>Visual representativo · no contiene un expediente real</span><span>Sin score opaco</span></footer>
            </div>
            <div className="vx-float-source"><small>Fuente</small><strong>Origen visible</strong><p>La procedencia de cada antecedente no se oculta detrás del análisis.</p></div>
            <div className="vx-float-action"><small>Siguiente acción</small><strong>Revisar evidencia</strong><p>La plataforma organiza la revisión; la decisión jurídica sigue siendo humana.</p></div>
          </div>
        </div>
      </section>

      <section className="vx-trust-rail" aria-label="Principios del producto">
        <div className="vx-shell vx-trust-grid">
          <div className="vx-trust-intro"><p>VIDENTIA no intenta reemplazar una fuente oficial ni convertir señales técnicas en una respuesta jurídica automática.</p></div>
          <div className="vx-trust-item"><span>01 / fuente</span><strong>Origen visible</strong></div>
          <div className="vx-trust-item"><span>02 / señales</span><strong>Separadas</strong></div>
          <div className="vx-trust-item"><span>03 / contexto</span><strong>Verificable</strong></div>
          <div className="vx-trust-item"><span>04 / decisión</span><strong>Humana</strong></div>
        </div>
      </section>

      <section id="producto" className="vx-section vx-story">
        <div className="vx-shell vx-story-grid">
          <div className="vx-story-copy" data-vx-reveal>
            <p className="vx-eyebrow">Producto / evidencia conectada</p>
            <h2>Una investigación no es una lista de <em>resultados.</em></h2>
            <p>Es una secuencia de fuentes, señales, relaciones y cambios que debe poder volver a revisarse. VIDENTIA conserva esa estructura para que el contexto no se pierda entre búsquedas aisladas.</p>
            <div className="vx-story-rule">La prioridad organiza la revisión. No equivale a registrabilidad, riesgo jurídico ni una conclusión de INAPI o TDPI.</div>
          </div>
          <div className="vx-story-stack">
            {story.map((item) => (
              <article key={item.index} className="vx-story-row" data-vx-reveal>
                <span>{item.index}</span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
                <div className="vx-story-meta">{item.meta.map((tag) => <span key={tag}>{tag}</span>)}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="vx-photo" aria-label="Escena editorial de investigación documental">
        <div className="vx-photo-media" aria-hidden="true" />
        <div className="vx-shell vx-photo-shell">
          <div className="vx-photo-copy" data-vx-reveal>
            <p className="vx-eyebrow">Investigación asistida</p>
            <h2>Del expediente a una <em>red de evidencia.</em></h2>
            <p>La investigación gana claridad cuando documentos, signos, titulares, clases y precedentes se leen como partes de un mismo contexto, manteniendo separadas la fuente y la interpretación.</p>
            <span className="vx-photo-note">Fotografía editorial · no representa un expediente real</span>
          </div>
          <div className="vx-photo-overlay" data-vx-reveal>
            <header><span>VIDENTIA / nota de campo</span><span>Contexto antes de decidir</span></header>
            <div className="vx-photo-overlay-row"><span>A</span><div><strong>Fuente pública</strong><p>La evidencia conserva su procedencia.</p></div><em>Verificable</em></div>
            <div className="vx-photo-overlay-row"><span>B</span><div><strong>Relaciones</strong><p>Titular, clases, historial y precedentes sólo cuando existen.</p></div><em>Contexto</em></div>
            <div className="vx-photo-overlay-row"><span>C</span><div><strong>Seguimiento</strong><p>Los cambios posteriores vuelven al mismo caso o vigilancia.</p></div><em>Trazable</em></div>
          </div>
        </div>
      </section>

      <section className="vx-section vx-compare">
        <div className="vx-shell">
          <div className="vx-section-head" data-vx-reveal>
            <div><p className="vx-eyebrow">Comparación visual</p><h2>Compara estructura, no un <em>porcentaje.</em></h2></div>
            <p>Una comparación útil explica qué rasgos merecen atención. Por eso VIDENTIA presenta señales visuales separadas y conserva el contexto marcario alrededor de ellas.</p>
          </div>
          <div className="vx-compare-board" data-vx-reveal>
            <article className="vx-compare-side">
              <header><span>Visual representativo</span><b>Referencias abstractas</b></header>
              <div className="vx-compare-visual"><Mark variant="a" /><span className="vx-vs">VS</span><Mark variant="b" /></div>
              <p className="vx-compare-caption">Geometría abstracta para explicar el método. No representa marcas ni expedientes reales.</p>
            </article>
            <article className="vx-compare-side">
              <header><span>Lectura técnica</span><b>Señales por separado</b></header>
              <div className="vx-evidence-list">
                <EvidenceItem letter="A" label="Contorno" title="Estructura observable" copy="Se describe el rasgo compartido o diferenciador sin fundirlo en un score global." status="Explicable" />
                <EvidenceItem letter="B" label="Composición" title="Relación entre elementos" copy="La lectura visual conserva qué parte de la imagen motiva la comparación." status="Revisable" />
                <EvidenceItem letter="C" label="Ámbito" title="Contexto marcario" copy="La señal visual se interpreta junto a clases y antecedentes, no de forma aislada." status="Contextualizado" />
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="metodo" className="vx-section vx-flow">
        <div className="vx-shell">
          <div className="vx-flow-head" data-vx-reveal><p className="vx-eyebrow">Cómo funciona</p><h2>Busca. Entiende. Decide. Vigila.</h2></div>
          <div className="vx-flow-grid" data-vx-reveal>
            {flow.map(([title, copy, note], index) => (
              <article className="vx-flow-step" key={title}>
                <span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p><small>{note}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="empresas" className="vx-section vx-enterprise">
        <div className="vx-shell vx-enterprise-grid">
          <div className="vx-enterprise-copy" data-vx-reveal>
            <p className="vx-eyebrow">Para organizaciones</p>
            <h2>La misma trazabilidad, en plataforma o API.</h2>
            <p>Equipos legales, de innovación o propiedad industrial pueden investigar desde la aplicación o integrar capacidades marcarias dentro de sus propios procesos.</p>
          </div>
          <div className="vx-offer-list" data-vx-reveal>
            <article className="vx-offer"><span>01</span><div><h3>VIDENTIA Enterprise</h3><p>Investigación, casos, evidencia, colaboración y vigilancia dentro de un mismo espacio de trabajo.</p></div><Link href="/contacto">Hablar con el equipo <ArrowRight size={14} /></Link></article>
            <article className="vx-offer"><span>02</span><div><h3>VIDENTIA API</h3><p>Capacidades marcarias integrables en sistemas y procesos del cliente, con el mismo criterio de trazabilidad.</p></div><Link href="/contacto">Explorar integración <ArrowRight size={14} /></Link></article>
            <article className="vx-offer"><span>03</span><div><h3>Demo público</h3><p>Una primera investigación puede realizarse antes de iniciar sesión para entender la experiencia y la evidencia disponible.</p></div><Link href="/demo">Probar sin cuenta <ArrowRight size={14} /></Link></article>
          </div>
        </div>
      </section>

      <section className="vx-final">
        <div className="vx-shell" data-vx-reveal>
          <p className="vx-eyebrow">VIDENTIA · by N3uralia</p>
          <h2>Investiga antes de decidir. <em>Conserva la evidencia después.</em></h2>
          <p>Puedes ver y probar VIDENTIA antes de iniciar sesión. El acceso privado queda reservado para guardar casos, colaborar y activar vigilancia.</p>
          <div className="vx-actions"><Link href="/demo" className="vx-button vx-button-primary">Probar VIDENTIA sin cuenta <ArrowRight size={16} /></Link><Link href="/auth/login" className="vx-button vx-button-soft">Iniciar sesión</Link></div>
        </div>
      </section>

      <footer className="vx-footer">
        <div className="vx-shell vx-footer-grid">
          <div className="vx-footer-brand"><strong>VIDENTIA</strong><span>Inteligencia para marcas en Chile</span></div>
          <p>VIDENTIA apoya investigación y revisión de evidencia. No reemplaza la evaluación jurídica profesional ni las fuentes oficiales.</p>
          <span className="vx-footer-credit">Un desarrollo de <a href="https://www.n3uralia.com" target="_blank" rel="noreferrer">N3uralia</a></span>
        </div>
      </footer>
    </main>
  )
}
