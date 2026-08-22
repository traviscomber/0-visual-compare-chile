import Link from "next/link"
import { redirect } from "next/navigation"
import { AlertTriangle, ArrowLeft, ArrowRight, Gauge, Radar, ShieldCheck, TimerReset } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InterventionActions } from "@/components/cases/intervention-actions"
import { buildPredictiveDecisionRisk, riskLabel, type RiskGovernance, type RiskLevel, type RiskReview } from "@/lib/cases/predictive-risk"
import { createClient } from "@/lib/supabase/server"

export const dynamic="force-dynamic"

type CaseRow={id:string;title:string;priority:"low"|"normal"|"high";status:string;updated_at:string}
const HOUR=3_600_000
const median=(values:number[])=>{if(!values.length)return null;const s=[...values].sort((a,b)=>a-b);const m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2}
const levelRank:Record<RiskLevel,number>={critical:0,high:1,medium:2,low:3}

export default async function PredictiveRiskPage(){
  const supabase=await createClient()
  const {data:auth}=await supabase.auth.getUser()
  if(!auth.user)redirect("/auth/login?redirectTo=%2Fportfolio%2Frisk")

  const {data:caseData,error:caseError}=await supabase.from("cases").select("id,title,priority,status,updated_at").not("status","in",'(\"decided\",\"archived\")').order("updated_at",{ascending:false}).limit(250)
  if(caseError)throw new Error("No pudimos cargar el radar predictivo.")
  const cases=(caseData??[]) as CaseRow[]
  const caseIds=cases.map(c=>c.id)
  const [{data:governanceData},{data:reviewData}]=caseIds.length?await Promise.all([
    supabase.from("case_governance").select("case_id,current_round_id,round_deadline_at,required_approvals").in("case_id",caseIds),
    supabase.from("case_review_requests").select("case_id,status,governance_round_id,created_at,responded_at,deadline_at").in("case_id",caseIds).order("created_at",{ascending:true}),
  ]):[{data:[]},{data:[]}]
  const governance=(governanceData??[]) as RiskGovernance[]
  const reviews=(reviewData??[]) as RiskReview[]
  const respondedHours=reviews.filter(r=>r.responded_at&&r.status!=="cancelled").map(r=>(Date.parse(r.responded_at!)-Date.parse(r.created_at))/HOUR).filter(v=>Number.isFinite(v)&&v>=0)
  const historicalMedianResponseHours=median(respondedHours)
  const govMap=new Map(governance.map(g=>[g.case_id,g]))
  const reviewsByCase=new Map<string,RiskReview[]>()
  for(const review of reviews)reviewsByCase.set(review.case_id,[...(reviewsByCase.get(review.case_id)??[]),review])

  const items=cases.map(caseRow=>({caseRow,risk:buildPredictiveDecisionRisk({caseRow,governance:govMap.get(caseRow.id),reviews:reviewsByCase.get(caseRow.id)??[],historicalMedianResponseHours})}))
    .sort((a,b)=>levelRank[a.risk.level]-levelRank[b.risk.level]||b.risk.score-a.risk.score)
  const counts={critical:items.filter(i=>i.risk.level==="critical").length,high:items.filter(i=>i.risk.level==="high").length,medium:items.filter(i=>i.risk.level==="medium").length,low:items.filter(i=>i.risk.level==="low").length}
  const elevated=items.filter(i=>i.risk.level==="critical"||i.risk.level==="high")

  return <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
    <div className="mb-6"><Button asChild variant="ghost" size="sm"><Link href="/portfolio"><ArrowLeft className="mr-2 h-4 w-4"/>Volver al portafolio</Link></Button></div>
    <section className="grid gap-7 border-b border-border pb-9 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
      <div><Badge variant="secondary">Phase 20 · Recommended Interventions</Badge><h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.035em] sm:text-5xl lg:text-6xl">Detecta el riesgo y actúa antes del atraso.</h1><p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">El radar mantiene su score explicable y ahora convierte la recomendación en acciones ejecutables. Cada intervención requiere una acción humana y queda trazada en el expediente.</p></div>
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-secondary/20 p-3"><Metric value={counts.critical} label="Riesgo crítico"/><Metric value={counts.high} label="Riesgo alto"/><Metric value={counts.medium} label="Riesgo medio"/><Metric value={counts.low} label="Riesgo bajo"/></div>
    </section>

    <section className="grid gap-5 py-9 lg:grid-cols-[1.25fr_0.75fr]">
      <Card><CardHeader><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Radar preventivo</p><CardTitle className="mt-2 text-xl">Intervenir antes del atraso</CardTitle></div><Radar className="h-5 w-5 text-muted-foreground"/></div></CardHeader><CardContent className="space-y-3">{elevated.length?elevated.slice(0,8).map(({caseRow,risk})=><div key={caseRow.id} className="rounded-xl border border-border p-4"><Link href={`/casos/${caseRow.id}/revision`} className="block transition-colors"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><RiskBadge level={risk.level}/><Badge variant="outline">Score {risk.score}</Badge></div><ArrowRight className="h-4 w-4 text-muted-foreground"/></div><p className="mt-3 text-sm font-medium">{caseRow.title}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{risk.reasons.join(" · ")||"Sin señales materiales de atraso."}</p><p className="mt-3 text-xs font-medium">{risk.recommendedAction}</p></Link><InterventionActions caseId={caseRow.id} priority={caseRow.priority} hasActiveRound={risk.pendingReviews>0}/></div>):<div className="rounded-xl border border-dashed p-8 text-center"><ShieldCheck className="mx-auto h-5 w-5"/><p className="mt-3 text-sm font-medium">No hay casos con riesgo alto o crítico.</p><p className="mt-1 text-sm text-muted-foreground">El radar no detecta señales fuertes de atraso en este momento.</p></div>}</CardContent></Card>
      <Card><CardHeader><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Modelo operativo</p><CardTitle className="mt-2 text-xl">Qué empuja el riesgo</CardTitle></CardHeader><CardContent className="space-y-3"><Factor icon={TimerReset} title="Espera vs historia" text={historicalMedianResponseHours===null?"Aún no hay muestra histórica suficiente.":`Mediana histórica del equipo: ${historicalMedianResponseHours<48?`${historicalMedianResponseHours.toFixed(1)} h`:`${(historicalMedianResponseHours/24).toFixed(1)} d`}.`}/><Factor icon={AlertTriangle} title="Deadline y bloqueos" text="El riesgo sube cuando una ronda entra en sus últimos 7, 3 o 1 días, o cuando ya existieron solicitudes de cambio."/><Factor icon={Gauge} title="Carga y prioridad" text="Más revisores pendientes, prioridad alta y falta de movimiento aumentan el score preventivo."/></CardContent></Card>
    </section>

    <section className="border-t border-border py-9"><div className="mb-5"><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Todos los casos activos</p><h2 className="mt-2 text-2xl font-semibold">Riesgo ordenado por intervención</h2></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{items.map(({caseRow,risk})=><Link key={caseRow.id} href={`/casos/${caseRow.id}`} className="rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center justify-between gap-2"><RiskBadge level={risk.level}/><span className="text-sm font-semibold">{risk.score}/100</span></div><h3 className="mt-4 text-base font-semibold">{caseRow.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{risk.reasons[0]??"Sin señales materiales de atraso."}</p><div className="mt-4 text-xs text-muted-foreground">{risk.pendingReviews} revisión{risk.pendingReviews===1?"":"es"} pendiente{risk.pendingReviews===1?"":"s"}</div></Link>)}</div></section>
  </div>
}

function Metric({value,label}:{value:number;label:string}){return <div className="rounded-xl bg-background/70 p-4"><div className="text-2xl font-semibold">{value}</div><div className="mt-1 text-xs leading-5 text-muted-foreground">{label}</div></div>}
function RiskBadge({level}:{level:RiskLevel}){return <Badge variant={level==="critical"||level==="high"?"destructive":"secondary"}>{riskLabel[level]}</Badge>}
function Factor({icon:Icon,title,text}:{icon:typeof Gauge;title:string;text:string}){return <div className="flex gap-3 rounded-xl border border-border p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary"><Icon className="h-4 w-4"/></span><div><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p></div></div>}
