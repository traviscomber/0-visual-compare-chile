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
  ["Decide", "Pone la evidencia en contexto para priorizar qué requiere revisión profesional, sin dictar un resultado jurídico."],
  ["Vigila", "Conserva la investigación y detecta cambios posteriores."],
]

const faqs = [
  ["¿Qué es VIDENTIA?", "Una plataforma de inteligencia marcaria para Chile que reúne búsqueda, evaluación, contexto y vigilancia con evidencia trazable."],
  ["¿VIDENTIA reemplaza a INAPI?", "No. INAPI mantiene la fuente oficial. VIDENTIA organiza antecedentes y contexto para facilitar investigación y seguimiento."],
  ["¿Entrega una opinión legal?", "No. VIDENTIA apoya investigación y priorización. La evaluación jurídica final corresponde al profesional responsable."],
]

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "VIDENTIA",
  url: "https://videntia.app",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  inLanguage: "es-CL",
  description: "Plataforma de inteligencia marcaria para búsqueda, evaluación y vigilancia de marcas en Chile.",
}

function Mark({ variant = "a" }: { variant?: "a" | "b" | "c" }) {
  return <span className={`v-abstract-mark v-abstract-mark--${variant}`} aria-hidden="true"><i /></span>
}

export default function LandingPage() {
  return (
    <main className="v-home">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <nav className="v-nav">
        <div className="v-shell v-nav-inner">
          <Link href="/" aria-label="VIDENTIA" className="v-brand"><span className="v-mark">V</span><span><span className="v-word">VIDENTIA</span><span className="v-by">by N3uralia</span></span></Link>
          <div className="v-nav-links">
            <Link href="#producto">Producto</Link><Link href="#metodo">Cómo funciona</Link><Link href="#empresas">Empresas y API</Link>
            <Link href="/auth/login" className="v-btn v-btn--ghost">Iniciar sesión</Link><Link href="/demo" className="v-btn v-btn--solid">Probar VIDENTIA <ArrowRight size={15}/></Link>
          </div>
        </div>
      </nav>

      <section className="v-hero">
        <div className="v-shell v-hero-grid">
          <div className="v-hero-copy v-reveal">
            <p className="v-kicker"><span /> Inteligencia marcaria para Chile</p>
            <h1>Investiga una marca con <em>evidencia</em> y <em>contexto verificable.</em></h1>
            <p className="v-lede">VIDENTIA reúne antecedentes marcarios, señales denominativas y visuales, contexto del titular y vigilancia en una revisión clara y trazable.</p>
            <div className="v-actions"><Link href="/demo" className="v-btn v-btn--primary">Evaluar una marca <ArrowRight size={16}/></Link><Link href="/contacto" className="v-btn v-btn--ghost">Contacto comercial</Link></div>
            <div className="v-proof-chips"><span>INAPI</span><span>Niza + Viena</span><span>TDPI</span><span>Evidencia trazable</span></div>
          </div>

          <div className="v-hero-product v-reveal" aria-label="Visual representativo de una investigación VIDENTIA">
            <div className="v-window-bar"><span>Investigación marcaria</span><span className="v-live"><i/> Evidencia conectada</span></div>
            <div className="v-hero-case">
              <div className="v-case-query"><small>Marca consultada</small><Mark variant="a"/><strong>Consulta marcaria</strong><p>Antecedentes organizados por fuente y contexto.</p></div>
              <div className="v-evidence-rail">
                <div><span>Fuente oficial</span><b>Disponible</b></div><div><span>Denominación</span><b>Comparada</b></div><div><span>Visual</span><b>Cuando aplica</b></div><div><span>Ámbito</span><b>Contextualizado</b></div><div><span>Precedentes</span><b>Revisables</b></div>
              </div>
            </div>
            <div className="v-hero-foot"><span>Visual representativo</span><span>Sin score opaco</span></div>
          </div>
        </div>
      </section>

      <section id="producto" className="v-section v-evidence-section">
        <div className="v-shell">
          <div className="v-section-head v-reveal"><div><p className="v-eyebrow">Evidencia y explicabilidad</p><h2>Todo hallazgo debe mostrar <em>su fuente.</em></h2></div><p>VIDENTIA separa antecedentes oficiales de análisis. Así puedes entender qué encontró, de dónde viene y qué parte requiere revisión profesional.</p></div>
          <div className="v-evidence-grid">
            <article className="v-source-panel v-reveal">
              <div className="v-panel-top"><span>Fuente oficial · INAPI</span><span>Consulta pública</span></div>
              <h3>Antecedente marcario verificable</h3><p className="v-muted">Estructura inspirada en campos públicos de consulta: solicitud, registro, clases, signo, titular y estado.</p>
              <div className="v-source-table"><div className="v-row v-row--head"><span>Campo</span><span>Lectura</span></div><div className="v-row"><span>Solicitud / registro</span><b>Disponible en fuente</b></div><div className="v-row"><span>Signo o denominación</span><b>Identificado</b></div><div className="v-row"><span>Clase(s)</span><b>Contextualizadas</b></div><div className="v-row"><span>Titular</span><b>Sólo si está verificado</b></div><div className="v-row"><span>Estado</span><b>Fuente visible</b></div></div>
              <footer>VIDENTIA organiza la evidencia · no reemplaza la fuente oficial.</footer>
            </article>
            <div className="v-signal-grid v-reveal">{signals.map(({icon:Icon,label,title,copy})=><article key={label} className="v-signal-card"><Icon/><small>{label}</small><h3>{title}</h3><p>{copy}</p></article>)}</div>
          </div>
        </div>
      </section>

      <section className="v-section v-context-section">
        <div className="v-shell v-context-grid">
          <div className="v-context-visual v-reveal" aria-label="Visual representativo de contexto marcario conectado">
            <div className="v-context-card v-context-owner"><small>Titular verificado</small><strong>Titular del expediente</strong><p>Fuente oficial disponible</p></div>
            <div className="v-context-card v-context-history"><small>Historial</small><span>Solicitud presentada</span><span>Admitida a trámite</span><span>Estado actual</span></div>
            <div className="v-context-core"><small>Expediente marcario</small><h3>Caso en revisión</h3><p>Antecedentes · titular · clases · historial · precedentes</p><span className="v-pill">Contexto verificable</span></div>
            <div className="v-context-card v-context-family"><small>Familia marcaria</small><span>Marca relacionada A</span><span>Marca relacionada B</span><span>Marca relacionada C</span></div>
            <div className="v-context-card v-context-classes"><small>Clases y ámbito</small><span>Servicios relacionados</span><span>Tecnología y análisis</span></div>
            <div className="v-context-card v-context-sources"><small>Fuentes oficiales</small><strong>INAPI · TDPI · registros</strong><p>Trazabilidad conservada</p></div>
            <span className="v-context-caption">Evidencia conectada · visual representativo</span>
          </div>
          <div className="v-context-copy v-reveal"><p className="v-eyebrow">Contexto verificable</p><h2>La marca no se revisa aislada.</h2><p>Cuando existe evidencia verificable, VIDENTIA conecta antecedentes con titular, familia marcaria, clases y precedentes sin confundir evidencia con inferencia.</p><div className="v-checks">{["Fuente oficial siempre visible","Titular sólo cuando está verificado","Contexto sin predicción jurídica"].map(x=><div key={x}><Check size={17}/>{x}</div>)}</div></div>
        </div>
      </section>

      <section className="v-editorial" aria-label="Investigación asistida por evidencia">
        <div className="v-shell v-editorial-grid">
          <div className="v-editorial-copy v-reveal">
            <p className="v-eyebrow">Investigación asistida</p>
            <h2>De un expediente a una <em>red de evidencia.</em></h2>
            <p>La investigación gana claridad cuando documentos, signos, titulares, clases y antecedentes se leen como partes de un mismo contexto, manteniendo separadas la fuente y la interpretación.</p>
            <span className="v-editorial-note">Fotografía editorial · no representa un expediente real</span>
          </div>
          <div className="v-editorial-frame v-reveal" role="img" aria-label="Escena editorial de revisión documental; imagen atmosférica y no captura del producto">
            <div className="v-editorial-index"><span>VIDENTIA / NOTA DE CAMPO</span><span>Contexto antes de decidir</span></div>
            <div className="v-editorial-tags"><span>Fuente pública</span><span>Relaciones</span><span>Revisión profesional</span><span>Seguimiento</span></div>
          </div>
        </div>
      </section>

      <section id="metodo" className="v-section v-process-section">
        <div className="v-shell"><div className="v-process-head v-reveal"><p className="v-eyebrow">Cómo funciona</p><h2>Busca. Entiende. Decide. Vigila.</h2></div><div className="v-process-grid v-reveal">{workflow.map(([title,copy],i)=><article key={title} className="v-process-step"><span>0{i+1}</span><i/><h3>{title}</h3><p>{copy}</p></article>)}</div></div>
      </section>

      <section className="v-section v-compare-section">
        <div className="v-shell"><div className="v-section-head v-reveal"><div><p className="v-eyebrow">Comparación visual</p><h2>Compara estructura, no decoración.</h2></div><p>La comparación visual debe mostrar qué elementos se parecen o se diferencian. Los ejemplos siguientes son abstractos y no representan marcas reales.</p></div>
          <div className="v-compare-grid v-reveal">
            <article className="v-compare"><header><span>Coincidencia alta</span><b>Estructura próxima</b></header><div className="v-pair"><div><Mark variant="a"/><small>Referencia A</small></div><i>VS</i><div><Mark variant="b"/><small>Referencia B</small></div></div><footer>Contorno · proporción · elemento dominante</footer></article>
            <article className="v-compare"><header><span>Similitud parcial</span><b>Rasgos compartidos</b></header><div className="v-pair"><div><Mark variant="a"/><small>Referencia A</small></div><i>VS</i><div><Mark variant="c"/><small>Referencia B</small></div></div><footer>Forma · ritmo · composición</footer></article>
            <article className="v-compare"><header><span>Contraste claro</span><b>Identidad diferenciable</b></header><div className="v-pair"><div><Mark variant="b"/><small>Referencia A</small></div><i>VS</i><div><Mark variant="c"/><small>Referencia B</small></div></div><footer>Símbolo · estructura · balance</footer></article>
          </div>
        </div>
      </section>

      <section id="empresas" className="v-section v-enterprise-section"><div className="v-shell v-enterprise-grid"><div className="v-reveal"><p className="v-eyebrow">Para organizaciones</p><h2>Plataforma o API, con la misma trazabilidad.</h2><p>Integra búsqueda, evaluación, contexto y vigilancia marcaria en la operación de tu equipo.</p></div><div className="v-offers v-reveal"><article><small>Plataforma</small><h3>VIDENTIA Enterprise</h3><p>Investigación, casos, evidencia y vigilancia en una experiencia completa.</p></article><article><small>API</small><h3>VIDENTIA API</h3><p>Capacidades marcarias integradas directamente en sistemas y procesos del cliente.</p></article></div></div><div className="v-shell v-faqs">{faqs.map(([q,a])=><article key={q}><h3>{q}</h3><p>{a}</p></article>)}</div></section>

      <section className="v-final"><div className="v-shell v-reveal"><p className="v-eyebrow">VIDENTIA</p><h2>Investiga antes de decidir. Conserva la evidencia después.</h2><div className="v-actions"><Link href="/demo" className="v-btn v-btn--primary">Probar VIDENTIA <ArrowRight size={16}/></Link><Link href="/contacto" className="v-btn v-btn--ghost">Hablar con el equipo</Link></div></div></section>
      <footer className="v-footer">
        <div className="v-shell v-footer-grid">
          <div className="v-footer-brand"><strong>VIDENTIA</strong><span>Inteligencia para marcas en Chile</span></div>
          <p>VIDENTIA apoya investigación y revisión de evidencia. No reemplaza la evaluación jurídica profesional ni las fuentes oficiales.</p>
          <span className="v-footer-credit">Un desarrollo de <a href="https://www.n3uralia.com" target="_blank" rel="noreferrer">N3uralia</a></span>
        </div>
      </footer>
    </main>
  )
}
