import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, CheckCircle2, Clock3, Gauge, Hourglass, ShieldAlert, TimerReset, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buildPortfolioAnalytics, formatDuration, formatRate, type PortfolioCase, type PortfolioEvent, type PortfolioReview } from "@/lib/cases/portfolio-analytics"
import { createClient } from "@/lib/supabase/server"

export const dynamic="force-dynamic"

export default async function PortfolioAnalyticsPage(){
  const supabase=await createClient()
  const {data:auth}=await supabase.auth.getUser()
  if(!auth.user)redirect("/auth/login?redirectTo=%2Fportfolio%2Fanalytics")

  const {data:caseData,error:caseError}=await supabase.from("cases").select("id,title,status,created_at,updated_at").order("created_at",{ascending:true}).limit(500)
  if(caseError)throw new Error("No pudimos cargar las métricas del portafolio.")
  const cases=(caseData??[]) as PortfolioCase[]
  const caseIds=cases.map(c=>c.id)
  const [{data:reviewData},{data:eventData}]=caseIds.length?await Promise.all([
    supabase.from("case_review_requests").select("id,case_id,status,created_at,responded_at,deadline_at,governance_round_id").in("case_id",caseIds).order("created_at",{ascending:true}),
    supabase.from("case_events").select("case_id,event_type,payload,occurred_at").in("case_id",caseIds).order("occurred_at",{ascending:true}),
  ]):[{data:[]},{data:[]}]
  const reviews=(reviewData??[]) as PortfolioReview[]
  const events=(eventData??[]) as PortfolioEvent[]
  const analytics=buildPortfolioAnalytics({cases,reviews,events})
  const h=analytics.historical
  const live=analytics.live

  return <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
    <div className="mb-6"><Button asChild variant="ghost" size="sm"><Link href="/portfolio"><ArrowLeft className="mr-2 h-4 w-4"/>Volver al portafolio</Link></Button></div>
    <section className="grid gap-7 border-b border-border pb-9 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
      <div><Badge variant="secondary">Phase 17 · Portfolio Analytics & SLA</Badge><h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.035em] sm:text-5xl lg:text-6xl">Mide cuánto tarda una decisión y dónde se pierde el tiempo.</h1><p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">Las métricas se calculan desde timestamps reales de casos, revisiones y audit trail. Cuando aún no existe muestra suficiente, Visual Compare lo indica explícitamente.</p></div>
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-secondary/20 p-3"><Metric value={String(live.pendingReviews)} label="Revisiones pendientes"/><Metric value={String(live.overdueReviews)} label="Revisiones vencidas"/><Metric value={formatDuration(live.medianWaitingHours)} label="Espera mediana actual"/><Metric value={String(h.decisionsLast30Days)} label="Decisiones · 30 días"/></div>
    </section>

    <section className="py-9"><div className="mb-5"><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">SLA histórico</p><h2 className="mt-2 text-2xl font-semibold">Velocidad y cumplimiento</h2></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <AnalyticsCard icon={TimerReset} title="Primera respuesta" value={formatDuration(h.medianReviewResponseHours)} detail={`${h.responseSample} respuesta${h.responseSample===1?"":"s"} medidas · promedio ${formatDuration(h.avgReviewResponseHours)}`}/>
      <AnalyticsCard icon={CheckCircle2} title="Cumplimiento SLA" value={formatRate(h.slaOnTimeRate)} detail={`${h.slaSample} revisión${h.slaSample===1?"":"es"} con deadline y respuesta`}/>
      <AnalyticsCard icon={TrendingUp} title="Cycle time decisión" value={formatDuration(h.medianDecisionCycleHours)} detail={`${h.decisionSample} decisión${h.decisionSample===1?"":"es"} con trazabilidad completa · promedio ${formatDuration(h.avgDecisionCycleHours)}`}/>
      <AnalyticsCard icon={Gauge} title="Throughput" value={String(h.decisionsLast30Days)} detail="Decisiones registradas en los últimos 30 días"/>
    </div></section>

    <section className="grid gap-5 border-t border-border py-9 lg:grid-cols-2">
      <Card><CardHeader><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Ahora</p><CardTitle className="mt-2 text-xl">Cola de aprobación</CardTitle></CardHeader><CardContent className="space-y-4"><LiveRow icon={Hourglass} title="Tiempo esperando" value={formatDuration(live.avgWaitingHours)} detail={`Promedio de ${live.pendingReviews} revisión${live.pendingReviews===1?"":"es"} pendiente${live.pendingReviews===1?"":"s"}.`}/><LiveRow icon={Clock3} title="Vencidas" value={String(live.overdueReviews)} detail="Revisiones pendientes cuyo deadline ya pasó."/><LiveRow icon={ShieldAlert} title="Casos bloqueados" value={String(live.blockedCases)} detail={`Bloqueos abiertos por solicitud de cambios · promedio ${formatDuration(live.avgBlockedHours)}.`}/></CardContent></Card>
      <Card><CardHeader><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Cobertura</p><CardTitle className="mt-2 text-xl">Qué tan confiable es la lectura</CardTitle></CardHeader><CardContent className="space-y-4"><CoverageRow label="Casos activos" value={live.activeCases}/><CoverageRow label="Respuestas medidas" value={h.responseSample}/><CoverageRow label="Revisiones con SLA medible" value={h.slaSample}/><CoverageRow label="Decisiones con cycle time" value={h.decisionSample}/><p className="rounded-xl border border-dashed p-4 text-sm leading-6 text-muted-foreground">El cycle time usa eventos auditados <code>case_created</code> → <code>status_changed: decided</code>. No usamos la fecha de última edición como sustituto de una decisión histórica.</p></CardContent></Card>
    </section>
  </div>
}

function Metric({value,label}:{value:string;label:string}){return <div className="rounded-xl bg-background/70 p-4"><div className="text-2xl font-semibold">{value}</div><div className="mt-1 text-xs leading-5 text-muted-foreground">{label}</div></div>}
function AnalyticsCard({icon:Icon,title,value,detail}:{icon:typeof Gauge;title:string;value:string;detail:string}){return <Card><CardContent className="p-5"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-secondary/50"><Icon className="h-4 w-4"/></span><p className="mt-5 text-sm font-medium text-muted-foreground">{title}</p><p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-3 text-xs leading-5 text-muted-foreground">{detail}</p></CardContent></Card>}
function LiveRow({icon:Icon,title,value,detail}:{icon:typeof Gauge;title:string;value:string;detail:string}){return <div className="flex items-start gap-4 rounded-xl border border-border p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary"><Icon className="h-4 w-4"/></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{title}</p><span className="text-lg font-semibold">{value}</span></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div></div>}
function CoverageRow({label,value}:{label:string;value:number}){return <div className="flex items-center justify-between border-b border-border pb-3 last:border-0"><span className="text-sm text-muted-foreground">{label}</span><span className="text-sm font-semibold">{value}</span></div>}
