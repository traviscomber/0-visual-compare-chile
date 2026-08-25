"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
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
const MAX_ACTIVITY_LENGTH = 400

type Preview = {
  marca: string
  denomination_source: "user" | "image-detected"
  denomination_confidence: number | null
  niza_context_provided: boolean
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
  lectura: { resumen: string; recomendacion: string }
  antecedentes: Array<{
    id: string
    nombre: string
    titular: string
    estado: string
    clases: string[]
    numero_registro: string
    numero_solicitud: string
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
  const [actividad, setActividad] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const loadingTimers = useRef<number[]>([])
  const canRun = Boolean((image || nombre.trim()) && !loading)
  const withNizaContext = Boolean(actividad.trim())

  const clearLoadingTimers = () => {
    for (const timer of loadingTimers.current) window.clearTimeout(timer)
    loadingTimers.current = []
  }

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
    clearLoadingTimers()
    setLoading(true)
    setLoadingStage(0)
    setError(null)
    setPreview(null)
    loadingTimers.current = [
      window.setTimeout(() => setLoadingStage(1), 1200),
      window.setTimeout(() => setLoadingStage(2), withNizaContext ? 4500 : 3000),
      ...(withNizaContext ? [window.setTimeout(() => setLoadingStage(3), 8000)] : []),
    ]
    try {
      const response = await fetch("/api/v1/public/trademark-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          ...(actividad.trim() ? { actividad: actividad.trim() } : {}),
          ...(image ? { image } : {}),
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) return setError(data.error ?? "No pudimos completar la búsqueda.")
      setPreview(data as Preview)
      if (!nombre.trim() && data.marca) setNombre(data.marca)
    } catch {
      setError("No pudimos conectar con el servicio.")
    } finally {
      clearLoadingTimers()
      setLoading(false)
      setLoadingStage(0)
    }
  }

  const reset = () => {
    clearLoadingTimers()
    setPreview(null)
    setError(null)
    setImage(null)
    setImagePreview(null)
    setNombre("")
    setActividad("")
    setLoadingStage(0)
  }

  return (
    <main className="min-h-screen bg-[#090D12] text-[#F4F7F6] selection:bg-[#64D5C2]/25">
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#090D12]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1480px] items-center justify-between px-5 lg:px-10">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex h-10 w-10 items-center justify-center border border-white/10 text-[#8F9AA8] outline-none transition hover:bg-white/[0.05] hover:text-white focus-visible:border-[#64D5C2] focus-visible:ring-2 focus-visible:ring-[#64D5C2]/25" aria-label="Volver al inicio"><ArrowLeft className="h-4 w-4" /></Link>
            <Link href="/" className="flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-[#64D5C2]/30">
              <span className="grid h-9 w-9 place-items-center rounded-[9px] border border-[#64D5C2]/20 bg-[#0B141B] text-sm font-semibold text-white">V</span>
              <span className="leading-none"><span className="block text-[15px] font-semibold tracking-[0.16em] text-white">VIDENTIA</span><span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.16em] text-[#76818F]">by N3uralia</span></span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login"><Button variant="ghost" className="hidden rounded-lg text-[#A8B0BA] hover:bg-white/[0.06] hover:text-white sm:inline-flex">Iniciar sesión</Button></Link>
            <Link href="/contacto"><Button className="rounded-lg bg-white text-[#0A0E13] shadow-none hover:bg-[#E7ECEA]">Solicitar acceso</Button></Link>
          </div>
        </div>
      </nav>

      {!preview ? (
        <section className="relative overflow-hidden px-5 py-12 lg:px-10 lg:py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_10%,rgba(24,132,118,0.13),transparent_30%)]" />
          <div className="relative mx-auto max-w-[1380px]">
            <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#64D5C2]">Investigación real</p>
                <h1 className="mt-5 max-w-[9ch] text-[clamp(3.2rem,6vw,6.6rem)] font-normal leading-[0.92] tracking-[-0.06em] text-white">Entrega la marca. Revisa la evidencia.</h1>
              </div>
              <div className="max-w-2xl lg:justify-self-end">
                <p className="text-lg leading-8 text-[#A0ABB6]">Empieza con un nombre, una imagen o ambos. Si agregas qué productos o servicios identifica la marca, VIDENTIA también sugiere clases Niza con ese contexto.</p>
                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#70808B]"><span>Fuente oficial</span><span>Señales separadas</span><span>Sin veredicto automático</span></div>
              </div>
            </div>

            <div className="mt-12 overflow-hidden border border-white/10 bg-[#0B1118] shadow-[0_35px_100px_rgba(0,0,0,0.28)]">
              <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
                <div className="p-5 sm:p-8 lg:p-10">
                  <div className="mb-5 flex items-center justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#64D5C2]">01 / Consulta</p><h2 className="mt-2 text-2xl font-normal tracking-[-0.03em] text-white">¿Qué quieres investigar?</h2></div><span className="hidden text-xs text-[#66727F] sm:block">PNG · JPEG · WebP · GIF</span></div>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) handleFile(file) }}
                    onDragOver={(event) => event.preventDefault()}
                    className="group flex min-h-[250px] w-full items-center justify-center border border-dashed border-white/15 bg-[#080D12] p-7 text-center outline-none transition hover:border-[#64D5C2]/45 hover:bg-[#0B1218] focus-visible:border-[#64D5C2] focus-visible:ring-2 focus-visible:ring-[#64D5C2]/25"
                  >
                    <input ref={fileRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) handleFile(file) }} />
                    {imagePreview ? (
                      <div><div className="mx-auto flex h-40 w-56 items-center justify-center border border-white/10 bg-[#101820] p-4"><img src={imagePreview} alt="Marca cargada" className="max-h-full max-w-full object-contain" /></div><p className="mt-4 text-sm font-medium text-[#E7ECEA]">Imagen lista para investigar</p><p className="mt-1 text-xs text-[#6F7A87]">Haz clic para reemplazarla</p></div>
                    ) : (
                      <div className="max-w-md"><span className="mx-auto flex h-12 w-12 items-center justify-center border border-[#64D5C2]/20 bg-[#64D5C2]/[0.05] text-[#64D5C2]"><Upload className="h-5 w-5" /></span><p className="mt-5 text-base font-semibold text-white">Arrastra un logo o una fotografía</p><p className="mt-2 text-sm leading-6 text-[#8994A1]">La imagen puede aportar denominación visible, elementos figurativos y códigos Viena cuando la evidencia permite inferirlos.</p></div>
                    )}
                  </button>

                  <div className="my-6 flex items-center gap-4"><div className="h-px flex-1 bg-white/10" /><span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#66727F]">datos de búsqueda</span><div className="h-px flex-1 bg-white/10" /></div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input value={nombre} onChange={(event) => setNombre(event.target.value)} onKeyDown={(event) => event.key === "Enter" && canRun && void run()} placeholder="Nombre de la marca" aria-label="Nombre de la marca" className="h-12 flex-1 rounded-lg border-white/15 bg-[#080D12] text-base text-white shadow-none placeholder:text-[#66727F] focus-visible:border-[#64D5C2] focus-visible:ring-[#64D5C2]/20" />
                    <Button onClick={() => void run()} disabled={!canRun} size="lg" className="h-12 gap-2 rounded-lg bg-[#1B8F80] px-6 text-white shadow-none hover:bg-[#16796C]">{loading ? <><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />Investigando</> : <><Search className="h-4 w-4" />Investigar marca</>}</Button>
                  </div>
                  <div className="mt-3">
                    <Input value={actividad} onChange={(event) => setActividad(event.target.value)} onKeyDown={(event) => event.key === "Enter" && canRun && void run()} maxLength={MAX_ACTIVITY_LENGTH} placeholder="Productos o servicios (opcional)" aria-label="Productos o servicios de la marca" className="h-12 rounded-lg border-white/15 bg-[#080D12] text-sm text-white shadow-none placeholder:text-[#66727F] focus-visible:border-[#64D5C2] focus-visible:ring-[#64D5C2]/20" />
                    <p className="mt-2 text-xs leading-5 text-[#6F7A87]">Añádelo para sugerir clases Niza con contexto. Si lo omites, no inferimos clases sólo a partir del nombre.</p>
                  </div>
                  {loading ? <LoadingStatus stage={loadingStage} withNizaContext={withNizaContext} /> : null}
                  {error && <div role="alert" className="mt-4 flex items-start gap-2 border border-red-400/20 bg-red-400/[0.06] p-4 text-sm text-red-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
                </div>

                <aside className="border-t border-white/10 bg-[#080D12] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#64D5C2]">02 / Qué recibirás</p>
                  <div className="mt-5 border-t border-white/10">
                    <Step icon={Search} number="A" title="Búsqueda trazable" copy="Estrategias ejecutadas y cobertura observada en la fuente." />
                    <Step icon={Waves} number="B" title="Señales separadas" copy="Nombre, fonética, visual y figurativa se muestran sin fundirlas en un veredicto." />
                    <Step icon={Fingerprint} number="C" title="Contexto visual" copy="Viena y elementos compartidos sólo cuando existe evidencia comparable." />
                    <Step icon={ShieldCheck} number="D" title="Limitaciones visibles" copy="Advertencias y faltantes permanecen visibles junto a los resultados." />
                  </div>
                  <div className="mt-7 border-l-2 border-[#64D5C2]/35 pl-4"><p className="text-sm font-medium text-[#DDE6E3]">Fuente ≠ análisis ≠ decisión jurídica</p><p className="mt-2 text-xs leading-5 text-[#71808B]">INAPI permanece como fuente oficial. VIDENTIA organiza la evidencia para investigación y seguimiento.</p></div>
                </aside>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <Results preview={preview} imagePreview={imagePreview} reset={reset} />
      )}
    </main>
  )
}

function LoadingStatus({ stage, withNizaContext }: { stage: number; withNizaContext: boolean }) {
  const steps = withNizaContext
    ? ["Preparando la investigación", "Contrastando cobertura y antecedentes", "Ordenando señales para revisión", "Incorporando el contexto de productos y servicios"]
    : ["Preparando la investigación", "Contrastando cobertura y antecedentes", "Ordenando señales para revisión"]
  const activeStage = Math.min(stage, steps.length - 1)

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="mt-4 border border-[#64D5C2]/20 bg-[#64D5C2]/[0.045] p-4">
      <div className="flex items-start gap-3">
        <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-[#64D5C2] motion-reduce:animate-none" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-[#DDE9E6]">{steps[activeStage]}</p>
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#65827D]">progreso orientativo</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-[#7F918E]">La respuesta llega completa cuando termina la consulta; estos estados sólo explican la espera y no representan un porcentaje real.</p>
          <div className="mt-3 flex flex-wrap gap-2" aria-hidden="true">
            {steps.map((step, index) => (
              <span key={step} className={`inline-flex items-center gap-1.5 border px-2 py-1 text-[10px] ${index < activeStage ? "border-[#64D5C2]/20 text-[#8FC8BE]" : index === activeStage ? "border-[#64D5C2]/35 bg-[#64D5C2]/[0.06] text-[#C4E8E1]" : "border-white/10 text-[#5E6B74]"}`}>
                {index < activeStage ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full border border-current" />}
                {step}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Results({ preview, imagePreview, reset }: { preview: Preview; imagePreview: string | null; reset: () => void }) {
  const consultedAt = formatConsultedAt(preview.evidencia.consultado_en)
  const hasVisualEvidence = preview.visual.viena.length > 0 || preview.visual.elementos.length > 0
  const contactHref = {
    pathname: "/contacto",
    query: {
      origen: "demo",
      marca: preview.marca,
      resultados: String(preview.evidencia.resultados_totales),
    },
  }

  return (
    <section className="px-5 py-8 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1480px]">
        <header className="border-b border-white/10 pb-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-semibold uppercase tracking-[0.14em]"><span className="text-[#64D5C2]">Investigación completada</span><span className="text-[#70808B]">Fuente {preview.evidencia.fuente}</span>{consultedAt && <span className="text-[#70808B]">Consultada {consultedAt}</span>}</div>
              <h1 className="mt-4 text-[clamp(3rem,5vw,5.6rem)] font-normal leading-[0.95] tracking-[-0.055em] text-white">{preview.marca}</h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-[#A0ABB6]">{preview.lectura.resumen}</p>
            </div>
            <Button variant="outline" onClick={reset} className="h-11 gap-2 rounded-lg border-white/15 bg-transparent text-white hover:bg-white/[0.06] hover:text-white"><RotateCcw className="h-4 w-4" />Nueva investigación</Button>
          </div>
        </header>

        <div className="grid border-b border-white/10 lg:grid-cols-[0.76fr_1.24fr]">
          <aside className="border-b border-white/10 py-8 lg:border-b-0 lg:border-r lg:pr-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#64D5C2]">01 / Evidencia consultada</p>
            <div className="mt-5 flex min-h-44 items-center justify-center border border-white/10 bg-[#080D12] p-5">
              {imagePreview ? <img src={imagePreview} alt={preview.marca} className="max-h-40 max-w-[88%] object-contain" /> : <div className="text-center text-[#66727F]"><ImageIcon className="mx-auto h-7 w-7" /><p className="mt-2 text-xs">Búsqueda denominativa</p></div>}
            </div>
            {preview.denomination_source === "image-detected" && <p className="mt-3 text-xs leading-5 text-[#8FDCCD]">La denominación fue detectada desde la imagen y luego utilizada como entrada de búsqueda.</p>}

            <div className="mt-7 grid grid-cols-2 gap-x-5 gap-y-6 border-t border-white/10 pt-6">
              <Stat label="Estrategias ejecutadas" value={preview.busqueda.estrategias_ejecutadas} />
              <Stat label="Resultados únicos" value={preview.busqueda.resultados_unicos} />
              <Stat label="Activos observados" value={preview.evidencia.resultados_activos} />
              <Stat label="Imágenes comparadas" value={preview.evidencia.imagenes_comparadas} />
            </div>

            {preview.busqueda.estrategias.length > 0 && <div className="mt-7 border-t border-white/10 pt-5"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#70808B]">Estrategias ejecutadas</p><div className="mt-3 flex flex-wrap gap-2">{preview.busqueda.estrategias.map((item) => <Badge key={item.id} variant="outline" className="rounded-md border-white/10 bg-[#080D12] text-[#A1ABB6]">{item.label}</Badge>)}</div></div>}
          </aside>

          <div className="py-8 lg:pl-8">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#64D5C2]">02 / Antecedentes</p><h2 className="mt-2 text-3xl font-normal tracking-[-0.04em] text-white">Qué merece revisión y por qué</h2></div>
              <p className="max-w-sm text-xs leading-5 text-[#70808B]">Cada señal se presenta por separado. La posición en esta lista no equivale a registrabilidad ni a una conclusión jurídica.</p>
            </div>

            {preview.antecedentes.length > 0 ? (
              <div className="divide-y divide-white/10">
                {preview.antecedentes.map((item, index) => <Antecedent key={item.id} item={item} index={index} />)}
              </div>
            ) : (
              <div className="py-12 text-center"><ShieldCheck className="mx-auto h-7 w-7 text-[#64D5C2]" /><p className="mt-3 font-semibold text-white">No aparecieron antecedentes priorizados en esta vista.</p><p className="mt-2 text-sm text-[#8F9AA8]">Esto no garantiza ausencia de conflicto ni registrabilidad.</p></div>
            )}
          </div>
        </div>

        <div className="grid border-b border-white/10 lg:grid-cols-3">
          <EvidenceColumn index="03" title="Clases y ámbito" icon={<Layers3 className="h-4 w-4" />}>
            {preview.niza.length > 0 ? (
              <div className="space-y-4">{preview.niza.map((item) => <div key={`${item.numero}-${item.titulo}`} className="border-t border-white/10 pt-4 first:border-t-0 first:pt-0"><div className="flex items-baseline gap-3"><span className="font-mono text-xs text-[#64D5C2]">Niza {item.numero}</span><strong className="text-sm font-medium text-[#E5ECEA]">{item.titulo}</strong></div><p className="mt-2 text-xs leading-5 text-[#81909A]">{item.razon}</p></div>)}</div>
            ) : preview.niza_context_provided ? (
              <p className="text-sm leading-6 text-[#788792]">No se devolvieron clases Niza sugeridas con el contexto entregado.</p>
            ) : (
              <div><p className="text-sm leading-6 text-[#A8B3B9]">No asignamos clases Niza sólo a partir del nombre.</p><p className="mt-2 text-xs leading-5 text-[#6F7A87]">En una nueva investigación agrega los productos o servicios de la marca para obtener una sugerencia contextual.</p></div>
            )}
          </EvidenceColumn>

          <EvidenceColumn index="04" title="Señales visuales" icon={<Fingerprint className="h-4 w-4" />}>
            {hasVisualEvidence ? <><div className="flex flex-wrap gap-2">{preview.visual.viena.slice(0, 8).map((item) => <Badge key={item.code} variant="outline" className="rounded-md border-[#64D5C2]/20 bg-[#64D5C2]/[0.04] text-[#A8DDD4]">{item.code} · {item.titulo}</Badge>)}</div>{preview.visual.elementos.length > 0 && <p className="mt-4 text-xs leading-5 text-[#81909A]">{preview.visual.elementos.join(" · ")}</p>}</> : <p className="text-sm leading-6 text-[#788792]">No hubo evidencia visual suficiente para mostrar códigos o elementos comparables.</p>}
          </EvidenceColumn>

          <EvidenceColumn index="05" title="Lectura asistida" icon={<ShieldCheck className="h-4 w-4" />}>
            <p className="text-sm leading-6 text-[#B1BEC3]">{preview.lectura.recomendacion}</p>
            <div className="mt-5 border-l-2 border-[#64D5C2]/35 pl-4"><p className="text-xs font-medium text-[#DDE6E3]">Orientación para revisión</p><p className="mt-1 text-xs leading-5 text-[#788792]">Esta lectura resume señales observadas. No reemplaza análisis jurídico ni la consulta directa de la fuente oficial.</p></div>
          </EvidenceColumn>
        </div>

        {preview.locked_count > 0 && <div className="mt-6 flex flex-col gap-4 border border-white/10 bg-[#0A0F15] p-6 text-white sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">Hay {preview.locked_count} antecedentes adicionales en la investigación.</p><p className="mt-1 text-sm text-[#8F9AA8]">Continúa con esta misma marca para conservar el caso, abrir evidencia completa y activar vigilancia.</p></div><Link href={contactHref}><Button className="shrink-0 gap-2 rounded-lg bg-white text-[#111827] hover:bg-[#E7ECEA]">Continuar investigación <ArrowRight className="h-4 w-4" /></Button></Link></div>}

        {preview.evidencia.advertencias.length > 0 && <section className="mt-6 border border-amber-300/20 bg-amber-300/[0.05] p-6"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" /><div><p className="text-sm font-semibold text-amber-100">Limitaciones de esta consulta</p><div className="mt-3 space-y-2">{preview.evidencia.advertencias.map((warning) => <p key={warning} className="text-xs leading-5 text-amber-100/75">{warning}</p>)}</div></div></div></section>}

        <footer className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs leading-5 text-[#66727F] sm:flex-row sm:items-center sm:justify-between"><p>VIDENTIA organiza evidencia y señales de investigación. INAPI permanece como fuente oficial.</p><span className="font-medium text-[#8997A0]">Fuente ≠ análisis ≠ decisión jurídica</span></footer>
      </div>
    </section>
  )
}

function Antecedent({ item, index }: { item: Preview["antecedentes"][number]; index: number }) {
  const identifiers = [item.numero_solicitud ? `Solicitud ${item.numero_solicitud}` : null, item.numero_registro ? `Registro ${item.numero_registro}` : null].filter(Boolean)
  const reasons = [...item.razones.slice(0, 3), ...item.elementos_visuales_compartidos.slice(0, 2)]

  return (
    <article className="py-7">
      <div className="grid gap-5 md:grid-cols-[112px_1fr]">
        <div className="flex h-[112px] items-center justify-center border border-white/10 bg-[#080D12] p-3">{item.imagen_url ? <img src={item.imagen_url} alt={item.nombre} className="max-h-full max-w-full object-contain" /> : <ImageIcon className="h-6 w-6 text-[#53606D]" />}</div>
        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#70808B]">Antecedente {String(index + 1).padStart(2, "0")}</p><h3 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-white">{item.nombre}</h3><p className="mt-1 text-xs leading-5 text-[#8F9AA8]">{item.titular || "Titular no informado"}{item.clases.length > 0 ? ` · Niza ${item.clases.join(", ")}` : ""}</p>{identifiers.length > 0 && <p className="mt-1 font-mono text-[10px] text-[#64727D]">{identifiers.join(" · ")}</p>}</div>
            <span className="self-start border border-white/10 bg-[#080D12] px-3 py-1 text-xs font-medium text-[#B6C0C5]">{item.estado}</span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-4">
            <Signal label="Nombre" value={item.similitud_denominativa} />
            <Signal label="Fonética" value={item.similitud_fonetica} />
            <Signal label="Visual" value={item.similitud_visual} />
            <Signal label="Figurativa" value={item.similitud_figurativa} />
          </div>

          {reasons.length > 0 && <div className="mt-4 border-l-2 border-[#64D5C2]/35 pl-4"><p className="text-xs font-semibold text-[#E7ECEA]">Por qué apareció</p><p className="mt-1 text-xs leading-5 text-[#8F9AA8]">{reasons.join(" · ")}</p></div>}
          {item.viena_compartida.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{item.viena_compartida.slice(0, 6).map((code) => <span key={code} className="border border-white/10 px-2 py-1 font-mono text-[10px] text-[#82919B]">Viena {code}</span>)}</div>}
        </div>
      </div>
    </article>
  )
}

function Signal({ label, value }: { label: string; value: number | null }) {
  const text = value == null ? "Sin dato" : value >= 90 ? "Muy próxima" : value >= 75 ? "Próxima" : value >= 55 ? "Parcial" : "Baja"
  return <div className="bg-[#080D12] p-3"><p className="text-[10px] uppercase tracking-[0.13em] text-[#66727F]">{label}</p><div className="mt-1 flex items-baseline justify-between gap-2"><p className="text-xs font-semibold text-[#E7ECEA]">{text}</p><span className="text-[11px] tabular-nums text-[#8F9AA8]">{value == null ? "—" : `${value}%`}</span></div></div>
}

function Step({ icon: Icon, number, title, copy }: { icon: typeof Search; number: string; title: string; copy: string }) {
  return <div className="grid grid-cols-[38px_1fr] gap-3 border-b border-white/10 py-5 last:border-b-0"><span className="flex h-8 w-8 items-center justify-center border border-white/10 bg-[#0D131A] text-[#64D5C2]"><Icon className="h-4 w-4" /></span><div><div className="flex items-center gap-2"><span className="font-mono text-[10px] text-[#66727F]">{number}</span><p className="text-sm font-semibold text-white">{title}</p></div><p className="mt-1 text-xs leading-5 text-[#8F9AA8]">{copy}</p></div></div>
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div><p className="text-2xl font-semibold tracking-[-0.03em] tabular-nums text-white">{value}</p><p className="mt-1 text-xs leading-5 text-[#8F9AA8]">{label}</p></div>
}

function EvidenceColumn({ index, title, icon, children }: { index: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="border-b border-white/10 py-7 lg:border-b-0 lg:border-r lg:px-7 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#64D5C2]">{index} / contexto</p><h3 className="mt-2 text-xl font-normal tracking-[-0.025em] text-white">{title}</h3></div><span className="text-[#64D5C2]">{icon}</span></div><div className="mt-5">{children}</div></section>
}

function formatConsultedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(date)
}