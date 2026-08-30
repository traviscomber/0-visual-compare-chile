"use client"

import Link from "next/link"
import { FormEvent, useEffect, useState } from "react"
import { ArrowLeft, Building2, Factory, FlaskConical, Loader2, Plus } from "lucide-react"
import { OperationalHeader, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type WatchType = "technology" | "company" | "competitor"

export default function NewStrategicWatchPage() {
  const [type, setType] = useState<WatchType>("technology")
  const [query, setQuery] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requestedType = params.get("type")
    const requestedQuery = params.get("q")?.trim() ?? ""
    if (requestedType === "company" || requestedType === "competitor" || requestedType === "technology") setType(requestedType)
    if (requestedQuery) setQuery(requestedQuery.slice(0, 160))
  }, [])

  async function createWatch(event: FormEvent) {
    event.preventDefault()
    const normalized = query.trim()
    if (normalized.length < 2 || saving) return
    setSaving(true)
    setError(null)
    try {
      const response = await fetch("/api/intelligence/strategic-watchlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, query: normalized }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos crear la vigilancia.")
      window.location.assign("/monitorear/estrategico")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos crear la vigilancia.")
      setSaving(false)
    }
  }

  return <OperationalPage>
    <OperationalHeader
      eyebrow="VIDENTIA / Vigilancia estratégica"
      title="Confirma qué quieres vigilar."
      description="El contexto llega prellenado desde el análisis anterior, pero VIDENTIA no crea una vigilancia por navegación. Revisa el tipo y la consulta antes de guardar."
      meta={<><span>Acción explícita</span><span>Línea base inicial</span><span>Evidencia trazable</span></>}
      actions={<Button asChild variant="outline"><Link href="/monitorear/estrategico"><ArrowLeft className="h-4 w-4" />Volver a vigilancia</Link></Button>}
    />

    <section className="py-9">
      <OperationalPanel>
        <form onSubmit={createWatch}>
          <OperationalSectionHeader eyebrow="Nueva vigilancia" title="Contexto a seguir" />
          <div className="mt-5 grid grid-cols-3 rounded-[10px] bg-[#0F2A33] p-1">
            <TypeButton active={type === "technology"} icon={FlaskConical} label="Tecnología" onClick={() => setType("technology")} />
            <TypeButton active={type === "company"} icon={Building2} label="Empresa" onClick={() => setType("company")} />
            <TypeButton active={type === "competitor"} icon={Factory} label="Competidor" onClick={() => setType("competitor")} />
          </div>
          <Input className="mt-4" value={query} onChange={event => setQuery(event.target.value)} maxLength={160} placeholder={type === "technology" ? "Ej: almacenamiento de energía con sodio" : type === "company" ? "Ej: SQM" : "Ej: competidor o actor a seguir"} aria-label="Consulta a vigilar" />
          <p className="mt-3 text-xs leading-5 text-muted-foreground">La primera ejecución establece una línea base. Sólo evidencia observada después de esa línea base se presenta como cambio nuevo.</p>
          {error ? <div role="alert" className="mt-4 rounded-[10px] bg-[#3A2525] p-4 text-sm text-[#E8AAA3]">{error}</div> : null}
          <div className="mt-6 flex justify-end">
            <Button disabled={query.trim().length < 2 || saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{saving ? "Guardando" : "Crear vigilancia"}</Button>
          </div>
        </form>
      </OperationalPanel>
    </section>
  </OperationalPage>
}

function TypeButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof FlaskConical; label: string; onClick: () => void }) {
  return <Button type="button" size="sm" variant={active ? "secondary" : "ghost"} className="min-w-0 px-2" onClick={onClick}><Icon className="h-4 w-4" /><span className="truncate">{label}</span></Button>
}
