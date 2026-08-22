"use client"

import { FormEvent, useEffect, useState } from "react"
import { BellRing, Building2, Loader2, Pause, Play, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Watch = { id: string; watch_type: "company" | "ipc"; query: string; is_active: boolean; last_checked_at: string; created_at: string }
type Event = { id: string; watch_id: string; title: string; application_number: string | null; applicants: string | null; ipc_codes: string[]; filing_date: string | null; detected_at: string; read_at: string | null }
type Payload = { watches: Watch[]; events: Event[]; unread: number }

export default function PatentAlertsPage() {
  const [data, setData] = useState<Payload>({ watches: [], events: [], unread: 0 })
  const [type, setType] = useState<"company" | "ipc">("company")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const response = await fetch("/api/patents/alerts", { cache: "no-store" })
    const payload = await response.json().catch(() => ({}))
    if (response.ok) setData(payload as Payload)
    else setError(payload.error || "No pudimos cargar las alertas.")
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  const createWatch = async (event: FormEvent) => {
    event.preventDefault()
    if (query.trim().length < 2 || saving) return
    setSaving(true); setError(null)
    const response = await fetch("/api/patents/alerts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type, query }) })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) setError(payload.error || "No pudimos crear la vigilancia.")
    else { setQuery(""); await load() }
    setSaving(false)
  }

  const toggle = async (watch: Watch) => {
    await fetch("/api/patents/alerts", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: watch.id, active: !watch.is_active }) })
    await load()
  }

  const remove = async (id: string) => {
    await fetch(`/api/patents/alerts?id=${encodeURIComponent(id)}`, { method: "DELETE" })
    await load()
  }

  const markRead = async (event: Event) => {
    if (event.read_at) return
    await fetch("/api/patents/alerts", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ eventId: event.id }) })
    await load()
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300"><BellRing className="h-3.5 w-3.5" /> Competitive Alerts · INAPI</div>
        <h1 className="font-serif text-3xl text-foreground">Vigilancia tecnológica y competitiva</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">Sigue empresas o familias IPC. Después de cada sincronización oficial detectamos nuevas solicitudes y las dejamos en esta bandeja.</p>
      </header>

      <Card>
        <CardHeader><CardTitle className="font-serif text-xl">Nueva vigilancia</CardTitle><CardDescription>No generamos alertas retroactivas del backfill histórico.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={createWatch} className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
            <div className="flex rounded-md border border-border p-1">
              <Button type="button" size="sm" variant={type === "company" ? "secondary" : "ghost"} className="flex-1" onClick={() => setType("company")}><Building2 className="mr-1 h-4 w-4" /> Empresa</Button>
              <Button type="button" size="sm" variant={type === "ipc" ? "secondary" : "ghost"} className="flex-1" onClick={() => setType("ipc")}>IPC</Button>
            </div>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={type === "company" ? "Ej: NESTLE, SYNGENTA, BASF" : "Ej: A61, G06F, C25C"} maxLength={160} />
            <Button disabled={query.trim().length < 2 || saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Vigilar</Button>
          </form>
        </CardContent>
      </Card>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.4fr]">
        <Card>
          <CardHeader><CardTitle className="font-serif text-lg">Vigilancias activas</CardTitle><CardDescription>{data.watches.filter((w) => w.is_active).length} activas de {data.watches.length}</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : data.watches.length === 0 ? <p className="text-sm text-muted-foreground">Aún no tienes vigilancias.</p> : data.watches.map((watch) => (
              <div key={watch.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div><div className="flex items-center gap-2"><Badge variant="outline">{watch.watch_type === "company" ? "Empresa" : "IPC"}</Badge><span className="font-medium">{watch.query}</span></div><p className="mt-1 text-xs text-muted-foreground">Último chequeo {new Date(watch.last_checked_at).toLocaleString("es-CL")}</p></div>
                <div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => toggle(watch)} aria-label={watch.is_active ? "Pausar" : "Activar"}>{watch.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button><Button size="icon" variant="ghost" onClick={() => remove(watch.id)} aria-label="Eliminar"><Trash2 className="h-4 w-4" /></Button></div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-serif text-lg">Nuevas solicitudes <Badge className="ml-2" variant={data.unread ? "default" : "secondary"}>{data.unread} nuevas</Badge></CardTitle><CardDescription>Eventos detectados después de la última sincronización oficial.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : data.events.length === 0 ? <p className="text-sm text-muted-foreground">Todavía no hay nuevas solicitudes que coincidan con tus vigilancias.</p> : data.events.map((event) => (
              <button key={event.id} onClick={() => markRead(event)} className={`w-full rounded-xl border p-4 text-left transition-colors ${event.read_at ? "border-border bg-secondary/10" : "border-amber-500/30 bg-amber-500/5"}`}>
                <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-medium text-foreground">{event.title}</p><p className="mt-1 text-xs text-muted-foreground">{event.applicants || "Solicitante no informado"} · Solicitud {event.application_number || "—"}</p></div>{!event.read_at && <Badge>Nuevo</Badge>}</div>
                <div className="mt-3 flex flex-wrap gap-1.5">{event.ipc_codes.slice(0, 8).map((code) => <Badge key={code} variant="secondary">{code}</Badge>)}</div>
                <p className="mt-3 text-xs text-muted-foreground">Presentación {event.filing_date || "—"} · detectada {new Date(event.detected_at).toLocaleString("es-CL")}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}