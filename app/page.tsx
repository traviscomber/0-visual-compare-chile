'use client'

import Link from 'next/link'
import { ArrowRight, BellRing, CheckCircle2, Database, ImageIcon, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const simpleSteps = [
  { icon: ImageIcon, eyebrow: '1 · Entrega la marca', title: 'Sube el logo o escribe el nombre.', description: 'No necesitas saber qué filtros usar, qué clase elegir o cómo construir la consulta.' },
  { icon: Search, eyebrow: '2 · Visual Compare investiga', title: 'Construimos la búsqueda por ti.', description: 'Ordenamos señales visuales, denominación, Niza, Viena y antecedentes INAPI en una sola revisión.' },
  { icon: ShieldCheck, eyebrow: '3 · Revisa lo importante', title: 'Recibe antecedentes priorizados.', description: 'Ves qué registros merecen atención, por qué aparecen y qué conviene revisar después.' },
]

const evidence = [
  'Datos oficiales de INAPI',
  'Fuente y fecha de consulta visibles',
  'Niza + Viena en el mismo flujo',
  'Resultados e inferencias separados',
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="text-lg font-semibold tracking-tight">Visual Compare</Link>
          <div className="flex items-center gap-2">
            <Link href="/auth/login"><Button variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white">Iniciar sesión</Button></Link>
            <Link href="/evaluar"><Button className="gap-2 bg-white text-slate-950 hover:bg-slate-200">Evaluar una marca <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden px-5 pb-20 pt-32 lg:px-8 lg:pb-28 lg:pt-40">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[560px] w-[860px] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[130px]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300">
                <Sparkles className="h-4 w-4 text-blue-300" /> Trademark Intelligence · Chile
              </div>
              <h1 className="max-w-5xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                Buscar una marca debería ser <span className="text-blue-300">fácil.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                Sube un logo o escribe un nombre. Visual Compare organiza antecedentes INAPI, clases y señales de similitud para que llegues antes a lo que realmente merece revisión.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/evaluar"><Button size="lg" className="h-12 gap-2 bg-white px-6 text-slate-950 hover:bg-slate-200">Evaluar una marca <ArrowRight className="h-4 w-4" /></Button></Link>
                <Link href="#como-funciona"><Button size="lg" variant="outline" className="h-12 border-white/15 bg-transparent px-6 text-white hover:bg-white/10">Ver cómo funciona</Button></Link>
              </div>
              <p className="mt-4 text-sm text-slate-500">Sin esconder la fuente. Sin convertir una señal preliminar en una conclusión jurídica.</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-blue-950/30 backdrop-blur sm:p-6">
              <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Una sola entrada</p>
                <div className="mt-4 flex min-h-44 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.025] p-6 text-center">
                  <div><ImageIcon className="mx-auto h-8 w-8 text-blue-300" /><p className="mt-3 font-medium">Arrastra un logo o una fotografía</p><p className="mt-2 text-sm text-slate-500">o continúa con el nombre de la marca</p></div>
                </div>
                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-slate-400">Nombre de marca</div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-xl bg-white/[0.04] p-3"><p className="text-xs text-slate-500">INAPI</p><p className="mt-1 text-sm">Antecedentes</p></div>
                  <div className="rounded-xl bg-white/[0.04] p-3"><p className="text-xs text-slate-500">Viena</p><p className="mt-1 text-sm">Señales visuales</p></div>
                  <div className="rounded-xl bg-white/[0.04] p-3"><p className="text-xs text-slate-500">Niza</p><p className="mt-1 text-sm">Clases</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="border-y border-white/10 bg-white/[0.025] px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-300">Menos formulario. Más respuesta.</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Tú entregas la marca. Nosotros ordenamos la complejidad.</h2>
            <p className="mt-5 text-lg leading-7 text-slate-400">La búsqueda oficial permite trabajar con muchos criterios técnicos. Visual Compare mantiene esa evidencia disponible, pero mueve la complejidad detrás del flujo para que la primera decisión sea simple.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {simpleSteps.map((step) => {
              const Icon = step.icon
              return <article key={step.eyebrow} className="rounded-2xl border border-white/10 bg-slate-900/60 p-7"><div className="mb-8 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5"><Icon className="h-5 w-5 text-blue-300" /></div><p className="text-sm font-medium text-blue-300">{step.eyebrow}</p><h3 className="mt-2 text-2xl font-semibold tracking-tight">{step.title}</h3><p className="mt-4 text-sm leading-6 text-slate-400">{step.description}</p></article>
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-300">Lo importante, primero</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight">De una lista de registros a una lectura útil.</h2>
            <p className="mt-5 max-w-xl leading-7 text-slate-400">Cada antecedente debe explicar qué es, quién lo posee, en qué estado está, qué clases cubre y por qué apareció en la revisión. Después podrás abrir el detalle completo cuando lo necesites.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[{ icon: Database, title: 'Registro', text: 'Solicitud, registro, estado, titular y clases en una ficha legible.' }, { icon: ImageIcon, title: 'Imagen', text: 'Elementos visuales y clasificación figurativa cuando existe un signo gráfico.' }, { icon: ShieldCheck, title: 'Prioridad', text: 'Relevancia explicada sin presentarla como probabilidad jurídica.' }, { icon: BellRing, title: 'Seguimiento', text: 'La investigación puede convertirse después en una vigilancia continua.' }].map((item) => { const Icon = item.icon; return <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-5"><Icon className="h-5 w-5 text-slate-300" /><h3 className="mt-4 font-medium">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p></div> })}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025] px-5 py-18 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div><p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-300">Evidencia primero</p><h2 className="mt-4 text-3xl font-semibold tracking-tight">La IA interpreta. La fuente sigue siendo visible.</h2><p className="mt-4 leading-7 text-slate-400">Visual Compare reduce la carga cognitiva sin ocultar el origen de los datos. Puedes distinguir qué proviene de INAPI, qué es una clasificación y qué es una inferencia asistida.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">{evidence.map((item) => <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />{item}</div>)}</div>
        </div>
      </section>

      <section className="px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center"><h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">Una marca. Una búsqueda. Los antecedentes importantes.</h2><p className="mx-auto mt-5 max-w-2xl text-lg leading-7 text-slate-400">Empieza con lo que ya tienes: un nombre, un logo o ambos.</p><Link href="/evaluar"><Button size="lg" className="mt-8 h-12 gap-2 bg-white px-6 text-slate-950 hover:bg-slate-200">Evaluar una marca <ArrowRight className="h-4 w-4" /></Button></Link></div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-sm text-slate-500 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><span>© 2026 Visual Compare Chile.</span><span>Los resultados apoyan la investigación y no reemplazan una evaluación jurídica profesional.</span></div></footer>
    </main>
  )
}
