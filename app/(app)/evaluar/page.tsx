"use client"

import { useRef, useState } from "react"
import type { TrademarkInsightReport } from "@/lib/agent/trademark-agent"
import { AlertTriangle, ArrowRight, CheckCircle2, ImageIcon, Layers3, Loader2, Search, ShieldAlert, ShieldCheck, Upload } from "lucide-react"
import { OwnerContextPanel } from "@/components/intelligence/owner-context-panel"
import { PrecedentPanel } from "@/components/intelligence/precedent-panel"
import { WatchBrandAction } from "@/components/intelligence/watch-brand-action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]
const MAX_FILE_BYTES = 4_500_000

type PersistedTrademarkReport = TrademarkInsightReport & { comparison_id: string; denomination_source?: "user" | "image-detected"; denomination_confidence?: number | null }

function RiskBadge({ nivel }: { nivel: string }) {
  const normalized = nivel?.toUpperCase()
  if (normalized === "ALTO") return <Badge className="border-red-200 bg-red-50 text-red-700"><AlertTriangle className="mr-1 h-3.5 w-3.5" />Revisión prioritaria</Badge>
  if (normalized === "MEDIO") return <Badge className="border-amber-200 bg-amber-50 text-amber-800"><ShieldAlert className="mr-1 h-3.5 w-3.5" />Conviene revisar</Badge>
  return <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700"><ShieldCheck className="mr-1 h-3.5 w-3.5" />Sin alerta principal</Badge>
}

function confidenceLabel(value?: "alta" | "media" | "baja") {
  return value === "alta" ? "Alta" : value === "media" ? "Media" : "Baja"
}

export default function EvaluarMarcaPage() {
  const [image, setImage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [nombre, setNombre] = useState("")
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<PersistedTrademarkReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const canAnalyze = Boolean((nombre.trim() || image) && !loading)

  const reset = () => { setReport(null); setImage(null); setImagePreview(null); setNombre(""); setError(null) }

  const handleFile = (file: File) => {
    setError(null); setReport(null)
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return setError("Usa una imagen PNG, JPEG, WebP o GIF.")
    if (file.size > MAX_FILE_BYTES) return setError("La imagen debe pesar menos de 4,5 MB.")
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) return setError("No pudimos leer esa imagen.")
      setImagePreview(dataUrl); setImage(dataUrl)
    }
    reader.onerror = () => setError("No pudimos leer esa imagen.")
    reader.readAsDataURL(file)
  }

  const handleAnalyze = async () => {
    if (!canAnalyze) return
    setLoading(true); setError(null); setReport(null)
    try {
      const response = await fetch("/api/v1/agent/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...(image ? { image } : {}), nombre: nombre.trim() }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) { setError(response.status === 401 ? "Tu sesión terminó. Vuelve a iniciar sesión." : data.error ?? "No pudimos completar el análisis."); return }
      setReport(data as PersistedTrademarkReport)
    } catch { setError("No pudimos conectar con el servicio. Intenta nuevamente.") } finally { setLoading(false) }
  }

  const reportNiza = report?.niza.clases.map((clase) => Number(clase.numero)).filter((value) => Number.isInteger(value) && value >= 1 && value <= 45) ?? []

  return <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0F766E]">Evaluar marca</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">Sube la marca. Nosotros ordenamos lo importante.</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">Puedes subir un logo o una foto, escribir el nombre, o hacer ambas cosas. No necesitas configurar filtros ni conocer el buscador de INAPI.</p>
      </header>

      {!report ? <section className="grid gap-0 overflow-hidden rounded-[28px] border border-border bg-white lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-5 sm:p-8">
          <button type="button" onClick={() => fileRef.current?.click()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) handleFile(file) }} onDragOver={(event) => event.preventDefault()} className="flex min-h-56 w-full items-center justify-center rounded-2xl border border-dashed border-border bg-slate-50 p-6 text-center transition hover:border-teal-300 hover:bg-teal-50/30">
            <input ref={fileRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) handleFile(file) }} />
            {imagePreview ? <div className="flex flex-col items-center gap-3"><div className="flex h-36 w-52 items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-3"><img src={imagePreview} alt="Marca seleccionada" className="max-h-full max-w-full object-contain" /></div><p className="text-sm font-medium">Imagen lista · pulsa para cambiarla</p></div> : <div><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#0F766E] shadow-sm"><Upload className="h-5 w-5" /></span><p className="mt-4 font-medium">Sube un logo o una fotografía</p><p className="mt-1 text-sm text-muted-foreground">También puedes arrastrarla aquí</p></div>}
          </button>

          <div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-border"/><span className="text-xs text-muted-foreground">o escribe el nombre</span><div className="h-px flex-1 bg-border"/></div>
          <label htmlFor="brand-name" className="text-sm font-medium">Nombre de la marca</label>
          <Input id="brand-name" value={nombre} onChange={(event) => setNombre(event.target.value)} onKeyDown={(event) => event.key === "Enter" && canAnalyze && void handleAnalyze()} maxLength={120} placeholder="Ejemplo: PATAGONIA" className="mt-2 h-12 text-base" />
          <p className="mt-2 text-xs text-muted-foreground">Si la imagen tiene un nombre legible, intentaremos detectarlo. Puedes escribirlo para confirmarlo.</p>
          {error && <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0"/>{error}</div>}
          <Button onClick={() => void handleAnalyze()} disabled={!canAnalyze} size="lg" className="mt-6 h-12 gap-2 bg-[#0F766E] px-6 text-white hover:bg-[#115E59]">{loading ? <><Loader2 className="h-4 w-4 animate-spin"/>Analizando marca…</> : <><Search className="h-4 w-4"/>Analizar marca</>}</Button>
        </div>
        <aside className="border-t border-border bg-slate-50 p-6 sm:p-8 lg:border-l lg:border-t-0">
          <p className="text-sm font-semibold text-foreground">¿Qué hacemos por ti?</p>
          <div className="mt-5 divide-y divide-border">{[
            [ImageIcon,"Leemos la marca","Detectamos el nombre y los elementos visuales cuando hay imagen."],
            [Search,"Buscamos antecedentes","Reunimos y ordenamos solicitudes y registros relevantes."],
            [Layers3,"Relacionamos clases","Usamos Niza y, cuando corresponde, elementos figurativos de Viena."],
            [ShieldCheck,"Te decimos qué revisar","Separamos los datos oficiales de nuestras señales y explicaciones."],
          ].map(([Icon,title,copy]) => { const I = Icon as typeof Search; return <div key={String(title)} className="flex gap-3 py-4 first:pt-0"><I className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]"/><div><p className="text-sm font-medium">{String(title)}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{String(copy)}</p></div></div> })}</div>
          <p className="mt-5 rounded-xl border border-border bg-white p-4 text-xs leading-5 text-muted-foreground">INAPI sigue siendo la fuente oficial. Esta herramienta prepara la investigación y no reemplaza la evaluación jurídica profesional.</p>
        </aside>
      </section> : <div className="space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-border bg-white"><div className="grid lg:grid-cols-[220px_1fr]">
          <div className="flex min-h-52 items-center justify-center border-b border-border bg-slate-50 p-5 lg:border-b-0 lg:border-r">{imagePreview ? <div className="flex h-40 w-full items-center justify-center rounded-xl border border-border bg-white p-4"><img src={imagePreview} alt={report.marca} className="max-h-full max-w-full object-contain"/></div> : <div className="text-center text-muted-foreground"><ImageIcon className="mx-auto h-7 w-7"/><p className="mt-2 text-sm">Análisis por nombre</p></div>}</div>
          <div className="p-6 sm:p-8"><div className="flex flex-wrap gap-2"><RiskBadge nivel={report.informe.nivel_riesgo_global}/><Badge variant="outline">{report.marca}</Badge><Badge variant="outline">Datos INAPI</Badge></div><p className="mt-6 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Resumen</p><h2 className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">{report.informe.resumen_ejecutivo}</h2><div className="mt-6 grid grid-cols-3 divide-x divide-border border-y border-border py-4"><SimpleMetric label="Antecedentes" value={String(report.registrabilidad?.calidad.resultados_totales ?? 0)}/><SimpleMetric label="Activos" value={String(report.registrabilidad?.calidad.resultados_activos ?? 0)}/><SimpleMetric label="Confianza" value={confidenceLabel(report.registrabilidad?.calidad.confianza)}/></div><div className="mt-6 flex flex-wrap items-start gap-2"><Button variant="outline" onClick={reset}>Analizar otra marca</Button><WatchBrandAction mark={report.marca} niza={reportNiza}/><Button asChild className="bg-[#0F766E] text-white hover:bg-[#115E59]"><a href="#antecedentes">Ver antecedentes <ArrowRight className="ml-2 h-4 w-4"/></a></Button></div></div>
        </div></section>

        <section className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="space-y-6"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Qué encontramos</p><div className="mt-3 divide-y divide-border border-y border-border"><InfoRow title="Elementos visuales" text={report.viena.elementos_detectados.slice(0,6).join(" · ") || "Sin información visual suficiente"}/><InfoRow title="Clases sugeridas" text={report.niza.clases.slice(0,5).map(c=>`Clase ${c.numero}`).join(" · ") || "Sin clases sugeridas"}/><InfoRow title="Siguiente paso" text={report.informe.recomendaciones[0] || "Revisar los antecedentes priorizados"}/></div></div></div>
          <div id="antecedentes"><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0F766E]">Antecedentes priorizados</p><h3 className="mt-2 text-2xl font-semibold">Empieza por estos resultados</h3></div></div><div className="mt-4 divide-y divide-border border-y border-border">{(report.registrabilidad?.antecedentes ?? []).slice(0,8).map((item,index)=><div key={`${item.id}-${index}`} className="grid gap-3 py-5 sm:grid-cols-[1fr_auto] sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold">{item.nombre}</span><Badge variant="outline">{item.estado}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{item.solicitante || "Titular no informado"}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{item.razones.slice(0,3).join(" · ")}</p></div><div className="text-left sm:text-right"><p className="text-xs text-muted-foreground">Relevancia</p><p className="mt-1 text-lg font-semibold">{item.puntaje_relevancia}/100</p></div></div>)}{(report.registrabilidad?.antecedentes ?? []).length===0&&<div className="py-8 text-sm text-muted-foreground">No encontramos antecedentes para mostrar en esta consulta.</div>}</div></div>
        </section>

        <OwnerContextPanel candidates={(report.registrabilidad?.antecedentes ?? []).slice(0,3).map((item) => ({ name: item.nombre, applicant: item.solicitante, application: item.numero_solicitud }))} />

        <PrecedentPanel mark={report.marca} niza={reportNiza} />

        <section className="rounded-2xl border border-border bg-slate-50 p-5"><div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0F766E]"/><div><p className="font-medium">Importante</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Esta lectura organiza antecedentes y señales para apoyar una revisión. No determina por sí sola si una marca será aceptada o rechazada.</p></div></div></section>
      </div>}
    </div>
  </main>
}

function SimpleMetric({label,value}:{label:string;value:string}) { return <div className="px-3 first:pl-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></div> }
function InfoRow({title,text}:{title:string;text:string}) { return <div className="py-4"><p className="text-sm font-medium">{title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p></div> }
