"use client"

import { useState } from "react"
import { FileDown, CheckCircle, AlertTriangle, Clock, Zap, FileText, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const CASES = [
  {
    id: "1",
    name: "TORO BEBIDAS",
    industry: "Bebidas / Alimentación",
    risk: "BAJO" as const,
    tokens: 4367,
    cost: "$0.0437",
    time: "8.9s",
    conflicts: 3,
    conflictBreakdown: "0 alto · 0 medio · 3 bajo",
    viena: ["03.02.02", "26.03.01", "27.01.01", "27.01.04"],
    niza: ["32", "35"],
    logo: "/test-logos/logo-toro-bebidas.png",
  },
  {
    id: "2",
    name: "TORITO ENERGIA",
    industry: "Bebidas energéticas / Alimentación",
    risk: "MEDIO" as const,
    tokens: 4571,
    cost: "$0.0457",
    time: "5.9s",
    conflicts: 8,
    conflictBreakdown: "0 alto · 2 medio · 6 bajo",
    viena: ["03.02.02", "26.05.01", "27.01.01"],
    niza: ["32", "35", "41"],
    logo: "/test-logos/logo-torito-energia.png",
  },
]

const RISK_CONFIG = {
  BAJO:  { label: "Riesgo Bajo",  icon: CheckCircle,   color: "text-emerald-600",  bg: "bg-emerald-50",  border: "border-emerald-200" },
  MEDIO: { label: "Riesgo Medio", icon: AlertTriangle, color: "text-amber-600",    bg: "bg-amber-50",    border: "border-amber-200"   },
  ALTO:  { label: "Riesgo Alto",  icon: AlertTriangle, color: "text-red-600",      bg: "bg-red-50",      border: "border-red-200"     },
}

function CaseCard({ c }: { c: typeof CASES[0] }) {
  const cfg = RISK_CONFIG[c.risk]
  const Icon = cfg.icon
  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-5`}>
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="w-16 h-16 rounded-lg border border-border overflow-hidden shrink-0 bg-white">
          <img src={c.logo} alt={c.name} className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-bold text-base" style={{ color: "#111827" }}>{c.name}</h3>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
              <Icon className="w-3 h-3" />
              {cfg.label}
            </span>
          </div>
          <p className="text-xs mt-0.5 mb-3" style={{ color: "#6b7280" }}>{c.industry}</p>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: String(c.conflicts), label: "Conflictos" },
              { value: c.tokens.toLocaleString(), label: "Tokens" },
              { value: c.cost, label: "Costo IA" },
              { value: c.time, label: "Tiempo" },
            ].map(({ value, label }) => (
              <div key={label} className="rounded-lg p-2 text-center border" style={{ backgroundColor: "rgba(255,255,255,0.85)", borderColor: "rgba(0,0,0,0.1)" }}>
                <div className="text-sm font-bold" style={{ color: "#111827" }}>{value}</div>
                <div className="text-[10px]" style={{ color: "#6b7280" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Viena / Niza chips */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {c.viena.map(v => (
              <span key={v} className="inline-flex items-center rounded-md border px-2 h-5 font-mono text-[10px]" style={{ backgroundColor: "rgba(255,255,255,0.7)", borderColor: "rgba(0,0,0,0.15)", color: "#374151" }}>{v}</span>
            ))}
            {c.niza.map(n => (
              <span key={n} className="inline-flex items-center rounded-md px-2 h-5 font-mono text-[10px] font-semibold" style={{ backgroundColor: "rgba(59,130,246,0.15)", color: "#1d4ed8" }}>NCL {n}</span>
            ))}
          </div>
          <p className="text-[10px] mt-1" style={{ color: "#6b7280" }}>{c.conflictBreakdown}</p>
        </div>
      </div>
    </div>
  )
}

export default function ReportPage() {
  const [loading, setLoading] = useState<"all" | "1" | "2" | null>(null)

  async function download(caseId: "all" | "1" | "2") {
    setLoading(caseId)
    try {
      const res = await fetch(`/api/report/pdf?cases=${caseId}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert("Error generando PDF: " + (err.detail ?? res.statusText))
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `informe-marcas-${caseId}-visualcompare.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert("Error de red: " + String(e))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <FileText className="w-3.5 h-3.5" />
          <span>Agente IA</span>
          <span>/</span>
          <span>Informe PDF</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Informe de Análisis de Marca
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Reporte ejecutivo con clasificación Viena y Niza, detección de conflictos y
          capturas de pantalla de los resultados reales del Agente IA.
        </p>
      </div>

      {/* Cases */}
      <div className="space-y-4 mb-8">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Casos incluidos
        </h2>
        {CASES.map(c => <CaseCard key={c.id} c={c} />)}
      </div>

      {/* What's included */}
      <div className="rounded-xl border border-border bg-card p-5 mb-8">
        <h2 className="text-sm font-semibold text-foreground mb-4">Contenido del informe</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Eye,       label: "Portada ejecutiva con estadísticas globales" },
            { icon: FileText,  label: "Resumen comparativo de todos los casos" },
            { icon: Zap,       label: "Metodología del motor de conflictos (scoring)" },
            { icon: CheckCircle, label: "Clasificación Viena con % de confianza" },
            { icon: FileDown,  label: "Clases Niza recomendadas por caso" },
            { icon: AlertTriangle, label: "Tabla de conflictos con score y nivel" },
            { icon: Eye,       label: "Capturas de pantalla de resultados reales" },
            { icon: CheckCircle, label: "Recomendaciones y próximos pasos por caso" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-start gap-2">
              <Icon className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              <span className="text-xs text-muted-foreground leading-relaxed">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Download buttons */}
      <div className="space-y-3">
        <Button
          className="w-full h-12 text-sm font-semibold gap-2"
          onClick={() => download("all")}
          disabled={loading !== null}
        >
          {loading === "all" ? (
            <>
              <Clock className="w-4 h-4 animate-spin" />
              Generando PDF completo...
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4" />
              Descargar informe completo (2 casos)
            </>
          )}
        </Button>

        <div className="grid grid-cols-2 gap-3">
          {CASES.map(c => (
            <Button
              key={c.id}
              variant="outline"
              className="h-11 text-xs font-medium gap-2"
              onClick={() => download(c.id as "1" | "2")}
              disabled={loading !== null}
            >
              {loading === c.id ? (
                <>
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5" />
                  Solo {c.name}
                </>
              )}
            </Button>
          ))}
        </div>

        <p className="text-center text-[11px] text-muted-foreground pt-1">
          El PDF se genera en tiempo real con los datos reales del análisis.
          El proceso toma 10-20 segundos.
        </p>
      </div>
    </div>
  )
}
