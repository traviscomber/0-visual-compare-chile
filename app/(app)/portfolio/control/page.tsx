import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, BellRing, CheckCircle2, ShieldCheck } from "lucide-react"
import { OperationalHeader, OperationalMetric, OperationalMetricRail, OperationalPage, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
type CaseRow={id:string;title:string;status:string;priority:string;updated_at:string}
type Policy={case_id:string;enabled:boolean;auto_remind:boolean;auto_raise_priority:boolean;remind_before_hours:number;escalate_before_hours:number;updated_at:string}

export default async function ControlPortfolioPage(){
 const supabase=await createClient();const {data:auth}=await supabase.auth.getUser();if(!auth.user)redirect("/auth/login?redirectTo=%2Fportfolio%2Fcontrol")
 const [casesResult,policiesResult]=await Promise.all([
  supabase.from("cases").select("id,title,status,priority,updated_at").not("status","in",'("decided","archived")').order("updated_at",{ascending:false}).limit(200),
  supabase.from("case_automation_policy").select("case_id,enabled,auto_remind,auto_raise_priority,remind_before_hours,escalate_before_hours,updated_at"),
 ])
 if(casesResult.error||policiesResult.error)throw new Error("No pudimos cargar el centro de control.")
 const cases=(casesResult.data??[]) as CaseRow[];const policies=(policiesResult.data??[]) as Policy[];const map=new Map(policies.map(p=>[p.case_id,p]));const automated=cases.filter(c=>map.get(c.id)?.enabled);const reminderCount=automated.filter(c=>map.get(c.id)?.auto_remind).length;const escalationCount=automated.filter(c=>map.get(c.id)?.auto_raise_priority).length;const manualCount=cases.length-automated.length
 return <OperationalPage>
  <OperationalHeader eyebrow="VIDENTIA / Portafolio / Control" title="Automatiza seguimiento. Mantén humana la decisión." description={<>Controla qué casos tienen reglas de recordatorio o escalamiento. La asistencia puede proponer pasos y priorizar seguimiento, pero cerrar, aprobar o cambiar una decisión requiere acción humana.</>} meta={<><span>Reglas explícitas</span><span>Trazabilidad</span><span>Confirmación humana</span></>} actions={<Link href="/portfolio" className="inline-flex h-9 items-center justify-center border border-border bg-transparent px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary">Volver al portafolio</Link>}/>
  <OperationalMetricRail>
   <OperationalMetric value={automated.length} label="Reglas activas" detail="Casos con automatización habilitada" tone={automated.length?"success":"neutral"}/>
   <OperationalMetric value={reminderCount} label="Recordatorios" detail="Avisos por ventana de revisión"/>
   <OperationalMetric value={escalationCount} label="Escalamientos" detail="Prioridad puede elevarse por regla" tone={escalationCount?"warning":"neutral"}/>
   <OperationalMetric value={manualCount} label="Seguimiento manual" detail="Casos sin automatización activa"/>
  </OperationalMetricRail>
  <section className="grid gap-10 border-b border-border/80 py-9 xl:grid-cols-[0.7fr_1.3fr]"><aside><OperationalSectionHeader eyebrow="Límites" title="Qué puede y qué no puede hacer el sistema"/><div className="mt-5 border-l-2 border-primary/35 pl-4"><div className="flex items-center gap-2 text-sm font-medium text-white"><ShieldCheck className="h-4 w-4 text-primary"/>Seguimiento, no decisión</div><p className="mt-3 text-sm leading-6 text-muted-foreground">Las reglas pueden recordar revisores y elevar prioridad dentro de ventanas configuradas.</p><p className="mt-3 text-sm leading-6 text-muted-foreground">La asistencia puede resumir evidencia, detectar brechas y sugerir intervenciones.</p><p className="mt-3 text-sm font-medium leading-6 text-[#E7DFCE]">No puede aprobar, cerrar el caso, reasignar revisores ni registrar una decisión sin acción humana.</p></div></aside><div><OperationalSectionHeader eyebrow="Casos activos" title="Configuración por expediente" meta={`${cases.length} caso${cases.length===1?"":"s"}`}/><div className="mt-5 divide-y divide-border/80 border-y border-border/80">{cases.length?cases.slice(0,50).map(c=>{const p=map.get(c.id);return <Link key={c.id} href={`/casos/${c.id}/control`} className="group grid gap-3 px-2 py-5 outline-none hover:bg-secondary/15 focus-visible:bg-secondary/20 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex flex-wrap gap-2">{p?.enabled?<Badge className="rounded-md border-primary/20 bg-primary/[0.07] text-primary hover:bg-primary/[0.07]"><CheckCircle2 className="mr-1 h-3 w-3"/>Reglas activas</Badge>:<Badge variant="outline" className="rounded-md">Seguimiento manual</Badge>}{p?.auto_remind?<span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><BellRing className="h-3.5 w-3.5"/>Recordatorios</span>:null}{p?.auto_raise_priority?<span className="text-xs text-[#D8C49C]">Escalamiento activo</span>:null}</div><p className="mt-3 text-sm font-medium text-white">{c.title}</p><p className="mt-1 text-xs text-muted-foreground">Prioridad {priorityLabel(c.priority)} · {statusLabel(c.status)}{p?.enabled?` · recordar ${p.remind_before_hours} h · escalar ${p.escalate_before_hours} h`:""}</p></div><ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1"/></Link>}):<p className="py-8 text-sm text-muted-foreground">No hay casos activos.</p>}</div></div></section>
 </OperationalPage>
}
function priorityLabel(value:string){return value==="high"?"alta":value==="low"?"baja":"normal"}
function statusLabel(value:string){return value==="review"?"en revisión":value==="open"?"abierto":value}
