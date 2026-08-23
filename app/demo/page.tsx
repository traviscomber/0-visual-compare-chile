"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { AlertTriangle, ArrowRight, CheckCircle2, Fingerprint, ImageIcon, Layers3, Loader2, Search, Sparkles, Upload } from "lucide-react"
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
  busqueda: { estrategias_planificadas: number; estrategias_ejecutadas: number; estrategias: Array<{ id: string; label: string; query: string }>; resultados_brutos: number; resultados_unicos: number; duplicados_eliminados: number; estrategias_fallidas: number }
  evidencia: { fuente: string; consultado_en: string; resultados_totales: number; resultados_activos: number; confianza: string; imagenes_comparadas: number; antecedentes_con_viena: number; advertencias: string[] }
  lectura: { nivel: "ALTO" | "MEDIO" | "BAJO"; resumen: string; recomendacion: string }
  antecedentes: Array<{ id: string; nombre: string; titular: string; estado: string; clases: string[]; numero_registro: string; numero_solicitud: string; relevancia: number; razones: string[]; similitud_denominativa: number; similitud_fonetica: number; similitud_visual: number | null; similitud_figurativa: number | null; viena_compartida: string[]; elementos_visuales_compartidos: string[]; imagen_url?: string }>
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
    setError(null); setPreview(null)
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return setError("Usa PNG, JPEG, WebP o GIF.")
    if (file.size > MAX_FILE_BYTES) return setError("La imagen supera el máximo de 4,5 MB.")
    const reader = new FileReader()
    reader.onload = () => { const value = reader.result; if (typeof value !== "string") return setError("No pudimos leer la imagen."); setImage(value); setImagePreview(value) }
    reader.readAsDataURL(file)
  }

  const run = async () => {
    if (!canRun) return
    setLoading(true); setError(null); setPreview(null)
    try {
      const response = await fetch("/api/v1/public/trademark-preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre: nombre.trim(), ...(image ? { image } : {}) }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) return setError(data.error ?? "No pudimos completar la búsqueda.")
      setPreview(data as Preview)
      if (!nombre.trim() && data.marca) setNombre(data.marca)
    } catch { setError("No pudimos conectar con el servicio.") } finally { setLoading(false) }
  }

  return <main className="min-h-screen bg-slate-950 text-white">
    <nav className="border-b border-white/10 bg-slate-950/95"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8"><Link href="/" className="flex flex-col leading-none"><span className="text-base font-semibold">N3uralia Intelligence</span><span className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">Visual Compare</span></Link><div className="flex items-center gap-2"><Link href="/auth/login"><Button variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white">Iniciar sesión</Button></Link><Link href="/auth/sign-up?redirectTo=%2Fevaluar"><Button className="bg-white text-slate-950 hover:bg-slate-200">Crear espacio</Button></Link></div></div></nav>

    <section className="px-5 py-14 lg:px-8 lg:py-20"><div className="mx-auto max-w-7xl">
      <div className="max-w-4xl"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300"><Sparkles className="h-4 w-4 text-blue-300" /> Trademark Intelligence · demo real</div><h1 className="text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">Una marca entra. <span className="text-blue-300">La complejidad desaparece.</span></h1><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">Nombre, fonética, Niza, huella Viena y similitud visual se analizan como señales separadas. Tú ves qué antecedente importa y por qué.</p></div>

      {!preview ? <div className="mt-10 grid overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-5 sm:p-8"><button type="button" onClick={() => fileRef.current?.click()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) handleFile(file) }} onDragOver={(event) => event.preventDefault()} className="flex min-h-64 w-full items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950/60 p-6 text-center transition hover:border-blue-300/50 hover:bg-white/[0.04]"><input ref={fileRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) handleFile(file) }} />{imagePreview ? <div><div className="mx-auto flex h-40 w-56 items-center justify-center rounded-2xl bg-white p-4"><img src={imagePreview} alt="Marca cargada" className="max-h-full max-w-full object-contain" /></div><p className="mt-4 text-sm text-slate-300">Imagen lista · haz clic para reemplazarla</p></div> : <div><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5"><Upload className="h-6 w-6 text-blue-300" /></span><p className="mt-4 font-medium">Arrastra un logo o una fotografía</p><p className="mt-2 text-sm text-slate-500">Leemos denominación, elementos visuales y huella Viena.</p></div>}</button><div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-white/10" /><span className="text-xs uppercase tracking-[0.18em] text-slate-500">o</span><div className="h-px flex-1 bg-white/10" /></div><Input value={nombre} onChange={(event) => setNombre(event.target.value)} onKeyDown={(event) => event.key === "Enter" && canRun && void run()} placeholder="Escribe el nombre de la marca" className="h-12 border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500" />{error && <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}<Button onClick={() => void run()} disabled={!canRun} size="lg" className="mt-5 h-12 w-full gap-2 bg-white text-slate-950 hover:bg-slate-200 sm:w-auto">{loading ? <><Loader2 className="h-4 w-4 animate-spin" />Construyendo inteligencia</> : <><Search className="h-4 w-4" />Analizar esta marca</>}</Button></div>
        <aside className="border-t border-white/10 bg-white/[0.025] p-6 sm:p-8 lg:border-l lg:border-t-0"><p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Qué hacemos por ti</p><div className="mt-6 space-y-5">{["Construimos varias estrategias denominativas.","Detectamos similitud fonética y ortográfica.","Clasificamos la huella figurativa con Viena.","Comparamos estructura visual cuando existe imagen oficial.","Priorizamos evidencia sin fingir certeza jurídica."].map((item) => <div key={item} className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /><p className="text-sm leading-6 text-slate-300">{item}</p></div>)}</div></aside>
      </div> : <div className="mt-10 space-y-5">
        <section className="grid overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] lg:grid-cols-[0.3fr_0.7fr]"><div className="flex min-h-56 items-center justify-center border-b border-white/10 bg-white/[0.02] p-5 lg:border-b-0 lg:border-r">{imagePreview ? <div className="flex h-44 w-full items-center justify-center rounded-2xl bg-white p-4"><img src={imagePreview} alt={preview.marca} className="max-h-full max-w-full object-contain" /></div> : <div className="text-center text-slate-500"><ImageIcon className="mx-auto h-8 w-8" /><p className="mt-3 text-sm">Búsqueda denominativa</p></div>}</div><div className="p-6 sm:p-8"><div className="flex flex-wrap items-center gap-2"><Badge className="bg-white text-slate-950 hover:bg-white">{preview.marca}</Badge><Badge variant="outline" className="border-white/15 text-slate-300">Fuente: INAPI</Badge>{preview.denomination_source === "image-detected" && <Badge variant="outline" className="border-blue-300/30 text-blue-200">Nombre leído desde imagen</Badge>}</div><p className="mt-6 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Lectura preliminar</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">{preview.lectura.resumen}</h2><div className="mt-6 grid gap-3 sm:grid-cols-4"><Metric label="Resultados únicos" value={preview.evidencia.resultados_totales} /><Metric label="Activos" value={preview.evidencia.resultados_activos} /><Metric label="Con Viena" value={preview.evidencia.antecedentes_con_viena} /><Metric label="Imágenes comparadas" value={preview.evidencia.imagenes_comparadas} /></div></div></section>

        {preview.visual.fingerprint.codes.length > 0 && <section className="rounded-3xl border border-violet-300/15 bg-violet-300/[0.045] p-5 sm:p-7"><div className="flex items-start gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-300/10"><Fingerprint className="h-5 w-5 text-violet-200" /></span><div className="min-w-0 flex-1"><p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-200">Visual Fingerprint · Viena VCL 10</p><h2 className="mt-1 text-2xl font-semibold">La imagen se convierte en una huella buscable.</h2><div className="mt-4 flex flex-wrap gap-2">{preview.visual.viena.map((item) => <Badge key={item.code} variant="outline" className="border-white/15 text-slate-200">{item.code} · {item.titulo}</Badge>)}</div>{preview.visual.elementos.length > 0 && <p className="mt-4 text-sm leading-6 text-slate-300">Elementos: {preview.visual.elementos.join(" · ")}</p>}</div></div></section>}

        <section className="rounded-3xl border border-blue-300/15 bg-blue-300/[0.045] p-5 sm:p-7"><div className="flex items-start gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 bg-blue-300/10"><Layers3 className="h-5 w-5 text-blue-200" /></span><div className="min-w-0 flex-1"><p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-200">Búsqueda construida automáticamente</p><h2 className="mt-1 text-2xl font-semibold">Hicimos el trabajo de formulario por ti.</h2><p className="mt-2 text-sm leading-6 text-slate-300">Ejecutamos {preview.busqueda.estrategias_ejecutadas} estrategia(s), recibimos {preview.busqueda.resultados_brutos} filas y consolidamos {preview.busqueda.resultados_unicos} antecedentes únicos{preview.busqueda.duplicados_eliminados ? `, eliminando ${preview.busqueda.duplicados_eliminados} duplicados` : ""}.</p><div className="mt-4 flex flex-wrap gap-2">{preview.busqueda.estrategias.map((strategy) => <Badge key={strategy.id} variant="outline" className="border-white/15 text-slate-300">{strategy.label}</Badge>)}</div></div></section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-7"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-300">Lo importante primero</p><h2 className="mt-1 text-2xl font-semibold">Antecedentes que merecen revisión</h2><p className="mt-2 text-xs text-slate-500">Cada señal se muestra separada. Ausencia de dato no se convierte en cero.</p></div>{preview.antecedentes.length ? <div className="mt-5 grid gap-4 lg:grid-cols-2">{preview.antecedentes.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/65"><div className="grid grid-cols-[96px_1fr] gap-4 p-5"> <div className="flex h-24 items-center justify-center rounded-xl bg-white/5 p-2">{item.imagen_url ? <img src={item.imagen_url} alt={item.nombre} className="max-h-full max-w-full object-contain" /> : <ImageIcon className="h-6 w-6 text-slate-600" />}</div><div><div className="flex items-start justify-between gap-3"><div><p className="text-lg font-semibold">{item.nombre}</p><p className="mt-1 text-xs text-slate-500">{item.titular || "Titular no informado"}</p></div><Badge variant="outline" className="border-white/15 text-slate-300">{item.estado}</Badge></div><p className="mt-3 text-xs text-slate-500">Niza {item.clases.join(", ") || "s/d"}</p></div></div><div className="grid grid-cols-2 border-y border-white/10 sm:grid-cols-4"><Signal label="Nombre" value={item.similitud_denominativa} /><Signal label="Fonética" value={item.similitud_fonetica} /><Signal label="Visual estructural" value={item.similitud_visual} /><Signal label="Figurativa Viena" value={item.similitud_figurativa} /></div><div className="p-5">{item.elementos_visuales_compartidos.length > 0 && <div className="mb-4"><p className="text-xs font-medium uppercase tracking-[0.14em] text-violet-300">Elementos compartidos</p><div className="mt-2 flex flex-wrap gap-2">{item.elementos_visuales_compartidos.map((element) => <Badge key={element} variant="outline" className="border-violet-300/20 text-violet-100">{element}</Badge>)}</div></div>}<p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Por qué apareció</p><div className="mt-2 space-y-1">{item.razones.map((reason) => <p key={reason} className="text-sm leading-6 text-slate-300">• {reason}</p>)}</div><div className="mt-4 flex items-center justify-between text-xs text-slate-500"><span>{item.numero_registro ? `Registro ${item.numero_registro}` : item.numero_solicitud ? `Solicitud ${item.numero_solicitud}` : "Identificador no informado"}</span><span>Relevancia {item.relevancia}/100</span></div></div></article>)}</div> : <div className="mt-5 rounded-xl border border-emerald-300/15 bg-emerald-300/5 p-5"><CheckCircle2 className="h-5 w-5 text-emerald-300" /><p className="mt-3 font-medium">No aparecieron antecedentes priorizados.</p><p className="mt-1 text-sm text-slate-400">Esto no garantiza registrabilidad.</p></div>}</section>

        <section className="grid gap-4 lg:grid-cols-3"><InfoCard title="Huella visual" body={preview.visual.fingerprint.labels.length ? preview.visual.fingerprint.labels.join(" · ") : "Sin huella figurativa disponible."} /><InfoCard title="Clases sugeridas" body={preview.niza.length ? preview.niza.map((item) => `Clase ${item.numero}`).join(" · ") : "Sin clases sugeridas."} /><InfoCard title="Siguiente paso" body={preview.lectura.recomendacion} /></section>
        <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-7 text-center"><h2 className="text-2xl font-semibold">La demo muestra la evidencia. El workspace la convierte en expediente.</h2><p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">Guarda análisis, genera informes, activa vigilancia y administra portafolios desde N3uralia Intelligence.</p><Link href="/auth/sign-up?redirectTo=%2Fevaluar"><Button size="lg" className="mt-6 gap-2 bg-white text-slate-950 hover:bg-slate-200">Crear espacio <ArrowRight className="h-4 w-4" /></Button></Link></section>
      </div>}
    </div></section>
  </main>
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl bg-white/[0.04] p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div> }
function Signal({ label, value }: { label: string; value: number | null }) { return <div className="p-4"><p className="text-[11px] leading-4 text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold">{value == null ? "s/d" : `${Math.round(value)}%`}</p></div> }
function InfoCard({ title, body }: { title: string; body: string }) { return <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="font-medium">{title}</p><p className="mt-2 text-sm leading-6 text-slate-400">{body}</p></article> }
