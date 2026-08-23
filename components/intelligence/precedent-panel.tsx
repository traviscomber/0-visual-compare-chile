"use client"

import { useEffect, useMemo, useState } from "react"
import { BookOpen, ExternalLink, Loader2, Scale } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Precedent = {
  decision_entity_id: string
  requested_mark: string
  rol_tdpi: string
  decision_date: string | null
  procedure_type: string
  outcome: string
  niza_classes: number[]
  key_holding: string
  source_document_url: string
  text_similarity: number
  class_overlap: number
}

const OUTCOME_LABEL: Record<string, string> = {
  confirmed_rejection: "Rechazo confirmado",
  revoked_rejection: "Rechazo revocado",
  opposition_rejected: "Oposición rechazada",
  opposition_upheld: "Oposición acogida",
  registration_cancelled: "Registro cancelado",
  registration_upheld: "Registro mantenido",
  other: "Otro resultado",
}

export function PrecedentPanel({ mark, niza }: { mark: string; niza: number[] }) {
  const [items, setItems] = useState<Precedent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nizaKey = useMemo(() => [...new Set(niza)].sort((a, b) => a - b).join(","), [niza])

  useEffect(() => {
    if (!mark.trim()) return
    const controller = new AbortController()
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ q: mark.trim() })
        if (nizaKey) params.set("niza", nizaKey)
        const response = await fetch(`/api/intelligence/precedents?${params.toString()}`, { signal: controller.signal })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload.error ?? "No pudimos consultar precedentes.")
        setItems(Array.isArray(payload.precedents) ? payload.precedents : [])
      } catch (cause) {
        if (controller.signal.aborted) return
        setError(cause instanceof Error ? cause.message : "No pudimos consultar precedentes.")
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [mark, nizaKey])

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-[#0F766E]"><Scale className="h-4 w-4"/><p className="text-xs font-semibold uppercase tracking-[0.15em]">Precedentes comparables</p></div>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Qué ha considerado relevante el TDPI en casos parecidos</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Comparamos la denominación y las clases con jurisprudencia estructurada. Los fallos son evidencia de contexto, no una predicción del resultado de tu caso.</p>
        </div>
        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">Fuente oficial TDPI</Badge>
      </div>

      {loading ? <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-5 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin"/>Buscando precedentes…</div> : null}
      {error ? <p className="mt-5 border-t border-slate-100 pt-5 text-sm text-slate-500">{error}</p> : null}
      {!loading && !error && items.length === 0 ? <div className="mt-5 border-t border-slate-100 pt-5"><p className="text-sm font-medium text-slate-800">Todavía no hay un precedente comparable en el corpus estructurado.</p><p className="mt-1 text-sm text-slate-500">Seguimos mostrando la evaluación registral normal; la ausencia de precedentes no se interpreta como una señal jurídica.</p></div> : null}

      {items.length > 0 ? <div className="mt-5 divide-y divide-slate-100 border-t border-slate-100">{items.slice(0, 4).map(item => (
        <article key={item.decision_entity_id} className="py-5 first:pt-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><BookOpen className="h-4 w-4 text-slate-400"/><p className="font-semibold text-slate-950">{item.requested_mark}</p><Badge variant="outline">TDPI {item.rol_tdpi}</Badge><Badge variant="secondary">{OUTCOME_LABEL[item.outcome] ?? "Resultado registrado"}</Badge></div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.key_holding}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">{item.niza_classes?.length ? <span>Clases: {item.niza_classes.join(", ")}</span> : null}{item.class_overlap > 0 ? <span>{item.class_overlap} clase{item.class_overlap === 1 ? "" : "s"} coincidente{item.class_overlap === 1 ? "" : "s"}</span> : null}{item.decision_date ? <span>{new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(new Date(`${item.decision_date}T12:00:00Z`))}</span> : null}</div>
            </div>
            <Button asChild size="sm" variant="outline" className="shrink-0"><a href={item.source_document_url} target="_blank" rel="noreferrer">Ver fuente <ExternalLink className="ml-2 h-3.5 w-3.5"/></a></Button>
          </div>
        </article>
      ))}</div> : null}
    </section>
  )
}
