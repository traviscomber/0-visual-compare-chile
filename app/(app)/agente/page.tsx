"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import type { TrademarkInsightReport } from "@/lib/agent/trademark-agent"
import {
  Upload, Loader2, AlertTriangle, CheckCircle2, ShieldAlert,
  FileText, Cpu, Search, BarChart3, Download, Zap, HelpCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ConceptModal } from "@/components/concept-modal"
import { useState as useStateHelp } from "react"

// Risk badge helper
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

export default function AgentePage() {
  const [image, setImage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [nombre, setNombre] = useState("")
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<TrademarkInsightReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeHelp, setActiveHelp] = useState<string | null>(null)
  const [conceptModal, setConceptModal] = useState<'viena' | 'niza' | 'disponible' | 'conflictos' | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Compute step progress
  const stepComplete = {
    imagen: !!image,
    nombre: !!nombre.trim(),
    resultados: !!report
  }
  const progress = (Object.values(stepComplete).filter(Boolean).length / 3) * 100

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
        body: JSON.stringify({ image, nombre: nombre.trim(), descripcion: "", industria: "" }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Error al analizar la marca")
        return
      }

      setReport(data as TrademarkInsightReport)
    } catch (err) {
      setError("Error de conexión. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const canAnalyze = !!image && !!nombre.trim() && !loading

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-300">Progreso del análisis</h3>
            <span className="text-xs text-slate-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-sm font-medium">
            <Zap className="w-4 h-4" />
            Agente IA — Análisis de Marcas
          </div>
          <h1 className="text-4xl font-bold text-white text-balance">
            Analiza tu marca en segundos
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Sube tu logo, ingresa el nombre y obtén clasificación Viena + Niza + detección de conflictos
          </p>
        </div>

        {/* Input form */}
        <div className="grid gap-6 mb-8">
          {/* Step 1: Image upload */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${stepComplete.imagen ? 'bg-green-500/20 text-green-300 border border-green-500/40' : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'}`}>
                {stepComplete.imagen ? '✓' : '1'}
              </div>
              <h3 className="font-semibold text-white">Paso 1: Sube tu logo</h3>
              <button
                onClick={() => setActiveHelp(activeHelp === 'image' ? null : 'image')}
                className="ml-auto text-slate-400 hover:text-slate-300"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
            
            {activeHelp === 'image' && (
              <div className="text-xs text-slate-300 bg-blue-500/10 p-3 rounded border border-blue-500/20 mb-3 flex gap-2">
                <span className="text-blue-400 shrink-0">💡</span>
                <span>Usa una imagen clara y de alta resolución. PNG, JPG o SVG funcionan bien. La imagen puede ser el logo solo o con nombre de marca.</span>
              </div>
            )}

            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500/60 hover:bg-blue-500/5 transition-all bg-slate-900/30"
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
              {imagePreview ? (
                <div className="flex flex-col items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Logo" className="max-h-24 max-w-xs rounded-lg object-contain" />
                  <p className="text-xs text-slate-400">Haz clic para cambiar</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <Upload className="w-8 h-8 opacity-50" />
                  <p className="text-sm font-medium text-slate-300">Arrastra tu logo aquí</p>
                  <p className="text-xs">o haz clic para seleccionar</p>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Nombre */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${stepComplete.nombre ? 'bg-green-500/20 text-green-300 border border-green-500/40' : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'}`}>
                {stepComplete.nombre ? '✓' : '2'}
              </div>
              <h3 className="font-semibold text-white">Paso 2: Nombre de la marca</h3>
              <button
                onClick={() => setActiveHelp(activeHelp === 'nombre' ? null : 'nombre')}
                className="ml-auto text-slate-400 hover:text-slate-300"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>

            {activeHelp === 'nombre' && (
              <div className="text-xs text-slate-300 bg-blue-500/10 p-3 rounded border border-blue-500/20 mb-3 flex gap-2">
                <span className="text-blue-400 shrink-0">💡</span>
                <span>Escribe exactamente cómo quieres registrar tu marca en INAPI. Usa mayúsculas, caracteres especiales si los tiene. Ejemplo: "VISUAL COMPARE®" o "La Marca™"</span>
              </div>
            )}

            <Input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              onKeyDown={e => e.key === "Enter" && canAnalyze && handleAnalyze()}
              placeholder="Nombre de la marca (ej: VISUAL COMPARE)"
              className="bg-slate-900/60 border-slate-600 text-white placeholder:text-slate-500 h-11"
            />
          </div>

          {/* Step 3: Analyze */}
          <div>
            <Button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold h-12 gap-2 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <div className="text-left">
                    <div className="text-sm">Analizando...</div>
                    <div className="text-xs opacity-75">Viena • Niza • INAPI</div>
                  </div>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-sm">Analizar marca</div>
                    <div className="text-xs opacity-75">Paso 3 de 3</div>
                  </div>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-300 text-sm flex items-start gap-2 mb-6">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Report */}
        {report && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-5">
              <div className="flex items-start justify-between mb-3 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{report.marca}</h2>
                  <p className="text-xs text-slate-400 mt-1">{report.pipeline_ms}ms · {report.tokens_totales} tokens</p>
                </div>
                <RiskBadge nivel={report.informe.nivel_riesgo_global} />
              </div>
              <p className="text-slate-200 text-sm leading-relaxed">{report.informe.resumen_ejecutivo}</p>
              {report.informe.analisis_conflictos && (
                <p className="text-slate-300 text-xs mt-3">{report.informe.analisis_conflictos}</p>
              )}
            </div>

            {/* INAPI Registrabilidad — verificación real en Chile */}
            {report.registrabilidad && (
              <div className={`rounded-lg p-4 border ${
                report.registrabilidad.disponible
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className={`font-semibold flex items-center gap-1.5 ${report.registrabilidad.disponible ? 'text-green-300' : 'text-red-300'}`}>
                    <CheckCircle2 className="w-4 h-4" />
                    {report.registrabilidad.disponible ? 'Disponible en Chile' : 'No disponible'}
                  </h3>
                  <button
                    onClick={() => setConceptModal('disponible')}
                    className="text-slate-400 hover:text-slate-300 transition-colors"
                    title="¿Qué significa disponible?"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>
                <p className={`text-sm ${report.registrabilidad.disponible ? 'text-green-200' : 'text-red-200'}`}>
                  {report.registrabilidad.recomendacion}
                </p>
                {report.registrabilidad.marca_encontrada && (
                  <div className="text-xs text-slate-300 bg-slate-900/50 rounded p-2 mt-2 space-y-1">
                    <p className="font-semibold text-slate-200">{report.registrabilidad.marca_encontrada.nombre}</p>
                    <p className="text-slate-400">Solicitante: {report.registrabilidad.marca_encontrada.solicitante}</p>
                    <p className="text-slate-400">Estado: {report.registrabilidad.marca_encontrada.estado}</p>
                  </div>
                )}
                {report.registrabilidad.conflictos_reales > 0 && (
                  <p className="text-xs text-slate-300 mt-2">Conflictos en INAPI: <span className="font-semibold text-slate-200">{report.registrabilidad.conflictos_reales}</span></p>
                )}
              </div>
            )}

            {/* Stats — Conflictos */}
            <div className="mb-2 flex items-center gap-2 px-1">
              <h3 className="font-semibold text-slate-300 text-sm">Conflictos detectados</h3>
              <button
                onClick={() => setConceptModal('conflictos')}
                className="text-slate-400 hover:text-slate-300 transition-colors"
                title="¿Qué son conflictos?"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-red-300">{report.conflictos.breakdown.alto}</p>
                <p className="text-xs text-red-300 opacity-70">Alto</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-amber-300">{report.conflictos.breakdown.medio}</p>
                <p className="text-xs text-amber-300 opacity-70">Medio</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-green-300">{report.conflictos.breakdown.bajo}</p>
                <p className="text-xs text-green-300 opacity-70">Bajo</p>
              </div>
              <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-slate-200">{report.viena.codes.length + report.niza.clases.length}</p>
                <p className="text-xs text-slate-400">Clasificaciones</p>
              </div>
            </div>

            {/* Classifications grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Viena */}
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
                <h3 className="font-semibold text-purple-300 text-sm mb-2 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4" /> Viena ({report.viena.codes.length})
                  <button
                    onClick={() => setConceptModal('viena')}
                    className="ml-auto text-slate-400 hover:text-slate-300 transition-colors"
                    title="¿Qué es Viena?"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </h3>
                <div className="flex flex-wrap gap-1 mb-3">
                  {report.viena.elementos_detectados.slice(0, 3).map((e, i) => (
                    <Badge key={i} variant="outline" className="text-xs border-purple-500/30 text-purple-300 bg-purple-500/10">{e}</Badge>
                  ))}
                </div>
                <ul className="space-y-1.5 text-xs">
                  {report.viena.codes.slice(0, 3).map(c => (
                    <li key={c.code} className="flex items-center justify-between text-slate-300">
                      <span>{c.code} • {c.titulo.substring(0, 30)}</span>
                      <span className="text-purple-300">{Math.round(c.confidence * 100)}%</span>
                    </li>
                  ))}
                  {report.viena.codes.length > 3 && (
                    <li className="text-slate-500">+{report.viena.codes.length - 3} más</li>
                  )}
                </ul>
              </div>

              {/* Niza */}
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-300 text-sm mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Niza ({report.niza.clases.length})
                  <button
                    onClick={() => setConceptModal('niza')}
                    className="ml-auto text-slate-400 hover:text-slate-300 transition-colors"
                    title="¿Qué es Niza?"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </h3>
                <ul className="space-y-1.5 text-xs">
                  {report.niza.clases.slice(0, 4).map(c => (
                    <li key={c.numero} className="flex items-center justify-between text-slate-300">
                      <span>Clase {c.numero} • {c.titulo.substring(0, 24)}</span>
                      <span className={`text-xs ${c.tipo === "principal" ? "text-blue-300 font-semibold" : "text-slate-500"}`}>
                        {c.tipo === "principal" ? "P" : "S"}
                      </span>
                    </li>
                  ))}
                  {report.niza.clases.length > 4 && (
                    <li className="text-slate-500">+{report.niza.clases.length - 4} más</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Conflictos */}
            {report.conflictos.conflictos.length > 0 && (
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
                <h3 className="font-semibold text-amber-300 text-sm mb-3 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> Conflictos ({report.conflictos.conflictos.length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {report.conflictos.conflictos.slice(0, 3).map((c, i) => (
                    <div key={i} className={`text-xs p-2 rounded border ${
                      c.nivel_riesgo === "alto" ? "bg-red-500/10 border-red-500/20 text-red-300" :
                      c.nivel_riesgo === "medio" ? "bg-amber-500/10 border-amber-500/20 text-amber-300" :
                      "bg-green-500/10 border-green-500/20 text-green-300"
                    }`}>
                      <p className="font-semibold">{c.marca.nombre}</p>
                      <p className="opacity-80 mt-0.5">{c.razon_conflicto.substring(0, 80)}...</p>
                    </div>
                  ))}
                  {report.conflictos.conflictos.length > 3 && (
                    <p className="text-slate-500 text-xs">+{report.conflictos.conflictos.length - 3} conflictos más</p>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <p className="text-xs text-center text-slate-500">{report.informe.disclaimer}</p>
          </div>
        )}

        {/* Concept modals */}
        <ConceptModal concept="viena" isOpen={conceptModal === 'viena'} onClose={() => setConceptModal(null)} />
        <ConceptModal concept="niza" isOpen={conceptModal === 'niza'} onClose={() => setConceptModal(null)} />
        <ConceptModal concept="disponible" isOpen={conceptModal === 'disponible'} onClose={() => setConceptModal(null)} />
        <ConceptModal concept="conflictos" isOpen={conceptModal === 'conflictos'} onClose={() => setConceptModal(null)} />
      </div>
    </main>
  )
}
