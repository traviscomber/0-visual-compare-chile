'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check, Copy, Eye, ArrowRight, Orbit, Sparkles, Shield, ScanSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'

const routes = [
  {
    title: 'Panel operativo',
    href: '/panel',
    summary: 'Vista principal para comparar, revisar historial y moverse entre modulos del MVP.',
  },
  {
    title: 'Comparar',
    href: '/compare',
    summary: 'Workbench de comparacion visual con senales forenses y clasificacion operativa.',
  },
  {
    title: 'Consulta',
    href: '/consulta',
    summary: 'Exploracion de marcas y registros con filtros y contexto de busqueda.',
  },
]

const apiSections = [
  {
    method: 'GET',
    path: '/api/v1/health',
    description: 'Verifica estado del servicio, revision activa, host servido y presencia de configuracion critica.',
    example: 'curl https://api.visualcompare.cl/api/v1/health',
  },
  {
    method: 'POST',
    path: '/api/v1/images',
    description: 'Carga una imagen para su analisis y generacion de identificadores.',
    example:
      'curl -X POST https://api.visualcompare.cl/api/v1/images -H "Authorization: Bearer YOUR_API_KEY" -F "image=@logo.jpg"',
  },
  {
    method: 'POST',
    path: '/api/v1/compare',
    description: 'Compara dos imagenes y devuelve score, clasificacion y trazas operativas.',
    example:
      'curl -X POST https://api.visualcompare.cl/api/v1/compare -H "Authorization: Bearer YOUR_API_KEY" -d \'{"image_a_id":"uuid-1","image_b_id":"uuid-2"}\'',
  },
]

const designTokens = [
  { label: 'Canvas', value: 'slate-950 + blue/cyan glows', helper: 'Fondo oscuro con profundidad neural.' },
  { label: 'Primary', value: 'blue-500 / cyan-500', helper: 'Accion principal y confianza.' },
  { label: 'Accent', value: 'emerald-500 / amber-400', helper: 'Estados, alertas y confirmaciones.' },
  { label: 'Type', value: 'Serif + Mono', helper: 'Editorial para interfaz, mono para datos y API.' },
]

const principles = [
  {
    title: 'Directo',
    icon: <ScanSearch className="h-5 w-5" />,
    text: 'Cada pagina debe explicar el flujo en una frase corta y concreta.',
  },
  {
    title: 'Neural',
    icon: <Sparkles className="h-5 w-5" />,
    text: 'Usar capas, glow controlado y contraste alto sin ruido visual gratuito.',
  },
  {
    title: 'Verificable',
    icon: <Shield className="h-5 w-5" />,
    text: 'Todo lo visible debe sugerir trazabilidad, control y evidencia.',
  },
  {
    title: 'Operativo',
    icon: <Orbit className="h-5 w-5" />,
    text: 'La estetica sirve al trabajo real, no a una demo temporal.',
  },
]

const deploySignals = [
  'Build stamp visible en footer y /panel con env, host y revision corta.',
  'Health endpoint con status, version, revision, host y resumen de env de Supabase.',
  'Smoke y audit de deploy deben ejecutarse contra la URL publica real antes de aceptar un release.',
]

export default function DocsPage() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = async (value: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(value)
    window.setTimeout(() => setCopied(null), 1600)
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute top-44 -left-32 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">N3uralia docs</p>
              <p className="text-lg font-semibold text-white">Visual Compare Chile</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/docs/clasificaciones"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
            >
              Clasificaciones
            </Link>
            <Link href="/panel">
              <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">Ir al panel</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-6 pb-10 pt-16">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
              <Sparkles className="h-4 w-4" />
              Product docs
            </div>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.95] text-white md:text-7xl">
              Documentacion operativa del MVP.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Esta pagina resume el sistema visual, las rutas activas y la superficie tecnica real del producto.
              Sirve para continuar el desarrollo sin volver al lenguaje de demo.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/panel" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950">
                Abrir panel
              </Link>
              <Link
                href="/compare"
                className="rounded-full border border-white/15 bg-slate-950/50 px-5 py-3 text-sm font-semibold text-white"
              >
                Ver comparador
              </Link>
              <Link
                href="/consulta"
                className="rounded-full border border-white/15 bg-slate-950/50 px-5 py-3 text-sm font-semibold text-white"
              >
                Ver consulta
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Quick map</p>
            <div className="mt-5 space-y-4">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Ruta MVP</p>
                      <p className="mt-1 text-xl font-semibold text-white">{route.title}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-cyan-300" />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{route.summary}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-14 md:grid-cols-2 xl:grid-cols-4">
        {designTokens.map((token) => (
          <article key={token.label} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{token.label}</p>
            <p className="mt-2 text-lg font-semibold text-white">{token.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{token.helper}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {principles.map((item) => (
            <article key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="inline-flex rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-200">
                {item.icon}
              </div>
              <h2 className="mt-4 text-xl font-bold text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-r from-blue-500/15 via-cyan-500/10 to-slate-900/20 p-8 backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">API surface</p>
              <h2 className="mt-2 text-3xl font-black text-white">Endpoints activos y contratados.</h2>
              <p className="mt-3 max-w-2xl text-slate-300">
                Los ejemplos estan escritos para el stack real del MVP. Si cambia el contrato, esta pagina debe cambiar
                junto con el codigo.
              </p>
            </div>
            <div className="text-sm text-slate-300">Panel, compare y consulta como superficies primarias del producto.</div>
          </div>

          <div className="mt-8 grid gap-4">
            {apiSections.map((section) => (
              <article key={section.path} className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-mono font-semibold text-cyan-200">
                      {section.method}
                    </div>
                    <p className="mt-3 text-2xl font-bold text-white">{section.path}</p>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{section.description}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(section.example)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                  >
                    {copied === section.example ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                    Copiar ejemplo
                  </button>
                </div>
                <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-sm text-cyan-100">
                  {section.example}
                </pre>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Deploy provenance</p>
          <h2 className="mt-3 text-3xl font-black text-white">Senales minimas para validar el deploy correcto.</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {deploySignals.map((signal) => (
              <article key={signal} className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                <p className="text-sm leading-6 text-slate-300">{signal}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
