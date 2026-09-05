import Link from "next/link"
import { redirect } from "next/navigation"
import { AlertTriangle, ArrowRight, Clock3, ShieldCheck, TimerReset } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { InterventionActions } from "@/components/cases/intervention-actions"
import { buildPredictiveDecisionRisk, riskLabel, type RiskGovernance, type RiskLevel, type RiskReview } from "@/lib/cases/predictive-risk"
import { createClient } from "@/lib/supabase/server"

export const dynamic="force-dynamic"
type CaseRow={id:string;title:string;priority:"low"|"normal"|"high";status:string;updated_at:string}
const HOUR=3_600_000
const median=(values:number[])=>{if(!values.length)return null;const s=[...values].sort((a,b)=>a-b);const m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2}
const rank:Record<RiskLevel,number>={critical:0,high:1,medium:2,low:3}

export default async function PortfolioRiskPage(){
 const supabase=await createClient();const {data:auth}=await supabase.auth.getUser();if(!auth.user)redirect("/auth/login?redirectTo=%2Fportfolio%2Frisk")
 const {data:caseData,error}=await supabase.from("cases").select("id,title,priority,status,updated_at").not("status","in",'(\"decided\",\"archived\")').order("updated_at",{ascending:false}).limit(250)
 if(error)throw new Error("No pudimos cargar el riesgo operativo.")
 const cases=(caseData??[]) as CaseRow[];const ids=cases.map(c=>c.id)
 const [gResult,rResult]=ids.length?await Promise.all([
  supabase.from("case_governance").select("case_id,current_round_id,round_deadline_at,required_approvals").in("case_id",ids),
  supabase.from("case_review_requests").select("case_id,status,governance_round_id,created_at,responded_at,deadline_at").in("case_id",ids).order("created_at",{ascending:true}),
 ]):[{data:[],error:null},{data:[],error:null}]
 if(gResult.error||rResult.error)throw new Error("No pudimos completar el riesgo operativo.")
 const governance=(gResult.data??[]) as RiskGovernance[];const reviews=(rResult.data??[]) as RiskReview[]
 const responseHours=reviews.filter(r=>r.responded_at&&r.status!=="cancelled").map(r=>(Date.parse(r.responded_at!)-Date.parse(r.created_at))/HOUR).filter(v=>Number.isFinite(v)&&v>=0)
 const historical=median(responseHours);const govMap=new Map(governance.map(g=>[g.case_id,g]));const byCase=new Map<string,RiskReview[]>()
 for(const review of reviews)byCase.set(review.case_id,[...(byCase.get(review.case_id)??[]),review])
 const items=cases.map(caseRow=>({caseRow,risk:buildPredictiveDecisionRisk({caseRow,governance:govMap.get(caseRow.id),reviews:byCase.get(caseRow.id)??[],historicalMedianResponseHours:historical})})).sort((a,b)=>rank[a.risk.level]-rank[b.risk.level]||b.risk.score-a.risk.score)
 const counts={critical:items.filter(i=>i.risk.level==="critical").length,high:items.filter(i=>i.risk.level==="high").length,medium:items.filter(i=>i.risk.level==="medium").length,low:items.filter(i=>i.risk.level==="low").length};const elevated=items.filter(i=>i.risk.level==="critical"||i.risk.level==="high");const immediate=counts.critical+counts.high
 return <OperationalPage>
  <OperationalHeader eyebrow="VIDENTIA / Portafolio / Riesgo operativo" title={immediate?`${immediate} caso${immediate===1?"":"s"} requieren intervención.`:"No hay riesgo elevado que requiera intervención."} description={<>La prioridad combina plazos, revisiones pendientes, bloqueos, carga y tiempo sin movimiento. Las razones observables quedan visibles; el score interno sólo ordena la cola.</>} meta={<><span>Razones visibles</span><span>Riesgo operativo</span><span>Acción humana</span></>} actions={<ButtonLink href="/portfolio">Volver al portafolio</ButtonLink>}/>
  <OperationalMetricRail>
   <OperationalMetric value={immediate} label="Para actuar" detail="Riesgo crítico o alto" tone={immediate?"warning":"success"}/>
   <OperationalMetric value={counts.critical} label="Crítico" detail="Intervención inmediata" tone={counts.critical?"warning":"neutral"}/>
   <OperationalMetric value={counts.medium} label="Medio" detail="Vigilar evolución"/>
   <OperationalMetric value={counts.low} label="Bajo" detail="Sin señales materiales" tone="success"/>
  </OperationalMetricRail>
  <section className="grid gap-10 border-b border-border/80 py-9 xl:grid-cols-[1.3fr_0.7fr]"><div><OperationalSectionHeader eyebrow="Intervención prioritaria" title="Casos donde conviene actuar ahora" meta={`${elevated.length} caso${elevated.length===1?"":"s"}`}/><div className="mt-5 divide-y divide-border/80 border-y border-border/80">{elevated.length?elevated.slice(0,10).map(({caseRow,risk})=><article key={caseRow.id} className="py-5"><Link href={`/casos/${caseRow.id}/revision`} className="group block outline-none focus-visible:bg-secondary/20"><div className="flex items-center justify-between gap-3"><RiskBadge level={risk.level}/><ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1"/></div><h3 className="mt-3 text-base font-medium text-white">{caseRow.title}</h3><div className="mt-3 space-y-1">{risk.reasons.slice(0,4).map((reason,index)=><p key={index} className="text-xs leading-5 text-muted-foreground">{reason}</p>)}</div><p className="mt-3 text-sm font-medium text-[#E7DFCE]">{risk.recommendedAction}</p></Link><InterventionActions caseId={caseRow.id} priority={caseRow.priority} hasActiveRound={risk.pendingReviews>0}/></article>):<div className="py-10"><ShieldCheck className="h-5 w-5 text-primary"/><p className="mt-3 text-sm font-medium text-white">No hay casos con riesgo alto o crítico.</p><p className="mt-1 text-sm text-muted-foreground">La cola operativa no requiere una intervención extraordinaria ahora.</p></div>}</div></div><aside><OperationalSectionHeader eyebrow="Interpretación" title="Factores observables"/><div className="mt-5 divide-y divide-border/80 border-y border-border/80"><Factor icon={TimerReset} title="Espera vs. historia" text={historical===null?"Aún no hay muestra histórica suficiente.":`Mediana histórica de respuesta: ${historical<48?`${historical.toFixed(1)} h`:`${(historical/24).toFixed(1)} d`}.`}/><Factor icon={Clock3} title="Plazo y bloqueos" text="Una ronda gana prioridad cuando entra en su ventana final, vence o recibe solicitud de cambios."/><Factor icon={AlertTriangle} title="Carga y movimiento" text="Más revisiones pendientes y falta de actividad elevan la necesidad de intervención."/></div></aside></section>
  <section className="py-9"><OperationalSectionHeader eyebrow="Casos activos" title="Orden operativo" meta={`${items.length} caso${items.length===1?"":"s"}`}/><div className="mt-5 divide-y divide-border/80 border-y border-border/80">{items.map(({caseRow,risk})=><Link key={caseRow.id} href={`/casos/${caseRow.id}`} className="group grid gap-3 px-2 py-5 outline-none hover:bg-secondary/15 focus-visible:bg-secondary/20 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><RiskBadge level={risk.level}/><span className="text-xs text-muted-foreground">{risk.pendingReviews} pendiente{risk.pendingReviews===1?"":"s"}</span></div><h3 className="mt-3 font-medium text-white">{caseRow.title}</h3><p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{risk.reasons[0]??"Sin señales materiales de atraso."}</p></div><ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1"/></Link>)}</div></section>
 </OperationalPage>
}
function ButtonLink({href,children}:{href:string;children:React.ReactNode}){return <Link href={href} className="inline-flex h-9 items-center justify-center border border-border bg-transparent px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary">{children}</Link>}
function RiskBadge({level}:{level:RiskLevel}){const cls=level==="critical"?"border-[#C9A56A]/35 bg-[#C9A56A]/[0.10] text-[#E1C78F]":level==="high"?"border-amber-300/20 bg-amber-300/[0.06] text-amber-200":level==="low"?"border-primary/20 bg-primary/[0.07] text-primary":"border-border bg-card/30 text-muted-foreground";return <Badge variant="outline" className={`rounded-md ${cls}`}>{riskLabel[level]}</Badge>}
function Factor({icon:Icon,title,text}:{icon:typeof TimerReset;title:string;text:string}){return <div className="flex gap-3 py-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center border border-border bg-card/40 text-muted-foreground"><Icon className="h-3.5 w-3.5"/></span><div><p className="text-sm font-medium text-white">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p></div></div>}
