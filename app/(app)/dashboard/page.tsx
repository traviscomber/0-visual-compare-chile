import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, BellRing, BriefcaseBusiness, CheckCircle2, Clock3, Eye, Search } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { buildCaseIntelligence, type CaseItemType, type CaseStatus } from "@/lib/cases/intelligence"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

type Research = { id:string; query:string; search_type:string; results_count:number; status:string; created_at:string }
type Watch = { id:string; watch_type:"brand"|"owner"; query:string; is_active:boolean; last_checked_at:string|null; last_reviewed_at:string|null }
type Signal = { id:string; source:"INAPI"|"TDPI"; watch_id:string; mark_name:string; applicant_name:string|null; relevance:"alta"|"media"; reason:string; first_seen_at:string }
type CaseItem = { item_type:CaseItemType; title:string; created_at:string; metadata:Record<string,unknown>|null }
type CaseRow = { id:string; title:string; status:CaseStatus; priority:"low"|"normal"|"high"; context_type:string; decision_summary:string|null; notes:string|null; last_reviewed_at:string|null; updated_at:string; case_items:CaseItem[]|null }

function relative(value?:string|null){if(!value)return "Sin fecha";const date=new Date(value);if(Number.isNaN(date.getTime()))return value;const diff=Date.now()-date.getTime();const mins=Math.max(0,Math.floor(diff/60000));if(mins<1)return "Ahora";if(mins<60)return `Hace ${mins} min`;const hours=Math.floor(mins/60);if(hours<24)return `Hace ${hours} h`;const days=Math.floor(hours/24);if(days<7)return `Hace ${days} d`;return new Intl.DateTimeFormat("es-CL",{dateStyle:"medium"}).format(date)}
function stale(value:string){return Date.now()-Date.parse(value)>14*86400000}

export default async function DashboardPage(){
  const supabase=await createClient()
  const {data:auth}=await supabase.auth.getUser()
  const user=auth.user
  if(!user)redirect("/auth/login?redirectTo=%2Fdashboard")

  const [researchResult,watchResult,signalResult,caseResult]=await Promise.all([
    supabase.from("search_history").select("id,query,search_type,results_count,status,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(8),
    supabase.from("trademark_watches").select("id,watch_type,query,is_active,last_checked_at,last_reviewed_at").eq("user_id",user.id).order("updated_at",{ascending:false}).limit(40),
    supabase.from("trademark_watch_signal_events").select("id,source,watch_id,mark_name,applicant_name,relevance,reason,first_seen_at").eq("user_id",user.id).order("first_seen_at",{ascending:false}).limit(50),
    supabase.from("cases").select("id,title,status,priority,context_type,decision_summary,notes,last_reviewed_at,updated_at,case_items(item_type,title,created_at,metadata)").eq("user_id",user.id).neq("status","archived").order("updated_at",{ascending:false}).limit(20),
  ])

  const research=(researchResult.data??[]) as Research[]
  const watches=(watchResult.data??[]) as Watch[]
  const signals=(signalResult.data??[]) as Signal[]
  const cases=(caseResult.data??[]) as CaseRow[]
  const activeWatches=watches.filter(item=>item.is_active)
  const watchMap=new Map(watches.map(item=>[item.id,item]))
  const newSignals=signals.filter(signal=>{const watch=watchMap.get(signal.watch_id);if(!watch?.is_active)return false;if(!watch.last_reviewed_at)return false;return Date.parse(signal.first_seen_at)>Date.parse(watch.last_reviewed_at)})

  const caseInsights=cases.map(caseRow=>({caseRow,intelligence:buildCaseIntelligence({status:caseRow.status,contextType:caseRow.context_type,decisionSummary:caseRow.decision_summary,notes:caseRow.notes,lastReviewedAt:caseRow.last_reviewed_at,items:(caseRow.case_items??[]).map(item=>({item_type:item.item_type,title:item.title,created_at:item.created_at,metadata:item.metadata??{}}))})}))
  const changed=caseInsights.filter(item=>item.intelligence.newEvidenceCount>0)
  const ready=caseInsights.filter(item=>item.intelligence.readiness==="decision-ready")
  const stalled=caseInsights.filter(item=>["open","review"].includes(item.caseRow.status)&&stale(item.caseRow.updated_at))
  const attention=changed.length+ready.length+stalled.length+newSignals.length
  const displayName=(typeof user.user_metadata?.full_name==="string"&&user.user_metadata.full_name)||(typeof user.user_metadata?.name==="string"&&user.user_metadata.name)||user.email?.split("@")[0]||"equipo"

  const queue=[
    ...changed.slice(0,2).map(item=>({href:`/casos/${item.caseRow.id}`,icon:BriefcaseBusiness,kicker:"Evidencia nueva",title:item.caseRow.title,detail:`${item.intelligence.newEvidenceCount} evidencia${item.intelligence.newEvidenceCount===1?"":"s"} nueva${item.intelligence.newEvidenceCount===1?"":"s"} desde la última revisión.`,action:"Revisar caso",tone:"primary" as const})),
    ...ready.slice(0,2).map(item=>({href:`/casos/${item.caseRow.id}`,icon:CheckCircle2,kicker:"Listo para decidir",title:item.caseRow.title,detail:item.intelligence.pendingDecision,action:"Preparar decisión",tone:"primary" as const})),
    ...newSignals.slice(0,2).map(item=>({href:"/monitorear",icon:BellRing,kicker:`${item.source} · Nueva señal`,title:item.mark_name,detail:item.reason||item.applicant_name||"Antecedente nuevo en vigilancia.",action:"Revisar señal",tone:item.relevance==="alta"?"warm" as const:"neutral" as const})),
    ...stalled.slice(0,1).map(item=>({href:`/casos/${item.caseRow.id}`,icon:Clock3,kicker:"Sin movimiento",title:item.caseRow.title,detail:`Última actividad ${relative(item.caseRow.updated_at).toLowerCase()}.`,action:"Retomar caso",tone:"neutral" as const})),
  ].slice(0,6)

  const latestResearch=research[0]??null
  const latestSignal=signals.find(signal=>activeWatches.some(watch=>watch.id===signal.watch_id))??null

  return <OperationalPage>
    <OperationalHeader
      eyebrow="VIDENTIA / Resumen"
      title={attention?"Hay decisiones que requieren revisión.":"No hay cambios que requieran atención."}
      description={<>Hola, {displayName}. Este resumen sólo reúne evidencia nueva, señales marcarias, casos listos y trabajo que perdió movimiento.</>}
      actions={<><Button asChild variant="outline"><Link href="/casos">Ver casos</Link></Button><Button asChild><Link href="/investigar">Nueva investigación <Search className="ml-1 h-4 w-4"/></Link></Button></>}
    />

    <OperationalMetricRail>
      <OperationalMetric value={changed.length} label="Casos con cambios" detail="Evidencia desde la última revisión"/>
      <OperationalMetric value={ready.length} label="Listos para decidir" detail="Con contexto suficiente para revisión"/>
      <OperationalMetric value={newSignals.length} label="Señales nuevas" detail="INAPI o TDPI aún no revisadas" tone={newSignals.length?"warning":"neutral"}/>
      <OperationalMetric value={activeWatches.length} label="Vigilancias activas" detail="Marcas y titulares en seguimiento" tone={activeWatches.length?"success":"neutral"}/>
    </OperationalMetricRail>

    <section className="border-b border-border/80 py-9">
      <OperationalSectionHeader
        eyebrow="Bandeja prioritaria"
        title="Qué conviene resolver ahora"
        action={attention===0?<Badge variant="outline" className="bg-[#173B37] text-[#96B5A6]">Sin novedades pendientes</Badge>:<span className="text-sm text-muted-foreground">{attention} elemento{attention===1?"":"s"} de atención</span>}
      />
      {queue.length?<div className="mt-5 divide-y divide-border/80 border-y border-border/80">{queue.map((item,index)=>{const Icon=item.icon;return <Link key={`${item.href}-${index}`} href={item.href} className="group grid gap-4 px-2 py-5 outline-none transition-colors hover:bg-secondary/55 focus-visible:bg-secondary/55 sm:grid-cols-[40px_1fr_auto] sm:items-center"><span className={`flex h-9 w-9 items-center justify-center rounded-[9px] ${item.tone==="primary"?"bg-[#173B37] text-[#96B5A6]":item.tone==="warm"?"bg-[#332C24] text-[#D6A46F]":"bg-[#13272D] text-muted-foreground"}`}><Icon className="h-4 w-4"/></span><div className="min-w-0"><p className="text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground">{item.kicker}</p><h3 className="mt-1 font-medium text-white">{item.title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.detail}</p></div><span className="inline-flex items-center gap-2 text-sm font-medium text-white">{item.action}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></span></Link>})}</div>:<div className="mt-5 border-y border-border/80 py-8"><div className="flex items-start gap-4"><span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#173B37] text-[#96B5A6]"><CheckCircle2 className="h-4 w-4"/></span><div><h3 className="font-medium text-white">No hay nada urgente.</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Puedes iniciar una investigación o revisar las vigilancias activas.</p></div></div></div>}
    </section>

    <section className="grid gap-8 py-9 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] lg:gap-10">
      <div>
        <OperationalSectionHeader eyebrow="Casos activos" title="Decisiones en curso" action={<Link href="/casos" className="text-sm font-medium text-white hover:text-[#96B5A6]">Ver todos</Link>} />
        {caseInsights.length?<div className="mt-5 divide-y divide-border/80 border-y border-border/80">{caseInsights.slice(0,5).map(({caseRow,intelligence})=><Link key={caseRow.id} href={`/casos/${caseRow.id}`} className="group grid gap-3 px-2 py-5 outline-none transition-colors hover:bg-secondary/55 focus-visible:bg-secondary/55 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex flex-wrap gap-2"><Badge variant="outline" className="bg-[#13272D]">{readinessLabel(intelligence.readiness)}</Badge>{intelligence.newEvidenceCount>0?<Badge className="bg-[#173B37] text-[#96B5A6] hover:bg-[#173B37]">+{intelligence.newEvidenceCount} nueva{intelligence.newEvidenceCount===1?"":"s"}</Badge>:null}</div><h3 className="mt-3 font-medium text-white">{caseRow.title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{intelligence.pendingDecision}</p></div><div className="flex items-center gap-3 text-xs text-muted-foreground"><span>{relative(caseRow.updated_at)}</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></div></Link>)}</div>:<Empty href="/casos" icon={BriefcaseBusiness} title="No hay casos activos" action="Crear caso"/>}
      </div>

      <aside>
        <OperationalPanel>
          <OperationalSectionHeader eyebrow="Contexto reciente" title="Última actividad" />
          <div className="mt-5 divide-y divide-border/80 border-t border-border/80">{latestResearch?<ContextRow icon={Search} title={`Búsqueda: ${latestResearch.query}`} detail={`${latestResearch.results_count} resultados`} href={`/investigar?q=${encodeURIComponent(latestResearch.query)}`}/>:null}{latestSignal?<ContextRow icon={BellRing} title={latestSignal.mark_name} detail={`${latestSignal.source} · ${watchMap.get(latestSignal.watch_id)?.query??"Vigilancia"}`} href="/monitorear"/>:null}{activeWatches.length?<ContextRow icon={Eye} title={`${activeWatches.length} vigilancia${activeWatches.length===1?"":"s"} activa${activeWatches.length===1?"":"s"}`} detail="Revisar línea de tiempo" href="/monitorear"/>:null}{!latestResearch&&!latestSignal&&!activeWatches.length?<Empty href="/investigar" icon={Search} title="Aún no hay actividad" action="Empezar" compact/>:null}</div>
        </OperationalPanel>
      </aside>
    </section>
  </OperationalPage>
}

function readinessLabel(value:"early"|"developing"|"decision-ready"|"decided"){return value==="early"?"Inicial":value==="developing"?"En análisis":value==="decision-ready"?"Listo para decidir":"Decisión registrada"}
function ContextRow({icon:Icon,title,detail,href}:{icon:typeof Search;title:string;detail:string;href:string}){return <Link href={href} className="group flex items-center gap-3 py-4 outline-none transition-colors hover:text-white focus-visible:text-white"><span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#172F34] text-muted-foreground"><Icon className="h-3.5 w-3.5"/></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{title}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{detail}</p></div><ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1"/></Link>}
function Empty({href,icon:Icon,title,action,compact=false}:{href:string;icon:typeof Search;title:string;action:string;compact?:boolean}){return <div className={compact?"py-7":"mt-5 border-y border-border/80 py-9"}><Icon className="h-5 w-5 text-muted-foreground"/><p className="mt-3 text-sm font-medium text-white">{title}</p><Link href={href} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#96B5A6] hover:text-white">{action}<ArrowRight className="h-3.5 w-3.5"/></Link></div>}
