import Link from "next/link"
import { redirect } from "next/navigation"
import { AlertTriangle, ArrowRight, BellRing, BriefcaseBusiness, CheckCircle2, Clock3, Eye, Search, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { buildCaseIntelligence, type CaseItemType, type CaseStatus } from "@/lib/cases/intelligence"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

type Comparison = { id:string; similarity_score:number|null; classification:string|null; recommendation:string|null; created_at:string }
type Research = { id:string; query:string; search_type:string; results_count:number; status:string; created_at:string }
type Watch = { id:string; watch_type:"company"|"ipc"; query:string; is_active:boolean; last_checked_at:string }
type Signal = { id:string; title:string; applicants:string|null; detected_at:string; read_at:string|null }
type CaseItem = { item_type:CaseItemType; title:string; created_at:string; metadata:Record<string,unknown>|null }
type CaseRow = { id:string; title:string; status:CaseStatus; priority:"low"|"normal"|"high"; context_type:string; decision_summary:string|null; notes:string|null; last_reviewed_at:string|null; updated_at:string; case_items:CaseItem[]|null }

function isHighRisk(row:Comparison){return row.classification==="exact_match"||row.classification==="near_duplicate"||Number(row.similarity_score??0)>=85}
function relative(value?:string|null){if(!value)return "Sin fecha";const date=new Date(value);if(Number.isNaN(date.getTime()))return value;const diff=Date.now()-date.getTime();const mins=Math.max(0,Math.floor(diff/60000));if(mins<1)return "Ahora";if(mins<60)return `Hace ${mins} min`;const hours=Math.floor(mins/60);if(hours<24)return `Hace ${hours} h`;const days=Math.floor(hours/24);if(days<7)return `Hace ${days} d`;return new Intl.DateTimeFormat("es-CL",{dateStyle:"medium"}).format(date)}
function stale(value:string){return Date.now()-Date.parse(value)>14*86400000}

export default async function DashboardPage(){
  const supabase=await createClient()
  const {data:auth}=await supabase.auth.getUser()
  const user=auth.user
  if(!user)redirect("/auth/login?redirectTo=%2Fdashboard")

  const [comparisonResult,researchResult,watchResult,signalResult,caseResult]=await Promise.all([
    supabase.from("comparisons").select("id,similarity_score,classification,recommendation,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(8),
    supabase.from("search_history").select("id,query,search_type,results_count,status,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(8),
    supabase.from("patent_watches").select("id,watch_type,query,is_active,last_checked_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(20),
    supabase.from("patent_alert_events").select("id,title,applicants,detected_at,read_at").eq("user_id",user.id).order("detected_at",{ascending:false}).limit(20),
    supabase.from("cases").select("id,title,status,priority,context_type,decision_summary,notes,last_reviewed_at,updated_at,case_items(item_type,title,created_at,metadata)").eq("user_id",user.id).neq("status","archived").order("updated_at",{ascending:false}).limit(20),
  ])

  const comparisons=(comparisonResult.data??[]) as Comparison[]
  const research=(researchResult.data??[]) as Research[]
  const watches=(watchResult.data??[]) as Watch[]
  const signals=(signalResult.data??[]) as Signal[]
  const cases=(caseResult.data??[]) as CaseRow[]
  const unread=signals.filter(item=>!item.read_at)
  const highRisk=comparisons.filter(isHighRisk)
  const activeWatches=watches.filter(item=>item.is_active)

  const caseInsights=cases.map(caseRow=>({caseRow,intelligence:buildCaseIntelligence({status:caseRow.status,contextType:caseRow.context_type,decisionSummary:caseRow.decision_summary,notes:caseRow.notes,lastReviewedAt:caseRow.last_reviewed_at,items:(caseRow.case_items??[]).map(item=>({item_type:item.item_type,title:item.title,created_at:item.created_at,metadata:item.metadata??{}}))})}))
  const changed=caseInsights.filter(item=>item.intelligence.newEvidenceCount>0)
  const ready=caseInsights.filter(item=>item.intelligence.readiness==="decision-ready")
  const stalled=caseInsights.filter(item=>["open","review"].includes(item.caseRow.status)&&stale(item.caseRow.updated_at))
  const attention=changed.length+ready.length+stalled.length+unread.length+highRisk.length
  const displayName=(typeof user.user_metadata?.full_name==="string"&&user.user_metadata.full_name)||(typeof user.user_metadata?.name==="string"&&user.user_metadata.name)||user.email?.split("@")[0]||"equipo"

  const queue=[
    ...changed.slice(0,2).map(item=>({href:`/casos/${item.caseRow.id}`,icon:BriefcaseBusiness,kicker:"Evidencia nueva",title:item.caseRow.title,detail:`${item.intelligence.newEvidenceCount} evidencia${item.intelligence.newEvidenceCount===1?"":"s"} nueva${item.intelligence.newEvidenceCount===1?"":"s"} desde la última revisión.`,action:"Revisar caso",tone:"teal" as const})),
    ...ready.slice(0,2).map(item=>({href:`/casos/${item.caseRow.id}`,icon:CheckCircle2,kicker:"Listo para decidir",title:item.caseRow.title,detail:item.intelligence.pendingDecision,action:"Preparar decisión",tone:"teal" as const})),
    ...unread.slice(0,2).map(item=>({href:"/monitorear",icon:BellRing,kicker:"Nueva señal",title:item.title,detail:item.applicants||"Solicitante no informado",action:"Revisar señal",tone:"amber" as const})),
    ...highRisk.slice(0,1).map(item=>({href:"/history?min=85",icon:AlertTriangle,kicker:"Evaluación prioritaria",title:item.recommendation||"Coincidencia que merece revisión",detail:`Similitud ${Math.round(Number(item.similarity_score??0))}%`,action:"Abrir evaluación",tone:"amber" as const})),
    ...stalled.slice(0,1).map(item=>({href:`/casos/${item.caseRow.id}`,icon:Clock3,kicker:"Sin movimiento",title:item.caseRow.title,detail:`Última actividad ${relative(item.caseRow.updated_at).toLowerCase()}.`,action:"Retomar caso",tone:"neutral" as const})),
  ].slice(0,6)

  const latestResearch=research[0]??null
  const latestSignal=signals[0]??null

  return <div className="mx-auto w-full max-w-[1380px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
    <header className="grid gap-8 border-b border-slate-200 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
      <div className="max-w-4xl">
        <p className="text-sm font-semibold text-teal-700">Resumen de decisiones</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-[3.5rem]">{attention?"Esto requiere tu atención.":"Todo está bajo control."}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Hola, {displayName}. Aquí sólo aparece trabajo que cambia una decisión: evidencia nueva, señales, casos listos o asuntos que se están quedando atrás.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline"><Link href="/casos">Ver casos</Link></Button>
        <Button asChild className="bg-teal-700 hover:bg-teal-800"><Link href="/evaluar">Nueva búsqueda <Search className="ml-2 h-4 w-4"/></Link></Button>
      </div>
    </header>

    <section className="grid border-b border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
      <Metric value={changed.length} label="Casos con cambios" detail="Evidencia desde la última revisión"/>
      <Metric value={ready.length} label="Listos para decidir" detail="Con contexto suficiente"/>
      <Metric value={unread.length} label="Señales nuevas" detail="Aún no revisadas"/>
      <Metric value={activeWatches.length} label="Vigilancias activas" detail="Siguiendo cambios"/>
    </section>

    <section className="py-10">
      <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Bandeja prioritaria</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Qué conviene resolver ahora</h2></div>{attention===0?<Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Sin pendientes críticos</Badge>:<span className="text-sm text-slate-500">{attention} señales de atención</span>}</div>
      {queue.length?<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">{queue.map((item,index)=>{const Icon=item.icon;return <Link key={`${item.href}-${index}`} href={item.href} className="group grid gap-4 border-b border-slate-100 p-5 transition-colors last:border-0 hover:bg-slate-50 sm:grid-cols-[42px_1fr_auto] sm:items-center"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.tone==="teal"?"bg-teal-50 text-teal-700":item.tone==="amber"?"bg-amber-50 text-amber-700":"bg-slate-100 text-slate-600"}`}><Icon className="h-4 w-4"/></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{item.kicker}</span></div><h3 className="mt-1 font-semibold text-slate-950">{item.title}</h3><p className="mt-1 text-sm text-slate-600">{item.detail}</p></div><span className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700">{item.action}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></span></Link>})}</div>:<div className="rounded-2xl border border-slate-200 bg-white p-8"><div className="flex items-start gap-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-5 w-5"/></span><div><h3 className="font-semibold text-slate-950">No hay nada urgente.</h3><p className="mt-1 text-sm text-slate-600">Puedes iniciar una nueva búsqueda o ampliar las vigilancias existentes.</p></div></div></div>}
    </section>

    <section className="grid gap-8 border-t border-slate-200 py-10 lg:grid-cols-[1.35fr_0.65fr]">
      <div><div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Casos activos</p><h2 className="mt-2 text-xl font-semibold text-slate-950">Decisiones en curso</h2></div><Link href="/casos" className="text-sm font-semibold text-teal-700">Ver todos</Link></div>{caseInsights.length?<div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">{caseInsights.slice(0,5).map(({caseRow,intelligence})=><Link key={caseRow.id} href={`/casos/${caseRow.id}`} className="group grid gap-3 p-5 hover:bg-slate-50 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex flex-wrap gap-2"><Badge variant="outline">{readinessLabel(intelligence.readiness)}</Badge>{intelligence.newEvidenceCount>0?<Badge className="bg-teal-50 text-teal-700 hover:bg-teal-50">+{intelligence.newEvidenceCount} nueva{intelligence.newEvidenceCount===1?"":"s"}</Badge>:null}</div><h3 className="mt-3 font-semibold text-slate-950">{caseRow.title}</h3><p className="mt-1 text-sm text-slate-600">{intelligence.pendingDecision}</p></div><div className="flex items-center gap-3 text-xs text-slate-400"><span>{relative(caseRow.updated_at)}</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></div></Link>)}</div>:<Empty href="/casos" icon={BriefcaseBusiness} title="No hay casos activos" action="Crear caso"/>}</div>

      <aside><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Contexto reciente</p><h2 className="mt-2 text-xl font-semibold text-slate-950">Última actividad</h2><div className="mt-5 space-y-3">{latestResearch?<ContextRow icon={Search} title={`Búsqueda: ${latestResearch.query}`} detail={`${latestResearch.results_count} resultados`} href={`/investigar?q=${encodeURIComponent(latestResearch.query)}`}/>:null}{latestSignal?<ContextRow icon={BellRing} title={latestSignal.title} detail={latestSignal.applicants||"Nueva señal"} href="/monitorear"/>:null}{activeWatches.length?<ContextRow icon={Eye} title={`${activeWatches.length} vigilancia${activeWatches.length===1?"":"s"} activa${activeWatches.length===1?"":"s"}`} detail="Revisar radar" href="/monitorear"/>:null}{!latestResearch&&!latestSignal&&!activeWatches.length?<Empty href="/evaluar" icon={Search} title="Aún no hay actividad" action="Empezar"/>:null}</div></aside>
    </section>
  </div>
}

function readinessLabel(value:"early"|"developing"|"decision-ready"|"decided"){return value==="early"?"Inicial":value==="developing"?"En análisis":value==="decision-ready"?"Listo para decidir":"Decisión registrada"}
function Metric({value,label,detail}:{value:number;label:string;detail:string}){return <div className="border-b border-slate-200 py-6 sm:border-b-0 sm:border-r sm:px-5 first:pl-0 last:border-r-0"><p className="text-3xl font-semibold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-sm font-semibold text-slate-700">{label}</p><p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p></div>}
function ContextRow({icon:Icon,title,detail,href}:{icon:typeof Search;title:string;detail:string;href:string}){return <Link href={href} className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Icon className="h-4 w-4"/></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{title}</p><p className="mt-0.5 truncate text-xs text-slate-500">{detail}</p></div><ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1"/></Link>}
function Empty({href,icon:Icon,title,action}:{href:string;icon:typeof Search;title:string;action:string}){return <div className="rounded-2xl border border-dashed border-slate-300 p-7 text-center"><Icon className="mx-auto h-5 w-5 text-slate-400"/><p className="mt-3 text-sm font-semibold text-slate-800">{title}</p><Button asChild size="sm" variant="outline" className="mt-4"><Link href={href}>{action}</Link></Button></div>}
