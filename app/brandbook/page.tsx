'use client'

import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, Copy, ChevronDown, Orbit, Sparkles, Shield, ScanSearch, Layers3, WandSparkles } from 'lucide-react'

type ToneItem = {
  label: string
  value: string
  helper: string
}

type PaletteItem = {
  name: string
  hex: string
  rgb: string
  usage: string
  swatch: string
}

type Principle = {
  title: string
  description: string
  icon: ReactNode
}

const palette: PaletteItem[] = [
  { name: 'Neural Blue', hex: '#2563EB', rgb: '37, 99, 235', usage: 'Primary actions, trust cues, active states', swatch: 'bg-blue-600' },
  { name: 'Signal Cyan', hex: '#06B6D4', rgb: '6, 182, 212', usage: 'Data highlights, hover accents, visual links', swatch: 'bg-cyan-500' },
  { name: 'Pulse Violet', hex: '#8B5CF6', rgb: '139, 92, 246', usage: 'Secondary emphasis, cards, gradient depth', swatch: 'bg-violet-500' },
  { name: 'Ion Emerald', hex: '#10B981', rgb: '16, 185, 129', usage: 'Success, verified states, positive signals', swatch: 'bg-emerald-500' },
  { name: 'Alert Amber', hex: '#F59E0B', rgb: '245, 158, 11', usage: 'Warnings, attention states, review prompts', swatch: 'bg-amber-500' },
  { name: 'Deep Slate', hex: '#020617', rgb: '2, 6, 23', usage: 'Base canvas and structural depth', swatch: 'bg-slate-950' },
]

const typography: ToneItem[] = [
  { label: 'Display', value: 'Montserrat 800', helper: 'Hero titles, section openers, bold statements' },
  { label: 'Heading', value: 'Montserrat 700', helper: 'Cards, blocks, callouts, navigation states' },
  { label: 'Body', value: 'Montserrat 400 / 500', helper: 'Readable product copy and dense operational text' },
  { label: 'Code', value: 'JetBrains Mono 500', helper: 'Metrics, hashes, technical values, API examples' },
]

const principles: Principle[] = [
  {
    title: 'Precise',
    description: 'Show the signal first. Avoid decoration that hides the actual decision path.',
    icon: <ScanSearch className="h-5 w-5" />,
  },
  {
    title: 'Neural',
    description: 'Use luminous gradients, layered surfaces, and soft depth instead of flat admin UI.',
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: 'Verified',
    description: 'Every state should imply traceability, auditability, and operational confidence.',
    icon: <Shield className="h-5 w-5" />,
  },
  {
    title: 'Composed',
    description: 'Keep the interface calm. High contrast, clear hierarchy, no visual noise.',
    icon: <Layers3 className="h-5 w-5" />,
  },
]

const uiPatterns = [
  {
    title: 'Primary CTA',
    preview: 'Iniciar comparacion',
    className: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20',
  },
  {
    title: 'Secondary CTA',
    preview: 'Ver panel',
    className: 'border border-cyan-400/40 bg-slate-950/40 text-cyan-200',
  },
  {
    title: 'Status badge',
    preview: 'VERIFICADO',
    className: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30',
  },
  {
    title: 'Glass card',
    preview: 'Panel neural',
    className: 'bg-gradient-to-br from-slate-950/70 via-slate-900/60 to-blue-950/40 border border-white/10',
  },
]

const tone = [
  { label: 'Voice', value: 'Directa', helper: 'No prometer magia, mostrar capacidad real.' },
  { label: 'Confidence', value: 'Alta', helper: 'Hablar como plataforma seria, no como demo.' },
  { label: 'Syntax', value: 'Corta', helper: 'Frases claras, verbos activos, poco relleno.' },
  { label: 'Mood', value: 'Cientifico + ejecutivo', helper: 'Tecnico por dentro, premium por fuera.' },
]

export default function BrandBookPage() {
  const [copiedHex, setCopiedHex] = useState<string | null>(null)
  const [openSections, setOpenSections] = useState({
    palette: true,
    typography: true,
    system: true,
    voice: false,
  })

  const heroMetrics = useMemo(
    () => [
      { value: '3', label: 'capas de señal', helper: 'comparacion, consulta, trazabilidad' },
      { value: '1', label: 'lenguaje visual', helper: 'naranja y violeta fuera, azul dentro' },
      { value: '0', label: 'ruido visual', helper: 'sin demo copy, sin sobreactuacion' },
    ],
    [],
  )

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedHex(text)
    window.setTimeout(() => setCopiedHex(null), 1800)
  }

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((current) => ({ ...current, [key]: !current[key] }))
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-28 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute top-40 -left-28 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">N3uralia style</p>
            <h1 className="mt-2 text-2xl font-bold text-white">Visual Compare Chile Brandbook</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/panel"
              className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-400/20"
            >
              Ir al panel
            </Link>
            <Link
              href="/docs/BRANDBOOK.md"
              className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Ver PDF
            </Link>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-6 pb-8 pt-16">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
              <Orbit className="h-4 w-4" />
              Neural identity system
            </div>
            <h2 className="mt-6 max-w-3xl text-5xl font-black leading-[0.95] text-white md:text-7xl">
              N3uralia style for visual decisions.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Este brandbook define una estetica de inteligencia operativa: premium, clara y verificable. La
              experiencia debe sentirse como un sistema neural serio, no como una demo temporaria.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {heroMetrics.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="text-3xl font-black text-cyan-300">{item.value}</div>
                  <div className="mt-1 text-sm font-semibold uppercase tracking-[0.2em] text-slate-100">{item.label}</div>
                  <div className="mt-2 text-sm text-slate-400">{item.helper}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Quick system</p>
              <WandSparkles className="h-5 w-5 text-cyan-300" />
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Brand promise</p>
                <p className="mt-2 text-lg font-semibold text-white">Detectar, comparar y verificar.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Visual posture</p>
                <p className="mt-2 text-lg font-semibold text-white">Cinematic UI with operational restraint.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Do not use</p>
                <p className="mt-2 text-lg font-semibold text-white">Generic SaaS blue and demo language.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <button
          onClick={() => toggleSection('palette')}
          className="mb-6 flex w-full items-center gap-3 text-left"
        >
          <h3 className="text-2xl font-bold text-white md:text-3xl">Color system</h3>
          <ChevronDown className={`h-5 w-5 text-cyan-300 transition-transform ${openSections.palette ? 'rotate-180' : ''}`} />
        </button>

        {openSections.palette && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {palette.map((item) => (
              <article
                key={item.hex}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-cyan-400/30"
              >
                <div className={`h-28 ${item.swatch}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-white">{item.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{item.usage}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(item.hex)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-3 py-2 text-xs font-mono text-cyan-200 transition hover:border-cyan-400/30"
                    >
                      {copiedHex === item.hex ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                      {item.hex}
                    </button>
                  </div>
                  <p className="mt-4 text-sm font-mono text-slate-300">rgb({item.rgb})</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <button
          onClick={() => toggleSection('typography')}
          className="mb-6 flex w-full items-center gap-3 text-left"
        >
          <h3 className="text-2xl font-bold text-white md:text-3xl">Typography</h3>
          <ChevronDown
            className={`h-5 w-5 text-cyan-300 transition-transform ${openSections.typography ? 'rotate-180' : ''}`}
          />
        </button>

        {openSections.typography && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/80 to-blue-950/40 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Primary family</p>
              <p className="mt-3 text-4xl font-black tracking-tight text-white">Montserrat</p>
              <p className="mt-2 text-slate-300">Use for editorial headlines, UI labels, and confident body copy.</p>
            </div>

            <div className="grid gap-4">
              {typography.map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                      <p className="mt-2 text-xl font-bold text-white">{item.value}</p>
                    </div>
                    <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 p-3">
                      <span className="font-mono text-sm text-cyan-200">Aa</span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">{item.helper}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <button
          onClick={() => toggleSection('system')}
          className="mb-6 flex w-full items-center gap-3 text-left"
        >
          <h3 className="text-2xl font-bold text-white md:text-3xl">UI system</h3>
          <ChevronDown className={`h-5 w-5 text-cyan-300 transition-transform ${openSections.system ? 'rotate-180' : ''}`} />
        </button>

        {openSections.system && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {uiPatterns.map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{item.title}</p>
                <button
                  className={`mt-4 w-full rounded-2xl px-4 py-4 text-sm font-semibold transition hover:opacity-95 ${item.className}`}
                >
                  {item.preview}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <button
          onClick={() => toggleSection('voice')}
          className="mb-6 flex w-full items-center gap-3 text-left"
        >
          <h3 className="text-2xl font-bold text-white md:text-3xl">Tone of voice</h3>
          <ChevronDown className={`h-5 w-5 text-cyan-300 transition-transform ${openSections.voice ? 'rotate-180' : ''}`} />
        </button>

        {openSections.voice && (
          <div className="grid gap-4 md:grid-cols-2">
            {tone.map((item) => (
              <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
                <p className="mt-3 text-slate-300">{item.helper}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {principles.map((principle) => (
            <article
              key={principle.title}
              className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/6 to-white/3 p-6 backdrop-blur-xl"
            >
              <div className="inline-flex rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-200">
                {principle.icon}
              </div>
              <h4 className="mt-4 text-xl font-bold text-white">{principle.title}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-300">{principle.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-[2rem] border border-cyan-400/20 bg-gradient-to-r from-blue-500/15 via-cyan-500/10 to-violet-500/15 p-8 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Operational routes</p>
              <h3 className="mt-2 text-3xl font-black text-white">Panel, compare, consulta.</h3>
              <p className="mt-2 max-w-2xl text-slate-300">
                This brand system should support the actual product flow, not an imaginary pitch deck.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/panel" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950">
                Panel operativo
              </Link>
              <Link href="/compare" className="rounded-full border border-white/15 bg-slate-950/50 px-5 py-3 text-sm font-semibold text-white">
                Comparar
              </Link>
              <Link href="/consulta" className="rounded-full border border-white/15 bg-slate-950/50 px-5 py-3 text-sm font-semibold text-white">
                Consulta
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
