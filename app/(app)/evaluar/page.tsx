"use client"

import { useEffect, useRef, useState } from "react"
import type { TrademarkInsightReport } from "@/lib/agent/trademark-agent"
import { AlertTriangle, ArrowRight, Fingerprint, ImageIcon, Layers3, Loader2, RotateCcw, Search, ShieldAlert, ShieldCheck, Upload } from "lucide-react"
import { OwnerContextPanel } from "@/components/intelligence/owner-context-panel"
import { PrecedentPanel } from "@/components/intelligence/precedent-panel"
import { WatchBrandAction } from "@/components/intelligence/watch-brand-action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]
const MAX_FILE_BYTES = 4_500_000

type PersistedTrademarkReport = TrademarkInsightReport & {
  comparison_id: string
  denomination_source?: "user" | "image-detected"
  denomination_confidence?: number | null
}

function ReviewPriority({ nivel }: { nivel: string }) {
  const normalized = nivel?.toUpperCase()
  if (normalized === "ALTO") return <Badge className="rounded-md border-red-400/25 bg-red-400/[0.08] text-red-200"><AlertTriangle className="mr-1 h-3.5 w-3.5" />Prioridad alta</Badge>
  if (normalized === "MEDIO") return <Badge className="rounded-md border-amber-300/25 bg-amber-300/[0.07] text-amber-100"><ShieldAlert className="mr-1 h-3.5 w-3.5" />Prioridad media</Badge>
  return <Badge className="rounded-md border-white/10 bg-white/[0.04] text-muted-foreground"><ShieldCheck className="mr-1 h-3.5 w-3.5" />Revisión de rutina</Badge>
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

  useEffect(() => {
    const brand = new URLSearchParams(window.location.search).get("brand")?.trim()
    if (brand) setNombre(brand.slice(0, 120))
  }, [])

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
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return setError("Usa una imagen PNG, JPEG, WebP o GIF.")
    if (file.size > MAX_FILE_BYTES) return setError("La imagen debe pesar menos de 4,5 MB.")
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) return setError("No pudimos leer esa imagen.")
      setImagePreview(dataUrl)
      setImage(dataUrl)
    }
    reader.onerror = () => setError("No pudimos leer esa imagen.")
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
        setError(response.status === 401 ? "Tu sesión terminó. Vuelve a iniciar sesión." : data.error ?? "No pudimos completar el análisis.")
        return
      }
      setReport(data as PersistedTrademarkReport)
    } catch {
      setError("No pudimos conectar con el servicio. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const reportNiza = report?.niza.clases.map((clase) => Number(clase.numero)).filter((value) => Number.isInteger(value) && value >= 1 && value <= 45) ?? []

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-[1480px]">
        {!report ? (
          <>
            <header className="grid gap-8 border-b border-border pb-9 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">VIDENTIA / Evaluar</p>
                <h1 className="mt-4 max-w-[9ch] text-4xl font-normal leading-[0.96] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-6xl">De la marca a una revisión explicable.</h1>
              </div>
              <div className="max-w-2xl lg:justify-self-end">
                <p className="text-base leading-7 text-muted-foreground sm:text-lg">Parte con un nombre, una imagen o ambos. VIDENTIA organiza antecedentes INAPI, señales denominativas y visuales, clases y contexto para priorizar la revisión sin convertirla en un veredicto jurídico.</p>
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground"><span>Fuente visible</span><span>Señales separadas</span><span>Prioridad ≠ registrabilidad</span></div>
              </div>
            </header>

            <section className="mt-8 grid border-y border-border bg-card/30 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="p-5 sm:p-7 lg:p-8">
                <div className="mb-5"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">01 / Entrada</p><h2 className="mt-2 text-2xl font-normal tracking-[-0.03em] text-foreground">¿Qué marca quieres revisar?</h2></div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) handleFile(file) }}
                  onDragOver={(event) => event.preventDefault()}
                  className="flex min-h-56 w-full items-center justify-center border border-dashed border-border bg-background p-6 text-center outline-none transition hover:border-primary/45 hover:bg-secondary/20 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <input ref={fileRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) handleFile(file) }} />
                  {imagePreview ? (
                    <div className="flex flex-col items-center gap-3"><div className="flex h-36 w-52 items-center justify-center border border-border bg-background p-3"><img src={imagePreview} alt="Marca seleccionada" className="max-h-full max-w-full object-contain" /></div><p className="text-sm font-medium text-foreground">Imagen lista · pulsa para cambiarla</p></div>
                  ) : (
                    <div className="max-w-md"><span className="mx-auto flex h-11 w-11 items-center justify-center border border-primary/20 bg-primary/[0.05] text-primary"><Upload className="h-5 w-5" /></span><p className="mt-4 font-medium text-foreground">Sube un logo o una fotografía</p><p className="mt-2 text-sm leading-6 text-muted-foreground">La imagen puede aportar denominación visible, elementos figurativos y evidencia Viena cuando exista material comparable.</p></div>
                  )}
                </button>

                <div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-border" /><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">nombre de la marca</span><div className="h-px flex-1 bg-border" /></div>
                <label htmlFor="brand-name" className="text-sm font-medium text-foreground">Nombre de la marca</label>
                <Input id="brand-name" value={nombre} onChange={(event) => setNombre(event.target.value)} onKeyDown={(event) => event.key === "Enter" && canAnalyze && void handleAnalyze()} maxLength={120} placeholder="Ejemplo: PATAGONIA" className="mt-2 h-12 text-base" />
                <p className="mt-2 text-xs leading-5 text-muted-foreground">Si vienes desde Investigar, la marca seleccionada aparece aquí automáticamente. Puedes corregirla antes de ejecutar la evaluación.</p>
                {error && <div role="alert" className="mt-4 flex items-start gap-2 border border-red-500/25 bg-red-500/[0.07] p-4 text-sm text-red-300"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
                <Button onClick={() => void handleAnalyze()} disabled={!canAnalyze} size="lg" className="mt-6 h-12 gap-2 px-6">{loading ? <><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />Analizando evidencia…</> : <><Search className="h-4 w-4" />Evaluar evidencia</>}</Button>
              </div>

              <aside className="border-t border-border bg-background/55 p-6 lg:border-l lg:border-t-0 lg:p-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">02 / Cómo se lee</p>
                <div className="mt-5 border-t border-border">
                  <ExplainRow icon={<Search className="h-4 w-4" />} title="Antecedentes" copy="La fuente oficial y la cobertura permanecen visibles." />
                  <ExplainRow icon={<Layers3 className="h-4 w-4" />} title="Ámbito" copy="Niza ayuda a entender dónde existe relación comercial." />
                  <ExplainRow icon={<Fingerprint className="h-4 w-4" />} title="Señales" copy="Nombre, fonética, visual y figurativa se muestran por separado." />
                  <ExplainRow icon={<ShieldCheck className="h-4 w-4" />} title="Prioridad" copy="La prioridad ordena la revisión; no predice la decisión de INAPI." />
                </div>
                <div className="mt-6 border-l-2 border-primary/35 pl-4"><p className="text-sm font-medium text-foreground">Fuente ≠ análisis ≠ decisión jurídica</p><p className="mt-2 text-xs leading-5 text-muted-foreground">VIDENTIA prepara la investigación y mantiene visibles sus limitaciones. La evaluación jurídica final corresponde al profesional responsable.</p></div>
              </aside>
            </section>
          </>
        ) : (
          <EvaluationReport report={report} imagePreview={imagePreview} reportNiza={reportNiza} reset={reset} />
        )}
      </div>
    </main>
  )
}

function EvaluationReport({ report, imagePreview, reportNiza, reset }: { report: PersistedTrademarkReport; imagePreview: string | null; reportNiza: number[]; reset: () => void }) {
  const registration = report.registrabilidad
  const consultedAt = registration?.fuente.consultado_en ? formatDate(registration.fuente.consultado_en) : ""
  const warnings = registration?.calidad.advertencias ?? []
  const antecedents = registration?.antecedentes ?? []

  return (
    <div>
      <header className="border-b border-border pb-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2"><ReviewPriority nivel={report.informe.nivel_riesgo_global} /><Badge variant="outline" className="rounded-md">{report.marca}</Badge>{registration?.fuente.nombre && <Badge variant="outline" className="rounded-md">Fuente {registration.fuente.nombre}</Badge>}</div>
            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Evaluación asistida</p>
            <h1 className="mt-2 text-3xl font-normal leading-tight tracking-[-0.04em] text-foreground sm:text-5xl">{report.informe.resumen_ejecutivo}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">La prioridad resume señales para ordenar trabajo. No equivale a disponibilidad, registrabilidad, aceptación ni rechazo jurídico.</p>
          </div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={reset} className="gap-2"><RotateCcw className="h-4 w-4" />Otra marca</Button><WatchBrandAction mark={report.marca} niza={reportNiza} /><Button asChild><a href="#antecedentes">Ver antecedentes <ArrowRight className="ml-2 h-4 w-4" /></a></Button></div>
        </div>
      </header>

      <section className="grid border-b border-border lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="border-b border-border py-8 lg:border-b-0 lg:border-r lg:pr-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">01 / Fuente y cobertura</p>
          <div className="mt-5 flex min-h-44 items-center justify-center border border-border bg-background p-5">{imagePreview ? <img src={imagePreview} alt={report.marca} className="max-h-40 max-w-[88%] object-contain" /> : <div className="text-center text-muted-foreground"><ImageIcon className="mx-auto h-7 w-7" /><p className="mt-2 text-xs">Evaluación por nombre</p></div>}</div>
          <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-6 border-t border-border pt-6"><Metric label="Antecedentes" value={String(registration?.calidad.resultados_totales ?? 0)} /><Metric label="Activos observados" value={String(registration?.calidad.resultados_activos ?? 0)} /><Metric label="Estrategias" value={String(registration?.calidad.estrategias_ejecutadas ?? 0)} /><Metric label="Confianza de cobertura" value={confidenceLabel(registration?.calidad.confianza)} /></div>
          {consultedAt && <p className="mt-5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Consultado {consultedAt}</p>}
          {registration?.calidad.estrategias?.length ? <div className="mt-5 border-t border-border pt-4"><p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">Estrategias ejecutadas</p><div className="mt-3 flex flex-wrap gap-2">{registration.calidad.estrategias.map((strategy) => <Badge key={strategy.id} variant="outline" className="rounded-md">{strategy.label}</Badge>)}</div></div> : null}
        </aside>

        <div id="antecedentes" className="py-8 lg:pl-8">
          <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">02 / Antecedentes</p><h2 className="mt-2 text-3xl font-normal tracking-[-0.04em] text-foreground">Qué merece revisión y por qué</h2></div><p className="max-w-sm text-xs leading-5 text-muted-foreground">El orden combina señales internas para facilitar lectura; revisa cada señal y la fuente antes de concluir.</p></div>
          {antecedents.length > 0 ? <div className="divide-y divide-border">{antecedents.slice(0, 8).map((item, index) => <AntecedentRow key={`${item.id}-${index}`} item={item} index={index} />)}</div> : <div className="py-10"><ShieldCheck className="h-6 w-6 text-primary" /><p className="mt-3 font-medium text-foreground">No hay antecedentes priorizados para mostrar.</p><p className="mt-2 text-sm text-muted-foreground">Esto no garantiza ausencia de conflicto ni registrabilidad.</p></div>}
        </div>
      </section>

      <section className="grid border-b border-border lg:grid-cols-3">
        <ContextColumn index="03" title="Clases y ámbito" icon={<Layers3 className="h-4 w-4" />}>
          {report.niza.clases.length > 0 ? <div className="space-y-4">{report.niza.clases.slice(0, 6).map((clase) => <div key={clase.numero} className="border-t border-border pt-4 first:border-0 first:pt-0"><div className="flex items-baseline gap-2"><span className="font-mono text-xs text-primary">Niza {clase.numero}</span><strong className="text-sm font-medium text-foreground">{clase.titulo}</strong></div><p className="mt-2 text-xs leading-5 text-muted-foreground">{clase.razon}</p></div>)}</div> : <p className="text-sm leading-6 text-muted-foreground">No se determinaron clases suficientes para esta evaluación.</p>}
        </ContextColumn>
        <ContextColumn index="04" title="Señales figurativas" icon={<Fingerprint className="h-4 w-4" />}>
          {report.viena.codes.length > 0 ? <div className="space-y-3">{report.viena.codes.slice(0, 8).map((code) => <div key={code.code} className="border-t border-border pt-3 first:border-0 first:pt-0"><p className="font-mono text-xs text-primary">Viena {code.code}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{code.titulo}</p></div>)}</div> : <p className="text-sm leading-6 text-muted-foreground">No hubo evidencia figurativa suficiente para mostrar códigos Viena.</p>}
        </ContextColumn>
        <ContextColumn index="05" title="Siguiente revisión" icon={<ShieldCheck className="h-4 w-4" />}>
          <p className="text-sm leading-6 text-foreground">{report.informe.recomendaciones[0] || registration?.recomendacion || "Revisar los antecedentes y sus fuentes antes de decidir el siguiente paso."}</p>
          {report.informe.proximos_pasos.length > 0 && <div className="mt-4 space-y-2">{report.informe.proximos_pasos.slice(0, 3).map((step) => <p key={step} className="text-xs leading-5 text-muted-foreground">• {step}</p>)}</div>}
        </ContextColumn>
      </section>

      {warnings.length > 0 && <section className="mt-6 border border-amber-400/25 bg-amber-400/[0.06] p-5"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /><div><p className="text-sm font-medium text-foreground">Limitaciones de la consulta</p><div className="mt-2 space-y-2">{warnings.map((warning) => <p key={warning} className="text-xs leading-5 text-muted-foreground">{warning}</p>)}</div></div></div></section>}

      <div className="mt-8 space-y-6">
        <OwnerContextPanel candidates={antecedents.slice(0, 3).map((item) => ({ name: item.nombre, applicant: item.solicitante, application: item.numero_solicitud }))} />
        <PrecedentPanel mark={report.marca} niza={reportNiza} />
      </div>

      <footer className="mt-8 flex flex-col gap-3 border-t border-border pt-6 text-xs leading-5 text-muted-foreground sm:flex-row sm:items-start sm:justify-between"><p className="max-w-3xl">{report.informe.disclaimer || "Esta lectura organiza antecedentes y señales para apoyar una revisión. No determina por sí sola si una marca será aceptada o rechazada."}</p><span className="font-medium text-foreground/70">Fuente ≠ análisis ≠ decisión jurídica</span></footer>
    </div>
  )
}

function AntecedentRow({ item, index }: { item: NonNullable<TrademarkInsightReport["registrabilidad"]>["antecedentes"][number]; index: number }) {
  const identifiers = [item.numero_solicitud ? `Solicitud ${item.numero_solicitud}` : null, item.numero_registro ? `Registro ${item.numero_registro}` : null].filter(Boolean)
  const reasons = [...item.razones.slice(0, 3), ...item.elementos_visuales_compartidos.slice(0, 2)]

  return <article className="py-6"><div className="flex flex-col gap-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Antecedente {String(index + 1).padStart(2, "0")}</p><h3 className="mt-1 text-lg font-semibold text-foreground">{item.nombre}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.solicitante || "Titular no informado"}{item.clases.length ? ` · Niza ${item.clases.join(", ")}` : ""}</p>{identifiers.length > 0 && <p className="mt-1 font-mono text-[10px] text-muted-foreground">{identifiers.join(" · ")}</p>}</div><Badge variant="outline" className="self-start rounded-md">{item.estado}</Badge></div><div className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border sm:grid-cols-4"><Signal label="Nombre" value={item.similitud_denominativa} /><Signal label="Fonética" value={item.similitud_fonetica} /><Signal label="Visual" value={item.similitud_visual} /><Signal label="Figurativa" value={item.similitud_figurativa} /></div>{reasons.length > 0 && <div className="border-l-2 border-primary/35 pl-4"><p className="text-xs font-medium text-foreground">Por qué apareció</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{reasons.join(" · ")}</p></div>}{item.viena_compartida.length > 0 && <div className="flex flex-wrap gap-2">{item.viena_compartida.slice(0, 6).map((code) => <span key={code} className="border border-border px-2 py-1 font-mono text-[10px] text-muted-foreground">Viena {code}</span>)}</div>}</div></article>
}

function Signal({ label, value }: { label: string; value: number | null }) {
  const text = value == null ? "Sin dato" : value >= 90 ? "Muy próxima" : value >= 75 ? "Próxima" : value >= 55 ? "Parcial" : "Baja"
  return <div className="bg-background p-3"><p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p><div className="mt-1 flex items-baseline justify-between gap-2"><p className="text-xs font-medium text-foreground">{text}</p><span className="text-[11px] tabular-nums text-muted-foreground">{value == null ? "—" : `${value}%`}</span></div></div>
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-2xl font-semibold tracking-[-0.03em] text-foreground">{value}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{label}</p></div>
}

function ExplainRow({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return <div className="flex gap-3 border-b border-border py-4 last:border-0"><span className="mt-0.5 text-primary">{icon}</span><div><p className="text-sm font-medium text-foreground">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{copy}</p></div></div>
}

function ContextColumn({ index, title, icon, children }: { index: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="border-b border-border py-7 lg:border-b-0 lg:border-r lg:px-7 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">{index} / contexto</p><h3 className="mt-2 text-xl font-normal tracking-[-0.025em] text-foreground">{title}</h3></div><span className="text-primary">{icon}</span></div><div className="mt-5">{children}</div></section>
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(date)
}
