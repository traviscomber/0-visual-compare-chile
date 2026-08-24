import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Check, Fingerprint, Layers3, Search, Waves } from "lucide-react"

const signals = [
  { icon: Search, label: "Denominación", title: "Lectura verbal", copy: "Ortografía, estructura, términos dominantes y variantes relevantes." },
  { icon: Waves, label: "Fonética", title: "Proximidad sonora", copy: "Pronunciación y cercanía fonética explicadas por separado." },
  { icon: Fingerprint, label: "Visual", title: "Huella figurativa", copy: "Elementos compartidos, composición y señales visuales comparables." },
  { icon: Layers3, label: "Ámbito", title: "Contexto comercial", copy: "Clases Niza y relación entre productos o servicios." },
]

const workflow = [
  ["Busca", "Parte desde un nombre, logo, fotografía o una combinación."],
  ["Entiende", "VIDENTIA ordena antecedentes, señales y evidencia verificable."],
  ["Revisa", "Identifica por qué un antecedente merece atención sin depender de un score opaco."],
  ["Vigila", "Conserva la investigación y detecta cambios posteriores."],
]

const platformIncludes = [
  "Puesta en marcha y configuración inicial",
  "Búsqueda, evaluación, casos y vigilancia",
  "Contexto del titular, precedentes y evidencia trazable",
  "Usuarios, onboarding y soporte de implementación",
]

const apiIncludes = [
  "Búsqueda marcaria autenticada y medida",
  "Ingesta y comparación de imágenes",
  "Autenticación, cuotas y registro de consumo",
  "Integración con sistemas del cliente",
]

const faqs = [
  ["¿Qué es VIDENTIA?", "Una plataforma de inteligencia marcaria para Chile que reúne búsqueda, evaluación, contexto y vigilancia con evidencia trazable."],
  ["¿VIDENTIA reemplaza a INAPI?", "No. INAPI mantiene la fuente oficial. VIDENTIA organiza antecedentes y contexto para facilitar investigación y seguimiento."],
  ["¿Cómo se contrata?", "VIDENTIA se contrata como plataforma empresarial o como API. La implementación de plataforma parte desde $5.000.000 CLP y la API desde $500.000 CLP al mes más consumo. El alcance final depende del proyecto."],
  ["¿Entrega una opinión legal?", "No. VIDENTIA apoya investigación y priorización. La evaluación jurídica final corresponde al profesional responsable."],
]

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.n3uralia.com/#organization",
      name: "N3uralia",
      url: "https://www.n3uralia.com",
      description: "Empresa de desarrollo de software, automatización e inteligencia aplicada.",
    },
    {
      "@type": "WebApplication",
      "@id": "https://videntia.app/#software",
      name: "VIDENTIA",
      url: "https://videntia.app",
      inLanguage: "es-CL",
      countriesSupported: "CL",
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Legal technology",
      operatingSystem: "Web",
      description: "Plataforma de inteligencia marcaria para búsqueda, evaluación y vigilancia de marcas en Chile.",
      creator: { "@id": "https://www.n3uralia.com/#organization" },
      publisher: { "@id": "https://www.n3uralia.com/#organization" },
      featureList: ["Búsqueda de antecedentes marcarios", "Análisis denominativo y fonético", "Análisis visual", "Clases Niza", "Clasificación de Viena", "Precedentes TDPI", "Vigilancia de marcas", "Casos y evidencia", "API empresarial"],
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
    },
  ],
}

export default function LandingPage() {
  return (
    <main className="v-home">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <nav className="v-nav">
        <div className="v-shell v-nav-inner">
          <Link href="/" aria-label="VIDENTIA" className="v-brand">
            <span className="v-mark">V</span>
            <span><span className="v-word">VIDENTIA</span><span className="v-by">by N3uralia</span></span>
          </Link>
          <div className="v-nav-links">
            <Link href="#producto" className="v-nav-link">Producto</Link>
            <Link href="#metodo" className="v-nav-link">Cómo funciona</Link>
            <Link href="#empresas" className="v-nav-link">Empresas y API</Link>
            <Link href="/auth/login" className="v-cta-secondary">Iniciar sesión</Link>
            <Link href="/demo" className="v-cta">Probar VIDENTIA <ArrowRight size={15} /></Link>
          </div>
        </div>
      </nav>

      <section className="v-hero">
        <div className="v-shell v-hero-grid">
          <div className="v-reveal">
            <div className="v-kicker"><span className="v-dot" /> Inteligencia marcaria para Chile</div>
            <h1 className="v-title">Investiga una marca con <em>evidencia y contexto.</em></h1>
            <p className="v-lede">VIDENTIA reúne antecedentes marcarios, señales denominativas y visuales, contexto del titular y vigilancia en una revisión clara y trazable.</p>
            <div className="v-actions">
              <Link href="/demo" className="v-cta v-cta-primary">Analizar una marca <ArrowRight size={16} /></Link>
              <Link href="/contacto" className="v-cta-secondary">Contacto comercial</Link>
            </div>
            <div className="v-source-row"><span>INAPI</span><span>Niza + Viena</span><span>TDPI</span><span>Evidencia trazable</span></div>
          </div>

          <div className="v-hero-media v-reveal">
            <div className="v-hero-photo">
              <Image src="/images/brand-comparison-hero.png" alt="Comparación visual de marcas y elementos gráficos" fill priority sizes="(max-width: 1050px) 100vw, 55vw" />
            </div>
            <div className="v-product-float" aria-label="Vista representativa del producto VIDENTIA">
              <div className="v-product-top"><span className="v-product-label">Investigación en curso</span><span className="v-status"><i /> Evidencia conectada</span></div>
              <div className="v-product-body">
                <div className="v-query"><span className="v-product-label">Marca a evaluar</span><h3>Consulta marcaria</h3><p>Antecedentes ordenados por relevancia, fuente y contexto verificable.</p></div>
                <div className="v-signal-list">
                  <div className="v-signal"><span>Denominación</span><span>Comparada</span></div>
                  <div className="v-signal"><span>Fonética</span><span>Comparada</span></div>
                  <div className="v-signal"><span>Visual</span><span>Cuando aplica</span></div>
                  <div className="v-signal"><span>Ámbito</span><span>Contextualizado</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="producto" className="v-section">
        <div className="v-shell">
          <div className="v-head v-reveal">
            <div><p className="v-eyebrow">Evidencia explicable</p><h2 className="v-h2">Una investigación no cabe en un solo porcentaje.</h2></div>
            <p className="v-head-copy">VIDENTIA separa las señales para mostrar qué encontró, de dónde viene y por qué merece revisión. La evidencia permanece visible durante todo el análisis.</p>
          </div>
          <div className="v-proof-grid">
            <figure className="v-proof-visual v-parallax v-reveal">
              <Image src="/images/logo-comparison-hero.jpg" alt="Ejemplo visual de comparación de identidades de marca" fill sizes="(max-width: 1050px) 100vw, 52vw" />
              <figcaption className="v-proof-overlay"><h3>Comparación visual con contexto.</h3><p>La imagen se examina junto a denominación, fonética y cobertura comercial; no como una señal aislada.</p></figcaption>
            </figure>
            <div className="v-instruments v-reveal">
              {signals.map(({ icon: Icon, label, title, copy }) => (
                <article className="v-instrument" key={label}><Icon /><small>{label}</small><h3>{title}</h3><p>{copy}</p></article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="v-section v-section-alt">
        <div className="v-shell v-editorial">
          <figure className="v-editorial-photo v-parallax v-reveal">
            <Image src="/images/trademark-protection.png" alt="Escena visual relacionada con protección e investigación de marcas" fill sizes="(max-width: 1050px) 100vw, 58vw" />
          </figure>
          <div className="v-editorial-copy v-reveal">
            <p className="v-eyebrow">Contexto verificable</p>
            <h2 className="v-h2">La marca no se revisa aislada de quien está detrás.</h2>
            <p>Cuando existe evidencia verificable, VIDENTIA conecta antecedentes con titular, familia marcaria y precedentes sin confundir evidencia con inferencia.</p>
            <div className="v-checks">
              {["Fuente oficial siempre visible", "Titular sólo cuando está verificado", "Contexto sin predicción jurídica"].map(item => <div className="v-check" key={item}><Check /> {item}</div>)}
            </div>
          </div>
        </div>
      </section>

      <section id="metodo" className="v-section">
        <div className="v-shell v-process">
          <div className="v-process-intro v-reveal"><p className="v-eyebrow">Cómo funciona</p><h2 className="v-h2">De una búsqueda puntual a una investigación continua.</h2></div>
          <div className="v-process-list v-reveal">
            {workflow.map(([title, copy], index) => <div className="v-step" key={title}><span className="v-step-index">0{index + 1}</span><h3>{title}</h3><p>{copy}</p></div>)}
          </div>
        </div>
      </section>

      <section className="v-section v-section-alt">
        <div className="v-shell">
          <div className="v-head v-reveal">
            <div><p className="v-eyebrow">Inteligencia visual</p><h2 className="v-h2">Mira el conjunto, después entra al detalle.</h2></div>
            <p className="v-head-copy">Las coincidencias visuales se revisan dentro de una secuencia que mantiene la imagen, su contexto y el resto de señales disponibles en el mismo caso.</p>
          </div>

          <div className="v-visual-grid v-reveal" aria-label="Ejemplos representativos de comparación visual">
            <article className="v-compare-card v-compare-card--primary">
              <div className="v-compare-head">
                <div><p className="v-compare-kicker">Comparación visual</p><h3 className="v-compare-title">Misma categoría, composición prácticamente idéntica.</h3></div>
                <span className="v-compare-state">Coincidencia alta</span>
              </div>
              <div className="v-compare-pair">
                <div className="v-compare-side"><span className="v-compare-label">Referencia A</span><Image src="/certificate-a.jpg" alt="Certificado base usado como referencia A en una comparación visual de alta similitud" fill sizes="(max-width: 700px) 42vw, 29vw" /></div>
                <div className="v-compare-divider"><span className="v-compare-vs">VS</span></div>
                <div className="v-compare-side"><span className="v-compare-label">Referencia B</span><Image src="/certificate-a.jpg" alt="Mismo certificado base usado como referencia B para representar una composición prácticamente idéntica" fill sizes="(max-width: 700px) 42vw, 29vw" /></div>
              </div>
              <div className="v-compare-meta"><span><strong>Lectura</strong> · estructura y elementos gráficos</span><span>Ejemplo representativo</span></div>
            </article>

            <article className="v-compare-card v-compare-card--compact">
              <div className="v-compare-head">
                <div><p className="v-compare-kicker">Detalle figurativo</p><h3 className="v-compare-title">Productos relacionados, señales visuales distintas.</h3></div>
                <span className="v-compare-state">Similitud parcial</span>
              </div>
              <div className="v-compare-pair">
                <div className="v-compare-side"><Image src="/product-a.jpg" alt="Primer producto usado como ejemplo representativo" fill sizes="(max-width: 700px) 42vw, 18vw" /></div>
                <div className="v-compare-divider"><span className="v-compare-vs">VS</span></div>
                <div className="v-compare-side"><Image src="/product-b.jpg" alt="Segundo producto usado como ejemplo representativo" fill sizes="(max-width: 700px) 42vw, 18vw" /></div>
              </div>
              <div className="v-compare-meta"><span><strong>Señales</strong> · forma, color, etiqueta</span><span>Ejemplo</span></div>
            </article>

            <article className="v-compare-card v-compare-card--compact">
              <div className="v-compare-head">
                <div><p className="v-compare-kicker">Evidencia relacionada</p><h3 className="v-compare-title">Signos de la misma clase, identidad diferenciable.</h3></div>
                <span className="v-compare-state v-compare-state--muted">Contraste claro</span>
              </div>
              <div className="v-compare-pair">
                <div className="v-compare-side"><Image src="/test-logo-a.png" alt="Primer signo gráfico usado como ejemplo representativo" fill sizes="(max-width: 700px) 42vw, 18vw" /></div>
                <div className="v-compare-divider"><span className="v-compare-vs">VS</span></div>
                <div className="v-compare-side"><Image src="/test-logo-b.png" alt="Segundo signo gráfico usado como ejemplo representativo" fill sizes="(max-width: 700px) 42vw, 18vw" /></div>
              </div>
              <div className="v-compare-meta"><span><strong>Lectura</strong> · símbolo y composición</span><span>Ejemplo</span></div>
            </article>
          </div>
        </div>
      </section>

      <section id="empresas" className="v-section">
        <div className="v-shell">
          <div className="v-enterprise">
            <div className="v-reveal"><p className="v-eyebrow">Para organizaciones</p><h2 className="v-h2">Integra VIDENTIA como plataforma o como infraestructura.</h2><p className="v-head-copy" style={{justifySelf:"start",marginTop:24}}>Dos formas de incorporar búsqueda, evaluación, contexto y vigilancia marcaria a la operación del equipo.</p></div>
            <div className="v-offers v-reveal">
              <article className="v-offer"><span>Plataforma</span><h3>VIDENTIA Enterprise</h3><p>Experiencia completa para equipos que necesitan investigar, organizar casos y mantener vigilancia.</p><ul>{platformIncludes.map(item => <li key={item}>— {item}</li>)}</ul><div className="v-price">Implementación desde $5.000.000 CLP</div></article>
              <article className="v-offer"><span>API</span><h3>VIDENTIA API</h3><p>Capacidades marcarias integradas directamente en sistemas y procesos del cliente.</p><ul>{apiIncludes.map(item => <li key={item}>— {item}</li>)}</ul><div className="v-price">Desde $500.000 CLP / mes + consumo</div></article>
            </div>
          </div>
          <div className="v-faqs v-reveal">{faqs.map(([q,a]) => <div className="v-faq" key={q}><h3>{q}</h3><p>{a}</p></div>)}</div>
        </div>
      </section>

      <section className="v-final v-section-alt">
        <div className="v-shell v-reveal"><p className="v-eyebrow">VIDENTIA</p><h2 className="v-h2">Investiga antes de decidir. Conserva la evidencia después.</h2><p>Prueba el flujo público o conversa con N3uralia para evaluar una implementación para tu organización.</p><div className="v-actions"><Link href="/demo" className="v-cta v-cta-primary">Probar VIDENTIA <ArrowRight size={16}/></Link><Link href="/contacto" className="v-cta-secondary">Hablar con el equipo</Link></div></div>
      </section>

      <footer className="v-footer"><div className="v-shell v-footer-inner"><span>VIDENTIA · Inteligencia marcaria para Chile</span><span>Una solución de N3uralia</span></div></footer>
    </main>
  )
}