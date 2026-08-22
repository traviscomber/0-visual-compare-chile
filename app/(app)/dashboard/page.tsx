import Link from "next/link"
import { redirect } from "next/navigation"
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Database,
  Eye,
  History,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buildCaseIntelligence, type CaseItemType, type CaseStatus } from "@/lib/cases/intelligence"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

type Comparison = { id:string; similarity_score:number|null; classification:string|null; recommendation:string|null; created_at:string }
type Research = { id:string; query:string; search_type:string; results_count:number; status:string; created_at:string }
type Watch = { id:string; watch_type:"company"|"ipc"; query:string; is_active:boolean; last_checked_at:string }
type Signal = { id:string; title:string; applicants:string|null; detected_at:string; read_at:string|null }
type CaseItem = { item_type:CaseItemType; title:string; created_at:string; metadata:Record<string,unknown>|null }
type CaseRow = {
  id:string
  title:string
  status:CaseStatus
  priority:"low"|"normal"|"high"
  context_type:string
  decision_summary:string|null
  notes:string|null
  last_reviewed_at:string|null
  updated_at:string
  case_items:CaseItem[]|null
}

function isHighRisk(row: Comparison) {
  return row.classification === "exact_match" || row.classification === "near_duplicate" || Number(row.similarity_score ?? 0) >= 85
}

function formatRelative(value?: string | null) {
  if (!value) return "Sin fecha"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.max(0, Math.floor(diffMs / 60000))
  if (minutes < 1) return "Ahora"
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Hace ${days} d`
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(date)
}

function isStale(value: string, days = 14) {
  return Date.now() - Date.parse(value) > days * 24 * 60 * 60 * 1000
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) redirect("/auth/login?redirectTo=%2Fdashboard")

  const [comparisonResult, researchResult, watchResult, signalResult, caseResult] = await Promise.all([
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

  const unreadSignals=signals.filter(signal=>!signal.read_at)
  const highRiskComparisons=comparisons.filter(isHighRisk)
  const activeWatches=watches.filter(watch=>watch.is_active)
  const latestSignal=signals[0]??null
  const latestComparison=comparisons[0]??null
  const latestResearch=research[0]??null

  const caseInsights=cases.map(caseRow=>({
    caseRow,
    intelligence:buildCaseIntelligence({
      status:caseRow.status,
      contextType:caseRow.context_type,
      decisionSummary:caseRow.decision_summary,
      notes:caseRow.notes,
      lastReviewedAt:caseRow.last_reviewed_at,
      items:(caseRow.case_items??[]).map(item=>({item_type:item.item_type,title:item.title,created_at:item.created_at,metadata:item.metadata??{}})),
    }),
  }))
  const casesWithNewEvidence=caseInsights.filter(item=>item.intelligence.newEvidenceCount>0)
  const decisionReadyCases=caseInsights.filter(item=>item.intelligence.readiness==="decision-ready")
  const staleCases=caseInsights.filter(item=>["open","review"].includes(item.caseRow.status)&&isStale(item.caseRow.updated_at))
  const highestNewEvidence=casesWithNewEvidence.sort((a,b)=>b.intelligence.newEvidenceCount-a.intelligence.newEvidenceCount)[0]??null
  const firstDecisionReady=decisionReadyCases[0]??null
  const firstStale=staleCases[0]??null

  const attentionCount=casesWithNewEvidence.length+decisionReadyCases.length+staleCases.length+unreadSignals.length+highRiskComparisons.length
  const displayName=(typeof user.user_metadata?.name==="string"&&user.user_metadata.name)||(typeof user.user_metadata?.full_name==="string"&&user.user_metadata.full_name)||user.email?.split("@")[0]||"tu equipo"

  const priorities=[
    highestNewEvidence?{href:`/casos/${highestNewEvidence.caseRow.id}`,icon:BriefcaseBusiness,title:`${casesWithNewEvidence.length} caso${casesWithNewEvidence.length===1?"":"s"} con evidencia nueva`,detail:`${highestNewEvidence.caseRow.title} recibió ${highestNewEvidence.intelligence.newEvidenceCount} evidencia${highestNewEvidence.intelligence.newEvidenceCount===1?"":"s"} desde su última revisión.`,meta:"Revisar caso",tone:"attention" as const}:null,
    firstDecisionReady?{href:`/casos/${firstDecisionReady.caseRow.id}`,icon:CheckCircle2,title:`${decisionReadyCases.length} caso${decisionReadyCases.length===1?"":"s"} listo${decisionReadyCases.length===1?"":"s"} para decidir`,detail:`${firstDecisionReady.caseRow.title} ya cubre evaluación, investigación y monitoreo.`,meta:"Decidir",tone:"attention" as const}:null,
    firstStale?{href:`/casos/${firstStale.caseRow.id}`,icon:Clock3,title:`${staleCases.length} caso${staleCases.length===1?"":"s"} sin movimiento`,detail:`${firstStale.caseRow.title} lleva más de 14 días sin actividad. Conviene cerrarlo, retomarlo o archivarlo.`,meta:formatRelative(firstStale.caseRow.updated_at),tone:"neutral" as const}:null,
    unreadSignals.length>0?{href:"/monitorear",icon:BellRing,title:`${unreadSignals.length} señal${unreadSignals.length===1?"":"es"} nueva${unreadSignals.length===1?"":"s"}`,detail:latestSignal?`${latestSignal.title} · ${latestSignal.applicants||"solicitante no informado"}`:"Revisa los cambios detectados en tus vigilancias.",meta:latestSignal?formatRelative(latestSignal.detected_at):"Ahora",tone:"attention" as const}:null,
    highRiskComparisons.length>0?{href:"/history?min=85",icon:AlertTriangle,title:`${highRiskComparisons.length} evaluación${highRiskComparisons.length===1?"":"es"} para revisar`,detail:"Hay comparaciones recientes con similitud alta o clasificación de coincidencia cercana.",meta:latestComparison?formatRelative(latestComparison.created_at):"Reciente",tone:"attention" as const}:null,
    activeWatches.length===0?{href:"/monitorear",icon:Eye,title:"Tu radar todavía está vacío",detail:"Crea una vigilancia de empresa o IPC para detectar cambios relevantes automáticamente.",meta:"Configurar",tone:"neutral" as const}:null,
  ].filter(Boolean).slice(0,6) as Array<{href:string;icon:typeof BellRing;title:string;detail:string;meta:string;tone:"attention"|"neutral"}>

  return <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
    <section className="grid gap-7 border-b border-border pb-9 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs font-medium text-muted-foreground"><Sparkles className="h-3.5 w-3.5"/> Intelligence Home 2.0</div>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl lg:text-6xl">{attentionCount>0?"Esto es lo que merece atención hoy.":"Tu panorama está al día."}</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">Hola, {displayName}. Visual Compare combina ahora señales operativas con la inteligencia de tus casos para mostrar dónde revisar, decidir o retomar trabajo.</p>
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-secondary/20 p-3 sm:grid-cols-4 lg:grid-cols-2">
        <Metric value={String(casesWithNewEvidence.length)} label="Casos con cambios"/>
        <Metric value={String(decisionReadyCases.length)} label="Listos para decidir"/>
        <Metric value={String(staleCases.length)} label="Casos estancados"/>
        <Metric value={String(unreadSignals.length)} label="Señales nuevas"/>
      </div>
    </section>

    <section className="py-9">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Prioridad</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Qué requiere atención hoy</h2></div>
        {attentionCount===0&&<Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="mr-1.5 h-3.5 w-3.5"/> Sin pendientes críticos</Badge>}
      </div>
      {priorities.length>0?<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{priorities.map(item=>{const Icon=item.icon;return <Link key={`${item.href}-${item.title}`} href={item.href} className="group"><Card className={`h-full transition-all hover:-translate-y-0.5 hover:shadow-lg ${item.tone==="attention"?"border-amber-500/30":"border-border"}`}><CardContent className="flex h-full flex-col p-5"><div className="flex items-center justify-between gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-secondary/50"><Icon className="h-4 w-4"/></span><span className="text-xs text-muted-foreground">{item.meta}</span></div><h3 className="mt-5 text-lg font-semibold text-foreground">{item.title}</h3><p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{item.detail}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-foreground">Abrir <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></span></CardContent></Card></Link>})}</div>:<div className="flex items-center gap-4 rounded-2xl border border-border bg-secondary/20 p-5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"><CheckCircle2 className="h-5 w-5"/></span><div><p className="font-medium text-foreground">No hay casos ni señales pendientes.</p><p className="mt-1 text-sm text-muted-foreground">Puedes seguir investigando, evaluar una marca o ampliar el radar.</p></div></div>}
    </section>

    <section className="border-t border-border py-9">
      <div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Casos</p><h2 className="mt-2 text-xl font-semibold text-foreground">Decisiones en curso</h2></div><Button asChild variant="ghost" size="sm"><Link href="/casos">Ver todos <ArrowRight className="ml-1 h-4 w-4"/></Link></Button></div>
      {caseInsights.length>0?<div className="grid gap-3 lg:grid-cols-3">{caseInsights.slice(0,6).map(({caseRow,intelligence})=><Link key={caseRow.id} href={`/casos/${caseRow.id}`} className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center justify-between gap-3"><Badge variant="outline">{readinessLabel(intelligence.readiness)}</Badge>{intelligence.newEvidenceCount>0&&<Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300">+{intelligence.newEvidenceCount} nueva{intelligence.newEvidenceCount===1?"":"s"}</Badge>}</div><h3 className="mt-4 font-semibold text-foreground">{caseRow.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{intelligence.pendingDecision}</p><div className="mt-4 flex items-center justify-between text-xs text-muted-foreground"><span>Actualizado {formatRelative(caseRow.updated_at).toLowerCase()}</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></div></Link>)}</div>:<div className="rounded-2xl border border-dashed border-border p-8 text-center"><BriefcaseBusiness className="mx-auto h-5 w-5 text-muted-foreground"/><p className="mt-3 text-sm font-medium text-foreground">Todavía no tienes casos activos.</p><p className="mt-1 text-sm text-muted-foreground">Guarda una evaluación, investigación o señal en un caso para empezar a construir una decisión.</p><Button asChild size="sm" className="mt-4"><Link href="/casos">Crear caso</Link></Button></div>}
    </section>

    <section className="grid gap-5 border-t border-border py-9 lg:grid-cols-[1.15fr_0.85fr]">
      <Card><CardHeader className="flex flex-row items-center justify-between gap-4 pb-3"><div><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Actividad</p><CardTitle className="mt-2 text-xl">Lo último que hiciste</CardTitle></div><Button asChild variant="ghost" size="sm"><Link href="/history">Ver historial <ArrowRight className="ml-1 h-4 w-4"/></Link></Button></CardHeader><CardContent className="space-y-2">{latestComparison&&<ActivityRow icon={ShieldCheck} href="/history" title="Evaluación reciente" detail={latestComparison.recommendation||`Similitud ${Math.round(Number(latestComparison.similarity_score??0))}%`} meta={formatRelative(latestComparison.created_at)}/>} {latestResearch&&<ActivityRow icon={Search} href={`/investigar?q=${encodeURIComponent(latestResearch.query)}`} title={`Investigaste “${latestResearch.query}”`} detail={`${latestResearch.results_count??0} resultados · ${latestResearch.search_type}`} meta={formatRelative(latestResearch.created_at)}/>} {latestSignal&&<ActivityRow icon={BellRing} href="/monitorear" title="Última señal detectada" detail={latestSignal.title} meta={formatRelative(latestSignal.detected_at)}/>} {!latestComparison&&!latestResearch&&!latestSignal&&<div className="rounded-xl border border-dashed border-border p-8 text-center"><Clock3 className="mx-auto h-5 w-5 text-muted-foreground"/><p className="mt-3 text-sm text-muted-foreground">Tu actividad aparecerá aquí cuando empieces a usar Visual Compare.</p></div>}</CardContent></Card>
      <Card><CardHeader className="pb-3"><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Radar</p><CardTitle className="mt-2 text-xl">Qué estás siguiendo</CardTitle></CardHeader><CardContent>{activeWatches.length>0?<div className="space-y-2">{activeWatches.slice(0,5).map(watch=><Link key={watch.id} href="/monitorear" className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-secondary/30"><div className="min-w-0"><div className="flex items-center gap-2"><Badge variant="secondary">{watch.watch_type==="company"?"Empresa":"IPC"}</Badge><span className="truncate text-sm font-medium text-foreground">{watch.query}</span></div><p className="mt-1 text-xs text-muted-foreground">Chequeado {formatRelative(watch.last_checked_at).toLowerCase()}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground"/></Link>)}</div>:<div className="rounded-xl border border-dashed border-border p-6 text-center"><Target className="mx-auto h-5 w-5 text-muted-foreground"/><p className="mt-3 text-sm font-medium text-foreground">Todavía no sigues empresas ni tecnologías.</p><Button asChild size="sm" className="mt-4"><Link href="/monitorear">Crear vigilancia</Link></Button></div>}</CardContent></Card>
    </section>

    <section className="border-t border-border py-9"><div className="mb-5"><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Continuar</p><h2 className="mt-2 text-xl font-semibold text-foreground">¿Qué quieres hacer ahora?</h2></div><div className="grid gap-3 md:grid-cols-4"><Journey href="/casos" icon={BriefcaseBusiness} label="Casos" description="Gestionar decisiones y evidencia."/><Journey href="/evaluar" icon={ShieldCheck} label="Evaluar" description="Revisar una marca antes de avanzar."/><Journey href="/investigar" icon={Search} label="Investigar" description="Entender una marca, empresa o tecnología."/><Journey href="/monitorear" icon={BellRing} label="Monitorear" description="Seguir cambios relevantes en el tiempo."/></div></section>

    <section className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground"><span className="inline-flex items-center gap-2"><Database className="h-3.5 w-3.5"/> Datos INAPI sincronizados y trazables.</span><Link href="/api/v1/health" target="_blank" className="inline-flex items-center gap-1 hover:text-foreground">Estado técnico <ArrowRight className="h-3.5 w-3.5"/></Link></section>
  </div>
}

function readinessLabel(value:"early"|"developing"|"decision-ready"|"decided") { return value==="early"?"Temprano":value==="developing"?"En desarrollo":value==="decision-ready"?"Listo para decidir":"Decisión registrada" }
function Metric({value,label}:{value:string;label:string}) { return <div className="rounded-xl bg-background/60 px-3 py-4 text-center"><p className="text-2xl font-semibold text-foreground">{value}</p><p className="mt-1 text-[11px] leading-4 text-muted-foreground">{label}</p></div> }
function ActivityRow({icon:Icon,href,title,detail,meta}:{icon:typeof History;href:string;title:string;detail:string;meta:string}) { return <Link href={href} className="group flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-secondary/30"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/60"><Icon className="h-4 w-4 text-muted-foreground"/></span><div className="min-w-0 flex-1"><p className="text-sm font-medium text-foreground">{title}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{detail}</p></div><span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{meta}</span><ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1"/></Link> }
function Journey({href,icon:Icon,label,description}:{href:string;icon:typeof Search;label:string;description:string}) { return <Link href={href} className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/60"><Icon className="h-4 w-4"/></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-foreground">{label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div><ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1"/></Link> }
