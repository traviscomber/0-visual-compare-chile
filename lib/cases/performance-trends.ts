import type { PortfolioEvent, PortfolioReview } from "@/lib/cases/portfolio-analytics"

const HOUR=3_600_000
const DAY=24*HOUR
const ms=(value:string)=>Date.parse(value)
const avg=(values:number[])=>values.length?values.reduce((sum,value)=>sum+value,0)/values.length:null
const median=(values:number[])=>{if(!values.length)return null;const sorted=[...values].sort((a,b)=>a-b);const mid=Math.floor(sorted.length/2);return sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2}
const diffHours=(from:string,to:string)=>Math.max(0,(ms(to)-ms(from))/HOUR)
const delta=(current:number|null,previous:number|null)=>current===null||previous===null||previous===0?null:(current-previous)/previous

export type ReviewerIdentity={user_id:string;display_name:string;email:string}
export type TrendWindow=30|60|90

function responseStats(reviews:PortfolioReview[],start:number,end:number){
  const rows=reviews.filter(r=>r.responded_at&&r.status!=="cancelled"&&ms(r.responded_at)>=start&&ms(r.responded_at)<end)
  const durations=rows.map(r=>diffHours(r.created_at,r.responded_at!))
  const withDeadline=rows.filter(r=>r.deadline_at)
  const onTime=withDeadline.filter(r=>ms(r.responded_at!)<=ms(r.deadline_at!)).length
  return {count:rows.length,medianHours:median(durations),avgHours:avg(durations),slaRate:withDeadline.length?onTime/withDeadline.length:null,slaSample:withDeadline.length}
}

function decisionStats(events:PortfolioEvent[],start:number,end:number){
  const created=new Map<string,string>()
  for(const event of events)if(event.event_type==="case_created"&&!created.has(event.case_id))created.set(event.case_id,event.occurred_at)
  const decisions=events.filter(e=>e.event_type==="status_changed"&&e.payload?.to==="decided"&&ms(e.occurred_at)>=start&&ms(e.occurred_at)<end)
  const durations=decisions.flatMap(event=>{const createdAt=created.get(event.case_id);return createdAt?[diffHours(createdAt,event.occurred_at)]:[]})
  return {count:decisions.length,medianHours:median(durations),avgHours:avg(durations),sample:durations.length}
}

export function buildPerformanceTrends(input:{reviews:PortfolioReview[];events:PortfolioEvent[];reviewers:ReviewerIdentity[];window?:TrendWindow;now?:Date}){
  const now=input.now??new Date()
  const windowDays=input.window??30
  const end=now.getTime()
  const start=end-windowDays*DAY
  const previousStart=start-windowDays*DAY
  const currentResponses=responseStats(input.reviews,start,end)
  const previousResponses=responseStats(input.reviews,previousStart,start)
  const currentDecisions=decisionStats(input.events,start,end)
  const previousDecisions=decisionStats(input.events,previousStart,start)
  const identities=new Map(input.reviewers.map(r=>[r.user_id,r]))

  const reviewerRows=[...new Set(input.reviews.map(r=>r.reviewer_id))].map(userId=>{
    const current=input.reviews.filter(r=>r.reviewer_id===userId&&r.responded_at&&r.status!=="cancelled"&&ms(r.responded_at)>=start&&ms(r.responded_at)<end)
    const durations=current.map(r=>diffHours(r.created_at,r.responded_at!))
    const withDeadline=current.filter(r=>r.deadline_at)
    const onTime=withDeadline.filter(r=>ms(r.responded_at!)<=ms(r.deadline_at!)).length
    const pending=input.reviews.filter(r=>r.reviewer_id===userId&&r.status==="pending")
    const overdue=pending.filter(r=>r.deadline_at&&ms(r.deadline_at)<end).length
    const identity=identities.get(userId)
    return {userId,name:identity?.display_name||identity?.email||"Participante",email:identity?.email||"",responses:current.length,medianResponseHours:median(durations),slaRate:withDeadline.length?onTime/withDeadline.length:null,slaSample:withDeadline.length,pending:pending.length,overdue}
  }).filter(row=>row.responses||row.pending).sort((a,b)=>b.overdue-a.overdue||b.pending-a.pending||(b.medianResponseHours??0)-(a.medianResponseHours??0))

  const insights:string[]=[]
  const responseDelta=delta(currentResponses.medianHours,previousResponses.medianHours)
  if(responseDelta!==null&&Math.abs(responseDelta)>=0.15)insights.push(responseDelta>0?`El tiempo mediano de respuesta aumentó ${Math.round(responseDelta*100)}% frente al período anterior.`:`El tiempo mediano de respuesta mejoró ${Math.abs(Math.round(responseDelta*100))}% frente al período anterior.`)
  const slaDelta=delta(currentResponses.slaRate,previousResponses.slaRate)
  if(slaDelta!==null&&Math.abs(slaDelta)>=0.1)insights.push(slaDelta<0?`El cumplimiento de SLA cayó ${Math.abs(Math.round(slaDelta*100))}% frente al período anterior.`:`El cumplimiento de SLA mejoró ${Math.round(slaDelta*100)}% frente al período anterior.`)
  const cycleDelta=delta(currentDecisions.medianHours,previousDecisions.medianHours)
  if(cycleDelta!==null&&Math.abs(cycleDelta)>=0.15)insights.push(cycleDelta>0?`El cycle time mediano aumentó ${Math.round(cycleDelta*100)}% frente al período anterior.`:`El cycle time mediano bajó ${Math.abs(Math.round(cycleDelta*100))}% frente al período anterior.`)
  if(!insights.length)insights.push("Todavía no hay una variación material y medible frente al período anterior.")

  return {windowDays,current:{responses:currentResponses,decisions:currentDecisions},previous:{responses:previousResponses,decisions:previousDecisions},deltas:{response:responseDelta,sla:slaDelta,cycle:cycleDelta,throughput:delta(currentDecisions.count,previousDecisions.count)},reviewers:reviewerRows,insights}
}

export function formatDelta(value:number|null,{inverse=false}:{inverse?:boolean}={}){
  if(value===null)return "Sin comparación"
  const pct=Math.round(value*100)
  const improved=inverse?pct<0:pct>0
  return `${pct>0?"+":""}${pct}%${improved?" · mejor":""}`
}
