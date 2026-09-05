import Link from "next/link"
import { redirect } from "next/navigation"
import { AlertTriangle, ArrowRight, BriefcaseBusiness, CheckCircle2, Clock3, ShieldCheck, Users } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { buildCaseIntelligence, type CaseItemType, type CaseStatus } from "@/lib/cases/intelligence"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

type CaseItem = { item_type:CaseItemType; title:string; created_at:string; metadata:Record<string,unknown>|null }
type CaseRow = { id:string; user_id:string; title:string; status:CaseStatus; priority:"low"|"normal"|"high"; context_type:string; decision_summary:string|null; notes:string|null; last_reviewed_at:string|null; updated_at:string; case_items:CaseItem[]|null }
type Governance = { case_id:string; required_approvals:number; current_round_id:string|null; round_deadline_at:string|null; block_on_changes:boolean }
type Review = { case_id:string; reviewer_id:string; status:"pending"|"approved"|"changes_requested"|"cancelled"; governance_round_id:string|null }
type Member = { case_id:string; user_id:string; display_name:string; email:string; role:string; is_owner:boolean }
type ExecutiveStatus = "approved"|"blocked"|"overdue"|"waiting"|"ready"|"working"

type PortfolioItem = {
  caseRow: CaseRow
  intelligence: ReturnType<typeof buildCaseIntelligence>
  execStatus: ExecutiveStatus
  gov: Governance|undefined
  approvals: number
  pendingCount: number
}

const statusLabel:Record<ExecutiveStatus,string>={approved:"Aprobado",blocked:"Bloqueado",overdue:"Vencido",waiting:"Esperando aprobación",ready:"Listo",working:"En curso"}
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

  let governance:Governance[]=[]
  let reviews:Review[]=[]
  let members:Member[]=[]
  if(caseIds.length){
    const [governanceResult,reviewResult,memberResult]=await Promise.all([
      supabase.from("case_governance").select("case_id,required_approvals,current_round_id,round_deadline_at,block_on_changes").in("case_id",caseIds),
      supabase.from("case_review_requests").select("case_id,reviewer_id,status,governance_round_id").in("case_id",caseIds),
      supabase.rpc("get_case_members_batch",{p_case_ids:caseIds}),
    ])
    if(governanceResult.error||reviewResult.error||memberResult.error)throw new Error("No pudimos cargar el estado ejecutivo del portafolio.")
    governance=(governanceResult.data??[]) as Governance[]
    reviews=(reviewResult.data??[]) as Review[]
    members=(memberResult.data??[]) as Member[]
  }

  const govMap=new Map(governance.map(g=>[g.case_id,g]))
  const reviewsByCase=new Map<string,Review[]>()
  for(const review of reviews)reviewsByCase.set(review.case_id,[...(reviewsByCase.get(review.case_id)??[]),review])
  const membersByCase=new Map<string,Member[]>()
  for(const member of members)membersByCase.set(member.case_id,[...(membersByCase.get(member.case_id)??[]),member])
  const people=new Map<string,{name:string;email:string;pending:number;cases:Set<string>}>()

  const items:PortfolioItem[]=cases.map(caseRow=>{
    const intelligence=buildCaseIntelligence({status:caseRow.status,contextType:caseRow.context_type,decisionSummary:caseRow.decision_summary,notes:caseRow.notes,lastReviewedAt:caseRow.last_reviewed_at,items:(caseRow.case_items??[]).map(item=>({item_type:item.item_type,title:item.title,created_at:item.created_at,metadata:item.metadata??{}}))})
    const caseReviews=reviewsByCase.get(caseRow.id)??[]
    const gov=govMap.get(caseRow.id)
    const execStatus=governanceState(gov,caseReviews,intelligence.readiness)
    const roundReviews=gov?.current_round_id?caseReviews.filter(r=>r.governance_round_id===gov.current_round_id):[]
    const approvals=roundReviews.filter(r=>r.status==="approved").length
    const pending=roundReviews.filter(r=>r.status==="pending")
    const caseMembers=new Map((membersByCase.get(caseRow.id)??[]).map(member=>[member.user_id,member]))
    for(const review of pending){
      const member=caseMembers.get(review.reviewer_id)
      const current=people.get(review.reviewer_id)??{name:member?.display_name||member?.email||"Participante",email:member?.email||"",pending:0,cases:new Set<string>()}
      current.pending+=1
      current.cases.add(caseRow.id)
      people.set(review.reviewer_id,current)
    }
    return {caseRow,intelligence,execStatus,gov,approvals,pendingCount:pending.length}
  }).sort((a,b)=>statusRank[a.execStatus]-statusRank[b.execStatus]||({high:0,normal:1,low:2}[a.caseRow.priority]-{high:0,normal:1,low:2}[b.caseRow.priority]))

  const counts={waiting:items.filter(i=>i.execStatus==="waiting").length,blocked:items.filter(i=>i.execStatus==="blocked").length,overdue:items.filter(i=>i.execStatus==="overdue").length,ready:items.filter(i=>i.execStatus==="ready"||i.execStatus==="approved").length}
  const bottlenecks=[...people.values()].sort((a,b)=>b.pending-a.pending).slice(0,6)
  const critical=items.filter(i=>["blocked","overdue"].includes(i.execStatus)).slice(0,8)
  const interruptions=counts.blocked+counts.overdue
  const headline=interruptions?`${interruptions} caso${interruptions===1?"":"s"} requiere${interruptions===1?"":"n"} intervención ejecutiva.`:counts.waiting?`${counts.waiting} caso${counts.waiting===1?"":"s"} espera${counts.waiting===1?"":"n"} aprobación.`:"El portafolio no tiene bloqueos pendientes."

  return <OperationalPage>
    <OperationalHeader
      eyebrow="VIDENTIA / Portafolio"
      title={headline}
      description={<>Primero resuelve bloqueos y vencimientos. Después revisa rondas abiertas, decisiones listas y trabajo en curso. Los estados se derivan del expediente y de las revisiones registradas, no de un score opaco.</>}
      actions={<><Button asChild variant="outline"><Link href="/casos/pendientes">Mis pendientes</Link></Button><Button asChild><Link href="/casos">Abrir casos <ArrowRight className="ml-1 h-4 w-4"/></Link></Button></>}
    />

    <OperationalMetricRail>
      <OperationalMetric value={interruptions} label="Para actuar" detail={`${counts.blocked} bloqueados · ${counts.overdue} vencidos`} tone={interruptions?"warning":"success"}/>
      <OperationalMetric value={counts.waiting} label="Esperando aprobación" detail="Rondas abiertas sin quórum" tone={counts.waiting?"warning":"neutral"}/>
      <OperationalMetric value={counts.ready} label="Listos o aprobados" detail="Con decisión preparada o quórum" tone={counts.ready?"success":"neutral"}/>
      <OperationalMetric value={items.length} label="Decisiones activas" detail="Casos no archivados en el portafolio"/>
    </OperationalMetricRail>

    <section className="grid gap-8 border-b border-border/80 py-9 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] xl:gap-10">
      <div>
        <OperationalSectionHeader eyebrow="Intervención inmediata" title="Bloqueos y vencimientos" meta={`${critical.length} visibles`} />
        <div className="mt-5 divide-y divide-border/80 border-y border-border/80">{critical.length?critical.map(item=><CaseRowView key={item.caseRow.id} item={item}/>):<EmptyState/>}</div>
      </div>

      <aside>
        <OperationalPanel>
          <OperationalSectionHeader eyebrow="Equipo" title="Revisiones pendientes" meta={`${bottlenecks.length} personas`} />
          <div className="mt-5 divide-y divide-border/80 border-t border-border/80">{bottlenecks.length?bottlenecks.map((person,index)=><div key={`${person.email}-${index}`} className="flex items-center justify-between gap-4 py-4"><div className="min-w-0"><p className="truncate text-sm font-medium text-white">{person.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{person.email||`${person.cases.size} caso${person.cases.size===1?"":"s"}`}</p></div><span className="shrink-0 text-xs font-medium text-muted-foreground">{person.pending} pendiente{person.pending===1?"":"s"}</span></div>):<div className="py-7"><Users className="h-5 w-5 text-muted-foreground"/><p className="mt-3 text-sm font-medium text-white">Sin revisiones pendientes.</p><p className="mt-1 text-sm leading-6 text-muted-foreground">No hay tareas de aprobación esperando ahora.</p></div>}</div>
        </OperationalPanel>
      </aside>
    </section>

    <section className="py-9">
      <OperationalSectionHeader eyebrow="Registro ejecutivo" title="Decisiones activas" meta={`${items.length} caso${items.length===1?"":"s"}`} />
      {items.length?<div className="mt-5 divide-y divide-border/80 border-y border-border/80">{items.map(item=><Link key={item.caseRow.id} href={`/casos/${item.caseRow.id}`} className="group grid gap-4 px-2 py-5 outline-none transition-colors hover:bg-secondary/55 focus-visible:bg-secondary/55 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><ExecutiveBadge status={item.execStatus}/>{item.caseRow.priority==="high"?<Badge className="rounded-md border-[#D6A46F]/20 bg-[#332C24]/55 text-[#E0B987] hover:bg-[#332C24]/55">Prioridad alta</Badge>:null}</div><h3 className="mt-3 text-lg font-medium text-white">{item.caseRow.title}</h3><p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{item.intelligence.pendingDecision}</p></div><div className="flex items-center gap-5 text-xs text-muted-foreground"><span>{item.gov?`${item.approvals}/${item.gov.required_approvals} aprobaciones`:"Sin ronda activa"}</span><span>{relative(item.caseRow.updated_at)}</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></div></Link>)}</div>:<div className="mt-5 border-y border-border/80 py-10 sm:py-12"><BriefcaseBusiness className="h-6 w-6 text-muted-foreground"/><h3 className="mt-4 font-medium text-white">Todavía no hay decisiones activas.</h3><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Guarda una evaluación, investigación o señal dentro de un caso para construir el portafolio.</p><Button asChild variant="outline" className="mt-5"><Link href="/casos">Crear caso</Link></Button></div>}
    </section>
  </OperationalPage>
}

function ExecutiveBadge({status}:{status:ExecutiveStatus}){const Icon=status==="approved"||status==="ready"?CheckCircle2:status==="blocked"?AlertTriangle:status==="overdue"?Clock3:status==="waiting"?ShieldCheck:BriefcaseBusiness;const styles=status==="blocked"||status==="overdue"?"border-[#D6A46F]/20 bg-[#332C24]/55 text-[#E0B987]":status==="approved"||status==="ready"?"border-primary/20 bg-primary/[0.07] text-primary":"border-border bg-card/30 text-muted-foreground";return <Badge variant="outline" className={`rounded-md ${styles}`}><Icon className="mr-1.5 h-3.5 w-3.5"/>{statusLabel[status]}</Badge>}
function CaseRowView({item}:{item:PortfolioItem}){return <Link href={`/casos/${item.caseRow.id}/revision`} className="group grid gap-3 px-2 py-5 outline-none transition-colors hover:bg-secondary/55 focus-visible:bg-secondary/55 sm:grid-cols-[1fr_auto] sm:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><ExecutiveBadge status={item.execStatus}/>{item.caseRow.priority==="high"?<span className="text-xs font-medium text-[#E0B987]">Prioridad alta</span>:null}</div><p className="mt-3 truncate text-sm font-medium text-white">{item.caseRow.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.gov?`${item.approvals}/${item.gov.required_approvals} aprobaciones · ${item.pendingCount} pendientes`:"Sin ronda activa"}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1"/></Link>}
function EmptyState(){return <div className="py-9"><CheckCircle2 className="h-5 w-5 text-primary"/><p className="mt-3 text-sm font-medium text-white">Nada requiere intervención ahora.</p><p className="mt-1 text-sm leading-6 text-muted-foreground">No hay bloqueos ni vencimientos. Las aprobaciones pendientes continúan en su flujo normal.</p></div>}
