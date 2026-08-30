"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"
import { ArrowLeft, CheckCircle2, Loader2, Play, Save, ShieldCheck } from "lucide-react"
import { OperationalHeader, OperationalPage, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
 canExecuteCaseSuggestedAction,
 caseSuggestedActionRestriction,
 type CaseSuggestedAction,
} from "@/lib/cases/access"

type Policy={case_id:string;enabled:boolean;auto_remind:boolean;auto_raise_priority:boolean;remind_before_hours:number;escalate_before_hours:number;cooldown_hours:number;updated_at:string|null}
type AutomationPayload={currentUserRole:"owner"|"editor"|"viewer";policy:Policy;actions:Array<{id:string;action_type:string;reason:string;created_at:string}>}
type SuggestedAction={action:CaseSuggestedAction;rationale:string;confidence:number}
type CopilotReply={answer:string;observations:string[];risks:string[];missing:string[];suggested_actions:SuggestedAction[];model:string;estimatedCostUsd:number}

const ACTION_LABEL:Record<SuggestedAction["action"],string>={remind_reviewers:"Recordar revisores",extend_deadline:"Extender plazo +2 días",raise_priority:"Elevar prioridad",open_governance:"Abrir revisión",investigate:"Investigar más",none:"Sin acción"}

export default function CaseControlPage(){
 const {id}=useParams<{id:string}>();const [automation,setAutomation]=useState<AutomationPayload|null>(null);const [question,setQuestion]=useState("¿Qué debería atender primero en este caso?");const [reply,setReply]=useState<CopilotReply|null>(null);const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [error,setError]=useState<string|null>(null);const [saved,setSaved]=useState(false)
 const load=async()=>{setLoading(true);setError(null);try{const r=await fetch(`/api/cases/automation?caseId=${encodeURIComponent(id)}`,{cache:"no-store"});const p=await r.json().catch(()=>({}));if(!r.ok)throw new Error(p.error||"No pudimos cargar el control del caso.");setAutomation(p)}catch(c){setError(c instanceof Error?c.message:"No pudimos cargar el control del caso.")}finally{setLoading(false)}}
 useEffect(()=>{if(id)void load()},[id])
 const patchPolicy=(patch:Partial<Policy>)=>setAutomation(cur=>cur?{...cur,policy:{...cur.policy,...patch}}:cur)
 const savePolicy=async()=>{if(!automation)return;setBusy(true);setSaved(false);setError(null);try{const p=automation.policy;const r=await fetch("/api/cases/automation",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({caseId:id,enabled:p.enabled,autoRemind:p.auto_remind,autoRaisePriority:p.auto_raise_priority,remindBeforeHours:p.remind_before_hours,escalateBeforeHours:p.escalate_before_hours,cooldownHours:p.cooldown_hours})});const body=await r.json().catch(()=>({}));if(!r.ok)throw new Error(body.error||"No pudimos guardar las reglas.");setAutomation(cur=>cur?{...cur,policy:body.policy}:cur);setSaved(true)}catch(c){setError(c instanceof Error?c.message:"No pudimos guardar las reglas.")}finally{setBusy(false)}}
 const ask=async(e:FormEvent)=>{e.preventDefault();if(question.trim().length<2)return;setBusy(true);setError(null);try{const r=await fetch("/api/cases/copilot",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({caseId:id,question})});const p=await r.json().catch(()=>({}));if(!r.ok)throw new Error(p.error||"No pudimos analizar el expediente.");setReply(p)}catch(c){setError(c instanceof Error?c.message:"No pudimos analizar el expediente.")}finally{setBusy(false)}}
 const execute=async(action:SuggestedAction["action"])=>{if(!automation||!canExecuteCaseSuggestedAction(automation.currentUserRole,action))return;if(action==="open_governance"){window.location.href=`/casos/${id}/revision`;return}if(action==="investigate"){window.location.href="/investigar";return}if(action==="none")return;const confirmed=window.confirm(`Confirmar: ${ACTION_LABEL[action]}. Esta acción quedará registrada.`);if(!confirmed)return;setBusy(true);setError(null);try{const r=await fetch("/api/cases/interventions",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({caseId:id,action,days:2})});const p=await r.json().catch(()=>({}));if(!r.ok)throw new Error(p.error||"No pudimos ejecutar la intervención.");await load()}catch(c){setError(c instanceof Error?c.message:"No pudimos ejecutar la intervención.")}finally{setBusy(false)}}
 if(loading)return <div className="mx-auto max-w-[1480px] px-4 py-10 text-sm text-muted-foreground sm:px-6 lg:px-8"><Loader2 className="mr-2 inline h-4 w-4 animate-spin motion-reduce:animate-none"/>Cargando control…</div>
 if(!automation)return <div className="mx-auto max-w-[1480px] px-4 py-10 text-destructive sm:px-6 lg:px-8">{error}</div>
 const owner=automation.currentUserRole==="owner"
 return <OperationalPage>
  <Button asChild variant="ghost" size="sm" className="mb-4 w-fit px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"><Link href={`/casos/${id}`}><ArrowLeft className="mr-2 h-4 w-4"/>Volver al caso</Link></Button>
  <OperationalHeader eyebrow="VIDENTIA / Caso / Control" title="Automatiza el seguimiento, no la decisión." description={<>Las reglas recuerdan y escalan tareas explícitas. La asistencia lee el expediente y propone pasos, pero las intervenciones sensibles siguen bajo confirmación humana.</>} meta={<><span>Reglas explícitas</span><span>Acciones registradas</span><span>Decisión humana</span></>}/>
  {error?<div role="alert" className="mt-5 border border-red-500/25 bg-red-500/[0.07] p-4 text-sm text-red-300">{error}</div>:null}

  <section className="grid gap-8 border-b border-border/80 py-7 xl:grid-cols-[0.92fr_1.08fr]">
   <div className="min-w-0">
    <OperationalSectionHeader eyebrow="01 / Reglas" title="Seguimiento determinista" meta={owner?"Editable por el responsable":"Sólo lectura para tu rol"}/>
    <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Se ejecutan sobre plazos y estados conocidos. Nunca aprueban ni cierran el caso.</p>
    <div className="mt-4 divide-y divide-border border-y border-border">
     <Toggle label="Reglas activas" description="Habilita el barrido periódico para este caso." checked={automation.policy.enabled} disabled={!owner} onChange={v=>patchPolicy({enabled:v})}/>
     <Toggle label="Recordar revisores" description="Envía recordatorios cuando el plazo entra en la ventana configurada." checked={automation.policy.auto_remind} disabled={!owner} onChange={v=>patchPolicy({auto_remind:v})}/>
     <Toggle label="Elevar prioridad" description="Puede elevar la prioridad dentro de la ventana crítica; nunca cambia la decisión del caso." checked={automation.policy.auto_raise_priority} disabled={!owner} onChange={v=>patchPolicy({auto_raise_priority:v})}/>
    </div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3"><NumberField label="Recordar antes (h)" value={automation.policy.remind_before_hours} disabled={!owner} onChange={v=>patchPolicy({remind_before_hours:v})}/><NumberField label="Escalar antes (h)" value={automation.policy.escalate_before_hours} disabled={!owner} onChange={v=>patchPolicy({escalate_before_hours:v})}/><NumberField label="Intervalo mínimo (h)" value={automation.policy.cooldown_hours} disabled={!owner} onChange={v=>patchPolicy({cooldown_hours:v})}/></div>
    {owner?<Button className="mt-4 w-full sm:w-auto" onClick={()=>void savePolicy()} disabled={busy}>{busy?<Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none"/>:saved?<CheckCircle2 className="mr-2 h-4 w-4"/>:<Save className="mr-2 h-4 w-4"/>}{saved?"Guardado":"Guardar reglas"}</Button>:null}
    <div className="mt-5 border-l-2 border-primary/35 pl-4"><p className="flex items-center gap-2 text-sm font-medium text-foreground"><ShieldCheck className="h-4 w-4 text-primary"/>Límites de ejecución</p><p className="mt-2 text-xs leading-5 text-muted-foreground">No aprueban, no cierran casos, no reasignan revisores ni extienden plazos por sí solas.</p></div>
   </div>

   <div className="min-w-0">
    <OperationalSectionHeader eyebrow="02 / Asistencia" title="Lectura asistida del expediente" meta="Observaciones, riesgos, vacíos y próximos pasos"/>
    <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Usa sólo el expediente autorizado y no ejecuta decisiones jurídicas.</p>
    <form onSubmit={ask} className="mt-4"><textarea value={question} onChange={e=>setQuestion(e.target.value)} rows={3} maxLength={1500} className="w-full resize-y border border-input bg-background p-3 text-sm leading-6 text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20" placeholder="¿Qué falta antes de decidir?"/><Button className="mt-3 w-full sm:w-auto" disabled={busy||question.trim().length<2}>{busy?<Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none"/>:<Play className="mr-2 h-4 w-4"/>}Analizar expediente</Button></form>
    {reply?<div className="mt-5 space-y-5"><div className="border-y border-border py-4"><p className="text-sm leading-6 text-foreground">{reply.answer}</p><p className="mt-3 break-words text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Trazabilidad técnica disponible · modelo {reply.model} · costo estimado US${reply.estimatedCostUsd.toFixed(6)}</p></div><List title="Observaciones" items={reply.observations}/><List title="Riesgos" items={reply.risks}/><List title="Qué falta" items={reply.missing}/>{reply.suggested_actions.length>0?<div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Acciones sugeridas</p><div className="divide-y divide-border border-y border-border">{reply.suggested_actions.map((a,i)=>{const allowed=canExecuteCaseSuggestedAction(automation.currentUserRole,a.action);const restriction=caseSuggestedActionRestriction(automation.currentUserRole,a.action);return <div key={`${a.action}-${i}`} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-sm font-medium text-foreground">{ACTION_LABEL[a.action]}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{a.rationale}</p>{restriction?<p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{restriction}</p>:null}</div>{a.action!=="none"&&allowed?<Button size="sm" variant="outline" className="w-full shrink-0 sm:w-auto" onClick={()=>void execute(a.action)} disabled={busy}>Confirmar acción</Button>:null}</div>})}</div></div>:null}</div>:null}
   </div>
  </section>

  <section className="py-7">
   <OperationalSectionHeader eyebrow="03 / Trazabilidad" title="Actividad automática reciente" meta={`${automation.actions.length} registro${automation.actions.length===1?"":"s"}`}/>
   <p className="mt-2 text-sm leading-6 text-muted-foreground">Recordatorios y escalaciones realmente ejecutados por reglas.</p>
   <div className="mt-4 divide-y divide-border border-y border-border">{automation.actions.length===0?<div className="py-7 text-sm text-muted-foreground">Todavía no hay acciones automáticas registradas en este caso.</div>:automation.actions.map(a=><div key={a.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-center"><div className="min-w-0"><p className="text-sm font-medium text-foreground">{a.action_type==="reminder"?"Recordatorio enviado":"Prioridad elevada"}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{a.reason}</p></div><span className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("es-CL",{dateStyle:"short",timeStyle:"short"}).format(new Date(a.created_at))}</span></div>)}</div>
  </section>
 </OperationalPage>
}

function Toggle({label,description,checked,disabled,onChange}:{label:string;description:string;checked:boolean;disabled:boolean;onChange:(v:boolean)=>void}){return <label className="flex items-start justify-between gap-4 py-3.5"><span className="min-w-0"><span className="block text-sm font-medium text-foreground">{label}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span></span><input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[var(--primary)]" checked={checked} disabled={disabled} onChange={e=>onChange(e.target.checked)}/></label>}
function NumberField({label,value,disabled,onChange}:{label:string;value:number;disabled:boolean;onChange:(v:number)=>void}){return <label className="text-xs text-muted-foreground">{label}<Input className="mt-2" type="number" min={1} max={168} value={value} disabled={disabled} onChange={e=>onChange(Math.max(1,Math.min(168,Number(e.target.value)||1)))}/></label>}
function List({title,items}:{title:string;items:string[]}){if(!items.length)return null;return <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">{title}</p><div className="divide-y divide-border border-y border-border">{items.map((item,i)=><p key={i} className="py-3 text-sm leading-6 text-foreground/90">{item}</p>)}</div></div>}
