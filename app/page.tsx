'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Check,
  Eye,
  Fingerprint,
  ImageIcon,
  Layers3,
  Search,
  ShieldCheck,
  Sparkles,
  Waves,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const signals = [
  { icon: Search, label: 'Denominación', value: 'Muy similar', detail: 'Ortografía, tokens y estructura verbal.' },
  { icon: Waves, label: 'Fonética', value: 'Alta proximidad', detail: 'Variantes de pronunciación y equivalencias.' },
  { icon: Fingerprint, label: 'Visual', value: 'Explicable', detail: 'pHash, huella figurativa y elementos compartidos.' },
  { icon: Layers3, label: 'Ámbito', value: 'Contextual', detail: 'Clases Niza y relación entre productos o servicios.' },
]

const workflow = [
  ['01', 'Entrega la marca', 'Logo, foto, nombre o combinación. Sin configurar filtros antes de empezar.'],
  ['02', 'Construimos la investigación', 'N3uralia Intelligence arma las estrategias de búsqueda y consolida antecedentes.'],
  ['03', 'Explicamos el conflicto', 'Cada señal se presenta por separado para que entiendas por qué un antecedente importa.'],
  ['04', 'Conviértelo en acción', 'Guardar, comparar, vigilar o abrir un expediente sin reconstruir la investigación.'],
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F766E] text-sm font-semibold tracking-tight text-white">N3</span>
            <span className="leading-none">
              <span className="block text-sm font-semibold tracking-[-0.01em] text-[#0F172A]">N3uralia Intelligence</span>
              <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.2em] text-[#64748B]">Visual Compare</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/auth/login"><Button variant="ghost" className="hidden text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] sm:inline-flex">Iniciar sesión</Button></Link>
            <Link href="/demo"><Button className="gap-2 rounded-xl bg-[#0F766E] px-5 text-white shadow-none hover:bg-[#134E4A]">Probar con una marca <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        </div>
      </nav>

      <section className="border-b border-[#E2E8F0] bg-white px-5 pb-20 pt-32 lg:px-10 lg:pb-28 lg:pt-40">
        <div className="mx-auto grid max-w-[1440px] gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#CCFBF1] bg-[#F0FDFA] px-3 py-1.5 text-xs font-semibold text-[#0F766E]">
              <Sparkles className="h-3.5 w-3.5" /> Trademark Decision Intelligence · Chile
            </div>
            <h1 className="mt-7 max-w-xl text-[44px] font-semibold leading-[1.04] tracking-[-0.045em] text-[#0F172A] sm:text-[58px] lg:text-[68px]">
              De una marca a una decisión mejor preparada.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#475569]">
              Sube un logo, una foto o escribe un nombre. Visual Compare organiza denominación, fonética, imagen, Niza, Viena y antecedentes INAPI en una sola investigación entendible.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/demo"><Button size="lg" className="h-12 gap-2 rounded-xl bg-[#0F766E] px-6 text-white shadow-none hover:bg-[#134E4A]">Probar ahora · sin cuenta <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link href="#producto"><Button size="lg" variant="outline" className="h-12 rounded-xl border-[#CBD5E1] bg-white px-6 text-[#0F172A] hover:bg-[#F8FAFC]">Ver cómo decide</Button></Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#64748B]">
              {['INAPI como fuente oficial', 'Niza + Viena', 'Evidencia separada de inferencia'].map((item) => <span key={item} className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#0F766E]" />{item}</span>)}
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section id="producto" className="px-5 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-10 border-b border-[#E2E8F0] pb-14 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0F766E]">Una entrada. Cuatro señales.</p>
              <h2 className="mt-4 max-w-lg text-4xl font-semibold tracking-[-0.035em] text-[#0F172A] sm:text-5xl">No resumimos todo en un porcentaje misterioso.</h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-[#64748B] lg:justify-self-end">La plataforma muestra cada dimensión por separado y explica qué evidencia la respalda. El abogado conserva la decisión; el sistema elimina el trabajo mecánico previo.</p>
          </div>

          <div className="grid divide-y divide-[#E2E8F0] border-b border-[#E2E8F0] lg:grid-cols-4 lg:divide-x lg:divide-y-0">
            {signals.map(({ icon: Icon, label, value, detail }) => (
              <div key={label} className="py-8 lg:px-7 lg:first:pl-0 lg:last:pr-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0FDFA] text-[#0F766E]"><Icon className="h-5 w-5" /></div>
                <p className="mt-5 text-sm font-medium text-[#64748B]">{label}</p>
                <p className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[#0F172A]">{value}</p>
                <p className="mt-3 text-sm leading-6 text-[#64748B]">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0F172A] px-5 py-20 text-white lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-[1440px] gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5EEAD4]">De búsqueda a decisión</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Un flujo diseñado para trabajo jurídico real.</h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">INAPI mantiene el registro oficial. N3uralia Intelligence organiza la investigación, deja trazabilidad y prepara la siguiente acción.</p>
          </div>
          <div className="border-t border-white/15">
            {workflow.map(([number, title, copy]) => (
              <div key={number} className="grid gap-3 border-b border-white/15 py-6 sm:grid-cols-[70px_220px_1fr] sm:items-start">
                <span className="font-mono text-xs text-[#5EEAD4]">{number}</span>
                <p className="font-semibold text-white">{title}</p>
                <p className="text-sm leading-6 text-slate-400">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)] sm:p-8">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-5">
              <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748B]">Comparación orientativa</p><p className="mt-1 text-lg font-semibold">Tu marca ↔ antecedente</p></div>
              <span className="rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-semibold text-[#92400E]">Revisión prioritaria</span>
            </div>
            <div className="grid gap-4 py-6 sm:grid-cols-2">
              <LogoPlaceholder label="Tu marca" /><LogoPlaceholder label="Antecedente oficial" />
            </div>
            <div className="grid grid-cols-2 border-t border-[#E2E8F0] sm:grid-cols-4">
              <Evidence label="Nombre" value="Muy similar" />
              <Evidence label="Fonética" value="Alta" />
              <Evidence label="Visual" value="Moderada" />
              <Evidence label="Ámbito" value="Relacionado" />
            </div>
          </div>
          <div className="max-w-xl lg:justify-self-end">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0F766E]">Conflict Story</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.035em] text-[#0F172A]">El resultado no termina en “87% similar”.</h2>
            <p className="mt-5 text-lg leading-8 text-[#64748B]">Explica si la colisión proviene del nombre, de la pronunciación, del diseño, del ámbito comercial o de varias señales acumuladas.</p>
            <div className="mt-7 space-y-3 text-sm text-[#334155]">
              {['Evidencia registral visible', 'Señales calculadas separadas', 'Limitaciones de fuente explícitas', 'Siguiente acción dentro del mismo expediente'].map((item) => <div key={item} className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F0FDFA]"><Check className="h-3.5 w-3.5 text-[#0F766E]" /></span>{item}</div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#E2E8F0] bg-white px-5 py-14 lg:px-10">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#64748B]">La plataforma detrás de Visual Compare</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">N3uralia Intelligence</h2>
            <p className="mt-3 leading-7 text-[#64748B]">Inteligencia aplicada para transformar fuentes complejas en búsqueda, evidencia, decisión y operación. Desarrollado por N3uralia.</p>
          </div>
          <a href="https://www.n3uralia.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F766E] hover:text-[#134E4A]">Conocer N3uralia <ArrowRight className="h-4 w-4" /></a>
        </div>
      </section>

      <section className="px-5 py-24 text-center lg:px-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0F766E]">Sin aprender el buscador primero</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Prueba una marca real.</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-[#64748B]">Logo, fotografía, nombre o combinación. La primera investigación puede comenzar sin crear una cuenta.</p>
          <Link href="/demo"><Button size="lg" className="mt-8 h-12 gap-2 rounded-xl bg-[#0F766E] px-6 text-white shadow-none hover:bg-[#134E4A]">Abrir Visual Compare <ArrowRight className="h-4 w-4" /></Button></Link>
        </div>
      </section>

      <footer className="border-t border-[#E2E8F0] bg-white px-5 py-8 text-sm text-[#64748B] lg:px-10">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-semibold text-[#0F172A]">N3uralia Intelligence</p><p className="mt-1">Visual Compare · Powered by <a href="https://www.n3uralia.com" target="_blank" rel="noreferrer" className="font-medium text-[#0F766E]">N3uralia</a></p></div>
          <span>Apoya investigación preliminar y no reemplaza evaluación jurídica profesional.</span>
        </div>
      </footer>
    </main>
  )
}

function ProductPreview() {
  return (
    <div className="relative lg:pl-8">
      <div className="rounded-[30px] border border-[#DCE3EA] bg-[#F8FAFC] p-3 shadow-[0_28px_90px_rgba(15,23,42,0.10)] sm:p-4">
        <div className="overflow-hidden rounded-[22px] border border-[#E2E8F0] bg-white">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
            <div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748B]">Decision Twin · ejemplo de lectura</p><p className="mt-1 text-base font-semibold text-[#0F172A]">PATAGONIA</p></div>
            <span className="rounded-full bg-[#FEF3C7] px-3 py-1 text-[11px] font-semibold text-[#92400E]">Revisión prioritaria</span>
          </div>
          <div className="grid sm:grid-cols-[150px_1fr]">
            <div className="flex min-h-40 items-center justify-center border-b border-[#E2E8F0] bg-[#F8FAFC] p-5 sm:border-b-0 sm:border-r">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white text-[#0F766E]"><ImageIcon className="h-9 w-9" /></div>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-4"><div><p className="text-xs text-[#64748B]">Antecedente priorizado</p><p className="mt-1 text-lg font-semibold">PATAGONIA OUTDOOR</p><p className="mt-1 text-xs text-[#64748B]">Registro vigente · Clase relacionada</p></div><Eye className="h-5 w-5 text-[#94A3B8]" /></div>
              <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 text-xs">
                <MiniSignal label="Nombre" value="Muy similar" />
                <MiniSignal label="Fonética" value="Alta" />
                <MiniSignal label="Visual" value="Moderada" />
                <MiniSignal label="Niza" value="Coincidente" />
              </div>
            </div>
          </div>
          <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4">
            <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" /><p className="text-sm leading-6 text-[#475569]"><span className="font-semibold text-[#0F172A]">Por qué importa:</span> la proximidad verbal y el ámbito comercial se acumulan; la señal visual es secundaria.</p></div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-1 hidden rounded-2xl border border-[#CCFBF1] bg-white px-4 py-3 shadow-[0_12px_40px_rgba(15,118,110,0.10)] lg:block">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0F766E]">Método visible</p>
        <p className="mt-1 text-xs text-[#475569]">INAPI + Niza + Viena + Visual</p>
      </div>
    </div>
  )
}

function MiniSignal({ label, value }: { label: string; value: string }) { return <div><p className="text-[#94A3B8]">{label}</p><p className="mt-1 font-semibold text-[#0F172A]">{value}</p></div> }
function LogoPlaceholder({ label }: { label: string }) { return <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"><p className="text-xs font-medium text-[#64748B]">{label}</p><div className="mt-4 flex h-28 items-center justify-center rounded-xl bg-white text-[#94A3B8]"><ImageIcon className="h-7 w-7" /></div></div> }
function Evidence({ label, value }: { label: string; value: string }) { return <div className="border-r border-[#E2E8F0] px-3 py-4 last:border-r-0"><p className="text-[11px] text-[#94A3B8]">{label}</p><p className="mt-1 text-xs font-semibold text-[#0F172A]">{value}</p></div> }
