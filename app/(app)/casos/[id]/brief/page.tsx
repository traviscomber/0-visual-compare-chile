import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, BriefcaseBusiness, CalendarClock, CheckCircle2, FileText, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PrintBriefButton } from "@/components/cases/print-brief-button"
import { buildDecisionBrief } from "@/lib/cases/brief"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const STATUS_LABELS: Record<string, string> = { open: "Abierto", review: "En revisión", decided: "Decidido", archived: "Archivado" }
const PRIORITY_LABELS: Record<string, string> = { low: "Baja", normal: "Normal", high: "Alta" }
const READINESS_LABELS = { early: "Temprano", developing: "En desarrollo", "decision-ready": "Listo para decidir", decided: "Decisión registrada" } as const
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

  const [{ data: caseRow }, { data: items }, { data: events }] = await Promise.all([
    supabase.from("cases").select("id,title,status,priority,context_type,context_query,decision_summary,notes,last_reviewed_at,created_at,updated_at").eq("id", id).single(),
    supabase.from("case_items").select("id,item_type,title,metadata,created_at").eq("case_id", id).order("created_at", { ascending: false }),
    supabase.from("case_events").select("id,event_type,title,occurred_at").eq("case_id", id).order("occurred_at", { ascending: false }),
  ])

  if (!caseRow) notFound()

  const brief = buildDecisionBrief({
    caseRow: caseRow as Parameters<typeof buildDecisionBrief>[0]["caseRow"],
    items: (items ?? []) as Parameters<typeof buildDecisionBrief>[0]["items"],
    events: (events ?? []) as Parameters<typeof buildDecisionBrief>[0]["events"],
  })

  const generatedAt = new Date().toISOString()

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-12 print:max-w-none print:px-0 print:py-0">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="ghost" size="sm"><Link href={`/casos/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Volver al caso</Link></Button>
        <PrintBriefButton />
      </div>

      <article className="rounded-3xl border border-border bg-background p-6 shadow-sm sm:p-10 print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="border-b border-border pb-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline"><FileText className="mr-1.5 h-3.5 w-3.5" />Decision Brief</Badge>
              <Badge variant="secondary">{READINESS_LABELS[brief.readiness]}</Badge>
            </div>
            <span className="text-xs text-muted-foreground">Generado {formatDate(generatedAt)}</span>
          </div>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">{caseRow.title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">{brief.question}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <Meta label="Estado" value={STATUS_LABELS[caseRow.status] ?? caseRow.status} />
            <Meta label="Prioridad" value={PRIORITY_LABELS[caseRow.priority] ?? caseRow.priority} />
            <Meta label="Evidencias" value={String((items ?? []).length)} />
            <Meta label="Última revisión" value={caseRow.last_reviewed_at ? formatDate(caseRow.last_reviewed_at) : "Pendiente"} />
          </div>
        </header>

        <section className="grid gap-6 border-b border-border py-7 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <SectionLabel>Resumen ejecutivo</SectionLabel>
            <p className="mt-3 text-base leading-7 text-foreground">{brief.executiveSummary}</p>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/20 p-5">
            <SectionLabel>Decisión</SectionLabel>
            <p className="mt-3 text-sm leading-6 text-foreground">{brief.decision}</p>
          </div>
        </section>

        <section className="grid gap-6 border-b border-border py-7 lg:grid-cols-2">
          <BriefList title="Riesgos y brechas" icon={ShieldCheck} items={brief.risksAndGaps} />
          <BriefList title="Próximos pasos" icon={CheckCircle2} items={brief.nextSteps} />
        </section>

        <section className="border-b border-border py-7">
          <div className="flex items-center justify-between gap-3">
            <div><SectionLabel>Evidencia clave</SectionLabel><h2 className="mt-2 text-xl font-semibold">Qué sostiene esta lectura</h2></div>
            <Badge variant="outline">{brief.evidence.length} destacadas</Badge>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {brief.evidence.length ? brief.evidence.map((item, index) => (
              <div key={`${item.type}-${item.title}-${index}`} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-3"><Badge variant="secondary">{TYPE_LABELS[item.type] ?? item.type}</Badge><time className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</time></div>
                <p className="mt-3 text-sm font-medium leading-6 text-foreground">{item.title}</p>
                {item.subtitle && <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.subtitle}</p>}
              </div>
            )) : <p className="text-sm text-muted-foreground">Este caso todavía no contiene evidencia vinculada.</p>}
          </div>
        </section>

        <section className="grid gap-6 py-7 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionLabel>Cambios recientes</SectionLabel>
            <div className="mt-4 space-y-3">{brief.recentChanges.map((change, index) => <div key={`${change}-${index}`} className="flex gap-3 text-sm leading-6"><CalendarClock className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" /><span>{change}</span></div>)}</div>
          </div>
          <div className="rounded-2xl border border-border p-5">
            <SectionLabel>Trazabilidad</SectionLabel>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Este brief se genera exclusivamente desde el caso, su evidencia vinculada y su línea de tiempo auditable. No agrega hechos externos ni sustituye revisión profesional. El expediente original conserva el detalle completo y la fuente de cada hallazgo.</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><BriefcaseBusiness className="h-4 w-4" />Caso {caseRow.id}</div>
          </div>
        </section>
      </article>
    </main>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-secondary/10 p-3"><p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium text-foreground">{value}</p></div>
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{children}</p>
}

function BriefList({ title, icon: Icon, items }: { title: string; icon: typeof ShieldCheck; items: string[] }) {
  return <Card className="shadow-none"><CardHeader className="pb-3"><div className="flex items-center gap-2"><Icon className="h-4 w-4" /><CardTitle className="text-lg">{title}</CardTitle></div></CardHeader><CardContent><ul className="space-y-3">{items.map((item, index) => <li key={`${title}-${index}`} className="text-sm leading-6 text-foreground">{item}</li>)}</ul></CardContent></Card>
}
