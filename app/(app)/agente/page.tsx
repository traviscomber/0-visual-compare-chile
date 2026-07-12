"use client"

import { useState, useRef } from "react"
import type { TrademarkInsightReport } from "@/lib/agent/trademark-agent"
import {
  Upload, Loader2, AlertTriangle, CheckCircle2, ShieldAlert,
  ChevronDown, ChevronUp, FileText, Cpu, Search, BarChart3
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

// ─── Risk badge ────────────────────────────────────────────────────────────────
function RiskBadge({ nivel }: { nivel: string }) {
  const n = nivel?.toUpperCase()
  if (n === "ALTO")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-red-500/20 text-red-300 border border-red-500/40">
        <AlertTriangle className="w-4 h-4" /> RIESGO ALTO
      </span>
    )
  if (n === "MEDIO")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
        <ShieldAlert className="w-4 h-4" /> RIESGO MEDIO
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-green-500/20 text-green-300 border border-green-500/40">
      <CheckCircle2 className="w-4 h-4" /> RIESGO BAJO
    </span>
  )
}

// ─── Collapsible section ────────────────────────────────────────────────────────
function Section({ title, icon, children, defaultOpen = false }: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card className="bg-slate-800/60 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-0">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center justify-between w-full text-left"
        >
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
            {icon} {title}
          </CardTitle>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
      </CardHeader>
      {open && <CardContent className="pt-4">{children}</CardContent>}
    </Card>
  )
}

// ─── Conflict row ───────────────────────────────────────────────────────────────
function ConflictRow({ c }: { c: TrademarkInsightReport["conflictos"]["conflictos"][0] }) {
  const color =
    c.nivel_riesgo === "alto"  ? "text-red-300 border-red-500/30 bg-red-500/10" :
    c.nivel_riesgo === "medio" ? "text-amber-300 border-amber-500/30 bg-amber-500/10" :
                                 "text-green-300 border-green-500/30 bg-green-500/10"
  return (
    <div className={`rounded-lg border p-3 text-sm ${color}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold">{c.marca.nombre}</span>
        <span className="text-xs opacity-70">{c.marca.pais} · {c.marca.estado} · Score {c.score_total}/100</span>
      </div>
      <p className="opacity-80 text-xs leading-relaxed">{c.razon_conflicto}</p>
      <div className="flex flex-wrap gap-1 mt-2">
        {c.viena_overlap.map(v => (
          <Badge key={v} variant="outline" className="text-[10px] border-current opacity-70">Viena {v}</Badge>
        ))}
        {c.niza_overlap.map(n => (
          <Badge key={n} variant="outline" className="text-[10px] border-current opacity-70">Niza {n}</Badge>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function AgentePage() {
  const [image, setImage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [industria, setIndustria] = useState("")
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<TrademarkInsightReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = e => {
      const dataUrl = e.target?.result as string
      setImagePreview(dataUrl)
      setImage(dataUrl.replace(/^data:image\/[a-z]+;base64,/, ""))
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleAnalyze = async () => {
    if (!image || !nombre.trim()) return
    setLoading(true)
    setError(null)
    setReport(null)

    try {
      const res = await fetch("/api/v1/agent/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, nombre: nombre.trim(), descripcion, industria }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Error al analizar la marca")
        return
      }

      setReport(data as TrademarkInsightReport)
    } catch (err) {
      setError("Error de conexión. Intenta nuevamente.")
      console.error("[v0] agente fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const canAnalyze = !!image && !!nombre.trim() && !loading

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-sm font-medium">
            <Cpu className="w-4 h-4" />
            Agente Marca Intelligence — IA
          </div>
          <h1 className="text-4xl font-bold text-white text-balance">
            Análisis inteligente de marcas
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
            Clasifica tu logo con Viena + Niza, detecta conflictos en el repositorio
            de marcas y obtiene un informe ejecutivo en segundos.
          </p>
        </div>

        {/* Input form */}
        <Card className="bg-slate-800/60 border-slate-700/50 backdrop-blur-sm">
          <CardContent className="pt-6 space-y-5">

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="relative border-2 border-dashed border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500/60 hover:bg-blue-500/5 transition-all"
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
              {imagePreview ? (
                <div className="flex flex-col items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Logo a analizar" className="max-h-32 max-w-xs rounded-lg object-contain" />
                  <p className="text-xs text-slate-400">Haz clic para cambiar imagen</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <Upload className="w-10 h-10 opacity-50" />
                  <div>
                    <p className="font-medium text-slate-300">Arrastra tu logo aquí</p>
                    <p className="text-sm mt-1">o haz clic para seleccionar (PNG, JPG, SVG)</p>
                  </div>
                </div>
              )}
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Nombre de la marca *</label>
                <Input
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="ej: VISUAL COMPARE"
                  className="bg-slate-900/60 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Industria / sector</label>
                <Input
                  value={industria}
                  onChange={e => setIndustria(e.target.value)}
                  placeholder="ej: tecnología, retail, salud"
                  className="bg-slate-900/60 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Descripción del negocio</label>
              <Textarea
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="¿Qué hace tu empresa? ej: Plataforma SaaS de comparación visual de logos para abogados de PI"
                className="bg-slate-900/60 border-slate-600 text-white placeholder:text-slate-500 resize-none h-20"
              />
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold h-11 gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analizando con IA...</>
              ) : (
                <><Search className="w-4 h-4" /> Analizar marca</>
              )}
            </Button>

            {loading && (
              <div className="text-center text-sm text-slate-400 space-y-1">
                <p>El agente está ejecutando 3 modelos en paralelo...</p>
                <p className="text-xs opacity-60">Clasificación Viena (Vision) + Clasificación Niza + Detección de conflictos</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300 text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Report */}
        {report && (
          <div className="space-y-4">

            {/* Executive summary card */}
            <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">{report.marca}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {report.tokens_totales.toLocaleString()} tokens · ${report.costo_estimado_usd} USD · {report.pipeline_ms}ms
                    </p>
                  </div>
                  <RiskBadge nivel={report.informe.nivel_riesgo_global} />
                </div>

                <p className="text-slate-200 leading-relaxed">{report.informe.resumen_ejecutivo}</p>

                {report.informe.analisis_conflictos && (
                  <>
                    <Separator className="my-4 bg-slate-700/50" />
                    <p className="text-slate-300 text-sm leading-relaxed">{report.informe.analisis_conflictos}</p>
                  </>
                )}

                {/* Conflict summary chips */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/15 text-red-300 border border-red-500/25">
                    {report.conflictos.breakdown.alto} conflicto{report.conflictos.breakdown.alto !== 1 ? "s" : ""} alto
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">
                    {report.conflictos.breakdown.medio} medio{report.conflictos.breakdown.medio !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-300 border border-green-500/25">
                    {report.conflictos.breakdown.bajo} bajo{report.conflictos.breakdown.bajo !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600/50">
                    {report.conflictos.total_marcas_analizadas.toLocaleString()} marcas analizadas
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Recomendaciones */}
            {report.informe.recomendaciones.length > 0 && (
              <Section title="Recomendaciones" icon={<CheckCircle2 className="w-4 h-4 text-green-400" />} defaultOpen>
                <ul className="space-y-2">
                  {report.informe.recomendaciones.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="mt-0.5 w-5 h-5 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center justify-center shrink-0 font-semibold">{i + 1}</span>
                      {r}
                    </li>
                  ))}
                </ul>
                {report.informe.proximos_pasos.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Próximos pasos</p>
                    <ul className="space-y-1">
                      {report.informe.proximos_pasos.map((p, i) => (
                        <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">→</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Section>
            )}

            {/* Clasificación Viena */}
            <Section title={`Clasificación Viena (${report.viena.codes.length} códigos)`} icon={<BarChart3 className="w-4 h-4 text-purple-400" />}>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {report.viena.elementos_detectados.map((e, i) => (
                    <Badge key={i} variant="outline" className="text-xs border-purple-500/30 text-purple-300 bg-purple-500/10">{e}</Badge>
                  ))}
                </div>
                <div className="space-y-2">
                  {report.viena.codes.map(c => (
                    <div key={c.code} className="flex items-start gap-3 text-sm">
                      <code className="shrink-0 px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 text-xs font-mono">{c.code}</code>
                      <div className="flex-1 min-w-0">
                        <span className="text-slate-300">{c.titulo}</span>
                        <span className="text-slate-500 text-xs ml-2">({c.elemento})</span>
                      </div>
                      <span className="text-xs text-slate-500 shrink-0">{Math.round(c.confidence * 100)}%</span>
                    </div>
                  ))}
                </div>
                {report.viena.colores_dominantes.length > 0 && (
                  <p className="text-xs text-slate-400">Colores dominantes: {report.viena.colores_dominantes.join(", ")}</p>
                )}
              </div>
            </Section>

            {/* Clasificación Niza */}
            <Section title={`Clasificación Niza (${report.niza.clases.length} clases)`} icon={<FileText className="w-4 h-4 text-blue-400" />}>
              <div className="space-y-3">
                {report.niza.clases.map(c => (
                  <div key={c.numero} className="flex items-start gap-3 text-sm">
                    <div className="shrink-0 flex flex-col items-center gap-0.5">
                      <code className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 text-xs font-mono">Clase {c.numero}</code>
                      <span className={`text-[10px] ${c.tipo === "principal" ? "text-blue-400" : "text-slate-500"}`}>
                        {c.tipo}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-300 font-medium leading-tight">{c.titulo}</p>
                      <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{c.razon}</p>
                    </div>
                  </div>
                ))}
                <div className={`text-xs px-3 py-2 rounded-lg mt-1 ${
                  report.niza.riesgo_sin_registro === "alto"  ? "bg-red-500/10 text-red-300 border border-red-500/20" :
                  report.niza.riesgo_sin_registro === "medio" ? "bg-amber-500/10 text-amber-300 border border-amber-500/20" :
                                                                "bg-green-500/10 text-green-300 border border-green-500/20"
                }`}>
                  Riesgo sin registro: <strong>{report.niza.riesgo_sin_registro.toUpperCase()}</strong>
                  {report.niza.resumen && ` — ${report.niza.resumen}`}
                </div>
              </div>
            </Section>

            {/* Conflictos */}
            {report.conflictos.conflictos.length > 0 && (
              <Section title={`Conflictos detectados (${report.conflictos.conflictos.length})`} icon={<ShieldAlert className="w-4 h-4 text-amber-400" />}>
                <div className="space-y-2">
                  {report.conflictos.conflictos.map((c, i) => (
                    <ConflictRow key={i} c={c} />
                  ))}
                </div>
              </Section>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-center text-slate-500 px-4">
              {report.informe.disclaimer}
            </p>

          </div>
        )}
      </div>
    </main>
  )
}
