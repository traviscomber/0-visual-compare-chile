"use client"

import Link from "next/link"
import { useState } from "react"
import { BellRing, CalendarPlus2, Loader2, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

type Action = "remind_reviewers" | "extend_deadline" | "raise_priority"

export function InterventionActions({ caseId, priority, hasActiveRound }: { caseId:string; priority:"low"|"normal"|"high"; hasActiveRound:boolean }) {
  const [busy,setBusy]=useState<Action|null>(null)
  const [message,setMessage]=useState<string|null>(null)

  const run=async(action:Action)=>{
    if(action==="extend_deadline"&&!window.confirm("¿Extender el plazo de la ronda actual en 2 días?"))return
    if(action==="raise_priority"&&!window.confirm("¿Elevar este caso a prioridad alta?"))return
    setBusy(action);setMessage(null)
    try{
      const r=await fetch("/api/cases/interventions",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({caseId,action,days:2})})
      const p=await r.json().catch(()=>({}))
      if(!r.ok)throw new Error(p.error||"No pudimos ejecutar la intervención.")
      setMessage(action==="remind_reviewers"?(Number(p.notified)>0?`Recordatorio enviado a ${p.notified} revisor${Number(p.notified)===1?"":"es"}.`:"No se enviaron recordatorios nuevos; existe uno reciente."):action==="extend_deadline"?"Plazo extendido en 2 días.":"Prioridad elevada a alta.")
      window.setTimeout(()=>window.location.reload(),700)
    }catch(error){setMessage(error instanceof Error?error.message:"No pudimos ejecutar la intervención.")}
    finally{setBusy(null)}
  }

  return <div className="mt-4 border-t border-border pt-4">
    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Acciones humanas</p>
    <div className="mt-3 flex flex-wrap gap-2">
      {hasActiveRound&&<Button size="sm" variant="outline" disabled={busy!==null} onClick={()=>void run("remind_reviewers")}><ActionIcon busy={busy==="remind_reviewers"} icon={BellRing}/>Recordar revisores</Button>}
      {hasActiveRound&&<Button size="sm" variant="outline" disabled={busy!==null} onClick={()=>void run("extend_deadline")}><ActionIcon busy={busy==="extend_deadline"} icon={CalendarPlus2}/>Extender +2 días</Button>}
      {priority!=="high"&&<Button size="sm" variant="outline" disabled={busy!==null} onClick={()=>void run("raise_priority")}><ActionIcon busy={busy==="raise_priority"} icon={ShieldAlert}/>Elevar prioridad</Button>}
      <Button asChild size="sm" variant="ghost"><Link href={`/casos/${caseId}/revision`}>Abrir revisión</Link></Button>
    </div>
    {message&&<p className="mt-3 text-xs leading-5 text-muted-foreground">{message}</p>}
  </div>
}

function ActionIcon({busy,icon:Icon}:{busy:boolean;icon:typeof BellRing}){return busy?<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin motion-reduce:animate-none"/>:<Icon className="mr-1.5 h-3.5 w-3.5"/>}
