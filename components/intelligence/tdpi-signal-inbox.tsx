"use client"

import { useEffect, useState } from "react"
import { BellRing, ExternalLink, Loader2, Scale, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SaveToCaseAction } from "@/components/app/save-to-case-action"

type Signal = {
  id: string
  source_kind: string
  source_date: string | null
  source_url: string
  source_title: string | null
  rol_tdpi: string | null
  application_number: string | null
  mark_name: string | null
  applicant_name: string | null
  opponent_name: string | null
  nice_classes: number[] | null
  procedural_state: string | null
  relevance: number
  matched_analysis: string
  reasons: string[]
}

type Payload = { signals: Signal[]; watched_marks: number; total_scanned: number; notice?: string }

export function TdpiSignalInbox() {
  const [data, setData] = useState<Payload>({ signals: [], watched_marks: 0, total_scanned: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/intelligence/tdpi-signals", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload.error ?? "No pudimos consultar señales TDPI.")
        setData(payload as Payload)
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "No pudimos consultar señales TDPI.")
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  return <section className="mx-auto w-full max-w-[1380px] px-4 pt-8 sm:px-6 lg:px-8 lg:pt-12">
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="max-w-3xl"><div className="flex items-center gap-2 text-teal-700"><Scale className="h-4 w-4"/><p className="text-xs font-semibold uppercase tracking-[0.15em]">Señales de marcas · TDPI</p></div><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Asuntos nuevos relacionados con lo que ya analizaste</h2><p className="mt-2 text-sm leading-6 text-slate-600">Cruzamos nuevos ingresos y actuaciones del TDPI con tus análisis de marcas. No necesitas crear otra vigilancia.</p></div>
        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">{data.watched_marks} marcas observadas</Badge>
      </div>

      {loading ? <div className="flex items-center gap-2 p-6 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin"/>Buscando relaciones…</div> : null}
      {error ? <div className="p-6 text-sm text-slate-500">{error}</div> : null}
      {!loading && !error && data.signals.length === 0 ? <div className="flex gap-3 p-6"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"/><div><p className="text-sm font-semibold text-slate-900">No hay asuntos TDPI relacionados por ahora</p><p className="mt-1 text-sm leading-6 text-slate-500">Cuando aparezca una actuación vinculada a una marca que ya evaluaste, se mostrará aquí con su fuente oficial.</p></div></div> : null}

      {data.signals.length > 0 ? <div className="divide-y divide-slate-100">{data.signals.map((signal) => <article key={signal.id} className="p-5 sm:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100"><BellRing className="mr-1 h-3.5 w-3.5"/>Nueva señal</Badge>{signal.rol_tdpi ? <Badge variant="outline">TDPI {signal.rol_tdpi}</Badge> : null}<Badge variant="outline">Relacionada con {signal.matched_analysis}</Badge></div><h3 className="mt-3 text-lg font-semibold text-slate-950">{signal.mark_name || "Marca no informada"}</h3><p className="mt-1 text-sm text-slate-500">{signal.applicant_name || "Solicitante no informado"}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">{signal.application_number ? <span>Solicitud {signal.application_number}</span> : null}{signal.procedural_state ? <span>{signal.procedural_state}</span> : null}{signal.source_date ? <span>{formatDate(signal.source_date)}</span> : null}{signal.nice_classes?.length ? <span>Clases {signal.nice_classes.join(", ")}</span> : null}</div>{signal.reasons?.length ? <p className="mt-3 text-sm leading-6 text-slate-600">Por qué apareció: {signal.reasons.join(" · ")}</p> : null}</div><div className="shrink-0 text-left lg:text-right"><p className="text-xs text-slate-400">Relación</p><p className="mt-1 text-2xl font-semibold text-slate-950">{signal.relevance}/100</p></div></div><div className="mt-5 flex flex-wrap gap-2"><Button asChild size="sm" className="bg-teal-700 hover:bg-teal-800"><a href={signal.source_url} target="_blank" rel="noreferrer">Ver fuente TDPI <ExternalLink className="ml-2 h-3.5 w-3.5"/></a></Button><SaveToCaseAction itemType="alert" sourceId={signal.id} title={`Señal TDPI · ${signal.mark_name || signal.application_number || "Marca"}`} contextType="brand" contextQuery={signal.mark_name} suggestedCaseTitle={`Marca ${signal.matched_analysis}`} metadata={{source:"tdpi",source_url:signal.source_url,application_number:signal.application_number,rol_tdpi:signal.rol_tdpi,relevance:signal.relevance,reasons:signal.reasons}}/></div></article>)}</div> : null}
    </div>
  </section>
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(date)
}
