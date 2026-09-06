"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowRight, BriefcaseBusiness, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type SignalForCase = {
  key:string
  type:"brand"|"patent"|"technology"
  watchQuery:string
  source:string
  title:string
  detail:string|null
  relevance:"alta"|"media"|"baja"
  href:string
  occurredAt:string|null
  firstSeenAt:string
}

type CaseSummary = {
  id:string
  title:string
  status:string
  priority:string
}

export function ValidatedSignalActions({signal,onDone}:{signal:SignalForCase;onDone:()=>void}){
  const [cases,setCases]=useState<CaseSummary[]>([])
  const [selectedCaseId,setSelectedCaseId]=useState("")
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState<string|null>(null)
  const [result,setResult]=useState<{caseId:string;caseTitle:string}|null>(null)

  const availableCases=useMemo(()=>cases.filter(item=>item.status==="open"||item.status==="review"),[cases])

  useEffect(()=>{
    let cancelled=false
    void (async()=>{
      try{
        const response=await fetch("/api/cases",{cache:"no-store"})
        const payload=await response.json().catch(()=>({}))
        if(!response.ok)throw new Error(payload.error||"No pudimos cargar los casos.")
        if(cancelled)return
        const rows=Array.isArray(payload.cases)?payload.cases as CaseSummary[]:[]
        setCases(rows)
        const first=rows.find(item=>item.status==="open"||item.status==="review")
        if(first)setSelectedCaseId(first.id)
      }catch(cause){if(!cancelled)setError(cause instanceof Error?cause.message:"No pudimos cargar los casos.")}finally{if(!cancelled)setLoading(false)}
    })()
    return()=>{cancelled=true}
  },[])

  async function addEvidence(caseId:string,caseTitle:string){
    const response=await fetch("/api/cases/items",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({
        caseId,
        itemType:"alert",
        sourceId:signal.key,
        title:signal.title.slice(0,240),
        metadata:{
          origin:"validated_watch_signal",
          signalType:signal.type,
          watchQuery:signal.watchQuery,
          source:signal.source,
          relevance:signal.relevance,
          detail:signal.detail,
          href:signal.href,
          occurredAt:signal.occurredAt,
          firstSeenAt:signal.firstSeenAt,
          validatedAt:new Date().toISOString(),
        },
      }),
    })
    const payload=await response.json().catch(()=>({}))
    if(!response.ok)throw new Error(payload.error||"No pudimos agregar la evidencia al caso.")
    setResult({caseId,caseTitle})
  }

  async function addToExisting(){
    if(!selectedCaseId||saving)return
    const selected=availableCases.find(item=>item.id===selectedCaseId)
    if(!selected)return
    setSaving(true);setError(null)
    try{await addEvidence(selected.id,selected.title)}catch(cause){setError(cause instanceof Error?cause.message:"No pudimos agregar la evidencia al caso.")}finally{setSaving(false)}
  }

  async function createCase(){
    if(saving)return
    setSaving(true);setError(null)
    try{
      const response=await fetch("/api/cases",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({
          title:`${signal.type==="brand"?"Marca":signal.type==="patent"?"Patente":"Inteligencia"} · ${signal.watchQuery}`.slice(0,160),
          contextType:signal.type==="brand"?"brand":"technology",
          contextQuery:signal.watchQuery,
          priority:signal.relevance==="alta"?"high":"normal",
        }),
      })
      const payload=await response.json().catch(()=>({}))
      if(!response.ok||!payload.case?.id)throw new Error(payload.error||"No pudimos crear el caso.")
      await addEvidence(String(payload.case.id),String(payload.case.title||signal.watchQuery))
    }catch(cause){setError(cause instanceof Error?cause.message:"No pudimos crear el caso.")}finally{setSaving(false)}
  }

  if(result)return <div className="mt-4 rounded-[10px] border border-[#355C55] bg-[#102C2C] p-4">
    <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-[#96B5A6]">Siguiente paso listo</p>
    <p className="mt-1.5 text-sm text-white">La evidencia quedó agregada a {result.caseTitle}.</p>
    <div className="mt-3 flex flex-wrap gap-2"><Button asChild size="sm"><Link href={`/casos/${result.caseId}`}>Abrir caso <ArrowRight className="h-3.5 w-3.5"/></Link></Button><Button size="sm" variant="ghost" onClick={onDone}>Volver a la cola</Button></div>
  </div>

  return <div className="mt-4 rounded-[10px] border border-[#355C55] bg-[#102C2C] p-4">
    <div className="flex items-start gap-3"><BriefcaseBusiness className="mt-0.5 h-4 w-4 text-[#96B5A6]"/><div><p className="text-sm font-medium text-white">¿Qué hacemos con esta evidencia validada?</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Puedes llevarla a un caso para trabajarla o dejarla sólo como evidencia confirmada del seguimiento.</p></div></div>
    {error?<p role="alert" className="mt-3 text-xs text-[#E0B987]">{error}</p>:null}
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Button size="sm" onClick={()=>void createCase()} disabled={saving}>{saving?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<BriefcaseBusiness className="h-3.5 w-3.5"/>}Crear caso</Button>
      {loading?<span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin"/>Cargando casos…</span>:availableCases.length?<><select aria-label="Caso existente" value={selectedCaseId} onChange={event=>setSelectedCaseId(event.target.value)} className="h-8 max-w-[280px] rounded-[8px] border border-input bg-background px-2 text-xs text-white outline-none focus-visible:ring-2 focus-visible:ring-ring/50">{availableCases.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select><Button size="sm" variant="secondary" onClick={()=>void addToExisting()} disabled={saving||!selectedCaseId}>Agregar a caso</Button></>:<span className="text-xs text-muted-foreground">No hay casos abiertos.</span>}
      <Button size="sm" variant="ghost" onClick={onDone} disabled={saving}>Sólo evidencia</Button>
    </div>
  </div>
}
