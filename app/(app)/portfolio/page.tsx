import Link from "next/link"
import { redirect } from "next/navigation"
import { AlertTriangle, ArrowRight, BriefcaseBusiness, CheckCircle2, Clock3, ShieldCheck, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buildCaseIntelligence, type CaseItemType, type CaseStatus } from "@/lib/cases/intelligence"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

type CaseItem = { item_type:CaseItemType; title:string; created_at:string; metadata:Record<string,unknown>|null }
type CaseRow = { id:string; user_id:string; title:string; status:CaseStatus; priority:"low"|"normal"|"high"; context_type:string; decision_summary:string|null; notes:string|null; last_reviewed_at:string|null; updated_at:string; case_items:CaseItem[]|null }
type Governance = { case_id:string; required_approvals:number; current_round_id:string|null; round_deadline_at:string|null; block_on_changes:boolean }
type Review = { case_id:string; reviewer_id:string; status:"pending"|"approved"|"changes_requested"|"cancelled"; governance_round_id:string|null }
type Member = { user_id:string; display_name:string; email:string; role:string }
type ExecutiveStatus = "approved"|"blocked"|"overdue"|"waiting"|"ready"|"working"

const statusLabel:Record<ExecutiveStatus,string>={approved:"Aprobado",blocked:"Bloqueado",overdue:"Vencido",waiting:"Esperando aprobación",ready:"Listo",working:"En desarrollo"}
const statusRank:Record<ExecutiveStatus,number>={blocked:0,overdue:1,waiting:2,ready:3,working:4,approved:5}

function relative(value:string|null|undefined){if(!value)return "Sin fecha";const ms=Date.now()-Date.parse(value);const d=Math.max(0,Math.floor(ms/86400000));if(d===0)return "Hoy";if(d===1)return "Hace 1 día";if(d<30)return `Hace ${d} días`;return new Intl.DateTimeFormat("es-CL",{dateStyle:"medium"}).format(new Date(value))}

function governanceState(g:Governance|undefined,reviews:Review[],readiness:string):ExecutiveStatus{
  if(!g||!g.current_round_id)return readiness==="decision-ready"?"ready":"working"
  const round=reviews.filter(r=>r.governance_round_id===g.current_round_id)
  const approved=round.filter(r=>r.status==="approved").length
  const blocked=g.block_on_changes&&round.some(r=>r.status==="changes_requested")
  const overdue=Boolean(g.round_deadline_at&&Date.parse(g.round_deadline_at)<Date.now()&&approved<g.required_approvals)
  if(blocked)return "blocked"
  if(approved>=g.required_approvals)return "approved"
  if(overdue)return "overdue"
  return "waiting"
}

export default async function PortfolioPage(){
  const supabase=await createClient()
  const {data:auth}=await supabase.auth.getUser()
  if(!auth.user)redirect("/auth/login?redirectTo=%2Fportfolio")

  const {data:caseData,error:caseError}=await supabase.from("cases").select("id,user_id,title,status,priority,context_type,decision_summary,notes,last_reviewed_at,updated_at,case_items(item_type,title,created_at,metadata)").neq("status","archived").order("updated_at",{ascending:false}).limit(100)
  if(caseError)throw new Error("No pudimos cargar el portafolio de decisiones.")
  const cases=(caseData??[]) as CaseRow[]
  const caseIds=cases.map(c=>c.id)

  const [{data:governanceData},{data:reviewData}]=caseIds.length?await Promise.all([
    supabase.from("case_governance").select("case_id,required_approvals,current_round_id,round_deadline_at,block_on_changes").in("case_id",caseIds),
    supabase.from("case_review_requests").select("case_id,reviewer_id,status,governance_round_id").in("case_id",caseIds),
  ]):[{data:[]},{data:[]}]
  const governance=(governanceData??[]) as Governance[]
  const reviews=(reviewData??[]) as Review[]
  const govMap=new Map(governance.map(g=>[g.case_id,g]))
  const reviewsByCase=new Map<string,Review[]>()
  for(const r of reviews)reviewsByCase.set(r.case_id,[...(reviewsByCase.get(r.case_id)??[]),r])

  const memberResults=await Promise.all(cases.map(async c=>{const {data}=await supabase.rpc("get_case_members",{p_case_id:c.id});return [c.id,(data??[]) as Member[]] as const}))
  const membersByCase=new Map(memberResults)
  const people=new Map<string,{name:string;email:string;pending:number;cases:Set<string>}>()

  const items=cases.map(c=>{
    const intelligence=buildCaseIntelligence({status:c.status,contextType:c.context_type,decisionSummary:c.decision_summary,notes:c.notes,lastReviewedAt:c.last_reviewed_at,items:(c.case_items??[]).map(i=>({item_type:i.item_type,title:i.title,created_at:i.created_at,metadata:i.metadata??{}}))})
    const caseReviews=reviewsByCase.get(c.id)??[]
    const gov=govMap.get(c.id)
    const execStatus=governanceState(gov,caseReviews,intelligence.readiness)
    const roundReviews=gov?.current_round_id?caseReviews.filter(r=>r.governance_round_id===gov.current_round_id):[]
    const approvals=roundReviews.filter(r=>r.status==="approved").length
    const pending=roundReviews.filter(r=>r.status==="pending")
    const members=new Map((membersByCase.get(c.id)??[]).map(m=>[m.user_id,m]))
    for(const review of pending){const m=members.get(review.reviewer_id);const current=people.get(review.reviewer_id)??{name:m?.display_name||m?.email||"Participante",email:m?.email||"",pending:0,cases:new Set<string>()};current.pending+=1;current.cases.add(c.id);people.set(review.reviewer_id,current)}
    return {caseRow:c,intelligence,execStatus,gov,approvals,pendingCount:pending.length}
  }).sort((a,b)=>statusRank[a.execStatus]-statusRank[b.execStatus]||({high:0,normal:1,low:2}[a.caseRow.priority]-{high:0,normal:1,low:2}[b.caseRow.priority]))

  const counts={waiting:items.filter(i=>i.execStatus==="waiting").length,blocked:items.filter(i=>i.execStatus==="blocked").length,overdue:items.filter(i=>i.execStatus==="overdue").length,ready:items.filter(i=>i.execStatus==="ready"||i.execStatus==="approved").length}
  const bottlenecks=[...people.values()].sort((a,b)=>b.pending-a.pending).slice(0,6)
  const critical=items.filter(i=>["blocked","overdue","waiting"].includes(i.execStatus)).slice(0,8)

  return <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
    <section className="grid gap-7 border-b border-border pb-9 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
      <div><Badge variant="secondary">Phase 16 · Executive Portfolio</Badge><h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.035em] sm:text-5xl lg:text-6xl">El estado de tus decisiones, en una sola vista.</h1><p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">Visualiza qué casos avanzan, cuáles esperan aprobación, dónde existe bloqueo y en qué punto se concentra el trabajo pendiente del equipo.</p></div>
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-secondary/20 p-3"><Metric value={counts.waiting} label="Esperando aprobación"/><Metric value={counts.blocked} label="Bloqueados"/><Metric value={counts.overdue} label="Vencidos"/><Metric value={counts.ready} label="Listos / aprobados"/></div>
    </section>

    <section className="grid gap-5 py-9 lg:grid-cols-[1.25fr_0.75fr]">
      <Card><CardHeader><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Pipeline ejecutivo</p><CardTitle className="mt-2 text-xl">Casos que requieren intervención</CardTitle></div><Button asChild variant="ghost" size="sm"><Link href="/casos">Todos los casos <ArrowRight className="ml-1 h-4 w-4"/></Link></Button></div></CardHeader><CardContent className="space-y-3">{critical.length?critical.map(item=><CaseRowView key={item.caseRow.id} item={item}/>):<EmptyState/>}</CardContent></Card>
      <Card><CardHeader><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Equipo</p><CardTitle className="mt-2 text-xl">Cuellos de botella</CardTitle></CardHeader><CardContent className="space-y-3">{bottlenecks.length?bottlenecks.map((p,index)=><div key={`${p.email}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"><div className="min-w-0"><p className="truncate text-sm font-medium">{p.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{p.email||`${p.cases.size} caso${p.cases.size===1?"":"s"}`}</p></div><Badge variant="outline">{p.pending} pendiente{p.pending===1?"":"s"}</Badge></div>):<div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground"><Users className="mx-auto mb-2 h-5 w-5"/>No hay revisiones pendientes asignadas.</div>}</CardContent></Card>
    </section>

    <section className="border-t border-border py-9"><div className="mb-5"><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Portafolio completo</p><h2 className="mt-2 text-2xl font-semibold">Todas las decisiones activas</h2></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{items.map(item=><Link key={item.caseRow.id} href={`/casos/${item.caseRow.id}`} className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center justify-between gap-2"><ExecutiveBadge status={item.execStatus}/><Badge variant="outline">{item.caseRow.priority==="high"?"Alta":item.caseRow.priority==="low"?"Baja":"Normal"}</Badge></div><h3 className="mt-4 text-base font-semibold">{item.caseRow.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.intelligence.pendingDecision}</p><div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted-foreground"><span>{item.gov?`${item.approvals}/${item.gov.required_approvals} aprobaciones`:"Sin gobernanza formal"}</span><span>{relative(item.caseRow.updated_at)}</span></div></Link>)}</div></section>
  </div>
}

function Metric({value,label}:{value:number;label:string}){return <div className="rounded-xl bg-background/70 p-4"><div className="text-2xl font-semibold">{value}</div><div className="mt-1 text-xs leading-5 text-muted-foreground">{label}</div></div>}
function ExecutiveBadge({status}:{status:ExecutiveStatus}){const Icon=status==="approved"||status==="ready"?CheckCircle2:status==="blocked"?AlertTriangle:status==="overdue"?Clock3:status==="waiting"?ShieldCheck:BriefcaseBusiness;return <Badge variant={status==="blocked"||status==="overdue"?"destructive":"secondary"}><Icon className="mr-1.5 h-3.5 w-3.5"/>{statusLabel[status]}</Badge>}
function CaseRowView({item}:{item:{caseRow:CaseRow;execStatus:ExecutiveStatus;gov:Governance|undefined;approvals:number;pendingCount:number}}){return <Link href={`/casos/${item.caseRow.id}/revision`} className="flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:bg-secondary/30"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><ExecutiveBadge status={item.execStatus}/>{item.caseRow.priority==="high"&&<Badge variant="outline">Prioridad alta</Badge>}</div><p className="mt-2 truncate text-sm font-medium">{item.caseRow.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.gov?`${item.approvals}/${item.gov.required_approvals} aprobaciones · ${item.pendingCount} pendientes`:"Sin ronda formal"}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground"/></Link>}
function EmptyState(){return <div className="rounded-xl border border-dashed p-8 text-center"><CheckCircle2 className="mx-auto h-5 w-5 text-emerald-600"/><p className="mt-3 text-sm font-medium">No hay casos críticos ahora.</p><p className="mt-1 text-sm text-muted-foreground">El portafolio no tiene bloqueos, vencimientos ni aprobaciones pendientes.</p></div>}
