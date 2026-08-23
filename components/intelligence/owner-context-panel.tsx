"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2, CheckCircle2, Loader2, ShieldAlert, Tags } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type Candidate = { name: string; applicant: string; application: string }
type OwnerContext = {
  found: boolean
  owner: null | { name: string; rut: string | null; identity_confidence: number; identity_status: string }
  portfolio: { total: number; registered: number; pending: number }
  family_sample: Array<{ name: string; status: string | null }>
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
      <div className="max-w-2xl"><div className="flex items-center gap-2 text-[#0F766E]"><Building2 className="h-4 w-4"/><p className="text-xs font-semibold uppercase tracking-[0.15em]">Quién está detrás</p></div><h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Contexto del titular y su familia marcaria</h3><p className="mt-2 text-sm leading-6 text-slate-600">Agrupamos los antecedentes del mismo solicitante para mostrar si el resultado forma parte de una estrategia marcaria más amplia.</p></div>
      {loading ? <span className="inline-flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-3.5 w-3.5 animate-spin"/>Cargando contexto…</span> : null}
    </div>
    {visible.length ? <div className="mt-5 divide-y divide-slate-200 border-t border-slate-200">{visible.map(({ candidate, context }) => {
      if (!context?.owner) return null
      const verified = context.owner.identity_status === "res_verified" && Boolean(context.owner.rut)
      return <article key={candidate.application} className="py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-950">{context.owner.name}</p>{verified ? <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700"><CheckCircle2 className="mr-1 h-3.5 w-3.5"/>Identidad verificada</Badge> : <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700"><ShieldAlert className="mr-1 h-3.5 w-3.5"/>Identidad por confirmar</Badge>}</div><p className="mt-1 text-sm text-slate-500">Antecedente: {candidate.name}{context.owner.rut ? ` · RUT ${context.owner.rut}` : ""}</p>{context.warning ? <p className="mt-2 max-w-2xl text-xs leading-5 text-amber-700">{context.warning}</p> : null}</div>
          <div className="grid grid-cols-3 gap-2 text-center md:min-w-72"><Metric label="Marcas" value={context.portfolio.total}/><Metric label="Registradas" value={context.portfolio.registered}/><Metric label="Pendientes" value={context.portfolio.pending}/></div>
        </div>
        {context.family_sample?.length ? <div className="mt-4 flex flex-wrap items-center gap-2"><Tags className="h-3.5 w-3.5 text-slate-400"/>{context.family_sample.slice(0, 5).map(item => <Badge key={`${candidate.application}-${item.name}`} variant="outline" className="bg-white text-slate-600">{item.name}</Badge>)}</div> : null}
      </article>
    })}</div> : null}
  </section>
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-slate-200 bg-white px-3 py-2"><p className="text-lg font-semibold text-slate-950">{value}</p><p className="mt-0.5 text-[11px] text-slate-500">{label}</p></div>
}
