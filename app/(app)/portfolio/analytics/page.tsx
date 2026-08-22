import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, CheckCircle2, Clock3, Gauge, Hourglass, ShieldAlert, TimerReset, TrendingDown, TrendingUp, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buildPortfolioAnalytics, formatDuration, formatRate, type PortfolioCase, type PortfolioEvent, type PortfolioReview } from "@/lib/cases/portfolio-analytics"
import { buildPerformanceTrends, formatDelta, type ReviewerIdentity } from "@/lib/cases/performance-trends"
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
    supabase.from("case_review_requests").select("id,case_id,reviewer_id,status,created_at,responded_at,deadline_at,governance_round_id").in("case_id",caseIds).order("created_at",{ascending:true}),
    supabase.from("case_events").select("case_id,event_type,payload,occurred_at").in("case_id",caseIds).order("occurred_at",{ascending:true}),
  ]):[{data:[]},{data:[]}]
  const reviews=(reviewData??[]) as PortfolioReview[]
  const events=(eventData??[]) as PortfolioEvent[]
  const reviewerIds=[...new Set(reviews.map(r=>r.reviewer_id))]
  const reviewerResults=await Promise.all(caseIds.slice(0,100).map(async caseId=>{const {data}=await supabase.rpc("get_case_members",{p_case_id:caseId});return (data??[]) as Array<{user_id:string;display_name:string;email:string}>}))
  const reviewerMap=new Map<string,ReviewerIdentity>()
  for(const member of reviewerResults.flat())if(reviewerIds.includes(member.user_id)&&!reviewerMap.has(member.user_id))reviewerMap.set(member.user_id,member)

  const analytics=buildPortfolioAnalytics({cases,reviews,events})
  const trends=buildPerformanceTrends({reviews,events,reviewers:[...reviewerMap.values()],window:30})
  const h=analytics.historical
  const live=analytics.live

  return <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
    <div className="mb-6"><Button asChild variant="ghost" size="sm"><Link href="/portfolio"><ArrowLeft className="mr-2 h-4 w-4"/>Volver al portafolio</Link></Button></div>
    <section className="grid gap-7 border-b border-border pb-9 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
      <div><Badge variant="secondary">Phase 18 · Trends & Performance Intelligence</Badge><h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.035em] sm:text-5xl lg:text-6xl">No basta con medir. Hay que saber si estamos mejorando.</h1><p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">Compara los últimos 30 días contra el período anterior, detecta deterioros materiales y ve dónde se concentra la espera por persona.</p></div>
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-secondary/20 p-3"><Metric value={formatDelta(trends.deltas.response,{inverse:true})} label="Cambio tiempo respuesta"/><Metric value={formatDelta(trends.deltas.sla)} label="Cambio SLA"/><Metric value={formatDelta(trends.deltas.cycle,{inverse:true})} label="Cambio cycle time"/><Metric value={formatDelta(trends.deltas.throughput)} label="Cambio throughput"/></div>
    </section>

    <section className="py-9"><div className="mb-5"><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Performance intelligence</p><h2 className="mt-2 text-2xl font-semibold">Qué cambió frente al período anterior</h2></div><div className="grid gap-3 lg:grid-cols-3">{trends.insights.map((insight,index)=><Card key={index}><CardContent className="flex items-start gap-4 p-5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary"><TrendingUp className="h-4 w-4"/></span><p className="text-sm leading-6">{insight}</p></CardContent></Card>)}</div></section>

    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <TrendCard title="Respuesta mediana" current={formatDuration(trends.current.responses.medianHours)} previous={formatDuration(trends.previous.responses.medianHours)} delta={formatDelta(trends.deltas.response,{inverse:true})}/>
      <TrendCard title="Cumplimiento SLA" current={formatRate(trends.current.responses.slaRate)} previous={formatRate(trends.previous.responses.slaRate)} delta={formatDelta(trends.deltas.sla)}/>
      <TrendCard title="Cycle time mediano" current={formatDuration(trends.current.decisions.medianHours)} previous={formatDuration(trends.previous.decisions.medianHours)} delta={formatDelta(trends.deltas.cycle,{inverse:true})}/>
      <TrendCard title="Throughput" current={String(trends.current.decisions.count)} previous={String(trends.previous.decisions.count)} delta={formatDelta(trends.deltas.throughput)}/>
    </section>

    <section className="grid gap-5 border-t border-border py-9 lg:grid-cols-[1.2fr_0.8fr]">
      <Card><CardHeader><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Equipo</p><CardTitle className="mt-2 text-xl">Performance por revisor · 30 días</CardTitle></CardHeader><CardContent className="space-y-3">{trends.reviewers.length?trends.reviewers.slice(0,10).map(row=><div key={row.userId} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"><div className="min-w-0"><p className="truncate text-sm font-medium">{row.name}</p><p className="truncate text-xs text-muted-foreground">{row.email||`${row.responses} respuestas medidas`}</p></div><MiniStat label="Mediana" value={formatDuration(row.medianResponseHours)}/><MiniStat label="SLA" value={formatRate(row.slaRate)}/><MiniStat label="Pendientes" value={row.overdue?`${row.pending} · ${row.overdue} vencidas`:String(row.pending)}/></div>):<div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground"><Users className="mx-auto mb-2 h-5 w-5"/>Todavía no hay suficiente actividad por revisor para comparar.</div>}</CardContent></Card>
      <Card><CardHeader><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Ahora</p><CardTitle className="mt-2 text-xl">Cola y riesgo operacional</CardTitle></CardHeader><CardContent className="space-y-4"><LiveRow icon={Hourglass} title="Tiempo esperando" value={formatDuration(live.avgWaitingHours)} detail={`Promedio de ${live.pendingReviews} revisión${live.pendingReviews===1?"":"es"} pendiente${live.pendingReviews===1?"":"s"}.`}/><LiveRow icon={Clock3} title="Vencidas" value={String(live.overdueReviews)} detail="Revisiones pendientes cuyo deadline ya pasó."/><LiveRow icon={ShieldAlert} title="Casos bloqueados" value={String(live.blockedCases)} detail={`Bloqueos abiertos por solicitud de cambios · promedio ${formatDuration(live.avgBlockedHours)}.`}/></CardContent></Card>
    </section>

    <section className="border-t border-border py-9"><div className="mb-5"><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Base histórica</p><h2 className="mt-2 text-2xl font-semibold">Cobertura y trazabilidad</h2></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><AnalyticsCard icon={TimerReset} title="Respuestas medidas" value={String(h.responseSample)} detail={`Mediana histórica ${formatDuration(h.medianReviewResponseHours)}`}/><AnalyticsCard icon={CheckCircle2} title="SLA medible" value={String(h.slaSample)} detail={`Cumplimiento histórico ${formatRate(h.slaOnTimeRate)}`}/><AnalyticsCard icon={TrendingDown} title="Decisiones auditadas" value={String(h.decisionSample)} detail={`Cycle time histórico ${formatDuration(h.medianDecisionCycleHours)}`}/><AnalyticsCard icon={Gauge} title="Decisiones · 30 días" value={String(h.decisionsLast30Days)} detail="Throughput auditado del período actual"/></div></section>
  </div>
}

function Metric({value,label}:{value:string;label:string}){return <div className="rounded-xl bg-background/70 p-4"><div className="text-xl font-semibold">{value}</div><div className="mt-1 text-xs leading-5 text-muted-foreground">{label}</div></div>}
function TrendCard({title,current,previous,delta}:{title:string;current:string;previous:string;delta:string}){return <Card><CardContent className="p-5"><p className="text-sm font-medium text-muted-foreground">{title}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{current}</p><div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs"><span className="text-muted-foreground">Anterior {previous}</span><Badge variant="outline">{delta}</Badge></div></CardContent></Card>}
function AnalyticsCard({icon:Icon,title,value,detail}:{icon:typeof Gauge;title:string;value:string;detail:string}){return <Card><CardContent className="p-5"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-secondary/50"><Icon className="h-4 w-4"/></span><p className="mt-5 text-sm font-medium text-muted-foreground">{title}</p><p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-3 text-xs leading-5 text-muted-foreground">{detail}</p></CardContent></Card>}
function LiveRow({icon:Icon,title,value,detail}:{icon:typeof Gauge;title:string;value:string;detail:string}){return <div className="flex items-start gap-4 rounded-xl border border-border p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary"><Icon className="h-4 w-4"/></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{title}</p><span className="text-lg font-semibold">{value}</span></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div></div>}
function MiniStat({label,value}:{label:string;value:string}){return <div className="sm:text-right"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>}
