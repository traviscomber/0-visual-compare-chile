"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Check,
  Database,
  Gauge,
  ImageIcon,
  LockKeyhole,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Workflow,
  X,
  Zap,
} from "lucide-react"

const slides = [
  { id: "inicio", label: "Visión" },
  { id: "producto", label: "Producto" },
  { id: "datos", label: "Datos" },
  { id: "eficiencia", label: "Eficiencia" },
  { id: "flujo", label: "Flujo" },
  { id: "entrega", label: "Entrega" },
]

const metrics = [
  { value: "66.595", label: "registros sincronizados", detail: "Base histórica INAPI" },
  { value: "177", label: "ciclos completados", detail: "Con trazabilidad operativa" },
  { value: "40×", label: "más rápido en consulta local", detail: "Frente a una consulta remota" },
  { value: "73%", label: "de consultas en caché", detail: "Menor consumo de cuota" },
]

export default function ClientPresentationPage() {
  const [active, setActive] = useState("inicio")
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0.1, 0.5, 0.8] },
    )

    slides.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })
    return () => observer.disconnect()
  }, [])

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    setMenuOpen(false)
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <button className="flex items-center gap-3 text-left" onClick={() => goTo("inicio")} aria-label="Ir al inicio">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <ImageIcon className="h-4 w-4" />
            </span>
            <span>
              <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Visual Compare</span>
              <span className="block text-sm font-semibold tracking-tight">Chile · Presentación ejecutiva</span>
            </span>
          </button>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Secciones">
            {slides.map((slide) => (
              <button
                key={slide.id}
                onClick={() => goTo(slide.id)}
                className={`rounded-lg px-3 py-2 text-xs transition-colors ${active === slide.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary/10 hover:text-foreground"}`}
              >
                {slide.label}
              </button>
            ))}
          </nav>

          <button className="rounded-lg p-2 text-muted-foreground lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <nav className="border-t border-border bg-card px-5 py-3 lg:hidden" aria-label="Secciones móviles">
            {slides.map((slide) => (
              <button key={slide.id} onClick={() => goTo(slide.id)} className="block w-full border-b border-border/60 py-3 text-left text-sm last:border-0">
                {slide.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      <section id="inicio" className="relative flex min-h-screen items-center border-b border-border/70 pt-16">
        <div className="mx-auto grid w-full max-w-7xl gap-14 px-5 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-28">
          <div>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Plataforma operativa
            </div>
            <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-[-0.05em] text-foreground sm:text-6xl lg:text-7xl">
              La decisión marcaria empieza con evidencia.
            </h1>
            <p className="mt-7 max-w-xl text-pretty text-lg leading-8 text-muted-foreground">
              Visual Compare Chile conecta comparación de imágenes, inteligencia de marcas y datos históricos para transformar una revisión manual en un flujo trazable y accionable.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <button onClick={() => goTo("producto")} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5">
                Ver funcionamiento <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={() => goTo("eficiencia")} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-secondary/10">
                Ver eficiencia <Gauge className="h-4 w-4 text-primary" />
              </button>
            </div>
            <div className="mt-12 flex items-center gap-3 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Sistema preparado para operación segura, medible y escalable.
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-primary/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl shadow-primary/10">
              <Image src="/images/brand-comparison-hero.png" alt="Comparación visual de marcas" width={900} height={620} className="h-auto w-full object-cover" priority />
              <div className="grid grid-cols-3 border-t border-border bg-card/95 p-4">
                <div className="border-r border-border px-3"><p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Input</p><p className="mt-1 text-sm font-semibold">Imagen</p></div>
                <div className="border-r border-border px-3"><p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Engine</p><p className="mt-1 text-sm font-semibold">Visión IA</p></div>
                <div className="px-3"><p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Output</p><p className="mt-1 text-sm font-semibold text-primary">Evidencia</p></div>
              </div>
            </div>
          </div>
        </div>
        <button onClick={() => goTo("producto")} className="absolute bottom-7 left-1/2 -translate-x-1/2 text-muted-foreground" aria-label="Continuar"><ArrowDown className="h-5 w-5 animate-bounce" /></button>
      </section>

      <section id="producto" className="border-b border-border/70 bg-card/30 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionKicker>01 · El producto</SectionKicker>
          <div className="mt-5 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div><h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Un solo flujo para comparar, consultar y decidir.</h2><p className="mt-6 leading-7 text-muted-foreground">La plataforma evita saltos entre herramientas. El usuario carga una imagen, consulta antecedentes y recibe una lectura clara de similitud, contexto y trazabilidad.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FeatureCard icon={<ImageIcon />} title="Comparación visual" text="Analiza imágenes de marcas, no solo nombres o texto, y devuelve una señal de similitud para priorizar revisión." />
              <FeatureCard icon={<Search />} title="Consulta inteligente" text="Busca antecedentes por nombre, solicitante, registro y clasificación, usando una base local sincronizada." />
              <FeatureCard icon={<Workflow />} title="Trazabilidad" text="Cada ejecución queda asociada a historial, estados, resultados y una ruta reproducible." />
              <FeatureCard icon={<BarChart3 />} title="Lectura ejecutiva" text="Convierte datos técnicos en indicadores y conclusiones comprensibles para negocio y legal." />
            </div>
          </div>
        </div>
      </section>

      <section id="datos" className="border-b border-border/70 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionKicker>02 · La base de evidencia</SectionKicker>
          <div className="mt-5 grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div><h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Datos propios para depender menos de la consulta remota.</h2><p className="mt-6 max-w-xl leading-7 text-muted-foreground">La sincronización de INAPI y la captura asociada al Diario Oficial convierten información dispersa en una capa consultable, histórica y preparada para análisis.</p><div className="mt-8 flex flex-wrap gap-3"><Pill icon={<Database />} text="INAPI sincronizado" /><Pill icon={<Check />} text="Histórico operativo" /><Pill icon={<ShieldCheck />} text="Auditoría de ciclos" /></div></div>
            <div className="grid grid-cols-2 gap-3">{metrics.map((metric) => <div key={metric.label} className="rounded-2xl border border-border bg-card p-5"><p className="text-3xl font-semibold tracking-[-0.04em] text-primary">{metric.value}</p><p className="mt-3 text-sm font-semibold leading-5">{metric.label}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{metric.detail}</p></div>)}</div>
          </div>
        </div>
      </section>

      <section id="eficiencia" className="border-b border-border/70 bg-primary/5 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionKicker>03 · Tokenless efficiency</SectionKicker>
          <div className="mt-5 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div><h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Gastar bien también es una funcionalidad.</h2><p className="mt-6 max-w-xl leading-7 text-muted-foreground">La política tokenless no significa eliminar controles. Significa diseñar el sistema para consumir lo mínimo necesario: reutilizar resultados, procesar por lotes, respetar cuotas y reservar la computación pesada para los casos que realmente la necesitan.</p><div className="mt-8 space-y-4"><EfficiencyRow icon={<Zap />} title="Caché antes que llamada" text="Una consulta repetida se resuelve localmente cuando existe evidencia vigente." /><EfficiencyRow icon={<Workflow />} title="Procesamiento por ciclos" text="La sincronización se divide en ventanas controladas para evitar saturar APIs." /><EfficiencyRow icon={<Gauge />} title="CPU donde agrega valor" text="La comparación visual y los embeddings se ejecutan de forma focalizada, no indiscriminada." /></div></div>
            <div className="rounded-[2rem] border border-primary/25 bg-card p-6 shadow-xl shadow-primary/10"><div className="flex items-center justify-between border-b border-border pb-5"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Efficiency policy</p><p className="mt-2 text-xl font-semibold">Consumo controlado</p></div><div className="rounded-xl bg-primary/15 p-3 text-primary"><Gauge className="h-6 w-6" /></div></div><div className="space-y-5 pt-6"><Quota label="Llamadas remotas" value="27%" note="el resto se resuelve con datos disponibles" /><Quota label="Consultas en caché" value="73%" note="menos latencia y menor cuota" /><Quota label="Procesos por lote" value="25" note="unidad de sincronización controlada" /></div><div className="mt-6 rounded-xl bg-primary/10 p-4 text-sm leading-6 text-foreground"><strong className="text-primary">Resultado:</strong> más capacidad operativa con el mismo presupuesto técnico.</div></div>
          </div>
        </div>
      </section>

      <section id="flujo" className="border-b border-border/70 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8"><SectionKicker>04 · El recorrido</SectionKicker><h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">De la imagen inicial a una decisión respaldada.</h2><div className="mt-14 grid gap-4 md:grid-cols-4">{[{ n: "01", title: "Carga", text: "El usuario incorpora la imagen o el antecedente a revisar." }, { n: "02", title: "Compara", text: "El motor visual identifica patrones y similitud relevante." }, { n: "03", title: "Contextualiza", text: "La plataforma contrasta con datos INAPI, Niza y Viena." }, { n: "04", title: "Decide", text: "El equipo recibe evidencia, historial y próximos pasos." }].map((step, index) => <div key={step.n} className="relative rounded-2xl border border-border bg-card p-5">{index < 3 && <ArrowRight className="absolute -right-3 top-8 z-10 hidden h-5 w-5 text-primary md:block" />}<p className="font-mono text-xs text-primary">{step.n}</p><h3 className="mt-10 text-xl font-semibold">{step.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{step.text}</p></div>)}</div></div>
      </section>

      <section id="entrega" className="py-24 lg:py-32">
        <div className="mx-auto max-w-5xl px-5 text-center lg:px-8"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"><Sparkles className="h-6 w-6" /></div><SectionKicker className="mt-7">05 · Cierre ejecutivo</SectionKicker><h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">Más evidencia. Menos fricción. Mejor uso de recursos.</h2><p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">Visual Compare Chile entrega una base sólida para acelerar la revisión de marcas, proteger el criterio de decisión y construir una operación digital eficiente.</p><div className="mt-10 flex flex-wrap justify-center gap-3"><button onClick={() => goTo("inicio")} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Volver al inicio <ArrowRight className="h-4 w-4 rotate-180" /></button><span className="inline-flex items-center rounded-xl border border-border bg-card px-5 py-3 font-mono text-xs text-muted-foreground">Documento preparado para revisión del cliente</span></div></div>
      </section>

      <footer className="border-t border-border/70 px-5 py-8 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Visual Compare Chile · Presentación ejecutiva · 2026</footer>
    </main>
  )
}

function SectionKicker({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-primary ${className}`}>{children}</p>
}

function FeatureCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <article className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">{icon}</div><h3 className="mt-5 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>
}

function Pill({ icon, text }: { icon: ReactNode; text: string }) {
  return <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs text-muted-foreground">{icon}<span>{text}</span></span>
}

function EfficiencyRow({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <div className="flex gap-4"><div className="mt-1 text-primary">{icon}</div><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p></div></div>
}

function Quota({ label, value, note }: { label: string; value: string; note: string }) {
  return <div><div className="flex items-center justify-between text-sm"><span className="font-medium">{label}</span><span className="font-mono font-semibold text-primary">{value}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary/20"><div className="h-full rounded-full bg-primary" style={{ width: value }} /></div><p className="mt-2 text-xs text-muted-foreground">{note}</p></div>
}
