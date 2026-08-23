"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { AlertTriangle, ArrowRight, CheckCircle2, ImageIcon, Loader2, Search, ShieldAlert, Sparkles, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]
const MAX_FILE_BYTES = 4_500_000

type Preview = {
  marca: string
  denomination_source: "user" | "image-detected"
  denomination_confidence: number | null
  visual: { elementos: string[]; colores: string[]; viena: Array<{ code: string; elemento: string; confidence: number }> }
  niza: Array<{ numero: string; titulo: string; tipo: string; razon: string }>
  evidencia: { fuente: string; consultado_en: string; resultados_totales: number; resultados_activos: number; confianza: string; advertencias: string[] }
  lectura: { nivel: "ALTO" | "MEDIO" | "BAJO"; resumen: string; recomendacion: string }
  antecedentes: Array<{ id: string; nombre: string; titular: string; estado: string; clases: string[]; numero_registro: string; numero_solicitud: string; relevancia: number; razones: string[] }>
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

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-white/10 bg-slate-950/95"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8"><Link href="/" className="text-lg font-semibold tracking-tight">Visual Compare</Link><div className="flex items-center gap-2"><Link href="/auth/login"><Button variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white">Iniciar sesión</Button></Link><Link href="/auth/sign-up?redirectTo=%2Fevaluar"><Button className="bg-white text-slate-950 hover:bg-slate-200">Crear espacio</Button></Link></div></div></nav>
      <section className="px-5 py-14 lg:px-8 lg:py-20"><div className="mx-auto max-w-7xl">
        <div className="max-w-4xl"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300"><Sparkles className="h-4 w-4 text-blue-300" /> Prueba real · sin cuenta</div><h1 className="text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">Danos la marca. <span className="text-blue-300">Nosotros hacemos la búsqueda.</span></h1><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">Sube un logo, una foto o escribe el nombre. Visual Compare organiza señales visuales, clases y antecedentes oficiales para mostrarte qué merece revisión.</p></div>
        {!preview ? <div className="mt-10 grid overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] lg:grid-cols-[1.15fr_0.85fr]">
          <div className="p-5 sm:p-8"><button type="button" onClick={() => fileRef.current?.click()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) handleFile(file) }} onDragOver={(event) => event.preventDefault()} className="flex min-h-64 w-full items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950/60 p-6 text-center transition hover:border-blue-300/50 hover:bg-white/[0.04]"><input ref={fileRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) handleFile(file) }} />{imagePreview ? <div><div className="mx-auto flex h-40 w-56 items-center justify-center rounded-2xl bg-white p-4"><img src={imagePreview} alt="Marca cargada" className="max-h-full max-w-full object-contain" /></div><p className="mt-4 text-sm text-slate-300">Imagen lista · haz clic para reemplazarla</p></div> : <div><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5"><Upload className="h-6 w-6 text-blue-300" /></span><p className="mt-4 font-medium">Arrastra un logo o una fotografía</p><p className="mt-2 text-sm text-slate-500">Intentaremos leer la denominación directamente desde la imagen.</p></div>}</button><div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-white/10" /><span className="text-xs uppercase tracking-[0.18em] text-slate-500">o</span><div className="h-px flex-1 bg-white/10" /></div><Input value={nombre} onChange={(event) => setNombre(event.target.value)} onKeyDown={(event) => event.key === "Enter" && canRun && void run()} placeholder="Escribe el nombre de la marca" className="h-12 border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500" />{error && <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}<Button onClick={() => void run()} disabled={!canRun} size="lg" className="mt-5 h-12 w-full gap-2 bg-white text-slate-950 hover:bg-slate-200 sm:w-auto">{loading ? <><Loader2 className="h-4 w-4 animate-spin" />Analizando antecedentes</> : <><Search className="h-4 w-4" />Buscar esta marca</>}</Button><p className="mt-3 text-xs text-slate-500">Demo limitada. La búsqueda completa, guardado, informes y vigilancia requieren cuenta.</p></div>
          <aside className="border-t border-white/10 bg-white/[0.025] p-6 sm:p-8 lg:border-l lg:border-t-0"><p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Qué hacemos por ti</p><div className="mt-6 space-y-5">{["Leemos la denominación cuando es visible.","Clasificamos señales figurativas y clases relevantes.","Consultamos antecedentes oficiales INAPI.","Priorizamos qué registros merece revisar primero."].map((item) => <div key={item} className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /><p className="text-sm leading-6 text-slate-300">{item}</p></div>)}</div></aside>
        </div> : <div className="mt-10 space-y-5">
          <section className="grid overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] lg:grid-cols-[0.3fr_0.7fr]"><div className="flex min-h-56 items-center justify-center border-b border-white/10 bg-white/[0.02] p-5 lg:border-b-0 lg:border-r">{imagePreview ? <div className="flex h-44 w-full items-center justify-center rounded-2xl bg-white p-4"><img src={imagePreview} alt={preview.marca} className="max-h-full max-w-full object-contain" /></div> : <div className="text-center text-slate-500"><ImageIcon className="mx-auto h-8 w-8" /><p className="mt-3 text-sm">Búsqueda denominativa</p></div>}</div><div className="p-6 sm:p-8"><div className="flex flex-wrap items-center gap-2"><Badge className="bg-white text-slate-950 hover:bg-white">{preview.marca}</Badge><Badge variant="outline" className="border-white/15 text-slate-300">Fuente: INAPI</Badge>{preview.denomination_source === "image-detected" && <Badge variant="outline" className="border-blue-300/30 text-blue-200">Nombre leído desde imagen</Badge>}</div><p className="mt-6 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Lectura preliminar</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">{preview.lectura.resumen}</h2><div className="mt-6 grid gap-3 sm:grid-cols-3"><Metric label="Resultados INAPI" value={preview.evidencia.resultados_totales} /><Metric label="Antecedentes activos" value={preview.evidencia.resultados_activos} /><Metric label="Confianza de fuente" value={preview.evidencia.confianza} /></div></div></section>
          <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-7"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-300">Lo importante primero</p><h2 className="mt-1 text-2xl font-semibold">Antecedentes que merecen revisión</h2></div><p className="text-xs text-slate-500">Relevancia operativa ≠ conclusión jurídica</p></div>{preview.antecedentes.length ? <div className="mt-5 grid gap-4 md:grid-cols-2">{preview.antecedentes.map((item) => <article key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/65 p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-lg font-semibold">{item.nombre}</p><p className="mt-1 text-xs text-slate-500">{item.titular || "Titular no informado"}</p></div><Badge variant="outline" className="border-white/15 text-slate-300">{item.estado}</Badge></div><div className="mt-5 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-white/[0.04] p-3"><p className="text-slate-500">Clases</p><p className="mt-1 text-slate-200">{item.clases.join(", ") || "s/d"}</p></div><div className="rounded-lg bg-white/[0.04] p-3"><p className="text-slate-500">Relevancia</p><p className="mt-1 text-slate-200">{item.relevancia}/100</p></div></div><div className="mt-4"><p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Por qué apareció</p><div className="mt-2 space-y-1">{item.razones.map((reason) => <p key={reason} className="text-sm leading-6 text-slate-300">• {reason}</p>)}</div></div><div className="mt-4 text-xs text-slate-500">{item.numero_registro ? `Registro ${item.numero_registro}` : item.numero_solicitud ? `Solicitud ${item.numero_solicitud}` : "Identificador no informado"}</div></article>)}</div> : <div className="mt-5 rounded-xl border border-emerald-300/15 bg-emerald-300/5 p-5"><CheckCircle2 className="h-5 w-5 text-emerald-300" /><p className="mt-3 font-medium">No aparecieron antecedentes priorizados.</p><p className="mt-1 text-sm text-slate-400">Esto no garantiza registrabilidad; conviene revisar variantes, clases y fuentes complementarias.</p></div>}</section>
          <section className="grid gap-4 lg:grid-cols-3"><InfoCard title="Señales visuales" body={preview.visual.elementos.length ? preview.visual.elementos.join(" · ") : "Consulta denominativa sin señales figurativas."} /><InfoCard title="Clases sugeridas" body={preview.niza.length ? preview.niza.map((item) => `Clase ${item.numero}`).join(" · ") : "Sin clases sugeridas."} /><InfoCard title="Siguiente paso" body={preview.lectura.recomendacion} /></section>
          <section className="rounded-3xl border border-blue-300/20 bg-blue-300/[0.06] p-6 sm:p-8"><div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center"><div><div className="flex items-center gap-2 text-blue-200"><ShieldAlert className="h-4 w-4" /><p className="text-sm font-medium">Ya viste el valor antes de crear una cuenta</p></div><h2 className="mt-2 text-2xl font-semibold">Guarda esta investigación y conviértela en un caso vivo.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Desbloquea todos los antecedentes, historial, informe, vigilancia y seguimiento del portafolio. {preview.locked_count > 0 ? `Hay ${preview.locked_count} antecedentes adicionales fuera de esta vista previa.` : ""}</p></div><div className="flex flex-col gap-2 sm:flex-row lg:flex-col"><Link href="/auth/sign-up?redirectTo=%2Fevaluar"><Button size="lg" className="w-full gap-2 bg-white text-slate-950 hover:bg-slate-200">Crear espacio y continuar <ArrowRight className="h-4 w-4" /></Button></Link><Button variant="outline" size="lg" onClick={() => setPreview(null)} className="border-white/15 bg-transparent text-white hover:bg-white/10">Probar otra marca</Button></div></div></section>
        </div>}
      </div></section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold capitalize">{value}</p></div> }
function InfoCard({ title, body }: { title: string; body: string }) { return <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><p className="font-medium">{title}</p><p className="mt-3 text-sm leading-6 text-slate-400">{body}</p></article> }
