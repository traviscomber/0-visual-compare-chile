"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { Activity, ArrowRight, Building2, FlaskConical, Loader2, Radar, Search, Sparkles } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Movement = "entrante" | "experimental" | "acelerando" | "consolidado" | "retirandose" | "sin_senal"
type Company = {
  identity_id: string
  canonical_name: string
  country: string | null
  current_count: number
  previous_count: number
  delta: number
  movement: Movement
  latest_filing: string | null
}
type Result = {
  entity_type: "patent" | "trademark"
  code: string
  classification: "IPC" | "Niza"
  window: { days: number; current_label: string; previous_label: string }
  metrics: {
    entrants: number
    accelerating: number
    consolidated: number
    experimental: number
    retreating: number
    current_filings: number
    previous_filings: number
    delta: number
  }
  interpretation: { observed_fact: string; signal: string; guardrail: string }
  entrants: Company[]
  accelerating: Company[]
  consolidated: Company[]
  experimental: Company[]
  retreating: Company[]
}

export default function CompetitiveSpacesPage() {
  const [type, setType] = useState<"patent" | "trademark">("patent")
  const [code, setCode] = useState("H02J3/32")
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function analyze(event?: FormEvent) {
    event?.preventDefault()
    if (!code.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ type, code: code.trim() })
      const response = await fetch(`/api/intelligence/ip-space?${params.toString()}`, { cache: "no-store" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos analizar el espacio.")
      setResult(payload as Result)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos analizar el espacio.")
    } finally {
      setLoading(false)
    }
  }

  function choose(nextType: "patent" | "trademark") {
    setType(nextType)
    setCode(nextType === "patent" ? "H02J3/32" : "42")
    setResult(null)
    setError(null)
  }

  return <OperationalPage>
    <OperationalHeader
      eyebrow="VIDENTIA / Espacios competitivos"
      title="Quién está entrando en tu espacio."
      description={<>Detecta actores que aparecen con actividad repetida en una clasificación IPC o Niza. VIDENTIA separa una entrada observada de una presentación aislada para no convertir ruido en estrategia.</>}
      meta={<><span>IPC + Niza</span><span>180 vs 180 días</span><span>2+ expedientes = entrada</span><span>1 expediente = experimental</span></>}
      actions={<Button asChild variant="outline"><Link href="/brechas">Ver brechas IP <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>}
    />

    <section className="border-b border-border/80 py-8">
      <div className="mb-4 flex flex-wrap gap-2">
        <Button type="button" variant={type === "patent" ? "default" : "outline"} size="sm" onClick={() => choose("patent")}><FlaskConical className="h-4 w-4" />IPC / Patentes</Button>
        <Button type="button" variant={type === "trademark" ? "default" : "outline"} size="sm" onClick={() => choose("trademark")}><Building2 className="h-4 w-4" />Niza / Marcas</Button>
      </div>
      <form onSubmit={event => void analyze(event)} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <Input value={code} onChange={event => setCode(event.target.value)} maxLength={32} aria-label={type === "patent" ? "Código IPC" : "Clase Niza"} placeholder={type === "patent" ? "Ej: H02J3/32, C22B26/12" : "Ej: 9, 35, 42"} />
        <Button disabled={!code.trim() || loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Analizar espacio</Button>
      </form>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">Entrada = ≥2 expedientes en los últimos 180 días y 0 en los 180 días anteriores para la misma identidad corporativa. Una sola presentación queda como experimental.</p>
    </section>

    {error ? <div role="alert" className="mt-6 rounded-[10px] bg-[#3A2525] p-4 text-sm text-[#E8AAA3]">{error}</div> : null}
    {!result && !loading ? <InitialState type={type} /> : null}

    {result ? <>
      <OperationalMetricRail>
        <OperationalMetric value={result.metrics.entrants} label="Entrantes" detail="Actividad nueva repetida" tone={result.metrics.entrants ? "success" : "neutral"} />
        <OperationalMetric value={result.metrics.accelerating} label="Acelerando" detail="≥50% y +2 expedientes" />
        <OperationalMetric value={result.metrics.consolidated} label="Consolidados" detail="Presentes en ambas ventanas" />
        <OperationalMetric value={result.metrics.experimental} label="Experimentales" detail="Una sola presentación nueva" tone={result.metrics.experimental ? "warning" : "neutral"} />
      </OperationalMetricRail>

      <section className="grid gap-8 border-b border-border/80 py-9 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)] xl:gap-10">
        <div>
          <OperationalSectionHeader eyebrow={`${result.classification} ${result.code}`} title="Movimientos observados" meta={`${result.metrics.current_filings} expedientes actuales`} />
          <div className="mt-5 divide-y divide-border/80 border-y border-border/80">
            {[...result.entrants, ...result.accelerating, ...result.consolidated].slice(0, 30).map(company => <CompanyRow key={`${company.movement}-${company.identity_id}`} company={company} />)}
            {!result.entrants.length && !result.accelerating.length && !result.consolidated.length ? <div className="py-8 text-sm text-muted-foreground">No hay actividad repetida suficiente en esta clasificación.</div> : null}
          </div>
        </div>
        <aside>
          <OperationalPanel>
            <OperationalSectionHeader eyebrow="Lectura" title="Qué significa" />
            <div className="mt-5 space-y-5 text-sm leading-6 text-muted-foreground">
              <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Hecho observado</p><p className="mt-1">{result.interpretation.observed_fact}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Señal</p><p className="mt-1">{result.interpretation.signal}</p></div>
              <div className="border-t border-border/80 pt-4 text-xs leading-5">{result.interpretation.guardrail}</div>
            </div>
          </OperationalPanel>
        </aside>
      </section>

      <section className="py-9">
        <OperationalSectionHeader eyebrow="Señal débil" title="Actividad experimental" meta={`${result.experimental.length} visibles`} />
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Estas empresas aparecen una sola vez. Se conservan para vigilancia, pero VIDENTIA no las clasifica como entrada estratégica.</p>
        <div className="mt-5 divide-y divide-border/80 border-y border-border/80">{result.experimental.slice(0, 20).map(company => <CompanyRow key={`experimental-${company.identity_id}`} company={company} />)}</div>
      </section>
    </> : null}
  </OperationalPage>
}

function InitialState({ type }: { type: "patent" | "trademark" }) {
  const Icon = type === "patent" ? Radar : Sparkles
  return <section className="py-14"><Icon className="h-6 w-6 text-[#96B5A6]" /><h2 className="mt-4 text-xl font-medium text-white">Mide un espacio, no una impresión.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Busca una {type === "patent" ? "clasificación IPC" : "clase Niza"}. El motor compara dos ventanas consecutivas y separa entrantes, aceleración, persistencia y actividad experimental.</p></section>
}

function CompanyRow({ company }: { company: Company }) {
  const label: Record<Movement, string> = { entrante: "Entrante", experimental: "Experimental", acelerando: "Acelerando", consolidado: "Consolidado", retirandose: "En descenso", sin_senal: "Sin señal" }
  return <div className="grid gap-3 px-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="rounded-md">{label[company.movement]}</Badge>{company.country ? <span className="text-xs text-muted-foreground">{company.country}</span> : null}</div><p className="mt-2 truncate text-sm font-medium text-white">{company.canonical_name}</p></div>
    <div className="flex items-center gap-5 text-xs text-muted-foreground"><span><strong className="font-medium text-white">{company.current_count}</strong> actual</span><span>{company.previous_count} previo</span><Activity className="h-4 w-4" /></div>
  </div>
}
