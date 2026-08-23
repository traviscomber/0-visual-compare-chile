'use client'

import Link from 'next/link'
import { ArrowRight, BellRing, Building2, CheckCircle2, Database, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const journeys = [
  {
    eyebrow: 'Evaluar',
    title: 'Revisa antes de avanzar.',
    description: 'Revisa antecedentes, similitudes y clases antes de dedicar más tiempo a una marca.',
    icon: ShieldCheck,
  },
  {
    eyebrow: 'Investigar',
    title: 'Conoce empresas y tecnologías.',
    description: 'Busca marcas, patentes e inventores para entender mejor el mercado en Chile.',
    icon: Search,
  },
  {
    eyebrow: 'Monitorear',
    title: 'Sigue los cambios importantes.',
    description: 'Recibe señales sobre nuevas solicitudes sin repetir la misma búsqueda.',
    icon: BellRing,
  },
]

const evidence = [
  'Datos oficiales de INAPI',
  'Sincronización automática diaria',
  'Histórico de patentes 2009–2025',
  'Resultados y fuentes trazables',
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="text-lg font-semibold tracking-tight">Visual Compare</Link>
          <div className="flex items-center gap-2">
            <Link href="/auth/login"><Button variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white">Iniciar sesión</Button></Link>
            <Link href="/auth/signup"><Button className="gap-2 bg-white text-slate-950 hover:bg-slate-200">Empezar ahora <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden px-5 pb-24 pt-36 lg:px-8 lg:pb-32 lg:pt-44">
        <div className="pointer-events-none absolute left-1/2 top-10 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300">
              <Sparkles className="h-4 w-4 text-blue-300" /> Inteligencia de propiedad industrial en Chile
            </div>
            <h1 className="max-w-5xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-8xl">
              Información clara <span className="text-blue-300">antes de decidir.</span>
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
              Revisa marcas, patentes y movimientos relevantes en un solo lugar, con datos de INAPI y apoyo de IA.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/signup"><Button size="lg" className="h-12 gap-2 bg-white px-6 text-slate-950 hover:bg-slate-200">Empezar ahora <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link href="#producto"><Button size="lg" variant="outline" className="h-12 border-white/15 bg-transparent px-6 text-white hover:bg-white/10">Ver cómo funciona</Button></Link>
            </div>
          </div>

          <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
            <div className="bg-slate-950/90 p-5"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Antes</p><p className="mt-2 text-sm text-slate-300">Revisa una marca antes de avanzar.</p></div>
            <div className="bg-slate-950/90 p-5"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Durante</p><p className="mt-2 text-sm text-slate-300">Busca empresas, patentes y tecnologías.</p></div>
            <div className="bg-slate-950/90 p-5"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Después</p><p className="mt-2 text-sm text-slate-300">Sigue cambios importantes sin empezar de nuevo.</p></div>
          </div>
        </div>
      </section>

      <section id="producto" className="border-y border-white/10 bg-white/[0.025] px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-300">Un flujo, tres decisiones</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Empieza por lo que necesitas resolver.</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {journeys.map((journey) => {
              const Icon = journey.icon
              return (
                <article key={journey.eyebrow} className="rounded-2xl border border-white/10 bg-slate-900/60 p-7">
                  <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5"><Icon className="h-5 w-5 text-blue-300" /></div>
                  <p className="text-sm font-medium text-blue-300">{journey.eyebrow}</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight">{journey.title}</h3>
                  <p className="mt-4 text-sm leading-6 text-slate-400">{journey.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-300">Investigar con contexto</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight">Información que ayuda a decidir.</h2>
            <p className="mt-5 max-w-xl leading-7 text-slate-400">Visual Compare reúne actividad, estados, clases, IPC, inventores y fuentes para que la información sea más fácil de entender.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Building2, title: 'Empresas', text: 'Cartera observada, actividad anual, tecnologías dominantes e inventores recurrentes.' },
              { icon: Database, title: 'Marcas y patentes', text: 'Búsqueda local sobre datos oficiales sincronizados y evidencia trazable.' },
              { icon: Search, title: 'Tecnologías', text: 'Explora conceptos e IPC y descubre quién está activo en un área.' },
              { icon: BellRing, title: 'Movimientos', text: 'Convierte una investigación importante en una vigilancia continua.' },
            ].map((item) => {
              const Icon = item.icon
              return <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-5"><Icon className="h-5 w-5 text-slate-300" /><h3 className="mt-4 font-medium">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p></div>
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025] px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-300">Evidencia primero</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">La IA ayuda a interpretar. La fuente sigue siendo visible.</h2>
              <p className="mt-4 leading-7 text-slate-400">Visual Compare usa automatización e IA para ordenar información y acelerar análisis, sin esconder la procedencia de los datos ni convertir una señal preliminar en una certeza jurídica.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {evidence.map((item) => <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />{item}</div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">Busca, revisa y decide con más claridad.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-7 text-slate-400">Empieza por una marca, una empresa o una tecnología. Visual Compare te ayuda a ordenar la información.</p>
          <Link href="/auth/signup"><Button size="lg" className="mt-8 h-12 gap-2 bg-white px-6 text-slate-950 hover:bg-slate-200">Empezar ahora <ArrowRight className="h-4 w-4" /></Button></Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-sm text-slate-500 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Visual Compare Chile.</span>
          <span>Los resultados apoyan la investigación y no reemplazan una evaluación jurídica profesional.</span>
        </div>
      </footer>
    </main>
  )
}
