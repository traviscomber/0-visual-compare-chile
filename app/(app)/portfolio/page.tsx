import Link from "next/link"
import { redirect } from "next/navigation"
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
function governanceState(g:Governance|undefined,reviews:Review[],readiness:string):ExecutiveStatus{if(!g||!g.current_round_id)return readiness==="decision-ready"?"ready":"working";const round=reviews.filter(r=>r.governance_round_id===g.current_round_id);const approved=round.filter(r=>r.status==="approved").length;const blocked=g.block_on_changes&&round.some(r=>r.status==="changes_requested");const overdue=Boolean(g.round_deadline_at&&Date.parse(g.round_deadline_at)<Date.now()&&approved<g.required_approvals);if(blocked)return "blocked";if(approved>=g.required_approvals)return "approved";if(overdue)return "overdue";return "waiting"}

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

  return <div className="min-h-full bg-[#F8FAFC]">
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="grid gap-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:grid-cols-[1.25fr_0.75fr] lg:p-10">
        <div className="self-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0F766E]">Portafolio de decisiones</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">Ve el estado real de cada decisión.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Bloqueos, aprobaciones, vencimientos y casos listos para decidir, sin navegar por múltiples módulos.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild className="bg-[#0F766E] text-white hover:bg-[#134E4A]"><Link href="/casos">Abrir casos <ArrowRight className="ml-2 h-4 w-4"/></Link></Button>
            <Button asChild variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"><Link href="/casos/pendientes">Ver pendientes</Link></Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Metric value={counts.waiting} label="Esperando aprobación" tone="neutral"/>
          <Metric value={counts.blocked} label="Bloqueados" tone="danger"/>
          <Metric value={counts.overdue} label="Vencidos" tone="warning"/>
          <Metric value={counts.ready} label="Listos / aprobados" tone="success"/>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 pb-5">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Atención</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-slate-950">Casos que requieren intervención</h2></div>
            <Link href="/casos" className="inline-flex items-center gap-2 text-sm font-medium text-[#0F766E]">Todos los casos <ArrowRight className="h-4 w-4"/></Link>
          </div>
          <div className="mt-3 divide-y divide-slate-100">{critical.length?critical.map(item=><CaseRowView key={item.caseRow.id} item={item}/>):<EmptyState/>}</div>
        </div>

        <aside className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Equipo</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-slate-950">Dónde se atasca el trabajo</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Revisiones pendientes concentradas por persona.</p>
          <div className="mt-5 space-y-2">{bottlenecks.length?bottlenecks.map((p,index)=><div key={`${p.email}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-900">{p.name}</p><p className="mt-1 truncate text-xs text-slate-500">{p.email||`${p.cases.size} caso${p.cases.size===1?"":"s"}`}</p></div><span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">{p.pending} pendiente{p.pending===1?"":"s"}</span></div>):<div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center"><Users className="mx-auto h-5 w-5 text-slate-400"/><p className="mt-3 text-sm font-medium text-slate-800">Sin revisiones pendientes.</p><p className="mt-1 text-sm text-slate-500">No hay cuellos de botella asignados ahora.</p></div>}</div>
        </aside>
      </section>

      <section className="mt-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Portafolio completo</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-slate-950">Todas las decisiones activas</h2></div><p className="text-sm text-slate-500">{items.length} caso{items.length===1?"":"s"} activo{items.length===1?"":"s"}</p></div>
        {items.length?<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map(item=><Link key={item.caseRow.id} href={`/casos/${item.caseRow.id}`} className="group rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"><div className="flex items-center justify-between gap-2"><ExecutiveBadge status={item.execStatus}/><span className="text-xs font-medium text-slate-400">{item.caseRow.priority==="high"?"Prioridad alta":item.caseRow.priority==="low"?"Prioridad baja":"Prioridad normal"}</span></div><h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-slate-950">{item.caseRow.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{item.intelligence.pendingDecision}</p><div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500"><span>{item.gov?`${item.approvals}/${item.gov.required_approvals} aprobaciones`:"Sin gobernanza formal"}</span><span className="inline-flex items-center gap-1.5">{relative(item.caseRow.updated_at)} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"/></span></div></Link>)}</div>:<div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-10 text-center"><BriefcaseBusiness className="mx-auto h-6 w-6 text-slate-400"/><h3 className="mt-4 text-lg font-semibold text-slate-900">Todavía no hay decisiones activas.</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">Guarda una evaluación, investigación o señal dentro de un caso para construir el portafolio.</p><Button asChild className="mt-5 bg-[#0F766E] hover:bg-[#134E4A]"><Link href="/casos">Crear caso</Link></Button></div>}
      </section>
    </div>
  </div>
}

function Metric({value,label,tone}:{value:number;label:string;tone:"neutral"|"danger"|"warning"|"success"}){const styles={neutral:"bg-slate-50 text-slate-950",danger:"bg-red-50 text-red-900",warning:"bg-amber-50 text-amber-900",success:"bg-emerald-50 text-emerald-900"}[tone];return <div className={`rounded-2xl p-5 ${styles}`}><div className="text-3xl font-semibold tracking-[-0.04em]">{value}</div><div className="mt-2 text-xs leading-5 opacity-70">{label}</div></div>}
function ExecutiveBadge({status}:{status:ExecutiveStatus}){const Icon=status==="approved"||status==="ready"?CheckCircle2:status==="blocked"?AlertTriangle:status==="overdue"?Clock3:status==="waiting"?ShieldCheck:BriefcaseBusiness;const styles=status==="blocked"?"border-red-200 bg-red-50 text-red-700":status==="overdue"?"border-amber-200 bg-amber-50 text-amber-700":status==="approved"||status==="ready"?"border-emerald-200 bg-emerald-50 text-emerald-700":"border-slate-200 bg-slate-50 text-slate-600";return <Badge variant="outline" className={styles}><Icon className="mr-1.5 h-3.5 w-3.5"/>{statusLabel[status]}</Badge>}
function CaseRowView({item}:{item:{caseRow:CaseRow;execStatus:ExecutiveStatus;gov:Governance|undefined;approvals:number;pendingCount:number}}){return <Link href={`/casos/${item.caseRow.id}/revision`} className="group flex items-center gap-4 py-4 first:pt-1 last:pb-1"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50"><BriefcaseBusiness className="h-4 w-4 text-slate-500"/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><ExecutiveBadge status={item.execStatus}/>{item.caseRow.priority==="high"?<span className="text-xs font-medium text-red-600">Prioridad alta</span>:null}</div><p className="mt-2 truncate text-sm font-semibold text-slate-900">{item.caseRow.title}</p><p className="mt-1 text-xs text-slate-500">{item.gov?`${item.approvals}/${item.gov.required_approvals} aprobaciones · ${item.pendingCount} pendientes`:"Sin ronda formal"}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1"/></Link>}
function EmptyState(){return <div className="py-12 text-center"><CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600"/><p className="mt-3 text-sm font-semibold text-slate-900">No hay casos críticos ahora.</p><p className="mt-1 text-sm text-slate-500">Sin bloqueos, vencimientos ni aprobaciones pendientes.</p></div>}
