import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, Bot, ShieldCheck, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

type CaseRow={id:string;title:string;status:string;priority:string;updated_at:string}
type Policy={case_id:string;enabled:boolean;auto_remind:boolean;auto_raise_priority:boolean;remind_before_hours:number;escalate_before_hours:number;updated_at:string}

export default async function ControlPortfolioPage(){
 const supabase=await createClient();const {data:auth}=await supabase.auth.getUser();if(!auth.user)redirect("/auth/login?redirectTo=%2Fportfolio%2Fcontrol")
 const [{data:casesData,error},{data:policiesData}]=await Promise.all([
  supabase.from("cases").select("id,title,status,priority,updated_at").not("status","in",'("decided","archived")').order("updated_at",{ascending:false}).limit(200),
  supabase.from("case_automation_policy").select("case_id,enabled,auto_remind,auto_raise_priority,remind_before_hours,escalate_before_hours,updated_at"),
 ])
 if(error)throw new Error("No pudimos cargar el centro de control.")
 const cases=(casesData??[]) as CaseRow[];const policies=(policiesData??[]) as Policy[];const map=new Map(policies.map(p=>[p.case_id,p]));const automated=cases.filter(c=>map.get(c.id)?.enabled);const reminderCount=automated.filter(c=>map.get(c.id)?.auto_remind).length;const escalationCount=automated.filter(c=>map.get(c.id)?.auto_raise_priority).length
 return <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
  <section className="grid gap-7 border-b border-border pb-9 lg:grid-cols-[1.2fr_0.8fr] lg:items-end"><div><Badge variant="secondary">Phase 21 + 22 · Automation & Copilot</Badge><h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.035em] sm:text-5xl lg:text-6xl">Automatiza el seguimiento. Conserva el juicio humano.</h1><p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">Controla qué casos tienen escalamiento automático y entra al Decision Copilot para interpretar evidencia, riesgo y próximos pasos sin delegar la decisión final.</p></div><div className="grid grid-cols-2 gap-2 rounded-2xl border bg-secondary/20 p-3"><Metric value={automated.length} label="Casos automatizados"/><Metric value={reminderCount} label="Con recordatorios"/><Metric value={escalationCount} label="Con escalamiento"/><Metric value={cases.length} label="Casos activos"/></div></section>
  <section className="grid gap-5 py-9 lg:grid-cols-[0.8fr_1.2fr]"><Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5"/>Guardrails</CardTitle></CardHeader><CardContent className="space-y-3 text-sm leading-6 text-muted-foreground"><p>La automatización puede recordar y elevar prioridad dentro de ventanas configuradas.</p><p>El Copilot puede resumir, detectar brechas y sugerir intervenciones.</p><p className="font-medium text-foreground">Ninguno puede aprobar, cerrar un caso, reasignar revisores ni registrar una decisión sin acción humana.</p></CardContent></Card><Card><CardHeader><CardTitle>Casos activos</CardTitle></CardHeader><CardContent className="space-y-3">{cases.length===0?<div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No hay casos activos.</div>:cases.slice(0,30).map(c=>{const p=map.get(c.id);return <Link key={c.id} href={`/casos/${c.id}/control`} className="block rounded-xl border p-4 transition-colors hover:bg-secondary/30"><div className="flex items-center justify-between gap-3"><div><div className="flex flex-wrap gap-2">{p?.enabled?<Badge><Zap className="mr-1 h-3 w-3"/>Automation activa</Badge>:<Badge variant="outline">Manual</Badge>}<Badge variant="outline"><Bot className="mr-1 h-3 w-3"/>Copilot</Badge></div><p className="mt-3 text-sm font-medium">{c.title}</p><p className="mt-1 text-xs text-muted-foreground">Prioridad {c.priority} · estado {c.status}</p></div><ArrowRight className="h-4 w-4 text-muted-foreground"/></div></Link>})}</CardContent></Card></section>
 </div>
}
function Metric({value,label}:{value:number;label:string}){return <div className="rounded-xl bg-background/70 p-4"><div className="text-2xl font-semibold">{value}</div><div className="mt-1 text-xs leading-5 text-muted-foreground">{label}</div></div>}
