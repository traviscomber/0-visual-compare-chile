import type { ReactNode } from "react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, BriefcaseBusiness, CalendarClock, CheckCircle2, FileText, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PrintBriefButton } from "@/components/cases/print-brief-button"
import { buildDecisionBrief } from "@/lib/cases/brief"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const STATUS_LABELS: Record<string, string> = { open: "Abierto", review: "En revisión", decided: "Decidido", archived: "Archivado" }
const PRIORITY_LABELS: Record<string, string> = { low: "Baja", normal: "Normal", high: "Alta" }
const READINESS_LABELS = { early: "Inicial", developing: "En análisis", "decision-ready": "Listo para decidir", decided: "Decisión registrada" } as const
const TYPE_LABELS: Record<string, string> = { comparison: "Evaluación", search: "Búsqueda", watch: "Vigilancia", alert: "Señal", research: "Investigación" }

function formatDate(value: string | null | undefined) {
  if (!value) return "No registrada"
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

export default async function DecisionBriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) redirect(`/auth/login?redirectTo=${encodeURIComponent(`/casos/${id}/brief`)}`)

  const [caseResult, itemsResult, eventsResult] = await Promise.all([
    supabase.from("cases").select("id,title,status,priority,context_type,context_query,decision_summary,notes,last_reviewed_at,created_at,updated_at").eq("id", id).maybeSingle(),
    supabase.from("case_items").select("id,item_type,title,metadata,created_at").eq("case_id", id).order("created_at", { ascending: false }),
    supabase.from("case_events").select("id,event_type,title,occurred_at").eq("case_id", id).order("occurred_at", { ascending: false }),
  ])

  if (caseResult.error || itemsResult.error || eventsResult.error) throw new Error("No pudimos cargar la evidencia completa del caso para generar el brief.")

  const caseRow = caseResult.data
  const items = itemsResult.data
  const events = eventsResult.data
  if (!caseRow) notFound()

  const brief = buildDecisionBrief({
    caseRow: caseRow as Parameters<typeof buildDecisionBrief>[0]["caseRow"],
    items: items as Parameters<typeof buildDecisionBrief>[0]["items"],
    events: events as Parameters<typeof buildDecisionBrief>[0]["events"],
  })

  const generatedAt = new Date().toISOString()

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9 print:max-w-none print:bg-white print:px-0 print:py-0 print:text-black">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="ghost" size="sm" className="px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"><Link href={`/casos/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Volver al caso</Link></Button>
        <PrintBriefButton />
      </div>

      <article className="border-y border-border py-6 print:border-black/20 print:text-black sm:py-8">
        <header className="border-b border-border pb-6 print:border-black/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary print:text-black">VIDENTIA / Brief de decisión</p>
              <Badge variant="outline" className="rounded-md print:border-black/30 print:text-black"><FileText className="mr-1.5 h-3.5 w-3.5" />{READINESS_LABELS[brief.readiness]}</Badge>
            </div>
            <span className="text-xs text-muted-foreground print:text-neutral-600">Generado {formatDate(generatedAt)}</span>
          </div>
          <h1 className="mt-4 max-w-[20ch] text-[clamp(2.2rem,6vw,3.75rem)] font-light leading-[1.02] tracking-[-0.04em] text-foreground print:text-black">{caseRow.title}</h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-7 text-muted-foreground print:text-neutral-700 sm:text-base">{brief.question}</p>
          <div className="mt-5 grid grid-cols-2 border-t border-border print:border-black/20 sm:grid-cols-4">
            <Meta label="Estado" value={STATUS_LABELS[caseRow.status] ?? caseRow.status} />
            <Meta label="Prioridad" value={PRIORITY_LABELS[caseRow.priority] ?? caseRow.priority} />
            <Meta label="Evidencias" value={String(items.length)} />
            <Meta label="Última revisión" value={caseRow.last_reviewed_at ? formatDate(caseRow.last_reviewed_at) : "Pendiente"} />
          </div>
        </header>

        <section className="grid gap-6 border-b border-border py-6 print:border-black/20 lg:grid-cols-[1.15fr_0.85fr]">
          <div><SectionLabel>Resumen ejecutivo</SectionLabel><p className="mt-2 text-[15px] leading-7 text-foreground print:text-black sm:text-base">{brief.executiveSummary}</p></div>
          <div className="border-l-2 border-primary/35 pl-4 print:border-black/40 sm:pl-5"><SectionLabel>Decisión</SectionLabel><p className="mt-2 text-sm leading-6 text-foreground print:text-black">{brief.decision}</p></div>
        </section>

        <section className="grid gap-7 border-b border-border py-6 print:border-black/20 lg:grid-cols-2">
          <BriefList title="Riesgos y brechas" icon={ShieldCheck} items={brief.risksAndGaps} />
          <BriefList title="Próximos pasos" icon={CheckCircle2} items={brief.nextSteps} />
        </section>

        <section className="border-b border-border py-6 print:border-black/20">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><SectionLabel>Evidencia clave</SectionLabel><h2 className="mt-1.5 text-xl font-light tracking-[-0.02em] text-foreground print:text-black">Qué sostiene esta lectura</h2></div><span className="text-xs text-muted-foreground print:text-neutral-600">{brief.evidence.length} destacada{brief.evidence.length===1?"":"s"}</span></div>
          <div className="mt-4 divide-y divide-border border-y border-border print:divide-black/20 print:border-black/20">
            {brief.evidence.length ? brief.evidence.map((item, index) => (
              <div key={`${item.type}-${item.title}-${index}`} className="grid gap-2 py-3.5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start sm:gap-3">
                <Badge variant="outline" className="w-fit rounded-md print:border-black/30 print:text-black">{TYPE_LABELS[item.type] ?? item.type}</Badge>
                <div className="min-w-0"><p className="text-sm font-medium leading-6 text-foreground print:text-black">{item.title}</p>{item.subtitle && <p className="mt-1 text-xs leading-5 text-muted-foreground print:text-neutral-600">{item.subtitle}</p>}</div>
                <time className="text-xs text-muted-foreground print:text-neutral-600">{formatDate(item.createdAt)}</time>
              </div>
            )) : <p className="py-7 text-sm text-muted-foreground print:text-neutral-600">Este caso todavía no contiene evidencia vinculada.</p>}
          </div>
        </section>

        <section className="grid gap-7 py-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div><SectionLabel>Cambios recientes</SectionLabel><div className="mt-3 divide-y divide-border border-y border-border print:divide-black/20 print:border-black/20">{brief.recentChanges.map((change, index) => <div key={`${change}-${index}`} className="flex gap-3 py-3 text-sm leading-6 text-foreground print:text-black"><CalendarClock className="mt-1 h-4 w-4 shrink-0 text-muted-foreground print:text-neutral-600" /><span>{change}</span></div>)}</div></div>
          <div className="border-l-2 border-border pl-4 print:border-black/30 sm:pl-5"><SectionLabel>Trazabilidad</SectionLabel><p className="mt-2 text-sm leading-6 text-muted-foreground print:text-neutral-700">Este brief se genera exclusivamente desde el caso, su evidencia vinculada y su línea de tiempo auditable. No agrega hechos externos ni sustituye revisión profesional. El expediente original conserva el detalle y la fuente de cada hallazgo.</p><div className="mt-3 flex min-w-0 items-center gap-2 text-xs text-muted-foreground print:text-neutral-600"><BriefcaseBusiness className="h-4 w-4 shrink-0" /><span className="break-all">Caso {caseRow.id}</span></div></div>
        </section>
      </article>
    </main>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 border-b border-r border-border px-3 py-3.5 last:border-r-0 sm:border-b-0 sm:px-4 first:pl-0 print:border-black/20"><p className="text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground print:text-neutral-600">{label}</p><p className="mt-1 break-words text-sm font-medium text-foreground print:text-black">{value}</p></div>
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary print:text-black">{children}</p>
}

function BriefList({ title, icon: Icon, items }: { title: string; icon: typeof ShieldCheck; items: string[] }) {
  return <div><div className="flex items-center gap-2"><Icon className="h-4 w-4 shrink-0 text-primary print:text-black" /><h2 className="text-lg font-semibold text-foreground print:text-black">{title}</h2></div><div className="mt-3 divide-y divide-border border-y border-border print:divide-black/20 print:border-black/20">{items.length?items.map((item, index) => <p key={`${title}-${index}`} className="py-3 text-sm leading-6 text-foreground print:text-black">{item}</p>):<p className="py-3 text-sm text-muted-foreground print:text-neutral-600">Sin elementos registrados.</p>}</div></div>
}
