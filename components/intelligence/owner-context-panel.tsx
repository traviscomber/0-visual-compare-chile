"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2, CheckCircle2, Clock3, Loader2, ShieldAlert, Tags, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type Candidate = { name: string; applicant: string; application: string }
type OwnerContext = {
  found: boolean
  owner: null | { id?: string; name: string; rut: string | null; identity_confidence: number; identity_status: string }
  portfolio: { total: number; registered: number; pending: number }
  family_sample: Array<{ name: string; status: string | null }>
  top_classes?: Array<{ class: number; count: number }>
  recent_marks?: Array<{ name: string; status: string | null; filed_at: string | null; application: string | null; niza: number[] }>
  portfolio_growth?: Array<{ year: number; count: number }>
  tdpi_events?: Array<{ title: string; summary: string | null; url: string | null; date: string | null; type: string; source: string }>
  warning: string | null
}

export function OwnerContextPanel({ candidates }: { candidates: Candidate[] }) {
  const normalized = useMemo(() => candidates.filter(item => item.application.trim()).slice(0, 3), [candidates])
  const [rows, setRows] = useState<Array<{ candidate: Candidate; context: OwnerContext | null }>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!normalized.length) { setRows([]); return }
    const controller = new AbortController()
    const load = async () => {
      setLoading(true)
      try {
        const result = await Promise.all(normalized.map(async candidate => {
          const response = await fetch(`/api/intelligence/owner?application=${encodeURIComponent(candidate.application)}`, { signal: controller.signal })
          if (!response.ok) return { candidate, context: null }
          const context = await response.json() as OwnerContext
          return { candidate, context }
        }))
        if (!controller.signal.aborted) setRows(result)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [normalized])

  const visible = rows.filter(row => row.context?.found && row.context.owner)
  if (!loading && visible.length === 0) return null

  return <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 text-[#0F766E]"><Building2 className="h-4 w-4"/><p className="text-xs font-semibold uppercase tracking-[0.15em]">Quién está detrás</p></div>
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Perfil estratégico del titular</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">Agrupamos su portafolio para mostrar tamaño, áreas donde concentra protección y movimientos recientes. No inferimos identidad societaria si el RUT aún no está confirmado.</p>
      </div>
      {loading ? <span className="inline-flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-3.5 w-3.5 animate-spin"/>Cargando contexto…</span> : null}
    </div>

    {visible.length ? <div className="mt-5 divide-y divide-slate-200 border-t border-slate-200">{visible.map(({ candidate, context }) => {
      if (!context?.owner) return null
      const verified = context.owner.identity_status === "res_verified" && Boolean(context.owner.rut)
      const topClasses = context.top_classes ?? []
      const recentMarks = context.recent_marks ?? []
      const growth = context.portfolio_growth ?? []
      const lastGrowth = growth.at(-1)
      return <article key={candidate.application} className="py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-950">{context.owner.name}</p>
              {verified ? <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700"><CheckCircle2 className="mr-1 h-3.5 w-3.5"/>Identidad verificada</Badge> : <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700"><ShieldAlert className="mr-1 h-3.5 w-3.5"/>Identidad por confirmar</Badge>}
            </div>
            <p className="mt-1 text-sm text-slate-500">Antecedente: {candidate.name}{context.owner.rut ? ` · RUT ${context.owner.rut}` : ""}</p>
            {context.warning ? <p className="mt-2 max-w-2xl text-xs leading-5 text-amber-700">{context.warning}</p> : null}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center md:min-w-72"><Metric label="Marcas" value={context.portfolio.total}/><Metric label="Registradas" value={context.portfolio.registered}/><Metric label="Pendientes" value={context.portfolio.pending}/></div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2"><Tags className="h-4 w-4 text-teal-700"/><p className="text-sm font-semibold text-slate-900">Dónde concentra protección</p></div>
            {topClasses.length ? <div className="mt-3 flex flex-wrap gap-2">{topClasses.slice(0, 8).map(item => <Badge key={item.class} variant="outline" className="bg-slate-50">Niza {item.class} · {item.count}</Badge>)}</div> : <p className="mt-3 text-sm text-slate-500">Aún no tenemos clases suficientes para mostrar una concentración.</p>}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-teal-700"/><p className="text-sm font-semibold text-slate-900">Movimiento del portafolio</p></div>
            {lastGrowth ? <p className="mt-3 text-sm text-slate-600">En {lastGrowth.year} registramos {lastGrowth.count} presentación{lastGrowth.count === 1 ? "" : "es"} vinculada{lastGrowth.count === 1 ? "" : "s"} a este titular.</p> : <p className="mt-3 text-sm text-slate-500">Las fechas históricas disponibles todavía no permiten mostrar una tendencia anual confiable.</p>}
          </div>
        </div>

        {recentMarks.length ? <div className="mt-5">
          <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-slate-400"/><p className="text-sm font-semibold text-slate-800">Marcas relacionadas</p></div>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {recentMarks.slice(0, 5).map((item, index) => <div key={`${candidate.application}-${item.application ?? item.name}-${index}`} className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-900">{item.name}</p><p className="mt-0.5 text-xs text-slate-500">{item.application ? `Solicitud ${item.application}` : "Solicitud no informada"}{item.status ? ` · ${item.status}` : ""}</p></div>
              {item.niza?.length ? <div className="flex flex-wrap gap-1">{item.niza.slice(0, 5).map(code => <Badge key={`${item.application}-${code}`} variant="secondary" className="text-[11px]">Niza {code}</Badge>)}</div> : null}
            </div>)}
          </div>
        </div> : context.family_sample?.length ? <div className="mt-4 flex flex-wrap items-center gap-2"><Tags className="h-3.5 w-3.5 text-slate-400"/>{context.family_sample.slice(0, 5).map(item => <Badge key={`${candidate.application}-${item.name}`} variant="outline" className="bg-white text-slate-600">{item.name}</Badge>)}</div> : null}
      </article>
    })}</div> : null}
  </section>
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-slate-200 bg-white px-3 py-2"><p className="text-lg font-semibold text-slate-950">{value}</p><p className="mt-0.5 text-[11px] text-slate-500">{label}</p></div>
}
