"use client"

import { useRef, useState } from "react"
import type { TrademarkInsightReport } from "@/lib/agent/trademark-agent"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Database,
  FileText,
  HelpCircle,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  Upload,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConceptModal } from "@/components/concept-modal"

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]
const MAX_FILE_BYTES = 4_500_000

function RiskBadge({ nivel }: { nivel: string }) {
  const normalized = nivel?.toUpperCase()
  if (normalized === "ALTO") {
    return <Badge className="border-red-500/40 bg-red-500/15 text-red-300"><AlertTriangle className="mr-1 h-3.5 w-3.5" />Riesgo alto</Badge>
  }
  if (normalized === "MEDIO") {
    return <Badge className="border-amber-500/40 bg-amber-500/15 text-amber-300"><ShieldAlert className="mr-1 h-3.5 w-3.5" />Riesgo medio</Badge>
  }
  return <Badge className="border-emerald-500/40 bg-emerald-500/15 text-emerald-300"><ShieldCheck className="mr-1 h-3.5 w-3.5" />Riesgo bajo</Badge>
}

function DecisionBadge({ decision }: { decision: NonNullable<TrademarkInsightReport["registrabilidad"]>["decision"] }) {
  if (decision === "REVISAR") {
    return <Badge className="border-amber-500/40 bg-amber-500/15 text-amber-200">Revisión requerida</Badge>
  }
  if (decision === "FUENTE_NO_DISPONIBLE") {
    return <Badge className="border-slate-500/40 bg-slate-500/15 text-slate-300">Fuente no disponible</Badge>
  }
  return <Badge className="border-blue-500/40 bg-blue-500/15 text-blue-200">Sin antecedentes activos detectados</Badge>
}

function confidenceLabel(value: "alta" | "media" | "baja") {
  return value === "alta" ? "Alta" : value === "media" ? "Media" : "Baja"
}

export default function AgentePage() {
  const [image, setImage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [nombre, setNombre] = useState("")
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<TrademarkInsightReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeHelp, setActiveHelp] = useState<string | null>(null)
  const [conceptModal, setConceptModal] = useState<"viena" | "niza" | "disponible" | "conflictos" | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const progress = ([Boolean(image), Boolean(nombre.trim()), Boolean(report)].filter(Boolean).length / 3) * 100
  const canAnalyze = Boolean(image && nombre.trim() && !loading)

  const handleFile = (file: File) => {
    setError(null)
    setReport(null)

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError("Formato no compatible. Usa PNG, JPEG, WebP o GIF.")
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("La imagen supera el máximo de 4,5 MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result
      if (typeof dataUrl !== "string") {
        setError("No fue posible leer la imagen seleccionada.")
        return
      }
      setImagePreview(dataUrl)
      setImage(dataUrl)
    }
    reader.onerror = () => setError("No fue posible leer la imagen seleccionada.")
    reader.readAsDataURL(file)
  }

  const handleAnalyze = async () => {
    if (!canAnalyze || !image) return
    setLoading(true)
    setError(null)
    setReport(null)

    try {
      const response = await fetch("/api/v1/agent/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, nombre: nombre.trim() }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(response.status === 401 ? "Tu sesión expiró. Vuelve a iniciar sesión." : data.error ?? "No fue posible completar el análisis.")
        return
      }
      setReport(data as TrademarkInsightReport)
    } catch {
      setError("No fue posible conectar con el servicio. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span>Progreso del análisis</span><span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-slate-800">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <header className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300">
            <Zap className="h-4 w-4" /> Inteligencia interna de marcas
          </div>
          <h1 className="text-4xl font-semibold text-white">Evaluación preliminar de marca</h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">Clasificación Viena y Niza, antecedentes INAPI trazables y una lectura ejecutiva de riesgo.</p>
        </header>

        <section className="mb-8 grid gap-6 rounded-2xl border border-white/10 bg-slate-900/45 p-6">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-blue-500/40 bg-blue-500/15 text-xs text-blue-300">1</span>
              <h2 className="font-medium text-white">Logo o signo gráfico</h2>
              <button onClick={() => setActiveHelp(activeHelp === "image" ? null : "image")} className="ml-auto text-slate-400 hover:text-white" aria-label="Ayuda sobre la imagen"><HelpCircle className="h-4 w-4" /></button>
            </div>
            {activeHelp === "image" && <p className="mb-3 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-slate-300">Usa PNG, JPEG, WebP o GIF, con fondo limpio y un máximo de 4,5 MB.</p>}
            <button type="button" onClick={() => fileRef.current?.click()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) handleFile(file) }} onDragOver={(event) => event.preventDefault()} className="w-full rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/35 p-8 text-center hover:border-blue-500/50">
              <input ref={fileRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) handleFile(file) }} />
              {imagePreview ? <div className="flex flex-col items-center gap-2"><img src={imagePreview} alt="Signo a analizar" className="max-h-28 max-w-xs rounded-lg object-contain" /><span className="text-xs text-slate-400">Seleccionar otra imagen</span></div> : <div className="flex flex-col items-center gap-2 text-slate-400"><Upload className="h-8 w-8" /><span className="text-sm">Arrastra o selecciona una imagen</span></div>}
            </button>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-blue-500/40 bg-blue-500/15 text-xs text-blue-300">2</span>
              <h2 className="font-medium text-white">Nombre a evaluar</h2>
            </div>
            <Input value={nombre} onChange={(event) => { setNombre(event.target.value); setReport(null) }} onKeyDown={(event) => event.key === "Enter" && canAnalyze && void handleAnalyze()} maxLength={120} placeholder="Ejemplo: FALABELLA" className="border-slate-700 bg-slate-950/50 text-white" />
          </div>

          <Button onClick={() => void handleAnalyze()} disabled={!canAnalyze} className="h-12 w-full bg-blue-600 hover:bg-blue-500">
            {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Consultando clasificadores e INAPI</> : <><Search className="mr-2 h-5 w-5" />Ejecutar evaluación</>}
          </Button>
        </section>

        {error && <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

        {report && (
          <div className="space-y-4">
            <section className="rounded-xl border border-white/10 bg-slate-900/55 p-5">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="text-2xl font-semibold text-white">{report.marca}</h2><p className="mt-1 text-xs text-slate-500">Generado {new Date(report.timestamp).toLocaleString("es-CL")} · {(report.pipeline_ms / 1000).toFixed(1)} s</p></div>
                <RiskBadge nivel={report.informe.nivel_riesgo_global} />
              </div>
              <p className="text-sm leading-relaxed text-slate-200">{report.informe.resumen_ejecutivo}</p>
              {report.informe.analisis_conflictos && <p className="mt-3 text-xs leading-relaxed text-slate-400">{report.informe.analisis_conflictos}</p>}
            </section>

            {report.registrabilidad && (
              <section className="rounded-xl border border-blue-500/25 bg-blue-950/25 p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2"><Database className="h-5 w-5 text-blue-300" /><h3 className="font-semibold text-white">Evidencia INAPI</h3></div>
                  <DecisionBadge decision={report.registrabilidad.decision} />
                </div>
                <p className="text-sm leading-relaxed text-slate-200">{report.registrabilidad.recomendacion}</p>

                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3"><p className="text-xs text-slate-500">Confianza</p><p className="mt-1 font-medium text-white">{confidenceLabel(report.registrabilidad.calidad.confianza)}</p></div>
                  <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3"><p className="text-xs text-slate-500">Cobertura Niza</p><p className="mt-1 font-medium text-white">{Math.round(report.registrabilidad.calidad.cobertura_clases * 100)}%</p></div>
                  <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3"><p className="text-xs text-slate-500">Resultados</p><p className="mt-1 font-medium text-white">{report.registrabilidad.calidad.resultados_totales}</p></div>
                  <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3"><p className="text-xs text-slate-500">Activos</p><p className="mt-1 font-medium text-white">{report.registrabilidad.calidad.resultados_activos}</p></div>
                </div>

                <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/30 p-3 text-xs text-slate-400">
                  <p>Fuente: {report.registrabilidad.fuente.nombre} · consulta “{report.registrabilidad.fuente.consulta}” · modo {report.registrabilidad.fuente.match}</p>
                  <p className="mt-1">Consultado: {new Date(report.registrabilidad.fuente.consultado_en).toLocaleString("es-CL")}</p>
                </div>

                {report.registrabilidad.calidad.advertencias.length > 0 && <div className="mt-4 space-y-2">{report.registrabilidad.calidad.advertencias.map((warning) => <p key={warning} className="flex items-start gap-2 text-xs text-amber-200"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{warning}</p>)}</div>}

                {report.registrabilidad.antecedentes.length > 0 && (
                  <div className="mt-5">
                    <h4 className="mb-2 text-sm font-medium text-slate-200">Antecedentes priorizados</h4>
                    <div className="space-y-2">
                      {report.registrabilidad.antecedentes.slice(0, 6).map((item) => (
                        <div key={item.id} className="rounded-lg border border-white/10 bg-slate-950/35 p-3">
                          <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-medium text-white">{item.nombre}</p><p className="text-xs text-slate-500">{item.solicitante || "Titular no informado"}</p></div><Badge variant="outline" className="border-slate-600 text-slate-300">{item.estado}</Badge></div>
                          <p className="mt-2 text-xs text-slate-400">Niza: {item.clases.join(", ") || "Sin clase"} · Registro: {item.numero_registro || "—"} · Solicitud: {item.numero_solicitud || "—"}</p>
                          <p className="mt-1 text-xs text-blue-300">Relevancia {item.puntaje_relevancia}: {item.razones.join(" · ")}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                <div className="mb-3 flex items-center gap-2 text-purple-300"><BarChart3 className="h-4 w-4" /><h3 className="text-sm font-medium">Clasificación Viena</h3><button onClick={() => setConceptModal("viena")} className="ml-auto text-slate-500 hover:text-white"><HelpCircle className="h-4 w-4" /></button></div>
                <div className="mb-3 flex flex-wrap gap-1">{report.viena.elementos_detectados.slice(0, 4).map((element) => <Badge key={element} variant="outline" className="border-purple-500/30 text-purple-300">{element}</Badge>)}</div>
                <ul className="space-y-2 text-xs text-slate-300">{Array.from(new Map(report.viena.codes.map((code) => [code.code, code])).values()).slice(0, 5).map((code) => <li key={code.code} className="flex justify-between gap-3"><span>{code.code} · {code.titulo}</span><span className="text-purple-300">{Math.round(code.confidence * 100)}%</span></li>)}</ul>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                <div className="mb-3 flex items-center gap-2 text-blue-300"><FileText className="h-4 w-4" /><h3 className="text-sm font-medium">Clasificación Niza</h3><button onClick={() => setConceptModal("niza")} className="ml-auto text-slate-500 hover:text-white"><HelpCircle className="h-4 w-4" /></button></div>
                <ul className="space-y-2 text-xs text-slate-300">{report.niza.clases.slice(0, 6).map((item) => <li key={item.numero} className="flex justify-between gap-3"><span>Clase {item.numero} · {item.titulo}</span><span className={item.tipo === "principal" ? "text-blue-300" : "text-slate-500"}>{item.tipo}</span></li>)}</ul>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
              <div className="mb-3 flex items-center gap-2"><Activity className="h-4 w-4 text-slate-300" /><h3 className="text-sm font-medium text-white">Acciones recomendadas</h3></div>
              <ol className="space-y-2 text-sm text-slate-300">{report.informe.recomendaciones.map((item, index) => <li key={`${index}-${item}`} className="flex gap-3"><span className="text-blue-300">{index + 1}.</span><span>{item}</span></li>)}</ol>
            </section>

            <p className="px-4 text-center text-xs leading-relaxed text-slate-500">{report.informe.disclaimer}</p>
          </div>
        )}

        <ConceptModal concept="viena" isOpen={conceptModal === "viena"} onClose={() => setConceptModal(null)} />
        <ConceptModal concept="niza" isOpen={conceptModal === "niza"} onClose={() => setConceptModal(null)} />
        <ConceptModal concept="disponible" isOpen={conceptModal === "disponible"} onClose={() => setConceptModal(null)} />
        <ConceptModal concept="conflictos" isOpen={conceptModal === "conflictos"} onClose={() => setConceptModal(null)} />
      </div>
    </main>
  )
}
