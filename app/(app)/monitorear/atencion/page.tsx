"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, ArrowLeft, CircleCheck, ExternalLink, ListTodo, Loader2, RefreshCw } from "lucide-react"
import { OperationalHeader, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Priority = "critica" | "alta" | "media"
type AttentionItem = {
  key:string; signalKey:string; watchKey:string; title:string; subject:string; source:string; href:string;
  priority:Priority; reason:string; occurredAt:string|null; isNew:boolean; kind:"regulatory_case"|"new_high_signal"
}
type Summary = { total:number; critical:number; high:number; medium:number }
type Member = { user_id:string; display_name:string; email:string; role:"owner"|"editor"|"viewer" }
type LinkedAction = {
  href:string; caseId:string; caseStatus:string; currentUserId:string; currentUserRole:"owner"|"editor"|"viewer";
  members:Member[]; created?:{case?:boolean;evidence?:boolean;action?:boolean};
  action:{ id:string; assigned_to:string|null; status:"open"|"done"; due_at:string|null; completed_at:string|null; outcome:string|null }
}
type AccountabilityState = "checking" | "none" | "overdue" | "unassigned" | "open" | "resolved"
type AccountabilitySummary = { overdue:number; unassigned:number; open:number; resolved:number }

const EMPTY: Summary = { total:0, critical:0, high:0, medium:0 }
const EMPTY_ACCOUNTABILITY: AccountabilitySummary = { overdue:0, unassigned:0, open:0, resolved:0 }
const PRIORITY_LABEL: Record<Priority,string> = { critica:"Crítica", alta:"Alta", media:"Media" }
const ACCOUNTABILITY_RANK: Record<AccountabilityState,number> = { overdue:0, unassigned:1, none:2, open:3, checking:4, resolved:5 }
const PRIORITY_RANK: Record<Priority,number> = { critica:0, alta:1, media:2 }

export default function ExecutiveAttentionPage(){
  const [items,setItems]=useState<AttentionItem[]>([])
  const [summary,setSummary]=useState<Summary>(EMPTY)
  const [accountability,setAccountability]=useState<Record<string,AccountabilityState>>({})
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)

  async function load(){
    setLoading(true);setError(null)
    try{
      const response=await fetch("/api/intelligence/watches/signals",{cache:"no-store"})
      const payload=await response.json().catch(()=>({}))
      if(!response.ok)throw new Error(payload.error||"No pudimos construir la cola ejecutiva.")
      setItems(Array.isArray(payload.attentionQueue)?payload.attentionQueue:[])
      setSummary(payload.attentionSummary??EMPTY)
      setAccountability({})
    }catch(cause){setError(cause instanceof Error?cause.message:"No pudimos construir la cola ejecutiva.")}finally{setLoading(false)}
  }

  useEffect(()=>{void load()},[])
  const reportAccountability=useCallback((key:string,state:AccountabilityState)=>{
    setAccountability(current=>current[key]===state?current:{...current,[key]:state})
  },[])
  const ranked=useMemo(()=>[...items].sort((a,b)=>{
    const aState=accountability[a.key]??"checking"
    const bState=accountability[b.key]??"checking"
    const byAccountability=ACCOUNTABILITY_RANK[aState]-ACCOUNTABILITY_RANK[bState]
    if(byAccountability!==0)return byAccountability
    const byPriority=PRIORITY_RANK[a.priority]-PRIORITY_RANK[b.priority]
    if(byPriority!==0)return byPriority
    const aTime=a.occurredAt?Date.parse(a.occurredAt):0
    const bTime=b.occurredAt?Date.parse(b.occurredAt):0
    return bTime-aTime||a.key.localeCompare(b.key)
  }),[items,accountability])
  const accountabilitySummary=useMemo(()=>Object.values(accountability).reduce<AccountabilitySummary>((acc,state)=>{
    if(state==="overdue")acc.overdue+=1
    else if(state==="unassigned")acc.unassigned+=1
    else if(state==="open")acc.open+=1
    else if(state==="resolved")acc.resolved+=1
    return acc
  },{...EMPTY_ACCOUNTABILITY}),[accountability])

  return <OperationalPage>
    <OperationalHeader
      eyebrow="VIDENTIA / EXECUTIVE ATTENTION"
      title="Qué requiere atención"
      description={<>Prioridad externa conectada con accountability operativo: primero lo vencido y sin dueño, sin perder la materialidad de la señal.</>}
      meta={<><span>{summary.critical} críticos</span><span>{summary.high} altos</span><span>{summary.medium} medios</span></>}
      actions={<div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/monitorear"><ArrowLeft className="h-4 w-4"/>Monitorear</Link></Button><Button onClick={()=>void load()} disabled={loading}>{loading?<Loader2 className="h-4 w-4 animate-spin"/>:<RefreshCw className="h-4 w-4"/>}Actualizar</Button></div>}
    />

    <section className="grid gap-px border-y border-border/80 bg-border/80 sm:grid-cols-4">
      <Metric label="Vencidas" value={accountabilitySummary.overdue} detail="Acciones abiertas fuera de plazo"/>
      <Metric label="Sin responsable" value={accountabilitySummary.unassigned} detail="Acciones abiertas sin ownership"/>
      <Metric label="Abiertas" value={accountabilitySummary.open} detail="Asignadas y dentro de plazo"/>
      <Metric label="Resueltas" value={accountabilitySummary.resolved} detail="Resultado registrado en el caso"/>
    </section>

    <section className="py-9"><OperationalPanel>
      <OperationalSectionHeader eyebrow="COLA EJECUTIVA" title={summary.total?`${summary.total} caso${summary.total===1?"":"s"} con atención activa`:"Sin casos que requieran atención"} meta="Accountability → prioridad externa → recencia"/>
      {error?<div role="alert" className="mt-5 bg-[#3A2525] p-4 text-sm text-[#E8AAA3]">{error}</div>:null}
      {loading?<div className="mt-5 flex items-center gap-2 border-y border-border/80 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Calculando prioridad ejecutiva…</div>:ranked.length?<div className="mt-5 divide-y divide-border/80 border-y border-border/80">{ranked.map((item,index)=><AttentionRow key={item.key} item={item} index={index} visible={index<12} onAccountabilityChange={reportAccountability}/>)}</div>:<div className="mt-5 border-y border-border/80 py-10"><p className="font-medium text-white">No hay casos priorizados.</p></div>}
      {ranked.length>12?<p className="mt-4 text-xs text-muted-foreground">Mostrando los 12 casos con mayor urgencia operativa de {ranked.length}. Todos se consideran para el ranking y las métricas.</p>:null}
    </OperationalPanel></section>
  </OperationalPage>
}

function Metric({label,value,detail}:{label:string;value:number;detail:string}){
  return <div className="bg-background p-6"><p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#96B5A6]">{label}</p><p className="mt-3 font-mono text-3xl text-white">{value}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p></div>
}

function AttentionRow({item,index,visible,onAccountabilityChange}:{item:AttentionItem;index:number;visible:boolean;onAccountabilityChange:(key:string,state:AccountabilityState)=>void}){
  const [creating,setCreating]=useState(false)
  const [checking,setChecking]=useState(true)
  const [action,setAction]=useState<LinkedAction|null>(null)
  const [actionError,setActionError]=useState<string|null>(null)
  const external=item.href.startsWith("http")
  const title=truncate(actionTitle(item),240)

  async function loadActionState(created?:LinkedAction["created"]){
    setChecking(true)
    try{
      const params=new URLSearchParams({sourceId:item.signalKey,actionTitle:title})
      const response=await fetch(`/api/intelligence/actions?${params.toString()}`,{cache:"no-store"})
      const payload=await response.json().catch(()=>({}))
      if(!response.ok)throw new Error(payload.error||"No pudimos verificar la acción.")
      setAction(payload.linked?{...payload,created}:null)
    }catch(cause){setActionError(cause instanceof Error?cause.message:"No pudimos verificar la acción.")}finally{setChecking(false)}
  }
  useEffect(()=>{void loadActionState()},[item.signalKey,title])

  const accountabilityState=currentAccountabilityState(action,checking)
  useEffect(()=>{onAccountabilityChange(item.key,accountabilityState)},[item.key,accountabilityState,onAccountabilityChange])

  async function createAction(){
    if(creating||action)return
    setCreating(true);setActionError(null)
    try{
      const dueAt=defaultDueAt(item.priority)
      const response=await fetch("/api/intelligence/actions",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
        contextType:item.kind==="regulatory_case"?"company":"technology",contextQuery:item.subject,
        caseTitle:truncate(`${item.subject} · ${item.title}`,160),itemType:"alert",sourceId:item.signalKey,
        sourceTitle:truncate(item.title,240),actionTitle:title,priority:item.priority==="media"?"normal":"high",dueAt,assignedTo:null,
        evidence:{origin:"executive_attention",attentionKey:item.key,signalKey:item.signalKey,watchKey:item.watchKey,attentionKind:item.kind,attentionPriority:item.priority,source:item.source,sourceHref:item.href,reason:item.reason,occurredAt:item.occurredAt,suggestedDueAt:dueAt},
      })})
      const payload=await response.json().catch(()=>({}))
      if(!response.ok)throw new Error(payload.error||"No pudimos crear la acción.")
      await loadActionState(payload.created)
    }catch(cause){setActionError(cause instanceof Error?cause.message:"No pudimos crear la acción.")}finally{setCreating(false)}
  }

  async function updateSchedule(assignedTo:string|null,dueAt:string|null){
    if(!action||action.action.status!=="open")return
    setActionError(null)
    try{
      const response=await fetch("/api/cases/collaboration",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({type:"action_schedule",id:action.action.id,assignedTo,dueAt})})
      const payload=await response.json().catch(()=>({}))
      if(!response.ok)throw new Error(payload.error||"No pudimos actualizar responsable o fecha.")
      await loadActionState(action.created)
    }catch(cause){setActionError(cause instanceof Error?cause.message:"No pudimos actualizar responsable o fecha.")}
  }

  const status=actionStatus(action)
  const assignee=action?.members.find(member=>member.user_id===action.action.assigned_to)
  const canAssign=action?.currentUserRole==="owner"||action?.currentUserRole==="editor"

  return <article className={`${visible?"grid":"hidden"} gap-4 py-5 md:grid-cols-[64px_minmax(0,1fr)_auto] md:items-start`}>
    <div className="flex items-center gap-2 md:block"><span className="font-mono text-sm text-[#96B5A6]">{String(index+1).padStart(2,"0")}</span><AlertTriangle className="mt-2 hidden h-4 w-4 text-muted-foreground md:block"/></div>
    <div>
      <div className="flex flex-wrap items-center gap-2"><Badge variant={item.priority==="critica"?"destructive":"secondary"}>{PRIORITY_LABEL[item.priority]}</Badge>{item.isNew?<Badge className="bg-[#173B37] text-[#96B5A6] hover:bg-[#173B37]">Nuevo</Badge>:null}<Badge variant="outline">{item.kind==="regulatory_case"?"Caso regulatorio":"Señal externa"}</Badge><Badge variant="outline">{checking?"Verificando acción":status}</Badge></div>
      <h2 className="mt-3 text-sm font-medium leading-6 text-white">{item.title}</h2>
      <p className="mt-1 text-xs text-[#96B5A6]">{item.subject} · {item.source}</p>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{item.reason}</p>
      {item.occurredAt?<p className="mt-2 text-[11px] text-muted-foreground">Último movimiento · {formatDate(item.occurredAt)}</p>:null}
      {!action&&!checking?<p className="mt-2 text-xs text-muted-foreground">Sin acción · SLA sugerido {dueLabel(item.priority)}</p>:null}
      {action?<div className="mt-3 border-l-2 border-[#96B5A6]/35 pl-3">
        <p className="text-xs text-[#96B5A6]">Responsable · {assignee?.display_name||"Sin responsable"}</p>
        <p className="mt-1 text-xs text-muted-foreground">Fecha límite · {action.action.due_at?formatDate(action.action.due_at):"Sin fecha"}</p>
        {action.created?<p className="mt-1 text-xs text-[#96B5A6]">{action.created?.action===false?"Acción existente recuperada":"Acción creada y vinculada a la evidencia"}</p>:null}
        {action.action.outcome?<p className="mt-2 text-xs leading-5 text-foreground/80">Resultado · {action.action.outcome}</p>:null}
        {canAssign&&action.action.status==="open"?<div className="mt-3 grid max-w-xl gap-2 sm:grid-cols-2">
          <select aria-label="Responsable" value={action.action.assigned_to??""} onChange={event=>void updateSchedule(event.target.value||null,action.action.due_at)} className="h-9 border border-input bg-background px-2 text-xs text-foreground"><option value="">Sin responsable</option>{action.members.map(member=><option key={member.user_id} value={member.user_id}>{member.display_name}</option>)}</select>
          <Input aria-label="Fecha límite" type="datetime-local" value={toLocalDateTimeInput(action.action.due_at)} onChange={event=>void updateSchedule(action.action.assigned_to,event.target.value?new Date(event.target.value).toISOString():null)} className="h-9 text-xs"/>
        </div>:null}
      </div>:null}
      {actionError?<p role="alert" className="mt-2 text-xs text-[#E8AAA3]">{actionError}</p>:null}
    </div>
    <div className="flex flex-wrap justify-end gap-2">
      <Button asChild variant="ghost" size="sm"><Link href={item.href} target={external?"_blank":undefined} rel={external?"noreferrer":undefined}>Evidencia{external?<ExternalLink className="h-3.5 w-3.5"/>:null}</Link></Button>
      {action?<Button asChild size="sm"><Link href={action.href}><CircleCheck className="h-3.5 w-3.5"/>Abrir acción</Link></Button>:<Button size="sm" onClick={()=>void createAction()} disabled={creating||checking}>{creating?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<ListTodo className="h-3.5 w-3.5"/>}Crear acción</Button>}
    </div>
  </article>
}

function currentAccountabilityState(value:LinkedAction|null,checking:boolean):AccountabilityState{
  if(checking)return "checking"
  if(!value)return "none"
  if(value.action.status==="done")return "resolved"
  if(value.action.due_at&&Date.parse(value.action.due_at)<Date.now())return "overdue"
  if(!value.action.assigned_to)return "unassigned"
  return "open"
}
function actionStatus(value:LinkedAction|null){
  if(!value)return "Sin acción"
  if(value.action.status==="done")return "Acción resuelta"
  if(value.action.due_at&&Date.parse(value.action.due_at)<Date.now())return "Acción vencida"
  if(!value.action.assigned_to)return "Sin responsable"
  return "Acción abierta"
}
function defaultDueAt(priority:Priority){const hours=priority==="critica"?24:priority==="alta"?48:24*7;return new Date(Date.now()+hours*60*60*1000).toISOString()}
function dueLabel(priority:Priority){return priority==="critica"?"24 horas":priority==="alta"?"48 horas":"7 días"}
function actionTitle(item:AttentionItem){return item.kind==="regulatory_case"?`Resolver atención regulatoria: ${item.title}`:`Revisar señal ejecutiva: ${item.title}`}
function truncate(value:string,max:number){return value.length<=max?value:value.slice(0,max-1).trimEnd()+"…"}
function formatDate(value:string){const date=new Date(value);return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat("es-CL",{dateStyle:"medium",timeStyle:"short"}).format(date)}
function toLocalDateTimeInput(value:string|null){if(!value)return "";const date=new Date(value);if(Number.isNaN(date.getTime()))return "";const local=new Date(date.getTime()-date.getTimezoneOffset()*60000);return local.toISOString().slice(0,16)}
