"use client"

import { useRef, useState } from "react"
import type { TrademarkInsightReport } from "@/lib/agent/trademark-agent"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  ImageIcon,
  Layers3,
  Loader2,
  Palette,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]
const MAX_FILE_BYTES = 4_500_000

type PersistedTrademarkReport = TrademarkInsightReport & { comparison_id: string }

function RiskBadge({ nivel }: { nivel: string }) {
  const normalized = nivel?.toUpperCase()
  if (normalized === "ALTO") return <Badge className="border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300"><AlertTriangle className="mr-1 h-3.5 w-3.5" />Riesgo alto</Badge>
  if (normalized === "MEDIO") return <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200"><ShieldAlert className="mr-1 h-3.5 w-3.5" />Riesgo medio</Badge>
  return <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"><ShieldCheck className="mr-1 h-3.5 w-3.5" />Riesgo bajo</Badge>
}

function confidenceLabel(value?: "alta" | "media" | "baja") {
  if (value === "alta") return "Alta"
  if (value === "media") return "Media"
  return "Baja"
}

export default function EvaluarMarcaPage() {
  const [image, setImage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [nombre, setNombre] = useState("")
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<PersistedTrademarkReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const canAnalyze = Boolean(nombre.trim() && !loading)

  const reset = () => {
    setReport(null)
    setImage(null)
    setImagePreview(null)
    setNombre("")
    setError(null)
  }

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
    reader.onload = () => {
      const dataUrl = reader.result
      if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
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
      if (!response.ok) {
        setError(response.status === 401 ? "Tu sesión expiró. Vuelve a iniciar sesión." : data.error ?? "No fue posible completar el análisis.")
        return
      }
      setReport(data as PersistedTrademarkReport)
    } catch {
      setError("No fue posible conectar con el servicio. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Trademark Intelligence · Chile
          </div>
          <h1 className="font-serif text-4xl tracking-tight text-foreground sm:text-5xl lg:text-6xl">Sube una marca. Entiende qué puede entrar en conflicto.</h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">Visual Compare cruza el signo gráfico, su denominación, clasificación Viena, clases Niza y antecedentes INAPI para ayudarte a priorizar qué revisar antes de una decisión jurídica.</p>
        </header>

        {!report ? (
          <section className="grid overflow-hidden rounded-3xl border border-border bg-card shadow-sm lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-5 sm:p-8">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">1</span>
                <div>
                  <p className="font-medium text-foreground">Logo, fotografía o signo gráfico</p>
                  <p className="text-sm text-muted-foreground">Empieza por la imagen cuando exista. El motor extrae señales figurativas y clasificación Viena.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDrop={(event) => {
                  event.preventDefault()
                  const file = event.dataTransfer.files[0]
                  if (file) handleFile(file)
                }}
                onDragOver={(event) => event.preventDefault()}
                className="group flex min-h-64 w-full items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/15 p-6 text-center transition-all hover:border-foreground/30 hover:bg-secondary/30"
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) handleFile(file)
                  }}
                />
                {imagePreview ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-40 w-56 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white p-4 shadow-sm">
                      <img src={imagePreview} alt="Marca cargada para análisis" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Imagen lista para analizar</p>
                      <p className="mt-1 text-xs text-muted-foreground">Haz clic para reemplazarla</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex max-w-sm flex-col items-center">
                    <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background shadow-sm"><Upload className="h-6 w-6 text-foreground" /></span>
                    <p className="text-base font-medium text-foreground">Arrastra un logo o una fotografía</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">PNG, JPEG, WebP o GIF · máx. 4,5 MB. También puedes continuar sólo con el nombre.</p>
                  </div>
                )}
              </button>

              <div className="my-7 flex items-center gap-3"><div className="h-px flex-1 bg-border" /><span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">y agrega</span><div className="h-px flex-1 bg-border" /></div>

              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground">2</span>
                <div>
                  <label htmlFor="brand-name" className="font-medium text-foreground">Nombre o denominación</label>
                  <p className="text-sm text-muted-foreground">Necesario para contrastar antecedentes denominativos y registros INAPI.</p>
                </div>
              </div>
              <Input id="brand-name" value={nombre} onChange={(event) => setNombre(event.target.value)} onKeyDown={(event) => event.key === "Enter" && canAnalyze && void handleAnalyze()} maxLength={120} placeholder="Ejemplo: FALABELLA" className="h-12 text-base" />

              {error && <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-600 dark:text-red-300"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

              <Button onClick={() => void handleAnalyze()} disabled={!canAnalyze} size="lg" className="mt-6 h-12 w-full gap-2 sm:w-auto">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Construyendo inteligencia</> : <><Search className="h-4 w-4" />Analizar marca</>}
              </Button>
            </div>

            <aside className="border-t border-border bg-foreground p-6 text-background sm:p-8 lg:border-l lg:border-t-0">
              <p className="text-xs font-medium uppercase tracking-[0.18em] opacity-60">Qué entrega esta búsqueda</p>
              <div className="mt-7 space-y-6">
                {[
                  { icon: ImageIcon, title: "Lectura visual", copy: "Elementos figurativos, colores y códigos Viena cuando hay imagen." },
                  { icon: Database, title: "Antecedentes INAPI", copy: "Solicitudes y registros priorizados con estado, titular y clases disponibles." },
                  { icon: Layers3, title: "Clases Niza", copy: "Clases sugeridas y contexto para entender dónde puede existir solapamiento." },
                  { icon: ShieldAlert, title: "Prioridad de revisión", copy: "Señales explicadas para decidir qué antecedentes requieren análisis profesional." },
                ].map(({ icon: Icon, title, copy }) => (
                  <div key={title} className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-background/15 bg-background/5"><Icon className="h-4 w-4" /></span>
                    <div><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs leading-relaxed opacity-65">{copy}</p></div>
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-2xl border border-background/15 bg-background/5 p-4 text-xs leading-relaxed opacity-70">La plataforma separa evidencia registral, señales calculadas e interpretación asistida. No declara registrabilidad ni reemplaza asesoría jurídica.</div>
            </aside>
          </section>
        ) : (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <div className="grid lg:grid-cols-[0.32fr_0.68fr]">
                <div className="flex min-h-64 items-center justify-center border-b border-border bg-secondary/15 p-6 lg:border-b-0 lg:border-r">
                  {imagePreview ? <div className="flex h-48 w-full items-center justify-center rounded-2xl border border-border bg-white p-5"><img src={imagePreview} alt={report.marca} className="max-h-full max-w-full object-contain" /></div> : <div className="text-center text-muted-foreground"><ImageIcon className="mx-auto h-8 w-8" /><p className="mt-3 text-sm">Análisis denominativo</p></div>}
                </div>
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-center gap-2"><RiskBadge nivel={report.informe.nivel_riesgo_global} /><Badge variant="outline">{report.marca}</Badge><Badge variant="outline">Fuente: INAPI</Badge></div>
                  <p className="mt-6 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Lectura preliminar</p>
                  <h2 className="mt-2 font-serif text-3xl text-foreground sm:text-4xl">{report.informe.resumen_ejecutivo}</h2>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-border bg-secondary/15 p-4"><p className="text-xs text-muted-foreground">Resultados INAPI</p><p className="mt-1 text-2xl font-semibold text-foreground">{report.registrabilidad?.calidad.resultados_totales ?? 0}</p></div>
                    <div className="rounded-xl border border-border bg-secondary/15 p-4"><p className="text-xs text-muted-foreground">Antecedentes activos</p><p className="mt-1 text-2xl font-semibold text-foreground">{report.registrabilidad?.calidad.resultados_activos ?? 0}</p></div>
                    <div className="rounded-xl border border-border bg-secondary/15 p-4"><p className="text-xs text-muted-foreground">Confianza de fuente</p><p className="mt-1 text-2xl font-semibold text-foreground">{confidenceLabel(report.registrabilidad?.calidad.confianza)}</p></div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3"><Button variant="outline" onClick={reset}>Analizar otra marca</Button><Button asChild><a href="#conflictos">Ver antecedentes <ArrowRight className="ml-2 h-4 w-4" /></a></Button></div>
                </div>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-3">
              <article className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2"><Palette className="h-4 w-4 text-muted-foreground" /><h3 className="font-medium text-foreground">Señales visuales</h3></div>
                {report.viena.codes.length ? <><div className="mt-4 flex flex-wrap gap-2">{report.viena.codes.slice(0, 6).map((code) => <Badge key={code.code} variant="outline">{code.code}</Badge>)}</div><p className="mt-4 text-sm leading-relaxed text-muted-foreground">{report.viena.elementos_detectados.slice(0, 6).join(" · ") || report.viena.estilo_general}</p>{report.viena.colores_dominantes.length > 0 && <p className="mt-3 text-xs text-muted-foreground">Colores: {report.viena.colores_dominantes.join(", ")}</p>}</> : <p className="mt-4 text-sm leading-relaxed text-muted-foreground">No se cargó imagen; esta evaluación no incluye clasificación figurativa.</p>}
              </article>

              <article className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2"><Layers3 className="h-4 w-4 text-muted-foreground" /><h3 className="font-medium text-foreground">Clases sugeridas</h3></div>
                <div className="mt-4 space-y-3">{report.niza.clases.slice(0, 5).map((clase) => <div key={`${clase.numero}-${clase.tipo}`} className="rounded-xl bg-secondary/20 p-3"><div className="flex items-center justify-between gap-2"><p className="text-sm font-medium text-foreground">Clase {clase.numero}</p><Badge variant="outline">{clase.tipo}</Badge></div><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{clase.titulo}</p></div>)}</div>
              </article>

              <article className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-muted-foreground" /><h3 className="font-medium text-foreground">Qué hacer ahora</h3></div>
                <div className="mt-4 space-y-3">{report.informe.recomendaciones.slice(0, 4).map((item, index) => <div key={`${index}-${item}`} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-foreground">{index + 1}</span><p className="text-sm leading-relaxed text-muted-foreground">{item}</p></div>)}</div>
              </article>
            </section>

            <section id="conflictos" className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Evidencia registral</p><h3 className="mt-1 font-serif text-2xl text-foreground">Antecedentes que merecen revisión</h3></div><p className="text-xs text-muted-foreground">Relevancia operativa ≠ probabilidad jurídica</p></div>
              {report.registrabilidad?.antecedentes.length ? <div className="mt-5 grid gap-3 md:grid-cols-2">{report.registrabilidad.antecedentes.slice(0, 10).map((item) => <article key={item.id} className="rounded-xl border border-border bg-secondary/10 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-foreground">{item.nombre}</p><p className="mt-1 text-xs text-muted-foreground">{item.solicitante || "Titular no informado"}</p></div><Badge variant="outline">{item.estado}</Badge></div><div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground"><span>Niza {item.clases.join(", ") || "s/d"}</span>{item.numero_solicitud && <span>· Solicitud {item.numero_solicitud}</span>}{item.numero_registro && <span>· Registro {item.numero_registro}</span>}</div><div className="mt-3 flex items-center justify-between gap-3"><p className="text-xs leading-relaxed text-muted-foreground">{item.razones.slice(0, 2).join(" · ")}</p><Badge className="shrink-0" variant="secondary">Rel. {item.puntaje_relevancia}/100</Badge></div></article>)}</div> : <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><p className="mt-3 font-medium text-foreground">No aparecieron antecedentes priorizados.</p><p className="mt-1 text-sm text-muted-foreground">Esto no garantiza ausencia de conflicto. Conviene revisar variantes, clases y fuentes complementarias antes de decidir.</p></div>}
            </section>

            {report.registrabilidad?.calidad.advertencias?.length ? <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5"><p className="text-sm font-medium text-foreground">Limitaciones de esta consulta</p><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{report.registrabilidad.calidad.advertencias.map((warning) => <li key={warning}>• {warning}</li>)}</ul></section> : null}
          </div>
        )}
      </div>
    </main>
  )
}
