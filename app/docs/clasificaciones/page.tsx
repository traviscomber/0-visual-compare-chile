'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Eye, Grid3x3, Palette, ArrowRight, CheckCircle, Orbit, Shield } from 'lucide-react'

const cards = [
  {
    title: 'Clasificacion Niza',
    subtitle: 'Productos y servicios',
    accent: 'blue',
    points: [
      '45 clases internacionales para bienes y servicios.',
      'Ayuda a filtrar marcas por categoria de negocio.',
      'Base util para analisis legal y busqueda operativa.',
    ],
  },
  {
    title: 'Clasificacion Viena',
    subtitle: 'Elementos figurativos',
    accent: 'violet',
    points: [
      'Organiza logos e imagenes por forma visual y estructura.',
      'Sirve para comparar marcas por rasgos graficos.',
      'Mejora la precision del motor visual y de consulta.',
    ],
  },
]

const useCases = [
  {
    title: 'Consulta de marcas',
    text: 'Filtra registros por Niza y Viena para encontrar coincidencias con contexto real.',
  },
  {
    title: 'Comparacion visual',
    text: 'Combina clasificacion internacional con motor visual para reducir falsos positivos.',
  },
  {
    title: 'Revision legal',
    text: 'Detecta riesgo de conflicto dentro de categorias cercanas y documenta la evidencia.',
  },
]

export default function ClassificationsPage() {
  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-32 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 -left-28 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">N3uralia docs</p>
              <p className="text-lg font-semibold text-white">Clasificaciones</p>
            </div>
          </Link>

          <Link href="/docs">
            <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white hover:bg-cyan-400/10">
              Volver a Docs
            </Button>
          </Link>
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
              <Orbit className="h-4 w-4" />
              Search taxonomy
            </div>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.95] text-white md:text-7xl">
              Clasificaciones para buscar con precision.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Niza y Viena son la estructura que permite ordenar marcas, comparar patrones visuales y sostener el
              flujo legal del producto.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/consulta" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950">
                Ir a consulta
              </Link>
              <Link href="/compare" className="rounded-full border border-white/15 bg-slate-950/50 px-5 py-3 text-sm font-semibold text-white">
                Abrir comparador
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Why it matters</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Niza</p>
                <p className="mt-2 text-lg font-semibold text-white">Industria y clase de negocio</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Viena</p>
                <p className="mt-2 text-lg font-semibold text-white">Forma, simbolos y elementos graficos</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">MVP</p>
                <p className="mt-2 text-lg font-semibold text-white">Menos ruido, mas señal y mejor trazabilidad.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-4 lg:grid-cols-2">
          {cards.map((card) => (
            <article
              key={card.title}
              className={`rounded-[2rem] border p-6 backdrop-blur-xl ${
                card.accent === 'blue'
                  ? 'border-blue-400/20 bg-gradient-to-br from-blue-500/10 to-slate-950/70'
                  : 'border-violet-400/20 bg-gradient-to-br from-violet-500/10 to-slate-950/70'
              }`}
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className={`text-xs uppercase tracking-[0.25em] ${card.accent === 'blue' ? 'text-cyan-200' : 'text-violet-200'}`}>
                    {card.subtitle}
                  </p>
                  <h2 className="mt-2 text-3xl font-bold text-white">{card.title}</h2>
                </div>
                <div className={`rounded-2xl border p-3 ${card.accent === 'blue' ? 'border-blue-400/20 bg-blue-400/10' : 'border-violet-400/20 bg-violet-400/10'}`}>
                  {card.title.includes('Niza') ? <Grid3x3 className="h-6 w-6 text-blue-300" /> : <Palette className="h-6 w-6 text-violet-300" />}
                </div>
              </div>

              <div className="space-y-3">
                {card.points.map((point) => (
                  <div key={point} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-300" />
                    <p className="text-sm leading-6 text-slate-300">{point}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Operational flow</p>
              <h2 className="mt-2 text-3xl font-black text-white">Clasificacion como capa de contexto.</h2>
              <p className="mt-3 max-w-2xl text-slate-300">
                La consulta no empieza en una busqueda libre; empieza en una taxonomia que reduce ambiguedad y mejora
                la calidad de la decision.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-slate-300 lg:max-w-md">
              {useCases.map((useCase) => (
                <div key={useCase.title} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="font-semibold text-white">{useCase.title}</p>
                  <p className="mt-2 leading-6 text-slate-300">{useCase.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-r from-blue-500/15 via-cyan-500/10 to-violet-500/15 p-8 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Next step</p>
              <h3 className="mt-2 text-3xl font-black text-white">Panel, consulta y comparacion.</h3>
              <p className="mt-2 max-w-2xl text-slate-300">
                Esta pagina ya no describe teoria suelta. Explica como la taxonomia apoya el flujo real del MVP.
              </p>
            </div>
            <Link
              href="/panel"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950"
            >
              Ir al panel
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
