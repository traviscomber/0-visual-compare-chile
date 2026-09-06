"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, ExternalLink, Lightbulb, Loader2, Plus, Save, Sparkles } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Button } from "@/components/ui/button"

type Organization = { id: string; name: string; slug: string; role: string }
type EvidenceType = "news" | "data" | "paper" | "patent" | "market" | "regulation" | "other"
type EvidenceRow = {
  id: string
  evidence_type: EvidenceType
  title: string
  source_url: string | null
  note: string | null
  observed_at: string | null
  created_at: string
}
type EvidenceSuggestion = {
  type: EvidenceType
  title: string
  why: string
  example: string
}

const typeLabels: Record<EvidenceType, string> = {
  news: "Noticia",
  data: "Dato",
  paper: "Paper",
  patent: "Patente",
  market: "Mercado",
  regulation: "Regulación",
  other: "Otro",
}

export default function OpportunityEvidencePage() {
  const [ideaKey, setIdeaKey] = useState("")
  const [ideaTitle, setIdeaTitle] = useState("Idea")
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [organizationId, setOrganizationId] = useState("")
  const [items, setItems] = useState<EvidenceRow[]>([])
  const [evidenceType, setEvidenceType] = useState<EvidenceType>("data")
  const [typeTouched, setTypeTouched] = useState(false)
  const [title, setTitle] = useState("")
  const [sourceUrl, setSourceUrl] = useState("")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setIdeaKey(params.get("ideaKey")?.trim() || "")
    setIdeaTitle(params.get("ideaTitle")?.trim() || "Idea")
    void loadOrganizations()
  }, [])
  useEffect(() => { if (organizationId && ideaKey) void loadEvidence(organizationId) }, [organizationId, ideaKey])

  async function loadOrganizations() {
    try {
      const response = await fetch("/api/intelligence/portfolio-binding", { cache: "no-store" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos cargar tu organización.")
      const next = (payload.organizations ?? []) as Organization[]
      setOrganizations(next)
      setOrganizationId(next[0]?.id ?? "")
      if (!next.length) setLoading(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos cargar tu organización.")
      setLoading(false)
    }
  }

  async function loadEvidence(nextOrganizationId: string) {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/intelligence/idea-evidence?organizationId=${encodeURIComponent(nextOrganizationId)}&ideaKey=${encodeURIComponent(ideaKey)}`, { cache: "no-store" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos cargar la evidencia.")
      setItems((payload.evidence ?? []) as EvidenceRow[])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos cargar la evidencia.")
    } finally {
      setLoading(false)
    }
  }

  async function saveEvidence() {
    if (!organizationId || !ideaKey || title.trim().length < 2 || saving) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch("/api/intelligence/idea-evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          ideaKey,
          ideaTitle,
          evidenceType,
          title: title.trim(),
          sourceUrl: sourceUrl.trim() || null,
          note: note.trim() || null,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos guardar este dato.")
      setTitle("")
      setSourceUrl("")
      setNote("")
      setTypeTouched(false)
      setMessage(payload.duplicate ? "Ese enlace ya estaba guardado." : "Dato agregado. VIDENTIA recalculó qué conviene buscar después y seguirá investigando en paralelo.")
      await loadEvidence(organizationId)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar este dato.")
    } finally {
      setSaving(false)
    }
  }

  const byType = useMemo(() => items.reduce<Record<string, number>>((acc, item) => {
    acc[item.evidence_type] = (acc[item.evidence_type] ?? 0) + 1
    return acc
  }, {}), [items])
  const suggestions = useMemo(() => recommendNextEvidence(ideaKey, ideaTitle, byType), [ideaKey, ideaTitle, byType])
  const primarySuggestion = suggestions[0]

  useEffect(() => {
    if (!typeTouched && primarySuggestion) setEvidenceType(primarySuggestion.type)
  }, [primarySuggestion, typeTouched])

  function chooseSuggestion(suggestion: EvidenceSuggestion) {
    setEvidenceType(suggestion.type)
    setTypeTouched(true)
    setTitle("")
    setNote(suggestion.example)
    document.getElementById("evidence-title")?.focus()
  }

  return <OperationalPage>
    <OperationalHeader
      eyebrow="VIDENTIA / Ideas / Evidencia"
      title="Primero agrega el dato que más ayude a decidir."
      description={<>VIDENTIA te recomienda qué falta para evaluar <span className="text-white">{ideaTitle}</span>. Puedes seguir la recomendación o agregar cualquier noticia, dato, paper, patente o señal que consideres relevante.</>}
      actions={<Button asChild variant="outline"><Link href="/dashboard"><ArrowLeft className="h-4 w-4" /> Volver</Link></Button>}
    />

    <OperationalMetricRail>
      <OperationalMetric value={items.length} label="Datos agregados" detail="Contexto humano persistido" tone={items.length ? "success" : "neutral"} />
      <OperationalMetric value={byType.news ?? 0} label="Noticias" detail="Señales para revisar" />
      <OperationalMetric value={(byType.paper ?? 0) + (byType.patent ?? 0)} label="Papers + patentes" detail="Evidencia tecnológica" />
      <OperationalMetric value={(byType.data ?? 0) + (byType.market ?? 0) + (byType.regulation ?? 0)} label="Datos de decisión" detail="Problema, mercado y regulación" />
    </OperationalMetricRail>

    <section className="border-b border-border/80 py-8">
      <OperationalSectionHeader eyebrow="01 / Recomendado ahora" title="¿Qué dato nos ayudaría más?" meta="VIDENTIA prioriza el vacío más importante" />
      {!ideaKey ? <div className="mt-5 border-y border-[#7A5B41]/45 bg-[#332C24]/35 px-4 py-4 text-sm text-[#D6C3A8]">Abre esta pantalla desde una idea para recibir una recomendación específica.</div> : null}
      {ideaKey && primarySuggestion ? <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
        <div className="border-y border-[#96B5A6]/35 bg-[#173B37]/25 px-4 py-5 sm:px-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#173B37] text-[#96B5A6]"><Lightbulb className="h-4 w-4" /></span>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#96B5A6]">Mejor siguiente dato · {typeLabels[primarySuggestion.type]}</p>
              <h2 className="mt-2 text-lg font-light text-[#E7DFCE]">{primarySuggestion.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#B8C4C1]">{primarySuggestion.why}</p>
              <p className="mt-3 text-xs leading-5 text-muted-foreground"><span className="text-foreground">Ejemplo:</span> {primarySuggestion.example}</p>
              <Button type="button" size="sm" className="mt-4" onClick={() => chooseSuggestion(primarySuggestion)}>Agregar este dato <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
        <div className="divide-y divide-border/70 border-y border-border/80">
          {suggestions.slice(1, 3).map(suggestion => <button key={`${suggestion.type}:${suggestion.title}`} type="button" onClick={() => chooseSuggestion(suggestion)} className="block w-full px-4 py-4 text-left transition-colors hover:bg-card/30">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">También sirve · {typeLabels[suggestion.type]}</p>
            <p className="mt-1 text-sm leading-5 text-white">{suggestion.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{suggestion.why}</p>
          </button>)}
        </div>
      </div> : null}
    </section>

    <section className="grid gap-8 border-b border-border/80 py-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)] xl:gap-10">
      <div>
        <OperationalSectionHeader eyebrow="02 / Agregar" title="Pega el dato o escribe lo que sabes." meta="menos de 1 minuto" />
        <div className="mt-5 space-y-4 border-y border-border/80 py-5">
          {organizations.length > 1 ? <label className="block"><span className="mb-2 block text-xs text-muted-foreground">Organización</span><select value={organizationId} onChange={event => setOrganizationId(event.target.value)} className="h-11 w-full rounded-[10px] border border-border bg-card/40 px-3 text-sm text-foreground outline-none"><option value="">Selecciona</option>{organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label> : null}
          <label className="block"><span className="mb-2 block text-xs text-muted-foreground">Tipo</span><select value={evidenceType} onChange={event => { setEvidenceType(event.target.value as EvidenceType); setTypeTouched(true) }} className="h-11 w-full rounded-[10px] border border-border bg-card/40 px-3 text-sm text-foreground outline-none">{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="block"><span className="mb-2 block text-xs text-muted-foreground">Título o dato</span><input id="evidence-title" value={title} onChange={event => setTitle(event.target.value)} maxLength={300} placeholder={primarySuggestion?.title || "Escribe el dato principal"} className="h-11 w-full rounded-[10px] border border-border bg-card/40 px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground" /></label>
          <label className="block"><span className="mb-2 block text-xs text-muted-foreground">Enlace (opcional)</span><input value={sourceUrl} onChange={event => setSourceUrl(event.target.value)} maxLength={1200} placeholder="https://…" className="h-11 w-full rounded-[10px] border border-border bg-card/40 px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground" /></label>
          <label className="block"><span className="mb-2 block text-xs text-muted-foreground">Por qué importa (opcional)</span><textarea value={note} onChange={event => setNote(event.target.value)} rows={3} maxLength={3000} placeholder="Una frase es suficiente." className="w-full rounded-[10px] border border-border bg-card/40 px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground" /></label>
          {error ? <p className="text-sm text-[#E0B987]">{error}</p> : null}
          {message ? <p className="text-sm text-[#96B5A6]">{message}</p> : null}
          <Button type="button" disabled={!ideaKey || title.trim().length < 2 || saving} onClick={() => void saveEvidence()}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? "Guardando…" : "Agregar evidencia"}</Button>
        </div>
      </div>

      <aside>
        <OperationalSectionHeader eyebrow="03 / Evidencia guardada" title="Lo que ya agregaste" meta={`${items.length} elementos`} />
        {loading ? <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Cargando…</div> : null}
        {!loading && !items.length ? <div className="mt-5 border-y border-border/80 py-6"><Plus className="h-5 w-5 text-muted-foreground" /><p className="mt-3 text-sm text-white">Todavía no agregaste evidencia manual.</p><p className="mt-1 text-xs leading-5 text-muted-foreground">VIDENTIA seguirá buscando automáticamente en paralelo.</p></div> : null}
        {items.length ? <div className="mt-5 divide-y divide-border/80 border-y border-border/80">{items.slice(0, 12).map(item => <div key={item.id} className="py-4"><div className="flex items-center justify-between gap-3"><span className="text-[10px] uppercase tracking-[0.12em] text-[#96B5A6]">{typeLabels[item.evidence_type]}</span><span className="text-[10px] text-muted-foreground">{formatDate(item.created_at)}</span></div><p className="mt-2 text-sm leading-6 text-white">{item.title}</p>{item.note ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.note}</p> : null}{item.source_url ? <a href={item.source_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-[#96B5A6] hover:text-white">Abrir fuente <ExternalLink className="h-3 w-3" /></a> : null}</div>)}</div> : null}
        <div className="mt-5 flex items-start gap-3 border-t border-border/80 pt-4"><Sparkles className="mt-0.5 h-4 w-4 text-[#96B5A6]" /><p className="text-xs leading-5 text-muted-foreground">La guía prioriza evidencia que VIDENTIA no puede inferir bien sola. Papers, patentes y noticias siguen buscándose automáticamente; tus datos ayudan especialmente a comprobar problema, mercado y contexto real.</p></div>
      </aside>
    </section>
  </OperationalPage>
}

function recommendNextEvidence(ideaKey: string, ideaTitle: string, counts: Record<string, number>): EvidenceSuggestion[] {
  const key = `${ideaKey} ${ideaTitle}`.toLowerCase()
  const has = (type: EvidenceType) => (counts[type] ?? 0) > 0
  const suggestions: EvidenceSuggestion[] = []

  const push = (suggestion: EvidenceSuggestion) => {
    if (!suggestions.some(item => item.type === suggestion.type && item.title === suggestion.title)) suggestions.push(suggestion)
  }

  if (key.includes("environment") || key.includes("ambient") || key.includes("compliance")) {
    if (!has("regulation")) push({
      type: "regulation",
      title: "Una obligación o cambio regulatorio que genere trabajo real",
      why: "Esto permite comprobar que existe un gatillo concreto y no sólo una posibilidad tecnológica.",
      example: "Ej. Nueva exigencia, fiscalización o permiso que obliga a una empresa a revisar evidencia, reportar o actuar.",
    })
  }

  if (!has("data")) {
    const operational = key.includes("physical") || key.includes("industrial") || key.includes("operations")
    push({
      type: "data",
      title: operational ? "Un dato real del proceso que hoy cuesta tiempo, dinero o genera errores" : "Un dato real que demuestre el problema",
      why: "La evidencia propia del problema suele reducir más incertidumbre que sumar otra noticia o paper.",
      example: operational
        ? "Ej. frecuencia de fallas, horas manuales, cantidad de revisiones, costo de una detención o tasa de error actual."
        : "Ej. cuántas veces ocurre, quién lo sufre, cuánto demora hoy o qué costo tiene resolverlo manualmente.",
    })
  }

  if (!has("market")) push({
    type: "market",
    title: "Una empresa, usuario o comprador que tenga este problema hoy",
    why: "Ayuda a comprobar que existe alguien concreto para quien resolverlo tendría valor.",
    example: "Ej. empresa afectada, presupuesto, proceso de compra, alternativa actual o evidencia de que ya paga por resolver algo parecido.",
  })

  if (!has("news")) push({
    type: "news",
    title: "Una noticia reciente que muestre movimiento real en esta dirección",
    why: "Sirve para validar timing cuando muestra inversión, adopción, regulación, lanzamiento o cambio competitivo concreto.",
    example: "Ej. empresa que lanzó una solución, levantó capital, incorporó la tecnología o cambió su proceso por este problema.",
  })

  if (!has("paper")) push({
    type: "paper",
    title: "Un paper que confirme que la capacidad técnica es plausible",
    why: "Úsalo cuando tengas una publicación especialmente relevante que VIDENTIA todavía no haya encontrado.",
    example: "Ej. estudio con resultados medibles sobre agentes, visión, mantenimiento predictivo o automatización del dominio.",
  })

  if (!has("patent")) push({
    type: "patent",
    title: "Una patente que muestre actividad tecnológica cercana",
    why: "Ayuda a entender frontera técnica y posibles espacios de diferenciación, pero no prueba demanda por sí sola.",
    example: "Ej. patente de un actor relevante con una solución cercana al problema que estamos investigando.",
  })

  if (suggestions.length < 3) push({
    type: "other",
    title: "Una conversación, observación o hecho que cambie tu opinión sobre la idea",
    why: "También sirve evidencia cualitativa si explica claramente qué observaste y por qué importa.",
    example: "Ej. comentario de un cliente, experto u operador que confirme o contradiga una hipótesis importante.",
  })

  return suggestions.slice(0, 4)
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(date)
}
