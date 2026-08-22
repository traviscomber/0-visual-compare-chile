"use client"

import { useRef, useState } from "react"
import type { TrademarkInsightReport } from "@/lib/agent/trademark-agent"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Database,
  FileText,
  HelpCircle,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConceptModal } from "@/components/concept-modal"
import { AnalysisWorkflowControls } from "@/components/app/analysis-workflow-controls"

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]
const MAX_FILE_BYTES = 4_500_000

type PersistedTrademarkReport = TrademarkInsightReport & { comparison_id: string }

function RiskBadge({ nivel }: { nivel: string }) {
  const normalized = nivel?.toUpperCase()
  if (normalized === "ALTO") return <Badge className="border-red-500/30 bg-red-500/10 text-red-300"><AlertTriangle className="mr-1 h-3.5 w-3.5" />Riesgo alto</Badge>
  if (normalized === "MEDIO") return <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-200"><ShieldAlert className="mr-1 h-3.5 w-3.5" />Riesgo medio</Badge>
  return <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"><ShieldCheck className="mr-1 h-3.5 w-3.5" />Riesgo bajo</Badge>
}

function decisionCopy(report: PersistedTrademarkReport) {
  const decision = report.registrabilidad?.decision
  const risk = report.informe.nivel_riesgo_global?.toUpperCase()
  if (decision === "FUENTE_NO_DISPONIBLE") return { eyebrow: "Información insuficiente", title: "No decidas todavía", action: "Repite la consulta cuando la fuente esté disponible o revisa manualmente los antecedentes." }
  if (decision === "REVISAR" || risk === "ALTO") return { eyebrow: "Revisión necesaria", title: "Avanza con cautela", action: "Revisa los antecedentes priorizados antes de presentar o invertir más en esta marca." }
  if (risk === "MEDIO") return { eyebrow: "Hay señales que revisar", title: "Puedes seguir evaluando", action: "Valida los antecedentes relevantes y confirma las clases antes de presentar." }
  return { eyebrow: "Sin bloqueos evidentes", title: "Vale la pena avanzar", action: "Continúa con la revisión de clases y prepara la validación profesional antes de presentar." }
}

function confidenceLabel(value: "alta" | "media" | "baja") {
  return value === "alta" ? "Alta" : value === "media" ? "Media" : "Baja"
}

export default function AgentePage() {
  const [image, setImage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [nombre, setNombre] = useState("")
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<PersistedTrademarkReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showLogo, setShowLogo] = useState(false)
  const [conceptModal, setConceptModal] = useState<"viena" | "niza" | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const canAnalyze = Boolean(nombre.trim() && !loading)

  const handleFile = (file: File) => {
    setError(null)
    setReport(null)
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return setError("Formato no compatible. Usa PNG, JPEG, WebP o GIF.")
    if (file.size > MAX_FILE_BYTES) return setError("La imagen supera el máximo de 4,5 MB.")

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) return setError("No fue posible leer la imagen seleccionada.")
      setImagePreview(dataUrl)
      setImage(dataUrl)
    }
    reader.onerror = () => setError("No fue posible leer la imagen seleccionada.")
    reader.onabort = () => setError("La lectura de la imagen fue cancelada. Intenta nuevamente.")
    reader.readAsDataURL(file)
  }

  const handleAnalyze = async () => {
    if (!canAnalyze) return
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      const response = await fetch("/api/v1/agent/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(image ? { image } : {}), nombre: nombre.trim() }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) return setError(response.status === 401 ? "Tu sesión expiró. Vuelve a iniciar sesión." : data.error ?? "No fue posible completar el análisis.")
      setReport(data as PersistedTrademarkReport)
    } catch {
      setError("No fue posible conectar con el servicio. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const decision = report ? decisionCopy(report) : null

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Evaluar · Marcas
          </div>
          <h1 className="font-serif text-4xl tracking-tight text-foreground sm:text-5xl">¿Vale la pena avanzar con esta marca?</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">Obtén una lectura preliminar de riesgo basada en antecedentes INAPI, clases relevantes y, si agregas un logo, señales visuales.</p>
        </header>

        {!report && (
          <section className="grid gap-6 rounded-3xl border border-border bg-card p-6 shadow-sm lg:grid-cols-[1fr_320px] lg:p-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="brand-name" className="mb-2 block text-sm font-medium text-foreground">Nombre de la marca</label>
                <Input id="brand-name" value={nombre} onChange={(event) => setNombre(event.target.value)} onKeyDown={(event) => event.key === "Enter" && canAnalyze && void handleAnalyze()} maxLength={120} placeholder="Ejemplo: FALABELLA" className="h-12 text-base" autoFocus />
                <p className="mt-2 text-xs text-muted-foreground">Con sólo el nombre podemos revisar antecedentes denominativos y clases sugeridas.</p>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/20">
                <button type="button" onClick={() => setShowLogo((value) => !value)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                  <div><p className="text-sm font-medium text-foreground">¿También quieres evaluar el logo?</p><p className="mt-1 text-xs text-muted-foreground">Opcional · agrega análisis visual y clasificación Viena.</p></div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showLogo ? "rotate-180" : ""}`} />
                </button>
                {showLogo && (
                  <div className="border-t border-border p-4">
                    <button type="button" onClick={() => fileRef.current?.click()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) handleFile(file) }} onDragOver={(event) => event.preventDefault()} className="w-full rounded-xl border border-dashed border-border bg-background p-6 text-center transition-colors hover:bg-secondary/30">
                      <input ref={fileRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) handleFile(file) }} />
                      {imagePreview ? <div className="flex flex-col items-center gap-2"><img src={imagePreview} alt="Logo a evaluar" className="max-h-28 max-w-xs rounded-lg object-contain" /><span className="text-xs text-muted-foreground">Cambiar imagen</span></div> : <div className="flex flex-col items-center gap-2 text-muted-foreground"><Upload className="h-6 w-6" /><span className="text-sm">Subir logo o signo gráfico</span><span className="text-xs">PNG, JPEG, WebP o GIF · máx. 4,5 MB</span></div>}
                    </button>
                  </div>
                )}
              </div>

              {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-600 dark:text-red-300"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

              <Button onClick={() => void handleAnalyze()} disabled={!canAnalyze} size="lg" className="h-12 w-full sm:w-auto">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Evaluando antecedentes</> : <><Search className="mr-2 h-4 w-4" />Evaluar marca</>}
              </Button>
            </div>

            <aside className="rounded-2xl bg-foreground p-6 text-background">
              <p className="text-xs font-medium uppercase tracking-[0.16em] opacity-60">Qué vas a obtener</p>
              <div className="mt-5 space-y-5">
                {[
                  ["1", "Una señal clara", "Avanzar, revisar o detenerse antes de invertir más."],
                  ["2", "Las razones", "Antecedentes y conflictos que explican la evaluación."],
                  ["3", "El siguiente paso", "Acciones concretas para continuar la revisión."],
                ].map(([step, title, copy]) => <div key={step} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-background/20 text-xs">{step}</span><div><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs leading-relaxed opacity-65">{copy}</p></div></div>)}
              </div>
            </aside>
          </section>
        )}

        {report && decision && (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-center gap-2"><RiskBadge nivel={report.informe.nivel_riesgo_global} /><Badge variant="outline">{report.marca}</Badge></div>
                  <p className="mt-7 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{decision.eyebrow}</p>
                  <h2 className="mt-2 font-serif text-4xl text-foreground sm:text-5xl">{decision.title}</h2>
                  <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">{report.informe.resumen_ejecutivo}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button onClick={() => { setReport(null); setNombre(""); setImage(null); setImagePreview(null) }} variant="outline">Evaluar otra marca</Button>
                    <Button asChild><a href="#evidencia">Ver evidencia <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
                  </div>
                </div>
                <div className="border-t border-border bg-secondary/25 p-6 sm:p-8 lg:border-l lg:border-t-0">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Siguiente paso recomendado</p>
                  <p className="mt-3 text-lg font-medium leading-relaxed text-foreground">{decision.action}</p>
                  <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-border bg-background p-3"><p className="text-xs text-muted-foreground">Antecedentes</p><p className="mt-1 text-xl font-semibold text-foreground">{report.registrabilidad?.calidad.resultados_totales ?? 0}</p></div>
                    <div className="rounded-xl border border-border bg-background p-3"><p className="text-xs text-muted-foreground">Activos</p><p className="mt-1 text-xl font-semibold text-foreground">{report.registrabilidad?.calidad.resultados_activos ?? 0}</p></div>
                  </div>
                </div>
              </div>
            </section>

            <section id="evidencia" className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-5 flex items-center gap-2"><Database className="h-4 w-4 text-muted-foreground" /><h3 className="font-serif text-xl text-foreground">Qué encontramos</h3></div>
                {report.registrabilidad?.antecedentes.length ? (
                  <div className="space-y-3">{report.registrabilidad.antecedentes.slice(0, 6).map((item) => (
                    <div key={item.id} className="rounded-xl border border-border bg-secondary/15 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-medium text-foreground">{item.nombre}</p><p className="mt-1 text-xs text-muted-foreground">{item.solicitante || "Titular no informado"}</p></div><Badge variant="outline">{item.estado}</Badge></div>
                      <p className="mt-3 text-xs text-muted-foreground">Niza {item.clases.join(", ") || "sin clase"} · relevancia {item.puntaje_relevancia}</p>
                      {item.razones.length > 0 && <p className="mt-1 text-xs text-foreground/75">{item.razones.join(" · ")}</p>}
                    </div>
                  ))}</div>
                ) : <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5"><CheckCircle2 className="h-5 w-5 text-emerald-500" /><p className="mt-3 font-medium text-foreground">No aparecieron antecedentes priorizados.</p><p className="mt-1 text-sm text-muted-foreground">Esto no garantiza registrabilidad; sólo indica que esta consulta no encontró conflictos relevantes para priorizar.</p></div>}
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-serif text-xl text-foreground">Qué hacer ahora</h3>
                <ol className="mt-5 space-y-4">{report.informe.recomendaciones.map((item, index) => <li key={`${index}-${item}`} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-foreground">{index + 1}</span><span className="pt-1 text-sm leading-relaxed text-muted-foreground">{item}</span></li>)}</ol>
              </div>
            </section>

            <details className="group rounded-2xl border border-border bg-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5"><div><p className="font-medium text-foreground">Ver fundamentos técnicos</p><p className="mt-1 text-xs text-muted-foreground">Clases Niza, Viena, calidad de la consulta y trazabilidad.</p></div><ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" /></summary>
              <div className="grid gap-4 border-t border-border p-5 lg:grid-cols-2">
                <div className="rounded-xl border border-border p-4">
                  <div className="mb-3 flex items-center gap-2"><FileText className="h-4 w-4" /><p className="text-sm font-medium">Clasificación Niza</p><button onClick={() => setConceptModal("niza")} className="ml-auto text-muted-foreground"><HelpCircle className="h-4 w-4" /></button></div>
                  <div className="space-y-2">{report.niza.clases.slice(0, 8).map((item) => <div key={item.numero} className="flex justify-between gap-3 text-xs"><span className="text-muted-foreground">Clase {item.numero} · {item.titulo}</span><span className="text-foreground">{item.tipo}</span></div>)}</div>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4" /><p className="text-sm font-medium">Clasificación Viena</p><button onClick={() => setConceptModal("viena")} className="ml-auto text-muted-foreground"><HelpCircle className="h-4 w-4" /></button></div>
                  {image ? <div className="space-y-2">{Array.from(new Map(report.viena.codes.map((code) => [code.code, code])).values()).slice(0, 6).map((code) => <div key={code.code} className="flex justify-between gap-3 text-xs"><span className="text-muted-foreground">{code.code} · {code.titulo}</span><span>{Math.round(code.confidence * 100)}%</span></div>)}</div> : <p className="text-xs text-muted-foreground">No se cargó un logo en esta evaluación.</p>}
                </div>
                {report.registrabilidad && <div className="rounded-xl border border-border p-4 lg:col-span-2"><div className="grid gap-3 sm:grid-cols-4"><Metric label="Confianza" value={confidenceLabel(report.registrabilidad.calidad.confianza)} /><Metric label="Cobertura Niza" value={`${Math.round(report.registrabilidad.calidad.cobertura_clases * 100)}%`} /><Metric label="Resultados" value={String(report.registrabilidad.calidad.resultados_totales)} /><Metric label="Activos" value={String(report.registrabilidad.calidad.resultados_activos)} /></div><p className="mt-4 text-xs leading-relaxed text-muted-foreground">Fuente: {report.registrabilidad.fuente.nombre} · consulta “{report.registrabilidad.fuente.consulta}” · consultado {new Date(report.registrabilidad.fuente.consultado_en).toLocaleString("es-CL")} · proceso {(report.pipeline_ms / 1000).toFixed(1)} s.</p></div>}
              </div>
            </details>

            <AnalysisWorkflowControls comparisonId={report.comparison_id} marca={report.marca} risk={report.informe.nivel_riesgo_global} resultCount={report.registrabilidad?.calidad.resultados_totales ?? 0} />
            <p className="text-center text-xs leading-relaxed text-muted-foreground">{report.informe.disclaimer}</p>
          </div>
        )}

        <ConceptModal concept="viena" isOpen={conceptModal === "viena"} onClose={() => setConceptModal(null)} />
        <ConceptModal concept="niza" isOpen={conceptModal === "niza"} onClose={() => setConceptModal(null)} />
      </div>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium text-foreground">{value}</p></div>
}
