import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, CheckCircle2, Clock3, Hourglass, ShieldAlert, TimerReset, TrendingDown, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { buildPortfolioAnalytics, formatDuration, formatRate, type PortfolioCase, type PortfolioEvent, type PortfolioReview } from "@/lib/cases/portfolio-analytics"
import { buildPerformanceTrends, formatDelta, type ReviewerIdentity } from "@/lib/cases/performance-trends"
import { createClient } from "@/lib/supabase/server"

export const dynamic="force-dynamic"
type BatchMember={case_id:string;user_id:string;display_name:string;email:string}

export default async function PortfolioAnalyticsPage(){
  const supabase=await createClient()
  const {data:auth}=await supabase.auth.getUser()
  if(!auth.user)redirect("/auth/login?redirectTo=%2Fportfolio%2Fanalytics")

  const {data:caseData,error:caseError}=await supabase.from("cases").select("id,title,status,created_at,updated_at").order("created_at",{ascending:true}).limit(500)
  if(caseError)throw new Error("No pudimos cargar las métricas del portafolio.")
  const cases=(caseData??[]) as PortfolioCase[]
  const caseIds=cases.map(c=>c.id)

  let reviews:PortfolioReview[]=[]
  let events:PortfolioEvent[]=[]
  let members:BatchMember[]=[]
  if(caseIds.length){
    const [reviewResult,eventResult,memberResult]=await Promise.all([
      supabase.from("case_review_requests").select("id,case_id,reviewer_id,status,created_at,responded_at,deadline_at,governance_round_id").in("case_id",caseIds).order("created_at",{ascending:true}),
      supabase.from("case_events").select("case_id,event_type,payload,occurred_at").in("case_id",caseIds).order("occurred_at",{ascending:true}),
      supabase.rpc("get_case_members_batch",{p_case_ids:caseIds.slice(0,100)}),
    ])
    if(reviewResult.error||eventResult.error||memberResult.error)throw new Error("No pudimos completar las métricas del portafolio.")
    reviews=(reviewResult.data??[]) as PortfolioReview[]
    events=(eventResult.data??[]) as PortfolioEvent[]
    members=(memberResult.data??[]) as BatchMember[]
  }

  const reviewerIds=new Set(reviews.map(r=>r.reviewer_id))
  const reviewerMap=new Map<string,ReviewerIdentity>()
  for(const member of members)if(reviewerIds.has(member.user_id)&&!reviewerMap.has(member.user_id))reviewerMap.set(member.user_id,member)

  const analytics=buildPortfolioAnalytics({cases,reviews,events})
  const trends=buildPerformanceTrends({reviews,events,reviewers:[...reviewerMap.values()],window:30})
  const h=analytics.historical
  const live=analytics.live

  return <div className="mx-auto w-full max-w-[1480px] px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
    <header className="grid gap-8 border-b border-border pb-9 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">VIDENTIA / Portafolio / Rendimiento</p><h1 className="mt-4 max-w-[11ch] text-4xl font-normal leading-[0.96] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-6xl">¿Estamos resolviendo mejor que antes?</h1></div>
      <div className="max-w-2xl lg:justify-self-end"><p className="text-base leading-7 text-muted-foreground sm:text-lg">Compara los últimos 30 días con el período anterior usando tiempos y eventos auditables del flujo de revisión. Las variaciones describen operación; no califican la calidad jurídica de una decisión.</p><div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground"><span>Ventana 30 días</span><span>Eventos reales</span><span>Sin score compuesto</span></div></div>
    </header>

    <section className="grid border-b border-border sm:grid-cols-2 lg:grid-cols-4">
      <TrendMetric label="Respuesta mediana" current={formatDuration(trends.current.responses.medianHours)} previous={formatDuration(trends.previous.responses.medianHours)} delta={formatDelta(trends.deltas.response,{inverse:true})}/>
      <TrendMetric label="Cumplimiento SLA" current={formatRate(trends.current.responses.slaRate)} previous={formatRate(trends.previous.responses.slaRate)} delta={formatDelta(trends.deltas.sla)}/>
      <TrendMetric label="Cycle time mediano" current={formatDuration(trends.current.decisions.medianHours)} previous={formatDuration(trends.previous.decisions.medianHours)} delta={formatDelta(trends.deltas.cycle,{inverse:true})}/>
      <TrendMetric label="Decisiones" current={String(trends.current.decisions.count)} previous={String(trends.previous.decisions.count)} delta={formatDelta(trends.deltas.throughput)}/>
    </section>

    <section className="grid gap-10 border-b border-border py-10 xl:grid-cols-[1.25fr_0.75fr]">
      <div><SectionHeading kicker="Lectura del período" title="Qué cambió frente al mes anterior"/><div className="mt-5 divide-y divide-border border-y border-border">{trends.insights.length?trends.insights.map((insight,index)=><div key={index} className="flex gap-4 py-4"><span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center border border-border bg-card/40 text-muted-foreground"><TrendingDown className="h-3.5 w-3.5"/></span><p className="text-sm leading-6 text-foreground/90">{insight}</p></div>):<p className="py-8 text-sm text-muted-foreground">Todavía no hay suficiente actividad para una comparación material.</p>}</div></div>
      <aside><SectionHeading kicker="Ahora" title="Cola operativa"/><div className="mt-5 divide-y divide-border border-y border-border"><LiveRow icon={Hourglass} title="Tiempo esperando" value={formatDuration(live.avgWaitingHours)} detail={`${live.pendingReviews} revisión${live.pendingReviews===1?"":"es"} pendiente${live.pendingReviews===1?"":"s"}.`}/><LiveRow icon={Clock3} title="Vencidas" value={String(live.overdueReviews)} detail="Pendientes cuyo plazo ya pasó."/><LiveRow icon={ShieldAlert} title="Casos bloqueados" value={String(live.blockedCases)} detail={`Solicitud de cambios abierta · promedio ${formatDuration(live.avgBlockedHours)}.`}/></div></aside>
    </section>

    <section className="grid gap-10 border-b border-border py-10 xl:grid-cols-[1.25fr_0.75fr]">
      <div><SectionHeading kicker="Equipo" title="Respuesta por revisor · 30 días"/><div className="mt-5 divide-y divide-border border-y border-border">{trends.reviewers.length?trends.reviewers.slice(0,12).map(row=><div key={row.userId} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"><div className="min-w-0"><p className="truncate text-sm font-medium text-foreground">{row.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{row.email||`${row.responses} respuestas medidas`}</p></div><MiniStat label="Mediana" value={formatDuration(row.medianResponseHours)}/><MiniStat label="SLA" value={formatRate(row.slaRate)}/><MiniStat label="Pendientes" value={row.overdue?`${row.pending} · ${row.overdue} vencidas`:String(row.pending)}/></div>):<div className="py-9"><Users className="h-5 w-5 text-muted-foreground"/><p className="mt-3 text-sm font-medium text-foreground">Aún no hay muestra suficiente por revisor.</p></div>}</div></div>
      <aside><SectionHeading kicker="Cobertura" title="Base histórica"/><div className="mt-5 divide-y divide-border border-y border-border"><BaseRow icon={TimerReset} title="Respuestas medidas" value={String(h.responseSample)} detail={`Mediana ${formatDuration(h.medianReviewResponseHours)}`}/><BaseRow icon={CheckCircle2} title="SLA medible" value={String(h.slaSample)} detail={`Cumplimiento ${formatRate(h.slaOnTimeRate)}`}/><BaseRow icon={TrendingDown} title="Decisiones auditadas" value={String(h.decisionSample)} detail={`Cycle time ${formatDuration(h.medianDecisionCycleHours)}`}/><BaseRow icon={CheckCircle2} title="Decisiones · 30 días" value={String(h.decisionsLast30Days)} detail="Throughput del período actual"/></div></aside>
    </section>

    <section className="py-8"><Link href="/portfolio" className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:underline">Volver al resumen ejecutivo <ArrowRight className="h-4 w-4"/></Link></section>
  </div>
}

function SectionHeading({kicker,title}:{kicker:string;title:string}){return <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{kicker}</p><h2 className="mt-2 text-2xl font-normal tracking-[-0.03em] text-foreground">{title}</h2></div>}
function TrendMetric({label,current,previous,delta}:{label:string;current:string;previous:string;delta:string}){return <div className="border-b border-border py-6 sm:border-b-0 sm:border-r sm:px-5 first:pl-0 last:border-r-0"><p className="text-3xl font-semibold tracking-[-0.03em] text-foreground">{current}</p><p className="mt-1 text-sm font-semibold text-foreground">{label}</p><p className="mt-2 text-xs text-muted-foreground">Anterior {previous} · {delta}</p></div>}
function LiveRow({icon:Icon,title,value,detail}:{icon:typeof Hourglass;title:string;value:string;detail:string}){return <div className="flex items-start gap-4 py-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center border border-border bg-card/40 text-muted-foreground"><Icon className="h-3.5 w-3.5"/></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-foreground">{title}</p><span className="text-lg font-semibold text-foreground">{value}</span></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div></div>}
function BaseRow({icon:Icon,title,value,detail}:{icon:typeof TimerReset;title:string;value:string;detail:string}){return <div className="flex items-center gap-3 py-4"><Icon className="h-4 w-4 text-muted-foreground"/><div className="min-w-0 flex-1"><p className="text-sm font-medium text-foreground">{title}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div><span className="text-lg font-semibold text-foreground">{value}</span></div>}
function MiniStat({label,value}:{label:string;value:string}){return <div className="sm:text-right"><p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold text-foreground">{value}</p></div>}
