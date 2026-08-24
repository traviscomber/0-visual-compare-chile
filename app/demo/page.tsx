"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Fingerprint,
  ImageIcon,
  Layers3,
  Loader2,
  RotateCcw,
  Search,
  ShieldCheck,
  Upload,
  Waves,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]
const MAX_FILE_BYTES = 4_500_000

type Preview = {
  marca: string
  denomination_source: "user" | "image-detected"
  denomination_confidence: number | null
  visual: {
    elementos: string[]
    colores: string[]
    viena: Array<{ code: string; titulo: string; elemento: string; confidence: number }>
    fingerprint: { codes: string[]; categories: string[]; divisions: string[]; labels: string[] }
  }
  niza: Array<{ numero: string; titulo: string; tipo: string; razon: string }>
  busqueda: {
    estrategias_planificadas: number
    estrategias_ejecutadas: number
    estrategias: Array<{ id: string; label: string; query: string }>
    resultados_brutos: number
    resultados_unicos: number
    duplicados_eliminados: number
    estrategias_fallidas: number
  }
  evidencia: {
    fuente: string
    consultado_en: string
    resultados_totales: number
    resultados_activos: number
    confianza: string
    imagenes_comparadas: number
    antecedentes_con_viena: number
    advertencias: string[]
  }
  lectura: { nivel: "ALTO" | "MEDIO" | "BAJO"; resumen: string; recomendacion: string }
  antecedentes: Array<{
    id: string
    nombre: string
    titular: string
    estado: string
    clases: string[]
    numero_registro: string
    numero_solicitud: string
    relevancia: number
    razones: string[]
    similitud_denominativa: number
    similitud_fonetica: number
    similitud_visual: number | null
    similitud_figurativa: number | null
    viena_compartida: string[]
    elementos_visuales_compartidos: string[]
    imagen_url?: string
  }>
  locked_count: number
}

export default function DemoPage() {
  const [image, setImage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [nombre, setNombre] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const canRun = Boolean((image || nombre.trim()) && !loading)

  const handleFile = (file: File) => {
    setError(null)
    setPreview(null)
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return setError("Usa PNG, JPEG, WebP o GIF.")
    if (file.size > MAX_FILE_BYTES) return setError("La imagen supera el máximo de 4,5 MB.")
    const reader = new FileReader()
    reader.onload = () => {
      const value = reader.result
      if (typeof value !== "string") return setError("No pudimos leer la imagen.")
      setImage(value)
      setImagePreview(value)
    }
    reader.readAsDataURL(file)
  }

  const run = async () => {
    if (!canRun) return
    setLoading(true)
    setError(null)
    setPreview(null)
    try {
      const response = await fetch("/api/v1/public/trademark-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim(), ...(image ? { image } : {}) }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) return setError(data.error ?? "No pudimos completar la búsqueda.")
      setPreview(data as Preview)
      if (!nombre.trim() && data.marca) setNombre(data.marca)
    } catch {
      setError("No pudimos conectar con el servicio.")
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setPreview(null)
    setError(null)
    setImage(null)
    setImagePreview(null)
    setNombre("")
  }

  return (
    <main className="min-h-screen bg-[#090D12] text-[#F4F7F6]">
      <nav className="border-b border-white/10 bg-[#090D12]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 lg:px-10">
          <div className="flex items-center gap-5">
            <Link href="/" className="flex h-9 w-9 items-center justify-center border border-white/10 text-[#8F9AA8] transition hover:bg-white/[0.05] hover:text-white" aria-label="Volver al inicio"><ArrowLeft className="h-4 w-4" /></Link>
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-[9px] border border-white/15 bg-white/[0.04] text-sm font-semibold text-white">V</span>
              <span className="leading-none"><span className="block text-[15px] font-semibold tracking-[0.16em] text-white">VIDENTIA</span><span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.18em] text-[#76818F]">by N3uralia</span></span>
            </Link>
          </div>
          <div className="flex items-center gap-2"><Link href="/auth/login"><Button variant="ghost" className="hidden rounded-lg text-[#A8B0BA] hover:bg-white/[0.06] hover:text-white sm:inline-flex">Iniciar sesión</Button></Link><Link href="/contacto"><Button className="rounded-lg bg-white text-[#0A0E13] shadow-none hover:bg-[#E7ECEA]">Solicitar acceso</Button></Link></div>
        </div>
      </nav>

      {!preview ? (
        <section className="relative overflow-hidden px-5 py-12 lg:px-10 lg:py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(24,132,118,0.13),transparent_32%)]" />
          <div className="relative mx-auto max-w-[1320px]">
            <div className="mb-12 max-w-3xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#64D5C2]">Investigación real</p>
              <h1 className="mt-5 text-[clamp(2.7rem,5vw,5.5rem)] font-normal leading-[0.98] tracking-[-0.05em] text-white">Entrega la marca. VIDENTIA construye la búsqueda.</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#8F9AA8]">Empieza por lo que realmente tienes: una imagen, un nombre o ambos. El sistema organiza señales, antecedentes y evidencia sin convertirlas en una opinión jurídica automática.</p>
            </div>

            <div className="grid overflow-hidden border border-white/10 bg-[#0D131A] lg:grid-cols-[1.18fr_0.82fr]">
              <div className="p-5 sm:p-8 lg:p-10">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) handleFile(file) }}
                  onDragOver={(event) => event.preventDefault()}
                  className="group flex min-h-[290px] w-full items-center justify-center border border-dashed border-white/15 bg-[#0A0F15] p-7 text-center transition hover:border-[#64D5C2]/45 hover:bg-[#0E151C]"
                >
                  <input ref={fileRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) handleFile(file) }} />
                  {imagePreview ? (
                    <div><div className="mx-auto flex h-44 w-60 items-center justify-center border border-white/10 bg-[#111820] p-4"><img src={imagePreview} alt="Marca cargada" className="max-h-full max-w-full object-contain" /></div><p className="mt-4 text-sm font-medium text-[#E7ECEA]">Imagen lista para investigar</p><p className="mt-1 text-xs text-[#6F7A87]">Haz clic para reemplazarla</p></div>
                  ) : (
                    <div className="max-w-sm"><span className="mx-auto flex h-12 w-12 items-center justify-center border border-[#64D5C2]/20 bg-[#64D5C2]/[0.06] text-[#64D5C2]"><Upload className="h-5 w-5" /></span><p className="mt-5 text-base font-semibold text-white">Arrastra un logo o una fotografía</p><p className="mt-2 text-sm leading-6 text-[#8994A1]">Podemos leer la denominación visible, identificar elementos figurativos y construir una huella visual.</p></div>
                  )}
                </button>

                <div className="my-7 flex items-center gap-4"><div className="h-px flex-1 bg-white/10" /><span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#66727F]">o escribe el nombre</span><div className="h-px flex-1 bg-white/10" /></div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input value={nombre} onChange={(event) => setNombre(event.target.value)} onKeyDown={(event) => event.key === "Enter" && canRun && void run()} placeholder="Escribe el nombre de la marca" className="h-12 flex-1 rounded-lg border-white/15 bg-[#0A0F15] text-base text-white shadow-none placeholder:text-[#66727F]" />
                  <Button onClick={() => void run()} disabled={!canRun} size="lg" className="h-12 gap-2 rounded-lg bg-[#1B8F80] px-6 text-white shadow-none hover:bg-[#16796C]">{loading ? <><Loader2 className="h-4 w-4 animate-spin" />Investigando</> : <><Search className="h-4 w-4" />Analizar marca</>}</Button>
                </div>
                {error && <div className="mt-4 flex items-start gap-2 border border-red-400/20 bg-red-400/[0.06] p-4 text-sm text-red-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
              </div>

              <aside className="border-t border-white/10 bg-[#0A0F15] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6F7A87]">Qué ocurre después</p>
                <div className="mt-7 space-y-0 border-t border-white/10">
                  <Step icon={Search} number="01" title="Expandimos la búsqueda" copy="Exacta, variantes, elementos dominantes y proximidad denominativa." />
                  <Step icon={Waves} number="02" title="Comparamos el nombre" copy="Ortografía y fonética se muestran como señales independientes." />
                  <Step icon={Fingerprint} number="03" title="Leemos la imagen" copy="Huella visual, Viena y similitud estructural cuando existe evidencia comparable." />
                  <Step icon={ShieldCheck} number="04" title="Priorizamos evidencia" copy="Ves qué antecedente merece atención y por qué, sin fingir certeza jurídica." />
                </div>
                <p className="mt-7 text-xs leading-5 text-[#66727F]">INAPI permanece como fuente oficial. VIDENTIA organiza y explica los antecedentes disponibles.</p>
              </aside>
            </div>
          </div>
        </section>
      ) : (
        <Results preview={preview} imagePreview={imagePreview} reset={reset} />
      )}
    </main>
  )
}

function Results({ preview, imagePreview, reset }: { preview: Preview; imagePreview: string | null; reset: () => void }) {
  return (
    <section className="px-5 py-8 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2"><span className="border border-[#64D5C2]/20 bg-[#64D5C2]/[0.06] px-3 py-1 text-xs font-semibold text-[#7EE3D2]">Investigación completada</span><span className="text-xs text-[#66727F]">Fuente: {preview.evidencia.fuente}</span></div>
            <h1 className="mt-4 text-4xl font-normal tracking-[-0.04em] text-white sm:text-5xl">{preview.marca}</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[#8F9AA8]">{preview.lectura.resumen}</p>
          </div>
          <Button variant="outline" onClick={reset} className="gap-2 rounded-lg border-white/15 bg-transparent text-white hover:bg-white/[0.06] hover:text-white"><RotateCcw className="h-4 w-4" />Nueva investigación</Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="space-y-5">
            <section className="border border-white/10 bg-[#0D131A] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6F7A87]">Marca analizada</p>
              <div className="mt-4 flex h-44 items-center justify-center bg-[#0A0F15]">
                {imagePreview ? <img src={imagePreview} alt={preview.marca} className="max-h-36 max-w-[85%] object-contain" /> : <div className="text-center text-[#66727F]"><ImageIcon className="mx-auto h-7 w-7" /><p className="mt-2 text-xs">Búsqueda denominativa</p></div>}
              </div>
              {preview.denomination_source === "image-detected" && <p className="mt-3 text-xs text-[#64D5C2]">Denominación detectada desde la imagen.</p>}
            </section>

            <section className="border border-white/10 bg-[#0D131A] p-5">
              <div className="flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6F7A87]">Cobertura de búsqueda</p><Layers3 className="h-4 w-4 text-[#64D5C2]" /></div>
              <div className="mt-5 grid grid-cols-2 gap-4"><Stat label="Estrategias" value={preview.busqueda.estrategias_ejecutadas} /><Stat label="Únicos" value={preview.busqueda.resultados_unicos} /><Stat label="Activos" value={preview.evidencia.resultados_activos} /><Stat label="Con imagen" value={preview.evidencia.imagenes_comparadas} /></div>
              <div className="mt-5 border-t border-white/10 pt-4"><p className="text-xs text-[#66727F]">Estrategias ejecutadas</p><div className="mt-3 flex flex-wrap gap-2">{preview.busqueda.estrategias.map((item) => <Badge key={item.id} variant="outline" className="border-white/10 bg-[#0A0F15] text-[#A1ABB6]">{item.label}</Badge>)}</div></div>
            </section>

            {preview.visual.fingerprint.codes.length > 0 && <section className="border border-[#64D5C2]/20 bg-[#64D5C2]/[0.04] p-5"><div className="flex items-center gap-2 text-[#64D5C2]"><Fingerprint className="h-4 w-4" /><p className="text-[10px] font-semibold uppercase tracking-[0.18em]">Huella visual</p></div><div className="mt-4 flex flex-wrap gap-2">{preview.visual.viena.slice(0, 8).map((item) => <Badge key={item.code} variant="outline" className="border-[#64D5C2]/20 bg-[#0A0F15] text-[#A8DDD4]">{item.code} · {item.titulo}</Badge>)}</div>{preview.visual.elementos.length > 0 && <p className="mt-4 text-xs leading-5 text-[#8F9AA8]">{preview.visual.elementos.join(" · ")}</p>}</section>}
          </aside>

          <div>
            <section className="overflow-hidden border border-white/10 bg-[#0D131A]">
              <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
                <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#64D5C2]">Lo importante primero</p><h2 className="mt-1 text-2xl font-normal tracking-[-0.025em] text-white">Antecedentes que merecen revisión</h2></div>
                <p className="text-xs text-[#66727F]">Las señales no equivalen a una decisión jurídica.</p>
              </div>

              {preview.antecedentes.length > 0 ? (
                <div className="divide-y divide-white/10">
                  {preview.antecedentes.map((item, index) => <Antecedent key={item.id} item={item} index={index} />)}
                </div>
              ) : (
                <div className="p-8 text-center"><ShieldCheck className="mx-auto h-7 w-7 text-[#64D5C2]" /><p className="mt-3 font-semibold text-white">No aparecieron antecedentes priorizados en esta vista.</p><p className="mt-2 text-sm text-[#8F9AA8]">Esto no garantiza ausencia de conflicto ni registrabilidad.</p></div>
              )}
            </section>

            {preview.locked_count > 0 && <div className="mt-5 flex flex-col gap-4 border border-white/10 bg-[#0A0F15] p-6 text-white sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">Hay {preview.locked_count} antecedentes adicionales.</p><p className="mt-1 text-sm text-[#8F9AA8]">Solicita acceso para conservar la investigación, abrir evidencia completa y activar vigilancia.</p></div><Link href="/contacto"><Button className="shrink-0 gap-2 rounded-lg bg-white text-[#111827] hover:bg-[#E7ECEA]">Solicitar acceso <ArrowRight className="h-4 w-4" /></Button></Link></div>}

            {preview.evidencia.advertencias.length > 0 && <div className="mt-5 border border-amber-300/20 bg-amber-300/[0.06] p-5"><p className="text-sm font-semibold text-amber-100">Limitaciones de esta consulta</p><div className="mt-3 space-y-2">{preview.evidencia.advertencias.map((warning) => <p key={warning} className="text-xs leading-5 text-amber-200/80">• {warning}</p>)}</div></div>}
          </div>
        </div>
      </div>
    </section>
  )
}

function Antecedent({ item, index }: { item: Preview["antecedentes"][number]; index: number }) {
  return (
    <article className="p-5 sm:p-6">
      <div className="grid gap-5 md:grid-cols-[110px_1fr]">
        <div className="flex h-[110px] items-center justify-center border border-white/10 bg-[#0A0F15] p-3">{item.imagen_url ? <img src={item.imagen_url} alt={item.nombre} className="max-h-full max-w-full object-contain" /> : <ImageIcon className="h-6 w-6 text-[#53606D]" />}</div>
        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#66727F]">Antecedente {String(index + 1).padStart(2, "0")}</p><h3 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-white">{item.nombre}</h3><p className="mt-1 text-xs text-[#8F9AA8]">{item.titular || "Titular no informado"} · Niza {item.clases.join(", ") || "s/d"}</p></div>
            <div className="flex items-center gap-2"><Badge variant="outline" className="border-white/10 bg-[#0A0F15] text-[#A1ABB6]">{item.estado}</Badge><span className="border border-amber-300/20 bg-amber-300/[0.06] px-3 py-1 text-xs font-semibold text-amber-200">Relevancia {item.relevancia}</span></div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-4">
            <Signal label="Nombre" value={item.similitud_denominativa} />
            <Signal label="Fonética" value={item.similitud_fonetica} />
            <Signal label="Visual" value={item.similitud_visual} />
            <Signal label="Viena" value={item.similitud_figurativa} />
          </div>

          {(item.razones.length > 0 || item.elementos_visuales_compartidos.length > 0) && <div className="mt-4 border-l-2 border-[#64D5C2]/40 pl-4"><p className="text-xs font-semibold text-[#E7ECEA]">Por qué apareció</p><p className="mt-1 text-xs leading-5 text-[#8F9AA8]">{[...item.razones.slice(0, 3), ...item.elementos_visuales_compartidos.slice(0, 2)].join(" · ")}</p></div>}
        </div>
      </div>
    </article>
  )
}

function Signal({ label, value }: { label: string; value: number | null }) {
  const text = value == null ? "s/d" : value >= 90 ? "Muy alta" : value >= 75 ? "Alta" : value >= 55 ? "Moderada" : "Baja"
  return <div className="bg-[#0A0F15] p-3"><p className="text-[10px] uppercase tracking-[0.13em] text-[#66727F]">{label}</p><div className="mt-1 flex items-baseline justify-between gap-2"><p className="text-xs font-semibold text-[#E7ECEA]">{text}</p><span className="text-[11px] tabular-nums text-[#8F9AA8]">{value == null ? "—" : `${value}%`}</span></div></div>
}

function Step({ icon: Icon, number, title, copy }: { icon: typeof Search; number: string; title: string; copy: string }) { return <div className="grid grid-cols-[38px_1fr] gap-3 border-b border-white/10 py-5"><span className="flex h-8 w-8 items-center justify-center border border-white/10 bg-[#0D131A] text-[#64D5C2]"><Icon className="h-4 w-4" /></span><div><div className="flex items-center gap-2"><span className="font-mono text-[10px] text-[#66727F]">{number}</span><p className="text-sm font-semibold text-white">{title}</p></div><p className="mt-1 text-xs leading-5 text-[#8F9AA8]">{copy}</p></div></div> }
function Stat({ label, value }: { label: string; value: number }) { return <div><p className="text-2xl font-semibold tracking-[-0.03em] tabular-nums text-white">{value}</p><p className="mt-1 text-xs text-[#8F9AA8]">{label}</p></div> }
